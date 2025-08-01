// JavaScript for handling login and signup form submissions

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the signup page
    const signupForm = document.querySelector('.signup-form-container');
    if (signupForm) {
        setupSignupForm();
    }

    // Check if we're on the login page
    const loginForm = document.querySelector('.login-form-container');
    if (loginForm) {
        setupLoginForm();
    }
    
    // Update UI based on auth state
    updateUIForAuthState();
});

function setupSignupForm() {
    const signupBtn = document.querySelector('.signup-btn');
    
    signupBtn.addEventListener('click', function(event) {
        event.preventDefault();
        
        // Get form values
        const username = document.querySelector('input[name="username"]').value;
        const userEmail = document.querySelector('input[name="user_email"]').value;
        const password = document.querySelector('input[name="password"]').value;
        const userId = document.querySelector('input[name="user_id"]').value;
        const userType = document.querySelector('input[name="userType"]:checked').value;
        const photoInput = document.querySelector('input[name="user_photo"]');
        
        // Basic validation
        if (!username || !userEmail || !password || !userId) {
            showError("Please fill in all required fields");
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
            showError("Please enter a valid email address");
            return;
        }
        
        // User ID validation - ensure it's a number
        if (isNaN(userId) || userId.trim() === '') {
            showError("Please enter a valid user ID (numbers only)");
            return;
        }
        
        // Prepare form data for file upload
        const formData = new FormData();
        formData.append('username', username); // Username field
        formData.append('user_email', userEmail); // Email address field
        formData.append('password', password);
        formData.append('user_id', userId); // User ID
        formData.append('user_type', userType); // Match the model field name
        
        // Add photo if one was selected
        if (photoInput.files.length > 0) {
            formData.append('user_photo', photoInput.files[0]);
        }
        
        // Show loading state
        signupBtn.disabled = true;
        signupBtn.querySelector('.signup-btn-text').textContent = 'Signing Up...';
        
        // Send registration request
        fetch('http://localhost:5000/api/users/register', {
            method: 'POST',
            body: formData,
            // No Content-Type header needed, FormData sets it automatically with the boundary
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Network response was not ok');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Registration successful:', data);
            
            // Store user info in localStorage (simplified auth)
            localStorage.setItem('cityfix_user', JSON.stringify({
                userId: data.user.user_id || data.user._id,
                username: data.user.username,
                email: data.user.user_email,
                userType: data.user.user_type,
                token: data.token,
                isLoggedIn: true
            }));
            
            // Show success message
            alert('Registration successful!');
            
            // Redirect to home or dashboard
            window.location.href = 'index.html';
        })
        .catch(error => {
            console.error('Error during registration:', error);
            showError(error.message || "Registration failed. Please try again.");
        })
        .finally(() => {
            // Restore button state
            signupBtn.disabled = false;
            signupBtn.querySelector('.signup-btn-text').textContent = 'Sign Up';
        });
    });
}

function setupLoginForm() {
    // We have two login buttons, one for admin and one for user
    const adminLoginBtn = document.querySelector('.admin-login-btn');
    const userLoginBtn = document.querySelector('.user-login-btn');
    
    // Common login logic function
    function handleLogin(userType) {
        // Get form values
        const email = document.querySelector('.email-input').value;
        const password = document.querySelector('.password-input').value;
        
        // Basic validation
        if (!email || !password) {
            showError("Please enter both email and password");
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError("Please enter a valid email address");
            return;
        }
        
        // Show loading state on the button that was clicked
        const btnText = userType === 'admin' ? 
            adminLoginBtn.querySelector('.admin-btn-text') : 
            userLoginBtn.querySelector('.user-btn-text');
        const originalText = btnText.textContent;
        
        adminLoginBtn.disabled = true;
        userLoginBtn.disabled = true;
        btnText.textContent = 'Logging In...';
        
        // Send login request
        fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_email: email,
                password: password,
                user_type: userType // Send user_type to API - match the model field name
            }),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Invalid credentials');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Login successful:', data);
            
            // Enhanced logic for handling different API response structures
            let userInfo = {
                userId: 'unknown',
                username: '',
                email: email, // Default to the email provided in the login form
                userType: userType, // Default to the userType from login button
                token: '',
                isLoggedIn: true
            };
            
            // Extract data from API response
            if (data.user) {
                // Structure with nested user object
                userInfo.userId = data.user.user_id || data.user._id || userInfo.userId;
                userInfo.username = data.user.username || '';
                userInfo.email = data.user.user_email || userInfo.email;
                userInfo.userType = data.user.user_type || userInfo.userType;
                userInfo.token = data.token || userInfo.token;
                
                // Strict user type validation
                if (userInfo.userType !== userType) {
                    throw new Error(`Authentication failed. Please use the "${userInfo.userType}" login button.`);
                }
            } else {
                // Structure with user data at the top level
                userInfo.userId = data.user_id || data._id || userInfo.userId;
                userInfo.username = data.username || '';
                userInfo.email = data.user_email || userInfo.email;
                userInfo.userType = data.user_type || userInfo.userType;
                userInfo.token = data.token || userInfo.token;
                
                // Strict user type validation
                if (userInfo.userType !== userType) {
                    throw new Error(`Authentication failed. Please use the "${userInfo.userType}" login button.`);
                }
            }
            
                // If the API returns a different user type than requested, verify with the user
                // Removed the confirmation dialog - now strictly enforcing user type matching
                // Store user info in localStorage            // Store user info in localStorage
            localStorage.setItem('cityfix_user', JSON.stringify(userInfo));
            
            // Show success message
            alert('Login successful!');
            
            // Redirect to home or dashboard
            window.location.href = 'index.html';
        })
        .catch(error => {
            console.error('Error during login:', error);
            showError(error.message || "Login failed. Please check your credentials and try again.");
        })
        .finally(() => {
            // Restore button states
            adminLoginBtn.disabled = false;
            userLoginBtn.disabled = false;
            btnText.textContent = originalText;
        });
    }
    
    // Add event listeners to buttons
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', function(event) {
            event.preventDefault();
            handleLogin('admin');
        });
    }
    
    if (userLoginBtn) {
        userLoginBtn.addEventListener('click', function(event) {
            event.preventDefault();
            handleLogin('citizen');
        });
    }
}

