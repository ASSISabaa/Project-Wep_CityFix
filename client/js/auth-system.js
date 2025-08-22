/**
 * CityFix - Complete Authentication System
 * Includes: Login, Remember Me, Forgot Password, Reset Password
 * @version 3.0.0
 */

// ==================== Configuration ====================
const CONFIG = {
    API: {
        BASE_URL: location.origin,
        TIMEOUT: 10000,
        RETRY_ATTEMPTS: 3
    },
    ENDPOINTS: {
        LOGIN: '/api/auth/login',
        SIGNUP: '/api/auth/signup',
        VERIFY_TOKEN: '/api/auth/verify',
        LOGOUT: '/api/auth/logout',
        FORGOT_PASSWORD: '/api/auth/forgot-password',
        RESET_PASSWORD: '/api/auth/reset-password',
        VERIFY_RESET_TOKEN: '/api/auth/verify-reset-token',
        CHECK_EMAIL: '/api/auth/check-email'
    },
    STORAGE_KEYS: {
        TOKEN: 'cityfix_token',
        USER: 'cityfix_user',
        REMEMBER_ME: 'cityfix_remember',
        REMEMBERED_EMAIL: 'cityfix_remembered_email'
    },
    REDIRECT_PATHS: {
        ADMIN: 'dashboard.html',
        CITIZEN: 'index.html',
        LOGIN: 'login.html'
    }
};

// ==================== Password Reset Handler ====================
class PasswordResetHandler {
    constructor() {
        this.resetToken = null;
        this.checkForResetToken();
    }

