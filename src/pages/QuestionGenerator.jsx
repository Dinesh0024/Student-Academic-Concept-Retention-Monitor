import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSparkles, HiOutlineCheck, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineCog, HiOutlineClock, HiOutlineCalendar } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import mockDb from '../utils/mockDb';
import toast from 'react-hot-toast';

export default function QuestionGenerator() {
    const [subjects, setSubjects] = useState([]);
    const [concepts, setConcepts] = useState([]);
    const [subjectId, setSubjectId] = useState('');
    const [conceptId, setConceptId] = useState('');

    useEffect(() => {
        const fetchRemoteData = async () => {
            const [sData, cData] = await Promise.all([
                mockDb.getSubjects(),
                mockDb.getConcepts()
            ]);
            setSubjects(sData);
            setConcepts(cData);
        };
        fetchRemoteData();
    }, []);

    const [difficulty, setDifficulty] = useState('Medium');
    const [numQuestions, setNumQuestions] = useState(5);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);

    const [showDeployModal, setShowDeployModal] = useState(false);
    const [deployStartTime, setDeployStartTime] = useState('');
    const [deployEndTime, setDeployEndTime] = useState('');

    const filteredConcepts = concepts.filter(c => c.subjectId === subjectId || c.subjectId === parseInt(subjectId));

    const handleGenerate = (e) => {
        e.preventDefault();
        if (!subjectId || !conceptId) {
            toast.error('Select domain and concept');
            return;
        }

        setIsGenerating(true);
        setGeneratedQuestions([]);

        setTimeout(() => {
            const subjectName = subjects.find(s => s.id === parseInt(subjectId))?.name || 'Subject';
            const conceptName = concepts.find(c => c.id === parseInt(conceptId))?.name || 'Concept';

            // Generate varied questions based on the domain & concept
            const newQs = Array.from({ length: numQuestions }).map((_, i) => {
                const questionTypes = [
                    `What is the primary function of ${conceptName} in a standard ${subjectName} environment?`,
                    `Identify the major drawback or limitation when implementing ${conceptName}.`,
                    `Which of the following is a direct prerequisite for understanding ${conceptName}?`,
                    `How does ${conceptName} optimization impact the overall performance of ${subjectName} systems?`,
                    `Which alternative methodology is most commonly compared against ${conceptName}?`,
                    `In the context of ${subjectName}, describe the edge-case failure mode for ${conceptName}.`,
                    `What is the optimal time/space complexity associated with ${conceptName}?`,
                    `Which industry standard most heavily relies on ${conceptName}?`,
                    `Identify the false statement regarding ${conceptName}.`,
                    `What is the foundational principle underlying ${conceptName}?`
                ];

                const qText = questionTypes[i % questionTypes.length];

                return {
                    id: Date.now() + i,
                    text: qText,
                    options: [
                        `${conceptName} Alpha Output`,
                        `${conceptName} Beta Deviation`,
                        `${conceptName} Gamma Heuristic`,
                        `${conceptName} Delta Constant`
                    ],
                    correctAnswer: `${conceptName} Alpha Output`,
                    isEditing: false
                };
            });

            setGeneratedQuestions(newQs);
            setIsGenerating(false);
            toast.success(`Generated ${numQuestions} specialized assessments for ${conceptName}`);
        }, 2000);
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

        const subjectName = subjects.find(s => s.id === parseInt(subjectId))?.name || 'AI Generated Domain';

        // Save these questions as an actual test via mockDb so students can see them
        await mockDb.saveTest({
            id: Date.now().toString(),
            name: `AI Assessment: ${subjectName}`,
            subject: subjectName,
            date: new Date().toISOString().split('T')[0],
            time: deployStartTime,
            endTime: deployEndTime,
            duration: generatedQuestions.length * 2, // 2 mins per question
            status: 'Upcoming',
            numQuestions: generatedQuestions.length,
            isLive: true,
            questions: generatedQuestions
        });

        toast.success(`Successfully deployed to live assessments!`);
        setShowDeployModal(false);
        setGeneratedQuestions([]);
        setDeployStartTime('');
        setDeployEndTime('');
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
                                        <button type="button" onClick={() => setShowDeployModal(false)} className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
                                            Cancel
                                        </button>
                                        <button type="submit" className="apple-btn apple-btn-primary !px-8 !py-2.5 !text-xs !bg-indigo-500 hover:!bg-indigo-600 shadow-xl shadow-indigo-500/20">
                                            Confirm Deployment
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
