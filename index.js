const express = require('express');
const { disconnect } = require('process');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
require('dotenv').config();

app.use(express.static('./public'));

app.get('/create-room', (req, res) => {
	res.json({
		result: 'success',
		roomId: Math.floor(Math.random() * 1000000),
	});
});

/*
EACH ROOM ENTRY IS OF THE TYPE

roomId: {
    hostId: 'hostId',
    users: ['user1Id', 'user2Id', ...]
}
*/
rooms = {};

io.on('connection', (socket) => {
	socket.on('join-room', (roomId, userId, nickname, isHost) => {
		//JOIN A ROOM
		socket.join(roomId, () => {
			socket.join(userId, () => {
				console.log(`${nickname} with id ${userId} joined room: ${roomId}`);

				if (isHost) {
					// CREATE NEW ROOM ENTRY IF USER IS THE HOST
					rooms[roomId] = {
						hostId: userId,
						users: [userId],
					};
				} else {
					// ADD NEW USER TO ROOM IF NOT THE HOST, EXCHANGE USER-ID WITH HOST, AND NOTIFY ROOM
					rooms[roomId].users.push(userId);
					socket.to(rooms[roomId].hostId).emit('peer-added', userId);
					socket.to(roomId).broadcast.emit('user-connected', nickname);
				}
				console.log(rooms);
			});
		});

		socket.on('disconnect', () => {
			if (isHost) {
				// DESTROY ROOM IF HOST DISCONNECTS
				socket.to(roomId).broadcast.emit('session-destroyed');
				delete rooms[roomId];
			} else {
				// NOTIFY ROOM IF NON-HOST DISCONNECTS AND REMOVE FROM ROOM DATA
				if (rooms[roomId] != undefined) {
					socket.to(rooms[roomId].hostId).emit('peer-removed', userId);
					socket.to(roomId).broadcast.emit('user-disconnected', nickname);
					rooms[roomId].users = rooms[roomId].users.filter((currentUserId) => {
						return currentUserId != userId;
					});
				}
			}

			console.log(rooms);
		});

		socket.on('message-sent', (message) => {
			socket.to(roomId).broadcast.emit('message-received', nickname, message);
		});
	});
});

var port = process.env.PORT;
server.listen(port, () => {
	console.log(`Listening at port ${port}.`);
});