    checkForResetToken() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            this.resetToken = token;
            this.showResetPasswordForm();
        }
    }

    showResetPasswordForm() {
        const modalHTML = `
            <div id="reset-password-container" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            ">
                <div style="
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    width: 90%;
                    max-width: 450px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                ">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <i class="fas fa-lock" style="
                            font-size: 48px;
                            color: #667eea;
                            margin-bottom: 20px;
                        "></i>
                        <h2 style="
                            color: #1f2937;
                            font-size: 28px;
                            margin-bottom: 10px;
                        ">Reset Your Password</h2>
                        <p style="color: #6b7280;">Enter your new password below</p>
                    </div>

                    <div id="reset-form">
                        <div style="margin-bottom: 20px;">
                            <label style="
                                display: block;
                                margin-bottom: 8px;
                                color: #374151;
                                font-weight: 500;
                            ">New Password</label>
                            <div style="position: relative;">
                                <input type="password" id="new-password" style="
                                    width: 100%;
                                    padding: 12px 40px 12px 12px;
                                    border: 2px solid #e5e7eb;
                                    border-radius: 10px;
                                    font-size: 16px;
                                    transition: all 0.3s;
                                " placeholder="Enter new password">
                                <button id="toggle-new-password" type="button" style="
                                    position: absolute;
                                    right: 12px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    background: none;
                                    border: none;
                                    color: #9ca3af;
                                    cursor: pointer;
                                ">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            <div id="new-password-error" style="
                                display: none;
                                color: #ef4444;
                                font-size: 14px;
                                margin-top: 5px;
                            "></div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="
                                display: block;
                                margin-bottom: 8px;
                                color: #374151;
                                font-weight: 500;
                            ">Confirm Password</label>
                            <div style="position: relative;">
                                <input type="password" id="confirm-password" style="
                                    width: 100%;
                                    padding: 12px 40px 12px 12px;
                                    border: 2px solid #e5e7eb;
                                    border-radius: 10px;
                                    font-size: 16px;
                                    transition: all 0.3s;
                                " placeholder="Confirm new password">
                                <button id="toggle-confirm-password" type="button" style="
                                    position: absolute;
                                    right: 12px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    background: none;
                                    border: none;
                                    color: #9ca3af;
                                    cursor: pointer;
                                ">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            <div id="confirm-password-error" style="
                                display: none;
                                color: #ef4444;
                                font-size: 14px;
                                margin-top: 5px;
                            "></div>
                        </div>

                        <div id="password-strength" style="margin-bottom: 20px;">
                            <div style="
                                height: 4px;
                                background: #e5e7eb;
                                border-radius: 2px;
                                overflow: hidden;
                            ">
                                <div id="strength-bar" style="
                                    height: 100%;
                                    width: 0;
                                    transition: all 0.3s;
                                "></div>
                            </div>
                            <p id="strength-text" style="
                                font-size: 12px;
                                margin-top: 5px;
                                color: #6b7280;
                            "></p>
                        </div>

                        <button id="reset-password-btn" style="
                            width: 100%;
                            padding: 14px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s;
                        ">Reset Password</button>

                        <div id="reset-status" style="
                            display: none;
                            margin-top: 20px;
                            padding: 12px;
                            border-radius: 8px;
                            text-align: center;
                        "></div>
                    </div>

                    <div id="reset-success" style="display: none; text-align: center;">
                        <i class="fas fa-check-circle" style="
                            font-size: 64px;
                            color: #10b981;
                            margin-bottom: 20px;
                        "></i>
                        <h3 style="
                            color: #1f2937;
                            font-size: 24px;
                            margin-bottom: 10px;
                        ">Password Reset Successful!</h3>
                        <p style="
                            color: #6b7280;
                            margin-bottom: 20px;
                        ">Your password has been successfully reset.</p>
                        <button id="go-to-login" style="
                            padding: 12px 30px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                        ">Go to Login</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.initializeResetFormListeners();
        this.verifyResetToken();
    }

    initializeResetFormListeners() {
        document.getElementById('toggle-new-password')?.addEventListener('click', () => {
            this.togglePasswordVisibility('new-password', 'toggle-new-password');
        });

        document.getElementById('toggle-confirm-password')?.addEventListener('click', () => {
            this.togglePasswordVisibility('confirm-password', 'toggle-confirm-password');
        });

        document.getElementById('new-password')?.addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value);
            this.clearError('new-password');
        });

        document.getElementById('confirm-password')?.addEventListener('input', () => {
            this.clearError('confirm-password');
        });

        document.getElementById('reset-password-btn')?.addEventListener('click', () => {
            this.handlePasswordReset();
        });

        document.getElementById('go-to-login')?.addEventListener('click', () => {
            window.location.href = CONFIG.REDIRECT_PATHS.LOGIN;
        });

        document.getElementById('confirm-password')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handlePasswordReset();
            }
        });
    }

    togglePasswordVisibility(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);
        
        if (input && button) {
            const icon = button.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        }
    }

    checkPasswordStrength(password) {
        const strengthBar = document.getElementById('strength-bar');
        const strengthText = document.getElementById('strength-text');
        
        if (!strengthBar || !strengthText) return;

        let strength = 0;
        let strengthLabel = 'Weak';
        let color = '#ef4444';

        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;

        switch(strength) {
            case 0:
            case 1:
                strengthLabel = 'Weak';
                color = '#ef4444';
                break;
            case 2:
                strengthLabel = 'Fair';
                color = '#f59e0b';
                break;
            case 3:
                strengthLabel = 'Good';
                color = '#3b82f6';
                break;
            case 4:
                strengthLabel = 'Strong';
                color = '#10b981';
                break;
        }

        strengthBar.style.width = `${(strength + 1) * 20}%`;
        strengthBar.style.background = color;
        strengthText.textContent = password ? `Password strength: ${strengthLabel}` : '';
    }

    async verifyResetToken() {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.ENDPOINTS.VERIFY_RESET_TOKEN}/${this.resetToken}`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                this.showError('Invalid or expired reset link. Please request a new one.');
                setTimeout(() => {
                    window.location.href = CONFIG.REDIRECT_PATHS.LOGIN;
                }, 3000);
            }
        } catch (error) {
            console.error('Token verification error:', error);
            this.showError('Error verifying reset link. Please try again.');
        }
    }

    async handlePasswordReset() {
        const newPassword = document.getElementById('new-password')?.value;
        const confirmPassword = document.getElementById('confirm-password')?.value;

        if (!this.validateResetForm(newPassword, confirmPassword)) {
            return;
        }

        const resetBtn = document.getElementById('reset-password-btn');
        if (resetBtn) {
            resetBtn.disabled = true;
            resetBtn.textContent = 'Resetting...';
        }

        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.ENDPOINTS.RESET_PASSWORD}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: this.resetToken,
                    newPassword: newPassword
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showSuccess();
            } else {
                this.showError(data.message || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Reset error:', error);
            this.showError('Error resetting password. Please try again.');
        } finally {
            if (resetBtn) {
                resetBtn.disabled = false;
                resetBtn.textContent = 'Reset Password';
            }
        }
    }

    validateResetForm(newPassword, confirmPassword) {
        let isValid = true;

        if (!newPassword) {
            this.showFieldError('new-password', 'Password is required');
            isValid = false;
        } else if (newPassword.length < 6) {
            this.showFieldError('new-password', 'Password must be at least 6 characters');
            isValid = false;
        }

        if (!confirmPassword) {
            this.showFieldError('confirm-password', 'Please confirm your password');
            isValid = false;
        } else if (newPassword !== confirmPassword) {
            this.showFieldError('confirm-password', 'Passwords do not match');
            isValid = false;
        }

        return isValid;
    }

    showFieldError(fieldId, message) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        const inputElement = document.getElementById(fieldId);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        if (inputElement) {
            inputElement.style.borderColor = '#ef4444';
        }
    }

    clearError(fieldId) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        const inputElement = document.getElementById(fieldId);
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        if (inputElement) {
            inputElement.style.borderColor = '#e5e7eb';
        }
    }

    showError(message) {
        const statusDiv = document.getElementById('reset-status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.style.display = 'block';
            statusDiv.style.background = '#fee2e2';
            statusDiv.style.color = '#991b1b';
        }
    }

    showSuccess() {
        const resetForm = document.getElementById('reset-form');
        const successDiv = document.getElementById('reset-success');
        
        if (resetForm) resetForm.style.display = 'none';
        if (successDiv) successDiv.style.display = 'block';
    }
}

