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
from pymongo.errors import (ConnectionFailure, ConfigurationError, InvalidURI, OperationFailure,
                            ServerSelectionTimeoutError, NetworkTimeout)

CATEGORIES = frozenset({'ready', 'configuration rejected', 'URI format rejected',
                       'DNS failure', 'timeout', 'authentication failure',
                       'TLS failure', 'authorization failure', 'unknown database error',
                       'server-selection timeout', 'network failure (IP allowlist possible)',
                       'diagnostic worker failure', 'diagnostic deadline exceeded'})

SAFE_CLASSES = frozenset({'OperationFailure', 'ConfigurationError', 'InvalidURI',
    'ServerSelectionTimeoutError', 'NetworkTimeout', 'ConnectionFailure', 'AutoReconnect',
    'SSLError', 'SSLCertVerificationError', 'gaierror', 'NXDOMAIN', 'NoAnswer',
    'NoNameservers', 'LifetimeTimeout', 'Timeout', 'TimeoutError', 'ConnectionRefusedError',
    'ConnectionResetError', 'OSError', 'RuntimeError', 'TypeError', 'ValueError',
    'ImportError', 'ModuleNotFoundError', 'AttributeError', 'TimeoutExpired', 'Other'})


def failure(error):
    name = type(error).__name__
    return {'category': category(error),
            'exception_class': name if name in SAFE_CLASSES else 'Other'}


def category(error, seen=None):
    seen = set() if seen is None else seen
    if id(error) in seen or len(seen) >= 12: return 'unknown database error'
    seen.add(id(error))
    # Examine locally, never return any exception text or dynamically built label.
    if isinstance(error, OperationFailure):
        if error.code == 18: return 'authentication failure'
        if error.code == 13: return 'authorization failure'
    if isinstance(error, (ssl.SSLError, ssl.CertificateError)): return 'TLS failure'
    if isinstance(error, (socket.gaierror, dns.exception.DNSException)): return 'DNS failure'
    if isinstance(error, InvalidURI): return 'URI format rejected'
    # Follow wrapped causes and driver per-server errors without emitting map keys.
    nested = [error.__cause__, error.__context__]
    errors = getattr(error, 'errors', None)
    if isinstance(errors, dict): nested.extend(errors.values())
    for cause in nested:
        if isinstance(cause, BaseException):
            result = category(cause, seen)
            if result in {'authentication failure', 'authorization failure', 'TLS failure',
                          'DNS failure', 'URI format rejected'}: return result
    # PyMongo may wrap TLS/DNS errors in a selection error without retaining type.
    message = str(error).lower()
    if any(x in message for x in ('authentication failed', 'authenticationfailed', 'bad auth')):
        return 'authentication failure'
    if 'not authorized' in message or 'unauthorized' in message:
        return 'authorization failure'
    if any(x in message for x in ('certificate verify failed', 'ssl handshake failed',
                                  'tlsv1 alert', '[ssl:')):
        return 'TLS failure'
    if any(x in message for x in ('the dns query name does not exist',
                                  'name or service not known', 'getaddrinfo failed',
                                  'temporary failure in name resolution', 'dns operation timed out',
                                  'resolution lifetime expired', 'nxdomain', 'no nameservers',
                                  'dns response does not contain an answer')):
        return 'DNS failure'
    if any(x in message for x in ('connection refused', 'network is unreachable',
                                  'no route to host', 'connection reset', 'ip whitelist',
                                  'ip allowlist')):
        return 'network failure (IP allowlist possible)'
    if isinstance(error, ServerSelectionTimeoutError): return 'server-selection timeout'
    if isinstance(error, (ConnectionFailure, OSError)):
        return 'network failure (IP allowlist possible)'
    if isinstance(error, ConfigurationError): return 'URI format rejected'
    return 'unknown database error'


def diagnose(env, client_factory=MongoClient, details=False):
    def finish(result, error=None):
        return {'category': result, 'exception_class': failure(error)['exception_class'] if error else None} if details else result
    try:
        from staging_cloud_app import validate_environment
    except Exception as error:
        return finish('diagnostic worker failure', error)
    try:
        uri = validate_environment(env)
    except Exception as error:
        return finish('configuration rejected', error)
    client = None
    try:
        client = client_factory(uri, tls=True, serverSelectionTimeoutMS=5000,
                                connectTimeoutMS=3000, socketTimeoutMS=3000,
                                maxPoolSize=1)
        client['digital_m8_rc_staging'].command('ping')
        return finish('ready')
    except Exception as error:
        return finish(category(error), error)
    finally:
        if client is not None:
            try: client.close()
            except Exception: pass


def run_bounded(runner=subprocess.run):
    try:
        result = runner([sys.executable, str(Path(__file__).resolve()), '--worker'],
                        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                        text=True, timeout=12, check=False)
        value = json.loads(result.stdout)
        if (result.returncode == 0 and isinstance(value, dict)
                and set(value) == {'category', 'exception_class'}
                and isinstance(value['category'], str) and value['category'] in CATEGORIES
                and (value['exception_class'] is None or
                     isinstance(value['exception_class'], str) and value['exception_class'] in SAFE_CLASSES)):
            return value
        return {'category': 'diagnostic worker failure', 'exception_class': None}
    except subprocess.TimeoutExpired:
        return {'category': 'diagnostic deadline exceeded', 'exception_class': 'TimeoutExpired'}
    except Exception:
        return {'category': 'diagnostic worker failure', 'exception_class': None}


if __name__ == '__main__':
    logging.disable(logging.CRITICAL)
    if sys.argv[1:] == ['--worker']:
        try: result = diagnose(os.environ, details=True)
        except Exception as error: result = failure(error)
        print(json.dumps(result))
    else:
        result = run_bounded()
        print(json.dumps(result))
