import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../environments/environment';


interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority: string;
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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTodos();
  }

  loadTodos() {
    this.isLoading = true;
    this.http.get<Todo[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.todos.set(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading todos:', err);
        this.isLoading = false;
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

  const newTodo = {
    title: this.newTodoTitle,
    description: '',
    priority: this.newTodoPriority
  };

  this.http.post<Todo>(this.apiUrl, newTodo).subscribe({
    next: (createdTodo) => {
      this.todos.update(currentTodos => [...currentTodos, createdTodo]);
      this.newTodoTitle = '';
      this.newTodoPriority = 'medium';
    },
    error: (err) => {
      console.error('Error creating todo:', err);
      alert('Failed to create todo');
    }
  });
}

  completeTodo(id: number) {
  this.http.patch(`${this.apiUrl}/${id}/complete`, {}).subscribe({
    next: (updatedTodo) => {
      // Update the todo in the list
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
  // Create a copy to edit (don't modify original directly)
  this.editingTodo = { ...todo };
}

cancelEdit() {
  this.editingTodo = null;
}

updateTodo() {
  if (!this.editingTodo) return;

  this.http.put<Todo>(`${this.apiUrl}/${this.editingTodo.id}`, this.editingTodo)
    .subscribe({
      next: (updatedTodo) => {
        // Update the todo in the list
        this.todos.update(currentTodos =>
          currentTodos.map(todo =>
            todo.id === updatedTodo.id ? updatedTodo : todo
          )
        );
        this.editingTodo = null;
      },
      error: (err) => {
        console.error('Error updating todo:', err);
        alert('Failed to update todo');
      }
    });
}

}