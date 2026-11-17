// SPDX-License-Identifier: CC0-1.0
"use strict";

/** @type {HTMLDivElement} */
const log = document.getElementById("chatlog");

/** @type {HTMLTextAreaElement} */
const input = document.getElementById("inputbox");

/** @type {HTMLSpanElement} */
const typingIndicator = document.getElementById("typing-indicator");

/** @type {HTMLSpanElement} */
const charCounter = document.getElementById("char-counter");

/** @type {HTMLInputElement} */
const vrcMode = document.getElementById("vrc-mode-toggle");

/** @type {HTMLInputElement} */
const realtimeText = document.getElementById("realtime-text-toggle");

/** @type {WebSocket} */
let socket;

function createSocket() {
	socket = new WebSocket("ws://127.0.0.1:9002/");

	socket.addEventListener("open", () => {
		input.value = "";
		input.disabled = false;
	});

	socket.addEventListener("close", () => {
		input.disabled = true;

		let text = document.createElement("p");
		text.innerText = "Socket closed";
		text.className = "error";
		log.append(text);
	});

	socket.addEventListener("message", event => {
		/** @type {Object} */
		const eventData = JSON.parse(event.data);

		if (eventData.hasOwnProperty("body")) {
			addChatMessage(eventData.name, eventData.body);
		} else if (eventData.hasOwnProperty("typing")) {
			if (eventData.typing) {
				typingUsers.set(eventData.name, Date.now());
			} else {
				typingUsers.delete(eventData.name);
			}

			setTypingIndicator();
		}
	});
}

/** @type {boolean} */
let isTyping = false;

/** @type {Map<string, number>} */
let typingUsers = new Map();

function reset() {
	input.value = "Connecting…";
	input.disabled = true;

	charCounter.innerText = "0/144";
	charCounter.className = "";
	charCounter.style.visibility = "collapse";
	vrcMode.checked = false;

	typingIndicator.innerText = "";
}

reset();

/**
 * @param {string} src
 * @returns {number}
 */
function hash(src) {
	let hash = 0x811c9dc5;
	let buffer = (new TextEncoder()).encode(src);

	for (const b of buffer) {
		hash ^= b;
		hash *= 0x01000193;
		hash &= 0xffffffff;
	}

	return hash;
}

/**
 * @param {string} name
 * @param {string} body
 */
function addChatMessage(name, body) {
	/** @type {HTMLElement} */
	const welcome = document.getElementById("welcome");
	if (welcome) { welcome.remove(); }

	const now = new Date();
	const timeParts = [now.getHours(), now.getMinutes(), now.getSeconds()]
		.map(x => x.toString().padStart(2, "0"));

	/** @type {HTMLDivElement} */
	let block = document.createElement("div");
	block.className = "logline";

	/** @type {HTMLSpanElement} */
	let timestamp = document.createElement("span");
	timestamp.className = "timestamp";
	timestamp.innerText = `${timeParts[0]}:${timeParts[1]}:${timeParts[2]}`;

	const nameHue = hash(name) % 360;

	/** @type {HTMLSpanElement} */
	let nameElem = document.createElement("span");
	nameElem.innerText = name;
	nameElem.className = "username";
	nameElem.style = `color:oklch(var(--color-lightness) 0.15 ${nameHue})`;

	/** @type {Array<string | HTMLAnchorElement>} */
	let bodyElems = [];

	for (const part of body.split(/(https?:\/\/\S+)/)) {
		if (part.match(/(https?:\/\/\S+)/)) {
			let anchor = document.createElement("a");
			anchor.innerText = part;
			anchor.href = part;
			bodyElems.push(anchor);
		} else {
			bodyElems.push(part);
		}
	}

	block.append(timestamp, nameElem, ...bodyElems);
	log.append(block);

	block.scrollIntoView({
		behavior: "smooth",
		block: "start",
	});
}

function setTypingIndicator() {
	const names = [...typingUsers.keys()];

	if (names.length === 0) {
		typingIndicator.innerText = "";
	} else if (names.length === 1) {
		typingIndicator.innerText = `${names[0]} is typing…`;
	} else {
		typingIndicator.innerText = `${names.join(", ")} are typing…`;
	}
}

setInterval(() => {
	const now = Date.now();
	let toRemove = [];

	for (const [name, time] of typingUsers) {
		if (now > (time + 20000)) {
			toRemove.push(name);
		}
	}

	toRemove.forEach(x => typingUsers.delete(x));
	setTypingIndicator();
}, 2000);

// wait a sec for the server to start if we've been opened by run.sb
setTimeout(createSocket, 500);

input.addEventListener("keydown", event => {
	if (event.key == "Enter" && !event.shiftKey) {
		event.preventDefault();

		const text = input.value.trim();

		if (text === "") { return; }

		if (vrcMode.checked) {
			addChatMessage("You", input.value);
		}

		socket.send(JSON.stringify({ body: text, notify: true }));
		socket.send(JSON.stringify({ typing: false }));

		input.value = "";
		isTyping = false;
		charCounter.innerText = "0/144";
		charCounter.className = "";

		return;
	}
});

input.addEventListener("input", () => {
	if (input.value.length === 0 && isTyping) {
		isTyping = false;
		socket.send(JSON.stringify({ typing: false }));
	} else if (input.value.length > 0 && !isTyping) {
		isTyping = true;
		socket.send(JSON.stringify({ typing: true }));
	}

	let charCount = 0;
	for (const _c of input.value) {
		charCount++;
	}

	charCounter.innerText = `${charCount}/144`;
	charCounter.className = charCount >= 144 ? "overflow" : "";
});

// NOTE: VRChat apparently expects to be given periodic typing
// indicator messages or it disappears after a while (undocumented lol)
// NOTE: /chatbox/input is ratelimited, so we can't send a message for every key press
setInterval(() => {
	if (isTyping) {
		socket.send(JSON.stringify({ typing: true }));

		if (realtimeText.checked) {
			const text = input.value.trim();
			socket.send(JSON.stringify({ body: text, notify: false }));
		}
	}
}, 1000);

vrcMode.addEventListener("change", () => {
	charCounter.style.visibility = vrcMode.checked ? "visible" : "collapse";
});

document.getElementById("clear-log").addEventListener("click", () => log.replaceChildren());
