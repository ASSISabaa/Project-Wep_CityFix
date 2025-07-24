// CityFix Enhanced JavaScript - Clean Advanced Date Validation System
// Enhanced date checking system with real-time validation and map integration

// Global variables and data
let isFilterApplied = false;
let currentFilters = {
    startDate: '',
    endDate: '',
    district: '',
    issueTypes: ['potholes', 'lighting', 'drainage']
};

// Advanced Date Validation System
const DateValidator = {
    // Get current date with precise time handling - REAL system date
    getCurrentDate: function() {
        const now = new Date(); // Get actual system date
        // Set to end of day for proper comparison
        now.setHours(23, 59, 59, 999);
        return now;
    },

    // Get formatted current date string for display
    getCurrentDateString: function() {
        const today = this.getCurrentDate();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const year = today.getFullYear();
        return `${month}/${day}/${year}`;
    },

    // Check current system date and log it (silently)
    checkSystemDate: function() {
        const now = new Date();
        const dateStr = this.getCurrentDateString();
        return {
            date: dateStr,
            time: now.toLocaleTimeString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: now.getTime()
        };
    },

    // Continuous date monitoring (background only) - Enhanced
    startDateMonitoring: function() {
        // Check system date immediately on start
        this.performSystemDateCheck();
        
        // Update validation silently every minute
        setInterval(() => {
            this.performSystemDateCheck();
            this.updateAllDateValidations();
        }, 60000);
        
        // Also check every 30 seconds for more frequent monitoring
        setInterval(() => {
            this.performSystemDateCheck();
        }, 30000);
        
        // Check when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.performSystemDateCheck();
                setTimeout(() => this.updateAllDateValidations(), 100);
            }
        });
    },

    // Perform comprehensive system date check
    performSystemDateCheck: function() {
        const now = new Date();
        const currentDateInfo = this.checkSystemDate();
        
        // Validate system constraints
        this.validateSystemConstraints(now);
        
        // Update internal date references
        this.updateInternalDateReferences(now);
        
        // Auto-populate or update date inputs based on real system date
        this.updateAutoPopulatedDates();
        
        // Check all existing date inputs against new system date
        this.revalidateAllInputsAgainstSystemDate(now);
        
        return currentDateInfo;
    },

    // Validate system constraints and date logic (no minimum date restriction)
    validateSystemConstraints: function(systemDate) {
        const maxDate = this.getCurrentDate();
        
        // Ensure system date is reasonable
        if (systemDate > maxDate) {
            console.warn('System date appears to be in the future');
        }
        
        // Check for reasonable date ranges (no minimum restriction)
        const currentYear = systemDate.getFullYear();
        if (currentYear > 2030) {
            console.warn('System date year seems outside expected range');
        }
        
        return true;
    },

    // Update internal date references
    updateInternalDateReferences: function(systemDate) {
        // Update internal date references (no minimum date restriction)
        this._lastSystemCheck = systemDate.getTime();
        this._currentSystemDate = new Date(systemDate);
        
        // No minimum date restriction needed
        this._maxSystemDate = this.getCurrentDate();
    },

    // Revalidate all inputs against current system date
    revalidateAllInputsAgainstSystemDate: function(systemDate) {
        const dateInputs = document.querySelectorAll('.date-input');
        let hasChanges = false;
        
        dateInputs.forEach(input => {
            if (input.value && input.value.length === 10) {
                const inputDate = this.parseDate(input.value);
                if (inputDate) {
                    // Check if this date is now invalid due to system date change (only future dates)
                    const wasValid = !input.classList.contains('invalid-date');
                    const isNowValid = inputDate <= systemDate; // No minimum date restriction
                    
                    if (wasValid !== isNowValid) {
                        hasChanges = true;
                        // Trigger revalidation
                        setTimeout(() => performRealTimeValidation(input), 10);
                    }
                }
            }
        });
        
        // If there were validation changes, update map functionality
        if (hasChanges) {
            setTimeout(() => {
                const allValid = validateAllDates();
                updateMapFunctionality(allValid);
            }, 50);
        }
    },

    // Update displayed dates throughout the UI (minimal)
    updateDisplayedDates: function() {
        // Only update if there are validation errors that need current date
        const dateInputs = document.querySelectorAll('.date-input');
        dateInputs.forEach(input => {
            if (input.value) {
                performRealTimeValidation(input);
            }
        });
    },

    // Enhanced real-time date validation with system date awareness
    updateAllDateValidations: function() {
        // First check current system date
        const currentSystemDate = this.getCurrentDate();
        
        const dateInputs = document.querySelectorAll('.date-input');
        let validationResults = [];
        
        dateInputs.forEach((input, index) => {
            if (input.value) {
                const inputDate = this.parseDate(input.value);
                if (inputDate) {
                    // Check against current system date
                    const isValid = this.isDateValidAgainstSystem(inputDate, currentSystemDate);
                    validationResults.push({ input, isValid, date: inputDate });
                    
                    // Update validation display if needed
                    performRealTimeValidation(input);
                }
            }
        });
        
        // Check date range validity
        if (validationResults.length === 2) {
            const startResult = validationResults[0];
            const endResult = validationResults[1];
            
            if (startResult.isValid && endResult.isValid) {
                // Both dates are individually valid, check range
                if (startResult.date > endResult.date) {
                    // Range is invalid
                    setTimeout(() => validateDateRangeIfBothPresent(), 10);
                }
            }
        }
        
        return validationResults;
    },

    // Auto-populate date inputs with intelligent defaults (no minimum date restriction)
    autoPopulateDateInputs: function() {
        const dateInputs = document.querySelectorAll('.date-input');
        if (dateInputs.length < 2) return;
        
        const currentDate = this.getCurrentDate();
        const currentDateStr = this.getCurrentDateString();
        
        // Calculate intelligent start date (30 days ago)
        const thirtyDaysAgo = new Date(currentDate);
        thirtyDaysAgo.setDate(currentDate.getDate() - 30);
        const startDateStr = this.formatDateToString(thirtyDaysAgo);
        
        // Auto-fill the inputs if they're empty
        if (dateInputs[0] && !dateInputs[0].value) {
            dateInputs[0].value = startDateStr;
            dateInputs[0].style.color = '#666'; // Indicate auto-filled
            setTimeout(() => performRealTimeValidation(dateInputs[0]), 100);
        }
        
        if (dateInputs[1] && !dateInputs[1].value) {
            dateInputs[1].value = currentDateStr;
            dateInputs[1].style.color = '#666'; // Indicate auto-filled
            setTimeout(() => performRealTimeValidation(dateInputs[1]), 100);
        }
        
        console.log(`📅 Auto-populated dates: ${startDateStr} to ${currentDateStr}`);
        return { startDate: startDateStr, endDate: currentDateStr };
    },

    // Format Date object to mm/dd/yyyy string
    formatDateToString: function(date) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    },

    // Update auto-populated dates when system date changes
    updateAutoPopulatedDates: function() {
        const dateInputs = document.querySelectorAll('.date-input');
        if (dateInputs.length < 2) return;
        
        const currentDateStr = this.getCurrentDateString();
        
        // Update end date if it was auto-filled and is now outdated
        if (dateInputs[1] && dateInputs[1].style.color === 'rgb(102, 102, 102)') {
            const inputDate = this.parseDate(dateInputs[1].value);
            const systemDate = this.getCurrentDate();
            
            // If auto-filled date is more than a day behind system date, update it
            const daysDifference = (systemDate - inputDate) / (1000 * 60 * 60 * 24);
            if (daysDifference >= 1) {
                dateInputs[1].value = currentDateStr;
                setTimeout(() => performRealTimeValidation(dateInputs[1]), 100);
                console.log(`📅 Auto-updated end date to: ${currentDateStr}`);
            }
        }
    },

    // Advanced system date monitoring with change detection
    monitorSystemDateChanges: function() {
        let lastKnownDate = this.getCurrentDate().getTime();
        
        return setInterval(() => {
            const currentDate = this.getCurrentDate().getTime();
            
            // Detect if system date has changed significantly
            const timeDifference = Math.abs(currentDate - lastKnownDate);
            const expectedDifference = 60000; // 1 minute expected
            
            if (timeDifference > expectedDifference * 2) {
                // System date seems to have jumped - revalidate everything
                console.log('System date change detected - revalidating all dates');
                this.performSystemDateCheck();
                
                // Force revalidation of all inputs
                setTimeout(() => {
                    const allValid = validateAllDates();
                    updateMapFunctionality(allValid);
                }, 100);
            }
            
            lastKnownDate = currentDate;
        }, 30000); // Check every 30 seconds
    },

    // Get system start date (earliest allowed date for reports)
    getSystemStartDate: function() {
        const startDate = new Date('2020-01-01');
        return startDate;
    },

    // Check if date format is valid (mm/dd/yyyy only)
    isValidDateFormat: function(dateString) {
        const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
        return regex.test(dateString);
    },

    // Parse date string to Date object
    parseDate: function(dateString) {
        if (!this.isValidDateFormat(dateString)) return null;
        const [month, day, year] = dateString.split('/').map(num => parseInt(num));
        return new Date(year, month - 1, day);
    },

    // Check if date is a real calendar date
    isRealDate: function(dateString) {
        if (!this.isValidDateFormat(dateString)) return false;
        
        const date = this.parseDate(dateString);
        const [month, day, year] = dateString.split('/').map(num => parseInt(num));
        
        return date && date.getMonth() + 1 === month && 
               date.getDate() === day && 
               date.getFullYear() === year;
    },

    // Check if date is within allowed range (not future, not too old)
    isDateInRange: function(dateString) {
        if (!this.isRealDate(dateString)) return false;
        
        const date = this.parseDate(dateString);
        const currentDate = this.getCurrentDate();
        const systemStartDate = this.getSystemStartDate();
        
        return date >= systemStartDate && date <= currentDate;
    },

    // Get validation message for date (accepts any date up to today)
    getValidationMessage: function(dateString, isStartDate = false) {
        if (!dateString) return { isValid: true, message: '' };
        
        if (dateString.length < 10) {
            return { isValid: false, message: 'Complete date required' };
        }

        if (!this.isValidDateFormat(dateString)) {
            return { isValid: false, message: 'Invalid format' };
        }

        if (!this.isRealDate(dateString)) {
            return { isValid: false, message: 'Invalid date' };
        }

        const date = this.parseDate(dateString);
        const currentDate = this.getCurrentDate();

        // Only check if date is in the future - allow any past date
        if (date > currentDate) {
            return { isValid: false, message: 'Date cannot be in the future' };
        }

        return { isValid: true, message: 'Valid date' };
    },

    // Check if date range is valid (start date before end date)
    isValidDateRange: function(startDate, endDate) {
        if (!startDate || !endDate) return true;
        
        const start = this.parseDate(startDate);
        const end = this.parseDate(endDate);
        
        if (!start || !end) return false;
        
        if (start > end) {
            return { isValid: false, message: 'End date must be after start date' };
        }

        // Check if range is too large (more than 2 years)
        const twoYearsInMs = 2 * 365 * 24 * 60 * 60 * 1000;
        if (end - start > twoYearsInMs) {
            return { isValid: false, message: 'Date range cannot exceed 2 years' };
        }

        return { isValid: true, message: 'Valid date range' };
    }
};

