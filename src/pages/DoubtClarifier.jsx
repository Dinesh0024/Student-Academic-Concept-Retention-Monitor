import mockDb from '../utils/apiDb';
import { useEffect, useMemo, useState } from 'react';
import { HiOutlineAcademicCap, HiOutlineArrowRight, HiOutlineCheckCircle, HiOutlineLightBulb, HiOutlineSparkles } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import { subjects as referenceSubjects, concepts as referenceConcepts } from '../data/mockData';

const KNOWLEDGE_BASE = {
    'Data Structures': {
        prompts: [
            'Why is a stack useful for recursion?',
            'What is the difference between DFS and BFS?',
            'How do I know when to use a queue?',
        ],
        answer: (question) => {
            const text = question.toLowerCase();

            if (text.includes('stack') || text.includes('recursion')) {
                return 'A stack follows Last In, First Out. Recursion uses the call stack, so every nested function call is pushed on top and removed after completion. This is why recursive problems work well with backtracking, expression evaluation, and depth-first traversal.';
            }

            if (text.includes('dfs') || text.includes('bfs') || text.includes('graph')) {
                return 'DFS explores as deep as possible before backtracking, while BFS explores level by level. Use DFS when you want to search a path or detect cycles; use BFS when you want the shortest path in an unweighted graph.';
            }

            if (text.includes('queue')) {
                return 'A queue follows First In, First Out. It is ideal when order matters, such as scheduling tasks, handling requests, or traversing a graph level by level.';
            }

            return 'In data structures, choose the structure based on the access pattern: stack for nested or reverse order, queue for ordered processing, and tree/graph for connected relationships. Try to map the problem to the time and space behavior before coding.';
        },
    },
    'Database Systems': {
        prompts: [
            'What is the difference between INNER JOIN and LEFT JOIN?',
            'Why do indexes improve query speed?',
            'How does normalization help a database?',
        ],
        answer: (question) => {
            const text = question.toLowerCase();

            if (text.includes('join')) {
                return 'An INNER JOIN returns only matching rows from both tables, while a LEFT JOIN returns all rows from the left table and matching rows from the right table, filling NULLs where no match exists. Use LEFT JOIN when you want to keep all records from the primary table.';
            }

            if (text.includes('index')) {
                return 'Indexes are like lookup tables that let the database find rows faster without scanning the whole table. They improve read-heavy queries, but too many indexes can slow down writes, so they should be used carefully.';
            }

            if (text.includes('normaliz')) {
                return 'Normalization reduces redundancy and keeps data consistent by organizing it into related tables. It helps avoid update, insert, and delete anomalies, although very highly normalized schemas can require more joins.';
            }

            return 'A strong database design balances normalization, query performance, and integrity. Focus on clear relationships, proper keys, and efficient indexing for the most frequent operations.';
        },
    },
    'Operating Systems': {
        prompts: [
            'What causes a deadlock?',
            'How does pagination help memory management?',
            'What is the difference between a process and a thread?',
        ],
        answer: (question) => {
            const text = question.toLowerCase();

            if (text.includes('deadlock')) {
                return 'A deadlock happens when two or more processes are waiting on each other forever because each is holding a resource the other needs. To avoid it, you can impose lock ordering, use timeouts, or limit resource allocation.';
            }

            if (text.includes('pagin') || text.includes('memory')) {
                return 'Paging divides memory into fixed-size pages and maps them to physical frames. It allows the OS to manage memory efficiently, swap processes in and out, and reduce fragmentation.';
            }

            if (text.includes('process') || text.includes('thread')) {
                return 'A process is an independent program in execution, while a thread is the smallest unit of execution within a process. Threads share memory space, which makes them lighter and faster to create than full processes.';
            }

            return 'Operating systems manage resources such as CPU, memory, and I/O by scheduling tasks, controlling access, and ensuring fairness. A good mental model is to think of the OS as the coordinator between programs and hardware.';
        },
    },
    'Machine Learning': {
        prompts: [
            'What is overfitting?',
            'How do I choose between precision and recall?',
            'Why is feature scaling important?',
        ],
        answer: (question) => {
            const text = question.toLowerCase();

            if (text.includes('overfit') || text.includes('underfit')) {
                return 'Overfitting means the model learns the training data too closely and fails to generalize to new data. Regularization, validation, and cross-validation help reduce this risk.';
            }

            if (text.includes('precision') || text.includes('recall')) {
                return 'Precision tells you how many predicted positives are actually correct, while recall tells you how many actual positives were found. Choose precision when false positives are expensive, and recall when missing positives is more costly.';
            }

            if (text.includes('scale') || text.includes('feature')) {
                return 'Feature scaling makes features comparable in magnitude, which helps algorithms such as logistic regression, SVMs, and neural networks train more smoothly and converge faster.';
            }

            return 'Machine learning is about building models that learn patterns from data while balancing bias, variance, and generalization. Start with a clear objective metric and check whether the model is solving the right problem.';
        },
    },
};

