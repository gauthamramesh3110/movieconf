if ( getCookie('roomId') === '' || getCookie('nickname') === '' || getCookie('isHost') === '' ){
    window.location.replace('/')
}

colors = ['#5A379C', '#8F007C', '#256EBB', '#49BEAA', '#FFC914', '#FF570A', '#D72638', '#484D59']
colorNumber = Math.floor((Math.random() * colors.length));


//START OF SOCKET AND PEER HANDLING

let socket = io();
let peer = new Peer();

let connections = {}

let videoPlayer = document.getElementById('video-player');

peer.on('open', function (userId) {
    socket.emit('join-room', getCookie('roomId'), userId, getCookie('nickname'), getCookie('isHost'));
});

socket.on('user-joined', (nickname) => {
    let chatList = document.getElementById('chatbox');

    let notificationBubble = document.createElement('div');
    notificationBubble.className = 'notification-bubble';

    let textnode = document.createTextNode(nickname + ' has joined the room.')

    notificationBubble.appendChild(textnode);
    chatList.appendChild(notificationBubble);

    updateScroll();
})

socket.on('receive-message', (nickname, message, color) => {
    let chatList = document.getElementById('chatbox');
    let messageBubble = createMessageBubble(nickname, message, true, color);
    chatList.appendChild(messageBubble)
    updateScroll();
})

socket.on('receive-peer-id', (peerId) => {
    if (getCookie('isHost') === 'true') {
        let videoStream = videoPlayer.captureStream(0);
        let call = peer.call(peerId, videoStream);

        connections[peerId] = call;
    }

    console.log(peer.connections)
})

socket.on('user-disconnected', (userId, nickname) => {
    connections[userId].close();
    delete connections[userId];

    let chatList = document.getElementById('chatbox');

    let notificationBubble = document.createElement('div');
    notificationBubble.className = 'notification-bubble';

    let textnode = document.createTextNode(nickname + ' has left the room.')

    notificationBubble.appendChild(textnode);
    chatList.appendChild(notificationBubble);
})

peer.on('call', (call) => {
    call.answer();
    call.on('stream', (stream) => {
        console.log('streaming')
        videoPlayer.srcObject = stream;
    })
})


videoPlayer.onplay = function (e) {
    Object.keys(connections).forEach(userId => {
        connections[userId].close();

        let videoStream = videoPlayer.captureStream(0);
        let call = peer.call(userId, videoStream);

        connections[userId] = call;
    });
}

videoPlayer.onloadedmetadata = function (e) {
    videoPlayer.play();
}

//END OF SOCKET AND PEER HANDLING



let roomId = document.getElementById('room-id');
let content = document.createTextNode(getCookie('roomId'));
roomId.appendChild(content);


// FILE SELECTOR HANDLING
let selectFile = document.getElementById('select-file');
let filename = document.getElementById('filename');

if (getCookie('isHost') == 'false') {
    selectFile.style.display = 'none'
    filename.style.display = 'none'
}

let fileSelector = document.getElementById('file-selector');
selectFile.onclick = function (e) {
    if (getCookie('isHost') === 'false') {
        return;
    }

    fileSelector.click();
}

fileSelector.onchange = function (e) {
    let myVideoFile = fileSelector.files[0];
    videoPlayer.src = URL.createObjectURL(myVideoFile);


    filename.innerText = '';
    let textnode = document.createTextNode(myVideoFile.name)
    filename.appendChild(textnode)
}
// END OF FILE SELECTOR HANDLING



// LEAVE ROOM HANDLING
let leaveRoom = document.getElementById('leave-room');
leaveRoom.onclick = function(e){
    setCookie('roomId', '')
    setCookie('nickname', '')
    setCookie('isHost', '')
    window.location.replace('/')
}



// CHAT INPUT HANDLING
let chatInput = document.getElementById('chat-input');
chatInput.onkeyup = function (e) {
    if (e.keyCode === 13) {
        e.preventDefault();

        let message = chatInput.value;
        if (message.length == 0) {
            return
        }

        socket.emit('send-message', getCookie('roomId'), getCookie('nickname'), message, colors[colorNumber]);

        let chatList = document.getElementById('chatbox');
        let messageBubble = createMessageBubble('You', message, false, colors[colorNumber]);
        chatList.appendChild(messageBubble)

        chatInput.value = ''
        updateScroll();
    }
}
//END OF CHAT INPUT HANDLING

function createMessageBubble(nickname, message, isReceived, color) {
    let messageBubble = document.createElement('div');
    messageBubble.className = `message-bubble ${isReceived ? 'received' : 'sent'}`;


    let messageSender = document.createElement('div');
    messageSender.className = 'message-sender';

    let messageSenderTextnode = document.createTextNode(nickname + ': ');
    messageSender.appendChild(messageSenderTextnode);

    messageSender.style.color = color;

    if (!isReceived){
        messageSender.style.display = 'none';
    }


    let messageBody = document.createElement('div');
    messageBody.className = 'message-body'

    let messageBodyTextNode = document.createTextNode(message)
    messageBody.appendChild(messageBodyTextNode)

    messageBubble.appendChild(messageSender)
    messageBubble.appendChild(messageBody)

    return messageBubble;
}

function updateScroll() {
    var element = document.getElementById("chatbox");
    element.scrollTop = element.scrollHeight;
}