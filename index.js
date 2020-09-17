const express = require('express');
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
require('dotenv').config()


app.use(express.static('./public'))

app.get('/create-room', (req, res) => {
    res.json({
        result: 'success',
        roomId: Math.floor(Math.random() * 1000000)
    })
})

io.on('connection', (socket) => {

    socket.on('join-room', (roomId, nickname) => {
        socket.join(roomId);
        socket.to(roomId).broadcast.emit('user-joined', nickname)
        console.log(nickname + ' has joined room: ' + roomId)
    });

    socket.on('send-message', (roomId, nickname, message) => {
        console.log('message')
        socket.to(roomId).broadcast.emit('receive-message', nickname, message);
    })
});

var port = process.env.PORT
server.listen(port, () => {
    console.log(`Listening at port ${port}.`)
})