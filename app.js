// Application State
let currentUser = null;
let users = JSON.parse(localStorage.getItem('debtway_users') || '[]');
let debts = JSON.parse(localStorage.getItem('debtway_debts') || '[]');
let payments = JSON.parse(localStorage.getItem('debtway_payments') || '[]');

// Chart instances
let paymentTimelineChart;
let debtDistributionChart;
let userGrowthChart;
let adminPortfolioChart;

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('debtway_current_user');
    if (loggedInUser) {
        try {
            currentUser = JSON.parse(loggedInUser);
            if (currentUser.role === 'admin') {
                showAdminDashboard();
            } else {
                showUserDashboard();
            }
        } catch (e) {
            // Invalid stored user data, show intro
            localStorage.removeItem('debtway_current_user');
            showIntro();
        }
    } else {
        showIntro();
    }
}

function setupEventListeners() {
    // Auth forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const addDebtForm = document.getElementById('add-debt-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    if (addDebtForm) {
        addDebtForm.addEventListener('submit', handleAddDebt);
    }
    
    // Logout buttons
    const userLogoutBtn = document.getElementById('user-logout-btn');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    
    if (userLogoutBtn) {
        userLogoutBtn.addEventListener('click', logout);
    }
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', logout);
    }
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Modal close on background click
    const modal = document.getElementById('add-debt-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideAddDebtModal();
            }
        });
    }
}

// Page Navigation Functions - These need to be global
window.showIntro = function() {
    hideAllPages();
    const introPage = document.getElementById('intro-page');
    if (introPage) {
        introPage.style.display = 'block';
        setTimeout(() => introPage.classList.add('visible'), 10);
    }
};

window.showLogin = function() {
    hideAllPages();
    const loginPage = document.getElementById('login-page');
    if (loginPage) {
        loginPage.classList.remove('hidden');
        loginPage.style.display = 'flex';
    }
    const emailInput = document.getElementById('login-email');
    if (emailInput) {
        setTimeout(() => emailInput.focus(), 100);
    }
};

window.showSignup = function() {
    hideAllPages();
    const signupPage = document.getElementById('signup-page');
    if (signupPage) {
        signupPage.classList.remove('hidden');
        signupPage.style.display = 'flex';
    }
    const nameInput = document.getElementById('signup-name');
    if (nameInput) {
        setTimeout(() => nameInput.focus(), 100);
    }
};

window.showUserDashboard = function() {
    hideAllPages();
    const userDashboard = document.getElementById('user-dashboard');
    if (userDashboard) {
        userDashboard.style.display = 'flex';
        setTimeout(() => userDashboard.classList.add('visible'), 10);
    }
    updateUserDashboard();
    setTimeout(() => {
        initializeUserCharts();
    }, 100);
};

window.showAdminDashboard = function() {
    hideAllPages();
    const adminDashboard = document.getElementById('admin-dashboard');
    if (adminDashboard) {
        adminDashboard.style.display = 'flex';
        setTimeout(() => adminDashboard.classList.add('visible'), 10);
    }
    updateAdminDashboard();
    setTimeout(() => {
        initializeAdminCharts();
    }, 100);
};

window.logout = function() {
    currentUser = null;
    localStorage.removeItem('debtway_current_user');
    showIntro();
};

window.showAddDebtModal = function() {
    document.getElementById('add-debt-modal').classList.remove('hidden');
    const debtNameInput = document.getElementById('debt-name');
    if (debtNameInput) {
        setTimeout(() => debtNameInput.focus(), 100);
    }
};

window.hideAddDebtModal = function() {
    document.getElementById('add-debt-modal').classList.add('hidden');
    const form = document.getElementById('add-debt-form');
    if (form) {
        form.reset();
    }
};

window.showSection = function(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update section title
    const titleElement = currentUser?.role === 'admin' 
        ? document.getElementById('admin-section-title')
        : document.getElementById('section-title');
    
    const sectionNames = {
        'overview': 'Dashboard',
        'debts': 'My Debts',
        'payments': 'Payment Tracking',
        'documents': 'Document Vault',
        'goals': 'Goal Planner',
        'reports': 'Reports',
        'insights': 'AI Insights',
        'settings': 'Settings',
        'admin-overview': 'System Overview',
        'user-management': 'User Management',
        'portfolio-analytics': 'Portfolio Analytics',
        'ai-performance': 'AI Performance',
        'communications': 'Communications',
        'system-health': 'System Health',
        'admin-settings': 'Settings'
    };
    
    if (titleElement) {
        titleElement.textContent = sectionNames[sectionId] || 'Dashboard';
    }
    
    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });
};

