-- Student Academic Concept Retention Monitor
-- PostgreSQL Schema (Overhauled)

-- Clean slate for overhaul
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS student_answers CASCADE;
DROP TABLE IF EXISTS test_attempts CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS student_concept_performance CASCADE;
DROP TABLE IF EXISTS retention_scores CASCADE;
DROP TABLE IF EXISTS concepts CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Faculty/Admin management
CREATE TABLE faculty (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  designation VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Students management
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  enrollment_no VARCHAR(50) UNIQUE,
  department VARCHAR(100),
  semester INTEGER DEFAULT 1,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  department VARCHAR(100),
  semester INTEGER
);

CREATE TABLE IF NOT EXISTS concepts (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT
);

-- AI Question Bank
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  concept_id INTEGER REFERENCES concepts(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL,
  difficulty_level VARCHAR(20) DEFAULT 'Medium', -- Easy, Medium, Hard
  created_at TIMESTAMP DEFAULT NOW()
);

-- Test Management
CREATE TABLE IF NOT EXISTS tests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  concept_id INTEGER REFERENCES concepts(id) ON DELETE CASCADE,
  num_questions INTEGER NOT NULL,
  marks_per_question INTEGER DEFAULT 1,
  difficulty_level VARCHAR(20) DEFAULT 'Medium',
  duration_mins INTEGER NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'Scheduled', -- Scheduled, Active, Completed, Draft
  created_at TIMESTAMP DEFAULT NOW()
);

-- Student attempts for tests
CREATE TABLE IF NOT EXISTS test_attempts (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Individual question results
CREATE TABLE IF NOT EXISTS student_answers (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  selected_option CHAR(1),
  is_correct BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Concept Retention mapping
CREATE TABLE IF NOT EXISTS student_concept_performance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  concept_id INTEGER REFERENCES concepts(id) ON DELETE CASCADE,
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  test_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retention_scores (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  level VARCHAR(20) NOT NULL,
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  user_role VARCHAR(20) NOT NULL, -- 'student' or 'faculty'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_retention_student ON retention_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_retention_subject ON retention_scores(subject_id);
CREATE INDEX IF NOT EXISTS idx_performance_student ON student_concept_performance(student_id);
CREATE INDEX IF NOT EXISTS idx_performance_concept ON student_concept_performance(concept_id);
CREATE INDEX IF NOT EXISTS idx_tests_subject ON tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON test_attempts(student_id);
