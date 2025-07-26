// Super Simple Hamburger Menu - STAYS OPEN UNTIL X CLICKED!
// File: js/script.js

console.log('🔥 SIMPLE SCRIPT LOADED');

// Wait for page to load completely
window.addEventListener('load', function() {
    console.log('🔥 PAGE FULLY LOADED - STARTING SCRIPT');
    
    // Get the hamburger button
    const burger = document.querySelector('.mobile-menu-btn');
    const menu = document.querySelector('.mobile-nav');
    
    console.log('🔍 Burger button:', burger);
    console.log('🔍 Mobile menu:', menu);
    
    if (!burger) {
        console.error('❌ BURGER BUTTON NOT FOUND!');
        alert('Burger button not found! Check HTML class: .mobile-menu-btn');
        return;
    }
    
    if (!menu) {
        console.error('❌ MOBILE MENU NOT FOUND!');
        alert('Mobile menu not found! Check HTML class: .mobile-nav');
        return;
    }
    
    console.log('✅ BOTH ELEMENTS FOUND!');
    
    // Track menu state
    let menuIsOpen = false;
    
    // Simple click handler - ONLY BURGER BUTTON CONTROLS MENU
    burger.onclick = function() {
        console.log('🍔 BURGER CLICKED!');
        
        if (menuIsOpen) {
            // Close menu
            menu.style.display = 'none';
            menu.style.transform = 'translateY(-100%)';
            burger.classList.remove('active');
            document.body.style.overflow = '';
            menuIsOpen = false;
            console.log('❌ MENU CLOSED');
        } else {
            // Open menu
            menu.style.display = 'block';
            menu.style.transform = 'translateY(0)';
            burger.classList.add('active');
            document.body.style.overflow = 'hidden';
            menuIsOpen = true;
            console.log('✅ MENU OPENED');
        }
    };
    
    // Alternative: also add event listener (double safety)
    burger.addEventListener('click', function(e) {
        console.log('🍔 EVENT LISTENER TRIGGERED');
        e.preventDefault();
        e.stopPropagation();
    });
    
    // DO NOT close when clicking menu links - let user navigate
    const links = menu.querySelectorAll('a');
    links.forEach(function(link) {
        link.addEventListener('click', function(e) {
            // Allow normal link behavior, don't close menu
            console.log('🔗 LINK CLICKED - MENU STAYS OPEN');
            // Menu will only close when burger is clicked again
        });
    });
    
    // DO NOT close when clicking outside - only burger controls menu
    // Remove outside click handler completely
    
    // DO NOT close on window resize - keep menu state
    // Remove resize handler
    
    // Only close with Escape key (optional)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menuIsOpen) {
            menu.style.display = 'none';
            menu.style.transform = 'translateY(-100%)';
            burger.classList.remove('active');
            document.body.style.overflow = '';
            menuIsOpen = false;
            console.log('⌨️ MENU CLOSED BY ESCAPE KEY');
        }
    });
    
    // Force styles to make sure menu can show
    menu.style.position = 'fixed';
    menu.style.top = '70px';
    menu.style.left = '0';
    menu.style.right = '0';
    menu.style.width = '100%';
    menu.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
    menu.style.backdropFilter = 'blur(10px)';
    menu.style.zIndex = '9999';
    menu.style.padding = '20px 10px';
    menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    menu.style.transition = 'transform 0.3s ease';
    menu.style.display = 'none'; // Start hidden
    menu.style.transform = 'translateY(-100%)';
    menu.style.maxHeight = 'calc(100vh - 70px)';
    menu.style.overflowY = 'auto';
    
    // Style menu items
    const menuItems = menu.querySelectorAll('.nav-item');
    menuItems.forEach(function(item) {
        item.style.display = 'block';
        item.style.padding = '12px 0';
        item.style.textAlign = 'center';
        item.style.fontSize = '16px';
        item.style.color = '#4B5563';
        item.style.textDecoration = 'none';
        item.style.borderBottom = '1px solid #F3F4F6';
    });
    
    // Style auth buttons
    const authSection = menu.querySelector('.auth-section');
    if (authSection) {
        authSection.style.marginTop = '20px';
        authSection.style.display = 'flex';
        authSection.style.flexDirection = 'column';
        authSection.style.gap = '10px';
        authSection.style.alignItems = 'center';
        
        const authButtons = authSection.querySelectorAll('.login-btn, .signup-btn');
        authButtons.forEach(function(btn) {
            btn.style.width = '200px';
            btn.style.padding = '12px 20px';
            btn.style.textAlign = 'center';
            btn.style.borderRadius = '6px';
            btn.style.fontSize = '14px';
            btn.style.textDecoration = 'none';
        });
    }
    
    console.log('🎯 SCRIPT READY! MENU WILL STAY OPEN UNTIL YOU CLICK THE BURGER AGAIN!');
    
    // Add visual feedback to burger
    burger.style.cursor = 'pointer';
    burger.style.transition = 'all 0.3s ease';
    
    burger.onmouseenter = function() {
        if (!menuIsOpen) {
            burger.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        }
    };
    burger.onmouseleave = function() {
        if (!menuIsOpen) {
            burger.style.backgroundColor = '';
        }
    };
});

console.log('📄 PERSISTENT MENU SCRIPT LOADED');