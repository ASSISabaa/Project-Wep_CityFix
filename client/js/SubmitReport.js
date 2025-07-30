// SIMPLE AND WORKING Progress Bar Script
console.log('🚀 Starting CityFix Form...');

// Wait for page to load completely
window.addEventListener('load', function() {
    console.log('✅ Page loaded, starting form...');
    initializeForm();
});

function initializeForm() {
    console.log('🔧 Initializing form...');
    
    // Get all elements
    const problemType = document.getElementById('problemType');
    const location = document.getElementById('location');
    const description = document.getElementById('description');
    const submitBtn = document.getElementById('submitBtn');
    
    // Get progress elements - with fallback creation
    let lineFills = document.querySelectorAll('.line-fill');
    
    // If no line-fill elements found, create them
    if (lineFills.length === 0) {
        console.log('⚠️ No line-fill found, creating them...');
        createLineFills();
        lineFills = document.querySelectorAll('.line-fill');
    }
    
    console.log('📊 Found', lineFills.length, 'progress lines');
    
    // Set initial state
    lineFills.forEach((line, index) => {
        line.style.width = '0%';
        line.style.transition = 'width 0.5s ease';
        console.log(`📏 Line ${index + 1} initialized`);
    });
    
    // Form data
    const formData = {
        problemType: '',
        location: '',
        description: ''
    };
    
    // Update progress function
    function updateProgress() {
        console.log('📈 Updating progress...');
        
        // Get current values
        formData.problemType = problemType ? problemType.value : '';
        formData.location = location ? location.value : '';
        formData.description = description ? description.value : '';
        
        console.log('Current data:', formData);
        
        // Count filled fields
        let completed = 0;
        if (formData.problemType.trim()) completed++;
        if (formData.location.trim()) completed++;
        if (formData.description.trim() && formData.description.trim().length >= 10) completed++;
        
        // Calculate percentage
        const percentage = (completed / 3) * 100;
        console.log(`Progress: ${percentage}% (${completed}/3 fields)`);
        
        // Update first line
        if (lineFills[0]) {
            lineFills[0].style.width = percentage + '%';
            console.log('🎨 First line updated to:', percentage + '%');
        }
        
        // Update step 2
        const step2Circle = document.querySelector('.step-circle:nth-child(2)') || document.querySelectorAll('.step-circle')[1];
        const step2Label = document.querySelector('.step-label:nth-child(2)') || document.querySelectorAll('.step-label')[1];
        
        if (completed === 3) {
            if (step2Circle) step2Circle.classList.add('active');
            if (step2Label) step2Label.classList.add('active');
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '🚀 Submit Report';
                submitBtn.style.backgroundColor = '#10B981';
            }
        } else {
            if (step2Circle) step2Circle.classList.remove('active');
            if (step2Label) step2Label.classList.remove('active');
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = `Fill Required Fields (${completed}/3)`;
                submitBtn.style.backgroundColor = '#9CA3AF';
            }
        }
    }
    
    // Add event listeners
    if (problemType) {
        problemType.addEventListener('change', function() {
            console.log('🔧 Problem type changed:', this.value);
            setTimeout(updateProgress, 10);
        });
    }
    
    if (location) {
        location.addEventListener('input', function() {
            console.log('📍 Location changed:', this.value);
            setTimeout(updateProgress, 10);
        });
    }
    
    if (description) {
        description.addEventListener('input', function() {
            console.log('📝 Description changed:', this.value.length, 'chars');
            setTimeout(updateProgress, 10);
        });
    }
    
    // Submit handler
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            if (this.disabled) {
                e.preventDefault();
                return;
            }
            
            console.log('🚀 Form submitted!');
            
            // Move to step 2
            const step2Circle = document.querySelectorAll('.step-circle')[1];
            const step2Label = document.querySelectorAll('.step-label')[1];
            
            if (step2Circle) step2Circle.classList.add('active');
            if (step2Label) step2Label.classList.add('active');
            if (lineFills[0]) lineFills[0].style.width = '100%';
            
            // Show loading
            this.innerHTML = '⏳ Submitting...';
            this.disabled = true;
            
            // Simulate success after 2 seconds
            setTimeout(() => {
                console.log('✅ Submission successful!');
                
                // Move to step 3
                const step3Circle = document.querySelectorAll('.step-circle')[2];
                const step3Label = document.querySelectorAll('.step-label')[2];
                
                if (step3Circle) step3Circle.classList.add('active');
                if (step3Label) step3Label.classList.add('active');
                if (lineFills[1]) lineFills[1].style.width = '100%';
                
                this.innerHTML = '✅ Report Submitted!';
                this.style.backgroundColor = '#10B981';
                
                // Show success message
                alert('🎉 Report submitted successfully!');
                
                // Reset after 3 seconds
                setTimeout(() => {
                    location.reload();
                }, 3000);
                
            }, 2000);
        });
    }
    
    // Initial update
    setTimeout(updateProgress, 100);
    
    console.log('✨ Form initialized successfully!');
}

function createLineFills() {
    console.log('🔧 Creating missing line-fill elements...');
    
    const lineContainers = document.querySelectorAll('.line-container');
    
    lineContainers.forEach((container, index) => {
        // Check if line-fill already exists
        if (!container.querySelector('.line-fill')) {
            console.log(`Creating line-fill for container ${index + 1}`);
            
            // Create line-fill
            const lineFill = document.createElement('div');
            lineFill.className = 'line-fill';
            lineFill.style.cssText = `
                background: #171717;
                width: 0%;
                height: 100%;
                transition: width 0.5s ease;
                position: absolute;
                top: 0;
                left: 0;
            `;
            
            // Make container relative for absolute positioning
            container.style.position = 'relative';
            
            // Insert line-fill
            container.insertBefore(lineFill, container.firstChild);
        }
    });
}

// Also try with DOMContentLoaded as backup
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM ready, checking if form is initialized...');
    
    // If form isn't initialized yet, do it now
    setTimeout(() => {
        const problemType = document.getElementById('problemType');
        if (problemType && !problemType._formInitialized) {
            console.log('🔄 Initializing form from DOMContentLoaded...');
            initializeForm();
        }
    }, 500);
});

console.log('📝 CityFix Form Script Loaded!');