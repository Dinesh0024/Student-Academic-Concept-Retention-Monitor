import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineDownload, HiOutlineDocumentReport, HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineChartBar } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import { getRetentionLevel } from '../utils/analytics';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import mockDb from '../utils/mockDb';
import toast from 'react-hot-toast';

export default function Reports() {
    const [generating, setGenerating] = useState(null);
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [concepts, setConcepts] = useState([]);
    const [results, setResults] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const [stData, sData, cData, rData] = await Promise.all([
                mockDb.getStudents(),
                mockDb.getSubjects(),
                mockDb.getConcepts(),
                mockDb.getResults()
            ]);
            setStudents(stData);
            setSubjects(sData);
            setConcepts(cData);
            setResults(rData);
        };
        fetchData();
    }, []);

    const generateStudentReport = () => {
        setGenerating('student');
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text('Student Performance Matrix', 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(110);
        doc.text(`System Generated Analytics — ${new Date().toLocaleDateString()}`, 14, 30);

        doc.autoTable({
            startY: 40,
            head: [['Candidate', 'Access Code', 'Discipline', 'Sem', 'Retention', 'Verdict']],
            body: students.map(s => [s.name, s.enrollment, s.department, s.semester, `${s.retentionScore}%`, getRetentionLevel(s.retentionScore).label.toUpperCase()]),
            theme: 'striped',
            headStyles: { fillColor: [0, 122, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 4 },
        });

        doc.save('matrix_report_students.pdf');
        setGenerating(null);
        toast.success('Matrix report archived');
    };

    const generateSubjectReport = () => {
        setGenerating('subject');
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text('Discipline Insight Analysis', 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(110);
        doc.text(`System Generated Analytics — ${new Date().toLocaleDateString()}`, 14, 30);

        doc.autoTable({
            startY: 40,
            head: [['Discipline', 'Code', 'Department', 'Semester', 'Items']],
            body: subjects.map(s => [s.name, s.code, s.department, s.semester, concepts.filter(c => c.subjectId === s.id || c.subjectId === s.id.toString()).length]),
            theme: 'striped',
            headStyles: { fillColor: [88, 86, 214] },
            styles: { fontSize: 8, cellPadding: 4 },
        });

        doc.save('discipline_insight.pdf');
        setGenerating(null);
        toast.success('Discipline insight archived');
    };

    const reportTypes = [
        {
            id: 'student',
            title: 'Performance Matrix',
            desc: 'Aggregate candidate retention indices, performance levels, and clinical department analysis.',
            icon: HiOutlineUserGroup,
            color: '#007AFF',
            generate: generateStudentReport,
        },
        {
            id: 'subject',
            title: 'Discipline Analysis',
            desc: 'Subject-level concept mastery breakdown with automated difficulty distribution data.',
            icon: HiOutlineAcademicCap,
            color: '#5856D6',
            generate: generateSubjectReport,
        },
        {
            id: 'class',
            title: 'Departmental Audit',
            desc: 'High-level auditing of departmental retention benchmarks and collaborative performance.',
            icon: HiOutlineDocumentReport,
            color: '#10B981',
            generate: generateStudentReport, // Reuse for now
        },
    ];

    return (
        <PageTransition>
            <div className="pb-12">
                <header className="mb-10 lg:px-0">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-bold tracking-tight text-app-text">Institution Analytics</h1>
                            <p className="text-app-text-tertiary font-medium tracking-tight">Consolidated performance intelligence and cognitive gap reports</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {reportTypes.map((r, i) => (
                        <motion.div key={r.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <div className="premium-card bg-white p-10 h-full flex flex-col group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-700">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-10 transition-transform group-hover:scale-110 shadow-inner" style={{ background: `${r.color}10`, color: r.color }}>
                                    <r.icon className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">{r.title}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed flex-1 mb-10">{r.desc}</p>
                                <button
                                    onClick={r.generate}
                                    disabled={generating === r.id}
                                    className="apple-btn apple-btn-primary flex items-center justify-center gap-3 !py-4 !px-8 !text-[10px] !font-black !uppercase !tracking-[0.2em] shadow-xl shadow-blue-500/10"
                                >
                                    {generating === r.id ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <HiOutlineDownload className="w-4 h-4" />
                                    )}
                                    Extract Dataset
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Live Data Matrix */}
                <div className="premium-card bg-white p-10 mb-12">
                    <div className="flex items-center justify-between mb-8 text-left">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Audit Intelligence Matrix</h3>
                        <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 italic">Live Dataset Integration</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-4 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate</th>
                                    <th className="py-4 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assessment Module</th>
                                    <th className="py-4 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Index</th>
                                    <th className="py-4 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status/Verdict</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {results.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-10 text-center text-sm font-medium text-gray-400">No audit records available in current buffer.</td>
                                    </tr>
                                ) : results.map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-2 font-bold text-gray-800 text-sm">{r.studentName}</td>
                                        <td className="py-4 px-2 font-medium text-gray-500 text-sm">{r.testName}</td>
                                        <td className="py-4 px-2 font-black text-blue-600 text-sm">{r.score}%</td>
                                        <td className="py-4 px-2">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${r.score >= 75 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                {r.score >= 75 ? 'Optimal' : 'Needs Review'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="premium-card bg-white p-12 border-l-4 border-l-blue-500">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10 text-center">System Metadata Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
                        <div className="text-center group">
                            <p className="text-5xl font-black text-gray-900 mb-2 group-hover:text-blue-500 transition-colors">{students.length}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Candidates</p>
                        </div>
                        <div className="text-center group">
                            <p className="text-5xl font-black text-gray-900 mb-2 group-hover:text-violet-500 transition-colors">{subjects.length}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Domains</p>
                        </div>
                        <div className="text-center group">
                            <p className="text-5xl font-black text-gray-900 mb-2 group-hover:text-emerald-500 transition-colors">{concepts.length}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Concepts</p>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
