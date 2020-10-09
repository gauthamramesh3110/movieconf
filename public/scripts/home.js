fetch('/getconfig', {
	method: 'GET',
	headers: {
		'Content-Type': 'application/json',
	},
})
	.then((response) => {
		return response.json();
	})
	.then((body) => {
		connectPeer(body.host, body.port, body.path);
	});

function connectPeer(host, port, path) {
	let peer = new Peer({
		host: host,
		port: port,
		path: path,
		secure: false,
		config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }], sdpSemantics: 'unified-plan' },
	});
	// GET PEER ID AND JOIN ROOM
	peer.on('open', (userId) => {
		console.log(`My UserID is: ${userId}`);
		socket.emit('join-room', roomId, userId, nickname, isHost);

		socket.on('peer-added', (peerId) => {
			clients.add(peerId);

			let video = document.getElementById('video-player');
			let stream = video.captureStream(0);

			sendStreamToClient(peerId, stream);
		});

		socket.on('peer-removed', (peerId) => {
			clients.delete(peerId);
			stopStreamToClient(peerId);
		});

		socket.on('user-connected', (nickname) => {
			let notificationText = `${nickname} has joined the room.`;
			notifyChat(notificationText);
		});

		socket.on('user-disconnected', (nickname) => {
			let notificationText = `${nickname} has left the room.`;
			notifyChat(notificationText);
		});

		socket.on('session-destroyed', () => {
			leaveRoom();
		});

		socket.on('message-received', (nickname, message, color) => {
			addMessageToChat(nickname, message, messageOrigin.received, color);
		});

		peer.on('call', (call) => {
			call.answer();
			streamVideoFromHost(call);
		});
	});

	let socket = io();
	let roomId = getCookie('roomId');
	let nickname = getCookie('nickname');
	let isHost = getCookie('isHost') === 'true';

	if (roomId.length == 0) {
		window.location.replace('/');
	}

	let clients = new Set();
	let calls = {};

	let messageOrigin = {
		sent: 'sent',
		received: 'received',
	};

	let roomIdElement = document.getElementById('room-id');
	let roomIdText = document.createTextNode(roomId);
	roomIdElement.appendChild(roomIdText);

	// AUXILLARY FUNCTIONS
	function sendStreamToClient(peerId, stream) {
		let call = peer.call(peerId, stream);
		calls[peerId] = call;
	}

	function stopStreamToClient(peerId) {
		calls[peerId].close();
		delete calls[peerId];
	}

	function streamVideoFromHost(call) {
		let video = document.getElementById('video-player');

		call.on('stream', (stream) => {
			video.srcObject = stream;
		});
	}

	function leaveRoom() {
		setCookie('roomId', '');
		setCookie('isHost', 'false');
		setCookie('nickname', '');
		window.location.replace('/');
	}

	function addMessageToChat(nickname, message, origin, color) {
		let chatBoxElement = document.getElementById('chatbox');
		let messageBubble = document.createElement('div');

		let messageHeader = document.createElement('div');
		let messageHeaderText = document.createTextNode(nickname);
		messageHeader.appendChild(messageHeaderText);
		messageHeader.className = 'message-header';
		if (origin === 'sent') {
			messageHeader.style.display = 'none';
		}
		messageHeader.style.color = color;

		let messageBody = document.createElement('div');
		let messageBodyText = document.createTextNode(message);
		messageBody.appendChild(messageBodyText);

		messageBubble.appendChild(messageHeader);
		messageBubble.appendChild(messageBody);

		messageBubble.className = 'message-bubble ' + origin;

		chatBoxElement.appendChild(messageBubble);

		updateScrollPosition('chatbox');
	}

	function notifyChat(notificationText) {
		let chatBoxElement = document.getElementById('chatbox');
		let notificationBubble = document.createElement('div');
		let notificationTextNode = document.createTextNode(notificationText);

		notificationBubble.appendChild(notificationTextNode);
		notificationBubble.className = 'notification-bubble';

		chatBoxElement.appendChild(notificationBubble);
		updateScrollPosition('chatbox');
	}

	function updateScrollPosition(id) {
		var element = document.getElementById(id);
		element.scrollTop = element.scrollHeight - element.clientHeight;
	}

	//EVENT LISTENERS
	let chatInput = document.getElementById('chat-input');
	chatInput.onkeyup = function (e) {
		if (chatInput.value.length === 0) return;

		if (e.keyCode == 13) {
			e.preventDefault();

			let message = chatInput.value;
			socket.emit('message-sent', message);

			addMessageToChat('You', message, messageOrigin.sent);
			chatInput.value = '';
		}
	};

	let selectFileButton = document.getElementById('select-file');
	if (!isHost) {
		selectFileButton.style.display = 'none';
	}

	let fileSelector = document.getElementById('file-selector');
	selectFileButton.onclick = function (e) {
		if (isHost) {
			fileSelector.click();
		}
	};
	fileSelector.onchange = function (e) {
		let video = document.getElementById('video-player');
		let file = fileSelector.files[0];
		video.src = URL.createObjectURL(file);
	};

	let video = document.getElementById('video-player');
	video.onloadeddata = function (e) {
		if (isHost) {
			let stream = video.captureStream(0);
			clients.forEach((clientId) => {
				console.log(`Start streaming to ${clientId}`);
				stopStreamToClient(clientId);
				sendStreamToClient(clientId, stream);
			});
		}
	};

	let leaveRoomButton = document.getElementById('leave-room');
	leaveRoomButton.onclick = function (e) {
		leaveRoom();
	};

	window.onbeforeunload = function (e) {
		if (isHost) {
			leaveRoom();
		}
	};
}
