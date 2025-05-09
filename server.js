const express = require('express');
const http = require('http');
const { env } = require('process');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
// const io = socketIo(server);
const io = require('socket.io')(server, {
    cors: {
        origin: '*', // Allow from anywhere for testing
        methods: ['GET', 'POST']
    }
});

const UserType = {
    USER: "USER",
    RIDER: "RIDER",
}
let riders = {}
let users = {};
// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('connecteds:', socket.id);

    const userId = socket.handshake.query.userId;
    const latitude = socket.handshake.query.lat;
    const longitude = socket.handshake.query.lng;
    const name = socket.handshake.query.name;
    const userType = socket.handshake.query.userType;

    if (userType == UserType.USER) {

        users[userId] = { userId: userId, socketId: socket.id, latitude, longitude, name, userType };
    } else {
        riders[userId] = { userId: userId, socketId: socket.id, latitude, longitude, name, userType };
    }

    console.log(socket.handshake.query);

    socket.on('send_message', (data) => {
        const recepientType = data.recepientType;
        if (recepientType == UserType.USER) {
            const user = users[data.recepient];
            if (user && user.socketId) {
                io.to(user.socketId).emit('receive_message', users);
            } else {
                console.log(`User ${data.recepient} not connected`);
            }
        } else {
            const rider = riders[data.recepient];
            if (rider && rider.socketId) {
                io.to(rider.socketId).emit('receive_message', riders);
            } else {
                console.log(`User ${data.recepient} not connected`);
            }
        }
    });

    socket.on('disconnect', () => {

        for (const id in riders) {
            if (riders[id].socketId === socket.id) {
                delete riders[id]
                console.log(`${id} removed from riders`);
                break;
            }
        }
        for (const id in users) {
            if (users[id].socketId === socket.id) {
                delete users[id];
                console.log(`${id} removed from users`);
                break;
            }
        }
    });
});

const PORT = env.PORT || 3000
server.listen(PORT, '0.0.0.0', () => {
    console.log('Node.js WebSocket server running on port 3000');
});
