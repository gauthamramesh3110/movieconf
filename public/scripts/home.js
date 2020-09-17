let socket = io();
socket.emit('join-room', getCookie('roomId'), getCookie('nickname'));

let roomId = document.getElementById('room-id');
let content = document.createTextNode(getCookie('roomId'));
roomId.appendChild(content);

let selectFile = document.getElementById('select-file');
let filename = document.getElementById('filename');

if (getCookie('isHost') == 'false') {
    selectFile.style.display = 'none'
    filename.style.display = 'none'
}

selectFile.onclick = function (e) {
    if (!getCookie('isHost')) {
        return;
    }
}

let chatInput = document.getElementById('chat-input');
chatInput.onkeyup = function (e) {
    if (e.keyCode === 13) {
        e.preventDefault();

        let message = chatInput.value;
        if (message.length == 0) {
            return
        }

        socket.emit('send-message', getCookie('roomId'), getCookie('nickname'), message);

        let chatList = document.getElementById('chatbox');
        let messageBubble = createMessageBubble('You', message, false);
        chatList.appendChild(messageBubble)

        chatInput.value = ''
        updateScroll();
    }
}

socket.on('user-joined', (nickname) => {
    let chatList = document.getElementById('chatbox');

    let notificationBubble = document.createElement('div');
    notificationBubble.className = 'notification-bubble';

    let textnode = document.createTextNode(nickname + ' has joined the room.')

    notificationBubble.appendChild(textnode);
    chatList.appendChild(notificationBubble);
})

socket.on('receive-message', (nickname, message) => {
    let chatList = document.getElementById('chatbox');
    let messageBubble = createMessageBubble(nickname, message, true);
    chatList.appendChild(messageBubble)
    updateScroll();
})

function createMessageBubble(nickname, message, isReceived) {
    let messageBubble = document.createElement('div');
    messageBubble.className = `message-bubble ${isReceived ? 'received' : 'sent'}`;


    let messageSender = document.createElement('div');
    messageSender.className = 'message-sender';

    let messageSenderTextnode = document.createTextNode(nickname + ': ');
    messageSender.appendChild(messageSenderTextnode);


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