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
        await mockDb.updateResultFeedback(resultId, feedbackText[resultId]);
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
                    backgroundColor: ['rgba(0, 122, 255, 0.8)', 'rgba(88, 86, 214, 0.8)', 'rgba(52, 199, 89, 0.8)', 'rgba(255, 149, 0, 0.8)', 'rgba(90, 200, 250, 0.8)'],
                    borderRadius: 8,
                }]
            },
            trend: {
                labels: trendLabels,
                datasets: [{
                    label: 'Retention Velocity',
                    data: trendData,
                    borderColor: '#007AFF',
                    backgroundColor: 'rgba(0, 122, 255, 0.05)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#007AFF',
                }]
            }
        };
    };

    const analytics = getChartData();

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#fff',
                titleColor: '#1a1a1a',
                bodyColor: '#666',
                borderColor: '#f0f0f0',
                borderWidth: 1,
                padding: 12,
                boxPadding: 4,
                usePointStyle: true,
                cornerRadius: 12,
            }
        },
        scales: {
            y: {
                border: { display: false },
                grid: { color: '#f8f8f8', drawTicks: false },
                ticks: { color: '#aaa', font: { size: 10, weight: '600' } }
            },
            x: {
                border: { display: false },
                grid: { display: false },
                ticks: { color: '#aaa', font: { size: 10, weight: '600' } }
            }
        },
    };

    const lineChartData = analytics.trend;
    const barChartData = analytics.subjects;

    const topStudents = [...students].sort((a, b) => b.retentionScore - a.retentionScore).slice(0, 4);

    return (
        <PageTransition>
            <div className="pb-12">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">Academic Overview</h1>
                        <p className="text-lg text-gray-500 font-medium">Monitoring concept retention across all departments</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="apple-btn apple-btn-secondary !py-2 !px-4 text-sm font-bold">Download Report</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard title="Active Students" value="1,240" trend={5.2} icon={HiOutlineUserGroup} />
                    <StatCard title="Avg. Retention" value="76%" trend={3.1} icon={HiOutlineTrendingUp} />
                    <StatCard title="Priority Alerts" value="12" trend={-2.3} icon={HiOutlineExclamationCircle} />
                    <StatCard title="Top Performers" value="284" trend={1.2} icon={HiOutlineStar} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    <div className="lg:col-span-2 premium-card p-8 bg-white h-[450px] flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-bold text-lg text-gray-800 tracking-tight">Retention Velocity</h3>
                            <div className="flex gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aggregate %</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <Line data={lineChartData} options={chartOptions} />
                        </div>
                    </div>

                    <div className="premium-card p-8 bg-white h-[450px] flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-bold text-lg text-gray-800 tracking-tight">Unit Performance</h3>
                        </div>
                        <div className="flex-1">
                            <Bar data={barChartData} options={chartOptions} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="premium-card p-8 bg-white h-[600px] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8 sticky top-0 bg-white z-10 py-2 border-b border-gray-50">
                            <h3 className="font-bold text-lg text-gray-800 tracking-tight flex items-center gap-2">
                                <HiOutlineExclamationCircle className="w-5 h-5 text-[var(--color-accent)]" />
                                Student Results & Analysis
                            </h3>
                            <button className="text-xs font-bold text-[var(--color-accent)] hover:underline tracking-widest uppercase">Analyze All</button>
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
                                <div key={result.id} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:shadow-xl transition-all">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100/50 flex items-center justify-center text-xl border border-blue-50">
                                                👨‍🎓
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-800">{result.studentName}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{result.testName} • {new Date(result.timestamp).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center justify-end gap-3">
                                            {result.isMissed ? (
                                                <div className="flex items-center gap-1">
                                                    <p className="font-black text-xl text-rose-500 uppercase tracking-widest">Missed</p>
                                                    <button onClick={() => handleDeleteResult(result.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded bg-transparent transition-all" title="Delete Record">
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
                                                    <button onClick={() => handleUpdateScore(result.id, editingScoreValue)} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700">Save</button>
                                                    <button onClick={() => setEditingScoreId(null)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600">Cancel</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className={`font-black text-xl ${result.score >= 70 ? 'text-emerald-500' : 'text-rose-500'}`}>{result.score}%</p>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => { setEditingScoreId(result.id); setEditingScoreValue(result.score); }} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded bg-transparent transition-all" title="Edit Score">
                                                            <HiOutlinePencil className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteResult(result.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded bg-transparent transition-all" title="Delete Record">
                                                            <HiOutlineTrash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {result.isMissed ? (
                                        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 shadow-sm mb-4">
                                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Student Reason for Absence</p>
                                            <p className="text-xs font-medium text-rose-800 leading-relaxed mb-3">{result.missedReason}</p>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-xl p-4 border border-indigo-50 shadow-sm mb-4">
                                            {result.lateReason && (
                                                <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Reason for Late/Untimed Access</p>
                                                    <p className="text-xs font-medium text-amber-800 leading-relaxed">{result.lateReason}</p>
                                                </div>
                                            )}
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">AI Identified Drawbacks</p>
                                            <p className="text-xs font-medium text-gray-600 leading-relaxed mb-3">{result.aiDrawbacks}</p>
                                            <div className="h-px bg-gray-50 mb-3"></div>
                                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">AI Solution Route & Improvements</p>
                                            <p className="text-xs font-medium text-gray-600 leading-relaxed mb-4">{result.aiSolutions}</p>

                                            {recommendations.length > 0 && (
                                                <div className="mt-6 p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-100 shadow-inner">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                                            <HiOutlineLightBulb className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] leading-none mb-1">Faculty Suggestion Engine</p>
                                                            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider leading-none">AI-Assisted Intervention Strategy</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {recommendations.map((rec, idx) => (
                                                            <div key={idx} className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.1em]">Domain: {rec.name}</p>
                                                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                                                </div>
                                                                <div className="mb-3">
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Core Deficiency</p>
                                                                    <p className="text-xs font-medium text-gray-700 leading-relaxed italic border-l-2 border-amber-200 pl-3">{rec.fault}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Intervention Strategy</p>
                                                                    <p className="text-xs font-bold text-emerald-800 leading-relaxed bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">{rec.solution}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}


                                    {result.teacherFeedback ? (
                                        <div className="bg-indigo-600 text-white rounded-xl p-4 shadow-inner shadow-black/10">
                                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-1">Your Feedback</p>
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

                    <div className="premium-card p-8 bg-white">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-bold text-lg text-gray-800 tracking-tight">Top Merit List</h3>
                            <button className="text-xs font-bold text-[var(--color-accent)] hover:underline tracking-widest uppercase">Leaderboard</button>
                        </div>
                        <div className="space-y-6">
                            {topStudents.map((student) => (
                                <div key={student.id} className="flex items-center justify-between p-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl border border-blue-100">
                                            {student.avatar}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{student.name}</p>
                                            <p className="text-xs text-gray-400 font-semibold">{student.enrollment}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-gray-900">{student.retentionScore}%</p>
                                        <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${student.retentionScore}%` }}></div>
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
