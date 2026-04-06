import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUserGroup, HiOutlineTrendingUp, HiOutlineExclamationCircle, HiOutlineStar, HiOutlineLightBulb, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import PageTransition from '../components/PageTransition';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import mockDb from '../utils/mockDb';
import { getRetentionLevel } from '../utils/analytics';
import { conceptInsights } from '../data/mockData';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function Dashboard() {
    const [selectedStudentIdx, setSelectedStudentIdx] = useState(null);
    const [results, setResults] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [concepts, setConcepts] = useState([]);
    const [students, setStudents] = useState([]);
    const [feedbackText, setFeedbackText] = useState({});
    const [editingScoreId, setEditingScoreId] = useState(null);
    const [editingScoreValue, setEditingScoreValue] = useState("");

    const fetchData = async () => {
        try {
            const [rData, sData, cData, stData] = await Promise.all([
                mockDb.getResults(),
                mockDb.getSubjects(),
                mockDb.getConcepts(),
                mockDb.getStudents()
            ]);
            setResults(rData.reverse());
            setSubjects(sData);
            setConcepts(cData);
            setStudents(stData);
        } catch (err) {
            console.error("Dashboard fetch failed:", err);
            toast.error("Cloud synchronization failed");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFeedbackSubmit = async (resultId) => {
        if (!feedbackText[resultId]) return;
        await mockDb.updateResultFeedback(resultId, feedbackText[resultId], facultyUser?.name || 'Faculty Member');
        fetchData();
        toast.success("Feedback submitted");
    };

    const handleDeleteResult = async (resultId) => {
        if (window.confirm("Are you sure you want to delete this result?")) {
            await mockDb.deleteResult(resultId);
            fetchData();
            toast.success("Result deleted");
        }
    };

    const handleUpdateScore = async (resultId, newScore) => {
        const score = parseInt(newScore, 10);
        if (!isNaN(score) && score >= 0 && score <= 100) {
            await mockDb.updateResultScore(resultId, score);
            fetchData();
            toast.success("Score updated successfully");
            setEditingScoreId(null);
        } else {
            toast.error("Please enter a valid score (0-100)");
        }
    };

    // Dynamic Analytics Calculations
    const getChartData = () => {
        // Group results by subject
        const performanceMap = {};
        results.forEach(r => {
            if (!r.isMissed) {
                if (!performanceMap[r.testName]) performanceMap[r.testName] = { total: 0, count: 0 };
                performanceMap[r.testName].total += (parseInt(r.score) || 0);
                performanceMap[r.testName].count++;
            }
        });

        const subjectLabels = Object.keys(performanceMap).slice(0, 5);
        const subjectData = subjectLabels.map(label => Math.round(performanceMap[label].total / performanceMap[label].count));

        // Group by month for trend
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonthIdx = new Date().getMonth();
        const trendLabels = months.slice(Math.max(0, currentMonthIdx - 5), currentMonthIdx + 1);

        // Simple mock trend if no data, otherwise group by timestamp
        const trendMap = {};
        trendLabels.forEach(m => trendMap[m] = { total: 0, count: 0 });

        results.forEach(r => {
            if (!r.isMissed && r.timestamp) {
                const date = new Date(r.timestamp);
                const m = months[date.getMonth()];
                if (trendMap[m]) {
                    trendMap[m].total += (parseInt(r.score) || 0);
                    trendMap[m].count++;
                }
            }
        });

        const trendData = trendLabels.map(m => trendMap[m].count > 0 ? Math.round(trendMap[m].total / trendMap[m].count) : 0);

        return {
            subjects: {
                labels: subjectLabels.length ? subjectLabels : ['No Data'],
                datasets: [{
                    label: 'Avg Score %',
                    data: subjectData.length ? subjectData : [0],
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.85)',
                        'rgba(59, 130, 246, 0.85)',
                        'rgba(6, 182, 212, 0.85)',
                        'rgba(16, 185, 129, 0.85)',
                        'rgba(245, 158, 11, 0.85)',
                        'rgba(239, 68, 68, 0.85)',
                        'rgba(236, 72, 153, 0.85)',
                    ],
                    hoverBackgroundColor: [
                        'rgba(139, 92, 246, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(6, 182, 212, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(236, 72, 153, 1)',
                    ],
                    borderRadius: 12,
                    borderSkipped: false,
                    barThickness: 40,
                    hoverBorderColor: 'rgba(255,255,255,0.8)',
                    hoverBorderWidth: 2,
                }]
            },
            trend: {
                labels: trendLabels,
                datasets: [{
                    label: 'Retention Velocity',
                    data: trendData,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);
                        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
                        gradient.addColorStop(0.4, 'rgba(139, 92, 246, 0.15)');
                        gradient.addColorStop(0.7, 'rgba(6, 182, 212, 0.05)');
                        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
                        return gradient;
                    },
                    fill: true,
                    tension: 0.45,
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'rgba(99, 102, 241, 1)',
                    pointBorderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 9,
                    pointHoverBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 3,
                }]
            }
        };
    };

    const analytics = getChartData();

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'nearest',
            intersect: false,
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                borderColor: 'rgba(139, 92, 246, 0.4)',
                borderWidth: 1,
                padding: 16,
                boxPadding: 8,
                usePointStyle: true,
                cornerRadius: 14,
                titleFont: { weight: '700', size: 14, family: 'Inter, system-ui, sans-serif' },
                bodyFont: { size: 13, family: 'Inter, system-ui, sans-serif' },
                displayColors: true,
                caretSize: 8,
                caretPadding: 8,
                callbacks: {
                    labelColor: function(context) {
                        const colors = [
                            'rgba(139, 92, 246, 1)',
                            'rgba(59, 130, 246, 1)',
                            'rgba(6, 182, 212, 1)',
                            'rgba(16, 185, 129, 1)',
                            'rgba(245, 158, 11, 1)',
                        ];
                        return {
                            borderColor: colors[context.dataIndex % colors.length] || 'rgba(99, 102, 241, 1)',
                            backgroundColor: colors[context.dataIndex % colors.length] || 'rgba(99, 102, 241, 0.8)',
                            borderRadius: 4,
                        };
                    }
                }
            }
        },
        scales: {
            y: {
                border: { display: false },
                grid: { color: 'rgba(148, 163, 184, 0.08)', drawTicks: false },
                ticks: { color: '#94a3b8', font: { size: 11, weight: '600' }, padding: 8 }
            },
            x: {
                border: { display: false },
                grid: { display: false },
                ticks: { color: '#64748b', font: { size: 11, weight: '600' }, padding: 8 }
            }
        },
    };

    const lineChartData = analytics.trend;
    const barChartData = analytics.subjects;

    const atRiskStudents = students.filter(s => s.retentionScore <= 65).sort((a, b) => a.retentionScore - b.retentionScore);
    const topStudents = [...students].sort((a, b) => b.retentionScore - a.retentionScore).slice(0, 4);

    return (
        <PageTransition>
            <div className="pb-12">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold tracking-tight text-text-primary mb-2">Academic Overview</h1>
                        <p className="text-lg text-text-secondary font-medium">Monitoring concept retention across all departments</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="apple-btn apple-btn-secondary !py-2 !px-4 text-sm font-bold bg-surface/50 border border-border/10 text-text-primary">Download Report</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard title="Active Students" value={students.length} trend={5.2} icon={HiOutlineUserGroup} />
                    <StatCard title="Avg. Retention" value="76%" trend={3.1} icon={HiOutlineTrendingUp} />
                    <StatCard title="Priority Alerts" value={atRiskStudents.length} trend={-2.3} icon={HiOutlineExclamationCircle} />
                    <StatCard title="Top Performers" value={topStudents.length} trend={1.2} icon={HiOutlineStar} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    <div className="lg:col-span-2 premium-card p-8 h-[450px] flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-bold text-lg text-text-primary tracking-tight">Retention Velocity</h3>
                            <div className="flex gap-2 items-center">
                                <span className="w-3 h-3 rounded-full bg-accent"></span>
                                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Aggregate %</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <Line data={lineChartData} options={chartOptions} />
                        </div>
                    </div>

                    <div className="premium-card p-8 h-[450px] flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-bold text-lg text-text-primary tracking-tight">Unit Performance</h3>
                        </div>
                        <div className="flex-1">
                            <Bar data={barChartData} options={chartOptions} />
                        </div>
                    </div>
                </div>

                {/* Critical Intervention Radar */}
                <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <HiOutlineExclamationCircle className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-text-primary tracking-tight">Critical Intervention Radar</h2>
                            <p className="text-sm font-medium text-text-secondary">Immediate priority candidates identified by retention audit</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {atRiskStudents.map((s, i) => (
                            <motion.div 
                                key={s.id} 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="premium-card p-6 border-l-4 border-l-rose-500 bg-rose-500/[0.02] group hover:bg-rose-500/[0.04] transition-all"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-surface shadow-sm border border-border/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                            {s.avatar}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-text-primary text-sm leading-none mb-1">{s.name}</h4>
                                            <p className="text-[10px] font-black text-text-tertiary tracking-widest uppercase">{s.enrollment}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-rose-500">{s.retentionScore}%</span>
                                        <p className="text-[8px] font-black text-rose-500/60 uppercase tracking-[0.2em] leading-none">RETENTION</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 mb-6">
                                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest leading-none">Weak Points</p>
                                    <div className="flex flex-wrap gap-2">
                                        {s.weakConcepts?.slice(0, 3).map(cid => (
                                            <span key={cid} className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 text-[9px] font-bold border border-rose-500/5">
                                                {concepts.find(c => c.id == cid)?.name || 'Technical Gap'}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <button className="w-full apple-btn !py-2.5 !text-[10px] !font-black !uppercase !tracking-widest bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    Draft Intervention
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="premium-card p-8 h-[600px] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8 sticky top-0 bg-surface z-10 py-2 border-b border-border/5">
                            <h3 className="font-bold text-lg text-text-primary tracking-tight flex items-center gap-2">
                                <HiOutlineExclamationCircle className="w-5 h-5 text-accent" />
                                Student Results & Analysis
                            </h3>
                            <button className="text-[10px] font-black text-accent hover:opacity-80 tracking-widest uppercase">Analyze All</button>
                        </div>
                        <div className="space-y-6">
                            {results.length === 0 ? (
                                <p className="text-sm font-medium text-gray-400 text-center py-10">No tests submitted yet.</p>
                            ) : results.map((result) => {
                                const student = students.find(s => s.name === result.studentName || s.email === result.studentEmail);
                                const weakConceptsList = student?.weakConcepts || [];
                                const recommendations = weakConceptsList.map(cid => ({
                                    ...conceptInsights[cid],
                                    name: concepts.find(c => c.id == cid)?.name || 'Technical Concept'
                                })).filter(r => r.fault);

                                return (
                                <div key={result.id} className="p-5 bg-surface-secondary/50 rounded-2xl border border-border/5 hover:shadow-xl hover:bg-surface transition-all">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-xl border border-accent/20">
                                                👨‍🎓
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-text-primary">{result.studentName}</p>
                                                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{result.testName} • {new Date(result.timestamp).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center justify-end gap-3">
                                            {result.isMissed ? (
                                                <div className="flex items-center gap-1">
                                                    <p className="font-black text-xl text-text-tertiary uppercase tracking-widest">Missed</p>
                                                    <button onClick={() => handleDeleteResult(result.id)} className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded bg-transparent transition-all" title="Delete Record">
                                                        <HiOutlineTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : editingScoreId === result.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="0" max="100"
                                                        className="apple-input !py-1 !px-2 w-16 text-center text-sm font-black"
                                                        value={editingScoreValue}
                                                        onChange={(e) => setEditingScoreValue(e.target.value)}
                                                    />
                                                    <button onClick={() => handleUpdateScore(result.id, editingScoreValue)} className="text-[10px] font-black uppercase tracking-widest text-text-primary">Save</button>
                                                    <button onClick={() => setEditingScoreId(null)} className="text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-text-primary">Cancel</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="font-black text-xl text-text-primary">{result.score}%</p>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => { setEditingScoreId(result.id); setEditingScoreValue(result.score); }} className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded bg-transparent transition-all" title="Edit Score">
                                                            <HiOutlinePencil className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteResult(result.id)} className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded bg-transparent transition-all" title="Delete Record">
                                                            <HiOutlineTrash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {result.isMissed ? (
                                        <div className="bg-surface-secondary rounded-xl p-4 border border-border/10 shadow-sm mb-4">
                                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Student Reason for Absence</p>
                                            <p className="text-xs font-medium text-text-secondary leading-relaxed mb-3">{result.missedReason}</p>
                                        </div>
                                    ) : (
                                        <div className="bg-surface rounded-xl p-4 border border-border/10 shadow-sm mb-4">
                                            {result.lateReason && (
                                                <div className="mb-4 p-3 bg-surface-secondary rounded-xl border border-border/10">
                                                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Reason for Late/Untimed Access</p>
                                                    <p className="text-xs font-medium text-text-secondary leading-relaxed">{result.lateReason}</p>
                                                </div>
                                            )}
                                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">AI Identified Drawbacks</p>
                                            <p className="text-xs font-medium text-text-secondary leading-relaxed mb-3">{result.aiDrawbacks}</p>
                                            <div className="h-px bg-border/5 mb-3"></div>
                                            <p className="text-[10px] font-black text-text-primary uppercase tracking-widest mb-1">AI Solution Route & Improvements</p>
                                            <p className="text-xs font-medium text-text-secondary leading-relaxed mb-4">{result.aiSolutions}</p>

                                            {recommendations.length > 0 && (
                                                <div className="mt-6 p-5 bg-surface-tertiary rounded-2xl border border-border/10">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="w-8 h-8 rounded-xl bg-text-primary flex items-center justify-center text-surface shadow-lg">
                                                            <HiOutlineLightBulb className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] leading-none mb-1">Faculty Suggestion Engine</p>
                                                            <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider leading-none">AI-Assisted Intervention Strategy</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {recommendations.map((rec, idx) => (
                                                            <div key={idx} className="bg-surface p-4 rounded-xl border border-border/10 shadow-sm">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <p className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.1em]">Domain: {rec.name}</p>
                                                                    <span className="w-2 h-2 rounded-full bg-text-primary animate-pulse"></span>
                                                                </div>
                                                                <div className="mb-3">
                                                                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Core Deficiency</p>
                                                                    <p className="text-xs font-medium text-text-secondary leading-relaxed italic border-l-2 border-border/20 pl-3">{rec.fault}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-text-primary uppercase tracking-widest mb-1">Intervention Strategy</p>
                                                                    <p className="text-xs font-bold text-text-primary leading-relaxed bg-surface-secondary p-2 rounded-lg border border-border/10">{rec.solution}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}


                                    {result.teacherFeedback ? (
                                        <div className="bg-text-primary text-surface rounded-xl p-4 shadow-inner shadow-black/10">
                                            <p className="text-[10px] font-black text-surface/60 uppercase tracking-[0.2em] mb-1">Your Feedback</p>
                                            <p className="text-xs font-medium leading-relaxed">{result.teacherFeedback}</p>
                                        </div>
                                    ) : (
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                placeholder="Write manual feedback..."
                                                className="apple-input flex-1 !py-2 !text-xs"
                                                value={feedbackText[result.id] || ''}
                                                onChange={e => setFeedbackText({ ...feedbackText, [result.id]: e.target.value })}
                                            />
                                            <button
                                                onClick={() => handleFeedbackSubmit(result.id)}
                                                className="apple-btn apple-btn-primary !py-2 !px-4 !text-[10px] !uppercase !tracking-widest"
                                                disabled={!feedbackText[result.id]}
                                            >
                                                Submit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )})}
                        </div>
                    </div>

                    <div className="premium-card p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-bold text-lg text-text-primary tracking-tight">Top Merit List</h3>
                            <button className="text-[10px] font-black text-accent hover:opacity-80 tracking-widest uppercase">Leaderboard</button>
                        </div>
                        <div className="space-y-6">
                            {topStudents.map((student) => (
                                <div key={student.id} className="flex items-center justify-between p-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-xl border border-border/10">
                                            {student.avatar}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-text-primary">{student.name}</p>
                                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{student.enrollment}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-text-primary">{student.retentionScore}%</p>
                                        <div className="w-16 h-1 bg-surface-secondary rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-text-primary rounded-full" style={{ width: `${student.retentionScore}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
