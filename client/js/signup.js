// CityFix Signup - Final Fixed Version
console.log('🚀 CityFix Signup System Starting...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM Loaded - Initializing...');
    
    // Configuration
    const API_BASE = 'http://localhost:3000';
    const ADMIN_IDS = ['123456789', '987654321', '111111111', '222222222', '333333333'];
    
    // Get form
    const form = document.getElementById('signupForm');
    if (!form) {
        console.error('❌ Form not found!');
        return;
    }
    
    console.log('✅ Form found successfully');
    
    // Create notification container
    function createNotificationContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        return container;
    }
    
    const notificationContainer = createNotificationContainer();
    
    // Show notification
    function showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Remove existing notification
        const existing = notificationContainer.querySelector('.notification-msg');
        if (existing) existing.remove();
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const notification = document.createElement('div');
        notification.className = 'notification-msg';
        notification.style.cssText = `
            background: white;
            color: #1a1a1a;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            border-left: 4px solid ${colors[type]};
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: 'Poppins', sans-serif;
            font-size: 14px;
            pointer-events: auto;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        
        notification.innerHTML = `
            <span style="font-size: 20px;">${icons[type]}</span>
            <span style="flex: 1;">${message}</span>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: #6b7280;
                cursor: pointer;
                font-size: 20px;
                padding: 0;
                margin-left: 10px;
            ">×</button>
        `;
        
        notificationContainer.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    // Add animation styles
    if (!document.getElementById('signup-animations')) {
        const style = document.createElement('style');
        style.id = 'signup-animations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
            .signup-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Form submitted');
        
        // Get form elements - try multiple selectors for compatibility
        const usernameInput = form.querySelector('input[name="username"], .fullname-input');
        const emailInput = form.querySelector('input[name="user_email"], .email-input');
        const passwordInput = form.querySelector('input[name="password"], .password-input');
        const userIdInput = form.querySelector('input[name="user_id"], .confirm-password-input');
        const userTypeElement = form.querySelector('input[name="userType"]:checked');
        const photoInput = form.querySelector('input[name="user_photo"], .photo-input');
        
        // Get values
        const username = usernameInput?.value?.trim() || '';
        const email = emailInput?.value?.trim() || '';
        const password = passwordInput?.value || '';
        const userId = userIdInput?.value?.trim() || '';
        const userType = userTypeElement ? userTypeElement.value : 'citizen';
        const photoFile = photoInput?.files?.[0];
        
        console.log('Form data collected:', {
            username,
            email,
            userType,
            hasPassword: !!password,
            hasPhoto: !!photoFile,
            userId: userId ? 'provided' : 'empty'
        });
        
        // Validation
        if (!username || username.length < 3) {
            showNotification('Username must be at least 3 characters', 'error');
            usernameInput?.focus();
            return;
        }
        
        if (!email || !email.includes('@')) {
            showNotification('Please enter a valid email address', 'error');
            emailInput?.focus();
            return;
        }
        
        if (!password || password.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            passwordInput?.focus();
            return;
        }
        
        // Admin validation
        if (userType === 'admin') {
            if (!userId) {
                showNotification('National ID is required for admin registration', 'error');
                userIdInput?.focus();
                return;
            }
            if (!/^\d{9}$/.test(userId)) {
                showNotification('National ID must be exactly 9 digits', 'error');
                userIdInput?.focus();
                return;
            }
            if (!ADMIN_IDS.includes(userId)) {
                showNotification('This National ID is not authorized for admin access', 'error');
                return;
            }
        }
        
        // Get submit button
        const submitBtn = form.querySelector('.signup-btn, button[type="submit"]');
        const btnText = form.querySelector('.signup-btn-text') || submitBtn;
        const originalText = btnText?.textContent || 'Sign Up';
        
        // Disable button
        if (submitBtn) submitBtn.disabled = true;
        if (btnText) btnText.textContent = 'Creating account...';
        
        try {
            // Prepare form data
            const formData = new FormData();
            formData.append('username', username);
            formData.append('user_email', email);
            formData.append('password', password);
            formData.append('userType', userType);
            
            if (userId) {
                formData.append('user_id', userId);
            }
            
            if (photoFile) {
                // Check file size
                if (photoFile.size > 5 * 1024 * 1024) {
                    showNotification('Image size must be less than 5MB', 'error');
                    if (submitBtn) submitBtn.disabled = false;
                    if (btnText) btnText.textContent = originalText;
                    return;
                }
                formData.append('user_photo', photoFile);
                console.log('Including photo:', photoFile.name);
            }
            
            console.log('🚀 Sending request to server...');
            showNotification('Processing registration...', 'info');
            
            // Send request
            const response = await fetch(`${API_BASE}/api/auth/signup`, {
                method: 'POST',
                body: formData
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Server response:', result);
            
            if (result.success) {
                // SUCCESS!
                console.log('✅ Registration successful!');
                
                // Save auth data
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                localStorage.setItem('userType', result.data.user.userType);
                
                // Show success message
                showNotification(`🎉 Welcome ${result.data.user.username}! Your account has been created successfully!`, 'success');
                
                // Clear form
                form.reset();
                
                // Alert user about redirect
                alert(`Welcome to CityFix, ${result.data.user.username}!\n\nYour ${result.data.user.userType} account has been created.\n\nClick OK to continue to the ${result.data.user.userType === 'admin' ? 'Dashboard' : 'Home Page'}.`);
                
                // Redirect
                const redirectUrl = result.data.user.userType === 'admin' 
                    ? 'dashboard.html' 
                    : 'index.html';
                
                console.log(`Redirecting to: ${redirectUrl}`);
                window.location.href = redirectUrl;
                
            } else {
                // ERROR from server
                console.error('Registration failed:', result.error);
                
                // Show specific error message
                let errorMessage = result.error || 'Registration failed';
                
                if (errorMessage.toLowerCase().includes('email')) {
                    errorMessage = 'This email is already registered. Please use a different email or login.';
                } else if (errorMessage.toLowerCase().includes('username')) {
                    errorMessage = 'This username is already taken. Please choose another username.';
                }
                
                showNotification(errorMessage, 'error');
            }
            
        } catch (error) {
            console.error('Error during registration:', error);
            
            if (error.message.includes('Failed to fetch')) {
                showNotification('Cannot connect to server. Please ensure the backend is running.', 'error');
                alert('Server Connection Failed!\n\nPlease make sure:\n1. Backend server is running (node server.js)\n2. MongoDB is running\n3. Port 3000 is not blocked');
            } else {
                showNotification('An error occurred: ' + error.message, 'error');
            }
            
        } finally {
            // Re-enable button
            if (submitBtn) submitBtn.disabled = false;
            if (btnText) btnText.textContent = originalText;
        }
    });
    
    // Check server status silently (no notification on page load)
    fetch(API_BASE)
        .then(res => res.json())
        .then(data => {
            console.log('✅ Server check: Connected');
            // Don't show notification here - only log
        })
        .catch(err => {
            console.error('⚠️ Server check: Not connected');
            // Show warning only, not success
            setTimeout(() => {
                showNotification('Warning: Backend server may not be running', 'warning');
            }, 1000);
        });
    
    console.log('✅ Signup system ready');
    console.log('📍 Server endpoint:', API_BASE);
});