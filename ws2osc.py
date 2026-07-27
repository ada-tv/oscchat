#!/usr/bin/env python
# SPDX-License-Identifier: CC0-1.0
import json
import signal
import asyncio
import pythonosc
import pythonosc.udp_client
import pythonosc.osc_server
from websockets.asyncio.server import serve, broadcast

OSC_OUTPORT = 9000
OSC_INPORT = 9001
WS_PORT = 9002

osc_client = pythonosc.udp_client.SimpleUDPClient("127.0.0.1", OSC_OUTPORT)

clients = []

async def handle_client(socket):
    clients.append(socket)

    async for raw_message in socket:
        message = json.loads(raw_message)

        if "body" in message:
            osc_client.send_message("/chatbox/input", [message["body"], True, True])

        if "typing" in message:
            osc_client.send_message("/chatbox/typing", message["typing"])

    clients.remove(socket)

def handle_output(address, *args):
    broadcast(clients, json.dumps({ "name": args[0], "body": args[1] }))

def handle_typing(address, *args):
    broadcast(clients, json.dumps({ "typing": args[0], "name": args[1] }))

async def main():
    loop = asyncio.get_running_loop()

    for signal_name in [signal.SIGINT, signal.SIGTERM]:
        loop.add_signal_handler(signal_name, loop.stop)

    osc_dispatcher = pythonosc.dispatcher.Dispatcher()
    osc_dispatcher.map("/chatbox/output", handle_output)
    osc_dispatcher.map("/chatbox/typing", handle_typing)

    osc_server = pythonosc.osc_server.AsyncIOOSCUDPServer(
            ("127.0.0.1", OSC_INPORT), osc_dispatcher, asyncio.get_event_loop())
    transport, protocol = await osc_server.create_serve_endpoint()

    async with serve(handle_client, "localhost", WS_PORT) as server:
        await server.serve_forever()

    transport.close()

try:
    asyncio.run(main())
except:
    pass
