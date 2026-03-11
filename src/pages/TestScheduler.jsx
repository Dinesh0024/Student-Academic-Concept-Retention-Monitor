import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineDocumentText, HiOutlinePlus, HiOutlineChevronRight } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import mockDb from '../utils/mockDb';
import toast from 'react-hot-toast';

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

        const newTest = {
            id: Date.now().toString(),
            name: testName,
            subject: subjectName,
            date: startDate,
            time: startTime,
            duration: parseInt(duration),
            status: 'Upcoming'
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
    };

    return (
        <PageTransition>
            <div className="pb-12">
                <header className="mb-10 lg:px-0">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-bold tracking-tight text-app-text">Cycle Scheduler</h1>
                            <p className="text-app-text-tertiary font-medium tracking-tight">Configure and deploy assessment windows for candidate evaluation</p>
                        </div>
                    </div>
                    {!isCreating && (
                        <button onClick={() => setIsCreating(true)} className="apple-btn apple-btn-primary flex items-center gap-2 !py-2.5 !px-8 shadow-xl shadow-blue-500/20">
                            <HiOutlinePlus className="w-5 h-5" /> Initialize Window
                        </button>
                    )}
                </header>

                <AnimatePresence>
                    {isCreating && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="overflow-hidden mb-10">
                            <div className="premium-card p-10 bg-app-bg">
                                <h2 className="text-xl font-bold text-app-text mb-8 border-b border-app-border pb-6 uppercase tracking-widest text-[10px]">Assessment Configuration</h2>
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
                                                            ? 'bg-app-text text-app-bg border-app-text shadow-xl'
                                                            : 'bg-app-bg-secondary border-app-border text-app-text-tertiary hover:bg-app-bg hover:border-accent/50'
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

                                    <div className="flex justify-end gap-4 pt-8 border-t border-app-border">
                                        <button type="button" onClick={() => setIsCreating(false)} className="px-8 py-3 text-xs font-bold text-app-text-tertiary hover:text-app-text transition-colors uppercase tracking-widest">Abort</button>
                                        <button type="submit" className="apple-btn apple-btn-primary !py-3 !px-12 text-xs font-black uppercase tracking-widest shadow-xl shadow-accent/20">Commit Window</button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 gap-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Active Assessment Windows</h3>
                    {tests.length === 0 ? (
                        <div className="premium-card p-12 bg-app-bg text-center border-2 border-dashed border-app-border">
                            <p className="text-sm font-bold text-app-text-tertiary uppercase tracking-widest">No active protocols detected</p>
                        </div>
                    ) : (
                        tests.map(test => (
                            <div key={test.id} className="premium-card bg-app-bg p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-2xl transition-all duration-700">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-app-bg-secondary text-app-text-tertiary group-hover:bg-accent/10 group-hover:text-accent rounded-2xl flex items-center justify-center border border-app-border transition-colors">
                                        <HiOutlineDocumentText className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-app-text text-lg tracking-tight mb-1">{test.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                                            <p className="text-[10px] font-black text-app-text-tertiary uppercase tracking-[0.15em]">{test.subject}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-center md:justify-end gap-10">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-app-text-tertiary uppercase tracking-widest mb-1 opacity-50">Schedule</p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-app-text">
                                            <HiOutlineCalendar className="w-4 h-4 text-app-text-tertiary" />
                                            <span>{new Date(test.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-app-text-tertiary uppercase tracking-widest mb-1 opacity-50">Window</p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-app-text">
                                            <HiOutlineClock className="w-4 h-4 text-app-text-tertiary" />
                                            <span>{test.time} ({test.duration}m)</span>
                                        </div>
                                    </div>
                                    <button className="apple-btn apple-btn-secondary !py-2 !px-6 !text-[10px] !font-black !uppercase !tracking-widest self-center md:self-auto group-hover:bg-app-bg-secondary group-hover:border-app-border transition-all">
                                        Modify
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </PageTransition >
    );
}
