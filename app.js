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

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('ChatMax Pro initializing...');
  new ChatMaxPro();
});

// Main Application Class
class ChatMaxPro {
  constructor() {
    this.currentUser = null;
    this.currentChat = null;
    this.currentTab = 'chats';
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.typingTimeout = null;
    this.unsubscribes = [];
    
    // Mobile-specific properties
    this.touchStartY = 0;
    this.touchStartX = 0;
    this.isScrolling = false;
    this.keyboardHeight = 0;
    
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.setupAuthStateListener();
    this.setupMobileOptimizations();
    this.loadTheme();
    this.hideLoadingScreen();
  }

  setupElements() {
    // Main screens
    this.loadingScreen = document.getElementById('loading-screen');
    this.authScreen = document.getElementById('auth-screen');
    this.chatApp = document.getElementById('chat-app');
    
    // Auth elements
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.emailLoginForm = document.getElementById('email-login-form');
    this.emailRegisterForm = document.getElementById('email-register-form');
    
    // Auth inputs
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.displayNameInput = document.getElementById('display-name');
    this.registerEmailInput = document.getElementById('register-email');
    this.registerPasswordInput = document.getElementById('register-password');
    
    // Auth buttons
    this.googleSignInBtn = document.getElementById('google-signin-btn');
    this.showRegisterBtn = document.getElementById('show-register');
    this.showLoginBtn = document.getElementById('show-login');
    this.passwordToggle = document.getElementById('password-toggle');
    this.logoutBtn = document.getElementById('logout-btn');
    
    // Main app elements
    this.mobileHeader = document.querySelector('.mobile-header');
    this.currentSectionTitle = document.getElementById('current-section-title');
    this.themeToggle = document.getElementById('theme-toggle');
    this.searchToggle = document.getElementById('search-toggle');
    this.menuToggle = document.getElementById('menu-toggle');
    
    // Search elements
    this.mobileSearch = document.getElementById('mobile-search');
    this.globalSearch = document.getElementById('global-search');
    this.searchClose = document.getElementById('search-close');
    this.peopleSearch = document.getElementById('people-search');
    this.advancedSearchBtn = document.getElementById('advanced-search-btn');
    
    // Navigation
    this.bottomNav = document.querySelector('.bottom-nav');
    this.navItems = document.querySelectorAll('.nav-item');
    
    // Tab contents
    this.chatsTab = document.getElementById('chats-tab');
    this.peopleTab = document.getElementById('people-tab');
    this.groupsTab = document.getElementById('groups-tab');
    this.selfTab = document.getElementById('self-tab');
    this.profileTab = document.getElementById('profile-tab');
    
    // Content lists
    this.chatsList = document.getElementById('chats-list');
    this.peopleList = document.getElementById('people-list');
    this.groupsList = document.getElementById('groups-list');
    this.selfNotesList = document.getElementById('self-notes-list');
    
    // FAB elements
    this.mainFab = document.getElementById('main-fab');
    this.fabMenu = document.getElementById('fab-menu');
    this.newChatFab = document.getElementById('new-chat-fab');
    this.newGroupFab = document.getElementById('new-group-fab');
    this.selfNoteFab = document.getElementById('self-note-fab');
    
    // Chat window
    this.chatWindow = document.getElementById('chat-window');
    this.chatBack = document.getElementById('chat-back');
    this.chatAvatar = document.getElementById('chat-avatar');
    this.chatName = document.getElementById('chat-name');
    this.chatStatus = document.getElementById('chat-status');
    this.typingIndicator = document.getElementById('typing-indicator');
    this.messagesWrapper = document.getElementById('messages-wrapper');
    this.messageInput = document.getElementById('message-input');
    this.sendBtn = document.getElementById('send-btn');
    this.voiceBtn = document.getElementById('voice-btn');
    this.attachBtn = document.getElementById('attach-btn');
    this.emojiBtn = document.getElementById('emoji-btn');
    
    // Profile elements
    this.profileAvatar = document.getElementById('profile-avatar');
    this.profileName = document.getElementById('profile-name');
    this.profileEmail = document.getElementById('profile-email');
    this.privacySettings = document.getElementById('privacy-settings');
    this.notificationsSettings = document.getElementById('notifications-settings');
    this.appearanceSettings = document.getElementById('appearance-settings');
    
    // Modals
    this.advancedSearchModal = document.getElementById('advanced-search-modal');
    this.createGroupModal = document.getElementById('create-group-modal');
    this.voiceRecordingModal = document.getElementById('voice-recording-modal');
    this.fileUploadModal = document.getElementById('file-upload-modal');
    this.privacyModal = document.getElementById('privacy-modal');
    
    // Action buttons
    this.createGroupBtn = document.getElementById('create-group-btn');
    this.voiceCall = document.getElementById('voice-call');
    this.videoCall = document.getElementById('video-call');
    this.chatMenu = document.getElementById('chat-menu');
  }

