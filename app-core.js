/**
 * FlowTask Pro - Core Framework
 * Enterprise Task Management System
 */

class FlowTaskPro {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentView = 'dashboard';
        this.currentFilter = 'all';
        this.currentSort = 'newest';
        this.theme = this.loadTheme();
        
        this.init();
    }

    init() {
        this.bindCoreEvents();
        this.applyTheme(this.theme);
        this.showView(this.currentView);
        this.renderDashboard();
        this.renderTasks();
    }

    // ===== THEME MANAGEMENT =====
    loadTheme() {
        return localStorage.getItem('flowtask-theme') || 'light';
    }

    saveTheme(theme) {
        localStorage.setItem('flowtask-theme', theme);
    }

    applyTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        this.saveTheme(theme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    // ===== DATA MANAGEMENT =====
    loadTasks() {
        try {
            const stored = localStorage.getItem('flowtask-pro-tasks');
            if (stored) {
                return JSON.parse(stored);
            } else {
                return [
                    {
                        id: '1',
                        text: 'Welcome to FlowTask Pro!',
                        completed: false,
                        priority: 'high',
                        dueDate: null,
                        createdAt: new Date().toISOString(),
                        project: 'Inbox'
                    },
                    {
                        id: '2',
                        text: 'Create project presentation',
                        completed: false,
                        priority: 'medium',
                        dueDate: this.getTomorrowDate(),
                        createdAt: new Date().toISOString(),
                        project: 'Work'
                    }
                ];
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showNotification('Error loading tasks', 'error');
            return [];
        }
    }

    saveTasks() {
        try {
            localStorage.setItem('flowtask-pro-tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
            this.showNotification('Error saving tasks', 'error');
        }
    }

    // ===== TASK CRUD OPERATIONS =====
    addTask(text, priority = 'medium', dueDate = null, project = 'Inbox') {
        if (!this.validateTask(text)) return false;

        const newTask = {
            id: Date.now().toString(),
            text: text.trim(),
            completed: false,
            priority: priority,
            dueDate: dueDate,
            project: project,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(newTask);
        this.saveTasks();
        
        if (this.currentView === 'dashboard') {
            this.renderDashboard();
        } else {
            this.renderTasks();
        }
        
        this.updateNavigationBadges();
        this.showNotification('Task added successfully!', 'success');
        return true;
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            
            if (this.currentView === 'dashboard') {
                this.renderDashboard();
            } else {
                this.renderTasks();
            }
            
            this.updateNavigationBadges();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        
        if (this.currentView === 'dashboard') {
            this.renderDashboard();
        } else {
            this.renderTasks();
        }
        
        this.updateNavigationBadges();
        this.showNotification('Task deleted', 'info');
    }

    validateTask(text) {
        const trimmed = text.trim();
        if (!trimmed) {
            this.showNotification('Task cannot be empty', 'error');
            return false;
        }
        return true;
    }

    // ===== UTILITY FUNCTIONS =====
    updateNavigationBadges() {
        const totalTasks = this.tasks.length;
        const badge = document.getElementById('taskCountBadge');
        if (badge) {
            badge.textContent = totalTasks;
        }
    }

    getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ===== CORE EVENT HANDLING =====
    bindCoreEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.showView(view);
            });
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Task input
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.handleAddTask();
        });

        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddTask();
            }
        });
    }

    handleAddTask() {
        const input = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        const dueDateInput = document.getElementById('dueDateInput');
        
        const text = input.value;
        const priority = prioritySelect.value;
        const dueDate = dueDateInput.value || null;

        if (this.addTask(text, priority, dueDate)) {
            input.value = '';
            dueDateInput.value = '';
            input.focus();
        }
    }

    // ===== NOTIFICATION SYSTEM =====
    showNotification(message, type = 'info') {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 12px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#4cc9f0',
            error: '#f72585',
            info: '#4361ee'
        };
        return colors[type] || '#4361ee';
    }
}
