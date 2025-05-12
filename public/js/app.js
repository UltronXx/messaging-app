// App state
const state = {
    isAuthenticated: false,
    user: null,
    token: null,
    currentContact: null,
    contacts: [],
    messages: {},
    socket: null
};

// DOM elements
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const authTabs = document.querySelectorAll('.auth-tab');
const contactsList = document.getElementById('contacts-list');
const userName = document.getElementById('user-name');
const contactSearch = document.getElementById('contact-search');
const logoutBtn = document.getElementById('logout-btn');
const addContactBtn = document.getElementById('add-contact-btn');
const addContactModal = document.getElementById('add-contact-modal');
const closeModalBtn = document.querySelector('.close-modal');
const userSearch = document.getElementById('user-search');
const searchResults = document.getElementById('search-results');
const messagesContainer = document.getElementById('messages-container');
const chatArea = document.querySelector('.chat-area');
const emptyChat = document.querySelector('.empty-chat-placeholder');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const contactName = document.getElementById('contact-name');
const contactStatus = document.getElementById('contact-status');
const typingIndicator = document.querySelector('.typing-indicator');

// Initialize the app
function init() {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (token && user) {
        state.isAuthenticated = true;
        state.user = user;
        state.token = token;
        showMainScreen();
        setupSocket();
        loadContacts();
    } else {
        showAuthScreen();
    }
    
    // Set up event listeners
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    // Auth tabs
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const tabName = tab.getAttribute('data-tab');
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(`${tabName}-form`).classList.add('active');
        });
    });
    
    // Auth forms
    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);
    
    // Main screen
    logoutBtn.addEventListener('click', handleLogout);
    addContactBtn.addEventListener('click', () => {
        addContactModal.classList.add('active');
    });
    
    closeModalBtn.addEventListener('click', () => {
        addContactModal.classList.remove('active');
    });
    
    // Contact search
    userSearch.addEventListener('input', debounce(handleUserSearch, 500));
    contactSearch.addEventListener('input', filterContacts);
    
    // Messaging
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    messageInput.addEventListener('input', handleTyping);
    sendMessageBtn.addEventListener('click', sendMessage);
    
    // Mobile view navigation
    document.addEventListener('click', (e) => {
        if (e.target.closest('.contact-item')) {
            document.querySelector('.chat-container').classList.add('active');
        }
        
        if (e.target.closest('.chat-header .fa-arrow-left')) {
            document.querySelector('.chat-container').classList.remove('active');
        }
    });
}

// Show auth screen
function showAuthScreen() {
    authScreen.classList.add('active');
    mainScreen.classList.remove('active');
}

// Show main screen
function showMainScreen() {
    authScreen.classList.remove('active');
    mainScreen.classList.add('active');
    userName.textContent = state.user.username;
}

// Handle login
async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        setError(loginError, 'Please enter email and password');
        return;
    }
    
    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        // Save user data and token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        state.isAuthenticated = true;
        state.user = data.user;
        state.token = data.token;
        
        showMainScreen();
        setupSocket();
        loadContacts();
    } catch (err) {
        setError(loginError, err.message);
    }
}

// Handle registration
async function handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    
    if (!username || !email || !password) {
        setError(registerError, 'Please fill in all fields');
        return;
    }
    
    if (password !== passwordConfirm) {
        setError(registerError, 'Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        setError(registerError, 'Password must be at least 6 characters');
        return;
    }
    
    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        
        // Save user data and token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        state.isAuthenticated = true;
        state.user = data.user;
        state.token = data.token;
        
        showMainScreen();
        setupSocket();
    } catch (err) {
        setError(registerError, err.message);
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    state.isAuthenticated = false;
    state.user = null;
    state.token = null;
    state.contacts = [];
    state.messages = {};
    state.currentContact = null;
    
    if (state.socket) {
        state.socket.disconnect();
        state.socket = null;
    }
    
    showAuthScreen();
}

