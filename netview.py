#!/usr/bin/env python
from bottle import request, Bottle, abort, static_file
import pathlib, json
app = Bottle()
CURR_DIR = pathlib.Path().absolute()

@app.route('/websocket')
def handle_websocket():
    print('/websocket')
    wsock = request.environ.get('wsgi.websocket')
    if not wsock:
        abort(400, 'Expected WebSocket request.')

    while True:
        try:
            message = json.loads(wsock.receive())
            wsock.send(json.dumps({
                "type": 'response',
                'data': "Your message was: %s" % str(message)
            }))
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

