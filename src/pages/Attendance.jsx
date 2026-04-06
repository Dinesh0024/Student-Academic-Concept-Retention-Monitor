import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineUserGroup, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineSearch, HiOutlineFilter, HiOutlineExternalLink } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import GlassCard from '../components/GlassCard';
import { mockDb } from '../utils/mockDb';

export default function Attendance() {
    const [tests, setTests] = useState([]);
    const [students, setStudents] = useState([]);
    const [results, setResults] = useState([]);
    const [selectedTestId, setSelectedTestId] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ total: 0, attended: 0, missed: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allTests, allStudents, allResults] = await Promise.all([
                    mockDb.getTests(),
                    mockDb.getStudents(),
                    mockDb.getResults()
                ]);
                setTests(allTests.filter(t => t.isLive || t.status === 'Completed'));
                setStudents(allStudents);
                setResults(allResults);
                if (allTests.length > 0) setSelectedTestId(allTests[0].id);
            } catch (error) {
                console.error("Failed to fetch attendance data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const selectedTest = tests.find(t => t.id === selectedTestId);
    
    // Cross-reference students with results for the selected test
    const attendanceData = students.map(student => {
        const result = results.find(r => r.testId === selectedTestId && r.studentEmail === student.email);
        return {
            ...student,
            attended: !!result,
            score: result ? result.score : null,
            isMissed: result ? result.isMissed : false,
            timestamp: result ? result.timestamp : null
        };
    }).filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const attended = attendanceData.filter(s => s.attended && !s.isMissed).length;
        const missed = attendanceData.filter(s => !s.attended || s.isMissed).length;
        setStats({ total: attendanceData.length, attended, missed });
    }, [searchTerm, selectedTestId, students, results]);

    const handleExternalLink = (student) => {
        import('react-hot-toast').then(({ toast }) => {
            toast.success(`Retention insights: ${student.name} (${student.email}).`, {
                icon: '📋',
                duration: 4000
            });
        });
    };

    if (loading) return <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Attendance Matrix...</div>;

    return (
        <PageTransition>
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">Attendance Matrix</h1>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Cross-Portal Participation Monitoring</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="premium-card !p-1 !rounded-2xl bg-gray-50/50 border border-gray-100 flex items-center">
                            <HiOutlineFilter className="w-4 h-4 text-gray-400 ml-4" />
                            <select 
                                value={selectedTestId}
                                onChange={(e) => setSelectedTestId(e.target.value)}
                                className="bg-transparent border-none text-sm font-bold text-gray-700 px-4 py-3 focus:ring-0 min-w-[200px]"
                            >
                                {tests.map(test => (
                                    <option key={test.id} value={test.id}>{test.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="premium-card !p-1 !rounded-2xl bg-white border border-gray-100 flex items-center shadow-sm">
                            <HiOutlineSearch className="w-4 h-4 text-gray-400 ml-4" />
                            <input 
                                type="text"
                                placeholder="Filter students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none text-sm font-bold text-gray-700 px-4 py-3 focus:ring-0 w-64"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <GlassCard className="p-8 border-l-4 border-l-indigo-500">
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Total Candidates</p>
                        <h3 className="text-4xl font-black text-gray-900">{stats.total}</h3>
                    </GlassCard>
                    <GlassCard className="p-8 border-l-4 border-l-emerald-500">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Attended</p>
                        <h3 className="text-4xl font-black text-emerald-600">{stats.attended}</h3>
                    </GlassCard>
                    <GlassCard className="p-8 border-l-4 border-l-rose-500">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Not Attended / Missed</p>
                        <h3 className="text-4xl font-black text-rose-600">{stats.missed}</h3>
                    </GlassCard>
                </div>

                {/* Main Table */}
                <GlassCard className="overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-bottom border-gray-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Identity</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Performance</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Submission Time</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <AnimatePresence mode="popLayout">
                                    {attendanceData.map((student, idx) => (
                                        <motion.tr 
                                            key={student.email}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group hover:bg-gray-50/30 transition-colors"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-sm group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{student.name}</p>
                                                        <p className="text-xs text-gray-400 font-medium">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {student.attended && !student.isMissed ? (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                                                        Committed
                                                    </div>
                                                ) : student.isMissed ? (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        <HiOutlineXCircle className="w-3.5 h-3.5" />
                                                        Late Submission
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        <HiOutlineXCircle className="w-3.5 h-3.5" />
                                                        Not Attended
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                {student.attended ? (
                                                    <span className={`font-black text-lg ${student.score >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {student.score}%
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300 font-bold">--</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-sm font-medium text-gray-500">
                                                {student.timestamp ? new Date(student.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                            </td>
                                            <td className="px-8 py-6">
                                                <button 
                                                    onClick={() => handleExternalLink(student)}
                                                    className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                                                >
                                                    <HiOutlineExternalLink className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                    {attendanceData.length === 0 && (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <HiOutlineUserGroup className="w-8 h-8" />
                            </div>
                            <h4 className="text-gray-900 font-bold mb-1">No matching students</h4>
                            <p className="text-xs text-gray-400 font-medium tracking-wide">Adjust your search or filter to see results.</p>
                        </div>
                    )}
                </GlassCard>
            </div>
        </PageTransition>
    );
}
