import os

import optuna
from bottle import Bottle
from jupyter_server.utils import url_path_join
from tornado.web import FallbackHandler, StaticFileHandler
from tornado.wsgi import WSGIContainer

from ._app import wsgi

app = Bottle()


@app.get("/jupyterlab-examples-server/hello")
def hello():
    return {"data": "Hello World from Bottle!"}


@app.post("/jupyterlab-examples-server/hello")
def hello():
    return {"data": "Hello World again from Bottle!"}


storage = optuna.storages.InMemoryStorage()
dashboard_app = wsgi(storage)


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    # Prepend the base_url so that it works in a JupyterHub setting
    route_pattern = url_path_join(base_url, "jupyterlab-examples-server", "hello")

    handlers = [
        (route_pattern, FallbackHandler, dict(fallback=WSGIContainer(dashboard_app)))
    ]
    web_app.add_handlers(host_pattern, handlers)

    # Prepend the base_url so that it works in a JupyterHub setting
    doc_url = url_path_join(base_url, "jupyterlab-examples-server", "public")
    doc_dir = os.getenv(
        "JLAB_SERVER_EXAMPLE_STATIC_DIR",
        os.path.join(os.path.dirname(__file__), "public"),
    )
    handlers = [("{}/(.*)".format(doc_url), StaticFileHandler, {"path": doc_dir})]
    web_app.add_handlers(host_pattern, handlers)
