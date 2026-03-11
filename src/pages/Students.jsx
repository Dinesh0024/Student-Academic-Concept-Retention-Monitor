import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineUserGroup, HiOutlineTrendingUp, HiOutlineAcademicCap } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import { getRetentionLevel } from '../utils/analytics';
import mockDb from '../utils/mockDb';
import toast from 'react-hot-toast';

export default function Students() {
    const [studentList, setStudentList] = useState([]);
    const [search, setSearch] = useState('');

    const fetchStudents = async () => {
        const data = await mockDb.getStudents();
        setStudentList(data);
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const [modalOpen, setModalOpen] = useState(false);
    const [editStudent, setEditStudent] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', enrollment: '', department: '', semester: '' });

    const filtered = studentList.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.enrollment.toLowerCase().includes(search.toLowerCase()) ||
        s.department.toLowerCase().includes(search.toLowerCase())
    );

    const openEdit = (s) => {
        setEditStudent(s);
        setForm({ name: s.name, email: s.email, enrollment: s.enrollment, department: s.department, semester: s.semester.toString() });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.email) { toast.error('Check required fields'); return; }
        if (editStudent) {
            await mockDb.saveStudent({ ...editStudent, ...form, semester: parseInt(form.semester) || editStudent.semester });
            toast.success('Member profile updated');
        } else {
            const newS = { ...form, semester: parseInt(form.semester) || 1, retentionScore: 75, avatar: '👤' };
            await mockDb.saveStudent(newS);
            toast.success('New student registered');
        }
        fetchStudents();
        setModalOpen(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this student?")) {
            await mockDb.deleteStudent(id);
            fetchStudents();
            toast.success('Access revoked');
        }
    };

    return (
        <PageTransition>
            <div className="pb-12">
                <header className="mb-10 lg:px-0">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-bold tracking-tight text-app-text">Cohort Management</h1>
                            <p className="text-app-text-tertiary font-medium tracking-tight">Monitoring academic progress across all enrolled candidates</p>
                        </div>
                        <button onClick={() => { setEditStudent(null); setModalOpen(true); }} className="apple-btn apple-btn-primary flex items-center gap-2 !py-2.5 !px-6 shadow-xl shadow-blue-500/20">
                            <HiOutlinePlus className="w-5 h-5" /> Register Student
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <StatCard title="Total Enrolled" value={studentList.length} icon={HiOutlineUserGroup} />
                    <StatCard title="Active Departments" value="3" icon={HiOutlineAcademicCap} />
                    <StatCard title="Clinical Retention" value="76%" icon={HiOutlineTrendingUp} />
                </div>

                <div className="premium-card bg-white p-0 overflow-hidden min-h-[500px] flex flex-col">
                    <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/10 placeholder-gray-400 font-medium outline-none transition-all"
                                placeholder="Filter records..."
                            />
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><HiOutlinePencil className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    {['Identifier', 'Department', 'Status', 'Retention', 'Index', ''].map(h => (
                                        <th key={h} className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] px-8 py-4">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((s) => {
                                    const level = getRetentionLevel(s.retentionScore);
                                    return (
                                        <tr key={s.id} className="group hover:bg-blue-50/20 transition-colors cursor-pointer" onClick={() => setProfileStudent(s)}>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">{s.avatar}</div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm leading-none mb-1">{s.name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{s.enrollment}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-bold text-gray-500">{s.department}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[var(--color-accent)] rounded-full" style={{ width: `${s.retentionScore}%` }}></div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 font-black text-sm text-gray-900">
                                                {s.retentionScore}%
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => openEdit(s)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><HiOutlinePencil className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><HiOutlineTrash className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal & Profile overlays remain but styled similarly */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editStudent ? 'Update Profile' : 'New Registration'}>
                <div className="space-y-6 pt-2">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="apple-input-group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Full Name</label>
                            <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="apple-input !py-3" placeholder="Clinical Name" />
                        </div>
                        <div className="apple-input-group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Email Access</label>
                            <input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="apple-input !py-3" placeholder="Access Identity" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Dismiss</button>
                        <button onClick={handleSave} className="apple-btn apple-btn-primary !py-2.5 !px-8 text-sm">{editStudent ? 'Commit Changes' : 'Initialize Profile'}</button>
                    </div>
                </div>
            </Modal>
        </PageTransition>
    );
}
