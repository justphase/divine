// DOM Elements
const loginBtn = document.querySelector('.login-btn');
const signupBtn = document.querySelector('.signup-btn');
const loginModal = document.getElementById('loginModal');
const closeBtn = document.querySelector('.close');
const showSignupLink = document.getElementById('showSignup');
const loginForm = document.getElementById('loginForm');
const registerBtns = document.querySelectorAll('.register-btn');

// Event Listeners
loginBtn.addEventListener('click', openLoginModal);
closeBtn.addEventListener('click', closeLoginModal);
window.addEventListener('click', outsideClick);
showSignupLink.addEventListener('click', switchToSignup);
loginForm.addEventListener('submit', handleLogin);

registerBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        if (isLoggedIn) {
            // Get the event name from the parent element
            const eventName = this.parentElement.querySelector('h3').textContent;
            alert(`You've successfully registered for: ${eventName}`);
            this.textContent = 'Registered';
            this.disabled = true;
            this.style.backgroundColor = '#4ade80';
        } else {
            openLoginModal();
            alert('Please login first to register for events');
        }
    });
});

// Functions
function openLoginModal() {
    loginModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeLoginModal() {
    loginModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Enable scrolling
}

function outsideClick(e) {
    if (e.target === loginModal) {
        closeLoginModal();
    }
}

function switchToSignup(e) {
    e.preventDefault();
    
    // Change modal title
    document.querySelector('.modal-content h2').textContent = 'Sign Up';
    
    // Add additional form fields for signup
    const formGroups = document.querySelectorAll('.form-group');
    
    // Check if name field already exists
    if (!document.getElementById('name')) {
        const nameGroup = document.createElement('div');
        nameGroup.className = 'form-group';
        nameGroup.innerHTML = `
            <label for="name">Full Name</label>
            <input type="text" id="name" required>
        `;
        
        // Insert at the beginning of the form
        loginForm.insertBefore(nameGroup, formGroups[0]);
    }
    
    // Change button text
    loginForm.querySelector('button').textContent = 'Sign Up';
    
    // Change link text
    document.querySelector('.modal-content p').innerHTML = 'Already have an account? <a href="#" id="showLogin">Login</a>';
    
    // Add event listener to switch back to login
    document.getElementById('showLogin').addEventListener('click', switchToLogin);
    
    // Change form submit handler
    loginForm.removeEventListener('submit', handleLogin);
    loginForm.addEventListener('submit', handleSignup);
}

function switchToLogin(e) {
    e.preventDefault();
    
    // Change modal title back
    document.querySelector('.modal-content h2').textContent = 'Login';
    
    // Remove name field if it exists
    const nameField = document.getElementById('name');
    if (nameField) {
        nameField.parentElement.remove();
    }
    
    // Change button text back
    loginForm.querySelector('button').textContent = 'Login';
    
    // Change link text back
    document.querySelector('.modal-content p').innerHTML = 'Don\'t have an account? <a href="#" id="showSignup">Sign Up</a>';
    
    // Re-add event listener to switch to signup
    document.getElementById('showSignup').addEventListener('click', switchToSignup);
    
    // Change form submit handler back
    loginForm.removeEventListener('submit', handleSignup);
    loginForm.addEventListener('submit', handleLogin);
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Simple validation
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // In a real app, you would send this to your backend
    console.log('Login attempt:', { email, password });
    
    // Simulate successful login
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    
    // Close modal and update UI
    closeLoginModal();
    updateUIAfterLogin(email);
    
    alert('Login successful!');
}

function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Simple validation
    if (!name || !email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // In a real app, you would send this to your backend
    console.log('Signup attempt:', { name, email, password });
    
    // Simulate successful signup
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    
    // Close modal and update UI
    closeLoginModal();
    updateUIAfterLogin(name);
    
    alert('Sign up successful!');
}

function updateUIAfterLogin(name) {
    // Update auth buttons
    const authButtons = document.querySelector('.auth-buttons');
    authButtons.innerHTML = `
        <div class="user-profile">
            <span>Welcome, ${name.split(' ')[0]}</span>
            <button class="logout-btn">Logout</button>
        </div>
    `;
    
    // Add logout functionality
    document.querySelector('.logout-btn').addEventListener('click', handleLogout);
}

function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    
    // Reset auth buttons
    const authButtons = document.querySelector('.auth-buttons');
    authButtons.innerHTML = `
        <button class="login-btn">Login</button>
        <button class="signup-btn">Sign Up</button>
    `;
    
    // Re-add event listeners
    document.querySelector('.login-btn').addEventListener('click', openLoginModal);
    document.querySelector('.signup-btn').addEventListener('click', openLoginModal);
    
    // Reset register buttons
    registerBtns.forEach(btn => {
        btn.textContent = 'Register';
        btn.disabled = false;
        btn.style.backgroundColor = '';
    });
    
    alert('Logged out successfully');
}

// Check if user is already logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (isLoggedIn) {
        const name = localStorage.getItem('userName') || localStorage.getItem('userEmail');
        updateUIAfterLogin(name);
    }
});

// Add additional event listeners for menu responsiveness
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('nav ul li a');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
});