"""Temporary Owner-run diagnostic. Emits only a fixed, non-secret category.

Run `python atlas_diagnostic.py` inside Render. Never pass a URI as an argument.
The subprocess boundary enforces a deadline and discards all worker stderr.
No writes, configuration changes, environment dumps or exception logging.
"""
import json
import logging
import os
import socket
import ssl
import subprocess
import sys
from pathlib import Path

import dns.exception
from pymongo import MongoClient
from pymongo.errors import (ConfigurationError, InvalidURI, OperationFailure,
                            ServerSelectionTimeoutError, NetworkTimeout)

CATEGORIES = frozenset({'ready', 'configuration rejected', 'URI format rejected',
                       'DNS failure', 'timeout', 'authentication failure',
                       'TLS failure', 'authorization failure', 'unknown database error'})


def category(error):
    # Examine locally, never return any exception text or dynamically built label.
    if isinstance(error, OperationFailure):
        if error.code == 18: return 'authentication failure'
        if error.code == 13: return 'authorization failure'
    if isinstance(error, (ssl.SSLError, ssl.CertificateError)): return 'TLS failure'
    if isinstance(error, (socket.gaierror, dns.exception.DNSException)): return 'DNS failure'
    if isinstance(error, InvalidURI): return 'URI format rejected'
    # PyMongo may wrap TLS/DNS errors in a selection error without retaining type.
    message = str(error).lower()
    if any(x in message for x in ('certificate verify failed', 'ssl handshake failed',
                                  'tlsv1 alert', '[ssl:')):
        return 'TLS failure'
    if any(x in message for x in ('the dns query name does not exist',
                                  'name or service not known', 'getaddrinfo failed',
                                  'temporary failure in name resolution')):
        return 'DNS failure'
    if isinstance(error, (TimeoutError, ServerSelectionTimeoutError, NetworkTimeout)):
        return 'timeout'
    if isinstance(error, ConfigurationError): return 'URI format rejected'
    return 'unknown database error'


def diagnose(env, client_factory=MongoClient):
    from staging_cloud_app import validate_environment
    try:
        uri = validate_environment(env)
    except Exception:
        return 'configuration rejected'
    client = None
    try:
        client = client_factory(uri, tls=True, serverSelectionTimeoutMS=5000,
                                connectTimeoutMS=3000, socketTimeoutMS=3000,
                                maxPoolSize=1)
        client['digital_m8_rc_staging'].command('ping')
        return 'ready'
    except Exception as error:
        return category(error)
    finally:
        if client is not None:
            try: client.close()
            except Exception: pass


def run_bounded(runner=subprocess.run):
    try:
        result = runner([sys.executable, str(Path(__file__).resolve()), '--worker'],
                        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                        text=True, timeout=12, check=False)
        value = result.stdout.strip()
        return value if result.returncode == 0 and value in CATEGORIES else 'unknown database error'
    except subprocess.TimeoutExpired:
        return 'timeout'
    except Exception:
        return 'unknown database error'


if __name__ == '__main__':
    logging.disable(logging.CRITICAL)
    if sys.argv[1:] == ['--worker']:
        try: result = diagnose(os.environ)
        except Exception: result = 'unknown database error'
        print(result if result in CATEGORIES else 'unknown database error')
    else:
        result = run_bounded()
        print(json.dumps({'database_ready': result == 'ready', 'category': result}))