function showError(message) {
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.color = '#e53e3e';
    errorElement.style.backgroundColor = '#fed7d7';
    errorElement.style.padding = '10px';
    errorElement.style.borderRadius = '8px';
    errorElement.style.marginBottom = '16px';
    errorElement.style.textAlign = 'center';
    errorElement.textContent = message;
    
    // Find where to insert the error
    const formContainer = document.querySelector('.signup-form-container') || 
                          document.querySelector('.login-form-container');
    
    // Insert at the top of the form container
    if (formContainer) {
        // Remove any existing error messages
        const existingError = formContainer.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        formContainer.insertBefore(errorElement, formContainer.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    } else {
        // Fallback if no form container found
        alert(message);
    }
}

// Function to check if user is logged in
function isUserLoggedIn() {
    const userData = localStorage.getItem('cityfix_user');
    if (!userData) return false;
    
    try {
        const user = JSON.parse(userData);
        return user.isLoggedIn === true && user.token;
    } catch (e) {
        return false;
    }
}

// Function to log out user
function logoutUser() {
    localStorage.removeItem('cityfix_user');
    window.location.href = 'login.html';
}

// Update UI based on login state
function updateUIForAuthState() {
    const isLoggedIn = isUserLoggedIn();
    
    // Get elements that change based on auth state
    const loginLinks = document.querySelectorAll('.login');
    const signupButtons = document.querySelectorAll('.signup');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (isLoggedIn) {
        // Get user data
        const userData = JSON.parse(localStorage.getItem('cityfix_user'));
        
        // User is logged in, update UI
        loginLinks.forEach(link => {
            link.textContent = 'Logout';
            link.href = '#';
            link.addEventListener('click', function(e) {
                e.preventDefault();
                logoutUser();
            });
        });
        
        signupButtons.forEach(button => {
            button.style.display = 'none';
        });
        
        // Add user info display
        if (authButtons) {
            // Clear existing content
            authButtons.innerHTML = '';
            
            // Create user profile element
            const userProfile = document.createElement('div');
            userProfile.className = 'user-profile';
            userProfile.innerHTML = `
                <span class="welcome-user">Welcome, ${userData.username || userData.email || 'User'}</span>
                <button class="logout-btn">Logout</button>
            `;
            
            authButtons.appendChild(userProfile);
            
            // Add event listener to logout button
            const logoutBtn = userProfile.querySelector('.logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logoutUser);
            }
        }
    } else {
        // User is not logged in, ensure normal login/signup display
        loginLinks.forEach(link => {
            link.textContent = 'Login';
            link.href = 'login.html';
        });
        
        signupButtons.forEach(button => {
            button.style.display = 'block';
        });
        
        // Restore original auth buttons if needed
        if (authButtons && !authButtons.querySelector('a.login')) {
            authButtons.innerHTML = `
                <a href="login.html" class="login">Login</a>
                <button class="signup">Sign Up</button>
            `;
            
            // Add click event for new signup button
            const newSignupBtn = authButtons.querySelector('button.signup');
            if (newSignupBtn) {
                newSignupBtn.addEventListener('click', function() {
                    window.location.href = 'signup.html';
                });
            }
        }
    }
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', function() {
    updateUIForAuthState();
});
