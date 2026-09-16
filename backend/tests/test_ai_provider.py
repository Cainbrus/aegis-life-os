import unittest
from ai_provider import ProviderConfig, OpenAIAdapter, ProviderUnavailable, owner_provider_config

class ProviderTests(unittest.TestCase):
    def setUp(self):
        self.context={'layout':'grid','large_text':True}
        self.adapter=OpenAIAdapter(owner_provider_config())
    def test_default_disabled(self):
        with self.assertRaises(ProviderUnavailable): self.adapter.suggest(self.context)
    def test_approved_primary_and_economy_payload_has_no_history_tools_or_storage(self):
        for tier,model in [('primary','gpt-5.6-terra'),('economy','gpt-5.6-luna')]:
            payload=self.adapter.prepare(self.context,tier=tier)
            self.assertEqual(model,payload['model']);self.assertFalse(payload['store'])
            self.assertEqual([],payload['tools']);self.assertEqual('none',payload['tool_choice'])
            self.assertEqual(256,payload['max_output_tokens']);self.assertNotIn('previous_response_id',payload)
            self.assertNotIn('metadata',payload);self.assertNotIn('conversation',payload)
    def test_secret_and_raw_content_never_reach_transport(self):
        for key in ['pin','notes','token','recovery','dataset','model']:
            with self.assertRaises(ProviderUnavailable):self.adapter.prepare({**self.context,key:'private'})
        with self.assertRaises(ProviderUnavailable):self.adapter.prepare({'layout':'private text','large_text':True})
    def test_provider_error_response_is_redacted(self):
        with self.assertRaisesRegex(ProviderUnavailable,'Cloud provider unavailable') as error:
            self.adapter.parse({'error':{'message':'secret key'}})
        self.assertNotIn('secret',str(error.exception))
    def test_plain_text_response_parses_but_never_executes(self):
        response={'status':'completed','output':[{'type':'message','role':'assistant','content':[{'type':'output_text','text':'Use a list.'}]}]}
        self.assertEqual('Use a list.',self.adapter.parse(response))
    def test_tool_outputs_incomplete_and_oversized_results_are_rejected(self):
        results=[{'status':'incomplete','output':[]},{'status':'completed','output':[{'type':'function_call'}]}, {'status':'completed','output':[{'type':'message','role':'assistant','content':[{'type':'output_text','text':'x'*2049}]}]}]
        for result in results:
            with self.assertRaises(ProviderUnavailable):self.adapter.parse(result)
    def test_config_is_provider_neutral_and_never_contains_a_secret_value(self):
        config=owner_provider_config()
        self.assertEqual('openai',config.provider)
        self.assertEqual('OPENAI_API_KEY',config.credential_environment_name)
        self.assertEqual('gpt-5.6-luna',config.model_for('economy'))
        with self.assertRaises(ValueError):config.model_for('arbitrary')
        other=ProviderConfig('another_provider','primary-model','small-model','OTHER_PROVIDER_API_KEY')
        self.assertEqual('primary-model',other.model_for('primary'))

if __name__=='__main__':unittest.main()
