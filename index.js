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

admins = {}

io.on('connection', (socket) => {

    socket.on('join-room', (roomId, userId, nickname, isHost) => {

        socket.join(roomId, () => {
            socket.join(userId, () => {
                if (isHost === 'true') {
                    admins[roomId] = [userId, socket];
                } else {
                    socket.to(admins[roomId][0]).emit('receive-peer-id', userId);
                    io.to(userId).emit('receive-peer-id', admins[roomId][0]);
                }
            });

            socket.to(roomId).broadcast.emit('user-joined', nickname);
        });

        socket.on('disconnect', () => {
            socket.to(admins[roomId][0]).emit('user-disconnected', userId, nickname);
        });

    });

    socket.on('send-message', (roomId, nickname, message) => {
        socket.to(roomId).broadcast.emit('receive-message', nickname, message);
    });

});

var port = process.env.PORT
server.listen(port, () => {
    console.log(`Listening at port ${port}.`)
})