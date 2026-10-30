import mockDb from '../utils/apiDb';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSparkles, HiOutlineCheck, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineCog, HiOutlineClock, HiOutlineCalendar } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import toast from 'react-hot-toast';
import { generateUniqueQuestions } from '../utils/questionGeneratorEngine';
import { subjects as referenceSubjects, concepts as referenceConcepts } from '../data/mockData';

export default function QuestionGenerator() {
    const [subjects, setSubjects] = useState([]);
    const [concepts, setConcepts] = useState([]);
    const [subjectId, setSubjectId] = useState('');
    const [conceptId, setConceptId] = useState('');

    useEffect(() => {
        let isMounted = true;
        const fetchCatalog = async () => {
            try {
                const [subjectRecords, conceptRecords] = await Promise.all([
                    mockDb.getSubjects(),
                    mockDb.getConcepts()
                ]);
                if (!isMounted) return;

                if (subjectRecords.length || conceptRecords.length) {
                    setSubjects(subjectRecords);
                    setConcepts(conceptRecords);
                } else {
                    setSubjects(referenceSubjects);
                    setConcepts(referenceConcepts);
                }
            } catch (error) {
                console.error('Failed to load question generator catalog:', error);
                if (!isMounted) return;
                setSubjects(referenceSubjects);
                setConcepts(referenceConcepts);
                toast.error('Database catalog unavailable; using built-in subjects and concepts.');
            }
        };
        fetchCatalog();
        return () => { isMounted = false; };
    }, []);

    const [difficulty, setDifficulty] = useState('Medium');
    const [numQuestions, setNumQuestions] = useState(5);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);

    const [showDeployModal, setShowDeployModal] = useState(false);
    const [deployStartTime, setDeployStartTime] = useState('');
    const [deployEndTime, setDeployEndTime] = useState('');
    const [isDeploying, setIsDeploying] = useState(false);

    const filteredConcepts = concepts.filter((concept) =>
        (concept.subjectId ?? concept.subject_id)?.toString() === subjectId
    );

    // ── Shuffle helper (Fisher-Yates) ────────────────────────────────────────
    const shuffleArray = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    // ── Build a large unique option pool per question ────────────────────────
    const buildOptionPool = (conceptName, subjectName, qIndex) => {
        const pools = [
            // Definitional / conceptual
            `Core abstraction layer of ${conceptName}`,
            `Encapsulated state model in ${conceptName}`,
            `Deterministic execution path of ${conceptName}`,
            `Immutable reference pattern in ${conceptName}`,
            `Lazy evaluation strategy for ${conceptName}`,
            `Eager binding model within ${conceptName}`,

            // Algorithmic / complexity
            `O(log n) traversal via ${conceptName}`,
            `O(n²) worst-case scenario in ${conceptName}`,
            `Amortized O(1) insertion using ${conceptName}`,
            `Linear-time reduction through ${conceptName}`,
            `Polynomial-bounded variant of ${conceptName}`,
            `NP-hard reduction from ${conceptName}`,

            // Implementation patterns
            `Factory-pattern instantiation of ${conceptName}`,
            `Observer-pattern bridge for ${conceptName}`,
            `Singleton enforcement within ${conceptName}`,
            `Decorator-chain extension of ${conceptName}`,
            `Proxy delegation layer over ${conceptName}`,
            `Command-pattern abstraction of ${conceptName}`,

            // Failure / edge-case modes
            `Race condition introduced by ${conceptName}`,
            `Null-pointer dereference within ${conceptName}`,
            `Stack-overflow boundary in ${conceptName}`,
            `Deadlock scenario caused by ${conceptName}`,
            `Off-by-one error in ${conceptName} loop`,
            `Integer overflow during ${conceptName} scaling`,

            // Domain / system context
            `${subjectName} runtime dependency on ${conceptName}`,
            `Kernel-level integration of ${conceptName}`,
            `Distributed consensus via ${conceptName}`,
            `Cache-coherence protocol using ${conceptName}`,
            `Memory-mapped I/O through ${conceptName}`,
            `Virtual address translation in ${conceptName}`,

            // Comparison / alternatives
            `${conceptName} vs. iterative backtracking`,
            `${conceptName} contrasted with memoisation`,
            `Greedy heuristic alternative to ${conceptName}`,
            `Divide-and-conquer analogue of ${conceptName}`,
            `Dynamic-programming reformulation of ${conceptName}`,
            `Branch-and-bound replacement for ${conceptName}`,

            // Standards / industry
            `IEEE 802 compliance layer for ${conceptName}`,
            `POSIX-standard implementation of ${conceptName}`,
            `ISO/IEC 9001 conformant ${conceptName} module`,
            `GDPR-compliant data handling via ${conceptName}`,
            `RFC-7231 resource model using ${conceptName}`,
            `OpenAPI 3.0 schema extension of ${conceptName}`,

            // Optimisation / tuning
            `Vectorised SIMD acceleration of ${conceptName}`,
            `Branch-prediction-aware ${conceptName} path`,
            `Cache-line-aligned ${conceptName} buffer`,
            `Compiler-intrinsic optimisation of ${conceptName}`,
            `Lock-free concurrent variant of ${conceptName}`,
            `NUMA-aware allocation for ${conceptName}`,

            // Theoretical / foundational
            `Turing-complete formulation of ${conceptName}`,
            `Lambda-calculus reduction of ${conceptName}`,
            `Monadic composition pattern in ${conceptName}`,
            `Category-theory functor for ${conceptName}`,
            `Type-theoretic proof of ${conceptName}`,
            `Church-encoding representation of ${conceptName}`,

            // Miscellaneous unique distractors
            `Stateless idempotent endpoint of ${conceptName}`,
            `Event-sourcing projection through ${conceptName}`,
            `CQRS write-side handler of ${conceptName}`,
            `Saga-pattern compensator for ${conceptName}`,
            `Circuit-breaker fallback in ${conceptName}`,
            `Backpressure mechanism within ${conceptName}`,
        ];
        // Rotate the pool start by question index so each question draws from a different slice
        const offset = (qIndex * 7) % pools.length;
        const rotated = [...pools.slice(offset), ...pools.slice(0, offset)];
        return rotated;
    };

    const handleGenerate = (e) => {
        e.preventDefault();
        if (!subjectId || !conceptId) {
            toast.error('Select domain and concept');
            return;
        }

        setIsGenerating(true);
        setGeneratedQuestions([]);

        setTimeout(() => {
            const subjectName = subjects.find(s => s.id?.toString() === subjectId)?.name || 'Subject';
            const conceptName = concepts.find(c => c.id?.toString() === conceptId)?.name || 'Concept';

            // Generate non-repeating unique questions using the deduplication engine
            const newQs = generateUniqueQuestions({
                subject: subjectName,
                concept: conceptName,
                numQuestions: parseInt(numQuestions) || 5
            }).map((q, idx) => ({
                ...q,
                id: Date.now() + idx,
                isEditing: false
            }));

            setGeneratedQuestions(newQs);
            setIsGenerating(false);
            toast.success(`Generated ${newQs.length} unique, non-repeating assessments for ${conceptName}`);
        }, 1200);
    };

    const toggleEdit = (id) => {
        setGeneratedQuestions(qs => qs.map(q => q.id === id ? { ...q, isEditing: !q.isEditing } : q));
    };

    const updateQuestion = (id, field, value) => {
        setGeneratedQuestions(qs => qs.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const updateOption = (qId, optIdx, value) => {
        setGeneratedQuestions(qs => qs.map(q => {
            if (q.id === qId) {
                const newOpts = [...q.options];
                newOpts[optIdx] = value;
                return { ...q, options: newOpts };
            }
            return q;
        }));
    };

    const removeQuestion = (id) => {
        setGeneratedQuestions(qs => qs.filter(q => q.id !== id));
    };

    const handleSaveBank = () => {
        if (generatedQuestions.length === 0) return;
        setShowDeployModal(true);
    };

    const confirmDeploy = async (e) => {
        e.preventDefault();
        if (!deployStartTime || !deployEndTime) {
            toast.error('Please specify the deployment window');
            return;
        }
        if (deployEndTime <= deployStartTime) {
            toast.error('End time must be later than start time');
            return;
        }

        const subjectName = subjects.find(s => s.id?.toString() === subjectId)?.name || 'AI Generated Domain';

        setIsDeploying(true);
        try {
            const now = new Date();
            const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            await mockDb.saveTest({
                id: Date.now().toString(),
                name: `AI Assessment: ${subjectName}`,
                subject: subjectName,
                date: localDate,
                time: deployStartTime,
                endTime: deployEndTime,
                duration: generatedQuestions.length,
                status: 'Upcoming',
                numQuestions: generatedQuestions.length,
                isLive: true,
                questions: generatedQuestions
            });

            toast.success('Assessment deployed successfully!');
            setShowDeployModal(false);
            setGeneratedQuestions([]);
            setDeployStartTime('');
            setDeployEndTime('');
        } catch (error) {
            console.error('Assessment deployment failed:', error);
            toast.error(error.message || 'Could not deploy assessment. Please try again.');
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <PageTransition>
            <div className="pb-12">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">AI Assessment Engine</h1>
                        <p className="text-gray-500 font-medium tracking-tight">Generate high-fidelity diagnostic questions using advanced AI models</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Settings Form */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="premium-card p-8 bg-white h-fit">
                            <h2 className="text-lg font-bold text-gray-900 mb-8 flex items-center gap-2">
                                <HiOutlineCog className="w-5 h-5 text-gray-400 font-bold" />
                                Model Parameters
                            </h2>

                            <form onSubmit={handleGenerate} className="space-y-6">
                                <div className="apple-input-group">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Scientific Domain</label>
                                    <select
                                        className="apple-input bg-white cursor-pointer py-3"
                                        value={subjectId}
                                        onChange={(e) => { setSubjectId(e.target.value); setConceptId(''); }}
                                        required
                                    >
                                        <option value="" disabled>Select Subject</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="apple-input-group">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Target Concept</label>
                                    <select
                                        className="apple-input bg-white cursor-pointer py-3"
                                        value={conceptId}
                                        onChange={(e) => setConceptId(e.target.value)}
                                        required
                                        disabled={!subjectId}
                                    >
                                        <option value="" disabled>Select Concept</option>
                                        {filteredConcepts.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="apple-input-group">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Complexity Level</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Easy', 'Medium', 'Hard'].map(level => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setDifficulty(level)}
                                                className={`py-2 rounded-xl text-xs font-bold transition-all ${difficulty === level
                                                    ? 'bg-gray-900 text-white shadow-xl shadow-gray-200'
                                                    : 'bg-gray-50 text-gray-400 hover:text-gray-900 border border-gray-100'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="apple-input-group">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Batch Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={numQuestions}
                                        onChange={(e) => setNumQuestions(e.target.value)}
                                        className="apple-input py-3"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isGenerating}
                                    className="apple-btn apple-btn-primary w-full mt-4 flex justify-center items-center gap-3 !py-3 font-bold"
                                >
                                    {isGenerating ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <HiOutlineSparkles className="w-4 h-4" />
                                    )}
                                    Initialize Generation
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {isGenerating && (
                            <div className="premium-card p-16 bg-white flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-gray-100">
                                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Processing Cognitive Map...</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Synthesizing high-fidelity assessments</p>
                                </div>
                            </div>
                        )}

                        {!isGenerating && generatedQuestions.length === 0 && (
                            <div className="premium-card p-16 bg-white flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 group hover:border-blue-200 transition-colors">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform">
                                    <HiOutlineSparkles className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-2">Engine Idle</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-xs leading-relaxed">
                                    Configure parameters and initialize the generation sequence to create custom assessments.
                                </p>
                            </div>
                        )}

                        {!isGenerating && generatedQuestions.length > 0 && (
                            <div className="space-y-6">
                                <div className="premium-card bg-gray-900 p-6 flex justify-between items-center text-white">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Success</p>
                                        <h3 className="text-sm font-bold">{generatedQuestions.length} Items Synthesized</h3>
                                    </div>
                                    <button onClick={handleSaveBank} className="apple-btn apple-btn-primary !py-2.5 !px-6 !text-xs !font-black !uppercase !tracking-widest">
                                        Commit to Bank
                                    </button>
                                </div>

                                {generatedQuestions.map((q, idx) => (
                                    <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                                        <div className="premium-card bg-white p-8 group">
                                            {q.isEditing ? (
                                                <div className="space-y-6">
                                                    <textarea
                                                        value={q.text}
                                                        onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                                                        className="apple-input w-full min-h-[100px] text-sm font-bold"
                                                        placeholder="Question text"
                                                    />
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {q.options.map((opt, optIdx) => (
                                                            <div key={optIdx} className="flex gap-3 items-center">
                                                                <span className="font-black text-gray-300 w-4 text-xs">{String.fromCharCode(65 + optIdx)}</span>
                                                                <input
                                                                    type="text"
                                                                    value={opt}
                                                                    onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                                                    className="apple-input py-2 text-xs"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-end pt-4">
                                                        <button onClick={() => toggleEdit(q.id)} className="apple-btn apple-btn-primary !py-2 !px-8 text-xs font-bold uppercase tracking-widest">Apply</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="flex justify-between items-start gap-4 mb-8">
                                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                                            <span className="text-blue-500 mr-2 opacity-50">{idx + 1}.</span>
                                                            {q.text}
                                                        </h3>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => toggleEdit(q.id)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                                                <HiOutlinePencilAlt className="w-5 h-5" />
                                                            </button>
                                                            <button onClick={() => removeQuestion(q.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                                                <HiOutlineTrash className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                                        {q.options.map((opt, optIdx) => (
                                                            <div key={optIdx} className="px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700">
                                                                <span className="text-gray-300 mr-2 font-black">{String.fromCharCode(65 + optIdx)}</span> {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-[0.15em]">
                                                        <HiOutlineCheck className="w-3.5 h-3.5" />
                                                        Correct Reference: {q.correctAnswer}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Deployment Modal Overlay */}
            <AnimatePresence>
                {showDeployModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-6">
                                    <HiOutlineSparkles className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Deploy Live Assessment</h2>
                                <p className="text-sm text-gray-500 mb-8 font-medium">Specify the access window for this custom assessment. Students will only be permitted to launch the test within this timeframe.</p>

                                <form onSubmit={confirmDeploy} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="apple-input-group">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                                <HiOutlineClock className="w-3.5 h-3.5" /> Start Time
                                            </label>
                                            <input type="time" required value={deployStartTime} onChange={e => setDeployStartTime(e.target.value)} className="apple-input py-3" />
                                        </div>
                                        <div className="apple-input-group">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                                <HiOutlineClock className="w-3.5 h-3.5" /> End Time
                                            </label>
                                            <input type="time" required value={deployEndTime} onChange={e => setDeployEndTime(e.target.value)} className="apple-input py-3" />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                        <button type="button" onClick={() => setShowDeployModal(false)} disabled={isDeploying} className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={isDeploying} className="apple-btn apple-btn-primary !px-8 !py-2.5 !text-xs !bg-indigo-500 hover:!bg-indigo-600 shadow-xl shadow-indigo-500/20 disabled:opacity-60">
                                            {isDeploying ? 'Deploying...' : 'Confirm Deployment'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageTransition>
    );
}