export default function DoubtClarifier() {
    const { user } = useAuth();
    const isFaculty = user?.role === 'faculty';
    const [subjects, setSubjects] = useState([]);
    const [concepts, setConcepts] = useState([]);
    const [subjectId, setSubjectId] = useState('');
    const [conceptId, setConceptId] = useState('');
    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [usingReferenceCatalog, setUsingReferenceCatalog] = useState(false);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [history, setHistory] = useState([]);

    useEffect(() => {
        let isMounted = true;
        Promise.all([mockDb.getSubjects(), mockDb.getConcepts()])
            .then(([subjectRecords, conceptRecords]) => {
                if (!isMounted) return;
                const useReferenceCatalog = subjectRecords.length === 0 && conceptRecords.length === 0;
                const availableSubjects = subjectRecords.length ? subjectRecords : referenceSubjects;
                const availableConcepts = conceptRecords.length || !useReferenceCatalog ? conceptRecords : referenceConcepts;
                setSubjects(availableSubjects);
                setConcepts(availableConcepts);
                setUsingReferenceCatalog(useReferenceCatalog);
                setSubjectId(availableSubjects[0]?.id?.toString() || '');
            })
            .catch((error) => {
                console.error('Failed to load QueryCoach catalog:', error);
            })
            .finally(() => {
                if (isMounted) setLoadingCatalog(false);
            });
        return () => { isMounted = false; };
    }, []);

    const selectedSubject = subjects.find(item => item.id?.toString() === subjectId);
    const subjectConcepts = useMemo(() => concepts.filter((concept) =>
        (concept.subjectId ?? concept.subject_id)?.toString() === subjectId
    ), [concepts, subjectId]);
    const selectedConcept = subjectConcepts.find(item => item.id?.toString() === conceptId);
    const currentPrompts = useMemo(() => {
        const subjectPrompts = KNOWLEDGE_BASE[selectedSubject?.name]?.prompts || [];
        const conceptPrompts = selectedConcept ? [
            `Explain ${selectedConcept.name} with a practical example.`,
            `What common misconception should I address when teaching ${selectedConcept.name}?`,
            `How can I check whether learners understand ${selectedConcept.name}?`,
        ] : [];
        return [...new Set([...conceptPrompts, ...subjectPrompts])].slice(0, 6);
    }, [selectedConcept, selectedSubject]);

    const handleSubjectChange = (value) => {
        setSubjectId(value);
        setConceptId('');
        setAnswer('');
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const trimmed = question.trim();

        if (!trimmed) return;

        const subjectName = selectedSubject?.name || 'the selected subject';
        const conceptName = selectedConcept?.name;
        const subjectKnowledge = KNOWLEDGE_BASE[selectedSubject?.name];
        const response = subjectKnowledge
            ? subjectKnowledge.answer(trimmed)
            : conceptName
                ? `${conceptName} is a key concept in ${subjectName}. Start by identifying its core principle, then connect it to a worked example and explain when that principle is useful. To check understanding, ask learners to apply it to a new case and justify each step.`
                : `For ${subjectName}, begin with the core principle behind your question, connect it to a concrete example, and then show how it applies in a new situation. If you select a concept, QueryCoach can anchor the explanation to that topic.`;
        setAnswer(response);
        setHistory((prev) => [
            {
                id: Date.now(),
                question: trimmed,
                answer: response,
                subject: selectedSubject?.name || 'General',
                concept: selectedConcept?.name || '',
            },
            ...prev,
        ].slice(0, 4));
        setQuestion('');
    };

    return (
        <PageTransition>
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-[0.2em]">
                            <HiOutlineSparkles className="w-3 h-3" />
                            AI Tutor
                        </div>
                        <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight text-text-primary">
                            <span className="text-accent italic">QueryCoach</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-text-secondary font-medium">
                        <HiOutlineAcademicCap className="w-5 h-5 text-accent" />
                            {isFaculty ? 'Teaching and concept guidance' : 'Personalized academic guidance'}
                    </div>
                </header>

                {usingReferenceCatalog && !loadingCatalog && (
                    <p className="-mt-5 text-xs font-medium text-text-tertiary">Using the built-in subject and concept reference catalog. Saved catalog records will replace these options when available.</p>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-8">
                    <section className="premium-card p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                                <HiOutlineLightBulb className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-text-primary">{isFaculty ? 'Explore a teaching question' : 'Ask your doubt'}</h2>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-tertiary">{isFaculty ? 'Ground guidance in your subject and concept catalog' : 'Clear concepts in plain language'}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">
                                    Subject
                                </label>
                                <select
                                    value={subjectId}
                                    onChange={(event) => handleSubjectChange(event.target.value)}
                                    className="w-full rounded-2xl border border-border/10 bg-surface-secondary px-4 py-3 text-sm text-text-primary outline-none focus:border-accent transition-colors"
                                    disabled={loadingCatalog || subjects.length === 0}
                                >
                                    {subjects.length === 0 && <option value="">No subjects configured</option>}
                                    {subjects.map((item) => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Concept</label>
                                <select
                                    value={conceptId}
                                    onChange={(event) => setConceptId(event.target.value)}
                                    className="w-full rounded-2xl border border-border/10 bg-surface-secondary px-4 py-3 text-sm text-text-primary outline-none focus:border-accent transition-colors"
                                    disabled={loadingCatalog || subjectConcepts.length === 0}
                                >
                                    <option value="">{subjectConcepts.length ? 'General subject question' : 'No concepts configured for this subject'}</option>
                                    {subjectConcepts.map((item) => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">
                                    Your question
                                </label>
                                <textarea
                                    value={question}
                                    onChange={(event) => setQuestion(event.target.value)}
                                    placeholder={isFaculty ? 'Example: How can I teach this concept using a practical case?' : 'Example: Why do we use recursion in tree traversal?'}
                                    rows={6}
                                    className="w-full rounded-2xl border border-border/10 bg-surface-secondary px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!question.trim() || loadingCatalog || subjects.length === 0}
                                className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-accent/20 transition-transform hover:-translate-y-0.5"
                            >
                                Clarify my doubt
                                <HiOutlineArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    </section>

                    <section className="premium-card p-8">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <HiOutlineCheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-text-primary">AI explanation</h2>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-tertiary">Instant conceptual breakdown</p>
                            </div>
                        </div>

                        {answer ? (
                            <div className="space-y-4">
                                <div className="rounded-2xl bg-accent/5 border border-accent/10 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary mb-2">Response</p>
                                    <p className="text-sm leading-relaxed text-text-primary font-medium">{answer}</p>
                                </div>

                                <div className="rounded-2xl bg-surface-secondary border border-border/10 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary mb-2">Study tip</p>
                                    <p className="text-sm leading-relaxed text-text-secondary">
                                        Rephrase the idea in one sentence, work through one example, and then test yourself without notes. This approach locks the concept in faster than rereading theory alone.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border/20 bg-surface-secondary/50 p-6 text-sm leading-relaxed text-text-secondary">
                                {loadingCatalog ? 'Loading your subject and concept catalog…' : subjects.length === 0 ? 'No subject or concept catalog is available yet.' : isFaculty ? 'Ask about a concept, a teaching example, or a way to assess learner understanding.' : 'Ask a question about a topic, concept, or formula for a simple, practical explanation.'}
                            </div>
                        )}
                    </section>
                </div>

                <section className="premium-card p-8">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-black text-text-primary">{isFaculty ? 'Teaching prompts' : 'Suggested doubts'}</h3>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-tertiary">{selectedConcept ? `Prompts for ${selectedConcept.name}` : selectedSubject?.name || 'Select a subject'}</p>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">{subjectConcepts.length} concepts</div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {currentPrompts.length ? currentPrompts.map((prompt) => (
                            <button
                                key={prompt}
                                type="button"
                                onClick={() => setQuestion(prompt)}
                                className="rounded-2xl border border-border/10 bg-surface-secondary px-4 py-3 text-left text-sm text-text-primary hover:border-accent transition-colors"
                            >
                                {prompt}
                            </button>
                        )) : <p className="text-sm text-text-tertiary">Prompts will appear when subjects and concepts are configured.</p>}
                    </div>
                </section>

                {history.length > 0 && (
                    <section className="premium-card p-8">
                        <h3 className="text-xl font-black text-text-primary mb-5">Recent doubts</h3>
                        <div className="space-y-4">
                            {history.map((entry) => (
                                <div key={entry.id} className="rounded-2xl border border-border/10 bg-surface-secondary/50 p-4">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">{entry.subject}{entry.concept ? ` · ${entry.concept}` : ''}</span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Solved</span>
                                    </div>
                                    <p className="mb-2 text-sm font-medium text-text-primary">Q: {entry.question}</p>
                                    <p className="text-sm leading-relaxed text-text-secondary">A: {entry.answer}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </PageTransition>
    );
}
