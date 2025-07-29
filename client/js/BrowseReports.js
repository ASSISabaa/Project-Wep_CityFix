// Browse Reports JavaScript Functionality
class BrowseReports {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 6; // Adjusted for responsive grid
        this.currentFilters = {
            type: 'all',
            district: 'all',
            sort: 'newest',
            search: ''
        };
        
        this.reports = [
            {
                id: 1,
                title: 'Broken Light in Downtown',
                location: 'Main Street, near Central Park',
                district: 'downtown',
                type: 'lighting',
                status: 'in-progress',
                priority: 'high',
                reportedDate: new Date('2025-01-27'),
                similarCount: 3,
                image: 'assets/Broken Light.svg'
            },
            {
                id: 2,
                title: 'Large Pothole',
                location: 'Oak Street, West End',
                district: 'west-end',
                type: 'roads',
                status: 'resolved',
                priority: 'medium',
                reportedDate: new Date('2025-01-24'),
                similarCount: 7,
                image: 'assets/Large Pothole.svg'
            },
            {
                id: 3,
                title: 'Drainage Issue',
                location: 'Pine Avenue, North Side',
                district: 'north-side',
                type: 'drainage',
                status: 'pending',
                priority: 'low',
                reportedDate: new Date('2025-01-28'),
                similarCount: 2,
                image: 'assets/Drainage Issue.svg'
            },
            {
                id: 4,
                title: 'Broken Sidewalk',
                location: 'Elm Street, East Side',
                district: 'east-side',
                type: 'roads',
                status: 'in-progress',
                priority: 'medium',
                reportedDate: new Date('2025-01-26'),
                similarCount: 1,
                image: 'assets/Large Pothole.svg'
            },
            {
                id: 5,
                title: 'Waste Management Issue',
                location: 'Market Square, Downtown',
                district: 'downtown',
                type: 'waste',
                status: 'resolved',
                priority: 'low',
                reportedDate: new Date('2025-01-25'),
                similarCount: 4,
                image: 'assets/Drainage Issue.svg'
            },
            {
                id: 6,
                title: 'Street Light Malfunction',
                location: 'Park Avenue, North Side',
                district: 'north-side',
                type: 'lighting',
                status: 'pending',
                priority: 'high',
                reportedDate: new Date('2025-01-23'),
                similarCount: 2,
                image: 'assets/Broken Light.svg'
            }
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderReports();
        this.updatePagination();
        this.setupMobileMenu();
        this.updateResponsiveLayout();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateResponsiveLayout();
        });
    }
    
    setupEventListeners() {
        // Dropdown handlers
        const dropdowns = document.querySelectorAll('.filter-dropdown');
        dropdowns.forEach(dropdown => {
            const btn = dropdown.querySelector('.filter-btn');
            const content = dropdown.querySelector('.dropdown-content');
            const items = dropdown.querySelectorAll('.dropdown-item');
            
            // Toggle dropdown
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeAllDropdowns();
                dropdown.classList.toggle('active');
            });
            
            // Handle dropdown item selection
            items.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = item.dataset.value;
                    const text = item.textContent;
                    
                    // Update button text
                    btn.querySelector('span').textContent = text;
                    
                    // Update filters based on dropdown type
                    if (dropdown.id === 'typeFilter') {
                        this.currentFilters.type = value;
                    } else if (dropdown.id === 'districtFilter') {
                        this.currentFilters.district = value;
                    }
                    
                    dropdown.classList.remove('active');
                    this.filterAndSortReports();
                });
            });
        });
        
        // Sort button handlers
        const sortButtons = document.querySelectorAll('.sort-btn');
        sortButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                sortButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.currentFilters.sort = btn.dataset.sort;
                this.filterAndSortReports();
            });
        });
        
        // Search input handler
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = e.target.value.toLowerCase();
                    this.filterAndSortReports();
                }, 300);
            });
            
            // Clear search on escape
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    this.currentFilters.search = '';
                    this.filterAndSortReports();
                }
            });
        }
        
        // Pagination handlers
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageLinks = document.querySelectorAll('[data-page]');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderReports();
                    this.updatePagination();
                    this.scrollToTop();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const maxPages = Math.ceil(this.getFilteredReports().length / this.itemsPerPage);
                if (this.currentPage < maxPages) {
                    this.currentPage++;
                    this.renderReports();
                    this.updatePagination();
                    this.scrollToTop();
                }
            });
        }
        
        pageLinks.forEach(link => {
            link.addEventListener('click', () => {
                const page = parseInt(link.dataset.page);
                if (page !== this.currentPage) {
                    this.currentPage = page;
                    this.renderReports();
                    this.updatePagination();
                    this.scrollToTop();
                }
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllDropdowns();
            }
        });
        
        // Report card click handlers
        document.addEventListener('click', (e) => {
            const reportCard = e.target.closest('.report-card');
            if (reportCard && !e.target.closest('.report-priority')) {
                const reportId = parseInt(reportCard.dataset.id);
                this.viewReportDetails(reportId);
            }
        });
    }
    
    closeAllDropdowns() {
        document.querySelectorAll('.filter-dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
    
    getFilteredReports() {
        return this.reports.filter(report => {
            // Type filter
            if (this.currentFilters.type !== 'all' && report.type !== this.currentFilters.type) {
                return false;
            }
            
            // District filter
            if (this.currentFilters.district !== 'all' && report.district !== this.currentFilters.district) {
                return false;
            }
            
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                return report.title.toLowerCase().includes(searchTerm) ||
                       report.location.toLowerCase().includes(searchTerm) ||
                       report.status.toLowerCase().includes(searchTerm);
            }
            
            return true;
        });
    }
    
    getSortedReports(reports) {
        const sorted = [...reports];
        
        switch (this.currentFilters.sort) {
            case 'newest':
                return sorted.sort((a, b) => b.reportedDate - a.reportedDate);
            case 'oldest':
                return sorted.sort((a, b) => a.reportedDate - b.reportedDate);
            case 'most-reported':
                return sorted.sort((a, b) => b.similarCount - a.similarCount);
            case 'resolved-first':
                return sorted.sort((a, b) => {
                    if (a.status === 'resolved' && b.status !== 'resolved') return -1;
                    if (a.status !== 'resolved' && b.status === 'resolved') return 1;
                    return b.reportedDate - a.reportedDate;
                });
            default:
                return sorted;
        }
    }
    
    filterAndSortReports() {
        this.currentPage = 1; // Reset to first page when filtering
        this.renderReports();
        this.updatePagination();
    }
    
    renderReports() {
        const reportsList = document.getElementById('reportsList');
        if (!reportsList) return;
        
        const filteredReports = this.getFilteredReports();
        const sortedReports = this.getSortedReports(filteredReports);
        
        // Pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedReports = sortedReports.slice(startIndex, endIndex);
        
        // Show loading state
        reportsList.innerHTML = '<div class="loading">Loading reports...</div>';
        
        setTimeout(() => {
            if (paginatedReports.length === 0) {
                reportsList.innerHTML = `
                    <div class="empty-state">
                        <h3>No reports found</h3>
                        <p>Try adjusting your filters or search terms</p>
                    </div>
                `;
                return;
            }
            
            reportsList.innerHTML = paginatedReports.map(report => this.createReportCard(report)).join('');
            this.animateCards();
        }, 100);
    }
    
    createReportCard(report) {
        const timeAgo = this.getTimeAgo(report.reportedDate);
        const statusClass = report.status.replace('-', '');
        const statusText = this.getStatusText(report.status);
        
        return `
            <div class="report-card" data-type="${report.type}" data-district="${report.district}" data-status="${report.status}" data-id="${report.id}">
                <div class="report-image">
                    <div class="report-icon">
                        <img src="${report.image}" alt="${report.title}" loading="lazy">
                    </div>
                </div>
                <div class="report-content">
                    <div class="report-header">
                        <h3>${report.title}</h3>
                        <div class="report-priority ${report.priority}">${statusText}</div>
                    </div>
                    <p class="location">${report.location}</p>
                    <div class="status-section">
                        <p class="time">Reported ${timeAgo}</p>
                        <span class="similar-count">${report.similarCount} similar reports</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    getStatusText(status) {
        const statusMap = {
            'in-progress': 'In Progress',
            'resolved': 'Resolved',
            'pending': 'Pending'
        };
        return statusMap[status] || status;
    }
    
    animateCards() {
        const cards = document.querySelectorAll('.report-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.3s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    updatePagination() {
        const filteredReports = this.getFilteredReports();
        const maxPages = Math.ceil(filteredReports.length / this.itemsPerPage);
        
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageLinks = document.querySelectorAll('[data-page]');
        
        // Update prev button
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
            prevBtn.style.opacity = this.currentPage === 1 ? '0.5' : '1';
        }
        
        // Update next button
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === maxPages || maxPages === 0;
            nextBtn.style.opacity = (this.currentPage === maxPages || maxPages === 0) ? '0.5' : '1';
        }
        
        // Update page links
        pageLinks.forEach(link => {
            const page = parseInt(link.dataset.page);
            link.classList.toggle('active', page === this.currentPage);
            link.style.display = page <= maxPages ? 'flex' : 'none';
        });
        
        // Update URL without page reload
        this.updateURL();
    }
    
    updateURL() {
        const params = new URLSearchParams();
        
        if (this.currentFilters.type !== 'all') params.set('type', this.currentFilters.type);
        if (this.currentFilters.district !== 'all') params.set('district', this.currentFilters.district);
        if (this.currentFilters.sort !== 'newest') params.set('sort', this.currentFilters.sort);
        if (this.currentFilters.search) params.set('search', this.currentFilters.search);
        if (this.currentPage > 1) params.set('page', this.currentPage);
        
        const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
        window.history.replaceState({}, '', newURL);
    }
    
    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        
        this.currentFilters.type = params.get('type') || 'all';
        this.currentFilters.district = params.get('district') || 'all';
        this.currentFilters.sort = params.get('sort') || 'newest';
        this.currentFilters.search = params.get('search') || '';
        this.currentPage = parseInt(params.get('page')) || 1;
        
        // Update UI elements
        this.updateUIFromFilters();
    }
    
    updateUIFromFilters() {
        // Update dropdown buttons
        const typeBtn = document.querySelector('#typeFilter .filter-btn span');
        const districtBtn = document.querySelector('#districtFilter .filter-btn span');
        const searchInput = document.getElementById('searchInput');
        
        if (typeBtn) {
            const typeText = this.getTypeDisplayText(this.currentFilters.type);
            typeBtn.textContent = typeText;
        }
        
        if (districtBtn) {
            const districtText = this.getDistrictDisplayText(this.currentFilters.district);
            districtBtn.textContent = districtText;
        }
        
        if (searchInput) {
            searchInput.value = this.currentFilters.search;
        }
        
        // Update sort buttons
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sort === this.currentFilters.sort);
        });
    }
    
    getTypeDisplayText(type) {
        const typeMap = {
            'all': 'All Types',
            'lighting': 'Street Lighting',
            'roads': 'Road Issues',
            'drainage': 'Drainage',
            'waste': 'Waste Management'
        };
        return typeMap[type] || 'All Types';
    }
    
    getDistrictDisplayText(district) {
        const districtMap = {
            'all': 'All Districts',
            'downtown': 'Downtown',
            'west-end': 'West End',
            'north-side': 'North Side',
            'east-side': 'East Side'
        };
        return districtMap[district] || 'All Districts';
    }
    
    setupMobileMenu() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navSection = document.querySelector('.nav-section');
        
        if (mobileMenuBtn && navSection) {
            mobileMenuBtn.addEventListener('click', () => {
                navSection.classList.toggle('active');
                mobileMenuBtn.classList.toggle('active');
            });
        }
    }
    
    updateResponsiveLayout() {
        const width = window.innerWidth;
        
        // Adjust items per page based on screen size
        if (width <= 480) {
            this.itemsPerPage = 3;
        } else if (width <= 768) {
            this.itemsPerPage = 4;
        } else if (width <= 1024) {
            this.itemsPerPage = 6;
        } else {
            this.itemsPerPage = 6;
        }
        
        // Re-render if items per page changed
        this.updatePagination();
    }
    
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);
        
        if (diffInHours < 1) {
            return 'just now';
        } else if (diffInHours < 24) {
            return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
        } else {
            return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
        }
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    viewReportDetails(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (report) {
            // In a real application, this would navigate to a details page
            // For now, we'll show an alert
            const details = `
Report Details:
- Title: ${report.title}
- Location: ${report.location}
- Status: ${this.getStatusText(report.status)}
- Priority: ${report.priority}
- Reported: ${this.getTimeAgo(report.reportedDate)}
- Similar Reports: ${report.similarCount}
            `.trim();
            
            alert(details);
            
            // You can implement navigation here:
            // window.location.href = `report-details.html?id=${reportId}`;
        }
    }
    
    // Public methods for external use
    addReport(report) {
        const newId = Math.max(...this.reports.map(r => r.id)) + 1;
        this.reports.unshift({
            ...report,
            id: newId,
            reportedDate: new Date(),
            image: report.image || 'assets/default-report.svg'
        });
        this.filterAndSortReports();
    }
    
    updateReportStatus(reportId, newStatus) {
        const report = this.reports.find(r => r.id === reportId);
        if (report) {
            report.status = newStatus;
            this.renderReports();
        }
    }
    
    searchReports(query) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = query;
            this.currentFilters.search = query.toLowerCase();
            this.filterAndSortReports();
        }
    }
    
    exportReports() {
        const filteredReports = this.getFilteredReports();
        const sortedReports = this.getSortedReports(filteredReports);
        
        const csvContent = this.convertToCSV(sortedReports);
        this.downloadCSV(csvContent, 'reports.csv');
    }
    
    convertToCSV(reports) {
        const headers = ['ID', 'Title', 'Location', 'District', 'Type', 'Status', 'Priority', 'Reported Date', 'Similar Count'];
        const rows = reports.map(report => [
            report.id,
            report.title,
            report.location,
            report.district,
            report.type,
            report.status,
            report.priority,
            report.reportedDate.toISOString().split('T')[0],
            report.similarCount
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Utility functions
const ReportsUtils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    },
    
    isMobile() {
        return window.innerWidth <= 768;
    },
    
    isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main functionality
    window.browseReports = new BrowseReports();
    
    // Load from URL parameters
    window.browseReports.loadFromURL();
    
    // Setup performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log(`Page loaded in ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
        });
    }
    
    // Setup error handling
    window.addEventListener('error', (event) => {
        console.error('Application error:', event.error);
    });
    
    // Setup service worker for caching (if available)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrowseReports, ReportsUtils };
}