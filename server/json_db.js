const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

class JsonDatabase {
    constructor() {
        this.data = this.load();
    }

    load() {
        if (!fs.existsSync(DB_FILE)) {
            const initialData = {
                students: [],
                faculty: [],
                subjects: [],
                concepts: [],
                questions: [],
                tests: [],
                test_attempts: [],
                student_answers: [],
                student_concept_performance: [],
                retention_scores: [],
                notifications: []
            };
            this.save(initialData);
            return initialData;
        }
        try {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        } catch (err) {
            console.error('Error loading JSON DB:', err);
            return {};
        }
    }

    save(data) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data || this.data, null, 2));
    }

    async query(text, params = []) {
        // console.log('Mock Query:', text, params);
        const query = text.trim().toLowerCase();

        // SELECT * FROM table WHERE col = $1 OR col2 = $2
        if (query.startsWith('select')) {
            return this.handleSelect(query, params);
        }
        
        // INSERT INTO table (cols) VALUES ($1, $2) RETURNING *
        if (query.startsWith('insert into')) {
            return this.handleInsert(query, params);
        }

        // UPDATE table SET col = $1 WHERE id = $2
        if (query.startsWith('update')) {
            return this.handleUpdate(query, params);
        }

        // DELETE FROM table WHERE id = $1
        if (query.startsWith('delete')) {
            return this.handleDelete(query, params);
        }

        return { rows: [] };
    }

    handleSelect(query, params) {
        // Specific complex query handling for /api/results
        if (query.includes('from test_attempts ta') && query.includes('join students s') && query.includes('join tests t')) {
            const attempts = this.data.test_attempts || [];
            const students = this.data.students || [];
            const tests = this.data.tests || [];

            return {
                rows: attempts
                    .filter(ta => ta.completed_at !== null)
                    .map(ta => {
                        const student = students.find(s => s.id == ta.student_id) || {};
                        const test = tests.find(t => t.id == ta.test_id) || {};
                        return {
                            id: ta.id,
                            score: ta.score,
                            teacherFeedback: ta.teacher_feedback,
                            aiDrawbacks: ta.ai_drawbacks,
                            aiSolutions: ta.ai_solutions,
                            timestamp: ta.completed_at,
                            studentName: student.name || 'Unknown Student',
                            studentEmail: student.email || 'unknown@example.com',
                            testName: test.name || 'Unknown Assessment'
                        };
                    })
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            };
        }

        const tableMatch = query.match(/from\s+([a-z_]+)/);
        if (!tableMatch) return { rows: [] };
        const table = tableMatch[1];
        let rows = this.data[table] || [];

        // Simple WHERE support (very limited regex)
        const whereMatch = query.match(/where\s+(.+)$/);
        if (whereMatch) {
            const whereClause = whereMatch[1].split('order by')[0].trim();
            // Handle common patterns: email = $1, id = $1, email = $1 or enrollment_no = $2
            rows = rows.filter(row => {
                // This is a naive implementation for the specific queries in the app
                if (whereClause.includes('email = $1 or enrollment_no = $2')) {
                    return row.email === params[0] || row.enrollment_no === params[1];
                }
                if (whereClause.includes('email = $1')) {
                    return row.email === params[0];
                }
                if (whereClause.includes('id = $1')) {
                    return row.id == params[0];
                }
                return true; 
            });
        }

        // Simple ORDER BY support
        if (query.includes('order by created_at desc')) {
            rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        return { rows };
    }

    handleInsert(query, params) {
        const tableMatch = query.match(/insert into\s+([a-z_]+)\s*\(([^)]+)\)/);
        if (!tableMatch) return { rows: [] };
        const table = tableMatch[1];
        const cols = tableMatch[2].split(',').map(c => c.trim());
        
        const newRow = { id: (this.data[table]?.length || 0) + 1, created_at: new Date().toISOString() };
        cols.forEach((col, i) => {
            newRow[col] = params[i];
        });

        if (!this.data[table]) this.data[table] = [];
        this.data[table].push(newRow);
        this.save();
        return { rows: [newRow] };
    }

    handleUpdate(query, params) {
        const tableMatch = query.match(/update\s+([a-z_]+)/);
        if (!tableMatch) return { rows: [] };
        const table = tableMatch[1];
        
        // Naive update for students/faculty
        const idParam = params[params.length - 1]; // Assuming ID is the last param
        const index = this.data[table]?.findIndex(r => r.id == idParam);
        if (index === -1) return { rows: [] };

        // Very basic set logic
        const setMatch = query.match(/set\s+(.+)\s+where/);
        if (setMatch) {
            const pairs = setMatch[1].split(',').map(p => p.trim());
            pairs.forEach((pair, i) => {
                const col = pair.split('=')[0].trim();
                this.data[table][index][col] = params[i];
            });
        }

        this.save();
        return { rows: [this.data[table][index]] };
    }

    handleDelete(query, params) {
        const tableMatch = query.match(/from\s+([a-z_]+)/);
        if (!tableMatch) return { rows: [] };
        const table = tableMatch[1];
        const id = params[0];

        const index = this.data[table]?.findIndex(r => r.id == id);
        if (index === -1) return { rows: [] };

        const deleted = this.data[table].splice(index, 1);
        this.save();
        return { rows: deleted };
    }

    on(event, handler) {
        // Mock event emitter
    }

    async end() {
        this.save();
    }
}

module.exports = new JsonDatabase();
