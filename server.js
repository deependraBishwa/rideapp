const express = require('express');
const http = require('http');
const { env } = require('process');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {};
// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('connected: ' + socket.id);
    socket.on('online', (data) => {
        users[data.userId] = socket.id;
        console.log(data.userId, 'connected');
    });


    socket.on('send_message', (data) => {
        const targetSocketId = users[data.recepient];
        if (targetSocketId) {
            io.to(targetSocketId).emit('receive_message', {
                from: socket.id, // or userId
                message: data.message,
            });
        } else {
            console.log('User not connected');
        }
    });

    socket.on('disconnect', () => {

        console.log(socket.id);
        for (const userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];
                console.log(`${userId} removed from users`);
                break;
            }
        }
    });
});

const PORT = env.PORT || 3000
server.listen(PORT, () => {
    console.log('Node.js WebSocket server running on port 3000');
});
