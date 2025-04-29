// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// In-memory storage for messages and users
const messages = [];
const users = new Map(); // socket.id -> {username, joinedAt}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get recent messages (optional)
app.get('/api/messages', (req, res) => {
    res.json(messages.slice(-50)); // Return last 50 messages
});

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // When a user sets their username
    socket.on('set-username', (username) => {
        if (!username || username.trim() === '') {
            socket.emit('username-error', 'Username cannot be empty');
            return;
        }

        // Check if username is already taken
        const usernameTaken = [...users.values()].some(
            user => user.username.toLowerCase() === username.toLowerCase()
        );

        if (usernameTaken) {
            socket.emit('username-error', 'Username is already taken');
            return;
        }

        // Store user
        users.set(socket.id, {
            username,
            joinedAt: new Date()
        });

        // Notify the user
        socket.emit('username-accepted', username);

        // Send user list and recent messages to the new user
        socket.emit('user-list', getOnlineUsers());
        socket.emit('message-history', messages.slice(-50));

        // Notify others about the new user
        socket.broadcast.emit('user-joined', username);
        io.emit('user-list', getOnlineUsers());

        console.log(`User ${username} (${socket.id}) joined`);
    });

    // When a user sends a message
    socket.on('send-message', (message) => {
        const user = users.get(socket.id);
        if (!user || !message || message.trim() === '') return;

        const messageData = {
            username: user.username,
            text: message.trim(),
            timestamp: new Date().toISOString()
        };

        // Store message (in memory)
        messages.push(messageData);

        // Broadcast to all users
        io.emit('new-message', messageData);
    });

    // When a user disconnects
    socket.on('disconnect', () => {
        const user = users.get(socket.id);
        if (user) {
            users.delete(socket.id);
            io.emit('user-left', user.username);
            io.emit('user-list', getOnlineUsers());
            console.log(`User ${user.username} (${socket.id}) disconnected`);
        }
    });

    // Helper function to get online users
    function getOnlineUsers() {
        return [...users.values()].map(user => ({
            username: user.username,
            joinedAt: user.joinedAt
        }));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});