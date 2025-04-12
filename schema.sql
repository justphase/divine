-- Create database
CREATE DATABASE IF NOT EXISTS aice_events;
USE aice_events;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create events table
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
);

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY user_event (user_id, event_id)
);

-- Insert demo admin user
INSERT INTO users (name, email, password, role)
VALUES ('Admin', 'admin@aice.edu', '$2b$10$FxCJ7gYBRvONF4O4YjugDOxYwBTNbgbh1SkdASv5PpdspMGPxs.Cu', 'admin');
-- Password is 'admin123'

-- Insert sample events
INSERT INTO events (title, description, date, time, location, category, capacity, creator_id)
VALUES
('Tech Hackathon 2025', 'A 24-hour hackathon for tech enthusiasts.', '2025-04-15', '09:00:00', 'Main Auditorium', 'Technology', 100, 1),
('Cultural Festival', 'Annual cultural festival celebrating diversity.', '2025-04-20', '17:00:00', 'College Grounds', 'Cultural', 500, 1),
('Workshop on AI', 'Learn about the latest developments in AI.', '2025-04-25', '14:00:00', 'CS Department', 'Academic', 50, 1),
('Alumni Meetup', 'Connect with college alumni.', '2025-05-05', '18:00:00', 'Conference Hall', 'Networking', 200, 1),
('Sports Tournament', 'Inter-college sports competition.', '2025-05-10', '10:00:00', 'Sports Complex', 'Sports', 300, 1);