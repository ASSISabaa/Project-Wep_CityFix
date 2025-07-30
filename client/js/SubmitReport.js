// COMPLETE CityFix Script - Matches HTML/CSS exactly
console.log('🚀 Starting CityFix Form...');

// Wait for page to load completely
window.addEventListener('load', function() {
    console.log('✅ Page loaded, starting form...');
    initializeForm();
});

function initializeForm() {
    console.log('🔧 Initializing form...');
    
    // Get all form elements
    const problemType = document.getElementById('problemType');
    const location = document.getElementById('location');
    const description = document.getElementById('description');
    const submitBtn = document.getElementById('submitBtn');
    const reportForm = document.getElementById('reportForm');
    const successMessage = document.getElementById('successMessage');
    
    // File upload elements
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const uploadedFiles = document.getElementById('uploadedFiles');
    const browseBtnElement = uploadArea.querySelector('.browse-btn');
    
    // Map elements
    const mapContainer = document.getElementById('mapContainer');
    
    // Progress elements
    const stepCircles = document.querySelectorAll('.step-circle');
    const stepLabels = document.querySelectorAll('.step-label');
    const lineFills = document.querySelectorAll('.line-fill');
    
    // Initialize progress lines
    lineFills.forEach((line, index) => {
        line.style.width = '0%';
        line.style.transition = 'width 0.5s ease';
    });
    
    // Form state
    let uploadedFilesList = [];
    let currentLocation = null;
    
    // Form validation state - NOW 4 REQUIRED FIELDS
    const formState = {
        problemType: false,
        location: false,
        description: false,
        images: false  // NEW: Images are now required
    };
    
    // ====== PROGRESS UPDATE FUNCTION ======
    function updateProgress() {
        console.log('📈 Updating progress...');
        
        // Check each field - NOW INCLUDING IMAGES
        formState.problemType = problemType.value.trim() !== '';
        formState.location = location.value.trim() !== '';
        formState.description = description.value.trim().length >= 3;
        formState.images = uploadedFilesList.length > 0; // NEW: At least 1 image required
        
        // Count completed fields - NOW 4 TOTAL
        let completed = Object.values(formState).filter(Boolean).length;
        const percentage = (completed / 4) * 100; // Changed from 3 to 4
        
        console.log(`Progress: ${percentage}% (${completed}/4 fields)`);
        
        // Update first progress line
        if (lineFills[0]) {
            lineFills[0].style.width = percentage + '%';
        }
        
        // Update step 2 based on completion - NOW REQUIRES ALL 4 FIELDS
        if (completed === 4) { // Changed from 3 to 4
            if (stepCircles[1]) stepCircles[1].classList.add('active');
            if (stepLabels[1]) stepLabels[1].classList.add('active');
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Report';
            submitBtn.style.backgroundColor = '#1F2937';
            submitBtn.style.cursor = 'pointer';
        } else {
            if (stepCircles[1]) stepCircles[1].classList.remove('active');
            if (stepLabels[1]) stepLabels[1].classList.remove('active');
            
            submitBtn.disabled = true;
            submitBtn.textContent = `Fill Required Fields (${completed}/4)`; // Changed from 3 to 4
            submitBtn.style.backgroundColor = '#9CA3AF';
            submitBtn.style.cursor = 'not-allowed';
        }
        
        // Update field visual states - INCLUDING UPLOAD AREA
        updateFieldVisualState(problemType, formState.problemType);
        updateFieldVisualState(location, formState.location);
        updateFieldVisualState(description, formState.description);
        updateUploadAreaVisualState(formState.images);
    }
    
    function updateFieldVisualState(field, isValid) {
        if (field) {
            if (isValid) {
                field.style.borderColor = '#171717';
                field.style.backgroundColor = '#f9fafb';
            } else {
                field.style.borderColor = '#D1D5DB';
                field.style.backgroundColor = '#FFFFFF';
            }
        }
    }
    
    // NEW: Visual state for upload area
    function updateUploadAreaVisualState(hasImages) {
        if (uploadArea) {
            if (hasImages) {
                uploadArea.style.borderColor = '#171717';
                uploadArea.style.backgroundColor = '#f9fafb';
                uploadArea.style.color = '#171717';
            } else {
                uploadArea.style.borderColor = '#D1D5DB';
                uploadArea.style.backgroundColor = '#FAFBFC';
                uploadArea.style.color = '#6B7280';
            }
        }
    }
    
    // ====== EVENT LISTENERS ======
    if (problemType) {
        problemType.addEventListener('change', function() {
            console.log('🔧 Problem type selected:', this.value);
            updateProgress();
        });
    }
    
    if (location) {
        location.addEventListener('input', function() {
            console.log('📍 Location changed:', this.value);
            updateProgress();
            updateMapPreview();
        });
        
        location.addEventListener('paste', function() {
            setTimeout(() => {
                updateProgress();
                updateMapPreview();
            }, 50);
        });
    }
    
    if (description) {
        description.addEventListener('input', function() {
            console.log('📝 Description changed:', this.value.length, 'chars');
            updateProgress();
        });
        
        description.addEventListener('paste', function() {
            setTimeout(updateProgress, 50);
        });
    }
    
    // ====== MAP FUNCTIONALITY ======
    function updateMapPreview() {
        const locationValue = location.value.trim();
        
        if (locationValue) {
            mapContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; color: #2563EB;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    📍 ${locationValue}
                </div>
            `;
            mapContainer.classList.add('has-location');
            currentLocation = locationValue;
        } else {
            mapContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Map Preview
                </div>
            `;
            mapContainer.classList.remove('has-location');
            currentLocation = null;
        }
    }
    
    mapContainer.addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                location.value = `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                updateMapPreview();
                updateProgress();
                showCustomAlert('✅ Current location detected successfully!', 'success');
            }, function(error) {
                showCustomAlert('❌ Cannot access your location. Please enter address manually.', 'error');
            });
        } else {
            showCustomAlert('❌ Browser does not support geolocation.', 'error');
        }
    });
    
    // ====== FILE UPLOAD FUNCTIONALITY ======
    if (fileInput && uploadArea && browseBtnElement) {
        // Browse button click
        browseBtnElement.addEventListener('click', function(e) {
            e.stopPropagation();
            fileInput.click();
        });
        
        // Upload area click
        uploadArea.addEventListener('click', function() {
            fileInput.click();
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            const files = e.dataTransfer.files;
            handleFiles(files);
        });
        
        // File input change
        fileInput.addEventListener('change', function() {
            handleFiles(this.files);
        });
    }
    
    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                uploadedFilesList.push(file);
                addFileToDisplay(file);
                updateProgress(); // Update progress when files are added
            } else {
                showCustomAlert('❌ Please select image files only!', 'error');
            }
        });
    }
    
    function addFileToDisplay(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span>📷 ${file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}</span>
            <button type="button" class="file-remove" onclick="removeFile('${file.name}')">×</button>
        `;
        uploadedFiles.appendChild(fileItem);
    }
    
    window.removeFile = function(fileName) {
        uploadedFilesList = uploadedFilesList.filter(file => file.name !== fileName);
        
        // Remove from display
        const fileItems = uploadedFiles.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            if (item.textContent.includes(fileName)) {
                item.remove();
            }
        });
        
        // Update progress when files are removed
        updateProgress();
    };
    
    // ====== FORM SUBMISSION ======
    if (reportForm) {
        reportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (submitBtn.disabled) {
                // Show specific missing requirements
                const missing = [];
                if (!formState.problemType) missing.push('Problem Type');
                if (!formState.location) missing.push('Location');
                if (!formState.description) missing.push('Description');
                if (!formState.images) missing.push('At least 1 image');
                
                showCustomAlert(`❌ Missing required fields: ${missing.join(', ')}`, 'error');
                return;
            }
            
            console.log('🚀 Form submitted!');
            submitReport();
        });
    }
    
    function submitReport() {
        // Show loading state
        submitBtn.innerHTML = `
            <div class="loading-spinner"></div>
            Submitting...
        `;
        submitBtn.disabled = true;
        
        // Complete step 1 and activate step 2
        if (stepCircles[0]) {
            stepCircles[0].classList.add('completed');
            stepCircles[0].classList.remove('active');
            stepCircles[0].style.background = '#171717';
            stepCircles[0].style.color = '#FFF';
            stepCircles[0].innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"></polyline></svg>`;
        }
        if (stepLabels[0]) {
            stepLabels[0].classList.add('completed');
            stepLabels[0].classList.remove('active');
        }
        if (stepCircles[1]) stepCircles[1].classList.add('active');
        if (stepLabels[1]) stepLabels[1].classList.add('active');
        if (lineFills[0]) {
            lineFills[0].style.width = '100%';
            lineFills[0].style.background = '#171717';
        }
        
        // Simulate submission process
        setTimeout(() => {
            // Complete step 2 and activate step 3
            setTimeout(() => {
                if (stepCircles[1]) {
                    stepCircles[1].classList.add('completed');
                    stepCircles[1].classList.remove('active');
                    stepCircles[1].innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"></polyline></svg>`;
                }
                if (stepLabels[1]) {
                    stepLabels[1].classList.add('completed');
                    stepLabels[1].classList.remove('active');
                }
                if (stepCircles[2]) stepCircles[2].classList.add('active');
                if (stepLabels[2]) stepLabels[2].classList.add('active');
                
                // Fill the second line (between step 2 and 3) progressively
                if (lineFills[1]) {
                    lineFills[1].style.width = '0%';
                    lineFills[1].style.background = '#171717';
                    
                    // Animate the second line filling up
                    setTimeout(() => {
                        lineFills[1].style.transition = 'width 1.5s ease';
                        lineFills[1].style.width = '100%';
                    }, 100);
                    
                    // Complete step 3 after line animation
                    setTimeout(() => {
                        if (stepCircles[2]) {
                            stepCircles[2].classList.add('completed');
                            stepCircles[2].classList.remove('active');
                            stepCircles[2].style.background = '#171717';
                            stepCircles[2].style.color = '#FFF';
                            stepCircles[2].innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"></polyline></svg>`;
                        }
                        if (stepLabels[2]) {
                            stepLabels[2].classList.add('completed');
                            stepLabels[2].classList.remove('active');
                        }
                    }, 1600);
                }
                
                // Also update line containers to show completion
                const lineContainers = document.querySelectorAll('.line-container');
                if (lineContainers[0]) {
                    lineContainers[0].classList.add('completed');
                    lineContainers[0].style.background = '#171717';
                }
                if (lineContainers[1]) {
                    setTimeout(() => {
                        lineContainers[1].classList.add('completed');
                        lineContainers[1].style.background = '#171717';
                    }, 1600);
                }
            }, 500);
            
            // Show success
            submitBtn.innerHTML = '✅ Report Submitted!';
            submitBtn.style.backgroundColor = '#10B981';
            
            // Show success message in the designated area
            if (successMessage) {
                successMessage.classList.add('show');
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // Show tracking page directly
            setTimeout(() => {
                // Disable any conflicting scripts
                if (window.initializeTrackReport) {
                    window.initializeTrackReport = function() {
                        console.log('TrackReport initialization disabled by main script');
                    };
                }
                
                // Disable the TrackReport.js timeline animation
                window.animateTimelineOnLoad = function() {
                    console.log('Timeline animation disabled by main script');
                };
                
                showTrackingPage();
            }, 1500);
            
        }, 2500);
    }
    
    // ====== TRACKING PAGE FUNCTION ======
    function showTrackingPage() {
        // Hide form container
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
            formContainer.style.transition = 'all 0.5s ease';
            formContainer.style.opacity = '0';
            formContainer.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                formContainer.style.display = 'none';
                
                // Create and show tracking container
                createTrackingContainer();
            }, 500);
        }
    }
    
    function createTrackingContainer() {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;
        
        // Generate tracking ID
        const trackingId = generateTrackingId();
        
        // Get form data for display
        const formDataDisplay = {
            problemType: problemType.value || 'Traffic Signal',
            location: location.value || 'My Current Location (32.1126, 34.9766)',
            description: description.value || 'مشكل',
            files: uploadedFilesList.length
        };
        
        // Create tracking container
        const trackingContainer = document.createElement('div');
        trackingContainer.className = 'tracking-container';
        trackingContainer.innerHTML = `
            <!-- Success Banner -->
            <div class="success-banner">
                <div class="success-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22,4 12,14.01 9,11.01"></polyline>
                    </svg>
                </div>
                <div class="success-content">
                    <h1>Report Submitted Successfully!</h1>
                    <p>Your report has been received and assigned tracking ID: <strong class="tracking-id-clickable" onclick="copyTrackingId('${trackingId}')" title="Click to copy">${trackingId}</strong></p>
                </div>
            </div>

            <!-- Report Summary Card -->
            <div class="report-card">
                <div class="card-header">
                    <h2>Report Summary</h2>
                    <div class="status-badge in-progress">In Progress</div>
                </div>
                
                <div class="card-content">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Problem Type:</span>
                            <span class="value">${formDataDisplay.problemType}</span>
                        </div>
                        
                        <div class="info-item">
                            <span class="label">Location:</span>
                            <span class="value">${formDataDisplay.location}</span>
                        </div>
                        
                        <div class="info-item">
                            <span class="label">Submitted Date:</span>
                            <span class="value">${new Date().toLocaleString()}</span>
                        </div>
                        
                        <div class="info-item">
                            <span class="label">Priority Level:</span>
                            <span class="value priority-medium">Medium</span>
                        </div>
                        
                        <div class="info-item">
                            <span class="label">Estimated Completion:</span>
                            <span class="value">${getEstimatedDate()}</span>
                        </div>
                        
                        <div class="info-item">
                            <span class="label">Attachments:</span>
                            <span class="value">${formDataDisplay.files} image(s) uploaded</span>
                        </div>
                        
                        <div class="info-item">
                            <span class="label">Assigned Department:</span>
                            <span class="value">Traffic Management</span>
                        </div>
                    </div>
                    
                    <div class="description-section">
                        <h3>Description</h3>
                        <p>${formDataDisplay.description}</p>
                    </div>
                    
                    <div class="attachments-section">
                        <h3>Attachments</h3>
                        <div class="attachment-list">
                            ${formDataDisplay.files > 0 ? `
                                <div class="attachment-item">
                                    <div class="attachment-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <circle cx="9" cy="9" r="2"></circle>
                                            <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                                        </svg>
                                    </div>
                                    <span>${formDataDisplay.files} file(s) uploaded</span>
                                    <span class="file-size">(Images)</span>
                                </div>
                            ` : '<p class="no-attachments">No files uploaded</p>'}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Timeline Card -->
            <div class="timeline-card">
                <div class="card-header">
                    <h2>Progress Timeline</h2>
                </div>
                
                <div class="timeline">
                    <div class="timeline-item completed">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <h4>Report Submitted</h4>
                            <p>Your report has been successfully submitted to the system.</p>
                            <span class="timestamp">${new Date().toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="timeline-item active">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <h4>Report Under Review</h4>
                            <p>Initial review is being conducted. Report will be validated and categorized.</p>
                            <span class="timestamp">In Progress</span>
                        </div>
                    </div>
                    
                    <div class="timeline-item pending">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <h4>Field Investigation</h4>
                            <p>Field team will be dispatched to assess the situation on-site.</p>
                            <span class="timestamp">Pending</span>
                        </div>
                    </div>
                    
                    <div class="timeline-item pending">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <h4>Repair Scheduled</h4>
                            <p>Repair work will be scheduled based on field assessment results.</p>
                            <span class="timestamp">Pending</span>
                        </div>
                    </div>
                    
                    <div class="timeline-item pending">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <h4>Issue Resolved</h4>
                            <p>The reported issue will be fully resolved and verified.</p>
                            <span class="timestamp">Pending</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions Section -->
            <div class="actions-section">
                <button class="btn btn-primary" onclick="window.print()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6,9 6,2 18,2 18,9"></polyline>
                        <path d="M6,18H4a2,2,0,0,1-2-2V11a2,2,0,0,1,2-2H20a2,2,0,0,1,2,2v5a2,2,0,0,1-2,2H18"></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    Print Report
                </button>
                
                <button class="btn btn-secondary" onclick="copyTrackingIdGlobal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy Tracking ID
                </button>
                
                <button class="btn btn-outline" onclick="location.reload()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Submit New Report
                </button>
            </div>
        `;
        
        // Add tracking styles
        addTrackingStyles();
        
        // Append tracking container
        mainContent.appendChild(trackingContainer);
        
        // Animate in
        setTimeout(() => {
            trackingContainer.style.opacity = '1';
            trackingContainer.style.transform = 'translateY(0)';
            
            // Animate timeline with simple effect
            animateTimeline();
            
            // Show success notification
            showCustomAlert('🎉 Report submitted successfully! Track your progress below.', 'success');
            
            // Make sure progress is fully complete with visual animation
            setTimeout(() => {
                animateProgressCompletion();
            }, 500);
        }, 100);
        
        // Store tracking ID globally
        window.currentTrackingId = trackingId;
    }
    
    // ====== COMPLETE ALL PROGRESS STEPS ======
    function completeAllProgressSteps() {
        // Complete step 1
        if (stepCircles[0]) {
            stepCircles[0].classList.add('completed');
            stepCircles[0].classList.remove('active');
            stepCircles[0].innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"></polyline></svg>`;
        }
        if (stepLabels[0]) {
            stepLabels[0].classList.add('completed');
            stepLabels[0].classList.remove('active');
        }
        
        // Complete step 2
        if (stepCircles[1]) {
            stepCircles[1].classList.add('completed');
            stepCircles[1].classList.remove('active');
            stepCircles[1].innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"></polyline></svg>`;
        }
        if (stepLabels[1]) {
            stepLabels[1].classList.add('completed');
            stepLabels[1].classList.remove('active');
        }
        
        // Start with step 3 as active
        if (stepCircles[2]) stepCircles[2].classList.add('active');
        if (stepLabels[2]) stepLabels[2].classList.add('active');
        
        // Complete the FIRST line immediately
        const allLineFills = document.querySelectorAll('.line-fill');
        const allLineContainers = document.querySelectorAll('.line-container');
        
        if (allLineFills[0]) {
            allLineFills[0].style.width = '100%';
            allLineFills[0].style.background = '#171717';
        }
        if (allLineContainers[0]) {
            allLineContainers[0].classList.add('completed');
            allLineContainers[0].style.background = '#171717';
        }
        
        // Animate the SECOND line (between step 2 and 3) filling progressively
        if (allLineFills[1]) {
            allLineFills[1].style.width = '0%';
            allLineFills[1].style.background = '#171717';
            allLineFills[1].style.transition = 'width 2s ease';
            
            setTimeout(() => {
                allLineFills[1].style.width = '100%';
                
                // Complete step 3 after line fills
                setTimeout(() => {
                    if (stepCircles[2]) {
                        stepCircles[2].classList.add('completed');
                        stepCircles[2].classList.remove('active');
                        stepCircles[2].style.background = '#171717';
                        stepCircles[2].style.color = '#FFF';
                        stepCircles[2].innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"></polyline></svg>`;
                    }
                    if (stepLabels[2]) {
                        stepLabels[2].classList.add('completed');
                        stepLabels[2].classList.remove('active');
                    }
                    if (allLineContainers[1]) {
                        allLineContainers[1].classList.add('completed');
                        allLineContainers[1].style.background = '#171717';
                    }
                }, 500);
            }, 200);
        }
        
        console.log('✅ ALL progress steps completed with checkmarks');
    }
    
    // ====== ANIMATED PROGRESS COMPLETION ======
    function animateProgressCompletion() {
        // Find the step elements again (in case they were recreated)
        const circles = document.querySelectorAll('.step-circle');
        const labels = document.querySelectorAll('.step-label');
        const lines = document.querySelectorAll('.line-fill');
        const containers = document.querySelectorAll('.line-container');
        
        // Complete step 1 (should already be done)
        if (circles[0]) {
            circles[0].classList.add('completed');
            circles[0].classList.remove('active');
            circles[0].style.background = '#171717';
            circles[0].style.color = '#FFF';
            circles[0].innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"></polyline></svg>`;
        }
        if (labels[0]) {
            labels[0].classList.add('completed');
            labels[0].style.color = '#000';
            labels[0].style.fontWeight = '500';
        }
        
        // Complete first line
        if (lines[0]) {
            lines[0].style.width = '100%';
            lines[0].style.background = '#171717';
        }
        if (containers[0]) {
            containers[0].style.background = '#171717';
        }
        
        // Complete step 2
        setTimeout(() => {
            if (circles[1]) {
                circles[1].classList.add('completed');
                circles[1].classList.remove('active');
                circles[1].style.background = '#171717';
                circles[1].style.color = '#FFF';
                circles[1].innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"></polyline></svg>`;
            }
            if (labels[1]) {
                labels[1].classList.add('completed');
                labels[1].style.color = '#000';
                labels[1].style.fontWeight = '500';
            }
            
            // Animate second line filling
            if (lines[1]) {
                lines[1].style.width = '0%';
                lines[1].style.background = '#171717';
                lines[1].style.transition = 'width 1.5s ease';
                
                setTimeout(() => {
                    lines[1].style.width = '100%';
                }, 100);
            }
            
            // Complete step 3 after line fills
            setTimeout(() => {
                if (circles[2]) {
                    circles[2].classList.add('completed');
                    circles[2].classList.remove('active');
                    circles[2].style.background = '#171717';
                    circles[2].style.color = '#FFF';
                    circles[2].style.transform = 'scale(1.1)';
                    circles[2].innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"></polyline></svg>`;
                    
                    // Add bounce effect
                    setTimeout(() => {
                        circles[2].style.transform = 'scale(1)';
                        circles[2].style.transition = 'transform 0.3s ease';
                    }, 200);
                }
                if (labels[2]) {
                    labels[2].classList.add('completed');
                    labels[2].style.color = '#000';
                    labels[2].style.fontWeight = '500';
                }
                if (containers[1]) {
                    containers[1].style.background = '#171717';
                }
                
                console.log('🎉 Progress animation completed - Step 3 now has checkmark!');
            }, 1600);
            
        }, 300);
    }
    
    // ====== HELPER FUNCTIONS FOR TRACKING ======
    function generateTrackingId() {
        const prefix = 'CFX';
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
        return `#${prefix}-${year}-${random}`;
    }
    
    function getEstimatedDate() {
        const date = new Date();
        date.setDate(date.getDate() + 7); // Add 7 days
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    function animateTimeline() {
        // Disable the TrackReport.js timeline animation
        window.animateTimelineOnLoad = function() {
            console.log('Timeline animation disabled by main script');
        };
        
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach((item, index) => {
            item.style.opacity = '1'; // Keep visible
            item.style.transform = 'translateY(0)'; // No transform
            item.style.transition = 'all 0.5s ease';
            
            // Add a subtle slide-in effect instead
            item.style.marginLeft = '20px';
            setTimeout(() => {
                item.style.marginLeft = '0';
            }, index * 100);
        });
    }
    
    function addTrackingStyles() {
        if (document.getElementById('tracking-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'tracking-styles';
        style.textContent = `
            .tracking-container {
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.5s ease;
            }
            
            .success-banner {
                background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                color: white;
                padding: 32px;
                border-radius: 16px;
                margin-bottom: 32px;
                display: flex;
                align-items: center;
                gap: 24px;
                box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
            }
            
            .success-icon {
                flex-shrink: 0;
                width: 64px;
                height: 64px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .success-content h1 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
            }
            
            .success-content p {
                font-size: 16px;
                opacity: 0.95;
                line-height: 1.5;
            }
            
            .tracking-id-clickable {
                cursor: pointer;
                text-decoration: underline;
                transition: all 0.3s ease;
                padding: 2px 4px;
                border-radius: 4px;
            }
            
            .tracking-id-clickable:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }
            
            .report-card, .timeline-card {
                background: white;
                border-radius: 16px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                border: 1px solid #E5E7EB;
                margin-bottom: 32px;
                overflow: hidden;
            }
            
            .card-header {
                background: #F9FAFB;
                padding: 24px 32px;
                border-bottom: 1px solid #E5E7EB;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .card-header h2 {
                font-size: 20px;
                font-weight: 600;
                color: #111827;
            }
            
            .status-badge {
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .status-badge.in-progress {
                background: #FEF3C7;
                color: #92400E;
                border: 1px solid #F59E0B;
            }
            
            .status-badge.completed {
                background: #D1FAE5;
                color: #065F46;
                border: 1px solid #10B981;
            }
            
            .status-badge.pending {
                background: #F3F4F6;
                color: #374151;
                border: 1px solid #9CA3AF;
            }
            
            .card-content {
                padding: 32px;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 24px;
                margin-bottom: 32px;
            }
            
            .info-item {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding: 16px;
                background: #F9FAFB;
                border-radius: 8px;
                border-left: 4px solid #2563EB;
            }
            
            .info-item .label {
                font-weight: 500;
                color: #6B7280;
                font-size: 14px;
            }
            
            .info-item .value {
                font-weight: 600;
                color: #111827;
                font-size: 14px;
                text-align: right;
                max-width: 60%;
                word-break: break-word;
            }
            
            .priority-medium {
                color: #F59E0B !important;
            }
            
            .priority-high {
                color: #EF4444 !important;
            }
            
            .priority-low {
                color: #10B981 !important;
            }
            
            .description-section {
                margin-bottom: 32px;
                padding: 24px;
                background: #F9FAFB;
                border-radius: 12px;
                border: 1px solid #E5E7EB;
            }
            
            .description-section h3 {
                font-size: 16px;
                font-weight: 600;
                color: #111827;
                margin-bottom: 12px;
            }
            
            .description-section p {
                color: #374151;
                line-height: 1.6;
                font-size: 14px;
            }
            
            .attachments-section h3 {
                font-size: 16px;
                font-weight: 600;
                color: #111827;
                margin-bottom: 16px;
            }
            
            .attachment-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .attachment-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                background: #F9FAFB;
                border-radius: 8px;
                border: 1px solid #E5E7EB;
                transition: all 0.3s ease;
            }
            
            .attachment-item:hover {
                background: #F3F4F6;
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .attachment-icon {
                width: 40px;
                height: 40px;
                background: #EFF6FF;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #2563EB;
                flex-shrink: 0;
            }
            
            .attachment-item span:first-of-type {
                font-weight: 500;
                color: #111827;
                flex: 1;
            }
            
            .file-size {
                font-size: 12px;
                color: #6B7280;
                background: #E5E7EB;
                padding: 2px 8px;
                border-radius: 4px;
            }
            
            .timeline-card {
                background: white;
                border-radius: 16px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                border: 1px solid #E5E7EB;
                margin-bottom: 32px;
                overflow: hidden;
            }
            
            .timeline {
                padding: 32px;
            }
            
            .timeline-item {
                display: flex;
                gap: 20px;
                margin-bottom: 32px;
                position: relative;
            }
            
            .timeline-item:last-child {
                margin-bottom: 0;
            }
            
            .timeline-item:not(:last-child)::after {
                content: '';
                position: absolute;
                left: 11px;
                top: 24px;
                width: 2px;
                height: calc(100% + 8px);
                background: #E5E7EB;
            }
            
            .timeline-item.completed:not(:last-child)::after {
                background: #171717;
            }
            
            .timeline-item.active:not(:last-child)::after {
                background: linear-gradient(to bottom, #2563EB 50%, #E5E7EB 50%);
            }
            
            .timeline-marker {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: #E5E7EB;
                border: 3px solid white;
                flex-shrink: 0;
                position: relative;
                z-index: 1;
            }
            
            .timeline-item.completed .timeline-marker {
                background: #171717;
            }
            
            .timeline-item.active .timeline-marker {
                background: #2563EB;
                animation: pulse 2s infinite;
            }
            
            .timeline-item.pending .timeline-marker {
                background: #F3F4F6;
                border-color: #E5E7EB;
            }
            
            @keyframes pulse {
                0% {
                    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4);
                }
                70% {
                    box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
                }
                100% {
                    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
                }
            }
            
            .timeline-content {
                flex: 1;
                padding-top: 2px;
            }
            
            .timeline-content h4 {
                font-size: 16px;
                font-weight: 600;
                color: #111827;
                margin-bottom: 6px;
            }
            
            .timeline-item.completed .timeline-content h4 {
                color: #171717;
            }
            
            .timeline-item.active .timeline-content h4 {
                color: #2563EB;
            }
            
            .timeline-item.pending .timeline-content h4 {
                color: #6B7280;
            }
            
            .timeline-content p {
                color: #6B7280;
                font-size: 14px;
                line-height: 1.5;
                margin-bottom: 8px;
            }
            
            .timestamp {
                font-size: 12px;
                color: #9CA3AF;
                font-weight: 500;
            }
            
            .actions-section {
                display: flex;
                gap: 16px;
                flex-wrap: wrap;
                justify-content: center;
                padding: 32px 0;
            }
            
            .btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                text-decoration: none;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: 'Inter', sans-serif;
            }
            
            .btn-primary {
                background: #2563EB;
                color: white;
            }
            
            .btn-primary:hover {
                background: #1D4ED8;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
            }
            
            .btn-secondary {
                background: #10B981;
                color: white;
            }
            
            .btn-secondary:hover {
                background: #059669;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
            }
            
            .btn-outline {
                background: white;
                color: #6B7280;
                border: 2px solid #E5E7EB;
            }
            
            .btn-outline:hover {
                background: #F9FAFB;
                border-color: #D1D5DB;
                color: #374151;
                transform: translateY(-2px);
            }
            
            @media (max-width: 1024px) {
                .main-content {
                    padding: 24px 40px;
                }
                
                .progress-wrapper {
                    padding: 0 40px;
                }
                
                .success-banner {
                    flex-direction: column;
                    text-align: center;
                    gap: 16px;
                }
                
                .success-content h1 {
                    font-size: 24px;
                }
                
                .info-grid {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }
                
                .card-content {
                    padding: 24px;
                }
                
                .timeline {
                    padding: 24px;
                }
            }
            
            @media (max-width: 768px) {
                .main-content {
                    padding: 16px 20px;
                }
                
                .progress-wrapper {
                    padding: 0 20px;
                }
                
                .step {
                    flex-direction: column;
                    gap: 4px;
                    text-align: center;
                }
                
                .step-circle {
                    width: 28px;
                    height: 28px;
                    font-size: 12px;
                }
                
                .step-label {
                    font-size: 10px;
                }
                
                .line-container {
                    min-width: 40px;
                    height: 3px;
                }
                
                .line-fill {
                    height: 3px;
                    transition: width 0.3s ease;
                }
                
                .line-empty {
                    height: 3px;
                }
                
                .success-banner {
                    padding: 24px;
                }
                
                .success-content h1 {
                    font-size: 20px;
                }
                
                .success-content p {
                    font-size: 14px;
                }
                
                .card-header {
                    padding: 16px 20px;
                    flex-direction: column;
                    gap: 12px;
                    align-items: flex-start;
                }
                
                .card-content {
                    padding: 20px;
                }
                
                .info-item {
                    flex-direction: column;
                    gap: 8px;
                    align-items: flex-start;
                }
                
                .info-item .value {
                    text-align: left;
                    max-width: 100%;
                }
                
                .timeline {
                    padding: 20px;
                }
                
                .timeline-item {
                    gap: 12px;
                }
                
                .timeline-marker {
                    width: 20px;
                    height: 20px;
                }
                
                .timeline-item:not(:last-child)::after {
                    left: 9px;
                }
                
                .actions-section {
                    flex-direction: column;
                    align-items: center;
                }
                
                .btn {
                    width: 100%;
                    max-width: 300px;
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Global copy function
    window.copyTrackingIdGlobal = function() {
        if (window.currentTrackingId) {
            copyTrackingIdById(window.currentTrackingId);
        }
    };
    
    function copyTrackingIdById(trackingId) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(trackingId).then(function() {
                showCustomAlert('✅ Tracking ID copied to clipboard!', 'success');
            }).catch(function(err) {
                console.error('Failed to copy: ', err);
                fallbackCopyTextToClipboard(trackingId);
            });
        } else {
            fallbackCopyTextToClipboard(trackingId);
        }
    }
    
    window.copyTrackingId = copyTrackingIdById;
    
    // ====== CUSTOM ALERT FUNCTION ======
    function showCustomAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.custom-alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `custom-alert ${type}`;
        alertDiv.innerHTML = `
            <div class="alert-content">
                <span class="alert-message">${message}</span>
                <button class="alert-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Style the alert
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            background: ${type === 'success' ? '#ECFDF5' : type === 'error' ? '#FEF2F2' : '#F0F9FF'};
            border: 2px solid ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#2563EB'};
            color: ${type === 'success' ? '#065F46' : type === 'error' ? '#991B1B' : '#1E40AF'};
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            animation: slideInAlert 0.3s ease-out;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
            direction: ltr;
        `;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInAlert {
                from { opacity: 0; transform: translateX(100%); }
                to { opacity: 1; transform: translateX(0); }
            }
            .alert-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }
            .alert-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: inherit;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s;
            }
            .alert-close:hover {
                background: rgba(0,0,0,0.1);
            }
        `;
        document.head.appendChild(style);
        
        // Add to page
        document.body.appendChild(alertDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }
    
    // Fallback copy function for older browsers
    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showCustomAlert('✅ Tracking ID copied to clipboard!', 'success');
            } else {
                showCustomAlert('❌ Failed to copy tracking ID', 'error');
            }
        } catch (err) {
            console.error('Fallback: Could not copy text: ', err);
            showCustomAlert('❌ Copy not supported in this browser', 'error');
        }
        
        document.body.removeChild(textArea);
    }
    
    // ====== INITIAL SETUP ======
    // Initial progress update
    setTimeout(updateProgress, 100);
    
    // Mark as initialized
    if (problemType) problemType._formInitialized = true;
    
    console.log('✨ Form initialized successfully!');
}

// Backup initialization methods
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM ready, checking if form is initialized...');
    
    setTimeout(() => {
        const problemType = document.getElementById('problemType');
        if (problemType && !problemType._formInitialized) {
            console.log('🔄 Initializing form from DOMContentLoaded...');
            initializeForm();
        }
    }, 500);
});

// Force initialization if needed
setTimeout(() => {
    const problemType = document.getElementById('problemType');
    if (problemType && !problemType._formInitialized) {
        console.log('🔄 Force initializing form...');
        initializeForm();
    }
}, 1000);

console.log('📝 CityFix Complete Script Loaded!');