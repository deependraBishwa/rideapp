const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const {Server} = require('socket.io');

const app = express();
const server = http.createServer(app);

app.use(express.static('public'));
app.use(bodyParser.json());

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const UserType = {
    USER: "USER",
    RIDER: "RIDER"
};

let connectRiders = {};
let users = {};

io.on('connection', (socket) => {
    const { userToken, latitude, longitude, name, userType } = socket.handshake.query;

    if (userType === UserType.USER) {
        users[userToken] = {
            token: userToken,
            socketId: socket.id,
            latitude,
            longitude,
            name,
            userType
        };
    } else {
        connectRiders[userToken] = {
            token: userToken,
            socketId: socket.id,
            latitude,
            longitude,
            name,
            userType
        };
    }

    // Notify clients of the updated user list
    io.emit('connected_users', Object.values(users));

    socket.on('disconnect', () => {
        let removed = false;
        for (const id in connectRiders) {
            if (connectRiders[id].socketId === socket.id) {
                delete connectRiders[id];
                removed = true;
                break;
            }
        }

        for (const id in users) {
            if (users[id].socketId === socket.id) {
                delete users[id];
                removed = true;
                break;
            }
        }

        if (removed) {
            io.emit('disconnected', { socketId: socket.id });
        }
    });
});

app.post('/api/sendRequestToRider', (req, res) => {
    const data = req.body;
    console.log('Received data from Laravel:', data);

    for (const riderId in connectRiders) {
        const rider = connectRiders[riderId];
        io.to(rider.socketId).emit('new_request', data);
    }

    res.json({ success: true, message: 'Request sent to all riders' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
