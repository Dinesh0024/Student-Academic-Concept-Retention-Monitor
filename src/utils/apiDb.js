import { auth } from '../firebase';

const getToken = async () => {
    if (sessionStorage.getItem('faculty_passkey_user')) {
        const passkeyToken = sessionStorage.getItem('token');
        if (passkeyToken) return passkeyToken;
    }
    if (auth.currentUser) return auth.currentUser.getIdToken();
    return sessionStorage.getItem('token') || localStorage.getItem('token');
};

const request = async (collection, id, options = {}) => {
    const token = await getToken();
    if (!token) throw new Error('Sign in again to connect to the database.');

    const suffix = id === undefined ? '' : `/${encodeURIComponent(id)}`;
    const response = await fetch(`/api/data/${collection}${suffix}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers
        }
    });
    const result = response.status === 204 ? null : await response.json();
    if (!response.ok) throw new Error(result?.error || 'Database request failed.');
    return result;
};

const list = (collection, query = '') => request(`${collection}${query}`);
const insert = (collection, record) => request(collection, undefined, {
    method: 'POST',
    body: JSON.stringify(record)
});
const save = async (collection, record) => record.id
    ? request(collection, record.id, { method: 'PUT', body: JSON.stringify(record) })
    : insert(collection, record);
const remove = (collection, id) => request(collection, id, { method: 'DELETE' });

const createStudentAccount = async (student) => {
    const token = await getToken();
    if (!token) throw new Error('Sign in again to create student accounts.');

    const response = await fetch('/api/auth/students', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(student)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not create the student account.');
    return result;
};

export const apiDb = {
    getTests: () => list('tests'),
    saveTest: (test) => save('tests', test),
    deleteTest: (id) => remove('tests', id),

    getSubjects: () => list('subjects'),
    saveSubject: (subject) => save('subjects', subject),
    deleteSubject: (id) => remove('subjects', id),

    getConcepts: () => list('concepts'),
    saveConcept: (concept) => save('concepts', concept),
    deleteConcept: (id) => remove('concepts', id),

    getStudents: () => list('students'),
    createStudentAccount,
    saveStudent: (student) => save('students', student),
    deleteStudent: (id) => remove('students', id),

    getResults: () => list('results'),
    saveResult: (result) => insert('results', result),
    getResultsByStudent: (studentEmail) => list(`results?studentEmail=${encodeURIComponent(studentEmail)}`),
    updateResultFeedback: (id, feedback, facultyName) => request('results', id, {
        method: 'PUT', body: JSON.stringify({ teacherFeedback: feedback, facultyName })
    }),
    updateStudentTestFeedback: (id, feedback) => request('results', id, {
        method: 'PUT', body: JSON.stringify({ studentFeedback: feedback })
    }),
    updateResultScore: (id, score) => request('results', id, {
        method: 'PUT', body: JSON.stringify({ score })
    }),
    deleteResult: (id) => remove('results', id),
    markFeedbackAsRead: async (studentEmail) => {
        const results = await apiDb.getResultsByStudent(studentEmail);
        await Promise.all(results
            .filter((result) => result.teacherFeedback && !result.isFeedbackRead)
            .map((result) => request('results', result.id, {
                method: 'PUT', body: JSON.stringify({ isFeedbackRead: true })
            })));
    },
    getUnreadFeedbackCount: async (studentEmail) => {
        const results = await apiDb.getResultsByStudent(studentEmail);
        return results.filter((result) => result.teacherFeedback && !result.isFeedbackRead).length;
    },
    seedInitialData: async () => undefined
};

export const mockDb = apiDb;
export default apiDb;
