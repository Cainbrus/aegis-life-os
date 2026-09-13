"""Cloud-only staging ASGI factory. Never loads .env or the legacy server."""
import os
import logging
from contextlib import asynccontextmanager
from urllib.parse import urlsplit, parse_qsl

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from cloud_security import build_router


def validate_environment(env):
    # Fixed database identity is deliberate: this entrypoint cannot select prod.
    if env.get('M8_ENVIRONMENT') != 'staging' or env.get('DB_NAME') != 'digital_m8_rc_staging':
        raise RuntimeError('Explicit RC staging environment and database required')
    uri = env.get('MONGO_URL', '')
    try:
        parsed = urlsplit(uri)
        options = parse_qsl(parsed.query, keep_blank_values=True)
        valid = (parsed.scheme == 'mongodb+srv' and parsed.hostname
                 and parsed.hostname.endswith('.mongodb.net')
                 and parsed.username and parsed.password and not parsed.fragment
                 and parsed.port is None
                 and parsed.path in ('', '/', '/digital_m8_rc_staging')
                 and all(k.lower() in {'retrywrites', 'w', 'appname', 'authsource', 'tls'} for k, v in options)
                 and all(k.lower() != 'tls' or v.lower() == 'true' for k, v in options)
                 and all(k.lower() != 'authsource' or v == 'admin' for k, v in options))
    except Exception:
        valid = False
    if not valid:
        raise RuntimeError('Authenticated Atlas TLS connection configuration required')
    return uri


class SafeBoundary:
    """Do not let server exception logs expose driver URIs or validation inputs."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            return await self.app(scope, receive, send)
        started = False
        async def tracked(message):
            nonlocal started
            if message['type'] == 'http.response.start':
                started = True
                message['headers'] += [(b'cache-control', b'no-store')]
            await send(message)
        try:
            await self.app(scope, receive, tracked)
        except Exception:
            if not started:
                await JSONResponse({'detail': 'Staging service unavailable'}, status_code=503)(scope, receive, tracked)


def create_app(env=None, database=None):
    uri = validate_environment(os.environ if env is None else env)
    # Driver debug diagnostics can contain command data. Disable them regardless
    # of server logging configuration; no application payload logger is installed.
    for name in ('pymongo', 'motor'):
        logger = logging.getLogger(name)
        logger.handlers = [logging.NullHandler()]
        logger.propagate = False
    client = None
    if database is None:
        try:
            client = AsyncIOMotorClient(uri, tls=True, serverSelectionTimeoutMS=5000,
                                       connectTimeoutMS=5000, maxPoolSize=10)
            database = client['digital_m8_rc_staging']
        except Exception:
            raise RuntimeError('Atlas client configuration rejected') from None

    @asynccontextmanager
    async def lifespan(app):
        try:
            yield
        finally:
            if client is not None:
                client.close()

    app = FastAPI(title='Digital M8 RC Staging Security', docs_url=None,
                  redoc_url=None, openapi_url=None, lifespan=lifespan)
    app.include_router(build_router(database))

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc):
        return JSONResponse({'detail': 'Invalid request'}, status_code=422)

    @app.get('/health')
    async def health():
        try:
            await database.command('ping')
        except Exception:
            return JSONResponse({'staging': True, 'database_ready': False}, status_code=503)
        return {'staging': True, 'database_ready': True, 'workforce_enabled': False}

    app.add_middleware(SafeBoundary)
    app.add_middleware(CORSMiddleware, allow_origins=['https://localhost'],
                       allow_methods=['GET', 'POST'],
                       allow_headers=['Content-Type', 'X-DM-Token', 'X-DM-Revocation'])
    return app
