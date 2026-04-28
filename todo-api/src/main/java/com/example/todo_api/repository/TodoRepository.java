package com.example.todo_api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.todo_api.entity.Todo;

@Repository
public interface TodoRepository extends JpaRepository<Todo, Long> {

    // Custom query method: finds todos by completed status
    // Spring Data JPA automatically implements this
    List<Todo> findByCompleted(boolean completed);

    // Custom query method: finds todos by priority
    List<Todo> findByPriority(String priority);
}