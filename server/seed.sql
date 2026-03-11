-- Seed Data for Demo (Overhauled)

-- Faculty (password: admin123)
-- Hash for 'admin123': $2a$10$XK0BjJjK4xH.VP5oJy9P8uL6dVR8OjxC3h7w5vQ2i9rmG1e3PVXKK
INSERT INTO faculty (name, email, password_hash) VALUES
('Dr. Smith', 'smith@college.edu', '$2a$10$XK0BjJjK4xH.VP5oJy9P8uL6dVR8OjxC3h7w5vQ2i9rmG1e3PVXKK'),
('Prof. Johnson', 'johnson@college.edu', '$2a$10$XK0BjJjK4xH.VP5oJy9P8uL6dVR8OjxC3h7w5vQ2i9rmG1e3PVXKK')
ON CONFLICT (email) DO NOTHING;

-- Students (password: student123)
-- Hash for 'student123': $2a$10$7R6W.M1B4LzV8Y8p8m8O0.Y2H5T4U3R2Q1W0E9R8T7Y6U5I4O3P2
INSERT INTO students (name, email, enrollment_no, department, semester, password_hash) VALUES
('Aarav Sharma', 'aarav@college.edu', 'CS2024001', 'Computer Science', 4, '$2a$10$7R6W.M1B4LzV8Y8p8m8O0.Y2H5T4U3R2Q1W0E9R8T7Y6U5I4O3P2'),
('Priya Patel', 'priya@college.edu', 'CS2024002', 'Computer Science', 4, '$2a$10$7R6W.M1B4LzV8Y8p8m8O0.Y2H5T4U3R2Q1W0E9R8T7Y6U5I4O3P2'),
('Rohan Gupta', 'rohan@college.edu', 'EC2024003', 'Electronics', 3, '$2a$10$7R6W.M1B4LzV8Y8p8m8O0.Y2H5T4U3R2Q1W0E9R8T7Y6U5I4O3P2')
ON CONFLICT (email) DO NOTHING;

-- Subjects
INSERT INTO subjects (name, code, department, semester) VALUES
('Data Structures', 'CS301', 'Computer Science', 3),
('Algorithms', 'CS302', 'Computer Science', 3),
('Database Systems', 'CS401', 'Computer Science', 4)
ON CONFLICT (code) DO NOTHING;

-- Concepts
INSERT INTO concepts (subject_id, name, description) VALUES
(1, 'Arrays & Linked Lists', 'Linear data structures'),
(1, 'Trees & Graphs', 'Non-linear data structures'),
(3, 'SQL Queries', 'Structured query language')
ON CONFLICT DO NOTHING;

-- Sample Questions
INSERT INTO questions (concept_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty_level) VALUES
(1, 'What is the time complexity of accessing an element in an array by index?', 'O(1)', 'O(n)', 'O(log n)', 'O(n^2)', 'A', 'Easy'),
(1, 'Which data structure uses LIFO principle?', 'Queue', 'Stack', 'Linked List', 'Array', 'B', 'Easy'),
(3, 'Which SQL command is used to retrieve data from a database?', 'INSERT', 'UPDATE', 'SELECT', 'DELETE', 'C', 'Easy');

-- Sample Scheduled Test
INSERT INTO tests (name, subject_id, concept_id, num_questions, marks_per_question, difficulty_level, duration_mins, start_time, end_time, status) VALUES
('DS Basics Quiz', 1, 1, 10, 1, 'Easy', 15, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 1 hour', 'Scheduled'),
('Database Query Test', 3, 3, 20, 1, 'Medium', 30, NOW() - INTERVAL '1 hour', NOW() + INTERVAL '1 hour', 'Active');
