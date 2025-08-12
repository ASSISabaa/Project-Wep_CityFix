/**
 * CityFix Flash Messages System
 * Displays success/error messages from sessionStorage
 */

(function() {
    'use strict';

    // Check for flash message from sessionStorage
    function checkFlashMessage() {
        const flashData = sessionStorage.getItem('flash');
        if (!flashData) return;

        try {
            const flash = JSON.parse(flashData);
            sessionStorage.removeItem('flash'); // Remove after reading
            
            if (flash.text) {
                showFlashMessage(flash.text, flash.type || 'info');
            }
        } catch (error) {
            console.warn('Failed to parse flash message:', error);
            sessionStorage.removeItem('flash');
        }
    }

    // Show flash message
    function showFlashMessage(message, type = 'info') {
        const flash = document.createElement('div');
        
        const colors = {
            success: { bg: '#10b981', border: '#059669' },
            error: { bg: '#ef4444', border: '#dc2626' },
            warning: { bg: '#f59e0b', border: '#d97706' },
            info: { bg: '#3b82f6', border: '#2563eb' }
        };

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const { bg, border } = colors[type] || colors.info;
        const icon = icons[type] || icons.info;

        flash.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-left: 4px solid ${border};
            border-radius: 8px;
            padding: 16px 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            z-index: 10000;
            max-width: 400px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        flash.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 18px;">${icon}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                        ${type === 'success' ? 'Success!' : type === 'error' ? 'Error!' : 'Notice'}
                    </div>
                    <div style="color: #4b5563; font-size: 14px; line-height: 1.4;">
                        ${message}
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 16px; padding: 4px;">
                    ×
                </button>
            </div>
        `;

        document.body.appendChild(flash);

        // Animate in
        setTimeout(() => {
            flash.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            if (flash.parentNode) {
                flash.style.transform = 'translateX(100%)';
                setTimeout(() => flash.remove(), 300);
            }
        }, 8000);
    }

    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkFlashMessage);
    } else {
        checkFlashMessage();
    }

})();