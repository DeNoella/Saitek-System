// server.js - Main server file
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable CORS for all routes

// In-memory database (in production, use a real database)
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
];

let nextId = 4; // Counter for generating new IDs

// Helper function to validate user data
const validateUser = (user) => {
  const errors = [];
  
  if (!user.name || typeof user.name !== 'string' || user.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }
  
  if (!user.email || typeof user.email !== 'string') {
    errors.push('Email is required and must be a string');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push('Email must be a valid email address');
  }
  
  if (user.age === undefined || user.age === null) {
    errors.push('Age is required');
  } else if (typeof user.age !== 'number' || user.age < 0 || user.age > 150) {
    errors.push('Age must be a number between 0 and 150');
  }
  
  return errors;
};

// Helper function to find user by ID
const findUserById = (id) => {
  return users.find(user => user.id === parseInt(id));
};

// Routes

// GET /api/users - Get all users
app.get('/api/users', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/users/:id - Get user by ID
app.get('/api/users/:id', (req, res) => {
  try {
    const user = findUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/users - Create new user
app.post('/api/users', (req, res) => {
  try {
    const { name, email, age } = req.body;
    
    // Validate input
    const validationErrors = validateUser({ name, email, age });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Check if email already exists
    const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create new user
    const newUser = {
      id: nextId++,
      name: name.trim(),
      email: email.toLowerCase(),
      age: parseInt(age)
    };
    
    users.push(newUser);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT /api/users/:id - Update user by ID
app.put('/api/users/:id', (req, res) => {
  try {
    const user = findUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const { name, email, age } = req.body;
    
    // Validate input
    const validationErrors = validateUser({ name, email, age });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Check if email already exists for another user
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== user.id);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Update user
    user.name = name.trim();
    user.email = email.toLowerCase();
    user.age = parseInt(age);
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PATCH /api/users/:id - Partially update user by ID
app.patch('/api/users/:id', (req, res) => {
  try {
    const user = findUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const updates = req.body;
    const allowedUpdates = ['name', 'email', 'age'];
    const actualUpdates = Object.keys(updates);
    
    // Check if all updates are valid
    const isValidOperation = actualUpdates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid updates. Allowed fields: name, email, age'
      });
    }
    
    // Validate individual fields if provided
    const tempUser = { ...user, ...updates };
    const validationErrors = validateUser(tempUser);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Check email uniqueness if email is being updated
    if (updates.email) {
      const existingUser = users.find(u => u.email.toLowerCase() === updates.email.toLowerCase() && u.id !== user.id);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }
    
    // Apply updates
    actualUpdates.forEach(update => {
      if (update === 'name') user.name = updates[update].trim();
      else if (update === 'email') user.email = updates[update].toLowerCase();
      else if (update === 'age') user.age = parseInt(updates[update]);
    });
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE /api/users/:id - Delete user by ID
app.delete('/api/users/:id', (req, res) => {
  try {
    const userIndex = users.findIndex(user => user.id === parseInt(req.params.id));
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const deletedUser = users.splice(userIndex, 1)[0];
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: deletedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Handle 404 for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   GET    /api/health        - Health check`);
  console.log(`   GET    /api/users         - Get all users`);
  console.log(`   GET    /api/users/:id     - Get user by ID`);
  console.log(`   POST   /api/users         - Create new user`);
  console.log(`   PUT    /api/users/:id     - Update user (full)`);
  console.log(`   PATCH  /api/users/:id     - Update user (partial)`);
  console.log(`   DELETE /api/users/:id     - Delete user`);
});

module.exports = app;