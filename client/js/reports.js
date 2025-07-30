// CityFix Reports Management - Backend Ready

// 🔧 API Configuration - Change this to your server URL
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api', // or https://your-server.com/api
    ENDPOINTS: {
        REPORTS: '/reports',
        DELETE_REPORT: '/reports/:id',
        DISTRICTS: '/districts',
        REPORT_TYPES: '/report-types'
    }
};

// Global Variables
let reportsData = [];
let filteredReports = [];
let currentPage = 1;
const itemsPerPage = 10;
let isLoading = false;

// DOM Elements
const reportsTableBody = document.querySelector('.reports-table tbody');
const searchInput = document.getElementById('searchInput');
const issueTypeFilter = document.getElementById('issueTypeFilter');
const districtFilter = document.getElementById('districtFilter');
const statusFilter = document.getElementById('statusFilter');
const dateFromInput = document.getElementById('dateFrom');
const exportBtn = document.querySelector('.export-btn');
const filterBtn = document.querySelector('.filter-btn');
const paginationInfo = document.querySelector('.pagination-info span');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// 🔄 API Functions
async function makeApiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            // Add Authentication token if required
            // 'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
    };

    const config = { ...defaultOptions, ...options };

    try {
        console.log(`🔄 API Request: ${config.method || 'GET'} ${url}`);
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ API Response:', data);
        
        return data;
    } catch (error) {
        console.error('❌ API Error:', error);
        handleApiError(error);
        throw error;
    }
}

function handleApiError(error) {
    let message = 'An unexpected error occurred';
    
    if (error.message.includes('Failed to fetch')) {
        message = 'Failed to connect to server. Make sure the server is running.';
    } else if (error.message.includes('404')) {
        message = 'Requested data not found.';
    } else if (error.message.includes('401')) {
        message = 'Unauthorized access. Please login again.';
    } else if (error.message.includes('500')) {
        message = 'Server error. Please try again later.';
    }
    
    showNotification(message, 'error');
}

