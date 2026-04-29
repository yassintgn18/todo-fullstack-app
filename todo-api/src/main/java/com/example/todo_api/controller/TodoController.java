package com.example.todo_api.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.todo_api.entity.Category;
import com.example.todo_api.entity.Todo;
import com.example.todo_api.entity.User;
import com.example.todo_api.repository.CategoryRepository;
import com.example.todo_api.repository.TodoRepository;
import com.example.todo_api.repository.UserRepository;
import com.example.todo_api.service.JwtService;

@RestController
@RequestMapping("/api/todos")
@CrossOrigin(origins = {"http://localhost:4200", "https://todolistangluar.netlify.app"})
public class TodoController {

    @Autowired
    private TodoRepository todoRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtService jwtService;

    // Helper method to get current user from JWT token
    private User getCurrentUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        String username = jwtService.extractUsername(token);
        return userRepository.findByUsername(username).orElse(null);
    }

    // ========== TODO ENDPOINTS ==========

    // GET /api/todos - List all todos for current user
    @GetMapping
    public ResponseEntity<List<Todo>> getAllTodos(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        User currentUser = getCurrentUser(authHeader);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<Todo> todos = todoRepository.findByUser(currentUser);
        return ResponseEntity.ok(todos);
    }

    // GET /api/todos/{id} - Get one todo by ID (only if owned by user)
    @GetMapping("/{id}")
    public ResponseEntity<Todo> getTodoById(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User currentUser = getCurrentUser(authHeader);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Todo todo = todoRepository.findByIdAndUser(id, currentUser).orElse(null);
        if (todo == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(todo);
    }

    // POST /api/todos - Create a new todo for current user
    @PostMapping
    public ResponseEntity<Todo> createTodo(@RequestBody Todo todo, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User currentUser = getCurrentUser(authHeader);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        // Set the current user
        todo.setUser(currentUser);
        
        // If category is sent as just { id: 1 }, load the full Category entity
        if (todo.getCategory() != null && todo.getCategory().getId() != null) {
            Category category = categoryRepository.findById(todo.getCategory().getId()).orElse(null);
            todo.setCategory(category);
        }
        
        Todo savedTodo = todoRepository.save(todo);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedTodo);
    }

    // PUT /api/todos/{id} - Update an existing todo (only if owned by user)
    @PutMapping("/{id}")
    public ResponseEntity<Todo> updateTodo(@PathVariable Long id, @RequestBody Todo todoDetails, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User currentUser = getCurrentUser(authHeader);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        Todo existingTodo = todoRepository.findByIdAndUser(id, currentUser).orElse(null);
        if (existingTodo == null) {
            return ResponseEntity.notFound().build();
        }
        
        existingTodo.setTitle(todoDetails.getTitle());
        existingTodo.setDescription(todoDetails.getDescription());
        existingTodo.setCompleted(todoDetails.isCompleted());
        existingTodo.setPriority(todoDetails.getPriority());
        existingTodo.setDueDateTime(todoDetails.getDueDateTime());
        existingTodo.setCategory(todoDetails.getCategory());
        // Do NOT allow changing user

        Todo updatedTodo = todoRepository.save(existingTodo);
        return ResponseEntity.ok(updatedTodo);
    }

    // PATCH /api/todos/{id}/complete - Mark todo as completed (only if owned by user)
    @PatchMapping("/{id}/complete")
    public ResponseEntity<Todo> completeTodo(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User currentUser = getCurrentUser(authHeader);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        Todo todo = todoRepository.findByIdAndUser(id, currentUser).orElse(null);
        if (todo == null) {
            return ResponseEntity.notFound().build();
        }
        todo.setCompleted(true);
        Todo updatedTodo = todoRepository.save(todo);
        return ResponseEntity.ok(updatedTodo);
    }

    // PATCH /api/todos/{id}/incomplete - Mark todo as incomplete (only if owned by user)
    @PatchMapping("/{id}/incomplete")
    public ResponseEntity<Todo> incompleteTodo(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User currentUser = getCurrentUser(authHeader);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        Todo todo = todoRepository.findByIdAndUser(id, currentUser).orElse(null);
        if (todo == null) {
            return ResponseEntity.notFound().build();
        }
        todo.setCompleted(false);
        Todo updatedTodo = todoRepository.save(todo);
        return ResponseEntity.ok(updatedTodo);
    }

    // DELETE /api/todos/{id} - Delete a todo (only if owned by user)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User currentUser = getCurrentUser(authHeader);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        Todo todo = todoRepository.findByIdAndUser(id, currentUser).orElse(null);
        if (todo == null) {
            return ResponseEntity.notFound().build();
        }
        todoRepository.delete(todo);
        return ResponseEntity.noContent().build();
    }

    // ========== CATEGORY ENDPOINTS ==========

    // GET /api/todos/categories - List all categories (shared across users)
    @GetMapping("/categories")
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    // POST /api/todos/categories - Create a new category
    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        if (categoryRepository.existsByName(category.getName())) {
            return ResponseEntity.badRequest().build();
        }
        Category savedCategory = categoryRepository.save(category);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCategory);
    }
}