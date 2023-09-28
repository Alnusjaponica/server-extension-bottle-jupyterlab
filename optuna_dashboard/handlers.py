from __future__ import annotations

import io
import json
import shutil
from typing import TYPE_CHECKING

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from optuna.artifacts import FileSystemArtifactStore
from optuna.storages import InMemoryStorage
import tornado
from tornado.web import FallbackHandler
from tornado.wsgi import WSGIContainer

from ._app import wsgi


if TYPE_CHECKING:
    from _typeshed.wsgi import WSGIApplication


API_NAMESPACE = "jupyterlab-examples-server"

_dashboard_app: WSGIApplication | None = None  # wsgi(storage=InMemoryStorage())
_is_initialized = False


class RouteHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        global _dashboard_app

        input_data = self.get_json_body()
        storage_url = input_data.get("storage_url")
        artifact_path = input_data.get("artifact_path")

        storage = storage_url or InMemoryStorage()  # or "sqlite:///db.sqlite3"
        artifact_store = FileSystemArtifactStore(artifact_path)  # or "./artifacts")

        _dashboard_app = wsgi(storage=storage, artifact_store=artifact_store)


class InitializedStateHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({"is_initialized": _is_initialized}))

    @tornado.web.authenticated
    def post(self):
        global _is_initialized
        _is_initialized = self.get_json_body().get("is_initialized") is True


def dashboard_app(env, start_response):
    # Set Content-Type
    if "/api/" in env["PATH_INFO"]:
        env["CONTENT_TYPE"] = "application/json"
    env["PATH_INFO"] = env["PATH_INFO"].replace(f"/{API_NAMESPACE}", "")

    if _dashboard_app is None:
        start_response("400 Bad Request", [{"Content-Type": "application/json"}])
        return [b'{"reason": "something error message..."}']

    print("---------------- DEBUG WSGI Environment ------------")
    print(env)

    buf = io.BytesIO()
    shutil.copyfileobj(env["wsgi.input"], buf)
    buf.seek(0)
    print("---------------- DEBUG Request Body ----------------")
    print(buf.read().decode("utf-8"))

    buf.seek(0)
    env["wsgi.input"] = buf

    return _dashboard_app(env, start_response)


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    # Prepend the base_url so that it works in a JupyterHub setting
    initialize_route_pattern = url_path_join(base_url, API_NAMESPACE, "api/is_initialized")
    handlers = [(initialize_route_pattern, InitializedStateHandler)]
    web_app.add_handlers(host_pattern, handlers)

    resister_route_pattern = url_path_join(base_url, API_NAMESPACE, "api/register_dashboard_app")
    handlers = [(resister_route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)

    route_pattern = url_path_join(base_url, API_NAMESPACE, r"(.*)")
    handlers = [
        (route_pattern, FallbackHandler, dict(fallback=WSGIContainer(dashboard_app))),
    ]
    web_app.add_handlers(host_pattern, handlers)