// 🔃 Loading Functions
function showLoading() {
    if (isLoading) return;
    isLoading = true;
    
    // Show loading in table
    if (reportsTableBody) {
        reportsTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div class="loading-container">
                        <div class="spinner"></div>
                        <div style="margin-top: 15px; color: #666;">Loading reports...</div>
                    </div>
                </td>
            </tr>
        `;
    }
}

function hideLoading() {
    isLoading = false;
}

// 📡 Load Reports from Backend
async function loadReports() {
    try {
        showLoading();

        // Collect filter parameters
        const filters = {
            search: searchInput?.value || '',
            type: issueTypeFilter?.value || '',
            district: districtFilter?.value || '',
            status: statusFilter?.value || '',
            dateFrom: dateFromInput?.value || '',
            page: currentPage,
            limit: itemsPerPage
        };

        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (!filters[key]) delete filters[key];
        });

        // Build query string
        const queryParams = new URLSearchParams(filters);
        const endpoint = `${API_CONFIG.ENDPOINTS.REPORTS}?${queryParams.toString()}`;

        // Make API call
        const response = await makeApiRequest(endpoint);
        
        // Handle different response structures from backend
        reportsData = response.data || response.reports || response;
        filteredReports = reportsData;
        
        // Update pagination if backend provides it
        if (response.pagination) {
            updatePaginationFromBackend(response.pagination);
        }

        // Render table
        renderReportsTable();

    } catch (error) {
        console.error('Error loading reports:', error);
        showErrorInTable('Failed to load reports');
    } finally {
        hideLoading();
    }
}

// 📊 Load Dropdown Options from Backend
async function loadDropdownOptions() {
    try {
        // Load districts for filter
        const districts = await makeApiRequest(API_CONFIG.ENDPOINTS.DISTRICTS);
        populateDropdown(districtFilter, districts, 'id', 'name', 'All Districts');

        // Load report types for filter
        const reportTypes = await makeApiRequest(API_CONFIG.ENDPOINTS.REPORT_TYPES);
        populateDropdown(issueTypeFilter, reportTypes, 'id', 'name', 'All Issue Types');

    } catch (error) {
        console.error('Error loading dropdown options:', error);
        // Continue with default options if API fails
    }
}

function populateDropdown(selectElement, options, valueField, textField, defaultText) {
    if (!selectElement || !options) return;

    // Clear existing options except the default one
    selectElement.innerHTML = `<option value="">${defaultText}</option>`;

    // Add options from backend
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option[valueField];
        optionElement.textContent = option[textField];
        selectElement.appendChild(optionElement);
    });
}

// 🎨 Render Reports Table
function renderReportsTable() {
    if (!reportsTableBody) return;

    reportsTableBody.innerHTML = '';

    if (!filteredReports || filteredReports.length === 0) {
        showEmptyState();
        return;
    }

    filteredReports.forEach(report => {
        const row = createReportRow(report);
        reportsTableBody.appendChild(row);
    });

    updatePaginationInfo();
}

function createReportRow(report) {
    const row = document.createElement('tr');
    row.classList.add('report-row');
    row.setAttribute('data-report-id', report.id);

    row.innerHTML = `
        <td class="report-id">${report.id || report.reportId}</td>
        <td class="report-title">${report.title}</td>
        <td class="report-location">${report.location || report.address}</td>
        <td class="report-type">${report.type || report.category}</td>
        <td>
            <span class="status-badge ${getStatusBadgeClass(report.status)}">
                ${getStatusDisplayText(report.status)}
            </span>
        </td>
        <td class="report-date">${formatDate(report.createdAt || report.date)}</td>
        <td class="actions-cell">
            <button class="action-menu-btn" onclick="showActionMenu(event, '${report.id || report.reportId}')">
                <span class="dots-icon">⋮</span>
            </button>
        </td>
    `;

    // Add click event to navigate to details (except actions cell)
    row.addEventListener('click', (e) => {
        if (!e.target.closest('.actions-cell')) {
            navigateToReportDetails(report);
        }
    });

    // Add hover effects
    row.addEventListener('mouseenter', () => {
        row.style.backgroundColor = '#f8f9fa';
        row.style.cursor = 'pointer';
    });

    row.addEventListener('mouseleave', () => {
        row.style.backgroundColor = '';
    });

    return row;
}

// 🗺️ Navigate to Report Details
function navigateToReportDetails(report) {
    // Don't use localStorage anymore - let details page fetch from backend
    const reportId = report.id || report.reportId;
    window.location.href = `ReportsDetails.html?id=${reportId}`;
}

// 🎯 Status Helper Functions
function getStatusBadgeClass(status) {
    const statusClasses = {
        'new': 'status-new',
        'in-progress': 'status-progress',
        'pending': 'status-pending',
        'resolved': 'status-resolved',
        'closed': 'status-closed'
    };
    return statusClasses[status] || 'status-new';
}

function getStatusDisplayText(status) {
    const statusTexts = {
        'new': 'New',
        'in-progress': 'In Progress',
        'pending': 'Pending',
        'resolved': 'Resolved',
        'closed': 'Closed'
    };
    return statusTexts[status] || 'New';
}

// 📅 Date Formatting
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
}

// 🗑️ Delete Report
async function deleteReport(reportId) {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
        showLoading();
        
        const endpoint = API_CONFIG.ENDPOINTS.DELETE_REPORT.replace(':id', reportId);
        await makeApiRequest(endpoint, { method: 'DELETE' });
        
        // Reload reports after successful deletion
        await loadReports();
        
        showNotification('Report deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting report:', error);
        // Error already handled in handleApiError
    } finally {
        hideLoading();
    }
}

// 📤 Export Reports
async function exportReports() {
    try {
        showLoading();
        
        // Get all reports for export (without pagination)
        const filters = {
            search: searchInput?.value || '',
            type: issueTypeFilter?.value || '',
            district: districtFilter?.value || '',
            status: statusFilter?.value || '',
            dateFrom: dateFromInput?.value || '',
            export: true // Flag for backend to return all results
        };

        Object.keys(filters).forEach(key => {
            if (!filters[key]) delete filters[key];
        });

        const queryParams = new URLSearchParams(filters);
        const endpoint = `${API_CONFIG.ENDPOINTS.REPORTS}?${queryParams.toString()}`;
        
        const response = await makeApiRequest(endpoint);
        const reports = response.data || response.reports || response;

        downloadCsvFile(reports);
        showNotification('Reports exported successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting reports:', error);
        // Error already handled in handleApiError
    } finally {
        hideLoading();
    }
}

function downloadCsvFile(reports) {
    const headers = ['ID', 'Title', 'Location', 'Type', 'Status', 'Date'];
    const csvContent = [
        headers.join(','),
        ...reports.map(report => [
            report.id || report.reportId,
            `"${report.title}"`,
            `"${report.location || report.address}"`,
            report.type || report.category,
            report.status,
            formatDate(report.createdAt || report.date)
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cityfix-reports-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// 🔍 Search and Filter Functions
function applyFilters() {
    // Reset to first page when filtering
    currentPage = 1;
    // Load from backend with new filters
    loadReports();
}

// Debounce function to avoid too many API calls while typing
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

// 📄 Pagination Functions
function updatePaginationInfo() {
    if (!paginationInfo) return;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, filteredReports.length);
    const totalItems = filteredReports.length;

    paginationInfo.textContent = `Showing ${startItem} to ${endItem} of ${totalItems} entries`;

    // Update pagination buttons
    updatePaginationButtons();
}

function updatePaginationFromBackend(pagination) {
    if (pagination.total) {
        const totalItems = pagination.total;
        const startItem = ((pagination.page || currentPage) - 1) * itemsPerPage + 1;
        const endItem = Math.min((pagination.page || currentPage) * itemsPerPage, totalItems);
        
        if (paginationInfo) {
            paginationInfo.textContent = `Showing ${startItem} to ${endItem} of ${totalItems} entries`;
        }
    }
    updatePaginationButtons();
}

function updatePaginationButtons() {
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
    }
    
    if (nextBtn) {
        const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.style.opacity = currentPage >= totalPages ? '0.5' : '1';
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        loadReports();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        loadReports();
    }
}

// 📱 UI Helper Functions
function showEmptyState() {
    reportsTableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 40px; color: #6c757d;">
                <div>
                    <div style="font-size: 48px; margin-bottom: 15px;">📋</div>
                    <div style="font-size: 18px; margin-bottom: 10px;">No reports found</div>
                    <div style="font-size: 14px;">Try adjusting your filters or search terms</div>
                </div>
            </td>
        </tr>
    `;
}

function showErrorInTable(message) {
    reportsTableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 40px; color: #dc3545;">
                <div>
                    <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                    <div style="font-size: 18px; margin-bottom: 10px;">${message}</div>
                    <button onclick="loadReports()" 
                            style="background: #007bff; color: white; border: none; 
                                   padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function showNotification(message, type = 'info') {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#007bff',
        warning: '#ffc107'
    };

    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="background: ${colors[type]}; color: white; padding: 12px 20px; 
                    border-radius: 8px; position: fixed; top: 20px; right: 20px; 
                    z-index: 1001; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideIn 0.3s ease;">
            <span style="margin-right: 10px;">${type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
            ${message}
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: white; 
                           float: right; cursor: pointer; font-size: 18px; margin-left: 10px;">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// 🎭 Action Menu Functions
function showActionMenu(event, reportId) {
    event.stopPropagation();
    
    const existingMenu = document.querySelector('.action-menu');
    if (existingMenu) existingMenu.remove();
    
    const actionMenu = document.createElement('div');
    actionMenu.className = 'action-menu';
    actionMenu.innerHTML = `
        <div class="action-menu-item" onclick="viewReport('${reportId}')">View Details</div>
        <div class="action-menu-item" onclick="editReport('${reportId}')">Edit Status</div>
        <div class="action-menu-item" onclick="assignReport('${reportId}')">Assign Team</div>
        <div class="action-menu-item" onclick="deleteReport('${reportId}')">Delete</div>
    `;
    
    const rect = event.target.getBoundingClientRect();
    actionMenu.style.position = 'fixed';
    actionMenu.style.top = `${rect.bottom + 5}px`;
    actionMenu.style.left = `${rect.left - 100}px`;
    actionMenu.style.background = 'white';
    actionMenu.style.border = '1px solid #ddd';
    actionMenu.style.borderRadius = '4px';
    actionMenu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    actionMenu.style.zIndex = '1000';
    actionMenu.style.minWidth = '120px';
    
    document.body.appendChild(actionMenu);
    
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            actionMenu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 0);
}

function viewReport(reportId) {
    window.location.href = `ReportsDetails.html?id=${reportId}`;
}

function editReport(reportId) {
    // Implement edit functionality
    console.log('Edit report:', reportId);
}

function assignReport(reportId) {
    // Implement assign functionality
    console.log('Assign report:', reportId);
}

// 🔧 Sidebar Functionality
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}

function setActive(element) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    element.classList.add('active');
    
    if (window.innerWidth <= 768) {
        closeSidebar();
    }
}

