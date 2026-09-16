"""Provider-neutral configuration and offline OpenAI Responses contract.

Configuration may be read by the staging safety boundary. No network, credential access or dispatch
approval flag exists here. The authenticated, budget-enforcing server broker must
be reviewed before transport is wired; the Android provider registry stays empty.
"""
from dataclasses import dataclass
import json
import re

class ProviderUnavailable(RuntimeError):
    pass

@dataclass(frozen=True)
class ProviderConfig:
    provider: str
    primary_model: str
    fallback_model: str
    credential_environment_name: str
    def __post_init__(self):
        if not all(isinstance(v,str) and re.fullmatch(r"[A-Za-z0-9_.-]{1,64}",v)
                   for v in (self.provider,self.primary_model,self.fallback_model)):
            raise ValueError("Invalid provider configuration")
        if not re.fullmatch(r"[A-Z][A-Z0-9_]{1,63}",self.credential_environment_name):
            raise ValueError("An environment variable name is required")
    def model_for(self,tier):
        if tier=='primary': return self.primary_model
        if tier=='economy': return self.fallback_model
        raise ValueError("Unknown routing tier")

def owner_provider_config():
    # Non-secret Owner selection; never read the environment or embed a key.
    return ProviderConfig('openai','gpt-5.6-terra','gpt-5.6-luna','OPENAI_API_KEY')

class OpenAIAdapter:
    """Request/response codec only, deliberately unavailable for live inference.

    Future broker must bind Owner/device/session, check native consent, reserve
    durable account-wide budgets and independently validate this same schema.
    A failed attempt must not auto-retry/fall back without another reservation.
    """
    reviewed_models=frozenset({'gpt-5.6-terra','gpt-5.6-luna'})
    def __init__(self,config):
        if config.provider!='openai' or not {config.primary_model,config.fallback_model} <= self.reviewed_models:
            raise ValueError('Unreviewed OpenAI configuration')
        self.config=config
    def prepare(self,context,*,tier='primary'):
        if (type(context) is not dict or set(context)!={'layout','large_text'}
            or type(context['layout']) is not str or context['layout'] not in {'grid','list'}
            or type(context['large_text']) is not bool):
            raise ProviderUnavailable('Cloud context denied')
        request=json.dumps({'layout':context['layout'],'large_text':context['large_text']},separators=(',',':'))
        instructions='Suggest one layout tip.'
        # Bounded payload only: broker must verify actual billed token usage and price.
        if len((instructions+request).encode('ascii'))>96:
            raise ProviderUnavailable('Cloud context denied')
        return {'model':self.config.model_for(tier),'input':request,'instructions':instructions,
                'store':False,'background':False,'stream':False,'tools':[],'tool_choice':'none',
                'parallel_tool_calls':False,'reasoning':{'effort':'none'},'max_output_tokens':256}
    def parse(self,response):
        try:
            if type(response) is not dict or response.get('status')!='completed': raise ValueError()
            output=response['output']
            if type(output) is not list or len(output)!=1: raise ValueError()
            message=output[0]
            if message.get('type')!='message' or message.get('role')!='assistant': raise ValueError()
            parts=message['content']
            if type(parts) is not list or not 1<=len(parts)<=4: raise ValueError()
            if any(p.get('type')!='output_text' or type(p.get('text')) is not str for p in parts): raise ValueError()
            text=''.join(p['text'] for p in parts)
            if not text.strip() or len(text)>2048: raise ValueError()
            return text # Inert text only. Never evaluate model output or tools.
        except Exception:
            raise ProviderUnavailable('Cloud provider unavailable') from None
    def suggest(self,context,**options):
        raise ProviderUnavailable('Reviewed authenticated cloud broker is not connected')
