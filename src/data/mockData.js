export const students = [
    { id: 1, name: 'Aarav Sharma', email: 'aarav@college.edu', enrollment: 'CS2024001', department: 'Computer Science', semester: 4, retentionScore: 92, avatar: '👨‍🎓', weakConcepts: [6] },
    { id: 2, name: 'Priya Patel', email: 'priya@college.edu', enrollment: 'CS2024002', department: 'Computer Science', semester: 4, retentionScore: 87, avatar: '👩‍🎓', weakConcepts: [10] },
    { id: 3, name: 'Rohan Gupta', email: 'rohan@college.edu', enrollment: 'EC2024003', department: 'Electronics', semester: 3, retentionScore: 74, avatar: '👨‍🎓', weakConcepts: [7, 14] },
    { id: 4, name: 'Ananya Singh', email: 'ananya@college.edu', enrollment: 'ME2024004', department: 'Mechanical', semester: 5, retentionScore: 65, avatar: '👩‍🎓', weakConcepts: [6, 12, 14] },
    { id: 5, name: 'Vikram Reddy', email: 'vikram@college.edu', enrollment: 'CS2024005', department: 'Computer Science', semester: 6, retentionScore: 95, avatar: '👨‍🎓', weakConcepts: [] },
    { id: 6, name: 'Sneha Iyer', email: 'sneha@college.edu', enrollment: 'IT2024006', department: 'Information Tech', semester: 4, retentionScore: 58, avatar: '👩‍🎓', weakConcepts: [6, 7, 10, 12] },
    { id: 7, name: 'Arjun Nair', email: 'arjun@college.edu', enrollment: 'CS2024007', department: 'Computer Science', semester: 3, retentionScore: 81, avatar: '👨‍🎓', weakConcepts: [7] },
    { id: 8, name: 'Divya Kulkarni', email: 'divya@college.edu', enrollment: 'EC2024008', department: 'Electronics', semester: 5, retentionScore: 43, avatar: '👩‍🎓', weakConcepts: [5, 6, 7, 12, 14] },
    { id: 9, name: 'Karan Mehta', email: 'karan@college.edu', enrollment: 'ME2024009', department: 'Mechanical', semester: 4, retentionScore: 71, avatar: '👨‍🎓', weakConcepts: [6, 12] },
    { id: 10, name: 'Ishita Das', email: 'ishita@college.edu', enrollment: 'IT2024010', department: 'Information Tech', semester: 6, retentionScore: 89, avatar: '👩‍🎓', weakConcepts: [10] },
];

export const subjects = [
    { id: 1, name: 'Data Structures', code: 'CS301', department: 'Computer Science', semester: 3 },
    { id: 2, name: 'Algorithms', code: 'CS302', department: 'Computer Science', semester: 3 },
    { id: 3, name: 'Database Systems', code: 'CS401', department: 'Computer Science', semester: 4 },
    { id: 4, name: 'Operating Systems', code: 'CS402', department: 'Computer Science', semester: 4 },
    { id: 5, name: 'Computer Networks', code: 'CS501', department: 'Computer Science', semester: 5 },
    { id: 6, name: 'Digital Electronics', code: 'EC301', department: 'Electronics', semester: 3 },
    { id: 7, name: 'Signal Processing', code: 'EC401', department: 'Electronics', semester: 4 },
    { id: 8, name: 'Thermodynamics', code: 'ME301', department: 'Mechanical', semester: 3 },
    { id: 9, name: 'Artificial Intelligence', code: 'CS601', department: 'Computer Science', semester: 6 },
    { id: 10, name: 'Machine Learning', code: 'CS602', department: 'Computer Science', semester: 6 },
    { id: 11, name: 'Software Engineering', code: 'CS403', department: 'Computer Science', semester: 4 },
    { id: 12, name: 'Discrete Mathematics', code: 'MA201', department: 'Mathematics', semester: 2 },
    { id: 13, name: 'Computer Architecture', code: 'CS303', department: 'Computer Science', semester: 3 },
    { id: 14, name: 'Compiler Design', code: 'CS502', department: 'Computer Science', semester: 5 },
    { id: 15, name: 'Embedded Systems', code: 'EC501', department: 'Electronics', semester: 5 },
    { id: 16, name: 'Control Systems', code: 'EC402', department: 'Electronics', semester: 4 },
    { id: 17, name: 'Fluid Mechanics', code: 'ME302', department: 'Mechanical', semester: 3 },
    { id: 18, name: 'Structural Analysis', code: 'CE301', department: 'Civil', semester: 3 },
];