// 🚀 Initialize Application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing CityFix Reports Management');

    // Add CSS for loading spinner and notifications
    addRequiredStyles();
    
    // Load dropdown options from backend
    await loadDropdownOptions();
    
    // Load initial reports
    await loadReports();

    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Application initialized successfully');
});

function setupEventListeners() {
    // Search with debounce to avoid too many API calls
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 500));
    }
    
    // Filter changes
    [issueTypeFilter, districtFilter, statusFilter, dateFromInput].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', applyFilters);
        }
    });
    
    // Export button
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReports);
    }
    
    // Filter button
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            showNotification('Advanced filters panel would open here', 'info');
        });
    }
    
    // Pagination buttons
    if (prevBtn) prevBtn.addEventListener('click', previousPage);
    if (nextBtn) nextBtn.addEventListener('click', nextPage);
    
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            setActive(this);
        });
    });
    
    // Mobile responsive
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
    
    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const hamburger = document.querySelector('.hamburger-btn');
        
        if (sidebar && !sidebar.contains(e.target) && !hamburger?.contains(e.target)) {
            closeSidebar();
        }
    });
}

function addRequiredStyles() {
    const styles = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        .action-menu {
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            z-index: 1000;
        }
        
        .action-menu-item {
            padding: 12px 16px;
            cursor: pointer;
            font-size: 14px;
            color: #495057;
            border-bottom: 1px solid #f1f3f4;
            transition: background-color 0.2s ease;
        }
        
        .action-menu-item:last-child {
            border-bottom: none;
        }
        
        .action-menu-item:hover {
            background-color: #f8f9fa;
            color: #2c3e50;
        }
        
        .report-row {
            transition: background-color 0.2s ease;
        }
        
        .report-row:hover {
            background-color: #f8f9fa !important;
            cursor: pointer;
        }
        
        .action-menu-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            color: #6c757d;
            font-size: 16px;
            line-height: 1;
        }
        
        .action-menu-btn:hover {
            background-color: #f8f9fa;
            color: #495057;
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}