function hideAllPages() {
    const pages = ['intro-page', 'login-page', 'signup-page', 'user-dashboard', 'admin-dashboard'];
    pages.forEach(pageId => {
        const element = document.getElementById(pageId);
        if (element) {
            element.classList.add('hidden');
            element.classList.remove('visible');
            element.style.display = 'none';
        }
    });
}

// Authentication
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    // Clear any previous errors
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';

    // Check admin credentials
    if (email === 'admin@debtway.com' && password === 'admin123') {
        currentUser = { 
            id: 'admin', 
            email: email, 
            name: 'Administrator', 
            role: 'admin',
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('debtway_current_user', JSON.stringify(currentUser));
        showWelcomeMessage('Welcome back, Administrator!');
        setTimeout(() => showAdminDashboard(), 1500);
        return;
    }

    // Check user credentials
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = { ...user };
        delete currentUser.password; // Don't store password in current user
        localStorage.setItem('debtway_current_user', JSON.stringify(currentUser));
        showWelcomeMessage(`Welcome back, ${user.name}!`);
        setTimeout(() => showUserDashboard(), 1500);
    } else {
        errorDiv.textContent = 'Incorrect password or email entered';
        errorDiv.classList.remove('hidden');
    }
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errorDiv = document.getElementById('signup-error');

    // Clear any previous errors
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';

    // Check if user already exists
    if (users.find(u => u.email === email)) {
        errorDiv.textContent = 'An account with this email already exists';
        errorDiv.classList.remove('hidden');
        return;
    }

    // Create new user
    const newUser = {
        id: 'user_' + Date.now(),
        name: name,
        email: email,
        password: password,
        role: 'user',
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('debtway_users', JSON.stringify(users));

    showWelcomeMessage('Account created successfully!');
    setTimeout(() => showLogin(), 1500);
}

