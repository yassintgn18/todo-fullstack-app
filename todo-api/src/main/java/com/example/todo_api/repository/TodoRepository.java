package com.example.todo_api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.todo_api.entity.Todo;
import com.example.todo_api.entity.User;

@Repository
public interface TodoRepository extends JpaRepository<Todo, Long> {

    // Find todos by user
    List<Todo> findByUser(User user);
    
    // Find todos by user and completed status
    List<Todo> findByUserAndCompleted(User user, boolean completed);
    
    // Find todos by user and priority
    List<Todo> findByUserAndPriority(User user, String priority);
    
    // Find todo by id and user (for security - ensures user owns the todo)
    java.util.Optional<Todo> findByIdAndUser(Long id, User user);
    
    // Delete todo by id and user (for security)
    void deleteByIdAndUser(Long id, User user);
    
    // Count todos by user
    long countByUser(User user);
    
    // Count incomplete todos by user
    long countByUserAndCompletedFalse(User user);
}