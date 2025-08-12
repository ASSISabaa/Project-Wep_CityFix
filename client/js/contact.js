// contact.js

// ===========================
// Configuration
// ===========================
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api', // Your backend API URL
    ENDPOINTS: {
        CONTACT: '/contact',
        SUBSCRIBE: '/newsletter/subscribe',
        UPLOAD: '/upload'
    },
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// ===========================
// DOM Elements
// ===========================
const elements = {
    form: document.getElementById('contactForm'),
    submitBtn: document.getElementById('submitBtn'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    messageToast: document.getElementById('messageToast'),
    charCount: document.getElementById('charCount'),
    messageTextarea: document.getElementById('message'),
    fileInput: document.getElementById('attachment'),
    fileName: document.getElementById('fileName'),
    mapContainer: document.getElementById('map')
};

// Form field elements
const formFields = {
    firstName: document.getElementById('firstName'),
    lastName: document.getElementById('lastName'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    subject: document.getElementById('subject'),
    message: document.getElementById('message'),
    privacy: document.getElementById('privacy'),
    newsletter: document.getElementById('newsletter'),
    attachment: document.getElementById('attachment')
};

// Error message elements
const errorElements = {
    firstName: document.getElementById('firstNameError'),
    lastName: document.getElementById('lastNameError'),
    email: document.getElementById('emailError'),
    phone: document.getElementById('phoneError'),
    subject: document.getElementById('subjectError'),
    message: document.getElementById('messageError'),
    privacy: document.getElementById('privacyError'),
    attachment: document.getElementById('attachmentError')
};

// ===========================
// Validation Rules
// ===========================
const validationRules = {
    firstName: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s'-]+$/,
        message: 'Please enter a valid first name (2-50 characters)'
    },
    lastName: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s'-]+$/,
        message: 'Please enter a valid last name (2-50 characters)'
    },
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
    },
    phone: {
        required: false,
        pattern: /^[\d\s\-\+\(\)]+$/,
        minLength: 10,
        message: 'Please enter a valid phone number'
    },
    subject: {
        required: true,
        message: 'Please select a subject'
    },
    message: {
        required: true,
        minLength: 10,
        maxLength: 1000,
        message: 'Message must be between 10 and 1000 characters'
    },
    privacy: {
        required: true,
        message: 'You must agree to the privacy policy'
    }
};

// ===========================
// Utility Functions
// ===========================

// Debounce function for input validation
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

// Show loading state
function showLoading() {
    elements.loadingSpinner.classList.add('active');
    elements.submitBtn.classList.add('loading');
    elements.submitBtn.disabled = true;
}

// Hide loading state
function hideLoading() {
    elements.loadingSpinner.classList.remove('active');
    elements.submitBtn.classList.remove('loading');
    elements.submitBtn.disabled = false;
}

// Show toast message
function showToast(message, type = 'success') {
    const toast = elements.messageToast;
    const toastContent = toast.querySelector('.toast-content');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    
    // Set message and type
    toastMessage.textContent = message;
    toast.className = `message-toast ${type} show`;
    
    // Set icon based on type
    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle toast-icon';
    } else if (type === 'error') {
        toastIcon.className = 'fas fa-exclamation-circle toast-icon';
    }
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// Sanitize input to prevent XSS
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// ===========================
// Validation Functions
// ===========================

// Validate individual field
function validateField(fieldName, value) {
    const rules = validationRules[fieldName];
    const errorElement = errorElements[fieldName];
    const fieldElement = formFields[fieldName];
    
    if (!rules) return true;
    
    // Clear previous error
    errorElement.textContent = '';
    errorElement.classList.remove('show');
    fieldElement.classList.remove('error');
    
    // Check required
    if (rules.required && !value) {
        showFieldError(fieldName, `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`);
        return false;
    }
    
    // Skip other validations if field is empty and not required
    if (!value && !rules.required) return true;
    
    // Check pattern
    if (rules.pattern && !rules.pattern.test(value)) {
        showFieldError(fieldName, rules.message);
        return false;
    }
    
    // Check min length
    if (rules.minLength && value.length < rules.minLength) {
        showFieldError(fieldName, rules.message);
        return false;
    }
    
    // Check max length
    if (rules.maxLength && value.length > rules.maxLength) {
        showFieldError(fieldName, rules.message);
        return false;
    }
    
    // Special validation for checkbox
    if (fieldElement.type === 'checkbox' && rules.required && !fieldElement.checked) {
        showFieldError(fieldName, rules.message);
        return false;
    }
    
    return true;
}

// Show field error
function showFieldError(fieldName, message) {
    const errorElement = errorElements[fieldName];
    const fieldElement = formFields[fieldName];
    
    errorElement.textContent = message;
    errorElement.classList.add('show');
    fieldElement.classList.add('error');
}