// ==================== Main Auth State ====================
class AuthState {
    constructor() {
        this.isLoading = false;
        this.currentUser = null;
        this.loginAttempts = 0;
        this.maxAttempts = 5;
        this.rememberMe = false;
    }

    incrementAttempts() {
        this.loginAttempts++;
        if (this.loginAttempts >= this.maxAttempts) {
            this.lockAccount();
        }
    }

    resetAttempts() {
        this.loginAttempts = 0;
    }

    lockAccount() {
        const lockUntil = Date.now() + (15 * 60 * 1000);
        localStorage.setItem('account_locked_until', lockUntil);
    }

    isAccountLocked() {
        const lockUntil = localStorage.getItem('account_locked_until');
        if (lockUntil && Date.now() < parseInt(lockUntil)) {
            const remainingTime = Math.ceil((parseInt(lockUntil) - Date.now()) / 60000);
            return { locked: true, remainingTime };
        }
        localStorage.removeItem('account_locked_until');
        return { locked: false };
    }
}

// ==================== API Service ====================
class AuthService {
    constructor() {
        this.baseURL = CONFIG.API.BASE_URL;
    }

    async login(credentials) {
        try {
            const response = await fetch(`${this.baseURL}${CONFIG.ENDPOINTS.LOGIN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password,
                    role: credentials.role,
                    rememberMe: credentials.rememberMe
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Login failed: ${response.status}`);
            }

            return {
                success: true,
                data: data.data || data,
                message: data.message || 'Login successful'
            };

        } catch (error) {
            console.error('Login error:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to server. Please check if the server is running.');
            }
            