  setupEventListeners() {
    // Theme toggle
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }
    
    // Search toggle
    if (this.searchToggle) {
      this.searchToggle.addEventListener('click', () => this.toggleMobileSearch());
    }
    
    if (this.searchClose) {
      this.searchClose.addEventListener('click', () => this.toggleMobileSearch());
    }
    
    // Auth form switching
    if (this.showRegisterBtn) {
      this.showRegisterBtn.addEventListener('click', () => this.showRegisterForm());
    }
    
    if (this.showLoginBtn) {
      this.showLoginBtn.addEventListener('click', () => this.showLoginForm());
    }
    
    // Password toggle
    if (this.passwordToggle) {
      this.passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
    }
    
    // Auth forms
    if (this.emailLoginForm) {
      this.emailLoginForm.addEventListener('submit', (e) => this.handleEmailLogin(e));
    }
    
    if (this.emailRegisterForm) {
      this.emailRegisterForm.addEventListener('submit', (e) => this.handleEmailRegister(e));
    }
    
    if (this.googleSignInBtn) {
      this.googleSignInBtn.addEventListener('click', () => this.handleGoogleSignIn());
    }
    
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => this.handleLogout());
    }
    
    // Bottom navigation
    this.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = item.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });
    
    // FAB menu
    if (this.mainFab) {
      this.mainFab.addEventListener('click', () => this.toggleFabMenu());
    }
    
    if (this.newChatFab) {
      this.newChatFab.addEventListener('click', () => this.startNewChat());
    }
    
    if (this.newGroupFab) {
      this.newGroupFab.addEventListener('click', () => this.showCreateGroupModal());
    }
    
    if (this.selfNoteFab) {
      this.selfNoteFab.addEventListener('click', () => this.addQuickSelfNote());
    }
    
    // Chat window
    if (this.chatBack) {
      this.chatBack.addEventListener('click', () => this.closeChatWindow());
    }
    
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.sendMessage());
    }
    
    if (this.voiceBtn) {
      this.voiceBtn.addEventListener('click', () => this.startVoiceRecording());
    }
    
    if (this.attachBtn) {
      this.attachBtn.addEventListener('click', () => this.showFileUploadModal());
    }
    
    // Message input
    if (this.messageInput) {
      this.messageInput.addEventListener('input', () => {
        this.autoResizeTextarea();
        this.handleTyping();
      });
      
      this.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
    
    // Search inputs
    if (this.globalSearch) {
      this.globalSearch.addEventListener('input', (e) => this.handleGlobalSearch(e.target.value));
    }
    
    if (this.peopleSearch) {
      this.peopleSearch.addEventListener('input', (e) => this.handlePeopleSearch(e.target.value));
    }
    
    // Advanced search
    if (this.advancedSearchBtn) {
      this.advancedSearchBtn.addEventListener('click', () => this.showAdvancedSearchModal());
    }
    
    // Group creation
    if (this.createGroupBtn) {
      this.createGroupBtn.addEventListener('click', () => this.showCreateGroupModal());
    }
    
    // Profile settings
    if (this.privacySettings) {
      this.privacySettings.addEventListener('click', () => this.showPrivacyModal());
    }
    
    if (this.notificationsSettings) {
      this.notificationsSettings.addEventListener('click', () => this.showNotification('Notifications settings coming soon!', 'info'));
    }
    
    if (this.appearanceSettings) {
      this.appearanceSettings.addEventListener('click', () => this.showNotification('Appearance settings coming soon!', 'info'));
    }
    
    // Voice/Video calls
    if (this.voiceCall) {
      this.voiceCall.addEventListener('click', () => this.showNotification('Voice calls coming soon!', 'info'));
    }
    
    if (this.videoCall) {
      this.videoCall.addEventListener('click', () => this.showNotification('Video calls coming soon!', 'info'));
    }
    
    // Modal close functionality
    this.setupModalHandlers();
    
    // Filter buttons for search
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.handleFilterChange(e.target.getAttribute('data-filter'));
      });
    });
    
    // Outside click to close modals and menus
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeAllModals();
      }
      
      // Close FAB menu when clicking outside
      if (this.fabMenu && !this.fabMenu.classList.contains('hidden') && 
          !this.mainFab.contains(e.target) && !this.fabMenu.contains(e.target)) {
        this.closeFabMenu();
      }
    });
  }

  setupModalHandlers() {
    // Close buttons for all modals
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });
    
    // Advanced search modal
    const applySearchBtn = document.getElementById('apply-search');
    const clearSearchBtn = document.getElementById('clear-search');
    
    if (applySearchBtn) {
      applySearchBtn.addEventListener('click', () => this.applyAdvancedSearch());
    }
    
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => this.clearAdvancedSearch());
    }
    
    // Create group modal
    const createGroupSubmit = document.getElementById('create-group-submit');
    if (createGroupSubmit) {
      createGroupSubmit.addEventListener('click', () => this.createGroup());
    }
    
    // Voice recording modal
    const cancelRecording = document.getElementById('cancel-recording');
    const sendRecording = document.getElementById('send-recording');
    
    if (cancelRecording) {
      cancelRecording.addEventListener('click', () => this.cancelVoiceRecording());
    }
    
    if (sendRecording) {
      sendRecording.addEventListener('click', () => this.sendVoiceRecording());
    }
    
    // File upload
    const fileInput = document.getElementById('file-input');
    const uploadFiles = document.getElementById('upload-files');
    
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }
    
    if (uploadFiles) {
      uploadFiles.addEventListener('click', () => this.uploadFiles());
    }
  }

  setupMobileOptimizations() {
    // Prevent zoom on input focus
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0');
    }
    
    // Handle viewport changes for keyboard
    this.setupKeyboardHandling();
    
    // Setup touch gestures
    this.setupTouchGestures();
    
    // Setup haptic feedback
    this.setupHapticFeedback();
    
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });
    
    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleAppBackground();
      } else {
        this.handleAppForeground();
      }
    });
  }

  setupKeyboardHandling() {
    let initialViewportHeight = window.innerHeight;
    
    const handleViewportChange = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = initialViewportHeight - currentHeight;
      
      if (heightDiff > 150) { // Keyboard is likely open
        this.keyboardHeight = heightDiff;
        document.body.classList.add('keyboard-open');
        this.handleKeyboardOpen();
      } else { // Keyboard is likely closed
        this.keyboardHeight = 0;
        document.body.classList.remove('keyboard-open');
        this.handleKeyboardClose();
      }
    };
    
    window.addEventListener('resize', handleViewportChange);
    
    // iOS specific keyboard handling
    if (this.isIOS()) {
      window.addEventListener('focusin', (e) => {
        if (this.isFormInput(e.target)) {
          setTimeout(() => this.scrollInputIntoView(e.target), 300);
        }
      });
    }
  }

  setupTouchGestures() {
    let startX, startY, distX, distY;
    
    // Swipe gestures for navigation
    document.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      if (!startX || !startY) return;
      
      const touch = e.changedTouches[0];
      distX = touch.clientX - startX;
      distY = touch.clientY - startY;
      
      const absDistX = Math.abs(distX);
      const absDistY = Math.abs(distY);
      
      // Only trigger swipe if horizontal movement is greater than vertical
      if (absDistX > absDistY && absDistX > 50) {
        if (distX > 0) {
          this.handleSwipeRight();
        } else {
          this.handleSwipeLeft();
        }
      }
      
      // Reset
      startX = startY = null;
    }, { passive: true });
    
    // Pull to refresh (simplified)
    let pullStartY = 0;
    let isPulling = false;
    
    this.chatsList?.addEventListener('touchstart', (e) => {
      if (this.chatsList.scrollTop === 0) {
        pullStartY = e.touches[0].clientY;
        isPulling = true;
      }
    }, { passive: true });
    
    this.chatsList?.addEventListener('touchmove', (e) => {
      if (isPulling && this.chatsList.scrollTop === 0) {
        const currentY = e.touches[0].clientY;
        const pullDistance = currentY - pullStartY;
        
        if (pullDistance > 100) {
          this.triggerPullRefresh();
          isPulling = false;
        }
      }
    }, { passive: true });
  }

  setupHapticFeedback() {
    // Add haptic feedback for button taps (if supported)
    document.querySelectorAll('.btn, .btn-icon, .nav-item').forEach(element => {
      element.addEventListener('touchstart', () => {
        if (navigator.vibrate) {
          navigator.vibrate(10); // Short vibration
        }
      }, { passive: true });
    });
  }

  // Theme Management
  loadTheme() {
    const savedTheme = localStorage.getItem('chatmax-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('chatmax-theme', newTheme);
    this.updateThemeIcon(newTheme);
    this.showNotification(`Switched to ${newTheme} mode`, 'success');
  }

  updateThemeIcon(theme) {
    if (this.themeToggle) {
      const icon = this.themeToggle.querySelector('.material-icons');
      if (icon) {
        icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
      }
    }
  }

  hideLoadingScreen() {
    setTimeout(() => {
      if (this.loadingScreen) {
        this.loadingScreen.classList.add('hidden');
      }
    }, 1500);
  }

  // Authentication Methods
  showRegisterForm() {
    if (this.loginForm && this.registerForm) {
      this.loginForm.classList.remove('active');
      this.registerForm.classList.add('active');
    }
  }

  showLoginForm() {
    if (this.registerForm && this.loginForm) {
      this.registerForm.classList.remove('active');
      this.loginForm.classList.add('active');
    }
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
    }
  }

  async handleEmailLogin(e) {
    e.preventDefault();
    
    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value;
    
    if (!email || !password) {
      this.showNotification('Please fill in all fields', 'error');
      return;
    }
    
    try {
      this.showNotification('Signing in...', 'info');
      await signInWithEmailAndPassword(auth, email, password);
      this.showNotification('Welcome back!', 'success');
    } catch (error) {
      console.error('Login error:', error);
      this.showNotification(this.getErrorMessage(error.code), 'error');
    }
  }

  async handleEmailRegister(e) {
    e.preventDefault();
    
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
      this.showNotification('Welcome to ChatMax Pro!', 'success');
    } catch (error) {
      console.error('Google sign in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        this.showNotification('Sign in cancelled', 'info');
      } else {
        this.showNotification(this.getErrorMessage(error.code), 'error');
      }
    }
  }

  async handleLogout() {
    try {
      await signOut(auth);
      this.showNotification('See you later!', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      this.showNotification('Error signing out', 'error');
    }
  }

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
          createdAt: serverTimestamp(),
          settings: {
            messagePrivacy: 'everyone',
            lastSeenPrivacy: 'everyone',
            readReceipts: true
          }
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

  // Auth State Management
  setupAuthStateListener() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = user;
        this.showChatApp();
        this.loadUserProfile();
        this.loadInitialData();
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
    this.unsubscribes.forEach(unsubscribe => unsubscribe());
    this.unsubscribes = [];
  }

  // Navigation Management
  switchTab(tabName) {
    // Update navigation
    this.navItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // Update header title
    if (this.currentSectionTitle) {
      const titles = {
        chats: 'Chats',
        people: 'People',
        groups: 'Groups',
        self: 'Note to Self',
        profile: 'Profile'
      };
      this.currentSectionTitle.textContent = titles[tabName] || 'ChatMax Pro';
    }
    
    this.currentTab = tabName;
    
    // Load data for the tab
    this.loadTabData(tabName);
    
    // Close FAB menu
    this.closeFabMenu();
  }

  loadTabData(tabName) {
    switch (tabName) {
      case 'chats':
        this.loadChats();
        break;
      case 'people':
        this.loadPeople();
        break;
      case 'groups':
        this.loadGroups();
        break;
      case 'self':
        this.loadSelfNotes();
        break;
      case 'profile':
        this.loadProfile();
        break;
    }
  }

  loadUserProfile() {
    if (this.currentUser) {
      if (this.profileName) {
        this.profileName.textContent = this.currentUser.displayName || 'Anonymous User';
      }
      if (this.profileEmail) {
        this.profileEmail.textContent = this.currentUser.email || '';
      }
      if (this.profileAvatar) {
        this.profileAvatar.src = this.currentUser.photoURL || `https://api.dicebear.com/7.x/avatars/svg?seed=${this.currentUser.uid}`;
      }
    }
  }

  loadInitialData() {
    // Load sample data for demo
    this.loadSampleChats();
    this.loadSamplePeople();
    this.loadSampleGroups();
    this.loadSampleSelfNotes();
  }

  // Sample Data Loading (for demo purposes)
  loadSampleChats() {
    const sampleChats = [
      {
        id: '1',
        name: 'Alice Johnson',
        avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=alice',
        lastMessage: 'Hey! How are you doing? 😊',
        timestamp: new Date(Date.now() - 300000),
        unread: 2,
        isOnline: true
      },
      {
        id: '2',
        name: 'Work Team',
        avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=team',
        lastMessage: 'Meeting at 3 PM today',
        timestamp: new Date(Date.now() - 1800000),
        unread: 0,
        isGroup: true
      },
      {
        id: '3',
        name: 'Bob Smith',
        avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=bob',
        lastMessage: 'Thanks for your help!',
        timestamp: new Date(Date.now() - 3600000),
        unread: 0,
        isOnline: false
      }
    ];
    
    this.renderChats(sampleChats);
  }

  loadSamplePeople() {
    const samplePeople = [
      {
        id: '1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=alice',
        isOnline: true,
        mutualConnections: 5
      },
      {
        id: '2',
        name: 'Bob Smith',
        email: 'bob@example.com',
        avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=bob',
        isOnline: false,
        mutualConnections: 2
      },
      {
        id: '3',
        name: 'Carol Davis',
        email: 'carol@example.com',
        avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=carol',
        isOnline: true,
        mutualConnections: 8
      },
      {
        id: '4',
        name: 'David Wilson',
        email: 'david@example.com',
        avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=david',
        isOnline: true,
        mutualConnections: 1
      }
    ];
    
    this.renderPeople(samplePeople);
  }

  loadSampleGroups() {
    const sampleGroups = [
      {
        id: '1',
        name: 'Work Team',
        description: 'Daily work discussions',
        avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=team1',
        members: 12,
        isPublic: false
      },
      {
        id: '2',
        name: 'Book Club',
        description: 'Monthly book discussions',
        avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=books',
        members: 24,
        isPublic: true
      }
    ];
    
    this.renderGroups(sampleGroups);
  }

  loadSampleSelfNotes() {
    const sampleNotes = [
      {
        id: '1',
        content: 'Remember to buy groceries after work',
        timestamp: new Date(Date.now() - 3600000),
        type: 'text'
      },
      {
        id: '2',
        content: 'Great idea for the presentation: use more visuals!',
        timestamp: new Date(Date.now() - 7200000),
        type: 'text'
      },
      {
        id: '3',
        content: 'Call mom this weekend',
        timestamp: new Date(Date.now() - 86400000),
        type: 'text'
      }
    ];
    
    this.renderSelfNotes(sampleNotes);
  }

  // Rendering Methods
  renderChats(chats) {
    if (!this.chatsList) return;
    
    this.chatsList.innerHTML = chats.map(chat => `
      <div class="list-item" onclick="window.chatApp.openChat('${chat.id}')">
        <img src="${chat.avatar}" alt="${chat.name}" class="avatar">
        <div class="list-item-info">
          <div class="list-item-title">${chat.name}</div>
          <div class="list-item-subtitle">${chat.lastMessage}</div>
        </div>
        <div class="list-item-meta">
          <div class="list-item-time">${this.formatTime(chat.timestamp)}</div>
          ${chat.unread > 0 ? `<div class="unread-badge">${chat.unread}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  renderPeople(people) {
    if (!this.peopleList) return;
    
    this.peopleList.innerHTML = people.map(person => `
      <div class="list-item" onclick="window.chatApp.startChatWith('${person.id}')">
        <img src="${person.avatar}" alt="${person.name}" class="avatar">
        <div class="list-item-info">
          <div class="list-item-title">${person.name}</div>
          <div class="list-item-subtitle">${person.email}</div>
        </div>
        <div class="list-item-meta">
          <div class="status-text ${person.isOnline ? 'online' : 'offline'}">
            ${person.isOnline ? 'Online' : 'Offline'}
          </div>
          <div class="list-item-time">${person.mutualConnections} mutual</div>
        </div>
      </div>
    `).join('');
  }

  renderGroups(groups) {
    if (!this.groupsList) return;
    
    this.groupsList.innerHTML = groups.map(group => `
      <div class="list-item" onclick="window.chatApp.openGroup('${group.id}')">
        <img src="${group.avatar}" alt="${group.name}" class="avatar">
        <div class="list-item-info">
          <div class="list-item-title">${group.name}</div>
          <div class="list-item-subtitle">${group.description}</div>
        </div>
        <div class="list-item-meta">
          <div class="list-item-time">${group.members} members</div>
          <div class="status-text">${group.isPublic ? 'Public' : 'Private'}</div>
        </div>
      </div>
    `).join('');
  }

  renderSelfNotes(notes) {
    if (!this.selfNotesList) return;
    
    this.selfNotesList.innerHTML = notes.map(note => `
      <div class="message-bubble sent" style="align-self: flex-start; max-width: 100%; margin-bottom: 16px;">
        <div class="message-content">${note.content}</div>
        <div class="message-meta">
          <span class="message-time">${this.formatTime(note.timestamp)}</span>
        </div>
      </div>
    `).join('');
  }

  // Chat Management
  openChat(chatId) {
    this.currentChat = { id: chatId, type: 'user' };
    this.showChatWindow();
    this.loadChatData(chatId);
  }

  startChatWith(userId) {
    this.currentChat = { id: userId, type: 'user' };
    this.showChatWindow();
    this.loadChatData(userId);
  }

  openGroup(groupId) {
    this.currentChat = { id: groupId, type: 'group' };
    this.showChatWindow();
    this.loadGroupChatData(groupId);
  }

  showChatWindow() {
    if (this.chatWindow) {
      this.chatWindow.classList.remove('hidden');
    }
  }

  closeChatWindow() {
    if (this.chatWindow) {
      this.chatWindow.classList.add('hidden');
    }
    this.currentChat = null;
  }

  loadChatData(chatId) {
    // Load sample messages for demo
    const sampleMessages = [
      {
        id: '1',
        senderId: chatId,
        content: 'Hey there! How are you doing?',
        timestamp: new Date(Date.now() - 300000),
        type: 'text'
      },
      {
        id: '2',
        senderId: this.currentUser?.uid || 'me',
        content: 'Hi! I\'m doing great, thanks for asking!',
        timestamp: new Date(Date.now() - 240000),
        type: 'text'
      },
      {
        id: '3',
        senderId: chatId,
        content: 'That\'s awesome! This chat app looks incredible! 🚀',
        timestamp: new Date(Date.now() - 180000),
        type: 'text'
      }
    ];
    
    this.renderMessages(sampleMessages);
    
    // Update chat header
    if (this.chatName) this.chatName.textContent = 'Alice Johnson';
    if (this.chatStatus) {
      this.chatStatus.textContent = 'Online';
      this.chatStatus.className = 'status-text online';
    }
    if (this.chatAvatar) {
      this.chatAvatar.src = 'https://api.dicebear.com/7.x/avatars/svg?seed=alice';
    }
  }

  renderMessages(messages) {
    if (!this.messagesWrapper) return;
    
    this.messagesWrapper.innerHTML = messages.map(message => {
      const isCurrentUser = message.senderId === (this.currentUser?.uid || 'me');
      return `
        <div class="message-bubble ${isCurrentUser ? 'sent' : 'received'}">
          <div class="message-content">${message.content}</div>
          <div class="message-meta">
            <span class="message-time">${this.formatTime(message.timestamp)}</span>
            ${isCurrentUser ? '<span class="message-status">✓</span>' : ''}
          </div>
        </div>
      `;
    }).join('');
    
    this.scrollToBottom();
  }

  sendMessage() {
    if (!this.messageInput || !this.currentChat) return;
    
    const content = this.messageInput.value.trim();
    if (!content) return;
    
    // Add message to UI immediately
    const message = {
      id: Date.now().toString(),
      senderId: this.currentUser?.uid || 'me',
      content: content,
      timestamp: new Date(),
      type: 'text'
    };
    
    const messageElement = this.createMessageElement(message);
    this.messagesWrapper.appendChild(messageElement);
    
    this.messageInput.value = '';
    this.autoResizeTextarea();
    this.scrollToBottom();
    
    this.showNotification('Message sent!', 'success');
    
    // Simulate response after 2 seconds
    setTimeout(() => {
      const response = {
        id: (Date.now() + 1).toString(),
        senderId: this.currentChat.id,
        content: 'Thanks for your message! 👍',
        timestamp: new Date(),
        type: 'text'
      };
      
      const responseElement = this.createMessageElement(response);
      this.messagesWrapper.appendChild(responseElement);
      this.scrollToBottom();
    }, 2000);
  }

  createMessageElement(message) {
    const isCurrentUser = message.senderId === (this.currentUser?.uid || 'me');
    const div = document.createElement('div');
    div.className = `message-bubble ${isCurrentUser ? 'sent' : 'received'}`;
    
    div.innerHTML = `
      <div class="message-content">${this.escapeHtml(message.content)}</div>
      <div class="message-meta">
        <span class="message-time">${this.formatTime(message.timestamp)}</span>
        ${isCurrentUser ? '<span class="message-status">✓</span>' : ''}
      </div>
    `;
    
    return div;
  }

  // Self Notes Feature
  addQuickSelfNote() {
    const note = prompt('Enter your note:');
    if (note && note.trim()) {
      const noteData = {
        id: Date.now().toString(),
        content: note.trim(),
        timestamp: new Date(),
        type: 'text'
      };
      
      // Add to self notes
      this.addSelfNote(noteData);
      this.showNotification('Note added!', 'success');
      
      // Switch to self tab
      this.switchTab('self');
    }
    this.closeFabMenu();
  }

  addSelfNote(noteData) {
    if (!this.selfNotesList) return;
    
    const noteElement = document.createElement('div');
    noteElement.className = 'message-bubble sent';
    noteElement.style.cssText = 'align-self: flex-start; max-width: 100%; margin-bottom: 16px;';
    noteElement.innerHTML = `
      <div class="message-content">${this.escapeHtml(noteData.content)}</div>
      <div class="message-meta">
        <span class="message-time">${this.formatTime(noteData.timestamp)}</span>
      </div>
    `;
    
    this.selfNotesList.insertBefore(noteElement, this.selfNotesList.firstChild);
  }

  // Search Functionality
  toggleMobileSearch() {
    if (this.mobileSearch) {
      this.mobileSearch.classList.toggle('hidden');
      
      if (!this.mobileSearch.classList.contains('hidden')) {
        // Focus on search input
        setTimeout(() => {
          if (this.globalSearch) {
            this.globalSearch.focus();
          }
        }, 100);
      }
    }
  }

  handleGlobalSearch(query) {
    // Implement global search functionality
    console.log('Global search:', query);
  }

  handlePeopleSearch(query) {
    // Implement people search functionality
    console.log('People search:', query);
  }

  handleFilterChange(filter) {
    // Implement filter functionality
    console.log('Filter changed:', filter);
  }

  showAdvancedSearchModal() {
    if (this.advancedSearchModal) {
      this.advancedSearchModal.classList.remove('hidden');
    }
  }

  applyAdvancedSearch() {
    const nameSearch = document.getElementById('advanced-name-search')?.value;
    const locationSearch = document.getElementById('advanced-location-search')?.value;
    const mutualConnections = document.getElementById('mutual-connections')?.value;
    
    console.log('Advanced search:', { nameSearch, locationSearch, mutualConnections });
    this.showNotification('Advanced search applied!', 'success');
    this.closeAllModals();
  }

  clearAdvancedSearch() {
    document.getElementById('advanced-name-search').value = '';
    document.getElementById('advanced-location-search').value = '';
    document.getElementById('mutual-connections').value = '';
  }

  // Group Management
  showCreateGroupModal() {
    if (this.createGroupModal) {
      this.createGroupModal.classList.remove('hidden');
    }
    this.closeFabMenu();
  }

  createGroup() {
    const groupName = document.getElementById('group-name')?.value;
    const groupDescription = document.getElementById('group-description')?.value;
    const groupPrivacy = document.getElementById('group-privacy')?.value;
    const inviteEmails = document.getElementById('invite-emails')?.value;
    
    if (!groupName) {
      this.showNotification('Please enter a group name', 'error');
      return;
    }
    
    // Process email invitations
    if (inviteEmails) {
      const emails = inviteEmails.split(',').map(email => email.trim()).filter(email => email);
      this.sendGroupInvitations(emails, groupName);
    }
    
    this.showNotification(`Group "${groupName}" created successfully!`, 'success');
    this.closeAllModals();
    
    // Clear form
    document.getElementById('group-name').value = '';
    document.getElementById('group-description').value = '';
    document.getElementById('invite-emails').value = '';
  }

  sendGroupInvitations(emails, groupName) {
    // Simulate sending email invitations
    emails.forEach(email => {
      console.log(`Sending invitation to ${email} for group "${groupName}"`);
    });
    
    this.showNotification(`Invitations sent to ${emails.length} people`, 'success');
  }

  // Voice Recording
  async startVoiceRecording() {
    if (!this.currentChat) {
      this.showNotification('Please select a chat first', 'error');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.recordedChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        this.recordedChunks.push(event.data);
      };
      
      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };
      
      this.showVoiceRecordingModal();
      this.mediaRecorder.start();
      this.isRecording = true;
      
      this.startRecordingTimer();
      
    } catch (error) {
      console.error('Error starting voice recording:', error);
      this.showNotification('Voice recording not supported or permission denied', 'error');
    }
  }

  showVoiceRecordingModal() {
    if (this.voiceRecordingModal) {
      this.voiceRecordingModal.classList.remove('hidden');
    }
  }

  startRecordingTimer() {
    let seconds = 0;
    const recordingTime = document.getElementById('recording-time');
    
    this.recordingTimer = setInterval(() => {
      seconds++;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      if (recordingTime) {
        recordingTime.textContent = 
          `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  cancelVoiceRecording() {
    this.stopRecording();
    this.closeAllModals();
    this.showNotification('Recording cancelled', 'info');
  }

  sendVoiceRecording() {
    this.stopRecording();
    this.closeAllModals();
    this.showNotification('Voice message sent!', 'success');
    
    // Add voice message to chat (simulated)
    const message = {
      id: Date.now().toString(),
      senderId: this.currentUser?.uid || 'me',
      content: '🎤 Voice message',
      timestamp: new Date(),
      type: 'voice'
    };
    
    const messageElement = this.createMessageElement(message);
    this.messagesWrapper.appendChild(messageElement);
    this.scrollToBottom();
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
    
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  // File Upload
  showFileUploadModal() {
    if (this.fileUploadModal) {
      this.fileUploadModal.classList.remove('hidden');
    }
  }

  handleFileSelect(e) {
    const files = Array.from(e.target.files);
    console.log('Files selected:', files);
    this.showNotification(`${files.length} file(s) selected`, 'success');
  }

  uploadFiles() {
    this.showNotification('File upload functionality coming soon!', 'info');
    this.closeAllModals();
  }

  // Privacy Settings
  showPrivacyModal() {
    if (this.privacyModal) {
      this.privacyModal.classList.remove('hidden');
    }
  }

  // FAB Management
  toggleFabMenu() {
    if (this.fabMenu) {
      this.fabMenu.classList.toggle('hidden');
    }
  }

  closeFabMenu() {
    if (this.fabMenu) {
      this.fabMenu.classList.add('hidden');
    }
  }

  startNewChat() {
    this.switchTab('people');
    this.closeFabMenu();
    this.showNotification('Select a person to start chatting', 'info');
  }

  // Modal Management
  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.add('hidden');
    });
  }

  // Mobile-specific handlers
  handleKeyboardOpen() {
    if (this.chatWindow && !this.chatWindow.classList.contains('hidden')) {
      setTimeout(() => this.scrollToBottom(), 300);
    }
  }

  handleKeyboardClose() {
    // Handle keyboard close if needed
  }

  handleOrientationChange() {
    // Adjust layout for orientation changes
    setTimeout(() => {
      if (this.messagesWrapper) {
        this.scrollToBottom();
      }
    }, 100);
  }

  handleAppBackground() {
    // Handle app going to background
    if (this.currentUser) {
      // Update user status to away
    }
  }

  handleAppForeground() {
    // Handle app coming to foreground
    if (this.currentUser) {
      // Update user status to online
    }
  }

  handleSwipeLeft() {
    // Navigate to next tab
    const tabs = ['chats', 'people', 'groups', 'self', 'profile'];
    const currentIndex = tabs.indexOf(this.currentTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    this.switchTab(tabs[nextIndex]);
  }

  handleSwipeRight() {
    // Navigate to previous tab
    const tabs = ['chats', 'people', 'groups', 'self', 'profile'];
    const currentIndex = tabs.indexOf(this.currentTab);
    const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    this.switchTab(tabs[prevIndex]);
  }

  triggerPullRefresh() {
    this.showNotification('Refreshing...', 'info');
    
    // Reload current tab data
    setTimeout(() => {
      this.loadTabData(this.currentTab);
      this.showNotification('Refreshed!', 'success');
    }, 1000);
  }

  handleTyping() {
    if (!this.currentChat) return;
    
    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    // Show typing indicator (in a real app, send to other users)
    this.typingTimeout = setTimeout(() => {
      // Hide typing indicator
    }, 2000);
  }

  // Utility Methods
  autoResizeTextarea() {
    if (!this.messageInput) return;
    
    this.messageInput.style.height = 'auto';
    this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
  }

  scrollToBottom() {
    if (this.messagesWrapper) {
      this.messagesWrapper.scrollTop = this.messagesWrapper.scrollHeight;
    }
  }

  scrollInputIntoView(input) {
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  isFormInput(element) {
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
  }

  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <span class="material-icons">
        ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
      </span>
      <span>${message}</span>
    `;
    
    // Styling
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-surface);
      color: var(--text-primary);
      padding: 12px 20px;
      border-radius: 24px;
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 10000;
      animation: slideInFromTop 0.3s ease;
      border: 2px solid ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--info)'};
      max-width: 90vw;
      font-size: 14px;
      font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
      notification.style.animation = 'slideOutToTop 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(type === 'error' ? [100, 50, 100] : 50);
    }
  }

  // Placeholder methods for future features
  loadChats() {
    this.loadSampleChats();
  }

  loadPeople() {
    this.loadSamplePeople();
  }

  loadGroups() {
    this.loadSampleGroups();
  }

  loadSelfNotes() {
    this.loadSampleSelfNotes();
  }

  loadProfile() {
    this.loadUserProfile();
  }
}

// CSS animation styles for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideInFromTop {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  @keyframes slideOutToTop {
    from {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
  }
  
  body.keyboard-open .message-input-area {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
  }
`;
document.head.appendChild(notificationStyles);

// Make ChatMaxPro available globally for HTML onclick handlers
window.chatApp = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.chatApp = new ChatMaxPro();
});
