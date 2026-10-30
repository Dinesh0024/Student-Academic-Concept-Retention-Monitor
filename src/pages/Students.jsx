import mockDb from '../utils/apiDb';
import { useState, useEffect } from 'react';
import { HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineUserGroup, HiOutlineTrendingUp, HiOutlineAcademicCap } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Students() {
    const [studentList, setStudentList] = useState([]);
    const [search, setSearch] = useState('');
    const [filterRisk, setFilterRisk] = useState(false);
    const [profileStudent, setProfileStudent] = useState(null);

    const fetchStudents = async () => {
        try {
            const data = await mockDb.getStudents();
            setStudentList(data.map((student) => ({
                ...student,
                enrollment: student.enrollment || student.enrollment_no || '',
                department: student.department || '',
                semester: Number(student.semester) || 1,
                retentionScore: Number(student.retentionScore) || 75,
                avatar: student.avatar || '👤'
            })));
        } catch (err) {
            console.error('Failed to load students:', err);
            toast.error(err.message || 'Could not load student accounts.');
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const [modalOpen, setModalOpen] = useState(false);
    const [editStudent, setEditStudent] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', enrollment: '', department: '', semester: '', password: '' });

    const filtered = studentList.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
            String(s.enrollment || '').toLowerCase().includes(search.toLowerCase()) ||
            s.department.toLowerCase().includes(search.toLowerCase());
        
        if (filterRisk) return matchesSearch && s.retentionScore <= 65;
        return matchesSearch;
    });

    const openEdit = (s) => {
        setEditStudent(s);
        setForm({ name: s.name, email: s.email, enrollment: s.enrollment, department: s.department, semester: s.semester.toString(), password: '' });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.email.trim() || !form.enrollment.trim() || !form.department.trim() || !form.semester) {
            toast.error('Complete all student account fields.');
            return;
        }
        if (!editStudent && form.password.length < 8) {
            toast.error('Set a temporary password of at least 8 characters.');
            return;
        }

        setSaving(true);
        try {
            if (editStudent) {
                await mockDb.saveStudent({
                    ...editStudent,
                    name: form.name.trim(),
                    email: form.email.trim().toLowerCase(),
                    enrollment: form.enrollment.trim(),
                    enrollment_no: form.enrollment.trim(),
                    department: form.department.trim(),
                    semester: parseInt(form.semester, 10) || editStudent.semester
                });
                toast.success('Student profile updated.');
            } else {
                await mockDb.createStudentAccount({
                    name: form.name.trim(),
                    email: form.email.trim().toLowerCase(),
                    enrollment_no: form.enrollment.trim(),
                    department: form.department.trim(),
                    semester: form.semester,
                    password: form.password
                });
                toast.success('Student account created. Share the login credentials securely.');
            }
            await fetchStudents();
            setModalOpen(false);
        } catch (err) {
            console.error('Failed to save student account:', err);
            toast.error(err.message || 'Could not save the student account.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this student?")) {
            try {
                await mockDb.deleteStudent(id);
                await fetchStudents();
                toast.success('Access revoked');
            } catch (err) {
                console.error('Failed to revoke student access:', err);
                toast.error(err.message || 'Could not revoke student access.');
            }
        }
    };

    return (
        <PageTransition>
            <div className="pb-12">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Student Accounts</h1>
                        <p className="text-gray-500 font-medium tracking-tight">Create and manage student portal access</p>
                    </div>
                    <button onClick={() => { setEditStudent(null); setForm({ name: '', email: '', enrollment: '', department: '', semester: '1', password: '' }); setModalOpen(true); }} className="apple-btn apple-btn-primary flex items-center gap-2 !py-2.5 !px-6 shadow-xl shadow-blue-500/20">
                        <HiOutlinePlus className="w-5 h-5" /> Create Student Account
                    </button>
                </div>

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
                        <div className="flex gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                            <button 
                                onClick={() => setFilterRisk(false)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!filterRisk ? 'bg-white text-text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                All Students
                            </button>
                            <button 
                                onClick={() => setFilterRisk(true)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterRisk ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-gray-400 hover:text-rose-500'}`}
                            >
                                Critical Retention
                            </button>
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
                                    return (
                                        <tr key={s.id} className="group hover:bg-blue-50/20 transition-colors cursor-pointer" onClick={() => setProfileStudent(s)}>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">{s.avatar}</div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm leading-none mb-1">{s.name}</p>
                                                        <p className="text-xs text-gray-500 mb-1">{s.email}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{s.enrollment}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-bold text-gray-500">{s.department}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-1.5">
                                                    {s.retentionScore <= 65 ? (
                                                        <>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Critical</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                                                        </>
                                                    )}
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

            {/* Modal & Profile overlays */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editStudent ? 'Update Profile' : 'Create Student Account'}>
                <div className="space-y-6 pt-2">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="apple-input-group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Full Name</label>
                            <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="apple-input !py-3" placeholder="Student name" />
                        </div>
                        <div className="apple-input-group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Email Access</label>
                            <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="apple-input !py-3" placeholder="student@college.edu" />
                        </div>
                        <div className="apple-input-group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Enrollment Number</label>
                            <input value={form.enrollment} onChange={(e) => setForm(f => ({ ...f, enrollment: e.target.value }))} className="apple-input !py-3" placeholder="Enrollment number" />
                        </div>
                        <div className="apple-input-group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Department</label>
                            <input value={form.department} onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))} className="apple-input !py-3" placeholder="Department" />
                        </div>
                        <div className="apple-input-group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Semester</label>
                            <input type="number" min="1" value={form.semester} onChange={(e) => setForm(f => ({ ...f, semester: e.target.value }))} className="apple-input !py-3" placeholder="Semester" />
                        </div>
                        {!editStudent && (
                            <div className="apple-input-group">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Temporary Password</label>
                                <input type="password" minLength="8" autoComplete="new-password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className="apple-input !py-3" placeholder="At least 8 characters" />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setModalOpen(false)} disabled={saving} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50">Dismiss</button>
                        <button onClick={handleSave} disabled={saving} className="apple-btn apple-btn-primary !py-2.5 !px-8 text-sm disabled:opacity-50">{saving ? 'Saving...' : editStudent ? 'Save Changes' : 'Create Account'}</button>
                    </div>
                </div>
            </Modal>

            {/* Student Profile Card Modal */}
            <Modal isOpen={!!profileStudent} onClose={() => setProfileStudent(null)} title="Student Cognitive Profile">
                {profileStudent && (
                    <div className="space-y-6 pt-2">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-3xl flex items-center justify-center">
                                {profileStudent.avatar}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{profileStudent.name}</h3>
                                <p className="text-xs text-gray-500 font-medium">{profileStudent.email} • {profileStudent.enrollment}</p>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{profileStudent.department} (Semester {profileStudent.semester})</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Retention Index</p>
                                <p className="text-3xl font-black text-gray-900">{profileStudent.retentionScore}%</p>
                            </div>
                            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Status</p>
                                <p className="text-sm font-bold text-gray-900 mt-2">
                                    {profileStudent.retentionScore <= 65 ? 'Critical Intervention Required' : 'Optimal Track'}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button onClick={() => setProfileStudent(null)} className="apple-btn apple-btn-primary !py-2.5 !px-8 text-sm">
                                Close Profile
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </PageTransition>
    );
}
