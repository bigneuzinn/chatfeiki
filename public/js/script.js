const currentUser = sessionStorage.getItem('currentUser');
if (!currentUser) window.location.href = 'login.html';

const socket = io();
const currentUsernameElement = document.getElementById('current-username');
const usersListElement = document.getElementById('users-list');
const chatWithUserElement = document.getElementById('chat-with-user');
const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const userAvatar = sessionStorage.getItem('userAvatar');
const userName = sessionStorage.getItem('userName');

let selectedUser = null;
const messages = {};

function renderContacts() {
    usersListElement.innerHTML = '';
    const users = JSON.parse(localStorage.getItem('chatUsers') || '{}');
    const contacts = Object.keys(users).filter(user => user !== currentUser);
    
    contacts.forEach(contact => {
        const userData = users[contact] || {};
        const contactName = userData.name || contact;
        const contactAvatar = userData.avatar || '';
        
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.dataset.username = contact;
        
        userElement.innerHTML = `
            <div class="user-avatar" ${contactAvatar ? `style="background-image: url('data:image/png;base64,${contactAvatar}')"` : ''}>
                ${contactAvatar ? '' : contactName.charAt(0).toUpperCase()}
            </div>
            <div class="user-info">
                <div class="user-name">${contactName}</div>
                <div class="user-status">offline</div>
            </div>
            <div class="status-offline"></div>
        `;
        
        usersListElement.appendChild(userElement);
    });
}

if (userAvatar) {
    document.querySelector('.current-user').innerHTML = `
        <div class="current-user-avatar" style="background-image: url('data:image/png;base64,${userAvatar}')"></div>
        <span>${userName}</span>
    `;
} else {
    document.querySelector('.current-user').innerHTML = `
        <div class="current-user-avatar">${userName.charAt(0).toUpperCase()}</div>
        <span>${userName}</span>
    `;
}

currentUsernameElement.textContent = userName;
renderContacts();

usersListElement.addEventListener('click', (e) => {
    const userElement = e.target.closest('.user-item');
    if (userElement) {
        selectedUser = userElement.dataset.username;
        chatWithUserElement.textContent = userElement.querySelector('.user-name').textContent;
        messageForm.classList.remove('hidden');
        loadMessages();
    }
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const messageText = messageInput.value.trim();
    
    if (messageText && selectedUser) {
        const message = {
            from: currentUser,
            to: selectedUser,
            text: messageText,
            timestamp: new Date().toISOString()
        };
        
        socket.emit('private message', message);
        
        if (!messages[selectedUser]) messages[selectedUser] = [];
        messages[selectedUser].push(message);
        addMessageToChat(message, true);
        messageInput.value = '';
    }
});

socket.on('connect', () => socket.emit('register', currentUser));
socket.on('private message', (message) => {
    const otherUser = message.from === currentUser ? message.to : message.from;
    if (!messages[otherUser]) messages[otherUser] = [];
    messages[otherUser].push(message);
    if (selectedUser === otherUser) addMessageToChat(message, message.from === currentUser);
});
socket.on('user status', updateContactsStatus);
socket.on('user list updated', renderContacts);

function updateContactsStatus(onlineUsers) {
    document.querySelectorAll('.user-item').forEach(item => {
        const username = item.dataset.username;
        const statusElement = item.querySelector('.user-status');
        const statusIndicator = item.querySelector('.status-online, .status-offline');
        
        if (onlineUsers.includes(username)) {
            statusElement.textContent = 'online';
            if (statusIndicator) statusIndicator.className = 'status-online';
        } else {
            statusElement.textContent = 'offline';
            if (statusIndicator) statusIndicator.className = 'status-offline';
        }
    });
}

function loadMessages() {
    messagesContainer.innerHTML = '';
    if (selectedUser && messages[selectedUser]) {
        messages[selectedUser].forEach(msg => addMessageToChat(msg, msg.from === currentUser));
    }
    scrollToBottom();
}

function addMessageToChat(message, isOutgoing) {
    const users = JSON.parse(localStorage.getItem('chatUsers') || '{}');
    const senderName = users[message.from]?.name || message.from;
    const senderAvatar = users[message.from]?.avatar || '';
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isOutgoing ? 'message-out' : 'message-in'}`;
    
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
        ${!isOutgoing ? `
            <div class="message-sender">
                <div class="sender-avatar" ${senderAvatar ? `style="background-image: url('data:image/png;base64,${senderAvatar}')"` : ''}>
                    ${senderAvatar ? '' : senderName.charAt(0).toUpperCase()}
                </div>
                ${senderName}
            </div>
        ` : ''}
        <div class="message-text">${message.text}</div>
        <div class="message-time">${time}</div>
    `;
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}