// Sample data for dynamic functionality (Fallback Data)
const cityData = {
    districts: {
        '': { 
            name: 'All Districts', 
            reports: 15234, 
            resolved: 12847, 
            avgTime: 4.2 
        },
        'downtown': { 
            name: 'Downtown', 
            reports: 4521, 
            resolved: 3846, 
            avgTime: 3.2 
        },
        'north': { 
            name: 'North District', 
            reports: 2834, 
            resolved: 2456, 
            avgTime: 4.1 
        },
        'south': { 
            name: 'South District', 
            reports: 3456, 
            resolved: 2987, 
            avgTime: 4.8 
        },
        'east': { 
            name: 'East District', 
            reports: 2987, 
            resolved: 2534, 
            avgTime: 5.2 
        },
        'west': { 
            name: 'West District', 
            reports: 1436, 
            resolved: 1024, 
            avgTime: 6.1 
        }
    },
    issueTypes: {
        'potholes': { 
            name: 'Potholes', 
            count: 5423, 
            resolved: 4230, 
            avgTime: 4.2, 
            icon: '🕳️' 
        },
        'lighting': { 
            name: 'Street Lighting', 
            count: 3891, 
            resolved: 3579, 
            avgTime: 2.8, 
            icon: '💡' 
        },
        'drainage': { 
            name: 'Drainage Issues', 
            count: 2156, 
            resolved: 1833, 
            avgTime: 6.1, 
            icon: '🌊' 
        },
        'traffic': { 
            name: 'Traffic Signals', 
            count: 1876, 
            resolved: 1654, 
            avgTime: 3.9, 
            icon: '🚦' 
        },
        'sidewalk': { 
            name: 'Sidewalk Issues', 
            count: 1888, 
            resolved: 1551, 
            avgTime: 5.4, 
            icon: '🚶' 
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('CityFix Enhanced Script Loading...');
    initializeApp();
});

// Main initialization function
function initializeApp() {
    // Start enhanced date monitoring with system awareness
    DateValidator.startDateMonitoring();
    
    // Start system date change monitoring
    DateValidator.monitorSystemDateChanges();
    
    setupEventListeners();
    initializeMobileMenu();
    initializeFilters();
    initializeMapActions();
    initializeIssueCards();
    initializeCounterAnimations();
    initializeTooltips();
    initializeDateValidationSystem();
    
    // Perform initial system validation
    setTimeout(() => {
        DateValidator.performSystemDateCheck();
        validateAllDates();
    }, 500);
    
    console.log('✅ CityFix Enhanced Script Loaded Successfully with Advanced Date Monitoring!');
}

// Initialize advanced date validation system
function initializeDateValidationSystem() {
    // Set up real-time date validation
    const dateInputs = document.querySelectorAll('.date-input');
    dateInputs.forEach((input, index) => {
        // Enhanced input setup
        input.type = 'text';
        input.maxLength = 10;
        input.autocomplete = 'off';
        input.setAttribute('data-date-input', index === 0 ? 'start' : 'end');
        
        // Add comprehensive event listeners
        input.addEventListener('input', handleAdvancedDateInput);
        input.addEventListener('blur', handleAdvancedDateBlur);
        input.addEventListener('focus', handleAdvancedDateFocus);
        input.addEventListener('keydown', handleAdvancedDateKeydown);
        input.addEventListener('paste', handleDatePaste);
        
        // Clear auto-fill styling when user starts typing
        input.addEventListener('input', function() {
            if (this.style.color === 'rgb(102, 102, 102)') {
                this.style.color = ''; // Reset to normal color
            }
        });
    });

    // Set dynamic date limits based on real system date
    DateValidator.setDynamicDateLimits();
    
    // Auto-populate date inputs with intelligent defaults
    setTimeout(() => {
        DateValidator.autoPopulateDateInputs();
        // Trigger initial data update with auto-populated dates
        setTimeout(() => {
            updateCurrentFilters();
            updateDashboardData();
        }, 200);
    }, 500);

    // Continuous validation check every 5 seconds with system awareness
    setInterval(() => {
        // Check for system date changes first
        DateValidator.performSystemDateCheck();
        // Then validate all dates
        validateAllDates();
    }, 5000);
    
    // More frequent system monitoring every 10 seconds
    setInterval(() => {
        DateValidator.performSystemDateCheck();
    }, 10000);
    
    // Also validate when page becomes visible (user switches back to tab)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            // System might have changed while tab was hidden
            DateValidator.performSystemDateCheck();
            setTimeout(validateAllDates, 500);
        }
    });
    
    // Check when window regains focus
    window.addEventListener('focus', function() {
        DateValidator.performSystemDateCheck();
        setTimeout(validateAllDates, 200);
    });
    
    // Initial validation with system check
    setTimeout(() => {
        DateValidator.performSystemDateCheck();
        validateAllDates();
    }, 1000);
}

