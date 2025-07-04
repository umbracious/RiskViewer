import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface WorkflowTask {
  id: number;
  title: string;
  description: string;
  assignee: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  category: 'RISK_ANALYSIS' | 'STRUCTURED_PRODUCT' | 'COMPLIANCE' | 'REPORTING';
  dueDate: string;
  createdAt: string;
  comments: WorkflowComment[];
  attachments: string[];
  tags: string[];
}

interface WorkflowComment {
  id: number;
  author: string;
  message: string;
  timestamp: string;
  type: 'COMMENT' | 'STATUS_CHANGE' | 'APPROVAL' | 'REJECTION';
}

@Component({
  selector: 'app-workflow-collaboration',
  template: `
    <div class="workflow-container">
      <div class="header">
        <h2>🔄 Risk Management Workflow</h2>
        <div class="header-actions">
          <button class="btn-primary" (click)="showCreateTask = !showCreateTask">
            {{ showCreateTask ? 'Cancel' : 'Create Task' }}
          </button>
          <div class="filter-controls">
            <select [(ngModel)]="selectedFilter" (ngModelChange)="applyFilter()" name="filter">
              <option value="all">All Tasks</option>
              <option value="my-tasks">My Tasks</option>
              <option value="pending">Pending Review</option>
              <option value="high-priority">High Priority</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Create Task Form -->
      <div *ngIf="showCreateTask" class="create-task-section">
        <h3>Create New Workflow Task</h3>
        <form (ngSubmit)="createTask()" class="task-form">
          <div class="form-row">
            <div class="form-group">
              <label for="title">Task Title</label>
              <input
                id="title"
                type="text"
                [(ngModel)]="newTask.title"
                name="title"
                required
                placeholder="e.g., Review SPX Barrier Note Risk Metrics"
              />
            </div>
            <div class="form-group">
              <label for="category">Category</label>
              <select id="category" [(ngModel)]="newTask.category" name="category" required>
                <option value="RISK_ANALYSIS">Risk Analysis</option>
                <option value="STRUCTURED_PRODUCT">Structured Product</option>
                <option value="COMPLIANCE">Compliance Review</option>
                <option value="REPORTING">Reporting</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="assignee">Assignee</label>
              <select id="assignee" [(ngModel)]="newTask.assignee" name="assignee" required>
                <option value="John Smith">John Smith (Senior Risk Analyst)</option>
                <option value="Sarah Johnson">Sarah Johnson (Structured Products)</option>
                <option value="Mike Chen">Mike Chen (Quantitative Analyst)</option>
                <option value="Lisa Brown">Lisa Brown (Compliance Officer)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="priority">Priority</label>
              <select id="priority" [(ngModel)]="newTask.priority" name="priority" required>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              [(ngModel)]="newTask.description"
              name="description"
              required
              rows="3"
              placeholder="Detailed description of the task requirements..."
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="dueDate">Due Date</label>
              <input
                id="dueDate"
                type="date"
                [(ngModel)]="newTask.dueDate"
                name="dueDate"
                required
              />
            </div>
            <div class="form-group">
              <label for="tags">Tags (comma-separated)</label>
              <input
                id="tags"
                type="text"
                [(ngModel)]="tagsInput"
                name="tags"
                placeholder="e.g., VaR, Monte Carlo, Black-Scholes"
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="isCreating">
              {{ isCreating ? 'Creating...' : 'Create Task' }}
            </button>
            <button type="button" class="btn-secondary" (click)="resetTaskForm()">
              Reset
            </button>
          </div>
        </form>
      </div>

      <!-- Tasks Dashboard -->
      <div class="tasks-dashboard">
        <!-- Summary Cards -->
        <div class="summary-section">
          <div class="summary-card total">
            <div class="summary-number">{{ getTaskCount('all') }}</div>
            <div class="summary-label">Total Tasks</div>
          </div>
          <div class="summary-card pending">
            <div class="summary-number">{{ getTaskCount('pending') }}</div>
            <div class="summary-label">Pending Review</div>
          </div>
          <div class="summary-card progress">
            <div class="summary-number">{{ getTaskCount('in-progress') }}</div>
            <div class="summary-label">In Progress</div>
          </div>
          <div class="summary-card critical">
            <div class="summary-number">{{ getTaskCount('critical') }}</div>
            <div class="summary-label">Critical Priority</div>
          </div>
        </div>

        <!-- Task Board -->
        <div class="task-board">
          <div class="board-column" *ngFor="let status of taskStatuses">
            <div class="column-header">
              <h4>{{ formatStatus(status) }}</h4>
              <span class="task-count">{{ getTasksByStatus(status).length }}</span>
            </div>
            <div class="task-list">
              <div 
                *ngFor="let task of getTasksByStatus(status); trackBy: trackTask" 
                class="task-card"
                [class]="'priority-' + task.priority.toLowerCase()"
                (click)="selectTask(task)"
              >
                <div class="task-header">
                  <h5>{{ task.title }}</h5>
                  <span class="priority-badge" [class]="'priority-' + task.priority.toLowerCase()">
                    {{ task.priority }}
                  </span>
                </div>
                <p class="task-description">{{ task.description }}</p>
                <div class="task-meta">
                  <span class="assignee">👤 {{ task.assignee }}</span>
                  <span class="due-date" [class.overdue]="isOverdue(task.dueDate)">
                    📅 {{ formatDate(task.dueDate) }}
                  </span>
                </div>
                <div class="task-tags">
                  <span *ngFor="let tag of task.tags" class="tag">{{ tag }}</span>
                </div>
                <div class="task-actions">
                  <button class="btn-small" (click)="updateTaskStatus(task, $event)">
                    Update Status
                  </button>
                  <button class="btn-small secondary" (click)="addComment(task, $event)">
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Task Detail Modal -->
      <div *ngIf="selectedTask" class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ selectedTask.title }}</h3>
            <button class="modal-close" (click)="closeModal()">×</button>
          </div>
          
          <div class="modal-body">
            <div class="task-details">
              <div class="detail-section">
                <h4>Task Information</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Category:</span>
                    <span class="detail-value">{{ formatCategory(selectedTask.category) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Assignee:</span>
                    <span class="detail-value">{{ selectedTask.assignee }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Priority:</span>
                    <span class="detail-value priority-badge" [class]="'priority-' + selectedTask.priority.toLowerCase()">
                      {{ selectedTask.priority }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">{{ formatStatus(selectedTask.status) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Due Date:</span>
                    <span class="detail-value" [class.overdue]="isOverdue(selectedTask.dueDate)">
                      {{ formatDate(selectedTask.dueDate) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">{{ formatDateTime(selectedTask.createdAt) }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h4>Description</h4>
                <p class="task-description-full">{{ selectedTask.description }}</p>
              </div>

              <div class="detail-section" *ngIf="selectedTask.tags.length > 0">
                <h4>Tags</h4>
                <div class="tags-container">
                  <span *ngFor="let tag of selectedTask.tags" class="tag">{{ tag }}</span>
                </div>
              </div>
            </div>

            <!-- Comments Section -->
            <div class="comments-section">
              <h4>Activity & Comments</h4>
              
              <!-- Add Comment Form -->
              <div class="add-comment">
                <textarea
                  [(ngModel)]="newComment"
                  placeholder="Add a comment or update..."
                  rows="3"
                ></textarea>
                <div class="comment-actions">
                  <button class="btn-primary" (click)="submitComment()">
                    Add Comment
                  </button>
                  <select [(ngModel)]="commentType" name="commentType">
                    <option value="COMMENT">Comment</option>
                    <option value="STATUS_CHANGE">Status Change</option>
                    <option value="APPROVAL">Approval</option>
                    <option value="REJECTION">Rejection</option>
                  </select>
                </div>
              </div>

              <!-- Comments List -->
              <div class="comments-list">
                <div 
                  *ngFor="let comment of selectedTask.comments; trackBy: trackComment" 
                  class="comment"
                  [class]="'comment-' + comment.type.toLowerCase()"
                >
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.author }}</span>
                    <span class="comment-time">{{ formatDateTime(comment.timestamp) }}</span>
                    <span class="comment-type">{{ formatCommentType(comment.type) }}</span>
                  </div>
                  <div class="comment-message">{{ comment.message }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workflow-container {
      background: #f8f9fa;
      min-height: 100vh;
      padding: 1rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 1.5rem 2rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .header h2 {
      margin: 0;
      color: #495057;
      font-weight: 700;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .filter-controls select {
      padding: 0.5rem 1rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      background: white;
    }

    .btn-primary {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-small {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.75rem;
      transition: background 0.2s;
    }

    .btn-small.secondary {
      background: #6c757d;
    }

    .create-task-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .task-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #495057;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 1rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .summary-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .summary-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid #007bff;
    }

    .summary-card.pending { border-left-color: #ffc107; }
    .summary-card.progress { border-left-color: #17a2b8; }
    .summary-card.critical { border-left-color: #dc3545; }

    .summary-number {
      font-size: 2rem;
      font-weight: 700;
      color: #495057;
    }

    .summary-label {
      font-size: 0.875rem;
      color: #6c757d;
      margin-top: 0.5rem;
    }

    .task-board {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .board-column {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .column-header {
      background: #f8f9fa;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e9ecef;
    }

    .column-header h4 {
      margin: 0;
      color: #495057;
    }

    .task-count {
      background: #007bff;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .task-list {
      padding: 1rem;
      max-height: 600px;
      overflow-y: auto;
    }

    .task-card {
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      background: white;
    }

    .task-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .task-card.priority-critical {
      border-left: 4px solid #dc3545;
    }

    .task-card.priority-high {
      border-left: 4px solid #fd7e14;
    }

    .task-card.priority-medium {
      border-left: 4px solid #ffc107;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .task-header h5 {
      margin: 0;
      color: #495057;
      font-size: 1rem;
    }

    .priority-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .priority-badge.priority-critical {
      background: #f8d7da;
      color: #721c24;
    }

    .priority-badge.priority-high {
      background: #ffeaa7;
      color: #856404;
    }

    .priority-badge.priority-medium {
      background: #fff3cd;
      color: #856404;
    }

    .priority-badge.priority-low {
      background: #d4edda;
      color: #155724;
    }

    .task-description {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 1rem;
      line-height: 1.4;
    }

    .task-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #6c757d;
      margin-bottom: 0.75rem;
    }

    .overdue {
      color: #dc3545 !important;
      font-weight: 600;
    }

    .task-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-bottom: 0.75rem;
    }

    .tag {
      background: #e9ecef;
      color: #495057;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.625rem;
      font-weight: 500;
    }

    .task-actions {
      display: flex;
      gap: 0.5rem;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      width: 90%;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e9ecef;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6c757d;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .detail-section {
      margin-bottom: 2rem;
    }

    .detail-section h4 {
      margin: 0 0 1rem 0;
      color: #495057;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f8f9fa;
    }

    .detail-label {
      font-weight: 500;
      color: #6c757d;
    }

    .detail-value {
      color: #495057;
    }

    .comments-section {
      border-top: 1px solid #e9ecef;
      padding-top: 1.5rem;
    }

    .add-comment {
      margin-bottom: 1.5rem;
    }

    .add-comment textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      resize: vertical;
      margin-bottom: 0.5rem;
    }

    .comment-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .comment-actions select {
      padding: 0.5rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
    }

    .comments-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .comment {
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      background: #f8f9fa;
    }

    .comment.comment-approval {
      border-left: 4px solid #28a745;
    }

    .comment.comment-rejection {
      border-left: 4px solid #dc3545;
    }

    .comment.comment-status_change {
      border-left: 4px solid #17a2b8;
    }

    .comment-header {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .comment-author {
      font-weight: 600;
      color: #495057;
    }

    .comment-time {
      color: #6c757d;
    }

    .comment-type {
      background: #007bff;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .comment-message {
      color: #495057;
      line-height: 1.4;
    }
  `],
  imports: [CommonModule, FormsModule]
})
export class WorkflowCollaborationComponent implements OnInit {
  tasks: WorkflowTask[] = [];
  filteredTasks: WorkflowTask[] = [];
  selectedTask: WorkflowTask | null = null;
  selectedFilter = 'all';
  showCreateTask = false;
  isCreating = false;
  
