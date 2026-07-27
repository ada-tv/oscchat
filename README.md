# Universal OSC Chat

Lets you chat using a desktop overlay instead of the builtin chat UIs with anything that supports (or can be made to use) VRChat's `/chatbox/input` OSC protocol on ports 9000 and 9001.

### Running
Get `python-osc` and `python-websockets` (idc how) and run `ws2osc.py` in a terminal. It'll run in the background and you can mash `^C` to close it. Then open `index.html` (either a localhost HTTP server or `file://`, either works) in your browser.

### VRChat
Requires OSC to be turned on in the radial menu.

Supports sending messages and a typing indicator.

The VRC mode in the UI echoes the messages you send, since VRChat doesn't expose other chat messages in a way this app can log them.

### Overte
Run [oscChat.js](https://raw.githubusercontent.com/ada-tv/overte-scripts/refs/heads/main/oscChat.js)

Supports sending and receiving messages and typing indicators.

### Resonite
OSC Chat Bridge installer ball: `resrec:///U-1ZO6MMF2IL2/R-019fa436-9934-78df-9a58-0bc149942368`

Supports sending and receiving messages. Doesn't have any built-in notification system, it only propagates `PublicMessage` impulses through OSC. I might make something later that will make a noise and show text if it receives a message sent by its owner.

Can sometimes bug out if it's installed more than one time in a session and it's untested to see how it behaves if installed on an avatar used in multiple connected sessions.
