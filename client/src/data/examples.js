// Curated code examples for demonstration purposes
export const codeExamples = [
  {
    id: 'simple-function',
    title: 'Simple Utility Function',
    description: 'A basic JavaScript function that calculates discounted prices. Great for demonstrating JSDoc generation.',
    language: 'javascript',
    docType: 'JSDOC',
    code: `// Calculate the final price after applying a discount
function calculateDiscount(price, discountPercent) {
  if (price < 0 || discountPercent < 0 || discountPercent > 100) {
    throw new Error('Invalid input parameters');
  }

  const discount = (price * discountPercent) / 100;
  return price - discount;
}

// Calculate total with tax
function calculateTotal(subtotal, taxRate = 0.08) {
  const tax = subtotal * taxRate;
  return subtotal + tax;
}

// Format currency for display
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

module.exports = { calculateDiscount, calculateTotal, formatCurrency };`
  },
  {
    id: 'react-component',
    title: 'React Component',
    description: 'A reusable React card component with props. Perfect for showing component documentation with prop types.',
    language: 'javascript',
    docType: 'JSDOC',
    code: `import React from 'react';
import PropTypes from 'prop-types';

// UserCard component displays user information in a card format
function UserCard({ name, email, avatar, role, onEdit, onDelete }) {
  return (
    <div className="user-card">
      <div className="user-card__header">
        <img src={avatar} alt={\`\${name}'s avatar\`} className="user-card__avatar" />
        <div className="user-card__info">
          <h3 className="user-card__name">{name}</h3>
          <span className="user-card__role">{role}</span>
        </div>
      </div>

      <div className="user-card__body">
        <p className="user-card__email">{email}</p>
      </div>

      <div className="user-card__actions">
        <button onClick={() => onEdit(name)} className="btn btn--primary">
          Edit
        </button>
        <button onClick={() => onDelete(name)} className="btn btn--danger">
          Delete
        </button>
      </div>
    </div>
  );
}

UserCard.propTypes = {
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  avatar: PropTypes.string.isRequired,
  role: PropTypes.string,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

UserCard.defaultProps = {
  role: 'User',
  onEdit: () => {},
  onDelete: () => {},
};

export default UserCard;`
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
    id: 'typescript-class',
    title: 'TypeScript Service Class',
    description: 'A TypeScript service class with interfaces and type annotations. Shows how AI handles TypeScript documentation.',
    language: 'javascript',
    docType: 'README',
    code: `// Authentication service for user management
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthToken {
  token: string;
  expiresAt: Date;
  refreshToken: string;
}

class AuthService {
  private tokenCache: Map<string, AuthToken>;
  private readonly tokenExpiry: number = 3600000; // 1 hour in ms

  constructor() {
    this.tokenCache = new Map();
  }

  // Authenticate user with email and password
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    const { email, password } = credentials;

    // Validate credentials format
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Authenticate with backend
    const user = await this.authenticateUser(email, password);

    // Generate tokens
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);
    const expiresAt = new Date(Date.now() + this.tokenExpiry);

    const authToken: AuthToken = {
      token,
      expiresAt,
      refreshToken
    };

    // Cache the token
    this.tokenCache.set(user.id, authToken);

    return authToken;
  }

  // Verify if a token is valid and not expired
  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = this.decodeToken(token);

      // Check if token is expired
      if (decoded.expiresAt < new Date()) {
        return null;
      }

      // Fetch user from cache or database
      const user = await this.getUserById(decoded.userId);
      return user;
    } catch (error) {
      return null;
    }
  }

  // Refresh an expired token using refresh token
  async refreshToken(refreshToken: string): Promise<AuthToken> {
    const decoded = this.decodeToken(refreshToken);
    const user = await this.getUserById(decoded.userId);

    if (!user) {
      throw new Error('Invalid refresh token');
    }

    return this.login({ email: user.email, password: '' });
  }

  // Logout user and invalidate tokens
  async logout(userId: string): Promise<void> {
    this.tokenCache.delete(userId);
  }

  private async authenticateUser(email: string, password: string): Promise<User> {
    // Implementation would verify against database
    throw new Error('Not implemented');
  }

  private generateToken(user: User): string {
    // Implementation would use JWT or similar
    return 'token_' + user.id;
  }

  private generateRefreshToken(user: User): string {
    // Implementation would use JWT or similar
    return 'refresh_' + user.id;
  }

  private decodeToken(token: string): any {
    // Implementation would decode JWT
    return { userId: '123', expiresAt: new Date() };
  }

  private async getUserById(userId: string): Promise<User | null> {
    // Implementation would fetch from database
    return null;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default AuthService;`
  },
  {
    id: 'python-flask-api',
    title: 'Python Flask API',
    description: 'A Flask REST API with database models and authentication. Perfect example of Python documentation generation.',
    language: 'python',
    docType: 'API',
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
  }
];