// ==============================================
// ADVANCED DATE INPUT HANDLING
// ==============================================

function handleAdvancedDateInput(event) {
    const input = event.target;
    let value = input.value;
    const cursorPosition = input.selectionStart;
    
    // Handle backspace and delete for slashes
    if (event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') {
        // Allow natural deletion including slashes
        performRealTimeValidation(input);
        return;
    }
    
    // Remove all non-digits for processing
    let digits = value.replace(/\D/g, '');
    
    // Auto-format while typing
    let formattedValue = '';
    if (digits.length >= 2) {
        formattedValue = digits.substring(0, 2) + '/' + digits.substring(2);
    } else {
        formattedValue = digits;
    }
    
    if (digits.length >= 4) {
        formattedValue = digits.substring(0, 2) + '/' + digits.substring(2, 4) + '/' + digits.substring(4, 8);
    }
    
    // Update input value
    input.value = formattedValue;
    
    // Maintain cursor position after formatting
    const newCursorPos = calculateCursorPosition(value, formattedValue, cursorPosition);
    input.setSelectionRange(newCursorPos, newCursorPos);
    
    // Real-time validation with visual feedback
    performRealTimeValidation(input);
}

// Helper function to calculate cursor position after formatting
function calculateCursorPosition(oldValue, newValue, oldCursor) {
    // Count slashes before cursor in old value
    const slashesBefore = (oldValue.substring(0, oldCursor).match(/\//g) || []).length;
    // Count slashes before cursor in new value
    const newSlashesBefore = (newValue.substring(0, oldCursor).match(/\//g) || []).length;
    
    // Adjust cursor position based on slash difference
    return oldCursor + (newSlashesBefore - slashesBefore);
}

function handleAdvancedDateKeydown(event) {
    const input = event.target;
    const key = event.key;
    const cursorPosition = input.selectionStart;
    
    // Allow: backspace, delete, tab, escape, enter, arrows
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    
    if (allowedKeys.includes(key)) {
        return; // Allow these keys
    }
    
    // Allow Ctrl combinations (Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X)
    if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(key.toLowerCase())) {
        return;
    }
    
    // Only allow numbers
    if (!/[0-9]/.test(key)) {
        event.preventDefault();
        return;
    }
    
    // Check if we're at max length (10 characters: mm/dd/yyyy)
    const currentValue = input.value;
    if (currentValue.length >= 10 && input.selectionStart === input.selectionEnd) {
        event.preventDefault();
        return;
    }
    
    // Allow typing if there's a selection (replacement)
    if (input.selectionStart !== input.selectionEnd) {
        return;
    }
}

function handleAdvancedDateFocus(event) {
    const input = event.target;
    input.style.borderColor = '#2563EB';
    input.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
    
    // Show helper text
    showDateHelper(input);
}

function handleAdvancedDateBlur(event) {
    const input = event.target;
    
    // Reset focus styles
    input.style.borderColor = '';
    input.style.boxShadow = '';
    
    // Hide helper text
    hideDateHelper(input);
    
    // Perform comprehensive validation
    performComprehensiveValidation(input);
    
    // Trigger filter update if validation passes
    setTimeout(() => {
        if (areAllDatesValid()) {
            handleFilterChange();
        }
    }, 100);
}

function handleDatePaste(event) {
    event.preventDefault();
    
    const paste = (event.clipboardData || window.clipboardData).getData('text');
    const input = event.target;
    
    // Clean and format pasted date
    const cleanPaste = paste.replace(/\D/g, '');
    
    if (cleanPaste.length === 8) {
        // Assume format: MMDDYYYY or DDMMYYYY
        const formatted = cleanPaste.substring(0, 2) + '/' + 
                         cleanPaste.substring(2, 4) + '/' + 
                         cleanPaste.substring(4, 8);
        input.value = formatted;
        performRealTimeValidation(input);
    }
}

// ==============================================
// VALIDATION FUNCTIONS
// ==============================================

function performRealTimeValidation(input) {
    const value = input.value;
    
    if (value.length === 10) {
        const validation = DateValidator.getValidationMessage(value);
        showDateValidation(input, validation.isValid, validation.message);
        
        // If this is a valid date, check range validation
        if (validation.isValid) {
            validateDateRangeIfBothPresent();
        }
    } else if (value.length > 0) {
        clearDateValidation(input);
    }
}

function performComprehensiveValidation(input) {
    const value = input.value;
    
    if (!value) {
        clearDateValidation(input);
        return true;
    }
    
    if (value.length < 10) {
        showDateValidation(input, false, 'Complete date required');
        return false;
    }
    
    const validation = DateValidator.getValidationMessage(value);
    showDateValidation(input, validation.isValid, validation.message);
    
    return validation.isValid;
}

function validateDateRangeIfBothPresent() {
    const dateInputs = document.querySelectorAll('.date-input');
    if (dateInputs.length < 2) return;
    
    const startDate = dateInputs[0].value;
    const endDate = dateInputs[1].value;
    
    if (startDate.length === 10 && endDate.length === 10) {
        const rangeValidation = DateValidator.isValidDateRange(startDate, endDate);
        
        if (!rangeValidation.isValid) {
            showDateValidation(dateInputs[1], false, rangeValidation.message);
            return false;
        } else {
            // Both dates are valid individually and as a range
            showDateValidation(dateInputs[0], true, 'Valid start date');
            showDateValidation(dateInputs[1], true, 'Valid date range');
            return true;
        }
    }
    
    return true;
}

function validateAllDates() {
    // Get current system date for validation
    const currentSystemDate = DateValidator.getCurrentDate();
    
    const dateInputs = document.querySelectorAll('.date-input');
    let allValid = true;
    let systemDateChanged = false;
    
    dateInputs.forEach((input, index) => {
        if (input.value) {
            const inputDate = DateValidator.parseDate(input.value);
            
            if (inputDate) {
                // Check if date is valid against current system date
                const wasValid = !input.classList.contains('date-invalid');
                const isNowValid = DateValidator.isDateValidAgainstSystem(inputDate, currentSystemDate);
                
                // If validation status changed due to system date
                if (wasValid !== isNowValid) {
                    systemDateChanged = true;
                }
                
                // Mark input state for future reference
                if (isNowValid) {
                    input.classList.remove('date-invalid');
                } else {
                    input.classList.add('date-invalid');
                    allValid = false;
                }
            }
            
            const isValid = performComprehensiveValidation(input);
            if (!isValid) allValid = false;
        }
    });
    
    // Validate range if both dates are present
    if (allValid) {
        const rangeValid = validateDateRangeIfBothPresent();
        if (!rangeValid) allValid = false;
    }
    
    // Update map functionality based on date validation
    updateMapFunctionality(allValid);
    
    // If system date caused validation changes, silently update filters
    if (systemDateChanged && allValid) {
        setTimeout(() => {
            updateCurrentFilters();
            updateDashboardData();
        }, 100);
    }
    
    return allValid;
}

function areAllDatesValid() {
    const dateInputs = document.querySelectorAll('.date-input');
    
    for (let input of dateInputs) {
        if (input.value) {
            const validation = DateValidator.getValidationMessage(input.value);
            if (!validation.isValid) return false;
        }
    }
    
    // Check range validation
    if (dateInputs.length >= 2 && dateInputs[0].value && dateInputs[1].value) {
        const rangeValidation = DateValidator.isValidDateRange(dateInputs[0].value, dateInputs[1].value);
        return rangeValidation.isValid;
    }
    
    return true;
}

// ==============================================
// MAP FUNCTIONALITY BASED ON DATE VALIDATION
// ==============================================

function updateMapFunctionality(datesAreValid) {
    const mapContainer = document.querySelector('.map-container');
    const mapActions = document.querySelectorAll('.share-report-btn, .export-pdf-btn');
    
    if (!mapContainer) return;
    
    if (datesAreValid) {
        // Enable map functionality silently
        mapContainer.classList.remove('map-disabled');
        mapContainer.style.opacity = '1';
        mapContainer.style.pointerEvents = 'auto';
        
        // Enable action buttons
        mapActions.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
        
    } else {
        // Disable map functionality silently
        mapContainer.classList.add('map-disabled');
        mapContainer.style.opacity = '0.6';
        mapContainer.style.pointerEvents = 'none';
        
        // Disable action buttons
        mapActions.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
    }
}

// ==============================================
// VISUAL FEEDBACK FUNCTIONS
// ==============================================

function showDateValidation(input, isValid, message) {
    clearDateValidation(input);
    
    const validationDiv = document.createElement('div');
    validationDiv.className = 'date-validation';
    
    if (isValid) {
        validationDiv.style.color = '#10B981';
        validationDiv.innerHTML = `<span class="validation-icon">✓</span> ${message}`;
        input.style.borderColor = '#10B981';
        input.style.backgroundColor = '#F0FDF4';
    } else {
        validationDiv.style.color = '#EF4444';
        validationDiv.innerHTML = `<span class="validation-icon">✗</span> ${message}`;
        input.style.borderColor = '#EF4444';
        input.style.backgroundColor = '#FEF2F2';
    }
    
    input.parentNode.appendChild(validationDiv);
}

function clearDateValidation(input) {
    const existingValidation = input.parentNode.querySelector('.date-validation');
    if (existingValidation) {
        existingValidation.remove();
    }
    
    input.style.borderColor = '';
    input.style.backgroundColor = '';
}

function showDateHelper(input) {
    // Helper disabled - no date information shown
    return;
}

function hideDateHelper(input) {
    const helper = input.parentNode.querySelector('.date-helper');
    if (helper) {
        helper.remove();
    }
}

// ==============================================
// MOBILE MENU FUNCTIONALITY
// ==============================================

function initializeMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        
        // Close mobile menu when clicking on nav items
        const navItems = mobileNav.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', closeMobileMenu);
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenuBtn.contains(event.target) && !mobileNav.contains(event.target)) {
                closeMobileMenu();
            }
        });
    }
}

function toggleMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (mobileMenuBtn && mobileNav) {
        const isActive = mobileNav.classList.contains('active');
        
        if (isActive) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }
}

function openMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    
    mobileMenuBtn.classList.add('active');
    mobileNav.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Show menu and animate
    mobileNav.style.display = 'block';
    setTimeout(() => {
        mobileNav.style.transform = 'translateY(0)';
    }, 10);
}

function closeMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
        
        // Animate out
        mobileNav.style.transform = 'translateY(-100%)';
        setTimeout(() => {
            if (!mobileNav.classList.contains('active')) {
                mobileNav.style.display = 'none';
            }
        }, 300);
    }
}

// ==============================================
// FILTER SYSTEM
// ==============================================

function initializeFilters() {
    const districtSelect = document.querySelector('.district-select');
    const checkboxes = document.querySelectorAll('input[name="issue-type"]');
    
    // Add event listeners for real-time filtering
    if (districtSelect) {
        districtSelect.addEventListener('change', handleFilterChange);
    }
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });
    
    // Initialize with default values
    updateDashboardData();
}

function handleFilterChange() {
    // Only proceed if dates are valid
    if (!areAllDatesValid()) {
        showNotification('Please fix date validation errors before applying filters', 'warning');
        return;
    }
    
    clearTimeout(window.filterTimeout);
    window.filterTimeout = setTimeout(() => {
        updateCurrentFilters();
        updateDashboardData();
        showNotification('Filters updated successfully', 'success');
    }, 300);
}

