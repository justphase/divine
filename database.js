const mysql = require('mysql2/promise');

// Database connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'aice_events',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize database
const initDb = async () => {
    try {
        const connection = await pool.getConnection();
        
        // Create users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create events table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(100) NOT NULL,
                description TEXT,
                date DATE NOT NULL,
                time TIME NOT NULL,
                location VARCHAR(100) NOT NULL,
                category VARCHAR(50),
                capacity INT DEFAULT 50,
                creator_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        // Create registrations table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS registrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                event_id INT NOT NULL,
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                UNIQUE KEY user_event (user_id, event_id)
            )
        `);
        
        connection.release();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
};

// Call initDb on startup
initDb();

// User methods
const createUser = async (name, email, password) => {
    try {
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, password]
        );
        return result.insertId;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

const getUserByEmail = async (email) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    } catch (error) {
        console.error('Error getting user by email:', error);
        throw error;
    }
};

const getUserById = async (id) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    } catch (error) {
        console.error('Error getting user by id:', error);
        throw error;
    }
};

// Event methods
const createEvent = async (title, description, date, time, location, category, capacity, creatorId) => {
    try {
        const [result] = await pool.execute(
            'INSERT INTO events (title, description, date, time, location, category, capacity, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, date, time, location, category, capacity, creatorId]
        );
        return result.insertId;
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
};

const getAllEvents = async () => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.*, u.name as creator_name, 
            (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registration_count
            FROM events e
            JOIN users u ON e.creator_id = u.id
            ORDER BY e.date ASC, e.time ASC
        `);
        return rows;
    } catch (error) {
        console.error('Error getting all events:', error);
        throw error;
    }
};

const getEventById = async (id) => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.*, u.name as creator_name,
            (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registration_count
            FROM events e
            JOIN users u ON e.creator_id = u.id
            WHERE e.id = ?
        `, [id]);
        return rows[0];
    } catch (error) {
        console.error('Error getting event by id:', error);
        throw error;
    }
};

const updateEvent = async (id, title, description, date, time, location, category, capacity) => {
    try {
        await pool.execute(`
            UPDATE events
            SET title = ?, description = ?, date = ?, time = ?, location = ?, category = ?, capacity = ?
            WHERE id = ?
        `, [title, description, date, time, location, category, capacity, id]);
        return true;
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
};

const deleteEvent = async (id) => {
    try {
        await pool.execute('DELETE FROM events WHERE id = ?', [id]);
        return true;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
};

// Registration methods
const registerForEvent = async (userId, eventId) => {
    try {
        await pool.execute(
            'INSERT INTO registrations (user_id, event_id) VALUES (?, ?)',
            [userId, eventId]
        );
        return true;
    } catch (error) {
        console.error('Error registering for event:', error);
        throw error;
    }
};

const checkRegistration = async (userId, eventId) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM registrations WHERE user_id = ? AND event_id = ?',
            [userId, eventId]
        );
        return rows.length > 0;
    } catch (error) {
        console.error('Error checking registration:', error);
        throw error;
    }
};

const getEventRegistrationsCount = async (eventId) => {
    try {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM registrations WHERE event_id = ?',
            [eventId]
        );
        return rows[0].count;
    } catch (error) {
        console.error('Error getting registration count:', error);
        throw error;
    }
};

const getEventRegistrations = async (eventId) => {
    try {
        const [rows] = await pool.execute(`
            SELECT r.id, r.registered_at, u.id as user_id, u.name, u.email
            FROM registrations r
            JOIN users u ON r.user_id = u.id
            WHERE r.event_id = ?
            ORDER BY r.registered_at ASC
        `, [eventId]);
        return rows;
    } catch (error) {
        console.error('Error getting event registrations:', error);
        throw error;
    }
};

const getUserEvents = async (userId) => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.*, u.name as creator_name, r.registered_at
            FROM registrations r
            JOIN events e ON r.event_id = e.id
            JOIN users u ON e.creator_id = u.id
            WHERE r.user_id = ?
            ORDER BY e.date ASC, e.time ASC
        `, [userId]);
        return rows;
    } catch (error) {
        console.error('Error getting user events:', error);
        throw error;
    }
};

module.exports = {
    createUser,
    getUserByEmail,
    getUserById,
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    registerForEvent,
    checkRegistration,
    getEventRegistrationsCount,
    getEventRegistrations,
    getUserEvents
};