            throw error;
        }
    }

    async forgotPassword(email) {
        try {
            const response = await fetch(`${this.baseURL}${CONFIG.ENDPOINTS.FORGOT_PASSWORD}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send reset email');
            }

            return {
                success: true,
                message: data.message || 'Password reset email sent successfully'
            };

        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    }

    async verifyToken(token) {
        try {
            const response = await fetch(`${this.baseURL}${CONFIG.ENDPOINTS.VERIFY_TOKEN}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    }

    async logout() {
        const token = this.getStoredToken();
        
        if (token) {
            try {
                await fetch(`${this.baseURL}${CONFIG.ENDPOINTS.LOGOUT}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        this.clearAuthData();
    }

    clearAuthData() {
        const rememberedEmail = localStorage.getItem(CONFIG.STORAGE_KEYS.REMEMBERED_EMAIL);
        const wasRemembered = localStorage.getItem(CONFIG.STORAGE_KEYS.REMEMBER_ME) === 'true';
        
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.REMEMBER_ME);
        sessionStorage.clear();
        
        if (wasRemembered && rememberedEmail) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.REMEMBERED_EMAIL, rememberedEmail);
            localStorage.setItem(CONFIG.STORAGE_KEYS.REMEMBER_ME, 'true');
        }
    }

    saveAuthData(data, rememberMe = false) {
        const storage = rememberMe ? localStorage : sessionStorage;
        
        const token = data.token || data.accessToken || data.jwt;
        const user = data.user || data.profile || {};
        
        if (token) {
            storage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
        }
        
        if (user) {
            storage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
        }
        
        if (rememberMe) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.REMEMBER_ME, 'true');
        }
    }

    saveRememberedEmail(email) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.REMEMBERED_EMAIL, email);
    }

    getRememberedEmail() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.REMEMBERED_EMAIL);
    }

    getStoredToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN) || 
               sessionStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    }

    getStoredUser() {
        const userStr = localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 
                       sessionStorage.getItem(CONFIG.STORAGE_KEYS.USER);
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    }
}

// ==================== UI Controller ====================
class UIController {
    constructor() {
        this.authState = new AuthState();
        this.authService = new AuthService();
        this.initializeElements();
        this.initializeEventListeners();
        this.checkExistingSession();
        this.loadRememberedCredentials();
        this.createForgotPasswordModal();
    }

    initializeElements() {
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.rememberCheckbox = document.getElementById('rememberMe');
        this.statusDiv = document.getElementById('login-status');
        this.adminLoginBtn = document.querySelector('.admin-login-btn');
        this.userLoginBtn = document.querySelector('.user-login-btn');
        this.forgotPasswordLink = document.getElementById('forgot-password-link');
        
        this.createErrorElements();
    }

    createErrorElements() {
        if (!document.getElementById('email-error')) {
            const emailError = document.createElement('div');
            emailError.id = 'email-error';
            emailError.className = 'field-error';
            emailError.style.display = 'none';
            this.emailInput?.parentElement?.appendChild(emailError);
        }
        
        if (!document.getElementById('password-error')) {
            const passwordError = document.createElement('div');
            passwordError.id = 'password-error';
            passwordError.className = 'field-error';
            passwordError.style.display = 'none';
            this.passwordInput?.parentElement?.appendChild(passwordError);
        }
    }

    createForgotPasswordModal() {
        if (document.getElementById('forgot-password-modal')) return;
        
        const modalHTML = `
            <div id="forgot-password-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Reset Password</h2>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <p>Enter your email address and we'll send you a link to reset your password.</p>
                        <div class="form-group">
                            <label for="reset-email">Email Address</label>
                            <input type="email" id="reset-email" placeholder="Enter your email" />
                            <div id="reset-email-error" class="field-error" style="display: none;"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="send-reset-btn" class="btn btn-primary">Send Reset Link</button>
                        <button id="cancel-reset-btn" class="btn btn-secondary">Cancel</button>
                    </div>
                    <div id="reset-status" class="status-message" style="display: none;"></div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.addModalStyles();
    }

    addModalStyles() {
        if (!document.getElementById('modal-styles')) {
            const styles = `
                <style id="modal-styles">
                    .modal {
                        position: fixed;
                        z-index: 1000;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0,0,0,0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .modal-content {
                        background-color: #fff;
                        padding: 0;
                        border-radius: 8px;
                        width: 90%;
                        max-width: 450px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .modal-header {
                        padding: 20px;
                        border-bottom: 1px solid #e5e7eb;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .modal-header h2 {
                        margin: 0;
                        color: #1f2937;
                        font-size: 1.5rem;
                    }
                    .close-modal {
                        font-size: 28px;
                        font-weight: bold;
                        color: #9ca3af;
                        cursor: pointer;
                        transition: color 0.3s;
                    }
                    .close-modal:hover {
                        color: #1f2937;
                    }
                    .modal-body {
                        padding: 20px;
                    }
                    .modal-body p {
                        color: #6b7280;
                        margin-bottom: 20px;
                    }
                    .modal-footer {
                        padding: 20px;
                        border-top: 1px solid #e5e7eb;
                        display: flex;
                        gap: 10px;
                        justify-content: flex-end;
                    }
                    .btn {
                        padding: 10px 20px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.3s;
                    }
                    .btn-primary {
                        background-color: #3b82f6;
                        color: white;
                    }
                    .btn-primary:hover {
                        background-color: #2563eb;
                    }
                    .btn-secondary {
                        background-color: #e5e7eb;
                        color: #4b5563;
                    }
                    .btn-secondary:hover {
                        background-color: #d1d5db;
                    }
                    #reset-email {
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 14px;
                    }
                    #reset-status {
                        margin: 0 20px 20px;
                        padding: 10px;
                        border-radius: 6px;
                        text-align: center;
                    }
                    #reset-status.success {
                        background-color: #d1fae5;
                        color: #065f46;
                    }
                    #reset-status.error {
                        background-color: #fee2e2;
                        color: #991b1b;
                    }
                    .field-error {
                        color: #ef4444;
                        font-size: 12px;
                        margin-top: 4px;
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }

    initializeEventListeners() {
        this.adminLoginBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogin('admin');
        });

        this.userLoginBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogin('citizen');
        });

        if (this.forgotPasswordLink) {
            this.forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPasswordModal();
            });
        }

        this.initializeModalListeners();

        this.emailInput?.addEventListener('blur', () => this.validateEmail());
        this.passwordInput?.addEventListener('blur', () => this.validatePassword());
        this.emailInput?.addEventListener('input', () => this.clearFieldError('email'));
        this.passwordInput?.addEventListener('input', () => this.clearFieldError('password'));

        this.passwordInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleLogin('citizen');
            }
        });

        this.rememberCheckbox?.addEventListener('change', (e) => {
            this.authState.rememberMe = e.target.checked;
        });
    }

    initializeModalListeners() {
        const modal = document.getElementById('forgot-password-modal');
        const closeBtn = document.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancel-reset-btn');
        const sendBtn = document.getElementById('send-reset-btn');
        const resetEmailInput = document.getElementById('reset-email');

        closeBtn?.addEventListener('click', () => this.closeForgotPasswordModal());
        cancelBtn?.addEventListener('click', () => this.closeForgotPasswordModal());
        sendBtn?.addEventListener('click', () => this.handleForgotPassword());

        resetEmailInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleForgotPassword();
            }
        });

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeForgotPasswordModal();
            }
        });
    }

    async handleLogin(role) {
        const lockStatus = this.authState.isAccountLocked();
        if (lockStatus.locked) {
            this.showNotification(`Account locked for ${lockStatus.remainingTime} minutes`, 'error');
            return;
        }

        if (!this.validateForm()) return;

        const credentials = {
            email: this.emailInput.value.trim(),
            password: this.passwordInput.value,
            role: role,
            rememberMe: this.rememberCheckbox?.checked || false
        };

        this.setLoadingState(true, role);

        try {
            const result = await this.authService.login(credentials);

            if (result.success) {
                this.authState.resetAttempts();
                this.authService.saveAuthData(result.data, credentials.rememberMe);
                
                if (credentials.rememberMe) {
                    this.authService.saveRememberedEmail(credentials.email);
                }

                this.showNotification('Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    const userRole = result.data.user?.role || role;
                    this.redirectUser(userRole);
                }, 1500);
            }
        } catch (error) {
            this.authState.incrementAttempts();
            this.handleLoginError(error);
        } finally {
            this.setLoadingState(false, role);
        }
    }

    async handleForgotPassword() {
        const resetEmailInput = document.getElementById('reset-email');
        const email = resetEmailInput?.value.trim();
        
        if (!email) {
            this.showResetError('Please enter your email address');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showResetError('Please enter a valid email address');
            return;
        }

        const sendBtn = document.getElementById('send-reset-btn');
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.textContent = 'Sending...';
        }

        try {
            const result = await this.authService.forgotPassword(email);
            
            if (result.success) {
                this.showResetSuccess('Password reset link has been sent to your email!');
                if (resetEmailInput) resetEmailInput.value = '';
                
                setTimeout(() => {
                    this.closeForgotPasswordModal();
                }, 3000);
            }
        } catch (error) {
            this.showResetError(error.message || 'Failed to send reset email');
        } finally {
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.textContent = 'Send Reset Link';
            }
        }
    }

    showForgotPasswordModal() {
        const modal = document.getElementById('forgot-password-modal');
        const resetEmailInput = document.getElementById('reset-email');
        
        if (modal) {
            modal.style.display = 'flex';
            if (resetEmailInput && this.emailInput?.value) {
                resetEmailInput.value = this.emailInput.value;
            }
            setTimeout(() => resetEmailInput?.focus(), 100);
        }
    }

    closeForgotPasswordModal() {
        const modal = document.getElementById('forgot-password-modal');
        const resetEmailInput = document.getElementById('reset-email');
        const resetStatus = document.getElementById('reset-status');
        const resetError = document.getElementById('reset-email-error');
        
        if (modal) modal.style.display = 'none';
        if (resetEmailInput) resetEmailInput.value = '';
        if (resetStatus) {
            resetStatus.style.display = 'none';
            resetStatus.textContent = '';
        }
        if (resetError) {
            resetError.style.display = 'none';
            resetError.textContent = '';
        }
    }

    showResetSuccess(message) {
        const statusDiv = document.getElementById('reset-status');
        const errorDiv = document.getElementById('reset-email-error');
        
        if (errorDiv) errorDiv.style.display = 'none';
        
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = 'status-message success';
            statusDiv.style.display = 'block';
        }
    }

    showResetError(message) {
        const errorDiv = document.getElementById('reset-email-error');
        
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    validateForm() {
        return this.validateEmail() && this.validatePassword();
    }

    validateEmail() {
        const email = this.emailInput?.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showFieldError('email', 'Email is required');
            return false;
        }
        
        if (!emailRegex.test(email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            return false;
        }
        
        this.clearFieldError('email');
        return true;
    }

    validatePassword() {
        const password = this.passwordInput?.value;
        
        if (!password) {
            this.showFieldError('password', 'Password is required');
            return false;
        }
        
        if (password.length < 6) {
            this.showFieldError('password', 'Password must be at least 6 characters');
            return false;
        }
        
        this.clearFieldError('password');
        return true;
    }

    showFieldError(field, message) {
        const errorElement = document.getElementById(`${field}-error`);
        const inputElement = document.getElementById(field);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        if (inputElement) {
            inputElement.style.borderColor = '#ef4444';
        }
    }

    clearFieldError(field) {
        const errorElement = document.getElementById(`${field}-error`);
        const inputElement = document.getElementById(field);
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        if (inputElement) {
            inputElement.style.borderColor = '';
        }
    }

    showNotification(message, type = 'info') {
        if (window.Toast) {
            window.Toast[type](message);
        } else if (this.statusDiv) {
            this.statusDiv.textContent = message;
            this.statusDiv.className = `status-message ${type}`;
            this.statusDiv.style.display = 'block';
            
            setTimeout(() => {
                this.statusDiv.style.display = 'none';
            }, type === 'error' ? 10000 : 5000);
        }
    }

    setLoadingState(isLoading, role) {
        const button = role === 'admin' ? this.adminLoginBtn : this.userLoginBtn;
        
        if (button) {
            button.disabled = isLoading;
            button.style.opacity = isLoading ? '0.7' : '';
            button.style.cursor = isLoading ? 'not-allowed' : '';
        }

        if (this.emailInput) this.emailInput.disabled = isLoading;
        if (this.passwordInput) this.passwordInput.disabled = isLoading;
        if (this.rememberCheckbox) this.rememberCheckbox.disabled = isLoading;
    }

    redirectUser(role) {
        const redirectPath = role === 'admin' 
            ? CONFIG.REDIRECT_PATHS.ADMIN 
            : CONFIG.REDIRECT_PATHS.CITIZEN;
        
        window.location.href = redirectPath;
    }

    handleLoginError(error) {
        console.error('Login failed:', error);
        let errorMessage = 'Login failed. Please try again.';
        
        if (error.message.includes('401') || error.message.includes('Invalid')) {
            errorMessage = 'Invalid email or password';
        } else if (error.message.includes('Cannot connect')) {
            errorMessage = 'Cannot connect to server';
        }
        
        this.showNotification(errorMessage, 'error');
    }

    async checkExistingSession() {
        const token = this.authService.getStoredToken();
        
        if (token) {
            const isValid = await this.authService.verifyToken(token);
            if (isValid) {
                const user = this.authService.getStoredUser();
                if (user?.role) {
                    this.showNotification('Already logged in. Redirecting...', 'info');
                    setTimeout(() => this.redirectUser(user.role), 1500);
                }
            } else {
                this.authService.clearAuthData();
            }
        }
    }

    loadRememberedCredentials() {
        const rememberedEmail = this.authService.getRememberedEmail();
        
        if (rememberedEmail && this.emailInput) {
            this.emailInput.value = rememberedEmail;
            if (this.rememberCheckbox) {
                this.rememberCheckbox.checked = true;
                this.authState.rememberMe = true;
            }
            setTimeout(() => this.passwordInput?.focus(), 100);
        } else {
            setTimeout(() => this.emailInput?.focus(), 100);
        }
    }
}

// ==================== Initialize Application ====================
document.addEventListener('DOMContentLoaded', () => {
    const passwordResetHandler = new PasswordResetHandler();
    const uiController = new UIController();
    
    const passwordContainer = document.querySelector('.password-input-container') || 
                            document.querySelector('.form-group:has(#password)') ||
                            document.getElementById('password')?.parentElement;
    
    if (passwordContainer && !document.getElementById('forgot-password-link')) {
        const forgotLink = document.createElement('a');
        forgotLink.id = 'forgot-password-link';
        forgotLink.href = '#';
        forgotLink.textContent = 'Forgot password?';
        forgotLink.style.cssText = `
            display: inline-block;
            margin-top: 8px;
            color: #3b82f6;
            font-size: 14px;
            text-decoration: none;
            transition: color 0.3s;
        `;
        
        passwordContainer.appendChild(forgotLink);
        
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            uiController.showForgotPasswordModal();
        });
    }
    
    if (window.location.hostname === 'localhost') {
        window.cityFixAuth = {
            authService: uiController.authService,
            authState: uiController.authState,
            uiController,
            passwordResetHandler
        };
    }
    
    console.log('✅ CityFix Complete Authentication System Initialized');
    console.log('📝 Features: Login ✓ | Remember Me ✓ | Forgot Password ✓ | Reset Password ✓');
});