function updateCurrentFilters() {
    const dateInputs = document.querySelectorAll('.date-input');
    const districtSelect = document.querySelector('.district-select');
    const checkedBoxes = document.querySelectorAll('input[name="issue-type"]:checked');
    
    currentFilters.startDate = dateInputs[0]?.value || '';
    currentFilters.endDate = dateInputs[1]?.value || '';
    currentFilters.district = districtSelect?.value || '';
    currentFilters.issueTypes = Array.from(checkedBoxes).map(cb => cb.value);
}

function updateDashboardData() {
    updateStatsCards();
    updateMapStats();
    updateIssueCardsVisibility();
}

function updateStatsCards() {
    let totalReports = 0;
    let resolvedIssues = 0;
    let inProgress = 0;
    
    if (currentFilters.district && cityData.districts[currentFilters.district]) {
        const districtData = cityData.districts[currentFilters.district];
        totalReports = districtData.reports;
        resolvedIssues = districtData.resolved;
    } else {
        currentFilters.issueTypes.forEach(issueType => {
            if (cityData.issueTypes[issueType]) {
                totalReports += cityData.issueTypes[issueType].count;
                resolvedIssues += cityData.issueTypes[issueType].resolved;
            }
        });
    }
    
    inProgress = totalReports - resolvedIssues;
    
    animateCounter(document.querySelector('.stat-card:nth-child(1) .stat-number'), totalReports);
    animateCounter(document.querySelector('.stat-card:nth-child(2) .stat-number'), resolvedIssues);
    animateCounter(document.querySelector('.stat-card:nth-child(3) .stat-number'), inProgress);
}

