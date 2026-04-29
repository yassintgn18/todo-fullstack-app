package com.example.todo_api.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "categories")
public class Category {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String name;
    
    private String color; // Optional: store color for UI
    
    @JsonIgnore
    @OneToMany(mappedBy = "category")
    private List<Todo> todos = new ArrayList<>();
    
    // Constructors
    public Category() {}
    
    public Category(String name) {
        this.name = name;
        this.color = "#808080"; // Default gray
    }
    
    public Category(String name, String color) {
        this.name = name;
        this.color = color;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    
    public List<Todo> getTodos() { return todos; }
    public void setTodos(List<Todo> todos) { this.todos = todos; }
}