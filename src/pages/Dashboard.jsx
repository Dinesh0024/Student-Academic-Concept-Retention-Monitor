import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    HiOutlineUserGroup, HiOutlineTrendingUp, HiOutlineExclamationCircle, HiOutlineStar,
    HiOutlineLightBulb, HiOutlinePencil, HiOutlineTrash, HiOutlineRefresh,
    HiOutlineClipboardCheck, HiOutlineDocumentText, HiOutlineBell, HiOutlineChartBar,
    HiOutlineAcademicCap, HiOutlineClock, HiOutlineCheckCircle,
    HiOutlineArrowSmRight, HiOutlineSparkles, HiOutlineBookOpen,
    HiOutlineDatabase
} from 'react-icons/hi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import PageTransition from '../components/PageTransition';
import mockDb from '../utils/apiDb';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
}

function formatDate() {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function getRiskStyle(score) {
    if (score >= 80) return { text: 'text-emerald-400', bg: 'bg-emerald-400/15', border: 'border-emerald-400/25', bar: 'bg-emerald-400', badge: 'Proficient' };
    if (score >= 65) return { text: 'text-amber-400', bg: 'bg-amber-400/15', border: 'border-amber-400/25', bar: 'bg-amber-400', badge: 'Developing' };
    return { text: 'text-red-400', bg: 'bg-red-400/15', border: 'border-red-400/25', bar: 'bg-red-400', badge: 'At Risk' };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
    const { user } = useAuth();
    const [results, setResults] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [feedbackText, setFeedbackText] = useState({});
    const [editingScoreId, setEditingScoreId] = useState(null);
    const [editingScoreValue, setEditingScoreValue] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [rData, sData] = await Promise.all([
                mockDb.getResults(),
                mockDb.getSubjects()
            ]);
            setResults(rData);
            setSubjects(sData);
        } catch (err) {
            console.error('Dashboard fetch failed:', err);
            toast.error('Cloud synchronization failed');
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setTimeout(() => setRefreshing(false), 700);
        toast.success('Dashboard refreshed');
    };

    const handleFeedbackSubmit = async (resultId) => {
        if (!feedbackText[resultId]) return;
        await mockDb.updateResultFeedback(resultId, feedbackText[resultId], user?.name || 'Faculty Member');
        fetchData();
        toast.success('Feedback submitted successfully');
    };

    const handleDeleteResult = async (resultId) => {
        if (window.confirm('Delete this result record?')) {
            await mockDb.deleteResult(resultId);
            fetchData();
            toast.success('Result deleted');
        }
    };

    const handleUpdateScore = async (resultId, newScore) => {
        const score = parseInt(newScore, 10);
        if (!isNaN(score) && score >= 0 && score <= 100) {
            await mockDb.updateResultScore(resultId, score);
            fetchData();
            toast.success('Score updated');
            setEditingScoreId(null);
        } else {
            toast.error('Enter a valid score (0–100)');
        }
    };

    // ─── Analytics ────────────────────────────────────────────────────────────

    const validResults = results.filter(r => !r.isMissed && typeof r.score === 'number');

    const studentScoreMap = {};
    validResults.forEach(r => {
        const key = r.studentEmail || r.studentName;
        if (!studentScoreMap[key]) studentScoreMap[key] = { name: r.studentName, email: r.studentEmail, total: 0, count: 0 };
        studentScoreMap[key].total += r.score;
        studentScoreMap[key].count++;
    });

    const rankedStudents = Object.values(studentScoreMap)
        .map(s => ({ name: s.name, email: s.email, score: Math.round(s.total / s.count), testCount: s.count }))
        .sort((a, b) => b.score - a.score);

    const avgRetention = validResults.length > 0
        ? Math.round(validResults.reduce((acc, r) => acc + r.score, 0) / validResults.length)
        : null;
    const atRiskCount = rankedStudents.filter(s => s.score <= 65).length;
    const topCount = rankedStudents.filter(s => s.score >= 80).length;
    const activeCount = rankedStudents.length;
    const submissionRate = results.length > 0 ? Math.round((validResults.length / results.length) * 100) : 0;

    // ─── Chart Data ───────────────────────────────────────────────────────────

    const perfMap = {};
    validResults.forEach(r => {
        if (!perfMap[r.testName]) perfMap[r.testName] = { total: 0, count: 0 };
        perfMap[r.testName].total += parseInt(r.score) || 0;
        perfMap[r.testName].count++;
    });
    const subjectLabels = Object.keys(perfMap).slice(0, 6);
    const subjectData = subjectLabels.map(l => Math.round(perfMap[l].total / perfMap[l].count));

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const curMonth = new Date().getMonth();
    const trendLabels = months.slice(Math.max(0, curMonth - 5), curMonth + 1);
    const trendMap = {};
    trendLabels.forEach(m => trendMap[m] = { total: 0, count: 0 });
    validResults.forEach(r => {
        if (r.timestamp) {
            const m = months[new Date(r.timestamp).getMonth()];
            if (trendMap[m]) { trendMap[m].total += parseInt(r.score) || 0; trendMap[m].count++; }
        }
    });
    const trendData = trendLabels.map(m => trendMap[m].count > 0 ? Math.round(trendMap[m].total / trendMap[m].count) : null);

    const lineChartData = {
        labels: trendLabels,
        datasets: [{
            label: 'Avg Retention %',
            data: trendData,
            borderColor: 'rgba(99,102,241,1)',
            backgroundColor: (ctx) => {
                const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
                g.addColorStop(0, 'rgba(99,102,241,0.28)');
                g.addColorStop(1, 'rgba(99,102,241,0)');
                return g;
            },
            fill: true, tension: 0.45, borderWidth: 2.5,
            pointBackgroundColor: '#fff', pointBorderColor: 'rgba(99,102,241,1)',
            pointBorderWidth: 2.5, pointRadius: 4, pointHoverRadius: 7,
        }]
    };

    const barChartData = {
        labels: subjectLabels,
        datasets: [{
            label: 'Avg Score %',
            data: subjectData,
            backgroundColor: [
                'rgba(139,92,246,0.85)', 'rgba(59,130,246,0.85)', 'rgba(6,182,212,0.85)',
                'rgba(16,185,129,0.85)', 'rgba(245,158,11,0.85)', 'rgba(239,68,68,0.85)',
            ],
            borderRadius: 8, borderSkipped: false, barThickness: 32,
        }]
    };

    const doughnutData = {
        labels: ['Top', 'Developing', 'At Risk'],
        datasets: [{
            data: [topCount, Math.max(0, activeCount - topCount - atRiskCount), atRiskCount],
            backgroundColor: ['rgba(16,185,129,0.85)', 'rgba(245,158,11,0.85)', 'rgba(239,68,68,0.85)'],
            borderWidth: 0, hoverOffset: 6,
        }]
    };

    const baseChartOpts = {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.97)', titleColor: '#f1f5f9', bodyColor: '#94a3b8',
                borderColor: 'rgba(99,102,241,0.4)', borderWidth: 1, padding: 14, cornerRadius: 12,
            }
        },
        scales: {
            y: { border: { display: false }, grid: { color: 'rgba(148,163,184,0.07)' }, ticks: { color: '#64748b', font: { size: 11 }, padding: 8 } },
            x: { border: { display: false }, grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 }, padding: 8 } }
        }
    };

    const doughnutOpts = {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15,23,42,0.97)', titleColor: '#f1f5f9', bodyColor: '#94a3b8', padding: 12 } }
    };

    const recentActivity = results.slice(0, 5).map(r => ({
        type: r.isMissed ? 'missed' : 'submitted',
        name: r.studentName,
        test: r.testName,
        score: r.score,
        time: r.timestamp ? new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently'
    }));

    // ─── Stat Cards Config ────────────────────────────────────────────────────

    const stats = [
        { label: 'Students Assessed', value: activeCount, sub: `${subjects.length} subjects tracked`, icon: HiOutlineUserGroup, color: 'indigo' },
        { label: 'Avg Class Retention', value: avgRetention === null ? '—' : `${avgRetention}%`, sub: results.length ? `${submissionRate}% scored submission rate` : 'No assessment records', icon: HiOutlineTrendingUp, color: 'emerald' },
        { label: 'At-Risk Students', value: activeCount ? atRiskCount : '—', sub: 'Based on scored assessments', icon: HiOutlineExclamationCircle, color: 'red' },
        { label: 'Top Performers', value: activeCount ? topCount : '—', sub: 'Based on scored assessments', icon: HiOutlineStar, color: 'amber' },
    ];
    const cMap = {
        indigo: { icon: 'text-indigo-400', bg: 'bg-indigo-500/10', ring: 'ring-indigo-500/20', glow: 'bg-indigo-500/15', grad: 'from-indigo-500/15 to-indigo-500/5', border: 'border-indigo-500/20' },
        emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', glow: 'bg-emerald-500/15', grad: 'from-emerald-500/15 to-emerald-500/5', border: 'border-emerald-500/20' },
        red: { icon: 'text-red-400', bg: 'bg-red-500/10', ring: 'ring-red-500/20', glow: 'bg-red-500/15', grad: 'from-red-500/15 to-red-500/5', border: 'border-red-500/20' },
        amber: { icon: 'text-amber-400', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20', glow: 'bg-amber-500/15', grad: 'from-amber-500/15 to-amber-500/5', border: 'border-amber-500/20' },
    };

    return (
        <PageTransition>
            <div className="pb-16 space-y-8">

                {/* ── HEADER ─────────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                    <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Academic Analytics</span>
                                </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-primary">
                            {getGreeting()}, {user?.name?.split(' ')[0] || 'Professor'} 👋
                        </h1>
                        <p className="text-sm text-text-secondary mt-1 font-medium">{formatDate()}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <Link to="/faculty/questions"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02]"
                        >
                            <HiOutlineSparkles className="w-4 h-4" />
                            AI Question Generator
                        </Link>
                        <Link to="/faculty/attendance"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-secondary border border-border/20 text-text-primary text-sm font-bold hover:border-accent/40 transition-all hover:scale-[1.02]"
                        >
                            <HiOutlineClipboardCheck className="w-4 h-4" />
                            Take Attendance
                        </Link>
                        <button onClick={handleRefresh}
                            className={`p-2.5 rounded-xl bg-surface-secondary border border-border/20 text-text-secondary hover:text-accent transition-all hover:scale-[1.02] ${refreshing ? 'animate-spin text-accent' : ''}`}
                            title="Refresh"
                        >
                            <HiOutlineRefresh className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>

                {/* ── STAT CARDS ─────────────────────────────────────────────── */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                >
                    {stats.map((s) => {
                        const c = cMap[s.color];
                        return (
                            <motion.div key={s.label} whileHover={{ y: -3, scale: 1.01 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                className={`relative premium-card p-6 overflow-hidden border ${c.border} bg-gradient-to-br ${c.grad}`}
                            >
                                <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full ${c.glow} blur-2xl opacity-70`} />
                                <div className="relative">
                                    <div className={`w-11 h-11 rounded-2xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center mb-4`}>
                                        <s.icon className={`w-5 h-5 ${c.icon}`} />
                                    </div>
                                    <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest mb-1">{s.label}</p>
                                    <p className={`text-3xl font-black tracking-tight ${c.icon} mb-1`}>{s.value}</p>
                                    <p className="text-[11px] text-text-tertiary font-medium">{s.sub}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* ── CHARTS ROW ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Retention Trend Line */}
                    <motion.div className="lg:col-span-2 premium-card p-6 flex flex-col" style={{ height: '300px' }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    >
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="font-bold text-base text-text-primary">Retention Velocity</h3>
                                <p className="text-[11px] text-text-tertiary mt-0.5">Monthly avg score across all assessments</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Avg %</span>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0">
                            <Line data={lineChartData} options={baseChartOpts} />
                        </div>
                    </motion.div>

                    {/* Doughnut — Class Distribution */}
                    <motion.div className="premium-card p-6 flex flex-col" style={{ height: '300px' }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    >
                        <div className="mb-4">
                            <h3 className="font-bold text-base text-text-primary">Class Distribution</h3>
                            <p className="text-[11px] text-text-tertiary mt-0.5">Performance tier breakdown</p>
                        </div>
                        <div className="flex-1 relative min-h-0">
                            {activeCount > 0 ? (
                                <>
                                    <Doughnut data={doughnutData} options={doughnutOpts} />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <p className="text-2xl font-black text-text-primary">{activeCount}</p>
                                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Students</p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-text-tertiary text-sm">No data yet</div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 mt-3">
                            {[
                                { label: 'Top Performers (≥80%)', count: topCount, color: 'bg-emerald-400' },
                                { label: 'Developing (66–79%)', count: Math.max(0, activeCount - topCount - atRiskCount), color: 'bg-amber-400' },
                                { label: 'At Risk (≤65%)', count: atRiskCount, color: 'bg-red-400' },
                            ].map(l => (
                                <div key={l.label} className="flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${l.color}`} />
                                        <span className="text-text-secondary font-medium">{l.label}</span>
                                    </div>
                                    <span className="font-black text-text-primary">{l.count}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* ── ASSESSMENT PERFORMANCE ───────────────────────────────── */}
                <div className="grid grid-cols-1 gap-6">
                    <motion.div className="premium-card p-6 flex flex-col" style={{ height: '290px' }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    >
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="font-bold text-base text-text-primary">Unit Performance</h3>
                                <p className="text-[11px] text-text-tertiary mt-0.5">Avg score per assessment unit</p>
                            </div>
                            <HiOutlineChartBar className="w-5 h-5 text-text-tertiary" />
                        </div>
                        <div className="flex-1 min-h-0">
                            <Bar data={barChartData} options={baseChartOpts} />
                        </div>
                    </motion.div>

                </div>

                {/* ── BOTTOM GRID ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* Student Results */}
                    <div className="xl:col-span-2 premium-card p-6 flex flex-col" style={{ maxHeight: '720px' }}>
                        <div className="flex justify-between items-center mb-5 pb-4 border-b border-border/10">
                            <div>
                                <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                                    <HiOutlineDocumentText className="w-4 h-4 text-accent" />
                                    Student Results &amp; Analysis
                                </h3>
                                <p className="text-[11px] text-text-tertiary mt-0.5">{results.length} submissions · {validResults.length} scored</p>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                            {results.length === 0 ? (
                                <div className="text-center py-14">
                                    <HiOutlineDatabase className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
                                    <p className="text-sm font-medium text-text-tertiary">No submissions yet</p>
                                    <p className="text-xs text-text-tertiary/60 mt-1">Results appear here as students complete assessments</p>
                                </div>
                            ) : results.map((result) => {
                                const rs = !result.isMissed && typeof result.score === 'number' ? getRiskStyle(result.score) : null;

                                return (
                                    <div key={result.id} className="p-5 rounded-2xl bg-surface-secondary/40 border border-border/10 hover:border-accent/20 hover:bg-surface-secondary/70 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-lg shrink-0">👨‍🎓</div>
                                                <div>
                                                    <p className="font-bold text-sm text-text-primary">{result.studentName}</p>
                                                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                                                        {result.testName} · {result.timestamp ? new Date(result.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {result.isMissed ? (
                                                    <>
                                                        <span className="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider">Missed</span>
                                                        <button onClick={() => handleDeleteResult(result.id)} className="p-1.5 text-text-tertiary hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all bg-transparent">
                                                            <HiOutlineTrash className="w-3.5 h-3.5" />
                                                        </button>
                                                    </>
                                                ) : editingScoreId === result.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input type="number" min="0" max="100"
                                                            className="w-14 px-2 py-1 text-center text-sm font-black bg-surface border border-border/20 rounded-lg text-text-primary focus:outline-none focus:border-accent/60"
                                                            value={editingScoreValue}
                                                            onChange={e => setEditingScoreValue(e.target.value)}
                                                        />
                                                        <button onClick={() => handleUpdateScore(result.id, editingScoreValue)} className="text-[10px] font-black text-accent px-2 uppercase tracking-wider hover:opacity-80">Save</button>
                                                        <button onClick={() => setEditingScoreId(null)} className="text-[10px] font-black text-text-tertiary px-1 hover:text-text-primary">✕</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {rs && <span className={`px-2.5 py-1 rounded-lg ${rs.bg} border ${rs.border} ${rs.text} text-[10px] font-black uppercase tracking-wider`}>{rs.badge}</span>}
                                                        <span className="font-black text-lg text-text-primary">{result.score}%</span>
                                                        <button onClick={() => { setEditingScoreId(result.id); setEditingScoreValue(result.score); }} className="p-1.5 text-text-tertiary hover:text-accent rounded-lg hover:bg-accent/10 transition-all bg-transparent opacity-0 group-hover:opacity-100">
                                                            <HiOutlinePencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDeleteResult(result.id)} className="p-1.5 text-text-tertiary hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all bg-transparent opacity-0 group-hover:opacity-100">
                                                            <HiOutlineTrash className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {!result.isMissed && typeof result.score === 'number' && rs && (
                                            <div className="w-full h-1 bg-border/20 rounded-full mb-3 overflow-hidden">
                                                <div className={`h-full ${rs.bar} rounded-full transition-all`} style={{ width: `${result.score}%` }} />
                                            </div>
                                        )}

                                        {result.isMissed ? (
                                            <div className="text-[11px] text-text-secondary bg-surface rounded-xl p-3 border border-border/10">
                                                <span className="font-bold">Reason: </span>{result.missedReason || 'No reason provided'}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {result.lateReason && (
                                                    <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                                                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Late/Untimed Access Reason</p>
                                                        <p className="text-[11px] font-medium text-text-secondary">{result.lateReason}</p>
                                                    </div>
                                                )}
                                                {result.studentFeedback && (
                                                    <div className="bg-sky-500/10 rounded-xl p-3 border border-sky-500/20">
                                                        <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1">Student Assessment Feedback</p>
                                                        <p className="text-[11px] font-medium text-text-secondary leading-relaxed">{result.studentFeedback}</p>
                                                    </div>
                                                )}
                                                {result.teacherFeedback ? (
                                                    <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-3">
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Your Feedback</p>
                                                        <p className="text-[11px] font-medium text-text-secondary leading-relaxed">{result.teacherFeedback}</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2 mt-3">
                                                        <input type="text" placeholder="Write personalized feedback..."
                                                            className="flex-1 px-3 py-2 text-xs rounded-xl bg-surface border border-border/20 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/60 transition-colors"
                                                            value={feedbackText[result.id] || ''}
                                                            onChange={e => setFeedbackText({ ...feedbackText, [result.id]: e.target.value })}
                                                        />
                                                        <button onClick={() => handleFeedbackSubmit(result.id)} disabled={!feedbackText[result.id]}
                                                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-accent text-white disabled:opacity-40 hover:opacity-90 transition-all shrink-0"
                                                        >Send</button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-6">

                        {/* Merit Leaderboard */}
                        <div className="premium-card p-6">
                            <div className="flex justify-between items-center mb-5 pb-4 border-b border-border/10">
                                <div>
                                    <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                                        <HiOutlineStar className="w-4 h-4 text-amber-400" /> Top Merit List
                                    </h3>
                                    <p className="text-[11px] text-text-tertiary mt-0.5">Live class leaderboard</p>
                                </div>
                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">#{rankedStudents.length}</span>
                            </div>
                            <div className="space-y-3">
                                {rankedStudents.length === 0 ? (
                                    <p className="text-sm text-text-tertiary text-center py-8">No records yet</p>
                                ) : rankedStudents.slice(0, 6).map((student, idx) => {
                                    const rs = getRiskStyle(student.score);
                                    const medals = ['🥇', '🥈', '🥉'];
                                    return (
                                        <div key={student.email || idx} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-secondary/60 transition-all">
                                            <div className="w-7 h-7 flex items-center justify-center text-sm font-black shrink-0">
                                                {idx < 3 ? medals[idx] : <span className="text-text-tertiary text-xs font-black">#{idx + 1}</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-text-primary truncate">{student.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1 h-1 bg-border/20 rounded-full overflow-hidden">
                                                        <div className={`h-full ${rs.bar} rounded-full`} style={{ width: `${student.score}%` }} />
                                                    </div>
                                                    <span className={`text-[10px] font-black ${rs.text} shrink-0`}>{student.score}%</span>
                                                </div>
                                                <p className="text-[10px] text-text-tertiary font-medium mt-0.5">{student.testCount} test{student.testCount > 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="premium-card p-6">
                            <div className="flex justify-between items-center mb-5 pb-4 border-b border-border/10">
                                <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                                    <HiOutlineBell className="w-4 h-4 text-accent" /> Recent Activity
                                </h3>
                                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            </div>
                            <div className="space-y-3">
                                {recentActivity.length === 0 ? (
                                    <p className="text-sm text-text-tertiary text-center py-6">No activity yet</p>
                                ) : recentActivity.map((act, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${act.type === 'missed' ? 'bg-red-500/15' : 'bg-emerald-500/15'}`}>
                                            {act.type === 'missed'
                                                ? <HiOutlineClock className="w-3.5 h-3.5 text-red-400" />
                                                : <HiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-bold text-text-primary truncate">{act.name}</p>
                                            <p className="text-[11px] text-text-secondary truncate">
                                                {act.type === 'missed' ? 'Missed' : `Scored ${act.score}% on`} <span className="font-bold">{act.test}</span>
                                            </p>
                                        </div>
                                        <span className="text-[10px] text-text-tertiary font-medium shrink-0">{act.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Navigation */}
                        <div className="premium-card p-6">
                            <h3 className="font-bold text-base text-text-primary mb-4 flex items-center gap-2">
                                <HiOutlineAcademicCap className="w-4 h-4 text-accent" /> Quick Navigation
                            </h3>
                            <div className="space-y-2">
                                {[
                                    { label: 'QueryCoach', icon: HiOutlineLightBulb, to: '/faculty/doubts', desc: 'Teaching guidance across your catalog' },
                                    { label: 'AI Question Generator', icon: HiOutlineSparkles, to: '/faculty/questions', desc: 'Generate assessments with AI' },
                                    { label: 'Attendance Register', icon: HiOutlineClipboardCheck, to: '/faculty/attendance', desc: 'Track student presence' },
                                    { label: 'Settings', icon: HiOutlineBookOpen, to: '/faculty/settings', desc: 'Manage preferences' },
                                ].map(link => (
                                    <Link key={link.to} to={link.to}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-secondary/60 border border-transparent hover:border-border/20 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                                            <link.icon className="w-4 h-4 text-accent" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-text-primary">{link.label}</p>
                                            <p className="text-[10px] text-text-tertiary font-medium">{link.desc}</p>
                                        </div>
                                        <HiOutlineArrowSmRight className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors shrink-0" />
                                    </Link>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </PageTransition>
    );
}

/*
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import PageTransition from '../components/PageTransition';
import mockDb from '../utils/mockDb';
import { calculateTeachingEffectiveness, detectFacultyBlindSpots } from '../utils/analytics';
import TeachingEffectivenessCard from '../components/TeachingEffectivenessCard';
import BlindSpotDetector from '../components/BlindSpotDetector';
import { conceptInsights } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineUserGroup, HiOutlineTrendingUp, HiOutlineExclamationCircle, HiOutlineStar, HiOutlineLightBulb, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import PageTransition from '../components/PageTransition';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import mockDb from '../utils/mockDb';
import { getRetentionLevel, calculateTeachingEffectiveness, detectFacultyBlindSpots } from '../utils/analytics';
import TeachingEffectivenessCard from '../components/TeachingEffectivenessCard';
import BlindSpotDetector from '../components/BlindSpotDetector';
import { conceptInsights } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function Dashboard() {
    const { user } = useAuth();
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
        await mockDb.updateResultFeedback(resultId, feedbackText[resultId], user?.name || 'Faculty Member');
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

    // Real metrics computed from actual test submissions
    const studentScoreMap = {};
    results.forEach(r => {
        if (!r.isMissed && typeof r.score === 'number') {
            const key = r.studentEmail || r.studentName;
            if (!studentScoreMap[key]) {
                studentScoreMap[key] = {
                    name: r.studentName,
                    email: r.studentEmail,
                    total: 0,
                    count: 0
                };
            }
            studentScoreMap[key].total += r.score;
            studentScoreMap[key].count += 1;
        }
    });

    const realRankedStudents = Object.values(studentScoreMap).map(s => ({
        name: s.name,
        email: s.email,
        score: Math.round(s.total / s.count),
        testCount: s.count
    })).sort((a, b) => b.score - a.score);

    const validResults = results.filter(r => !r.isMissed && typeof r.score === 'number');
    const realAvgRetention = validResults.length > 0
        ? Math.round(validResults.reduce((acc, curr) => acc + curr.score, 0) / validResults.length) + '%'
        : 'N/A';

    const atRiskCount = realRankedStudents.filter(s => s.score <= 65).length;
    const topPerformersCount = realRankedStudents.filter(s => s.score >= 80).length;
    const activeStudentCount = realRankedStudents.length;

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
                    <StatCard title="Active Tested Students" value={activeStudentCount} icon={HiOutlineUserGroup} />
                    <StatCard title="Avg. Retention" value={realAvgRetention} icon={HiOutlineTrendingUp} />
                    <StatCard title="Priority Alerts (≤65%)" value={atRiskCount} icon={HiOutlineExclamationCircle} />
                    <StatCard title="Top Performers (≥80%)" value={topPerformersCount} icon={HiOutlineStar} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    <TeachingEffectivenessCard effectivenessData={calculateTeachingEffectiveness(results, concepts, subjects)} />
                    <BlindSpotDetector blindSpotData={detectFacultyBlindSpots([], concepts, subjects)} />
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
                            <span className="text-[10px] font-black text-accent tracking-widest uppercase">Live Leaderboard</span>
                        </div>
                        <div className="space-y-6">
                            {realRankedStudents.length === 0 ? (
                                <p className="text-sm font-medium text-gray-400 text-center py-10">No student assessment records yet.</p>
                            ) : (
                                realRankedStudents.slice(0, 5).map((student, idx) => (
                                    <div key={student.email || idx} className="flex items-center justify-between p-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-xl border border-border/10">
                                                👨‍🎓
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-text-primary">{student.name}</p>
                                                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{student.testCount} Test{student.testCount > 1 ? 's' : ''} Taken</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-text-primary">{student.score}%</p>
                                            <div className="w-16 h-1 bg-surface-secondary rounded-full mt-1 overflow-hidden">
                                                <div className="h-full bg-text-primary rounded-full" style={{ width: `${student.score}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
*/