function updateMapStats() {
    const mapStatCards = document.querySelectorAll('.map-stat-card');
    
    if (mapStatCards.length >= 3) {
        let activeDistrict = 'Downtown';
        if (currentFilters.district && cityData.districts[currentFilters.district]) {
            activeDistrict = cityData.districts[currentFilters.district].name;
        }
        
        let topIssue = 'Potholes';
        let maxCount = 0;
        currentFilters.issueTypes.forEach(issueType => {
            if (cityData.issueTypes[issueType] && cityData.issueTypes[issueType].count > maxCount) {
                maxCount = cityData.issueTypes[issueType].count;
                topIssue = cityData.issueTypes[issueType].name;
            }
        });
        
        // Update map statistics based on current filters and date validation
        if (areAllDatesValid()) {
            updateMapStatContent(mapStatCards, activeDistrict, topIssue);
        }
    }
}

function updateMapStatContent(mapStatCards, activeDistrict, topIssue) {
    if (mapStatCards[0]) {
        const content = mapStatCards[0].querySelector('.map-stat-content');
        if (content) {
            content.innerHTML = `<div class="resolution-percentage">${activeDistrict}</div>`;
        }
    }
    
    if (mapStatCards[1]) {
        const content = mapStatCards[1].querySelector('.map-stat-content');
        if (content) {
            content.innerHTML = `<div class="resolution-percentage">${topIssue}</div>`;
        }
    }
    
    if (mapStatCards[2]) {
        const content = mapStatCards[2].querySelector('.map-stat-content');
        if (content) {
            content.innerHTML = '<div class="resolution-percentage">84%</div>';
        }
    }
    
    if (mapStatCards[3]) {
        const content = mapStatCards[3].querySelector('.map-stat-content');
        if (content) {
            content.innerHTML = '<div class="resolution-percentage">↗️ +12%</div>';
        }
    }
}

function updateIssueCardsVisibility() {
    const issueCards = document.querySelectorAll('.issue-card');
    
    issueCards.forEach(card => {
        const cardClass = card.classList[1];
        let issueType = '';
        
        if (cardClass === 'pothole-card') issueType = 'potholes';
        else if (cardClass === 'lighting-card') issueType = 'lighting';
        else if (cardClass === 'drainage-card') issueType = 'drainage';
        
        if (issueType && currentFilters.issueTypes.includes(issueType)) {
            card.style.display = 'block';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        } else if (issueType) {
            card.style.opacity = '0.5';
            card.style.transform = 'translateY(10px)';
        }
    });
}

// ==============================================
// MAP AND EXPORT FUNCTIONALITY
// ==============================================

function initializeMapActions() {
    const shareBtn = document.querySelector('.share-report-btn');
    const exportBtn = document.querySelector('.export-pdf-btn');
    
    if (shareBtn) {
        shareBtn.addEventListener('click', handleShareReport);
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExportPDF);
    }
}

function handleShareReport() {
    if (!areAllDatesValid()) {
        showNotification('Please fix date validation errors before sharing', 'error');
        return;
    }
    showShareModal();
}

function handleExportPDF() {
    if (!areAllDatesValid()) {
        showNotification('Please fix date validation errors before exporting', 'error');
        return;
    }
    
    const exportBtn = document.querySelector('.export-pdf-btn');
    if (exportBtn) {
        const originalContent = exportBtn.innerHTML;
        exportBtn.innerHTML = '<div class="loading-spinner export-loading"></div>Exporting...';
        exportBtn.disabled = true;
        exportBtn.classList.add('export-loading');
        
        showNotification('Preparing PDF export...', 'info');
        
        setTimeout(() => {
            generateMockPDF();
            
            exportBtn.innerHTML = originalContent;
            exportBtn.disabled = false;
            exportBtn.classList.remove('export-loading');
            
            showNotification('Report exported successfully!', 'success');
        }, 3000);
    }
}

function showShareModal() {
    let modal = document.getElementById('shareModal');
    if (!modal) {
        modal = createShareModal();
        document.body.appendChild(modal);
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function createShareModal() {
    const modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.className = 'modal-overlay';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3 class="modal-title">Share Report</h3>
            <button class="modal-close-btn" onclick="closeShareModal()">×</button>
        </div>
        <div class="share-buttons">
            <button class="share-btn" onclick="shareVia('twitter')">
                <span class="share-icon twitter">🐦</span>
                <span>Share on Twitter</span>
            </button>
            <button class="share-btn" onclick="shareVia('facebook')">
                <span class="share-icon facebook">📘</span>
                <span>Share on Facebook</span>
            </button>
            <button class="share-btn" onclick="shareVia('linkedin')">
                <span class="share-icon linkedin">💼</span>
                <span>Share on LinkedIn</span>
            </button>
            <button class="share-btn" onclick="copyReportLink()">
                <span class="share-icon copy">🔗</span>
                <span>Copy Link</span>
            </button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeShareModal();
        }
    });
    
    return modal;
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            document.body.style.overflow = '';
        }, 300);
    }
}

