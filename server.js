const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');

if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.redirect('/login.html'));

const users = new Map();

io.on('connection', (socket) => {
    socket.on('register', (username) => {
        if (users.has(username)) {
            socket.emit('username error', 'Usuário já está online');
            return;
        }
        users.set(username, socket.id);
        socket.username = username;
        updateOnlineUsers();
    });

    socket.on('private message', (message) => {
        if (!users.has(message.to)) {
            socket.emit('message error', 'Usuário não está online');
            return;
        }

        message.timestamp = new Date().toISOString();
        saveMessage(message);

        const recipientSocketId = users.get(message.to);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('private message', message);
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            users.delete(socket.username);
            updateOnlineUsers();
        }
    });
});

function updateOnlineUsers() {
    io.emit('user status', Array.from(users.keys()));
    io.emit('user list updated');
}

function saveMessage(message) {
    let messages = {};
    if (fs.existsSync(MESSAGES_FILE)) {
        messages = JSON.parse(fs.readFileSync(MESSAGES_FILE));
    }
    
    const conversationId = [message.from, message.to].sort().join('_');
    if (!messages[conversationId]) messages[conversationId] = [];
    messages[conversationId].push(message);
    
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});