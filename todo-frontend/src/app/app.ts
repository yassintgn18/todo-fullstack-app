import { Component, OnInit, signal, ChangeDetectorRef  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';


interface Category {
  id: number;
  name: string;
  color: string;
}

interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority: string;
  dueDateTime: string | null;
  category: Category | null;  // ← ADD THIS
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  todos = signal<Todo[]>([]);
   

  private apiUrl = environment.apiUrl;


  // Form fields
  newTodoTitle = '';
  newTodoPriority = 'medium';
  isLoading = false;
  // Error messages for validation
  titleError = '';
  priorityError = '';
  filterPriority: string = 'all';
  editingTodo: Todo | null = null;
  newTodoDueDate: string = '';
  newTodoDueDateTime: string = '';
  username: string = '';

  // Filters
  filterStatus: string = 'all';  // 'all', 'active', 'completed'
  filterDueDate: string = 'all'; // 'all', 'today', 'this-week', 'overdue'
  searchTitle: string = '';

  // Sorting
  sortBy: string = 'createdAt';  // 'createdAt', 'dueDateTime', 'priority', 'status'
  sortOrder: string = 'asc';     // 'asc' or 'desc'

  // Categories
  categories: Category[] = [];
  selectedCategoryId: string = '';
  newCategoryName: string = '';
  showNewCategoryInput: boolean = false;
  editingTodoId: number | null = null;
  

  // Filter by category
  filterCategoryId: string = 'all';
  // Bulk selection
  selectedTodoIds: Set<number> = new Set();
  isDarkMode = false;

  seedOpen = false;
  filtersOpen = false;
  
 
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private authService: AuthService, private router: Router) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadTodos();
    this.loadCategories();
    this.username = localStorage.getItem('username') || '';

    // Init particles after view is ready
    setTimeout(() => this.initParticles(), 100);
  }

  loadTodos() {
    this.isLoading = true;
    this.http.get<Todo[]>(this.apiUrl).subscribe({
      next: (data) => {
        setTimeout(() => {
          this.todos.set(data);
          this.isLoading = false;
        });
      },
      error: (err) => {
        console.error('Error loading todos:', err);
        setTimeout(() => {
          this.isLoading = false;
        });
      }
    });
  }

  loadCategories() {
    this.http.get<Category[]>(`${this.apiUrl}/categories`).subscribe({

      next: (data) => {
        setTimeout(() => {
          this.categories = data;
        });
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }


  createTodo() {
    // Validation 1: Title cannot be empty
    if (!this.newTodoTitle.trim()) {
      this.titleError = 'Title is required';
      return;
    }
    this.titleError = '';

    // Validation 2: Priority must be valid
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(this.newTodoPriority)) {
      this.priorityError = 'Priority must be low, medium, or high';
      return;
    }
    this.priorityError = '';

    // Create the new todo object with dueDateTime
    const newTodo = {
      title: this.newTodoTitle,
      description: '',
      priority: this.newTodoPriority,
      dueDateTime: this.newTodoDueDateTime || null,
      category: this.selectedCategoryId ? { id: parseInt(this.selectedCategoryId) } : null
    };

    this.http.post<Todo>(this.apiUrl, newTodo).subscribe({
      next: (createdTodo) => {
        this.todos.update(currentTodos => [...currentTodos, createdTodo]);
        this.newTodoTitle = '';
        this.newTodoPriority = 'medium';
        this.newTodoDueDateTime = '';   // ← ADD THIS LINE (clear after creation)
      },
      error: (err) => {
        console.error('Error creating todo:', err);
        alert('Failed to create todo');
      }
    });
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }







  filteredAndSearchedTodos = () => {
    let result = this.todos();
    
    // 1. Filter by status (Active/Completed)
    if (this.filterStatus === 'active') {
      result = result.filter(todo => !todo.completed);
    } else if (this.filterStatus === 'completed') {
      result = result.filter(todo => todo.completed);
    }
    
    // 2. Filter by priority
    if (this.filterPriority !== 'all') {
      result = result.filter(todo => todo.priority === this.filterPriority);
    }
    
    // 3. Filter by due date
    if (this.filterDueDate === 'today') {
      result = result.filter(todo => this.isDueToday(todo));
    } else if (this.filterDueDate === 'this-week') {
      result = result.filter(todo => this.isDueThisWeek(todo));
    } else if (this.filterDueDate === 'overdue') {
      result = result.filter(todo => this.isOverdue(todo));
    }
    
    // 4. Search by title
    if (this.searchTitle.trim()) {
      const searchLower = this.searchTitle.toLowerCase();
      result = result.filter(todo => 
        todo.title.toLowerCase().includes(searchLower)
      );
    }


    // Filter by category
    if (this.filterCategoryId !== 'all') {
      if (this.filterCategoryId === 'none') {
        result = result.filter(todo => !todo.category);
      } else {
        result = result.filter(todo => todo.category?.id === parseInt(this.filterCategoryId));
      }
    }
    
    // 5. Sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'createdAt':
          comparison = (a.id || 0) - (b.id || 0);
          break;
        case 'dueDateTime':
          const dateA = a.dueDateTime ? new Date(a.dueDateTime).getTime() : 0;
          const dateB = b.dueDateTime ? new Date(b.dueDateTime).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) -
                      (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
          break;
        case 'status':
          comparison = (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
          break;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }



deleteTodo(id: number) {
  if (!confirm('Are you sure you want to delete this todo?')) {
    return;
  }

  this.http.delete(`${this.apiUrl}/${id}`).subscribe({
    next: () => {
      // Remove the todo from the list
      this.todos.update(currentTodos =>
        currentTodos.filter(todo => todo.id !== id)
      );
    },
    error: (err) => {
      console.error('Error deleting todo:', err);
      alert('Failed to delete todo');
    }
  });
}


// This automatically updates when todos or filterPriority changes
filteredTodos = () => {
  if (this.filterPriority === 'all') {
    return this.todos();
  }
  return this.todos().filter(todo => todo.priority === this.filterPriority);
}

changeFilter(priority: string) {
  this.filterPriority = priority;
}

startEdit(todo: Todo) {
  // Make a copy to edit
  this.editingTodo = { ...todo };
  this.editingTodoId = todo.id;
}

cancelEdit() {
  this.editingTodo = null;
  this.editingTodoId = null;
}

updateTodo() {
  if (!this.editingTodo) return;

  this.http.put<Todo>(`${this.apiUrl}/${this.editingTodo.id}`, this.editingTodo)
    .subscribe({
      next: (updatedTodo) => {
        this.todos.update(currentTodos =>
          currentTodos.map(todo =>
            todo.id === updatedTodo.id ? updatedTodo : todo
          )
        );
        this.editingTodo = null;
        this.editingTodoId = null;  // Close the edit form
      },
      error: (err) => {
        console.error('Error updating todo:', err);
        alert('Failed to update todo');
      }
    });
}

incompleteTodo(id: number) {
  this.http.patch(`${this.apiUrl}/${id}/incomplete`, {}).subscribe({
    next: (updatedTodo) => {
      // Update the todo in the list
      this.todos.update(currentTodos =>
        currentTodos.map(todo =>
          todo.id === id ? { ...todo, completed: false } : todo
        )
      );
    },
    error: (err) => {
      console.error('Error marking todo as incomplete:', err);
      alert('Failed to mark todo as incomplete');
    }
  });
}


// Check if a todo is overdue (due date passed and not completed)
isOverdue(todo: Todo): boolean {
  if (!todo.dueDateTime) return false;
  if (todo.completed) return false;
  
  const dueDate = new Date(todo.dueDateTime);
  const now = new Date();
  return dueDate < now;
}

// Check if a todo is due today
isDueToday(todo: Todo): boolean {
  if (!todo.dueDateTime) return false;
  
  const dueDate = new Date(todo.dueDateTime);
  const today = new Date();
  
  return dueDate.getDate() === today.getDate() &&
         dueDate.getMonth() === today.getMonth() &&
         dueDate.getFullYear() === today.getFullYear();
}

// Format due date time for display
formatDueDateTime(dateTime: string): string {
  if (!dateTime) return '';
  const date = new Date(dateTime);
  return date.toLocaleString(); // Shows: "4/28/2026, 3:30:00 PM"
}


// Check if todo is due this week
isDueThisWeek(todo: Todo): boolean {
  if (!todo.dueDateTime) return false;
  if (todo.completed) return false;
  
  const dueDate = new Date(todo.dueDateTime);
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return dueDate >= startOfWeek && dueDate <= endOfWeek;
}

// Check if todo is overdue (already exists)

completeTodo(id: number) {
  this.http.patch(`${this.apiUrl}/${id}/complete`, {}).subscribe({
    next: (updatedTodo) => {
      this.todos.update(currentTodos =>
        currentTodos.map(todo =>
          todo.id === id ? { ...todo, completed: true } : todo
        )
      );
    },
    error: (err) => {
      console.error('Error completing todo:', err);
      alert('Failed to mark todo as completed');
    }
  });
}


addNewCategory() {
  if (!this.newCategoryName.trim()) return;
  
  this.http.post<Category>(`${this.apiUrl}/categories`, { name: this.newCategoryName })
    .subscribe({
      next: (newCategory) => {
        this.categories.push(newCategory);
        this.selectedCategoryId = newCategory.id.toString();
        this.newCategoryName = '';
        this.showNewCategoryInput = false;
      },
      error: (err) => {
        console.error('Error creating category:', err);
        alert('Failed to create category');
      }
    });
}

// Toggle selection of a single todo
toggleSelection(id: number) {
  if (this.selectedTodoIds.has(id)) {
    this.selectedTodoIds.delete(id);
  } else {
    this.selectedTodoIds.add(id);
  }
}

// Toggle select all todos
toggleSelectAll() {
  if (this.selectedTodoIds.size === this.filteredAndSearchedTodos().length) {
    this.selectedTodoIds.clear();
  } else {
    this.filteredAndSearchedTodos().forEach(todo => {
      this.selectedTodoIds.add(todo.id);
    });
  }
}

// Check if all todos are selected
isAllSelected(): boolean {
  return this.filteredAndSearchedTodos().length > 0 && 
         this.selectedTodoIds.size === this.filteredAndSearchedTodos().length;
}

// Bulk delete selected todos
bulkDelete() {
  if (this.selectedTodoIds.size === 0) {
    alert('No todos selected');
    return;
  }
  
  if (confirm(`Delete ${this.selectedTodoIds.size} todo(s)?`)) {
    const deletePromises = Array.from(this.selectedTodoIds).map(id =>
      this.http.delete(`${this.apiUrl}/${id}`).toPromise()
    );
    
    Promise.all(deletePromises).then(() => {
      this.loadTodos();
      this.selectedTodoIds.clear();
    }).catch(err => {
      console.error('Error in bulk delete:', err);
      alert('Failed to delete some todos');
    });
  }
}

// Bulk complete selected todos
bulkComplete() {
  if (this.selectedTodoIds.size === 0) {
    alert('No todos selected');
    return;
  }
  
  const completePromises = Array.from(this.selectedTodoIds).map(id =>
    this.http.patch(`${this.apiUrl}/${id}/complete`, {}).toPromise()
  );
  
  Promise.all(completePromises).then(() => {
    this.loadTodos();
    this.selectedTodoIds.clear();
  }).catch(err => {
    console.error('Error in bulk complete:', err);
    alert('Failed to complete some todos');
  });
}




logout() {
  localStorage.clear();
  this.router.navigate(['/login']);   // ← was window.location.href
}












hasActiveFilters(): boolean {
  return this.filterStatus !== 'all'
    || this.filterPriority !== 'all'
    || this.filterDueDate !== 'all'
    || this.filterCategoryId !== 'all'
    || this.searchTitle.trim() !== '';
}

getActiveTodosCount(): number {
  return this.todos().filter(t => !t.completed).length;
}

initParticles() {
  const field = document.querySelector('.particle-field') as HTMLElement;
  if (!field) return;

  const colors = [
    'rgba(139,92,246,0.6)',
    'rgba(236,72,153,0.5)',
    'rgba(6,182,212,0.5)',
    'rgba(255,255,255,0.3)',
  ];

  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 1;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const duration = Math.random() * 20 + 15;
    const delay = Math.random() * 20;
    const drift = (Math.random() - 0.5) * 200;
    const left = Math.random() * 100;

    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      left: ${left}%;
      bottom: -10px;
      --drift-x: ${drift}px;
      animation-duration: ${duration}s;
      animation-delay: -${delay}s;
      border-radius: 50%;
    `;
    field.appendChild(p);
  }
}



// Get node size based on priority (spatial scaling)
getNodeSize(priority: string): number {
  switch(priority) {
    case 'high': return 320;
    case 'medium': return 280;
    default: return 240;
  }
}

// Get energy level dots for priority
getEnergyLevel(priority: string): number[] {
  switch(priority) {
    case 'high': return [1, 2, 3];
    case 'medium': return [1, 2];
    default: return [1];
  }
}

}