function shareVia(platform) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Check out this CityFix community report - helping make our city better!');
    
    let shareUrl = '';
    
    switch (platform) {
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
            break;
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
        closeShareModal();
        showNotification(`Shared on ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`, 'success');
    }
}

function copyReportLink() {
    const url = window.location.href;
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(() => {
            closeShareModal();
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(url);
        });
    } else {
        fallbackCopyTextToClipboard(url);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        closeShareModal();
        showNotification('Link copied to clipboard!', 'success');
    } catch (err) {
        showNotification('Failed to copy link', 'error');
    } finally {
        document.body.removeChild(textArea);
    }
}

// Generate real PDF file
function generateMockPDF() {
    const reportData = {
        date: new Date().toLocaleDateString(),
        district: currentFilters.district || 'All Districts',
        issueTypes: currentFilters.issueTypes.join(', '),
        totalReports: document.querySelector('.stat-card:nth-child(1) .stat-number')?.textContent || '15,234',
        resolved: document.querySelector('.stat-card:nth-child(2) .stat-number')?.textContent || '12,847',
        inProgress: document.querySelector('.stat-card:nth-child(3) .stat-number')?.textContent || '2,387'
    };
    
    // Create HTML content for PDF
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>CityFix Community Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { color: #2563EB; margin: 0; font-size: 28px; }
                .header p { color: #666; margin: 5px 0; }
                .section { margin: 25px 0; }
                .section h2 { color: #333; border-left: 4px solid #2563EB; padding-left: 15px; }
                .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 20px 0; }
                .stat-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
                .stat-number { font-size: 24px; font-weight: bold; color: #2563EB; }
                .stat-label { color: #666; font-size: 14px; margin-top: 5px; }
                .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #888; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏙️ CityFix Community Report</h1>
                <p>Generated on ${reportData.date}</p>
            </div>
            
            <div class="section">
                <h2>📋 Report Summary</h2>
                <div class="info-row">
                    <span><strong>District:</strong></span>
                    <span>${reportData.district}</span>
                </div>
                <div class="info-row">
                    <span><strong>Issue Types:</strong></span>
                    <span>${reportData.issueTypes}</span>
                </div>
                <div class="info-row">
                    <span><strong>Date Range:</strong></span>
                    <span>${currentFilters.startDate || 'All Time'} - ${currentFilters.endDate || 'Present'}</span>
                </div>
            </div>
            
            <div class="section">
                <h2>📊 Statistics Overview</h2>
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-number">${reportData.totalReports}</div>
                        <div class="stat-label">Total Reports</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${reportData.resolved}</div>
                        <div class="stat-label">Issues Resolved</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${reportData.inProgress}</div>
                        <div class="stat-label">In Progress</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>📈 Key Insights</h2>
                <ul>
                    <li>Resolution Rate: 84% of reported issues have been addressed</li>
                    <li>Most Active District: Downtown with highest report volume</li>
                    <li>Top Issue Type: Potholes requiring immediate attention</li>
                    <li>Trend: +12% improvement in response time this week</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>This report was generated by CityFix Community Platform</p>
                <p>Helping make our city better, one report at a time</p>
            </div>
        </body>
        </html>
    `;
    
    // Convert HTML to PDF using browser's print functionality
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print dialog
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
            // Note: User will need to choose "Save as PDF" in print dialog
        }, 500);
    };
}

// ==============================================
// ISSUE CARDS INTERACTIVITY
// ==============================================

function initializeIssueCards() {
    const issueCards = document.querySelectorAll('.issue-card');
    
    issueCards.forEach(card => {
        card.addEventListener('click', function() {
            const cardType = this.classList[1];
            let issueType = '';
            
            if (cardType === 'pothole-card') issueType = 'potholes';
            else if (cardType === 'lighting-card') issueType = 'lighting';
            else if (cardType === 'drainage-card') issueType = 'drainage';
            
            if (issueType) {
                handleReportIssue(issueType);
            }
        });
        
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0px 12px 24px rgba(0, 0, 0, 0.15)';
            this.style.cursor = 'pointer';
        });
        
        card.addEventListener('mouseleave', function() {
            if (!currentFilters.issueTypes.includes(getIssueTypeFromCard(this))) {
                this.style.transform = 'translateY(10px)';
            } else {
                this.style.transform = 'translateY(0)';
            }
            this.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.08)';
        });
    });
}

function getIssueTypeFromCard(card) {
    const cardClass = card.classList[1];
    if (cardClass === 'pothole-card') return 'potholes';
    if (cardClass === 'lighting-card') return 'lighting';
    if (cardClass === 'drainage-card') return 'drainage';
    return '';
}

function handleReportIssue(issueType) {
    const issueName = cityData.issueTypes[issueType]?.name || issueType;
    showReportModal(issueType, issueName);
}

function showReportModal(issueType, issueName) {
    let modal = document.getElementById('reportModal');
    if (!modal) {
        modal = createReportModal();
        document.body.appendChild(modal);
    }
    
    const issueTitle = modal.querySelector('#modal-issue-type');
    if (issueTitle) {
        issueTitle.textContent = `Report ${issueName}`;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function createReportModal() {
    const modal = document.createElement('div');
    modal.id = 'reportModal';
    modal.className = 'modal-overlay report-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3 id="modal-issue-type" class="modal-title">Report Issue</h3>
            <button class="modal-close-btn" onclick="closeReportModal()">×</button>
        </div>
        <form id="reportForm" class="report-form">
            <div class="form-group">
                <label class="form-label">Location *</label>
                <input type="text" id="location" class="form-input" required placeholder="Enter street address or landmark">
            </div>
            <div class="form-group">
                <label class="form-label">Description *</label>
                <textarea id="description" class="form-textarea" required placeholder="Please describe the issue in detail..." rows="4"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Urgency Level</label>
                <select id="urgency" class="form-select">
                    <option value="low">Low - Not urgent</option>
                    <option value="medium" selected>Medium - Needs attention</option>
                    <option value="high">High - Safety concern</option>
                    <option value="critical">Critical - Immediate danger</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeReportModal()">Cancel</button>
                <button type="submit" class="btn-primary">Submit Report</button>
            </div>
        </form>
    `;
    
    modal.appendChild(modalContent);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeReportModal();
        }
    });
    
    const form = modalContent.querySelector('#reportForm');
    form.addEventListener('submit', handleReportSubmission);
    
    return modal;
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            document.body.style.overflow = '';
        }, 300);
    }
}

