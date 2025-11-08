/**
 * FlowTask Pro - UI Views & Components
 */

// Extend the class with UI methods
Object.assign(FlowTaskPro.prototype, {
    // ===== VIEW MANAGEMENT =====
    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show selected view
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.add('active');
        }
        
        // Activate corresponding nav item
        const navItem = document.querySelector(`[data-view="${viewName}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
        
        this.updateViewHeader(viewName);
        this.currentView = viewName;
    },

    updateViewHeader(viewName) {
        const titleMap = {
            dashboard: 'Dashboard',
            tasks: 'My Tasks',
            projects: 'Projects',
            calendar: 'Calendar'
        };
        
        const subtitleMap = {
            dashboard: 'Welcome back! Here\'s your productivity overview',
            tasks: 'Manage your tasks and stay organized',
            projects: 'Organize tasks by projects',
            calendar: 'View your schedule and deadlines'
        };
        
        document.getElementById('viewTitle').textContent = titleMap[viewName] || 'FlowTask Pro';
        document.getElementById('viewSubtitle').textContent = subtitleMap[viewName] || '';
    },

    // ===== DASHBOARD RENDERING =====
    renderDashboard() {
        this.updateStats();
        this.renderRecentTasks();
    },

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
        document.getElementById('completionRate').textContent = `${completionRate}%`;
    },

    renderRecentTasks() {
        const container = document.getElementById('recentTasksList');
        if (!container) return;

        const recentTasks = this.tasks.slice(0, 5);
        
        if (recentTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No tasks yet. Add your first task to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentTasks.map(task => `
            <div class="task-mini-item" data-task-id="${task.id}">
                <div class="task-mini-checkbox ${task.completed ? 'checked' : ''}" 
                     onclick="app.toggleTask('${task.id}')">
                    ${task.completed ? '✓' : ''}
                </div>
                <span class="task-mini-text ${task.completed ? 'completed' : ''}">
                    ${this.escapeHtml(task.text)}
                </span>
                ${task.priority === 'high' ? '<span class="priority-dot" style="color: #f72585;">●</span>' : ''}
            </div>
        `).join('');
    },

    // ===== TASKS VIEW RENDERING =====
    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        const sortedTasks = this.sortTasks(filteredTasks);
        this.renderTaskList(sortedTasks);
    },

    getFilteredTasks() {
        let filtered = this.tasks;
        
        switch (this.currentFilter) {
            case 'active':
                filtered = filtered.filter(task => !task.completed);
                break;
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
            case 'high':
                filtered = filtered.filter(task => task.priority === 'high');
                break;
        }
        
        return filtered;
    },

    sortTasks(tasks) {
        switch (this.currentSort) {
            case 'newest':
                return tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'oldest':
                return tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
            default:
                return tasks;
        }
    },

    renderTaskList(tasks) {
        const container = document.getElementById('taskList');
        if (!container) return;

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No tasks found</h3>
                    <p>${this.getEmptyStateMessage()}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tasks.map(task => `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     onclick="app.toggleTask('${task.id}')">
                    ${task.completed ? '✓' : ''}
                </div>
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="priority-badge priority-${task.priority}">
                            ${task.priority.toUpperCase()}
                        </span>
                        ${task.dueDate ? `
                            <span class="due-date">
                                <i class="fas fa-calendar"></i>
                                ${this.formatDate(task.dueDate)}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn delete-btn" onclick="app.deleteTask('${task.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </li>
        `).join('');
    },

    getEmptyStateMessage() {
        const messages = {
            all: 'Create your first task to get started!',
            active: 'No active tasks. Great job!',
            completed: 'No completed tasks yet.',
            high: 'No high priority tasks.'
        };
        return messages[this.currentFilter] || 'No tasks match your criteria.';
    },

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
});
