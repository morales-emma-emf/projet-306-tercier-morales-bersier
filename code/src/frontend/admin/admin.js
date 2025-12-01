// Admin Dashboard JavaScript

const API_BASE = '/api';

// DOM Elements
const usersTableBody = document.querySelector('#usersTable tbody');
const attendanceTableBody = document.querySelector('#attendanceTable tbody');
const userModal = document.getElementById('userModal');
const deleteModal = document.getElementById('deleteModal');
const userForm = document.getElementById('userForm');
const userFilter = document.getElementById('userFilter');
const addUserBtn = document.getElementById('addUserBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const toast = document.getElementById('toast');

let currentDeleteUserId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    loadAttendance();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Add user button
    addUserBtn.addEventListener('click', () => openModal());

    // User form submission
    userForm.addEventListener('submit', handleUserSubmit);

    // User filter for attendance
    userFilter.addEventListener('change', () => loadAttendance(userFilter.value));

    // Confirm delete
    confirmDeleteBtn.addEventListener('click', confirmDelete);
}

// Tab Switching
function switchTab(tabId) {
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');

    if (tabId === 'attendance') {
        loadAttendance();
    }
}

// Load Users
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/users`);
        const users = await response.json();
        renderUsersTable(users);
        updateUserFilter(users);
    } catch (error) {
        showToast('Erreur lors du chargement des utilisateurs', 'error');
        console.error('Error loading users:', error);
    }
}

// Render Users Table
function renderUsersTable(users) {
    usersTableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="pin-display">${escapeHtml(user.pin)}</span></td>
            <td>
                <span class="status-badge ${user.active ? 'status-active' : 'status-inactive'}">
                    ${user.active ? 'Actif' : 'Inactif'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-secondary btn-small" onclick="editUser(${user.id})">
                        ✏️ Modifier
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deleteUser(${user.id})">
                        🗑️ Supprimer
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update User Filter Dropdown
function updateUserFilter(users) {
    const options = users.map(user => 
        `<option value="${user.id}">${escapeHtml(user.name)}</option>`
    ).join('');
    userFilter.innerHTML = '<option value="">Tous les utilisateurs</option>' + options;
}

// Load Attendance Records
async function loadAttendance(userId = '') {
    try {
        const url = userId 
            ? `${API_BASE}/attendance?userId=${userId}` 
            : `${API_BASE}/attendance`;
        const response = await fetch(url);
        const records = await response.json();
        renderAttendanceTable(records);
    } catch (error) {
        showToast('Erreur lors du chargement des présences', 'error');
        console.error('Error loading attendance:', error);
    }
}

// Render Attendance Table
function renderAttendanceTable(records) {
    // Sort by most recent first
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    attendanceTableBody.innerHTML = records.map(record => `
        <tr>
            <td>${record.id}</td>
            <td>${escapeHtml(record.userName)}</td>
            <td>
                <span class="status-badge ${record.type === 'arrival' ? 'type-arrival' : 'type-departure'}">
                    ${record.type === 'arrival' ? '📥 Arrivée' : '📤 Départ'}
                </span>
            </td>
            <td>${formatDateTime(record.timestamp)}</td>
        </tr>
    `).join('');
}

// Modal Functions
function openModal(user = null) {
    const modalTitle = document.getElementById('modalTitle');
    const userIdInput = document.getElementById('userId');
    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');
    const userPinInput = document.getElementById('userPin');
    const userActiveInput = document.getElementById('userActive');

    if (user) {
        modalTitle.textContent = 'Modifier l\'utilisateur';
        userIdInput.value = user.id;
        userNameInput.value = user.name;
        userEmailInput.value = user.email;
        userPinInput.value = user.pin;
        userActiveInput.value = user.active.toString();
    } else {
        modalTitle.textContent = 'Ajouter un utilisateur';
        userForm.reset();
        userIdInput.value = '';
        userActiveInput.value = 'true';
    }

    userModal.classList.add('active');
}

function closeModal() {
    userModal.classList.remove('active');
    userForm.reset();
}

function openDeleteModal(userId) {
    currentDeleteUserId = userId;
    deleteModal.classList.add('active');
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    currentDeleteUserId = null;
}

// Edit User
async function editUser(userId) {
    try {
        const response = await fetch(`${API_BASE}/users/${userId}`);
        if (!response.ok) {
            throw new Error('User not found');
        }
        const user = await response.json();
        openModal(user);
    } catch (error) {
        showToast('Erreur lors du chargement de l\'utilisateur', 'error');
        console.error('Error loading user:', error);
    }
}

// Delete User
function deleteUser(userId) {
    openDeleteModal(userId);
}

async function confirmDelete() {
    if (!currentDeleteUserId) return;

    try {
        const response = await fetch(`${API_BASE}/users/${currentDeleteUserId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Utilisateur supprimé avec succès', 'success');
            loadUsers();
        } else {
            throw new Error('Delete failed');
        }
    } catch (error) {
        showToast('Erreur lors de la suppression', 'error');
        console.error('Error deleting user:', error);
    }

    closeDeleteModal();
}

// Handle User Form Submit
async function handleUserSubmit(e) {
    e.preventDefault();

    const userId = document.getElementById('userId').value;
    const userData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        pin: document.getElementById('userPin').value,
        active: document.getElementById('userActive').value === 'true'
    };

    try {
        const url = userId 
            ? `${API_BASE}/users/${userId}` 
            : `${API_BASE}/users`;
        const method = userId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            showToast(
                userId ? 'Utilisateur modifié avec succès' : 'Utilisateur ajouté avec succès', 
                'success'
            );
            closeModal();
            loadUsers();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Operation failed');
        }
    } catch (error) {
        showToast(error.message || 'Erreur lors de l\'opération', 'error');
        console.error('Error saving user:', error);
    }
}

// Utility Functions
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Close modals on outside click
window.addEventListener('click', (e) => {
    if (e.target === userModal) {
        closeModal();
    }
    if (e.target === deleteModal) {
        closeDeleteModal();
    }
});

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
    }
});