// Validate entire form
function validateForm() {
    let isValid = true;
    
    for (const fieldName in formFields) {
        if (fieldName === 'newsletter' || fieldName === 'attachment') continue;
        
        const fieldElement = formFields[fieldName];
        let value;
        
        if (fieldElement.type === 'checkbox') {
            value = fieldElement.checked;
        } else {
            value = fieldElement.value.trim();
        }
        
        if (!validateField(fieldName, value)) {
            isValid = false;
        }
    }
    
    return isValid;
}

// ===========================
// File Upload Handling
// ===========================

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    const fileName = elements.fileName;
    const errorElement = errorElements.attachment;
    
    // Clear previous error
    errorElement.textContent = '';
    errorElement.classList.remove('show');
    
    if (file) {
        // Check file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            errorElement.textContent = 'File size must be less than 5MB';
            errorElement.classList.add('show');
            event.target.value = '';
            fileName.textContent = 'Choose a file or drag it here';
            return;
        }
        
        // Check file type
        const allowedTypes = ['application/pdf', 'application/msword', 
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            'image/jpeg', 'image/jpg', 'image/png'];
        
        if (!allowedTypes.includes(file.type)) {
            errorElement.textContent = 'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed';
            errorElement.classList.add('show');
            event.target.value = '';
            fileName.textContent = 'Choose a file or drag it here';
            return;
        }
        
        // Update file name display
        fileName.textContent = file.name;
    } else {
        fileName.textContent = 'Choose a file or drag it here';
    }
}

// Upload file to server
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('File upload failed');
        }
        
        const data = await response.json();
        return data.fileUrl; // Return the uploaded file URL
    } catch (error) {
        console.error('File upload error:', error);
        throw error;
    }
}

// ===========================
// Form Submission
// ===========================

// Prepare form data for submission
async function prepareFormData() {
    const formData = {
        firstName: sanitizeInput(formFields.firstName.value.trim()),
        lastName: sanitizeInput(formFields.lastName.value.trim()),
        email: sanitizeInput(formFields.email.value.trim()),
        phone: sanitizeInput(formFields.phone.value.trim()),
        subject: formFields.subject.value,
        message: sanitizeInput(formFields.message.value.trim()),
        newsletter: formFields.newsletter.checked,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'Direct'
    };
    
    // Handle file upload if present
    if (formFields.attachment.files[0]) {
        try {
            formData.attachmentUrl = await uploadFile(formFields.attachment.files[0]);
        } catch (error) {
            console.error('Failed to upload file:', error);
            // Continue without attachment
        }
    }
    
    return formData;
}

// Submit form to backend
async function submitForm(formData) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTACT}`, {
            method: 'POST',
            headers: API_CONFIG.HEADERS,
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to submit form');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Form submission error:', error);
        throw error;
    }
}

// Handle newsletter subscription
async function subscribeToNewsletter(email) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUBSCRIBE}`, {
            method: 'POST',
            headers: API_CONFIG.HEADERS,
            body: JSON.stringify({ email })
        });
        
        if (!response.ok) {
            console.error('Newsletter subscription failed');
        }
    } catch (error) {
        console.error('Newsletter subscription error:', error);
    }
}

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        showToast('Please fix the errors in the form', 'error');
        return;
    }
    
    // Show loading state
    showLoading();
    
    try {
        // Prepare form data
        const formData = await prepareFormData();
        
        // Submit form to backend
        const response = await submitForm(formData);
        
        // Handle newsletter subscription if checked
        if (formData.newsletter) {
            await subscribeToNewsletter(formData.email);
        }
        
        // Show success message
        showToast('Thank you for your message! We will get back to you soon.', 'success');
        
        // Reset form
        elements.form.reset();
        elements.fileName.textContent = 'Choose a file or drag it here';
        elements.charCount.textContent = '0';
        
        // Log success for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
                'event_category': 'Contact',
                'event_label': formData.subject
            });
        }
        
    } catch (error) {
        // Show error message
        showToast(error.message || 'Something went wrong. Please try again later.', 'error');
        
        // Log error for monitoring
        console.error('Form submission failed:', error);
        
    } finally {
        // Hide loading state
        hideLoading();
    }
}

// ===========================
// Event Listeners
// ===========================

// Form submission
elements.form.addEventListener('submit', handleSubmit);

// Real-time validation for all fields
Object.keys(formFields).forEach(fieldName => {
    const field = formFields[fieldName];
    
    if (field.type === 'checkbox') {
        field.addEventListener('change', () => {
            validateField(fieldName, field.checked);
        });
    } else {
        // Debounced validation for text inputs
        const debouncedValidate = debounce(() => {
            validateField(fieldName, field.value.trim());
        }, 300);
        
        field.addEventListener('input', debouncedValidate);
        field.addEventListener('blur', () => {
            validateField(fieldName, field.value.trim());
        });
    }
});

// Character counter for message
elements.messageTextarea.addEventListener('input', (e) => {
    const count = e.target.value.length;
    elements.charCount.textContent = count;
    
    // Change color when approaching limit
    if (count > 900) {
        elements.charCount.parentElement.style.color = 'var(--warning-color)';
    } else if (count >= 1000) {
        elements.charCount.parentElement.style.color = 'var(--error-color)';
    } else {
        elements.charCount.parentElement.style.color = 'var(--text-secondary)';
    }
});

