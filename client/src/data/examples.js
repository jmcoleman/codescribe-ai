// Curated code samples for demonstration purposes
export const codeSamples = [
  {
    id: 'csharp-api',
    title: 'C# ASP.NET Core API',
    description: 'A RESTful API controller built with ASP.NET Core and Entity Framework. Shows C# documentation generation.',
    language: 'csharp',
    docType: 'API',
    code: `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BookStore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BooksController : ControllerBase
    {
        private readonly BookStoreContext _context;

        public BooksController(BookStoreContext context)
        {
            _context = context;
        }

        // GET: api/Books
        // Retrieves all books with optional filtering by author, genre, and availability
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Book>>> GetBooks(
            [FromQuery] string author = null,
            [FromQuery] string genre = null,
            [FromQuery] bool? inStock = null)
        {
            var query = _context.Books.AsQueryable();

            if (!string.IsNullOrEmpty(author))
            {
                query = query.Where(b => b.Author.Contains(author));
            }

            if (!string.IsNullOrEmpty(genre))
            {
                query = query.Where(b => b.Genre == genre);
            }

            if (inStock.HasValue)
            {
                query = query.Where(b => b.InStock == inStock.Value);
            }

            var books = await query
                .Include(b => b.Reviews)
                .OrderBy(b => b.Title)
                .ToListAsync();

            return Ok(new { success = true, data = books, count = books.Count });
        }

        // GET: api/Books/5
        // Retrieves a specific book by ID with its reviews
        [HttpGet("{id}")]
        public async Task<ActionResult<Book>> GetBook(int id)
        {
            var book = await _context.Books
                .Include(b => b.Reviews)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (book == null)
            {
                return NotFound(new { success = false, error = "Book not found" });
            }

            return Ok(new { success = true, data = book });
        }

        // POST: api/Books
        // Creates a new book in the catalog
        [HttpPost]
        public async Task<ActionResult<Book>> CreateBook(Book book)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, errors = ModelState });
            }

            _context.Books.Add(book);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBook),
                new { id = book.Id },
                new { success = true, data = book });
        }

        // PUT: api/Books/5
        // Updates an existing book's information
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBook(int id, Book book)
        {
            if (id != book.Id)
            {
                return BadRequest(new { success = false, error = "ID mismatch" });
            }

            _context.Entry(book).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BookExists(id))
                {
                    return NotFound(new { success = false, error = "Book not found" });
                }
                throw;
            }

            return Ok(new { success = true, message = "Book updated successfully" });
        }

        // DELETE: api/Books/5
        // Deletes a book from the catalog
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBook(int id)
        {
            var book = await _context.Books.FindAsync(id);
            if (book == null)
            {
                return NotFound(new { success = false, error = "Book not found" });
            }

            _context.Books.Remove(book);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Book deleted successfully" });
        }

        private bool BookExists(int id)
        {
            return _context.Books.Any(e => e.Id == id);
        }
    }

    public class Book
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Author { get; set; }
        public string Genre { get; set; }
        public decimal Price { get; set; }
        public bool InStock { get; set; }
        public DateTime PublishedDate { get; set; }
        public ICollection<Review> Reviews { get; set; }
    }

    public class Review
    {
        public int Id { get; set; }
        public int BookId { get; set; }
        public string ReviewerName { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; }
    }
}`
  },
  {
    id: 'java-spring-api',
    title: 'Java Spring Boot API',
    description: 'A RESTful API service built with Spring Boot and JPA. Perfect for Java documentation generation.',
    language: 'java',
    docType: 'JSDOC',
    code: `package com.example.inventory.controller;

import com.example.inventory.model.Product;
import com.example.inventory.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST Controller for managing product inventory.
 * Provides endpoints for CRUD operations on products.
 */
@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    /**
     * Retrieves all products from the inventory.
     * Supports optional filtering by category and price range.
     *
     * @param category Optional filter by product category
     * @param minPrice Optional minimum price filter
     * @param maxPrice Optional maximum price filter
     * @return ResponseEntity containing list of products and success status
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice) {

        List<Product> products;

        if (category != null && minPrice != null && maxPrice != null) {
            products = productRepository.findByCategoryAndPriceBetween(
                category, minPrice, maxPrice);
        } else if (category != null) {
            products = productRepository.findByCategory(category);
        } else if (minPrice != null && maxPrice != null) {
            products = productRepository.findByPriceBetween(minPrice, maxPrice);
        } else {
            products = productRepository.findAll();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", products);
        response.put("count", products.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves a single product by its ID.
     *
     * @param id The unique identifier of the product
     * @return ResponseEntity with product data or 404 if not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProductById(@PathVariable Long id) {
        Optional<Product> product = productRepository.findById(id);

        Map<String, Object> response = new HashMap<>();

        if (product.isPresent()) {
            response.put("success", true);
            response.put("data", product.get());
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("error", "Product not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    /**
     * Creates a new product in the inventory.
     *
     * @param product The product object to create (validated)
     * @return ResponseEntity with created product and 201 status
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createProduct(
            @Valid @RequestBody Product product) {

        Product savedProduct = productRepository.save(product);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", savedProduct);
        response.put("message", "Product created successfully");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Updates an existing product's information.
     *
     * @param id The ID of the product to update
     * @param productDetails The updated product information
     * @return ResponseEntity with updated product or 404 if not found
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody Product productDetails) {

        Optional<Product> productOptional = productRepository.findById(id);
        Map<String, Object> response = new HashMap<>();

        if (productOptional.isPresent()) {
            Product product = productOptional.get();
            product.setName(productDetails.getName());
            product.setDescription(productDetails.getDescription());
            product.setPrice(productDetails.getPrice());
            product.setQuantity(productDetails.getQuantity());
            product.setCategory(productDetails.getCategory());

            Product updatedProduct = productRepository.save(product);

            response.put("success", true);
            response.put("data", updatedProduct);
            response.put("message", "Product updated successfully");

            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("error", "Product not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    /**
     * Deletes a product from the inventory.
     *
     * @param id The ID of the product to delete
     * @return ResponseEntity with success message or 404 if not found
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            response.put("success", true);
            response.put("message", "Product deleted successfully");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("error", "Product not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    /**
     * Updates the quantity of a product in stock.
     *
     * @param id The ID of the product
     * @param quantity The new quantity value
     * @return ResponseEntity with updated product or error
     */
    @PatchMapping("/{id}/quantity")
    public ResponseEntity<Map<String, Object>> updateQuantity(
            @PathVariable Long id,
            @RequestParam Integer quantity) {

        Optional<Product> productOptional = productRepository.findById(id);
        Map<String, Object> response = new HashMap<>();

        if (productOptional.isPresent()) {
            Product product = productOptional.get();
            product.setQuantity(quantity);
            Product updatedProduct = productRepository.save(product);

            response.put("success", true);
            response.put("data", updatedProduct);
            response.put("message", "Quantity updated");

            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("error", "Product not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
}`
  },
  {
    id: 'express-api',
    title: 'Express API Endpoint',
    description: 'A RESTful API endpoint with validation and error handling. Ideal for API documentation generation.',
    language: 'javascript',
    docType: 'API',
    code: `const express = require('express');
const router = express.Router();

// Get all users with optional filtering and pagination
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    // Build query filters
    const filters = {};
    if (role) filters.role = role;
    if (search) filters.$text = { $search: search };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch users from database
    const users = await User.find(filters)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password')
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filters);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// Create a new user
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({ name, email, password, role });
    await user.save();

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message
    });
  }
});

module.exports = router;`
  },
  {
    id: 'data-processor',
    title: 'Data Processing Algorithm',
    description: 'A complex algorithm that processes and transforms data. Shows how AI handles detailed logic documentation.',
    language: 'javascript',
    docType: 'README',
    code: `// Advanced data processor for analytics pipeline
class DataProcessor {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 100;
    this.timeout = options.timeout || 5000;
    this.retries = options.retries || 3;
    this.cache = new Map();
  }

  // Process an array of records with transformation pipeline
  async processRecords(records, pipeline) {
    const batches = this.createBatches(records, this.batchSize);
    const results = [];

    for (const batch of batches) {
      const batchResults = await this.processBatch(batch, pipeline);
      results.push(...batchResults);
    }

    return this.aggregateResults(results);
  }

  // Split records into smaller batches for processing
  createBatches(records, size) {
    const batches = [];
    for (let i = 0; i < records.length; i += size) {
      batches.push(records.slice(i, i + size));
    }
    return batches;
  }

  // Process a single batch with retry logic
  async processBatch(batch, pipeline) {
    let attempts = 0;

    while (attempts < this.retries) {
      try {
        const processed = await Promise.all(
          batch.map(record => this.transformRecord(record, pipeline))
        );
        return processed.filter(r => r !== null);
      } catch (error) {
        attempts++;
        if (attempts >= this.retries) throw error;
        await this.delay(1000 * attempts); // Exponential backoff
      }
    }
  }

  // Transform a single record through the pipeline
  async transformRecord(record, pipeline) {
    // Check cache first
    const cacheKey = this.getCacheKey(record);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let result = record;

    // Apply each transformation in the pipeline
    for (const transform of pipeline) {
      result = await transform(result);
      if (result === null) break; // Skip invalid records
    }

    // Cache the result
    if (result !== null) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  // Aggregate processed results with statistics
  aggregateResults(results) {
    return {
      processed: results.length,
      timestamp: new Date().toISOString(),
      data: results,
      stats: this.calculateStats(results)
    };
  }

  // Calculate statistical metrics
  calculateStats(results) {
    return {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      errors: results.filter(r => r.error).length,
      avgProcessingTime: results.reduce((sum, r) => sum + (r.processingTime || 0), 0) / results.length
    };
  }

  getCacheKey(record) {
    return JSON.stringify(record);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = DataProcessor;`
  },
  {
    id: 'ruby-sinatra-api',
    title: 'Ruby Sinatra API',
    description: 'A lightweight REST API built with Ruby Sinatra. Perfect example of Ruby documentation generation.',
    language: 'ruby',
    docType: 'JSDOC',
    code: `require 'sinatra'
require 'sinatra/json'
require 'json'
require 'securerandom'

# Configure Sinatra
set :port, 4567
set :bind, '0.0.0.0'

# In-memory database (replace with real DB in production)
$movies = []
$next_id = 1

# Movie model representation
class Movie
  attr_accessor :id, :title, :director, :year, :genre, :rating

  def initialize(title:, director:, year:, genre:, rating: nil)
    @id = $next_id
    $next_id += 1
    @title = title
    @director = director
    @year = year
    @genre = genre
    @rating = rating
  end

  def to_h
    {
      id: @id,
      title: @title,
      director: @director,
      year: @year,
      genre: @genre,
      rating: @rating
    }
  end
end

# Seed some initial data
$movies << Movie.new(title: 'The Shawshank Redemption', director: 'Frank Darabont', year: 1994, genre: 'Drama', rating: 9.3)
$movies << Movie.new(title: 'The Godfather', director: 'Francis Ford Coppola', year: 1972, genre: 'Crime', rating: 9.2)
$movies << Movie.new(title: 'Pulp Fiction', director: 'Quentin Tarantino', year: 1994, genre: 'Crime', rating: 8.9)

# GET /api/movies - Retrieve all movies
# Supports filtering by genre and year
get '/api/movies' do
  content_type :json

  genre = params['genre']
  year = params['year']&.to_i

  filtered_movies = $movies

  # Apply filters if provided
  filtered_movies = filtered_movies.select { |m| m.genre == genre } if genre
  filtered_movies = filtered_movies.select { |m| m.year == year } if year

  json({
    success: true,
    data: filtered_movies.map(&:to_h),
    count: filtered_movies.length
  })
end

# GET /api/movies/:id - Retrieve a specific movie
get '/api/movies/:id' do
  content_type :json
  id = params['id'].to_i

  movie = $movies.find { |m| m.id == id }

  if movie
    json({ success: true, data: movie.to_h })
  else
    status 404
    json({ success: false, error: 'Movie not found' })
  end
end

# POST /api/movies - Create a new movie
post '/api/movies' do
  content_type :json

  begin
    data = JSON.parse(request.body.read)

    # Validate required fields
    unless data['title'] && data['director'] && data['year'] && data['genre']
      status 400
      return json({ success: false, error: 'Missing required fields: title, director, year, genre' })
    end

    # Create new movie
    movie = Movie.new(
      title: data['title'],
      director: data['director'],
      year: data['year'].to_i,
      genre: data['genre'],
      rating: data['rating']&.to_f
    )

    $movies << movie

    status 201
    json({ success: true, data: movie.to_h, message: 'Movie created successfully' })
  rescue JSON::ParserError
    status 400
    json({ success: false, error: 'Invalid JSON' })
  end
end

# PUT /api/movies/:id - Update an existing movie
put '/api/movies/:id' do
  content_type :json
  id = params['id'].to_i

  movie = $movies.find { |m| m.id == id }

  unless movie
    status 404
    return json({ success: false, error: 'Movie not found' })
  end

  begin
    data = JSON.parse(request.body.read)

    # Update fields if provided
    movie.title = data['title'] if data['title']
    movie.director = data['director'] if data['director']
    movie.year = data['year'].to_i if data['year']
    movie.genre = data['genre'] if data['genre']
    movie.rating = data['rating'].to_f if data['rating']

    json({ success: true, data: movie.to_h, message: 'Movie updated successfully' })
  rescue JSON::ParserError
    status 400
    json({ success: false, error: 'Invalid JSON' })
  end
end

# DELETE /api/movies/:id - Delete a movie
delete '/api/movies/:id' do
  content_type :json
  id = params['id'].to_i

  movie = $movies.find { |m| m.id == id }

  if movie
    $movies.delete(movie)
    json({ success: true, message: 'Movie deleted successfully' })
  else
    status 404
    json({ success: false, error: 'Movie not found' })
  end
end

# GET /api/movies/search - Search movies by title
get '/api/movies/search' do
  content_type :json

  query = params['q']&.downcase

  unless query
    status 400
    return json({ success: false, error: 'Query parameter "q" is required' })
  end

  results = $movies.select { |m| m.title.downcase.include?(query) }

  json({
    success: true,
    data: results.map(&:to_h),
    count: results.length
  })
end

# Error handlers
not_found do
  content_type :json
  json({ success: false, error: 'Endpoint not found' })
end

error do
  content_type :json
  status 500
  json({ success: false, error: 'Internal server error' })
end`
  },
  {
    id: 'python-flask-api',
    title: 'Python Flask API',
    description: 'A Flask REST API with database models and authentication. Perfect example of Python documentation generation.',
    language: 'python',
    docType: 'ARCHITECTURE',
    code: `from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import jwt

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
app.config['SECRET_KEY'] = 'your-secret-key'
db = SQLAlchemy(app)

class User(db.Model):
    """User model for authentication and task ownership."""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tasks = db.relationship('Task', backref='owner', lazy=True)

    def set_password(self, password):
        """Hash and store the user's password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify the user's password against the stored hash."""
        return check_password_hash(self.password_hash, password)

class Task(db.Model):
    """Task model representing a todo item."""
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    completed = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String(20), default='medium')
    due_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """
    Retrieve all tasks for the authenticated user.
    Supports filtering by completion status and priority.
    """
    # Get query parameters
    completed = request.args.get('completed', type=bool)
    priority = request.args.get('priority', type=str)

    # Build query
    query = Task.query

    if completed is not None:
        query = query.filter_by(completed=completed)

    if priority:
        query = query.filter_by(priority=priority)

    # Execute query
    tasks = query.all()

    return jsonify({
        'success': True,
        'tasks': [{
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'completed': task.completed,
            'priority': task.priority,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'created_at': task.created_at.isoformat()
        } for task in tasks]
    })

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """
    Create a new task for the authenticated user.
    Requires title in request body.
    """
    data = request.get_json()

    # Validate required fields
    if not data.get('title'):
        return jsonify({'success': False, 'error': 'Title is required'}), 400

    # Create new task
    task = Task(
        title=data['title'],
        description=data.get('description', ''),
        priority=data.get('priority', 'medium'),
        user_id=1  # Would come from auth token in production
    )

    db.session.add(task)
    db.session.commit()

    return jsonify({
        'success': True,
        'task': {
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'priority': task.priority
        }
    }), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update an existing task by ID."""
    task = Task.query.get_or_404(task_id)
    data = request.get_json()

    # Update fields
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'completed' in data:
        task.completed = data['completed']
    if 'priority' in data:
        task.priority = data['priority']

    db.session.commit()

    return jsonify({'success': True, 'message': 'Task updated'})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task by ID."""
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Task deleted'})

if __name__ == '__main__':
    db.create_all()
    app.run(debug=True)`
  },
  {
    id: 'microservices-architecture',
    title: 'Microservices Architecture',
    description: 'A complete microservices system with multiple services and API gateway. Ideal for generating architecture documentation.',
    language: 'javascript',
    docType: 'ARCHITECTURE',
    code: `// E-Commerce Microservices Architecture
// This system demonstrates a complete microservices architecture with service discovery,
// API gateway, and inter-service communication.

/**
 * API GATEWAY SERVICE
 * Entry point for all client requests. Handles routing, authentication, and rate limiting.
 */
const express = require('express');
const proxy = require('express-http-proxy');
const rateLimit = require('express-rate-limit');

class APIGateway {
  constructor() {
    this.app = express();
    this.services = {
      auth: 'http://localhost:3001',
      products: 'http://localhost:3002',
      orders: 'http://localhost:3003',
      payments: 'http://localhost:3004',
      notifications: 'http://localhost:3005'
    };
  }

  setupMiddleware() {
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
    this.app.use(limiter);

    // Authentication middleware
    this.app.use('/api', this.authenticate);
  }

  setupRoutes() {
    // Route requests to appropriate microservices
    this.app.use('/api/auth', proxy(this.services.auth));
    this.app.use('/api/products', proxy(this.services.products));
    this.app.use('/api/orders', proxy(this.services.orders));
    this.app.use('/api/payments', proxy(this.services.payments));
  }

  authenticate(req, res, next) {
    // JWT verification logic
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    next();
  }
}

/**
 * PRODUCT SERVICE
 * Manages product catalog, inventory, and search functionality.
 * Database: PostgreSQL
 * Cache: Redis
 */
class ProductService {
  constructor() {
    this.db = require('./db/postgres');
    this.cache = require('./cache/redis');
    this.eventBus = require('./events/rabbitmq');
  }

  async getProduct(productId) {
    // Check cache first
    const cached = await this.cache.get(\`product:\${productId}\`);
    if (cached) return JSON.parse(cached);

    // Fetch from database
    const product = await this.db.query(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );

    // Cache for 1 hour
    await this.cache.setex(\`product:\${productId}\`, 3600, JSON.stringify(product));
    return product;
  }

  async updateInventory(productId, quantity) {
    await this.db.query(
      'UPDATE products SET stock = stock - $1 WHERE id = $2',
      [quantity, productId]
    );

    // Publish inventory update event
    await this.eventBus.publish('inventory.updated', {
      productId,
      newStock: quantity
    });
  }
}

/**
 * ORDER SERVICE
 * Handles order creation, processing, and fulfillment.
 * Implements saga pattern for distributed transactions.
 */
class OrderService {
  constructor() {
    this.db = require('./db/mongodb');
    this.eventBus = require('./events/rabbitmq');
  }

  async createOrder(userId, items) {
    // Start distributed transaction (Saga pattern)
    const orderId = await this.db.orders.insertOne({
      userId,
      items,
      status: 'pending',
      createdAt: new Date()
    });

    // Publish order created event
    await this.eventBus.publish('order.created', {
      orderId,
      userId,
      items
    });

    // Reserve inventory (compensating transaction if fails)
    try {
      await this.reserveInventory(items);
      await this.processPayment(orderId, items);
      await this.updateOrderStatus(orderId, 'confirmed');
    } catch (error) {
      await this.compensate(orderId);
      throw error;
    }

    return orderId;
  }

  async compensate(orderId) {
    // Rollback order and release inventory
    await this.eventBus.publish('order.cancelled', { orderId });
    await this.db.orders.updateOne(
      { _id: orderId },
      { $set: { status: 'cancelled' } }
    );
  }
}

/**
 * PAYMENT SERVICE
 * Processes payments through multiple payment gateways.
 * Handles refunds and payment reconciliation.
 */
class PaymentService {
  constructor() {
    this.stripe = require('stripe')(process.env.STRIPE_KEY);
    this.paypal = require('./gateways/paypal');
    this.db = require('./db/postgres');
  }

  async processPayment(orderId, amount, method) {
    let result;

    if (method === 'stripe') {
      result = await this.stripe.charges.create({
        amount: amount * 100,
        currency: 'usd',
        source: 'tok_visa'
      });
    } else if (method === 'paypal') {
      result = await this.paypal.processPayment(amount);
    }

    // Store payment record
    await this.db.query(
      'INSERT INTO payments (order_id, amount, method, status) VALUES ($1, $2, $3, $4)',
      [orderId, amount, method, result.status]
    );

    return result;
  }
}

/**
 * NOTIFICATION SERVICE
 * Sends notifications via email, SMS, and push notifications.
 * Implements message queuing for reliable delivery.
 */
class NotificationService {
  constructor() {
    this.email = require('./providers/sendgrid');
    this.sms = require('./providers/twilio');
    this.queue = require('./queue/rabbitmq');
  }

  async sendOrderConfirmation(userId, orderId) {
    await this.queue.add('notifications', {
      type: 'order_confirmation',
      userId,
      orderId,
      channels: ['email', 'push']
    });
  }
}

/**
 * SERVICE DISCOVERY
 * Manages service registration and health checks.
 */
class ServiceRegistry {
  constructor() {
    this.services = new Map();
  }

  register(serviceName, serviceUrl, healthCheckUrl) {
    this.services.set(serviceName, {
      url: serviceUrl,
      healthCheck: healthCheckUrl,
      lastCheck: new Date(),
      status: 'healthy'
    });

    // Start health check interval
    this.startHealthCheck(serviceName);
  }

  async startHealthCheck(serviceName) {
    setInterval(async () => {
      const service = this.services.get(serviceName);
      try {
        await fetch(service.healthCheck);
        service.status = 'healthy';
      } catch (error) {
        service.status = 'unhealthy';
      }
    }, 30000); // Check every 30 seconds
  }
}

module.exports = {
  APIGateway,
  ProductService,
  OrderService,
  PaymentService,
  NotificationService,
  ServiceRegistry
};`
  },
  {
    id: 'poorly-documented',
    title: 'Poorly Documented Utility',
    description: 'An example of poorly documented code with minimal comments and unclear structure. Shows how AI handles low-quality input.',
    language: 'javascript',
    docType: 'README',
    code: `function calc(a,b,c){
if(!a)return 0
let x=a*b
if(c){x=x/c}
return Math.round(x*100)/100
}

const proc=async(data)=>{
const res=[]
for(let i=0;i<data.length;i++){
let item=data[i]
if(item.type=='A'){
res.push({val:calc(item.x,item.y,item.z),status:'ok'})
}else{
res.push({val:item.x+item.y,status:'pending'})
}
}
return res
}

class H{
constructor(opts){
this.cfg=opts||{}
this.data=[]
}
add(item){this.data.push(item)}
get(){return this.data}
clear(){this.data=[]}
process(){
return proc(this.data).then(r=>{
this.results=r
return r
})
}
}

const x={init:function(c){this.config=c;this.handler=new H(c);},run:async function(d){await this.handler.add(d);return this.handler.process()}}

module.exports=x`
  }
];
