// Firebase imports (using v9+ modular SDK)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNWi4t8DHmRDLKn3QYF55CwO6xxhDW9xw",
  authDomain: "chat-6d780.firebaseapp.com",
  projectId: "chat-6d780",
  storageBucket: "chat-6d780.firebasestorage.app",
  messagingSenderId: "403244959001",
  appId: "1:403244959001:web:5c6a2a3cf0d67b9e8e7188"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Application State
class ChatApp {
  constructor() {
    this.currentUser = null;
    this.currentChatId = null;
    this.currentChatUser = null;
    this.unsubscribeMessages = null;
    this.unsubscribeUsers = null;
    this.typingTimeout = null;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];

    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    console.log('ChatApp initializing...');
    this.initializeElements();
    this.setupEventListeners();
    this.setupAuthStateListener();
    this.loadTheme();
    this.hideLoadingScreen();
  }

  initializeElements() {
    // Screens
    this.loadingScreen = document.getElementById('loading-screen');
    this.authScreen = document.getElementById('auth-screen');
    this.chatApp = document.getElementById('chat-app');

    // Auth elements
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.tabBtns = document.querySelectorAll('.form-tabs .tab-btn');
    this.tabContents = document.querySelectorAll('.auth-form .tab-content');

    // Forms
    this.emailLoginForm = document.getElementById('email-login-form');
    this.emailRegisterForm = document.getElementById('email-register-form');
    this.phoneLoginForm = document.getElementById('phone-login-form');

    // Input fields
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.displayNameInput = document.getElementById('display-name');
    this.registerEmailInput = document.getElementById('register-email');
    this.registerPasswordInput = document.getElementById('register-password');
    this.phoneInput = document.getElementById('phone');
    this.otpInput = document.getElementById('otp-code');

    // Buttons
    this.googleSignInBtn = document.getElementById('google-signin-btn');
    this.sendOtpBtn = document.getElementById('send-otp');
    this.verifyOtpBtn = document.getElementById('verify-otp');
    this.showRegisterBtn = document.getElementById('show-register');
    this.showLoginBtn = document.getElementById('show-login');
    this.passwordToggle = document.getElementById('password-toggle');
    this.themeToggle = document.getElementById('theme-toggle');
    this.logoutBtn = document.getElementById('logout-btn');

    // Chat elements
    this.sidebar = document.querySelector('.sidebar');
    this.currentUserAvatar = document.getElementById('current-user-avatar');
    this.currentUserName = document.getElementById('current-user-name');
    this.searchUsersInput = document.getElementById('search-users');
    this.chatsListTab = document.querySelector('.chat-tabs [data-tab="chats"]');
    this.usersListTab = document.querySelector('.chat-tabs [data-tab="users"]');
    this.chatsList = document.getElementById('chats-list');
    this.usersList = document.getElementById('users-list');
    this.welcomeScreen = document.getElementById('welcome-screen');
    this.activeChat = document.getElementById('active-chat');
    this.mobileBackBtn = document.getElementById('mobile-back');

    // Active chat elements
    this.chatUserAvatar = document.getElementById('chat-user-avatar');
    this.chatUserName = document.getElementById('chat-user-name');
    this.chatUserStatus = document.getElementById('chat-user-status');
    this.typingIndicator = document.getElementById('typing-indicator');
    this.messagesContainer = document.getElementById('messages-container');
    this.messageInput = document.getElementById('message-input');
    this.sendMessageBtn = document.getElementById('send-message-btn');

    // Action buttons
    this.newChatBtn = document.getElementById('new-chat-btn');
    this.attachFileBtn = document.getElementById('attach-file-btn');
    this.emojiBtn = document.getElementById('emoji-btn');
    this.voiceRecordBtn = document.getElementById('voice-record-btn');
    this.voiceCallBtn = document.getElementById('voice-call-btn');
    this.videoCallBtn = document.getElementById('video-call-btn');

    // Modals
    this.fileModal = document.getElementById('file-modal');
    this.newChatModal = document.getElementById('new-chat-modal');
    this.voiceModal = document.getElementById('voice-modal');
    this.fileInput = document.getElementById('file-input');
    this.hiddenFileInput = document.getElementById('hidden-file-input');

    console.log('Elements initialized');
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');

    // Theme toggle - fix the event listener
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Theme toggle clicked');
        this.toggleTheme();
      });
    }

    // Auth form switching - fix these selectors
    if (this.showRegisterBtn) {
      this.showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Show register clicked');
        this.showRegisterForm();
      });
    }

    if (this.showLoginBtn) {
      this.showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Show login clicked');
        this.showLoginForm();
      });
    }

    // Tab switching - fix the tab functionality
    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const tabName = btn.getAttribute('data-tab');
          console.log('Tab clicked:', tabName);
          this.switchTab(tabName);
        });
      });
    }

    // Chat tabs
    if (this.chatsListTab) {
      this.chatsListTab.addEventListener('click', (e) => {
        e.preventDefault();
        this.showChatsTab();
      });
    }

    if (this.usersListTab) {
      this.usersListTab.addEventListener('click', (e) => {
        e.preventDefault();
        this.showUsersTab();
      });
    }

    // Password toggle - fix this functionality
    if (this.passwordToggle) {
      this.passwordToggle.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Password toggle clicked');
        this.togglePasswordVisibility();
      });
    }

    // Authentication
    if (this.emailLoginForm) {
      this.emailLoginForm.addEventListener('submit', (e) => this.handleEmailLogin(e));
    }

    if (this.emailRegisterForm) {
      this.emailRegisterForm.addEventListener('submit', (e) => this.handleEmailRegister(e));
    }

    if (this.googleSignInBtn) {
      this.googleSignInBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleGoogleSignIn();
      });
    }

    if (this.sendOtpBtn) {
      this.sendOtpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSendOtp();
      });
    }

    if (this.verifyOtpBtn) {
      this.verifyOtpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleVerifyOtp();
      });
    }

    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }

    // Search
    if (this.searchUsersInput) {
      this.searchUsersInput.addEventListener('input', (e) => {
        this.handleUserSearch(e.target.value);
      });
    }

    // Message input
    if (this.messageInput) {
      this.messageInput.addEventListener('input', () => {
        this.handleTyping();
        this.autoResizeTextarea();
      });

      this.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Send message
    if (this.sendMessageBtn) {
      this.sendMessageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.sendMessage();
      });
    }

    // File upload
    if (this.attachFileBtn) {
      this.attachFileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showFileModal();
      });
    }

    if (this.hiddenFileInput) {
      this.hiddenFileInput.addEventListener('change', (e) => {
        this.handleFileSelect(e);
      });
    }

    // Voice recording
    if (this.voiceRecordBtn) {
      this.voiceRecordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.startVoiceRecording();
      });
    }

    // New chat
    if (this.newChatBtn) {
      this.newChatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showNewChatModal();
      });
    }

    // Mobile back
    if (this.mobileBackBtn) {
      this.mobileBackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.hideMobileChat();
      });
    }

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeModals();
      });
    });

    // Click outside modal to close
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModals();
      }
    });

    // Voice/Video calls (placeholder)
    if (this.voiceCallBtn) {
      this.voiceCallBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showNotification('Voice calls coming soon!');
      });
    }

    if (this.videoCallBtn) {
      this.videoCallBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showNotification('Video calls coming soon!');
      });
    }

    console.log('Event listeners set up');
  }

  hideLoadingScreen() {
    setTimeout(() => {
      if (this.loadingScreen) {
        this.loadingScreen.classList.add('hidden');
      }
    }, 1500);
  }

  // Theme Management
  loadTheme() {
    const savedTheme = localStorage.getItem('chatmax-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
    console.log('Theme loaded:', savedTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('chatmax-theme', newTheme);
    this.updateThemeIcon(newTheme);
    this.showNotification(`Switched to ${newTheme} mode`, 'success');
    console.log('Theme toggled to:', newTheme);
  }

  updateThemeIcon(theme) {
    if (this.themeToggle) {
      const icon = this.themeToggle.querySelector('.material-icons');
      if (icon) {
        icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
      }
    }
  }

  // Auth Form Management
  showRegisterForm() {
    console.log('Showing register form');
    if (this.loginForm && this.registerForm) {
      this.loginForm.classList.remove('active');
      this.registerForm.classList.add('active');
    }
  }

  showLoginForm() {
    console.log('Showing login form');
    if (this.registerForm && this.loginForm) {
      this.registerForm.classList.remove('active');
      this.loginForm.classList.add('active');
    }
  }

  switchTab(tabName) {
    console.log('Switching to tab:', tabName);

    // Update tab buttons
    this.tabBtns.forEach(btn => {
      const isActive = btn.getAttribute('data-tab') === tabName;
      if (isActive) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update tab content - fix selector to match HTML structure
    const tabContents = document.querySelectorAll('#login-form .tab-content');
    tabContents.forEach(content => {
      const isActive = content.getAttribute('data-tab') === tabName;
      if (isActive) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }

  togglePasswordVisibility() {
    if (this.passwordInput) {
      const currentType = this.passwordInput.type;
      const newType = currentType === 'password' ? 'text' : 'password';
      this.passwordInput.type = newType;

      const icon = this.passwordToggle.querySelector('.material-icons');
      if (icon) {
        icon.textContent = newType === 'password' ? 'visibility' : 'visibility_off';
      }

      console.log('Password visibility toggled to:', newType);
    }
  }

  // Authentication Methods
  async handleEmailLogin(e) {
    e.preventDefault();

    if (!this.emailInput || !this.passwordInput) {
      this.showNotification('Form elements not found', 'error');
      return;
    }

    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value;

    if (!email || !password) {
      this.showNotification('Please fill in all fields', 'error');
      return;
    }

    try {
      this.showNotification('Signing in...', 'info');
      await signInWithEmailAndPassword(auth, email, password);
      this.showNotification('Logged in successfully!', 'success');
    } catch (error) {
      console.error('Login error:', error);
      this.showNotification(this.getErrorMessage(error.code), 'error');
    }
  }

  async handleEmailRegister(e) {
    e.preventDefault();

    if (!this.displayNameInput || !this.registerEmailInput || !this.registerPasswordInput) {
      this.showNotification('Form elements not found', 'error');
      return;
    }

    const displayName = this.displayNameInput.value.trim();
    const email = this.registerEmailInput.value.trim();
    const password = this.registerPasswordInput.value;

    if (!displayName || !email || !password) {
      this.showNotification('Please fill in all fields', 'error');
      return;
    }

    if (password.length < 6) {
      this.showNotification('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      this.showNotification('Creating account...', 'info');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      await this.createUserDocument(userCredential.user);
      this.showNotification('Account created successfully!', 'success');
    } catch (error) {
      console.error('Register error:', error);
      this.showNotification(this.getErrorMessage(error.code), 'error');
    }
  }

  async handleGoogleSignIn() {
    try {
      this.showNotification('Signing in with Google...', 'info');
      const result = await signInWithPopup(auth, googleProvider);
      await this.createUserDocument(result.user);
      this.showNotification('Logged in with Google!', 'success');
    } catch (error) {
      console.error('Google sign in error:', error);
      this.showNotification(this.getErrorMessage(error.code), 'error');
    }
  }

  handleSendOtp() {
    if (!this.phoneInput) {
      this.showNotification('Phone input not found', 'error');
      return;
    }

    const phone = this.phoneInput.value.trim();
    if (!phone) {
      this.showNotification('Please enter a phone number', 'error');
      return;
    }

    // Simulate OTP sending
    const otpSection = document.getElementById('otp-verification');
    if (otpSection) {
      otpSection.classList.remove('hidden');
    }
    this.showNotification('OTP sent to ' + phone, 'success');
  }

  handleVerifyOtp() {
    if (!this.otpInput) {
      this.showNotification('OTP input not found', 'error');
      return;
    }

    const otp = this.otpInput.value.trim();
    if (otp.length !== 6) {
      this.showNotification('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    // Simulate OTP verification
    this.showNotification('Phone authentication coming soon!', 'info');
  }

  async handleLogout() {
    try {
      await signOut(auth);
      this.showNotification('Logged out successfully!', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      this.showNotification('Error logging out', 'error');
    }
  }

  // User Document Management
  async createUserDocument(user) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || 'Anonymous User',
          email: user.email,
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/avatars/svg?seed=${user.uid}`,
          isOnline: true,
          lastSeen: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      } else {
        await updateDoc(userRef, {
          isOnline: true,
          lastSeen: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }

  // Auth State Listener
  setupAuthStateListener() {
    onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'logged in' : 'logged out');
      if (user) {
        this.currentUser = user;
        this.showChatApp();
        this.loadUserData();
        this.loadUsers();
        this.loadChats();
      } else {
        this.currentUser = null;
        this.showAuthScreen();
        this.cleanup();
      }
    });
  }

  showAuthScreen() {
    if (this.authScreen && this.chatApp) {
      this.authScreen.classList.remove('hidden');
      this.chatApp.classList.add('hidden');
    }
  }

  showChatApp() {
    if (this.authScreen && this.chatApp) {
      this.authScreen.classList.add('hidden');
      this.chatApp.classList.remove('hidden');
    }
  }

  cleanup() {
    if (this.unsubscribeMessages) {
      this.unsubscribeMessages();
      this.unsubscribeMessages = null;
    }
    if (this.unsubscribeUsers) {
      this.unsubscribeUsers();
      this.unsubscribeUsers = null;
    }
  }

  // User Data Loading
  loadUserData() {
    if (this.currentUser) {
      if (this.currentUserName) {
        this.currentUserName.textContent = this.currentUser.displayName || 'Anonymous';
      }
      if (this.currentUserAvatar) {
        this.currentUserAvatar.src = this.currentUser.photoURL || `https://api.dicebear.com/7.x/avatars/svg?seed=${this.currentUser.uid}`;
      }
    }
  }

  // Chat Management
  showChatsTab() {
    const chatsTab = document.querySelector('.chat-tabs [data-tab="chats"]');
    const usersTab = document.querySelector('.chat-tabs [data-tab="users"]');

    if (chatsTab) chatsTab.classList.add('active');
    if (usersTab) usersTab.classList.remove('active');

    if (this.chatsList) this.chatsList.classList.add('active');
    if (this.usersList) this.usersList.classList.remove('active');
  }

  showUsersTab() {
    const chatsTab = document.querySelector('.chat-tabs [data-tab="chats"]');
    const usersTab = document.querySelector('.chat-tabs [data-tab="users"]');

    if (usersTab) usersTab.classList.add('active');
    if (chatsTab) chatsTab.classList.remove('active');

    if (this.usersList) this.usersList.classList.add('active');
    if (this.chatsList) this.chatsList.classList.remove('active');
  }

  async loadUsers() {
    if (this.unsubscribeUsers) {
      this.unsubscribeUsers();
    }

    try {
      const usersQuery = query(collection(db, 'users'));
      this.unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        this.renderUsers(snapshot.docs);
      });
    } catch (error) {
      console.error('Error loading users:', error);
      // Show some sample users for demo
      this.showSampleUsers();
    }
  }

  showSampleUsers() {
    if (!this.usersList) return;

    const sampleUsers = [
      { uid: '1', displayName: 'Alice Johnson', email: 'alice@example.com', isOnline: true, photoURL: 'https://api.dicebear.com/7.x/avatars/svg?seed=alice' },
      { uid: '2', displayName: 'Bob Smith', email: 'bob@example.com', isOnline: false, photoURL: 'https://api.dicebear.com/7.x/avatars/svg?seed=bob' },
      { uid: '3', displayName: 'Carol Davis', email: 'carol@example.com', isOnline: true, photoURL: 'https://api.dicebear.com/7.x/avatars/svg?seed=carol' },
      { uid: '4', displayName: 'David Wilson', email: 'david@example.com', isOnline: false, photoURL: 'https://api.dicebear.com/7.x/avatars/svg?seed=david' }
    ];

    this.renderUsers(sampleUsers.map(user => ({ data: () => user })));
  }

  renderUsers(userDocs) {
    if (!this.usersList) return;

    this.usersList.innerHTML = '';

    userDocs.forEach(doc => {
      const userData = typeof doc.data === 'function' ? doc.data() : doc;
      if (this.currentUser && userData.uid === this.currentUser.uid) return; // Don't show current user

      const userElement = this.createUserElement(userData);
      this.usersList.appendChild(userElement);
    });
  }

  createUserElement(userData) {
    const div = document.createElement('div');
    div.className = 'user-item';
    div.innerHTML = `
      <img src="${userData.photoURL || `https://api.dicebear.com/7.x/avatars/svg?seed=${userData.uid}`}" 
           alt="${userData.displayName}" class="avatar">
      <div class="user-item-info">
        <div class="user-item-name">${userData.displayName || 'Anonymous'}</div>
        <div class="user-item-email">${userData.email || ''}</div>
      </div>
      <div class="user-status ${userData.isOnline ? 'online' : 'offline'}">
        ${userData.isOnline ? 'Online' : 'Offline'}
      </div>
    `;

    div.addEventListener('click', () => this.startChat(userData));
    return div;
  }

  async startChat(userData) {
    this.currentChatUser = userData;
    this.currentChatId = this.generateChatId(
      this.currentUser ? this.currentUser.uid : 'demo-user',
      userData.uid
    );

    this.showActiveChat();
    this.loadMessages();
    this.updateChatHeader(userData);

    // Close modals
    this.closeModals();

    // On mobile, hide sidebar
    if (window.innerWidth <= 768) {
      this.sidebar.classList.remove('active');
    }

    this.showNotification(`Started chat with ${userData.displayName}`, 'success');
  }

  generateChatId(uid1, uid2) {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  }

  showActiveChat() {
    if (this.welcomeScreen && this.activeChat) {
      this.welcomeScreen.classList.add('hidden');
      this.activeChat.classList.remove('hidden');
    }
  }

  updateChatHeader(userData) {
    if (this.chatUserName) {
      this.chatUserName.textContent = userData.displayName || 'Anonymous';
    }
    if (this.chatUserAvatar) {
      this.chatUserAvatar.src = userData.photoURL || `https://api.dicebear.com/7.x/avatars/svg?seed=${userData.uid}`;
    }
    if (this.chatUserStatus) {
      this.chatUserStatus.textContent = userData.isOnline ? 'Online' : 'Offline';
      this.chatUserStatus.className = `user-status ${userData.isOnline ? 'online' : 'offline'}`;
    }
  }

  loadMessages() {
    if (this.unsubscribeMessages) {
      this.unsubscribeMessages();
    }

    // For demo purposes, show sample messages
    this.showSampleMessages();
  }

  showSampleMessages() {
    if (!this.messagesContainer) return;

    const sampleMessages = [
      {
        senderId: this.currentChatUser?.uid || 'other',
        text: 'Hey there! How are you doing?',
        createdAt: new Date(Date.now() - 300000), // 5 minutes ago
        type: 'text'
      },
      {
        senderId: this.currentUser?.uid || 'me',
        text: 'Hi! I\'m doing great, thanks for asking! How about you?',
        createdAt: new Date(Date.now() - 240000), // 4 minutes ago
        type: 'text'
      },
      {
        senderId: this.currentChatUser?.uid || 'other',
        text: 'I\'m doing well too! This chat app looks amazing!',
        createdAt: new Date(Date.now() - 180000), // 3 minutes ago
        type: 'text'
      }
    ];

    this.renderMessages(sampleMessages.map(msg => ({ data: () => msg })));
  }

  renderMessages(messageDocs) {
    if (!this.messagesContainer) return;

    this.messagesContainer.innerHTML = '';

    messageDocs.forEach(doc => {
      const messageData = typeof doc.data === 'function' ? doc.data() : doc;
      const messageElement = this.createMessageElement(messageData);
      this.messagesContainer.appendChild(messageElement);
    });

    this.scrollToBottom();
  }

  createMessageElement(messageData) {
    const div = document.createElement('div');
    const isCurrentUser = this.currentUser && messageData.senderId === this.currentUser.uid;
    div.className = `message-bubble ${isCurrentUser ? 'sent' : 'received'}`;

    let content = '';

    if (messageData.type === 'text') {
      content = `
        <div class="message-content">${this.escapeHtml(messageData.text)}</div>
        <div class="message-meta">
          <span class="message-time">${this.formatTime(messageData.createdAt)}</span>
          ${isCurrentUser ? '<span class="message-status">✓</span>' : ''}
        </div>
      `;
    }

    div.innerHTML = content;
    return div;
  }

  async sendMessage() {
    if (!this.messageInput || !this.currentChatId) return;

    const text = this.messageInput.value.trim();
    if (!text) return;

    try {
      // For demo purposes, just add the message to the UI
      const messageData = {
        senderId: this.currentUser?.uid || 'me',
        text: text,
        createdAt: new Date(),
        type: 'text'
      };

      const messageElement = this.createMessageElement(messageData);
      this.messagesContainer.appendChild(messageElement);

      this.messageInput.value = '';
      this.autoResizeTextarea();
      this.scrollToBottom();

      this.showNotification('Message sent!', 'success');

      // In a real app, you would save to Firestore here
      /*
      await addDoc(collection(db, 'chats', this.currentChatId, 'messages'), {
        text,
        senderId: this.currentUser.uid,
        senderName: this.currentUser.displayName,
        receiverId: this.currentChatUser.uid,
        type: 'text',
        createdAt: serverTimestamp()
      });
      */
    } catch (error) {
      console.error('Error sending message:', error);
      this.showNotification('Error sending message', 'error');
    }
  }

  // File Upload
  showFileModal() {
    if (this.fileModal) {
      this.fileModal.classList.remove('hidden');
    }

    // Trigger hidden file input
    if (this.hiddenFileInput) {
      this.hiddenFileInput.click();
    }
  }

  handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    this.showNotification(`${files.length} file(s) selected. File upload coming soon!`, 'info');
    this.closeModals();
  }

  // Voice Recording (Simulated)
  async startVoiceRecording() {
    if (!this.currentChatId) return;

    if (this.voiceModal) {
      this.voiceModal.classList.remove('hidden');
    }

    this.isRecording = true;

    // Simulate recording
    let seconds = 0;
    const updateTimer = () => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      const timeElement = document.getElementById('recording-time');
      if (timeElement) {
        timeElement.textContent =
          `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
      }
      seconds++;
    };

    const recordingInterval = setInterval(updateTimer, 1000);

    const stopBtn = document.getElementById('stop-recording');
    const cancelBtn = document.getElementById('cancel-recording');

    if (stopBtn) {
      stopBtn.onclick = () => {
        clearInterval(recordingInterval);
        this.stopVoiceRecording();
      };
    }

    if (cancelBtn) {
      cancelBtn.onclick = () => {
        clearInterval(recordingInterval);
        this.cancelVoiceRecording();
      };
    }
  }

  stopVoiceRecording() {
    this.isRecording = false;
    if (this.voiceModal) {
      this.voiceModal.classList.add('hidden');
    }
    this.showNotification('Voice message feature coming soon!', 'info');
  }

  cancelVoiceRecording() {
    this.isRecording = false;
    if (this.voiceModal) {
      this.voiceModal.classList.add('hidden');
    }
  }

  // User Search
  handleUserSearch(query) {
    if (!this.usersList) return;

    const userItems = this.usersList.querySelectorAll('.user-item');
    userItems.forEach(item => {
      const name = item.querySelector('.user-item-name')?.textContent.toLowerCase() || '';
      const email = item.querySelector('.user-item-email')?.textContent.toLowerCase() || '';
      const matches = name.includes(query.toLowerCase()) || email.includes(query.toLowerCase());
      item.style.display = matches ? 'flex' : 'none';
    });
  }

  // New Chat Modal
  showNewChatModal() {
    if (this.newChatModal) {
      this.newChatModal.classList.remove('hidden');
    }
    this.loadUsersForNewChat();
  }

  async loadUsersForNewChat() {
    const container = document.getElementById('new-chat-users');
    if (!container) return;

    // Show sample users for demo
    this.showSampleUsers();
  }

  // Typing Indicator
  handleTyping() {
    if (!this.currentChatId) return;

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // In a real app, you'd send typing indicator to other users
    this.typingTimeout = setTimeout(() => {
      // Hide typing indicator after 2 seconds of inactivity
    }, 2000);
  }

  // Mobile Support
  hideMobileChat() {
    if (this.activeChat && this.welcomeScreen) {
      this.activeChat.classList.add('hidden');
      this.welcomeScreen.classList.remove('hidden');
    }
  }

  // Utility Methods
  autoResizeTextarea() {
    if (!this.messageInput) return;

    this.messageInput.style.height = 'auto';
    this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No user found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
      <span class="material-icons">
        ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
      </span>
      <span>${message}</span>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--bg-primary);
      color: var(--text-primary);
      padding: 1rem 1.5rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      z-index: 10000;
      animation: slideInFromRight 0.3s ease;
      border-left: 4px solid ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--info)'};
      max-width: 300px;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);
  }

  closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.add('hidden');
    });
  }

  loadChats() {
    // In a real app, you would load existing chats here
    // For now, we'll just show the users list
    this.showUsersTab();
  }
}

// Initialize the app
new ChatApp();