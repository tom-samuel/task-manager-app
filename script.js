/**
 * FlowTask - Professional Task Management System
 * @author Tom Samuel
 * @version 1.0
 * 
 * Features:
 * - CRUD Operations with localStorage persistence
 * - State Management with Observer Pattern
 * - Advanced Filtering System
 * - Edit-in-place functionality
 * - Error Handling & Data Validation
 * - Accessibility Compliance
 */

class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    // Data Layer - localStorage with error handling
    loadTasks() {
        try {
            const stored = localStorage.getItem('flowtask-tasks');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    saveTasks() {
        try {
            localStorage.setItem('flowtask-tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
            this.showNotification('Error saving tasks', 'error');
        }
    }

    // State Management
    setFilter(filter) {
        this.currentFilter = filter;
        this.updateFilterButtons();
        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            default:
                return this.tasks;
        }
    }

    // CRUD Operations
    addTask(text) {
        if (!this.validateTask(text)) return false;

        const newTask = {
            id: Date.now().toString(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(newTask); // Add to beginning for better UX
        this.saveTasks();
        this.render();
        this.updateStats();
        this.showNotification('Task added successfully!', 'success');
        return true;
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
            this.updateStats();
        }
    }

    editTask(id, newText) {
        if (!this.validateTask(newText)) return false;

        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.text = newText.trim();
            this.saveTasks();
            this.render();
            this.showNotification('Task updated!', 'success');
            return true;
        }
        return false;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.render();
        this.updateStats();
        this.showNotification('Task deleted', 'info');
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        this.render();
        this.updateStats();
        this.showNotification(`Cleared ${completedCount} completed tasks`, 'info');
    }

    // Validation & Utilities
    validateTask(text) {
        const trimmed = text.trim();
        if (!trimmed) {
            this.showNotification('Task cannot be empty', 'error');
            return false;
        }
        if (trimmed.length > 100) {
            this.showNotification('Task must be less than 100 characters', 'error');
            return false;
        }
        return true;
    }

    // UI Updates with Performance Optimization
    render() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.getFilteredTasks();

        // Using DocumentFragment for better performance
        const fragment = document.createDocumentFragment();

        if (filteredTasks.length === 0) {
            const emptyState = this.createEmptyState();
            fragment.appendChild(emptyState);
        } else {
            filteredTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                fragment.appendChild(taskElement);
            });
        }

        // Single DOM update
        taskList.innerHTML = '';
        taskList.appendChild(fragment);
    }

    createEmptyState() {
        const li = document.createElement('li');
        li.className = 'empty-state';
        li.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #6c757d;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📝</div>
                <h3>No tasks found</h3>
                <p>${this.currentFilter === 'completed' ? 'No completed tasks yet!' : 
                     this.currentFilter === 'active' ? 'All tasks are completed!' : 
                     'Add your first task to get started!'}</p>
            </div>
        `;
        return li;
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-task-id', task.id);
        
        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                 role="checkbox" 
                 aria-checked="${task.completed}"
                 tabindex="0">
                ${task.completed ? '✓' : ''}
            </div>
            <span class="task-text" tabindex="0">${this.escapeHtml(task.text)}</span>
            <button class="delete-btn" aria-label="Delete task">×</button>
        `;

        // Event delegation for better performance
        li.querySelector('.task-checkbox').addEventListener('click', () => {
            this.toggleTask(task.id);
        });

        li.querySelector('.task-checkbox').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleTask(task.id);
            }
        });

        li.querySelector('.delete-btn').addEventListener('click', () => {
            this.deleteTask(task.id);
        });

        // Edit-in-place functionality
        const taskText = li.querySelector('.task-text');
        taskText.addEventListener('dblclick', () => {
            this.enableEditMode(task, taskText);
        });

        taskText.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.enableEditMode(task, taskText);
            }
        });

        return li;
    }

    enableEditMode(task, element) {
        const currentText = element.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'edit-input';
        
        element.replaceWith(input);
        input.focus();
        input.select();

        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText && newText !== currentText) {
                this.editTask(task.id, newText);
            } else {
                this.cancelEdit(input, currentText, element);
            }
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            } else if (e.key === 'Escape') {
                this.cancelEdit(input, currentText, element);
            }
        });
    }

    cancelEdit(input, originalText, originalElement) {
        input.replaceWith(originalElement);
    }

    // UI State Management
    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const activeTasks = totalTasks - completedTasks;

        document.getElementById('taskCount').textContent = `${activeTasks} active`;
        document.getElementById('completedCount').textContent = `${completedTasks} completed`;
    }

    updateFilterButtons() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });
    }

    // Event Handling with Proper Delegation
    bindEvents() {
        // Add task
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.handleAddTask();
        });

        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddTask();
            }
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFilter(btn.dataset.filter);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'n':
                        e.preventDefault();
                        document.getElementById('taskInput').focus();
                        break;
                    case 'Delete':
                        e.preventDefault();
                        this.clearCompleted();
                        break;
                }
            }
        });
    }

    handleAddTask() {
        const input = document.getElementById('taskInput');
        const text = input.value;

        if (this.addTask(text)) {
            input.value = '';
            input.focus();
        }
    }

    // Notification System
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f72585' : 
                        type === 'success' ? '#4cc9f0' : '#4361ee'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Security: HTML escaping
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .edit-input {
        width: 100%;
        padding: 8px;
        border: 2px solid #4361ee;
        border-radius: 4px;
        font-size: 1rem;
    }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
    
    // Additional feature: Clear completed button
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear Completed';
    clearBtn.style.cssText = `
        width: 100%;
        margin-top: 20px;
        padding: 12px;
        background: transparent;
        border: 2px solid #f72585;
        color: #f72585;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
    `;
    clearBtn.addEventListener('mouseenter', () => {
        clearBtn.style.background = '#f72585';
        clearBtn.style.color = 'white';
    });
    clearBtn.addEventListener('mouseleave', () => {
        clearBtn.style.background = 'transparent';
        clearBtn.style.color = '#f72585';
    });
    clearBtn.addEventListener('click', () => {
        window.taskManager.clearCompleted();
    });
    
    document.querySelector('.container').appendChild(clearBtn);
    window.taskManager = new TaskManager();
});

console.log('FlowTask Manager initialized - Professional Grade Task Management System');
