import { students, subjects, concepts, assignedTests, getRetentionLevel } from '../data/mockData';

// Static Results for "Old" static feel
const staticResults = [
    {
        id: '1',
        studentEmail: 'aarav@college.edu',
        studentName: 'Aarav Sharma',
        testId: '1',
        testName: 'Data Structures Midterm',
        score: 95,
        totalQuestions: 10,
        timestamp: '2026-02-15T10:00:00Z',
        aiDrawbacks: 'Slight delay in solving Graph traversal problems.',
        aiSolutions: 'Practice more BFS/DFS on complex adjacency lists.',
        teacherFeedback: "Excellent work on Data Structures!"
    },
    {
        id: '2',
        studentEmail: 'priya@college.edu',
        studentName: 'Priya Patel',
        testId: '1',
        testName: 'Data Structures Midterm',
        score: 82,
        totalQuestions: 10,
        timestamp: '2026-02-15T11:00:00Z',
        aiDrawbacks: 'Confusion between Heap and Binary Search Tree properties.',
        aiSolutions: 'Review structural differences and extraction algorithms.',
        teacherFeedback: "Good attempt, focus more on graph algorithms."
    },
    {
        id: '3',
        studentEmail: 'vijay@student.edu',
        studentName: 'Vijay Kumar',
        testId: '1',
        testName: 'Data Structures Midterm',
        score: 88,
        totalQuestions: 10,
        timestamp: '2026-02-20T09:00:00Z',
        aiDrawbacks: 'Inconsistent time complexity analysis for recursive functions.',
        aiSolutions: 'Use the Master Theorem for quicker identification of Big O.',
        teacherFeedback: "Strong performance in basic data structures."
    },
    {
        id: '4',
        studentEmail: 'vijay@student.edu',
        studentName: 'Vijay Kumar',
        testId: '2',
        testName: 'Algorithms Baseline',
        score: 65,
        totalQuestions: 10,
        timestamp: '2026-03-01T14:00:00Z',
        aiDrawbacks: 'Difficulties in implementing dynamic programming memoization.',
        aiSolutions: 'Solve 10 baseline DP problems (Fibonacci, Knapsack) from scratch.',
        teacherFeedback: "Focus on Big O notation and sorting logic.",
        lateReason: "Had network connectivity issues during the scheduled time window."
    }
];

export const mockDb = {
    // Tests API
    getTests: async () => {
        const stored = localStorage.getItem('stored_tests');
        if (!stored) {
            localStorage.setItem('stored_tests', JSON.stringify(assignedTests));
            return Promise.resolve(assignedTests);
        }
        return Promise.resolve(JSON.parse(stored));
    },

    saveTest: async (test) => {
        const stored = localStorage.getItem('stored_tests');
        const tests = stored ? JSON.parse(stored) : [...assignedTests];
        
        // Update existing or add new
        const index = tests.findIndex(t => t.id === test.id);
        if (index >= 0) {
            tests[index] = test;
        } else {
            tests.push(test);
        }
        
        localStorage.setItem('stored_tests', JSON.stringify(tests));
        return Promise.resolve(test);
    },

    deleteTest: async (testId) => {
        const stored = localStorage.getItem('stored_tests');
        if (stored) {
            const tests = JSON.parse(stored);
            const filtered = tests.filter(t => t.id !== testId && t.id?.toString() !== testId?.toString());
            localStorage.setItem('stored_tests', JSON.stringify(filtered));
        }
        return Promise.resolve();
    },

    // Subjects API
    getSubjects: async () => {
        return Promise.resolve(subjects);
    },

    saveSubject: async (subject) => {
        return Promise.resolve(subject);
    },

    deleteSubject: async (id) => {
        return Promise.resolve();
    },

    // Concepts API
    getConcepts: async () => {
        return Promise.resolve(concepts);
    },

    saveConcept: async (concept) => {
        return Promise.resolve(concept);
    },

    deleteConcept: async (id) => {
        return Promise.resolve();
    },

    // Students API
    getStudents: async () => {
        return Promise.resolve(students);
    },

    saveStudent: async (student) => {
        return Promise.resolve(student);
    },

    deleteStudent: async (id) => {
        return Promise.resolve();
    },

    // Results API
    getResults: async () => {
        const stored = localStorage.getItem('stored_results');
        const results = stored ? JSON.parse(stored) : [];
        return Promise.resolve([...staticResults, ...results]);
    },

    saveResult: async (result) => {
        const stored = localStorage.getItem('stored_results');
        const results = stored ? JSON.parse(stored) : [];
        
        const resultWithId = { 
            ...result, 
            id: result.id || `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
        };
        
        results.push(resultWithId);
        localStorage.setItem('stored_results', JSON.stringify(results));
        return Promise.resolve(resultWithId);
    },

    getResultsByStudent: async (studentEmail) => {
        const results = staticResults.filter(r => r.studentEmail === studentEmail);
        return Promise.resolve(results);
    },

    updateResultFeedback: async (resultId, feedback) => {
        return Promise.resolve();
    },

    updateResultScore: async (resultId, newScore) => {
        return Promise.resolve();
    },

    deleteResult: async (resultId) => {
        return Promise.resolve();
    },

    // Seeding Utility (No-op in static mode)
    seedInitialData: async () => {
        console.log("Static mode: Skipping database seeding.");
        return Promise.resolve();
    }
};

export default mockDb;
