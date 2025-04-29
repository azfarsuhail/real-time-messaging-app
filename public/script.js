// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginModal = document.getElementById('login-modal');
    const usernameInput = document.getElementById('username-input');
    const loginButton = document.getElementById('login-button');
    const usernameError = document.getElementById('username-error');
    const chatInterface = document.getElementById('chat-interface');
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const onlineUsersList = document.getElementById('online-users');
    const mobileOnlineUsersList = document.getElementById('mobile-online-users');
    const onlineCount = document.getElementById('online-count');
    const mobileUsersButton = document.getElementById('mobile-users-button');
    const mobileUsersPanel = document.getElementById('mobile-users-panel');
    const closeUsersPanel = document.getElementById('close-users-panel');

    // Connect to Socket.io server
    const socket = io();

    // Current username
    let currentUsername = '';

    // Event Listeners
    loginButton.addEventListener('click', handleLogin);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    mobileUsersButton.addEventListener('click', () => {
        mobileUsersPanel.classList.remove('translate-x-full');
    });
    closeUsersPanel.addEventListener('click', () => {
        mobileUsersPanel.classList.add('translate-x-full');
    });

    // Socket.io Event Handlers
    socket.on('username-accepted', (username) => {
        currentUsername = username;
        loginModal.classList.add('hidden');
        chatInterface.classList.remove('hidden');
        messageInput.focus();
    });

    socket.on('username-error', (error) => {
        usernameError.textContent = error;
        usernameError.classList.remove('hidden');
    });

    socket.on('user-list', (users) => {
        updateOnlineUsers(users);
    });

    socket.on('new-message', (message) => {
        addMessageToChat(message, message.username === currentUsername);
    });

    socket.on('message-history', (history) => {
        messagesContainer.innerHTML = '';
        history.forEach(message => {
            addMessageToChat(message, message.username === currentUsername);
        });
    });

    socket.on('user-joined', (username) => {
        addSystemMessage(`${username} joined the chat`);
    });

    socket.on('user-left', (username) => {
        addSystemMessage(`${username} left the chat`);
    });

    // Functions
    function handleLogin() {
        const username = usernameInput.value.trim();
        if (username) {
            socket.emit('set-username', username);
        } else {
            usernameError.textContent = 'Please enter a username';
            usernameError.classList.remove('hidden');
        }
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            socket.emit('send-message', message);
            messageInput.value = '';
        }
        messageInput.focus();
    }

    function addMessageToChat(message, isCurrentUser) {
        const messageElement = document.createElement('div');
        messageElement.className = `flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`;

        messageElement.innerHTML = `
            <div class="max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}">
                <div class="font-semibold">${message.username}</div>
                <div class="break-words">${message.text}</div>
                <div class="text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}">
                    ${new Date(message.timestamp).toLocaleTimeString()}
                </div>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function addSystemMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'flex justify-center';
        messageElement.innerHTML = `
            <div class="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
                ${text}
            </div>
        `;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function updateOnlineUsers(users) {
        onlineUsersList.innerHTML = '';
        mobileOnlineUsersList.innerHTML = '';
        
        users.forEach(user => {
            const userElement = document.createElement('li');
            userElement.className = 'flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md';
            userElement.innerHTML = `
                <div class="h-3 w-3 rounded-full bg-green-500"></div>
                <span>${user.username}</span>
            `;
            
            onlineUsersList.appendChild(userElement.cloneNode(true));
            mobileOnlineUsersList.appendChild(userElement);
        });
        
        onlineCount.textContent = `${users.length} online`;
    }
});