function showWelcomeMessage(message) {
    // Create and show welcome overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        color: white;
        font-size: 24px;
        font-weight: 600;
    `;
    overlay.textContent = message;
    document.body.appendChild(overlay);

    setTimeout(() => {
        if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
    }, 1500);
}

// Dashboard Updates
function updateUserDashboard() {
    if (!currentUser) return;

    // Update greeting in dashboard header
    const dashboardHeader = document.querySelector('#user-dashboard .dashboard-header h1');
    if (dashboardHeader) {
        dashboardHeader.textContent = `Welcome, ${currentUser.name}`;
    }
    
    const greetingElement = document.getElementById('user-greeting');
    if (greetingElement) {
        greetingElement.textContent = `Welcome back, ${currentUser.name}!`;
    }
    
    // Update profile settings
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    if (profileName) profileName.value = currentUser.name || '';
    if (profileEmail) profileEmail.value = currentUser.email || '';

    // Get user's debts
    const userDebts = debts.filter(d => d.userId === currentUser.id);
    const userPayments = payments.filter(p => p.userId === currentUser.id);

    // Update metrics
    updateUserMetrics(userDebts, userPayments);
    updateDebtsList(userDebts);
    updateUpcomingPayments(userDebts);
}

function updateUserMetrics(userDebts, userPayments) {
    const totalDebts = userDebts.length;
    const totalOutstanding = userDebts.reduce((sum, debt) => sum + debt.amount, 0);
    const monthlyEMI = userDebts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
    const paymentsThisMonth = userPayments.filter(p => 
        new Date(p.date).getMonth() === new Date().getMonth()
    ).length;

    const totalDebtsEl = document.getElementById('total-debts');
    const totalOutstandingEl = document.getElementById('total-outstanding');
    const monthlyEmiEl = document.getElementById('monthly-emi');
    const paymentsMadeEl = document.getElementById('payments-made');

    if (totalDebtsEl) totalDebtsEl.textContent = totalDebts;
    if (totalOutstandingEl) totalOutstandingEl.textContent = `$${totalOutstanding.toLocaleString()}`;
    if (monthlyEmiEl) monthlyEmiEl.textContent = `$${monthlyEMI.toLocaleString()}`;
    if (paymentsMadeEl) paymentsMadeEl.textContent = paymentsThisMonth;
}

function updateDebtsList(userDebts) {
    const debtsListContainer = document.getElementById('debts-list');
    if (!debtsListContainer) return;
    
    if (userDebts.length === 0) {
        debtsListContainer.innerHTML = `
            <div class="empty-state">
                <h3>No debts added yet</h3>
                <p>Start by adding your first debt to track your progress</p>
                <button class="btn btn--primary" onclick="showAddDebtModal()">Add Your First Debt</button>
            </div>
        `;
        return;
    }

    debtsListContainer.innerHTML = userDebts.map(debt => `
        <div class="debt-item">
            <div class="debt-info">
                <h4>${debt.name}</h4>
                <p>${debt.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} • ${debt.interestRate}% APR</p>
            </div>
            <div class="debt-amount">
                <div class="amount">$${debt.amount.toLocaleString()}</div>
                <div class="payment">$${debt.monthlyPayment}/month</div>
            </div>
        </div>
    `).join('');
}

function updateUpcomingPayments(userDebts) {
    const paymentsContainer = document.getElementById('upcoming-payments-list');
    if (!paymentsContainer) return;
    
    if (userDebts.length === 0) {
        paymentsContainer.innerHTML = `
            <div class="empty-state">
                <p>No upcoming payments. Add your debts to track payment schedules.</p>
            </div>
        `;
        return;
    }

    // Generate upcoming payments from debts
    const upcomingPayments = userDebts.map(debt => {
        const nextPaymentDate = new Date();
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        nextPaymentDate.setDate(1);
        
        return {
            name: debt.name,
            amount: debt.monthlyPayment,
            date: nextPaymentDate.toLocaleDateString()
        };
    });

    paymentsContainer.innerHTML = upcomingPayments.map(payment => `
        <div class="payment-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--color-surface); border: 1px solid var(--color-card-border); border-radius: 8px; margin-bottom: 8px;">
            <div>
                <h4 style="margin: 0 0 4px 0;">${payment.name}</h4>
                <p style="margin: 0; color: var(--color-text-secondary); font-size: 14px;">Due: ${payment.date}</p>
            </div>
            <div style="font-size: 18px; font-weight: 600;">$${payment.amount}</div>
        </div>
    `).join('');
}

function updateAdminDashboard() {
    // Update admin metrics with real data
    const totalUsers = users.length;
    const allUserDebts = debts.filter(d => d.userId !== 'admin');
    const totalPortfolio = allUserDebts.reduce((sum, debt) => sum + debt.amount, 0);
    const activeDebts = allUserDebts.length;

    const totalUsersEl = document.getElementById('admin-total-users');
    const portfolioEl = document.getElementById('admin-portfolio');
    const debtsEl = document.getElementById('admin-debts');

    if (totalUsersEl) totalUsersEl.textContent = totalUsers;
    if (portfolioEl) portfolioEl.textContent = `$${totalPortfolio.toLocaleString()}`;
    if (debtsEl) debtsEl.textContent = activeDebts;

    // Update users table
    updateUsersTable();
}

function updateUsersTable() {
    const usersTableContainer = document.getElementById('users-table');
    if (!usersTableContainer) return;
    
    if (users.length === 0) {
        usersTableContainer.innerHTML = `
            <div class="empty-state">
                <p id="users-empty-message">No users registered yet.</p>
            </div>
        `;
        return;
    }

    const usersTableContent = `
        <div class="users-table-content">
            ${users.map(user => {
                const userDebtCount = debts.filter(d => d.userId === user.id).length;
                const joinDate = new Date(user.createdAt).toLocaleDateString();
                
                return `
                    <div class="user-row">
                        <div class="user-info">
                            <h4>${user.name}</h4>
                            <p>${user.email}</p>
                        </div>
                        <div>Joined: ${joinDate}</div>
                        <div>${userDebtCount} debts</div>
                        <div class="status status--success">Active</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    usersTableContainer.innerHTML = usersTableContent;
}

// Charts
function initializeUserCharts() {
    initializePaymentTimelineChart();
    initializeDebtDistributionChart();
}

function initializeAdminCharts() {
    initializeUserGrowthChart();
    initializeAdminPortfolioChart();
}

function initializePaymentTimelineChart() {
    const ctx = document.getElementById('payment-timeline-chart');
    if (!ctx) return;

    // Destroy existing chart
    if (paymentTimelineChart) {
        paymentTimelineChart.destroy();
    }

    const userDebts = debts.filter(d => d.userId === currentUser?.id);
    
    // Generate timeline data starting from 0
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const paymentData = userDebts.length > 0 
        ? months.map((_, i) => userDebts.reduce((sum, debt) => sum + debt.monthlyPayment, 0) * (i + 1))
        : [0, 0, 0, 0, 0, 0];

    paymentTimelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Cumulative Payments',
                data: paymentData,
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function initializeDebtDistributionChart() {
    const ctx = document.getElementById('debt-distribution-chart');
    const emptyState = document.getElementById('debt-empty-state');
    if (!ctx || !emptyState) return;

    // Destroy existing chart
    if (debtDistributionChart) {
        debtDistributionChart.destroy();
    }

    const userDebts = debts.filter(d => d.userId === currentUser?.id);
    
    if (userDebts.length === 0) {
        ctx.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    ctx.style.display = 'block';
    emptyState.style.display = 'none';

    // Group debts by type
    const debtTypes = {};
    userDebts.forEach(debt => {
        const type = debt.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        debtTypes[type] = (debtTypes[type] || 0) + debt.amount;
    });

    const labels = Object.keys(debtTypes);
    const data = Object.values(debtTypes);
    const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'];

    debtDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function initializeUserGrowthChart() {
    const ctx = document.getElementById('user-growth-chart');
    if (!ctx) return;

    // Destroy existing chart
    if (userGrowthChart) {
        userGrowthChart.destroy();
    }

    // Generate user growth data based on actual registrations
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonth = new Date().getMonth();
    const growthData = months.map((_, i) => {
        if (i <= currentMonth) {
            return users.filter(user => new Date(user.createdAt).getMonth() <= i).length;
        }
        return 0;
    });

    userGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Total Users',
                data: growthData,
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function initializeAdminPortfolioChart() {
    const ctx = document.getElementById('admin-portfolio-chart');
    if (!ctx) return;

    // Destroy existing chart
    if (adminPortfolioChart) {
        adminPortfolioChart.destroy();
    }

    const allUserDebts = debts.filter(d => d.userId !== 'admin');
    
    if (allUserDebts.length === 0) {
        // Show empty state
        ctx.parentElement.innerHTML = `
            <h3>Portfolio Distribution</h3>
            <div class="empty-state">
                <p>No debt data available yet. Portfolio will update as users add debts.</p>
            </div>
        `;
        return;
    }

    // Group all debts by type
    const debtTypes = {};
    allUserDebts.forEach(debt => {
        const type = debt.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        debtTypes[type] = (debtTypes[type] || 0) + debt.amount;
    });

    const labels = Object.keys(debtTypes);
    const data = Object.values(debtTypes);
    const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'];

    adminPortfolioChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Navigation within dashboard
function handleNavigation(e) {
    e.preventDefault();
    const sectionId = e.currentTarget.dataset.section;
    if (sectionId) {
        showSection(sectionId);
    }
}

function handleAddDebt(e) {
    e.preventDefault();
    
    if (!currentUser) return;

    const newDebt = {
        id: 'debt_' + Date.now(),
        userId: currentUser.id,
        name: document.getElementById('debt-name').value,
        amount: parseFloat(document.getElementById('debt-amount').value),
        interestRate: parseFloat(document.getElementById('debt-interest').value),
        monthlyPayment: parseFloat(document.getElementById('debt-payment').value),
        type: document.getElementById('debt-type').value,
        createdAt: new Date().toISOString()
    };

    debts.push(newDebt);
    localStorage.setItem('debtway_debts', JSON.stringify(debts));

    hideAddDebtModal();
    updateUserDashboard();
    
    // Refresh charts
    setTimeout(() => {
        initializePaymentTimelineChart();
        initializeDebtDistributionChart();
    }, 100);
    
    // Show success message
    showWelcomeMessage('Debt added successfully!');
}

// Ensure debt distribution shows empty state initially
setTimeout(() => {
    const emptyState = document.getElementById('debt-empty-state');
    const chart = document.getElementById('debt-distribution-chart');
    if (emptyState && chart && (!currentUser || debts.filter(d => d.userId === currentUser.id).length === 0)) {
        chart.style.display = 'none';
        emptyState.style.display = 'block';
    }
}, 200);