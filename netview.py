#!/usr/bin/env python
from bottle import request, Bottle, abort, static_file
import pathlib
app = Bottle()
CURR_DIR = pathlib.Path().absolute()

@app.route('/websocket')
def handle_websocket():
    wsock = request.environ.get('wsgi.websocket')
    if not wsock:
        abort(400, 'Expected WebSocket request.')

    while True:
        try:
            message = wsock.receive()
            wsock.send("Your message was: %r" % message)
        except WebSocketError:
            break

@app.route('/')
@app.route('/<filepath:path>')
def serve_static(filepath = 'netview.html'):
    print('serving ' + filepath, end="")
    resp = static_file(filepath, root = str(CURR_DIR))
    print(' ->', resp.status_line)
    return resp


from gevent.pywsgi import WSGIServer
from geventwebsocket import WebSocketError
from geventwebsocket.handler import WebSocketHandler
server = WSGIServer(("0.0.0.0", 8080), app,
                    handler_class=WebSocketHandler)
server.serve_forever()