export const concepts = [
    { id: 1, subjectId: 1, name: 'Arrays & Linked Lists', description: 'Linear data structures', mastery: 88 },
    { id: 2, subjectId: 1, name: 'Trees & Graphs', description: 'Non-linear data structures', mastery: 72 },
    { id: 3, subjectId: 1, name: 'Hash Tables', description: 'Key-value pair storage', mastery: 91 },
    { id: 4, subjectId: 1, name: 'Stacks & Queues', description: 'LIFO and FIFO structures', mastery: 95 },
    { id: 5, subjectId: 2, name: 'Sorting Algorithms', description: 'Comparison and distribution sorts', mastery: 76 },
    { id: 6, subjectId: 2, name: 'Dynamic Programming', description: 'Optimal substructure problems', mastery: 45 },
    { id: 7, subjectId: 2, name: 'Graph Algorithms', description: 'BFS, DFS, shortest paths', mastery: 62 },
    { id: 8, subjectId: 3, name: 'SQL Queries', description: 'Structured query language', mastery: 89 },
    { id: 9, subjectId: 3, name: 'Normalization', description: 'Database design principles', mastery: 67 },
    { id: 10, subjectId: 3, name: 'Indexing', description: 'Database optimization', mastery: 54 },
    { id: 11, subjectId: 4, name: 'Process Management', description: 'Scheduling and synchronization', mastery: 78 },
    { id: 12, subjectId: 4, name: 'Memory Management', description: 'Paging and segmentation', mastery: 41 },
    { id: 13, subjectId: 5, name: 'TCP/IP Protocol', description: 'Network communication', mastery: 83 },
    { id: 14, subjectId: 5, name: 'Network Security', description: 'Encryption and firewalls', mastery: 59 },
    { id: 15, subjectId: 6, name: 'Boolean Algebra', description: 'Logic gates and simplification', mastery: 65 },
    { id: 16, subjectId: 6, name: 'Combinational Logic', description: 'Multiplexers and decoders', mastery: 55 },
    { id: 17, subjectId: 7, name: 'Fourier Transforms', description: 'Frequency domain analysis', mastery: 40 },
    { id: 18, subjectId: 7, name: 'Z-Transforms', description: 'Discrete-time signals', mastery: 50 },
    { id: 19, subjectId: 8, name: 'Laws of Thermodynamics', description: 'Energy conservation and entropy', mastery: 70 },
    { id: 20, subjectId: 8, name: 'Heat Engines', description: 'Cycles and efficiency', mastery: 60 },
    { id: 21, subjectId: 9, name: 'Search Algorithms', description: 'A*, heuristic and uninformed search', mastery: 68 },
    { id: 22, subjectId: 9, name: 'Neural Networks', description: 'Perceptrons with backpropagation', mastery: 52 },
    { id: 23, subjectId: 10, name: 'Supervised Learning', description: 'Classification and regression models', mastery: 74 },
    { id: 24, subjectId: 10, name: 'Unsupervised Learning', description: 'Clustering and dimensionality reduction', mastery: 48 },
    { id: 25, subjectId: 11, name: 'Software Design Patterns', description: 'Creational, structural and behavioral patterns', mastery: 71 },
    { id: 26, subjectId: 11, name: 'Agile Methodologies', description: 'Scrum, Kanban and CI/CD practices', mastery: 80 },
    { id: 27, subjectId: 12, name: 'Graph Theory', description: 'Euler paths, Hamiltonian cycles and planarity', mastery: 58 },
    { id: 28, subjectId: 12, name: 'Propositional Logic', description: 'Truth tables, inference rules and proofs', mastery: 63 },
    { id: 29, subjectId: 13, name: 'Pipeline Architecture', description: 'Instruction pipelining and hazards', mastery: 66 },
    { id: 30, subjectId: 13, name: 'Cache Memory', description: 'Cache mapping, replacement and coherence', mastery: 57 },
    { id: 31, subjectId: 14, name: 'Lexical Analysis', description: 'Tokenization and regular expressions', mastery: 70 },
    { id: 32, subjectId: 14, name: 'Syntax Parsing', description: 'LL, LR parsers and parse trees', mastery: 44 },
    { id: 33, subjectId: 15, name: 'Microcontrollers', description: 'Architecture, I/O and programming', mastery: 62 },
    { id: 34, subjectId: 15, name: 'Real-Time Operating Systems', description: 'Task scheduling and interrupt handling', mastery: 49 },
    { id: 35, subjectId: 16, name: 'Transfer Functions', description: 'Laplace domain system modeling', mastery: 55 },
    { id: 36, subjectId: 16, name: 'Stability Analysis', description: 'Routh-Hurwitz and Nyquist criteria', mastery: 42 },
    { id: 37, subjectId: 17, name: 'Bernoulli\'s Principle', description: 'Pressure and velocity relationship in fluids', mastery: 67 },
    { id: 38, subjectId: 17, name: 'Viscous Flow', description: 'Laminar and turbulent flow analysis', mastery: 53 },
    { id: 39, subjectId: 18, name: 'Beam Analysis', description: 'Bending moments and shear force diagrams', mastery: 61 },
    { id: 40, subjectId: 18, name: 'Truss Structures', description: 'Method of joints and sections', mastery: 56 },
];

