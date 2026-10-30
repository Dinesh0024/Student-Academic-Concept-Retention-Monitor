import mockDb from '../utils/apiDb';
import { useState, useEffect } from 'react';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineDocumentText, HiOutlinePlus, HiOutlineRefresh } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import toast from 'react-hot-toast';
import { generateUniqueQuestions } from '../utils/questionGeneratorEngine';

export default function TestScheduler() {
    const [tests, setTests] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [concepts, setConcepts] = useState([]);

    useEffect(() => {
        const fetchRemoteData = async () => {
            const [testData, subjectData, conceptData] = await Promise.all([
                mockDb.getTests(),
                mockDb.getSubjects(),
                mockDb.getConcepts()
            ]);
            setTests(testData);
            setSubjects(subjectData);
            setConcepts(conceptData);
        };
        fetchRemoteData();
    }, []);

    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [testName, setTestName] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [selectedConcepts, setSelectedConcepts] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [duration, setDuration] = useState(60);
    const [numQuestions, setNumQuestions] = useState(20);
    const [allowReattempt, setAllowReattempt] = useState(false);
    const [maxAttempts, setMaxAttempts] = useState(2);

    const filteredConcepts = concepts.filter(c => c.subjectId === subjectId || c.subjectId === parseInt(subjectId));

    const toggleConcept = (id) => {
        setSelectedConcepts(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        if (!testName || !subjectId || !startDate || !startTime) {
            toast.error('Complete all scientific parameters');
            return;
        }

        const subjectName = subjects.find(s => s.id === parseInt(subjectId))?.name || 'Unknown Subject';

        const conceptNames = selectedConcepts
            .map(cid => concepts.find(c => c.id === cid || c.id === parseInt(cid))?.name)
            .filter(Boolean)
            .join(', ');

        const generatedQuestions = generateUniqueQuestions({
            subject: subjectName,
            concept: conceptNames || subjectName,
            numQuestions: parseInt(numQuestions) || 10
        });

        const newTest = {
            id: Date.now().toString(),
            name: testName,
            subject: subjectName,
            date: startDate,
            time: startTime,
            duration: parseInt(duration),
            numQuestions: parseInt(numQuestions),
            questions: generatedQuestions,
            status: 'Upcoming',
            allowReattempt: allowReattempt,
            maxAttempts: allowReattempt ? parseInt(maxAttempts) : 1,
        };

        const savedTest = await mockDb.saveTest(newTest);
        setTests([...tests, savedTest]);
        setIsCreating(false);
        toast.success('Assessment window initialized');

        // Reset
        setTestName('');
        setSubjectId('');
        setSelectedConcepts([]);
        setStartDate('');
        setStartTime('');
        setAllowReattempt(false);
        setMaxAttempts(2);
    };

    // Toggle re-attempt on an existing test card
    const handleToggleReattempt = async (test) => {
        const updated = {
            ...test,
            allowReattempt: !test.allowReattempt,
            maxAttempts: !test.allowReattempt ? (test.maxAttempts > 1 ? test.maxAttempts : 2) : 1,
        };
        await mockDb.saveTest(updated);
        setTests(prev => prev.map(t => t.id === test.id ? updated : t));
        toast.success(`Re-attempt ${updated.allowReattempt ? 'enabled' : 'disabled'} for "${test.name}"`);
    };

    // Update max attempts on an existing test
    const handleUpdateMaxAttempts = async (test, value) => {
        const updated = { ...test, maxAttempts: parseInt(value) };
        await mockDb.saveTest(updated);
        setTests(prev => prev.map(t => t.id === test.id ? updated : t));
        toast.success(`Max attempts updated to ${value} for "${test.name}"`);
    };

    return (
        <PageTransition>
            <div className="pb-12">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Cycle Scheduler</h1>
                        <p className="text-gray-500 font-medium tracking-tight">Configure and deploy assessment windows for candidate evaluation</p>
                    </div>
                    {!isCreating && (
                        <button onClick={() => setIsCreating(true)} className="apple-btn apple-btn-primary flex items-center gap-2 !py-2.5 !px-8 shadow-xl shadow-blue-500/20">
                            <HiOutlinePlus className="w-5 h-5" /> Initialize Window
                        </button>
                    )}
                </div>

                <AnimatePresence>
                    {isCreating && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="overflow-hidden mb-10">
                            <div className="premium-card p-10 bg-white">
                                <h2 className="text-xl font-bold text-gray-900 mb-8 border-b border-gray-50 pb-6 uppercase tracking-widest text-[10px]">Assessment Configuration</h2>
                                <form onSubmit={handleSchedule} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="apple-input-group">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Protocol Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Clinical Midterm"
                                                className="apple-input py-3"
                                                value={testName}
                                                onChange={e => setTestName(e.target.value)}
                                            />
                                        </div>
                                        <div className="apple-input-group">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Domain Discipline</label>
                                            <select
                                                className="apple-input bg-white cursor-pointer py-3"
                                                value={subjectId}
                                                onChange={(e) => { setSubjectId(e.target.value); setSelectedConcepts([]); }}
                                            >
                                                <option value="" disabled>Select Discipline</option>
                                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {subjectId && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block text-center">Cognitive Concepts Coverage</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {filteredConcepts.map(c => (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => toggleConcept(c.id)}
                                                        className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest text-center cursor-pointer transition-all ${selectedConcepts.includes(c.id)
                                                            ? 'bg-gray-900 text-white border-gray-900 shadow-xl'
                                                            : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-white hover:border-blue-200'
                                                            }`}
                                                    >
                                                        {c.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                                        <div className="apple-input-group">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Deployment Date</label>
                                            <input type="date" className="apple-input py-3" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                        </div>
                                        <div className="apple-input-group">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Trigger Time</label>
                                            <input type="time" className="apple-input py-3" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                        </div>
                                        <div className="apple-input-group">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Duration (min)</label>
                                            <input type="number" min="15" step="15" className="apple-input py-3 uppercase" value={duration} onChange={e => setDuration(e.target.value)} />
                                        </div>
                                        <div className="apple-input-group">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Item Count</label>
                                            <input type="number" min="5" max="100" className="apple-input py-3 uppercase" value={numQuestions} onChange={e => setNumQuestions(e.target.value)} />
                                        </div>
                                    </div>

                                    {/* ── Re-attempt Policy ── */}
                                    <div className="pt-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Re-attempt Policy</p>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                            <div className="flex items-center gap-4 flex-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setAllowReattempt(v => !v)}
                                                    className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none flex-shrink-0 ${allowReattempt ? 'bg-blue-500' : 'bg-gray-200'}`}
                                                >
                                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${allowReattempt ? 'translate-x-7' : 'translate-x-1'}`} />
                                                </button>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">Allow Re-attempts</p>
                                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                                        {allowReattempt ? 'Students can retake this test up to the max limit' : 'Students can only attempt this test once'}
                                                    </p>
                                                </div>
                                            </div>
                                            <AnimatePresence>
                                                {allowReattempt && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        className="apple-input-group min-w-[150px]"
                                                    >
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Max Attempts</label>
                                                        <input
                                                            type="number"
                                                            min="2"
                                                            max="10"
                                                            value={maxAttempts}
                                                            onChange={e => setMaxAttempts(e.target.value)}
                                                            className="apple-input py-3 w-full"
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4 pt-8 border-t border-gray-50">
                                        <button type="button" onClick={() => setIsCreating(false)} className="px-8 py-3 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest">Abort</button>
                                        <button type="submit" className="apple-btn apple-btn-primary !py-3 !px-12 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20">Commit Window</button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 gap-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Active Assessment Windows</h3>
                    {tests.length === 0 ? (
                        <div className="premium-card p-12 bg-white text-center border-2 border-dashed border-gray-100">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No active protocols detected</p>
                        </div>
                    ) : (
                        tests.map(test => (
                            <div key={test.id} className="premium-card bg-white p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:shadow-2xl transition-all duration-700">
                                {/* Test Info */}
                                <div className="flex items-center gap-6 flex-shrink-0">
                                    <div className="w-14 h-14 bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 rounded-2xl flex items-center justify-center border border-gray-100 transition-colors">
                                        <HiOutlineDocumentText className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg tracking-tight mb-1">{test.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{test.subject}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Meta + Re-attempt Controls */}
                                <div className="flex flex-wrap items-center gap-6 md:gap-8 ml-0 md:ml-auto">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Schedule</p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                            <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
                                            <span>{new Date(test.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Window</p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                            <HiOutlineClock className="w-4 h-4 text-gray-400" />
                                            <span>{test.time} ({test.duration}m)</span>
                                        </div>
                                    </div>

                                    {/* ── Live Re-attempt Control Panel ── */}
                                    <div className="flex flex-col gap-2.5 px-5 py-4 rounded-2xl border transition-all duration-300
                                        bg-gray-50 border-gray-100
                                        min-w-[190px]">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Re-attempt Control</p>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <HiOutlineRefresh className={`w-3.5 h-3.5 ${test.allowReattempt ? 'text-blue-500' : 'text-gray-300'}`} />
                                                <span className={`text-xs font-black uppercase tracking-widest ${test.allowReattempt ? 'text-blue-600' : 'text-gray-400'}`}>
                                                    {test.allowReattempt ? 'Allowed' : 'Restricted'}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleReattempt(test)}
                                                className={`relative w-10 h-5 rounded-full transition-all duration-300 focus:outline-none flex-shrink-0 ${test.allowReattempt ? 'bg-blue-500' : 'bg-gray-200'}`}
                                            >
                                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${test.allowReattempt ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>

                                        {/* Max attempts dropdown — visible only when re-attempt is ON */}
                                        <AnimatePresence>
                                            {test.allowReattempt && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="flex items-center gap-2 pt-1 border-t border-blue-100">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Max</span>
                                                        <select
                                                            value={test.maxAttempts || 2}
                                                            onChange={e => handleUpdateMaxAttempts(test, e.target.value)}
                                                            className="flex-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 cursor-pointer"
                                                        >
                                                            {[2, 3, 4, 5, 10].map(n => (
                                                                <option key={n} value={n}>{n} attempts</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </PageTransition>
    );
}