  taskStatuses: WorkflowTask['status'][] = ['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];
  
  newTask = {
    title: '',
    description: '',
    assignee: 'John Smith',
    priority: 'MEDIUM' as WorkflowTask['priority'],
    category: 'RISK_ANALYSIS' as WorkflowTask['category'],
    dueDate: '',
    tags: [] as string[]
  };
  
  tagsInput = '';
  newComment = '';
  commentType: WorkflowComment['type'] = 'COMMENT';

  ngOnInit() {
    this.loadMockData();
    this.applyFilter();
  }

  loadMockData() {
    // Mock data for demonstration
    this.tasks = [
      {
        id: 1,
        title: 'Review SPX Barrier Note Risk Metrics',
        description: 'Conduct comprehensive risk analysis for the new SPX Barrier Note product including VaR calculations, stress testing, and regulatory compliance review.',
        assignee: 'John Smith',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        category: 'STRUCTURED_PRODUCT',
        dueDate: '2025-07-10',
        createdAt: '2025-07-01T09:00:00Z',
        comments: [
          {
            id: 1,
            author: 'Sarah Johnson',
            message: 'Initial risk framework has been established. Proceeding with Monte Carlo simulations.',
            timestamp: '2025-07-02T10:30:00Z',
            type: 'COMMENT'
          }
        ],
        attachments: ['risk_metrics_report.pdf'],
        tags: ['VaR', 'Monte Carlo', 'Barrier Note']
      },
      {
        id: 2,
        title: 'Compliance Review - Q3 Risk Report',
        description: 'Review quarterly risk reporting for regulatory compliance and ensure all metrics meet internal risk limits.',
        assignee: 'Lisa Brown',
        priority: 'CRITICAL',
        status: 'PENDING',
        category: 'COMPLIANCE',
        dueDate: '2025-07-05',
        createdAt: '2025-06-28T14:00:00Z',
        comments: [],
        attachments: [],
        tags: ['Compliance', 'Q3', 'Regulatory']
      },
      {
        id: 3,
        title: 'Implement Black-Scholes Greeks Calculator',
        description: 'Develop and integrate advanced Greeks calculation engine for structured products pricing.',
        assignee: 'Mike Chen',
        priority: 'MEDIUM',
        status: 'REVIEW',
        category: 'RISK_ANALYSIS',
        dueDate: '2025-07-15',
        createdAt: '2025-06-25T11:00:00Z',
        comments: [
          {
            id: 2,
            author: 'Mike Chen',
            message: 'Implementation completed. Ready for peer review.',
            timestamp: '2025-07-03T16:45:00Z',
            type: 'STATUS_CHANGE'
          }
        ],
        attachments: ['greeks_calculator.py'],
        tags: ['Black-Scholes', 'Greeks', 'Pricing']
      }
    ];
  }

  createTask() {
    if (!this.validateTaskForm()) return;
    
    this.isCreating = true;
    
    const newTaskData: WorkflowTask = {
      id: this.tasks.length + 1,
      title: this.newTask.title,
      description: this.newTask.description,
      assignee: this.newTask.assignee,
      priority: this.newTask.priority,
      status: 'PENDING',
      category: this.newTask.category,
      dueDate: this.newTask.dueDate,
      createdAt: new Date().toISOString(),
      comments: [],
      attachments: [],
      tags: this.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    // Simulate API call
    setTimeout(() => {
      this.tasks.unshift(newTaskData);
      this.applyFilter();
      this.resetTaskForm();
      this.showCreateTask = false;
      this.isCreating = false;
    }, 1000);
  }

  validateTaskForm(): boolean {
    return !!(
      this.newTask.title &&
      this.newTask.description &&
      this.newTask.assignee &&
      this.newTask.dueDate
    );
  }

  resetTaskForm() {
    this.newTask = {
      title: '',
      description: '',
      assignee: 'John Smith',
      priority: 'MEDIUM',
      category: 'RISK_ANALYSIS',
      dueDate: '',
      tags: []
    };
    this.tagsInput = '';
  }

  applyFilter() {
    switch (this.selectedFilter) {
      case 'my-tasks':
        this.filteredTasks = this.tasks.filter(task => task.assignee === 'John Smith');
        break;
      case 'pending':
        this.filteredTasks = this.tasks.filter(task => task.status === 'PENDING' || task.status === 'REVIEW');
        break;
      case 'high-priority':
        this.filteredTasks = this.tasks.filter(task => task.priority === 'HIGH' || task.priority === 'CRITICAL');
        break;
      default:
        this.filteredTasks = [...this.tasks];
    }
  }

  getTaskCount(filter: string): number {
    switch (filter) {
      case 'all': return this.tasks.length;
      case 'pending': return this.tasks.filter(t => t.status === 'PENDING' || t.status === 'REVIEW').length;
      case 'in-progress': return this.tasks.filter(t => t.status === 'IN_PROGRESS').length;
      case 'critical': return this.tasks.filter(t => t.priority === 'CRITICAL').length;
      default: return 0;
    }
  }

  getTasksByStatus(status: WorkflowTask['status']): WorkflowTask[] {
    return this.filteredTasks.filter(task => task.status === status);
  }

  selectTask(task: WorkflowTask) {
    this.selectedTask = task;
  }

  closeModal() {
    this.selectedTask = null;
  }

  updateTaskStatus(task: WorkflowTask, event: Event) {
    event.stopPropagation();
    // Implementation for status update
    console.log('Updating status for task:', task.title);
  }

  addComment(task: WorkflowTask, event: Event) {
    event.stopPropagation();
    this.selectTask(task);
  }

  submitComment() {
    if (!this.newComment.trim() || !this.selectedTask) return;
    
    const comment: WorkflowComment = {
      id: Date.now(),
      author: 'Current User',
      message: this.newComment,
      timestamp: new Date().toISOString(),
      type: this.commentType
    };
    
    this.selectedTask.comments.push(comment);
    this.newComment = '';
    this.commentType = 'COMMENT';
  }

  trackTask(index: number, task: WorkflowTask): number {
    return task.id;
  }

  trackComment(index: number, comment: WorkflowComment): number {
    return comment.id;
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  formatCategory(category: string): string {
    return category.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  formatCommentType(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }
}
