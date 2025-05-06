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
    console.log('connected: '+socket.id);
    socket.on('online', (data)=>{
        users[data.userId] = socket.id;
        console.log(data.userId, 'connected');
    });

    socket.on('disconnect', () => {
        console.log(socket.id);
    });
});

const PORT =   env.PORT || 3000
server.listen(PORT, () => {
    console.log('Node.js WebSocket server running on port 3000');
});
