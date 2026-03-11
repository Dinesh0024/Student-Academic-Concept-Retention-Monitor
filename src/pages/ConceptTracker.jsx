import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineLightBulb, HiOutlineChartBar } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import Modal from '../components/Modal';
import { getRetentionLevel } from '../utils/analytics';
import mockDb from '../utils/mockDb';
import toast from 'react-hot-toast';
import { conceptInsights } from '../data/mockData';

export default function ConceptTracker() {
    const [conceptList, setConceptList] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(0);

    const fetchData = async () => {
        const [cData, sData] = await Promise.all([
            mockDb.getConcepts(),
            mockDb.getSubjects()
        ]);
        setConceptList(cData);
        setSubjects(sData);
    };

    useEffect(() => {
        fetchData();
    }, []);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [testModal, setTestModal] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', subjectId: '' });
    const [testForm, setTestForm] = useState({ correct: '', total: '' });

    const filtered = conceptList.filter(c => {
        const matchSubject = selectedSubject === 0 || c.subjectId === selectedSubject || c.subjectId === selectedSubject.toString();
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
        return matchSubject && matchSearch;
    });

    const handleAddConcept = async () => {
        if (!form.name) { toast.error('Check required fields'); return; }
        const newConcept = {
            subjectId: form.subjectId || "1",
            name: form.name,
            description: form.description,
            mastery: 0,
        };
        await mockDb.saveConcept(newConcept);
        fetchData();
        setModalOpen(false);
        setForm({ name: '', description: '', subjectId: '' });
        toast.success('Logical concept initialized');
    };

    const handleRecordTest = async () => {
        const correct = parseInt(testForm.correct);
        const total = parseInt(testForm.total);
        if (!correct || !total || total <= 0) { toast.error('Invalid metrics'); return; }
        const score = Math.round((correct / total) * 100);
        await mockDb.saveConcept({ ...testModal, mastery: score });
        fetchData();
        setTestModal(null);
        setTestForm({ correct: '', total: '' });
        toast.success(`Index updated: ${score}%`);
    };

    return (
        <PageTransition>
            <div className="pb-12">
                <header className="mb-10 lg:px-0">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-bold tracking-tight text-app-text">Knowledge Matrix</h1>
                            <p className="text-app-text-tertiary font-medium tracking-tight">AI-mapped cognitive structures and retention telemetry</p>
                        </div>
                        <button onClick={() => setModalOpen(true)} className="apple-btn apple-btn-primary flex items-center gap-2 !py-2.5 !px-6 shadow-xl shadow-blue-500/20">
                            <HiOutlinePlus className="w-5 h-5" /> Initialize Concept
                        </button>
                    </div>
                </header>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-10">
                    <div className="relative flex-1">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 font-medium outline-none transition-all shadow-sm"
                            placeholder="Filter concepts..."
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                            onClick={() => setSelectedSubject(0)}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${selectedSubject === 0 ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' : 'bg-white text-gray-400 hover:text-gray-900 border border-gray-50 uppercase tracking-tighter'}`}
                        >
                            Global
                        </button>
                        {subjects.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedSubject(s.id)}
                                className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${selectedSubject === s.id ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' : 'bg-white text-gray-400 hover:text-gray-900 border border-gray-50 uppercase tracking-tighter'}`}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Concept Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filtered.map((c, i) => {
                        const level = getRetentionLevel(c.mastery);
                        const subject = subjects.find(s => s.id === c.subjectId);
                        return (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="premium-card bg-white p-8 group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[var(--color-accent)] border border-gray-100 group-hover:bg-blue-50 transition-colors">
                                        <HiOutlineLightBulb className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-gray-900 tracking-tighter leading-none mb-1">{c.mastery}%</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: level.color }}>{level.label}</p>
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2 leading-tight">{c.name}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Subject: {subject?.name || 'GENERIC'}</p>

                                <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden mb-6">
                                    <div className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-1000" style={{ width: `${c.mastery}%` }}></div>
                                </div>

                                {conceptInsights[c.id] && (
                                    <div className="space-y-3 mb-6">
                                        <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Identified Fault</p>
                                            <p className="text-[11px] font-bold text-gray-700 leading-relaxed">{conceptInsights[c.id].fault}</p>
                                        </div>
                                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Recommended Solution</p>
                                            <p className="text-[11px] font-bold text-gray-700 leading-relaxed">{conceptInsights[c.id].solution}</p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => { setTestModal(c); setTestForm({ correct: '', total: '' }); }}
                                    className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] bg-gray-50 text-gray-400 group-hover:bg-[var(--color-accent)] group-hover:text-white transition-all shadow-sm group-hover:shadow-blue-500/30"
                                >
                                    Log Assessment
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Modals remained but styled similarly */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Initialize Concept">
                <div className="space-y-6 pt-2 text-left">
                    <div className="apple-input-group">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Scientific Category</label>
                        <select value={form.subjectId} onChange={(e) => setForm(f => ({ ...f, subjectId: e.target.value }))} className="apple-input bg-white cursor-pointer py-3">
                            <option value="">Select Domain</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="apple-input-group">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Concept Label</label>
                        <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="apple-input py-3" placeholder="e.g. Neural Networks" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
                        <button onClick={handleAddConcept} className="apple-btn apple-btn-primary !py-2.5 !px-8 text-sm">Commit Concept</button>
                    </div>
                </div>
            </Modal>
        </PageTransition>
    );
}
