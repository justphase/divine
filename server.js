const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./database');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('frontend'));

// JWT secret
const JWT_SECRET = 'aice-event-management-secret';

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Routes
// User registration
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const userId = await db.createUser(name, email, hashedPassword);
        
        // Generate token
        const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '24h' });
        
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: userId, name, email }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Get user
        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Generate token
        const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '24h' });
        
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all events
app.get('/api/events', async (req, res) => {
    try {
        const events = await db.getAllEvents();
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get event by ID
app.get('/api/events/:id', async (req, res) => {
    try {
        const event = await db.getEventById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create event (protected)
app.post('/api/events', authenticateToken, async (req, res) => {
    try {
        const { title, description, date, time, location, category, capacity } = req.body;
        const userId = req.user.id;
        
        const eventId = await db.createEvent(
            title, 
            description, 
            date, 
            time, 
            location, 
            category, 
            capacity, 
            userId
        );
        
        res.status(201).json({
            message: 'Event created successfully',
            eventId
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update event (protected)
app.put('/api/events/:id', authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;
        
        // Check if user is the event creator
        const event = await db.getEventById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        if (event.creator_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this event' });
        }
        
        const { title, description, date, time, location, category, capacity } = req.body;
        
        await db.updateEvent(
            eventId,
            title, 
            description, 
            date, 
            time, 
            location, 
            category, 
            capacity
        );
        
        res.json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete event (protected)
app.delete('/api/events/:id', authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;
        
        // Check if user is the event creator
        const event = await db.getEventById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        if (event.creator_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this event' });
        }
        
        await db.deleteEvent(eventId);
        
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Register for event (protected)
app.post('/api/events/:id/register', authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;
        
        // Check if event exists
        const event = await db.getEventById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Check if already registered
        const isRegistered = await db.checkRegistration(userId, eventId);
        if (isRegistered) {
            return res.status(400).json({ message: 'Already registered for this event' });
        }
        
        // Check capacity
        const registrations = await db.getEventRegistrationsCount(eventId);
        if (registrations >= event.capacity) {
            return res.status(400).json({ message: 'Event is at full capacity' });
        }
        
        // Register user
        await db.registerForEvent(userId, eventId);
        
        res.status(201).json({ message: 'Successfully registered for event' });
    } catch (error) {
        console.error('Error registering for event:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's registered events (protected)
app.get('/api/user/events', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const events = await db.getUserEvents(userId);
        
        res.json(events);
    } catch (error) {
        console.error('Error fetching user events:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get event registrations (protected, for event creators)
app.get('/api/events/:id/registrations', authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;
        
        // Check if user is the event creator
        const event = await db.getEventById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        if (event.creator_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to view registrations' });
        }
        
        const registrations = await db.getEventRegistrations(eventId);
        
        res.json(registrations);
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;