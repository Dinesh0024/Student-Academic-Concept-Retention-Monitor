import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineDownload, HiOutlineDocumentReport, HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineChartBar } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import { getRetentionLevel } from '../utils/analytics';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import mockDb from '../utils/mockDb';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Reports() {
    const [generating, setGenerating] = useState(null);
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [concepts, setConcepts] = useState([]);
    const [results, setResults] = useState([]);
    const { user } = useAuth();
    const isStudent = user?.role === 'student';

    useEffect(() => {
        const fetchData = async () => {
            try {
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
            } catch (err) {
                console.error('Failed to fetch report data:', err);
                toast.error('Failed to load report data');
            }
        };
        fetchData();
    }, []);

    // Filter results for student role — students see only their own data
    const displayResults = isStudent
        ? results.filter(r => r.studentEmail === user?.email || r.studentName?.toLowerCase() === user?.name?.toLowerCase())
        : results;

    const generateStudentReport = async () => {
        setGenerating('student');
        try {
            await new Promise(resolve => setTimeout(resolve, 400)); // Brief visual delay
            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.setTextColor(30, 30, 30);
            doc.text('Student Performance Matrix', 14, 22);
            doc.setFontSize(10);
            doc.setTextColor(110);
            doc.text(`System Generated Analytics — ${new Date().toLocaleDateString()}`, 14, 30);
            if (isStudent) {
                doc.text(`Report for: ${user?.name || 'Student'}`, 14, 36);
            }

            const tableData = isStudent
                ? students.filter(s => s.email === user?.email || s.name?.toLowerCase() === user?.name?.toLowerCase())
                : students;

            doc.autoTable({
                startY: isStudent ? 42 : 40,
                head: [['Candidate', 'Access Code', 'Discipline', 'Sem', 'Retention', 'Verdict']],
                body: tableData.map(s => [
                    s.name,
                    s.enrollment,
                    s.department,
                    s.semester,
                    `${s.retentionScore}%`,
                    getRetentionLevel(s.retentionScore).label.toUpperCase()
                ]),
                theme: 'striped',
                headStyles: { fillColor: [0, 122, 255], fontStyle: 'bold', fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 4 },
                alternateRowStyles: { fillColor: [245, 247, 250] },
            });

            // Add assessment results section
            if (displayResults.length > 0) {
                const finalY = doc.lastAutoTable.finalY + 15;
                doc.setFontSize(16);
                doc.setTextColor(30, 30, 30);
                doc.text('Assessment Results', 14, finalY);

                doc.autoTable({
                    startY: finalY + 6,
                    head: [['Candidate', 'Assessment', 'Score', 'Status']],
                    body: displayResults.map(r => [
                        r.studentName,
                        r.testName || 'N/A',
                        r.isMissed ? 'Missed' : `${r.score}%`,
                        r.isMissed ? 'MISSED' : (r.score >= 75 ? 'OPTIMAL' : 'NEEDS REVIEW')
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold', fontSize: 9 },
                    styles: { fontSize: 8, cellPadding: 4 },
                    alternateRowStyles: { fillColor: [245, 247, 250] },
                });
            }

            doc.save('matrix_report_students.pdf');
            toast.success('Performance Matrix report downloaded');
        } catch (err) {
            console.error('Error generating student report:', err);
            toast.error('Failed to generate report');
        } finally {
            setGenerating(null);
        }
    };

    const generateSubjectReport = async () => {
        setGenerating('subject');
        try {
            await new Promise(resolve => setTimeout(resolve, 400));
            const doc = new jsPDF();

            doc.setFontSize(22);
            doc.setTextColor(30, 30, 30);
            doc.text('Discipline Insight Analysis', 14, 22);
            doc.setFontSize(10);
            doc.setTextColor(110);
            doc.text(`System Generated Analytics — ${new Date().toLocaleDateString()}`, 14, 30);

            doc.autoTable({
                startY: 40,
                head: [['Discipline', 'Code', 'Department', 'Semester', 'Concepts']],
                body: subjects.map(s => [
                    s.name,
                    s.code,
                    s.department,
                    s.semester,
                    concepts.filter(c => c.subjectId === s.id || c.subjectId === s.id?.toString()).length
                ]),
                theme: 'striped',
                headStyles: { fillColor: [88, 86, 214], fontStyle: 'bold', fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 4 },
                alternateRowStyles: { fillColor: [245, 247, 250] },
            });

            // Add concept mastery breakdown
            const finalY = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(16);
            doc.setTextColor(30, 30, 30);
            doc.text('Concept Mastery Breakdown', 14, finalY);

            doc.autoTable({
                startY: finalY + 6,
                head: [['Concept', 'Subject', 'Mastery', 'Status']],
                body: concepts.map(c => {
                    const subj = subjects.find(s => s.id === c.subjectId || s.id?.toString() === c.subjectId?.toString());
                    return [
                        c.name,
                        subj?.name || 'N/A',
                        `${c.mastery}%`,
                        c.mastery >= 70 ? 'STRONG' : c.mastery >= 50 ? 'MODERATE' : 'WEAK'
                    ];
                }),
                theme: 'striped',
                headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold', fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 4 },
                alternateRowStyles: { fillColor: [245, 247, 250] },
            });

            doc.save('discipline_insight.pdf');
            toast.success('Discipline Analysis report downloaded');
        } catch (err) {
            console.error('Error generating subject report:', err);
            toast.error('Failed to generate report');
        } finally {
            setGenerating(null);
        }
    };

    const generateDepartmentalReport = async () => {
        setGenerating('class');
        try {
            await new Promise(resolve => setTimeout(resolve, 400));
            const doc = new jsPDF();

            doc.setFontSize(22);
            doc.setTextColor(30, 30, 30);
            doc.text('Departmental Audit Report', 14, 22);
            doc.setFontSize(10);
            doc.setTextColor(110);
            doc.text(`System Generated Analytics — ${new Date().toLocaleDateString()}`, 14, 30);

            // Group students by department
            const departments = {};
            students.forEach(s => {
                if (!departments[s.department]) {
                    departments[s.department] = { students: [], totalScore: 0 };
                }
                departments[s.department].students.push(s);
                departments[s.department].totalScore += s.retentionScore;
            });

            const deptData = Object.entries(departments).map(([dept, data]) => {
                const avg = Math.round(data.totalScore / data.students.length);
                const best = Math.max(...data.students.map(s => s.retentionScore));
                const worst = Math.min(...data.students.map(s => s.retentionScore));
                return [
                    dept,
                    data.students.length,
                    `${avg}%`,
                    `${best}%`,
                    `${worst}%`,
                    getRetentionLevel(avg).label.toUpperCase()
                ];
            });

            doc.autoTable({
                startY: 40,
                head: [['Department', 'Students', 'Avg Retention', 'Highest', 'Lowest', 'Verdict']],
                body: deptData,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold', fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 4 },
                alternateRowStyles: { fillColor: [245, 247, 250] },
            });

            // Subject count per department
            const finalY = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(16);
            doc.setTextColor(30, 30, 30);
            doc.text('Subjects per Department', 14, finalY);

            const subjByDept = {};
            subjects.forEach(s => {
                if (!subjByDept[s.department]) subjByDept[s.department] = [];
                subjByDept[s.department].push(s);
            });

            doc.autoTable({
                startY: finalY + 6,
                head: [['Department', 'Subjects', 'Subject List']],
                body: Object.entries(subjByDept).map(([dept, subs]) => [
                    dept,
                    subs.length,
                    subs.map(s => s.name).join(', ')
                ]),
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold', fontSize: 9 },
                styles: { fontSize: 7, cellPadding: 4 },
                columnStyles: { 2: { cellWidth: 80 } },
                alternateRowStyles: { fillColor: [245, 247, 250] },
            });

            doc.save('departmental_audit.pdf');
            toast.success('Departmental Audit report downloaded');
        } catch (err) {
            console.error('Error generating departmental report:', err);
            toast.error('Failed to generate report');
        } finally {
            setGenerating(null);
        }
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
            generate: generateDepartmentalReport,
        },
    ];

    return (
        <PageTransition>
            <div className="pb-12">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Audit Laboratory</h1>
                        <p className="text-gray-500 font-medium tracking-tight">Extract and synthesize high-fidelity academic intelligence reports</p>
                    </div>
                </div>

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
                                    disabled={generating !== null}
                                    className="apple-btn apple-btn-primary flex items-center justify-center gap-3 !py-4 !px-8 !text-[10px] !font-black !uppercase !tracking-[0.2em] shadow-xl shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {generating === r.id ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <HiOutlineDownload className="w-4 h-4" />
                                    )}
                                    {generating === r.id ? 'Generating...' : 'Extract Dataset'}
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
                                {displayResults.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-10 text-center text-sm font-medium text-gray-400">No audit records available in current buffer.</td>
                                    </tr>
                                ) : displayResults.map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-2 font-bold text-gray-800 text-sm">{r.studentName}</td>
                                        <td className="py-4 px-2 font-medium text-gray-500 text-sm">{r.testName || 'N/A'}</td>
                                        <td className="py-4 px-2 font-black text-blue-600 text-sm">
                                            {r.isMissed ? (
                                                <span className="text-rose-500">Missed</span>
                                            ) : (
                                                `${r.score}%`
                                            )}
                                        </td>
                                        <td className="py-4 px-2">
                                            {r.isMissed ? (
                                                <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100">
                                                    Missed
                                                </span>
                                            ) : (
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${r.score >= 75 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                    {r.score >= 75 ? 'Optimal' : 'Needs Review'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="premium-card bg-white p-12 border-l-4 border-l-blue-500">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10 text-center">System Metadata Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-12">
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
                        <div className="text-center group">
                            <p className="text-5xl font-black text-gray-900 mb-2 group-hover:text-amber-500 transition-colors">{displayResults.length}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Results</p>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