// File upload handling
elements.fileInput.addEventListener('change', handleFileSelect);

// Drag and drop for file upload
const fileLabel = document.querySelector('.file-label');

fileLabel.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileLabel.style.background = 'rgba(37, 99, 235, 0.1)';
});

fileLabel.addEventListener('dragleave', (e) => {
    e.preventDefault();
    fileLabel.style.background = 'var(--light-color)';
});

fileLabel.addEventListener('drop', (e) => {
    e.preventDefault();
    fileLabel.style.background = 'var(--light-color)';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        elements.fileInput.files = files;
        handleFileSelect({ target: { files } });
    }
});

// ===========================
// Map Integration
// ===========================

// Initialize map (using OpenStreetMap with Leaflet as an example)
function initializeMap() {
    // Check if Leaflet is loaded
    if (typeof L !== 'undefined') {
        const map = L.map('map').setView([40.7128, -74.0060], 13); // New York coordinates
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Add marker
        L.marker([40.7128, -74.0060]).addTo(map)
            .bindPopup('Our Office<br>123 Business Avenue<br>New York, NY 10001')
            .openPopup();
    } else {
        // Fallback if map library is not loaded
        console.log('Map library not loaded. Add Leaflet library to enable map functionality.');
        
        // Optional: Load Google Maps instead
        // loadGoogleMaps();
    }
}

// Load Google Maps (alternative)
function loadGoogleMaps() {
    const mapContainer = elements.mapContainer;
    
    // Create iframe for Google Maps embed
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.1234567890123!2d-74.0060!3d40.7128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQyJzQ2LjEiTiA3NMKwMDAnMjEuNiJX!5e0!3m2!1sen!2sus!4v1234567890123';
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.style.border = '0';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    
    // Clear placeholder and add iframe
    mapContainer.innerHTML = '';
    mapContainer.appendChild(iframe);
}

// ===========================
// Analytics Integration
// ===========================

// Track form interactions
function trackFormInteraction(action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': 'Contact Form',
            'event_label': label
        });
    }
}

// Track field focus
Object.keys(formFields).forEach(fieldName => {
    formFields[fieldName].addEventListener('focus', () => {
        trackFormInteraction('field_focus', fieldName);
    }, { once: true });
});

// ===========================
// Initialize on Page Load
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize map
    setTimeout(initializeMap, 1000);
    
    // Load saved form data from localStorage (if any)
    loadSavedFormData();
    
    // Save form data periodically
    setInterval(saveFormData, 5000);
    
    // Check for URL parameters (for pre-filling)
    prefillFromURL();
    
    // Initialize tooltips if needed
    initializeTooltips();
});

// ===========================
// Additional Features
// ===========================

// Save form data to localStorage
function saveFormData() {
    const formData = {};
    
    Object.keys(formFields).forEach(fieldName => {
        if (fieldName === 'attachment' || fieldName === 'privacy') return;
        
        const field = formFields[fieldName];
        if (field.type === 'checkbox') {
            formData[fieldName] = field.checked;
        } else {
            formData[fieldName] = field.value;
        }
    });
    
    localStorage.setItem('contactFormData', JSON.stringify(formData));
}

// Load saved form data
function loadSavedFormData() {
    const savedData = localStorage.getItem('contactFormData');
    
    if (savedData) {
        try {
            const formData = JSON.parse(savedData);
            
            Object.keys(formData).forEach(fieldName => {
                if (formFields[fieldName]) {
                    if (formFields[fieldName].type === 'checkbox') {
                        formFields[fieldName].checked = formData[fieldName];
                    } else {
                        formFields[fieldName].value = formData[fieldName];
                    }
                }
            });
            
            // Update character counter
            if (formData.message) {
                elements.charCount.textContent = formData.message.length;
            }
        } catch (error) {
            console.error('Error loading saved form data:', error);
        }
    }
}

// Clear saved form data after successful submission
function clearSavedFormData() {
    localStorage.removeItem('contactFormData');
}

// Pre-fill form from URL parameters
function prefillFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    urlParams.forEach((value, key) => {
        if (formFields[key] && key !== 'attachment') {
            formFields[key].value = decodeURIComponent(value);
        }
    });
}

// Initialize tooltips
function initializeTooltips() {
    // Add tooltips for help text if needed
    const tooltips = [
        { element: formFields.phone, text: 'Include country code for international numbers' },
        { element: formFields.attachment, text: 'Drag and drop files here or click to browse' }
    ];
    
    tooltips.forEach(({ element, text }) => {
        if (element) {
            element.setAttribute('title', text);
        }
    });
}

// ===========================
// Export functions for testing
// ===========================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateField,
        validateForm,
        sanitizeInput,
        prepareFormData,
        submitForm
    };
}