function handleReportSubmission(event) {
    event.preventDefault();
    
    const location = document.getElementById('location').value;
    const description = document.getElementById('description').value;
    
    if (!location || !description) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<div class="loading-spinner"></div>Submitting...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        const totalReportsEl = document.querySelector('.stat-card:nth-child(1) .stat-number');
        const inProgressEl = document.querySelector('.stat-card:nth-child(3) .stat-number');
        
        if (totalReportsEl && inProgressEl) {
            const currentTotal = parseInt(totalReportsEl.textContent.replace(/[^\d]/g, ''));
            const currentInProgress = parseInt(inProgressEl.textContent.replace(/[^\d]/g, ''));
            
            animateCounter(totalReportsEl, currentTotal + 1);
            animateCounter(inProgressEl, currentInProgress + 1);
        }
        
        event.target.reset();
        closeReportModal();
        
        showNotification('Report submitted successfully! Thank you for helping improve our community.', 'success');
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

// ==============================================
// ANIMATIONS AND VISUAL EFFECTS
// ==============================================

function initializeCounterAnimations() {
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const finalValue = parseInt(element.textContent.replace(/[^\d]/g, ''));
                animateCounter(element, finalValue);
                observer.unobserve(element);
            }
        });
    }, observerOptions);
    
    const statNumbers = document.querySelectorAll('.stat-number, .resolution-percentage');
    statNumbers.forEach(element => {
        if (element.textContent.match(/\d/)) {
            observer.observe(element);
        }
    });
}

function animateCounter(element, targetValue, duration = 2000) {
    if (!element) return;
    
    const startValue = 0;
    const increment = targetValue / (duration / 16);
    let currentValue = startValue;
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(timer);
        }
        
        const formattedValue = Math.floor(currentValue).toLocaleString();
        
        if (element.classList.contains('resolution-percentage') || element.textContent.includes('%')) {
            element.textContent = Math.floor(currentValue) + '%';
        } else {
            element.textContent = formattedValue;
        }
    }, 16);
}

function initializeTooltips() {
    const elementsWithTooltips = [
        { selector: '.share-report-btn', text: 'Share this report on social media' },
        { selector: '.export-pdf-btn', text: 'Download report as PDF' },
        { selector: '.mobile-menu-btn', text: 'Open navigation menu' }
    ];
    
    elementsWithTooltips.forEach(({ selector, text }) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.title = text;
            element.setAttribute('aria-label', text);
        });
    });
}

// ==============================================
// NOTIFICATION SYSTEM
// ==============================================

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    
    const icons = {
        'success': '✅',
        'error': '❌',
        'info': 'ℹ️',
        'warning': '⚠️'
    };
    
    notification.innerHTML = `
        <span class="notification-icon">${icons[type] || icons.info}</span>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// ==============================================
// EVENT LISTENERS SETUP
// ==============================================

function setupEventListeners() {
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeShareModal();
            closeReportModal();
            closeMobileMenu();
        }
        
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const firstFilter = document.querySelector('.date-input, .district-select');
            if (firstFilter) {
                firstFilter.focus();
                showNotification('Filter focused - use Tab to navigate', 'info');
            }
        }
    });
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.innerWidth > 768) {
                closeMobileMenu();
            }
            updateDashboardData();
        }, 250);
    });
    
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.classList.add('enhanced-input');
    });
}

// ==============================================
// ERROR HANDLING
// ==============================================

window.addEventListener('error', function(event) {
    console.error('CityFix Error:', event.error);
    showNotification('Something went wrong. Please refresh the page if issues persist.', 'error');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
    showNotification('An unexpected error occurred.', 'error');
});

// ==============================================
// EXPORT GLOBAL FUNCTIONS
// ==============================================

window.shareVia = shareVia;
window.copyReportLink = copyReportLink;
window.closeShareModal = closeShareModal;
window.closeReportModal = closeReportModal;
window.toggleMobileMenu = toggleMobileMenu;

window.CityFix = {
    init: initializeApp,
    showNotification: showNotification,
    updateFilters: updateDashboardData,
    exportPDF: handleExportPDF,
    shareReport: handleShareReport,
    DateValidator: DateValidator,
    validateAllDates: validateAllDates,
    areAllDatesValid: areAllDatesValid
};

console.log('🚀 CityFix Enhanced JavaScript Loaded - Smart Auto-Date System Active!');
console.log('✏️  Date format: mm/dd/yyyy with deletable "/" characters');
console.log('📅 System automatically detects and uses real computer date');
console.log('🔄 Auto-populates date fields with intelligent defaults');
console.log('⚡ Continuous real-time validation and updates');