export const retentionTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    datasets: [
        {
            label: 'Average Retention',
            data: [68, 72, 71, 76, 79, 82, 85, 83],
            borderColor: '#007AFF',
            backgroundColor: 'rgba(0, 122, 255, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#007AFF',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
        },
    ],
};

export const subjectPerformanceData = {
    labels: ['Data Structures', 'Algorithms', 'Database', 'OS', 'Networks'],
    datasets: [
        {
            label: 'Avg Score',
            data: [86, 62, 70, 60, 71],
            backgroundColor: [
                'rgba(0, 122, 255, 0.8)',
                'rgba(88, 86, 214, 0.8)',
                'rgba(52, 199, 89, 0.8)',
                'rgba(255, 149, 0, 0.8)',
                'rgba(90, 200, 250, 0.8)',
            ],
            borderRadius: 8,
        },
    ],
};

export const studentActivityData = {
    labels: ['Excellent', 'Good', 'Moderate', 'Needs Improvement'],
    datasets: [
        {
            data: [3, 3, 2, 2],
            backgroundColor: [
                'rgba(52, 199, 89, 0.8)',
                'rgba(0, 122, 255, 0.8)',
                'rgba(255, 149, 0, 0.8)',
                'rgba(255, 59, 48, 0.8)',
            ],
            borderWidth: 0,
        },
    ],
};

export const testimonials = [
    {
        name: 'Dr. Rajesh Kumar',
        role: 'Professor, Computer Science',
        quote: 'This platform transformed how we track student understanding. The retention analytics helped us identify struggling students weeks earlier.',
        avatar: '👨‍🏫',
    },
    {
        name: 'Meera Joshi',
        role: 'Student, 4th Semester',
        quote: 'I can finally see which concepts I need to revisit. My grades improved significantly since using this tool.',
        avatar: '👩‍🎓',
    },
    {
        name: 'Prof. Sunita Rao',
        role: 'Dean of Academics',
        quote: 'The data-driven insights have become integral to our academic improvement strategy. Highly recommend for any institution.',
        avatar: '👩‍🏫',
    },
];

export const conceptInsights = {
    5: {
        fault: 'Struggling to compute Big O time complexity for different sorting algorithms. Often confuses merge sort with quick sort partitioning.',
        solution: 'Conduct tracing exercises where students must walk through arrays step-by-step for each algorithm and count the comparisons.',
    },
    6: {
        fault: 'Inability to identify overlapping subproblems and optimal substructure. Students often try to solve with greedy algorithms instead.',
        solution: 'Assign visual recursion tree exercises. Practice memoization technique on simple Fibonacci problems before moving to knapsack problems.',
    },
    7: {
        fault: 'Confusion between Breadth-First Search (BFS) and Depth-First Search (DFS) use cases. Poor understanding of cycle detection.',
        solution: 'Use interactive graph traversal visualizers. Assign small project to implement pathfinding in a maze using both algorithms.',
    },
    10: {
        fault: 'Creating indexes on every column without understanding B-Tree structure, leading to slow insert/update performance.',
        solution: 'Conduct a lab session analyzing query execution plans (EXPLAIN output). Show the tradeoff between read speed and write speed.',
    },
    12: {
        fault: 'Failing to grasp virtual versus physical memory mapping. Confusion regarding page faults and thrashing.',
        solution: 'Simulation assignment where students must implement a basic page replacement algorithm (LRU vs FIFO) and track page faults.',
    },
    14: {
        fault: 'Misunderstanding asymmetric encryption keys. Using symmetric keys where public key infrastructure (PKI) is required.',
        solution: 'Hands-on lab generating PGP keys and sending encrypted messages between paired students to solidify public/private key roles.',
    }
};

export const assignedTests = [
    { id: 1, name: 'Data Structures Midterm', subject: 'Data Structures', date: '2026-03-15', time: '10:00', duration: 60, status: 'Upcoming' },
    { id: 2, name: 'OS Memory Quiz', subject: 'Operating Systems', date: '2026-03-22', time: '14:00', duration: 45, status: 'Upcoming' }
];

export const getRetentionLevel = (score) => {
    if (score >= 90) return { label: 'Excellent', color: '#34C759', bg: 'rgba(52,199,89,0.1)' };
    if (score >= 70) return { label: 'Good', color: '#007AFF', bg: 'rgba(0,122,255,0.1)' };
    if (score >= 50) return { label: 'Moderate', color: '#FF9500', bg: 'rgba(255,149,0,0.1)' };
    return { label: 'Needs Improvement', color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' };
};
