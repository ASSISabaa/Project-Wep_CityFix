// login.js

const API_URL = document.querySelector('meta[name="cityfix-api"]').content;

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('rememberMe');
const adminLoginBtn = document.querySelector('.admin-login-btn');
const userLoginBtn = document.querySelector('.user-login-btn');
const loginStatus = document.getElementById('login-status');

function showStatus(message, type = 'error') {
    loginStatus.textContent = message;
    loginStatus.className = `status-message ${type}`;
    loginStatus.style.display = 'block';
    
    setTimeout(() => {
        loginStatus.style.display = 'none';
    }, 5000);
}

function validateInput() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        showStatus('Please enter email and password', 'error');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showStatus('Invalid email format', 'error');
        return false;
    }
    
    if (password.length < 6) {
        showStatus('Password must be at least 6 characters', 'error');
        return false;
    }
    
    return true;
}

async function handleLogin(role) {
    if (!validateInput()) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const rememberMe = rememberMeCheckbox.checked;
    
    const btn = role === 'admin' ? adminLoginBtn : userLoginBtn;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>Logging in...</span>';
    
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                role,
                rememberMe
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userEmail', data.user.email);
            
            if (data.user.tenantId) {
                localStorage.setItem('tenantId', data.user.tenantId);
                localStorage.setItem('tenantName', data.user.tenantName);
            }
            
            if (data.user.permissionLevel) {
                localStorage.setItem('permissionLevel', data.user.permissionLevel);
            }
            
            showStatus('Login successful', 'success');
            
            setTimeout(() => {
                redirectBasedOnRole(data.user.role, data.user.permissionLevel);
            }, 1000);
            
        } else {
            showStatus(data.message || 'Login failed. Please check your credentials', 'error');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showStatus('Connection error. Please try again', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function redirectBasedOnRole(role, permissionLevel) {
    switch(role) {
        case 'super_admin':
            window.location.href = 'super-admin-dashboard.html';
            break;
            
        case 'admin':
            if (permissionLevel === 'high') {
                window.location.href = 'high-admin-dashboard.html';
            } else if (permissionLevel === 'medium') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'employee-dashboard.html';
            }
            break;
            
        case 'user':
        case 'citizen':
            window.location.href = 'index.html';
            break;
            
        default:
            window.location.href = 'index.html';
    }
}

adminLoginBtn.addEventListener('click', () => handleLogin('admin'));
userLoginBtn.addEventListener('click', () => handleLogin('citizen'));

emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') passwordInput.focus();
});

passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleLogin('citizen');
    }
});

if (localStorage.getItem('authToken')) {
    const role = localStorage.getItem('userRole');
    const permissionLevel = localStorage.getItem('permissionLevel');
    redirectBasedOnRole(role, permissionLevel);
}