// Set error message
function setError(element, message) {
    element.textContent = message;
    
    // Clear after 5 seconds
    setTimeout(() => {
        element.textContent = '';
    }, 5000);
}

// Load contacts
async function loadContacts() {
    try {
        const response = await fetch('/api/users/contacts', {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load contacts');
        }
        
        state.contacts = data.contacts;
        renderContacts();
        
        // Load unread message counts
        loadUnreadCounts();
    } catch (err) {
        console.error('Error loading contacts:', err);
    }
}

// Load unread message counts
async function loadUnreadCounts() {
    try {
        const response = await fetch('/api/messages/unread', {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load unread counts');
        }
        
        // Update contact items with unread counts
        data.unreadCounts.forEach(item => {
            const contactElement = document.querySelector(`.contact-item[data-id="${item.sender_id}"]`);
            if (contactElement) {
                const badge = contactElement.querySelector('.unread-badge') || document.createElement('div');
                badge.className = 'unread-badge';
                badge.textContent = item.count;
                
                const metaElement = contactElement.querySelector('.contact-meta');
                if (metaElement) {
                    metaElement.appendChild(badge);
                }
            }
        });
    } catch (err) {
        console.error('Error loading unread counts:', err);
    }
}

// Render contacts
function renderContacts() {
    if (state.contacts.length === 0) {
        contactsList.innerHTML = '<div class="empty-list-message">No contacts yet. Add someone to start chatting!</div>';
        return;
    }
    
    contactsList.innerHTML = '';
    
    state.contacts.forEach(contact => {
        const contactElement = document.createElement('div');
        contactElement.className = 'contact-item';
        contactElement.setAttribute('data-id', contact.id);
        
        const lastMessage = state.messages[contact.id] && state.messages[contact.id].length > 0
            ? state.messages[contact.id][0]
            : null;
        
        // Format time
        const timeStr = lastMessage ? formatTime(new Date(lastMessage.created_at)) : '';
        
        // Format last message
        const lastMessageStr = lastMessage ? lastMessage.content : 'No messages yet';
        
        contactElement.innerHTML = `
            <img src="/img/default-avatar.png" alt="${contact.username}" class="contact-avatar">
            <div class="contact-info">
                <div class="contact-name">${contact.username}</div>
                <div class="contact-last-message">${lastMessageStr}</div>
            </div>
            <div class="contact-meta">
                <span class="message-time">${timeStr}</span>
            </div>
        `;
        
        contactElement.addEventListener('click', () => {
            selectContact(contact);
        });
        
        contactsList.appendChild(contactElement);
    });
}

// Select a contact
function selectContact(contact) {
    // Remove active class from all contacts
    document.querySelectorAll('.contact-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected contact
    const contactElement = document.querySelector(`.contact-item[data-id="${contact.id}"]`);
    if (contactElement) {
        contactElement.classList.add('active');
        
        // Remove unread badge
        const badge = contactElement.querySelector('.unread-badge');
        if (badge) {
            badge.remove();
        }
    }
    
    state.currentContact = contact;
    contactName.textContent = contact.username;
    
    // Load conversation
    loadConversation(contact.id);
    
    // Show chat area
    chatArea.classList.remove('hidden');
    emptyChat.classList.add('hidden');
}

// Load conversation
async function loadConversation(contactId) {
    try {
        const response = await fetch(`/api/messages/conversation/${contactId}`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load conversation');
        }
        
        state.messages[contactId] = data.messages;
        renderMessages(data.messages);
    } catch (err) {
        console.error('Error loading conversation:', err);
    }
}

// Render messages
function renderMessages(messages) {
    messagesContainer.innerHTML = '';
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = '<div class="no-messages">No messages yet. Start the conversation!</div>';
        return;
    }
    
    // Sort messages by timestamp (oldest first)
    const sortedMessages = [...messages].sort((a, b) => {
        return new Date(a.created_at) - new Date(b.created_at);
    });
    
    sortedMessages.forEach(message => {
        const isSent = message.sender_id === state.user.id;
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
        
        const time = formatTime(new Date(message.created_at));
        
        messageElement.innerHTML = `
            <div class="message-content">${message.content}</div>
            <div class="message-time">${time}</div>
        `;
        
        messagesContainer.appendChild(messageElement);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message
function sendMessage() {
    const content = messageInput.value.trim();
    
    if (!content || !state.currentContact) {
        return;
    }
    
    const messageData = {
        senderId: state.user.id,
        recipientId: state.currentContact.id,
        content
    };
    
    // Send through socket.io
    state.socket.emit('send-message', messageData);
    
    // Clear input
    messageInput.value = '';
    messageInput.focus();
    
    // Show message immediately (optimistic UI)
    const newMessage = {
        id: 'temp-' + Date.now(),
        sender_id: state.user.id,
        recipient_id: state.currentContact.id,
        content,
        created_at: new Date().toISOString(),
        read_at: null
    };
    
    // Add to message array
    if (!state.messages[state.currentContact.id]) {
        state.messages[state.currentContact.id] = [];
    }
    
    state.messages[state.currentContact.id].unshift(newMessage);
    
    // Update UI
    renderMessages(state.messages[state.currentContact.id]);
    updateContactLastMessage(state.currentContact.id, content);
}

// Update contact's last message
function updateContactLastMessage(contactId, content) {
    const contactElement = document.querySelector(`.contact-item[data-id="${contactId}"]`);
    if (contactElement) {
        const lastMessageElement = contactElement.querySelector('.contact-last-message');
        const timeElement = contactElement.querySelector('.message-time');
        
        if (lastMessageElement) {
            lastMessageElement.textContent = content;
        }
        
        if (timeElement) {
            timeElement.textContent = 'Just now';
        }
        
        // Move contact to top of list
        contactsList.prepend(contactElement);
    }
}

// Handle typing indicator
let typingTimeout;
function handleTyping() {
    if (!state.currentContact) return;
    
    state.socket.emit('typing', {
        senderId: state.user.id,
        recipientId: state.currentContact.id,
        isTyping: true
    });
    
    // Clear previous timeout
    clearTimeout(typingTimeout);
    
    // Set new timeout to indicate stopped typing
    typingTimeout = setTimeout(() => {
        state.socket.emit('typing', {
            senderId: state.user.id,
            recipientId: state.currentContact.id,
            isTyping: false
        });
    }, 1000);
}

// Handle user search
async function handleUserSearch() {
    const query = userSearch.value.trim();
    
    if (query.length < 3) {
        searchResults.innerHTML = '<div class="search-message">Type at least 3 characters to search</div>';
        return;
    }
    
    try {
        const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Search failed');
        }
        
        renderSearchResults(data.users);
    } catch (err) {
        console.error('Search error:', err);
        searchResults.innerHTML = `<div class="search-message">Search error: ${err.message}</div>`;
    }
}

// Render search results
function renderSearchResults(users) {
    searchResults.innerHTML = '';
    
    if (users.length === 0) {
        searchResults.innerHTML = '<div class="search-message">No users found</div>';
        return;
    }
    
    users.forEach(user => {
        const isContact = state.contacts.some(contact => contact.id === user.id);
        
        const resultElement = document.createElement('div');
        resultElement.className = 'search-result';
        resultElement.innerHTML = `
            <div class="search-result-info">
                <div class="search-result-name">${user.username}</div>
                <div class="search-result-email">${user.email}</div>
            </div>
            <button class="add-btn ${isContact ? 'added' : ''}" ${isContact ? 'disabled' : ''}>
                ${isContact ? 'Added' : 'Add'}
            </button>
        `;
        
        const addBtn = resultElement.querySelector('.add-btn');
        if (!isContact) {
            addBtn.addEventListener('click', () => {
                addContact(user.id, resultElement);
            });
        }
        
        searchResults.appendChild(resultElement);
    });
}

// Add contact
async function addContact(contactId, resultElement) {
    try {
        const response = await fetch('/api/users/contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ contactId })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to add contact');
        }
        
        // Update UI
        const addBtn = resultElement.querySelector('.add-btn');
        addBtn.textContent = 'Added';
        addBtn.classList.add('added');
        addBtn.disabled = true;
        
        // Add to contacts list and refresh contacts
        state.contacts.push(data.contact);
        renderContacts();
        
        // Close modal
        setTimeout(() => {
            addContactModal.classList.remove('active');
        }, 1000);
    } catch (err) {
        console.error('Error adding contact:', err);
        alert(`Error adding contact: ${err.message}`);
    }
}

// Filter contacts
function filterContacts() {
    const query = contactSearch.value.trim().toLowerCase();
    
    const contactItems = document.querySelectorAll('.contact-item');
    
    contactItems.forEach(item => {
        const name = item.querySelector('.contact-name').textContent.toLowerCase();
        
        if (name.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Socket.io setup
function setupSocket() {
    // Connect to socket server
    state.socket = io();
    
    // Login with userId
    state.socket.on('connect', () => {
        state.socket.emit('login', state.user.id);
    });
    
    // Listen for new messages
    state.socket.on('new-message', message => {
        // Add message to state
        if (!state.messages[message.sender_id]) {
            state.messages[message.sender_id] = [];
        }
        
        state.messages[message.sender_id].unshift(message);
        
        // Update UI if this is the current conversation
        if (state.currentContact && message.sender_id === state.currentContact.id) {
            renderMessages(state.messages[message.sender_id]);
            
            // Mark as read
            markMessageAsRead(message.id);
        } else {
            // Show unread badge
            updateUnreadBadge(message.sender_id);
        }
        
        // Update last message in contacts list
        updateContactLastMessage(message.sender_id, message.content);
    });
    
    // Listen for message confirmation
    state.socket.on('message-sent', data => {
        // Update message with server ID and timestamp
        if (state.currentContact) {
            const tempMessages = state.messages[state.currentContact.id].filter(m => m.id.startsWith('temp-'));
            if (tempMessages.length > 0) {
                tempMessages[0].id = data.messageId;
                tempMessages[0].created_at = data.timestamp;
            }
        }
    });
    
    // Listen for typing indicators
    state.socket.on('user-typing', data => {
        if (state.currentContact && data.userId === state.currentContact.id) {
            if (data.isTyping) {
                typingIndicator.classList.remove('hidden');
            } else {
                typingIndicator.classList.add('hidden');
            }
        }
    });
    
    // Listen for user status changes
    state.socket.on('user-status', data => {
        // Update contact status if visible
        if (state.currentContact && data.userId === state.currentContact.id) {
            contactStatus.textContent = data.status;
            contactStatus.className = `status ${data.status}`;
        }
    });
}

// Update unread badge
function updateUnreadBadge(senderId) {
    const contactElement = document.querySelector(`.contact-item[data-id="${senderId}"]`);
    if (contactElement) {
        let badge = contactElement.querySelector('.unread-badge');
        
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'unread-badge';
            badge.textContent = '1';
            
            const metaElement = contactElement.querySelector('.contact-meta');
            if (metaElement) {
                metaElement.appendChild(badge);
            }
        } else {
            badge.textContent = parseInt(badge.textContent) + 1;
        }
        
        // Move contact to top of list
        contactsList.prepend(contactElement);
    }
}

// Mark message as read
async function markMessageAsRead(messageId) {
    try {
        await fetch(`/api/messages/${messageId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
    } catch (err) {
        console.error('Error marking message as read:', err);
    }
}

// Format time
function formatTime(date) {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString();
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add a simple avatar for the mobile view
document.addEventListener('DOMContentLoaded', () => {
    // Add back button to chat header for mobile view
    const chatHeader = document.querySelector('.chat-header');
    if (chatHeader) {
        const backBtn = document.createElement('button');
        backBtn.className = 'icon-btn back-btn';
        backBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
        chatHeader.insertBefore(backBtn, chatHeader.firstChild);
    }
});

// Initialize app
init();
