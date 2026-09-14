import io
import ssl
import socket
import subprocess
import unittest
from contextlib import redirect_stdout, redirect_stderr
from types import SimpleNamespace
from unittest.mock import MagicMock
from pymongo.errors import OperationFailure, ServerSelectionTimeoutError, InvalidURI
from pymongo.uri_parser import parse_uri
from unittest.mock import patch
from atlas_diagnostic import diagnose, category, run_bounded
from test_cloud_staging import ENV


class AtlasDiagnosticTests(unittest.TestCase):
    def test_categories_never_echo_exception_details(self):
        secret = 'synthetic-user:synthetic-password@private-host/token'
        cases = [(OperationFailure(secret, 18), 'authentication failure'),
                 (OperationFailure(secret, 13), 'authorization failure'),
                 (ssl.SSLError(secret), 'TLS failure'),
                 (socket.gaierror(secret), 'DNS failure'),
                 (ServerSelectionTimeoutError(secret), 'timeout'),
                 (ServerSelectionTimeoutError('SSL handshake failed: '+secret), 'TLS failure'),
                 (InvalidURI(secret), 'URI format rejected'),
                 (RuntimeError(secret), 'unknown database error')]
        for error, expected in cases:
            self.assertEqual(expected, category(error))

    def test_ping_only_correct_database_tls_and_close(self):
        factory = MagicMock()
        self.assertEqual('ready', diagnose(ENV, factory))
        factory.return_value.__getitem__.assert_called_once_with('digital_m8_rc_staging')
        factory.return_value.__getitem__.return_value.command.assert_called_once_with('ping')
        self.assertTrue(factory.call_args.kwargs['tls'])
        factory.return_value.close.assert_called_once()

    def test_errors_are_redacted_and_client_closed(self):
        factory = MagicMock()
        factory.return_value.__getitem__.return_value.command.side_effect = OperationFailure('synthetic secret', 18)
        output = io.StringIO()
        with redirect_stdout(output), redirect_stderr(output):
            self.assertEqual('authentication failure', diagnose(ENV, factory))
        self.assertEqual('', output.getvalue())
        factory.return_value.close.assert_called_once()
        self.assertEqual('configuration rejected', diagnose({}, factory))

    def test_parent_discards_unexpected_output_and_bounds_runtime(self):
        def bad(*args, **kwargs):
            self.assertIs(kwargs['stderr'], subprocess.DEVNULL)
            self.assertEqual(12, kwargs['timeout'])
            return SimpleNamespace(returncode=0, stdout='synthetic secret')
        self.assertEqual('unknown database error', run_bounded(bad))
        def slow(*args, **kwargs): raise subprocess.TimeoutExpired('worker', 12)
        self.assertEqual('timeout', run_bounded(slow))

    def test_pinned_driver_parses_paths_and_encoded_password_without_dns(self):
        # Mock SRV/TXT only; use the installed PyMongo URI parser, no network.
        with patch('pymongo.uri_parser._SrvResolver') as resolver:
            resolver.return_value.get_hosts.return_value = [('node.example.mongodb.net', 27017)]
            resolver.return_value.get_options.return_value = 'authSource=admin'
            for path in ('', '/', '/digital_m8_rc_staging'):
                parsed = parse_uri('mongodb+srv://synthetic:p%40ss%3Aword@example.mongodb.net'+path)
                self.assertEqual('p@ss:word', parsed['password'])
                self.assertEqual('admin', parsed['options']['authsource'])
            parsed = parse_uri('mongodb+srv://synthetic:p%2540ss@example.mongodb.net/?authSource=admin')
            self.assertEqual('p%40ss', parsed['password'])  # double encoding is not repaired


if __name__ == '__main__': unittest.main()
