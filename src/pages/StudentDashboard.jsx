import mockDb from '../utils/apiDb';
import { useState, useEffect } from 'react';
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineFire, HiOutlineTrendingUp, HiOutlineStar, HiOutlineLightBulb, HiOutlineDocumentReport, HiOutlineCog, HiOutlineBell } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import StatCard from '../components/StatCard';
import { QUESTION_BANK } from '../utils/questionBank';
import toast from 'react-hot-toast';
import AcademicHealthCard from '../components/AcademicHealthCard';
import ConceptDecayRadar from '../components/ConceptDecayRadar';
import { calculateAcademicHealthScore, calculateConceptDecayRadar } from '../utils/analytics';

export default function StudentDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [allTests, setAllTests] = useState([]);
    const [pastResults, setPastResults] = useState([]);
    const [liveTestNotification, setLiveTestNotification] = useState(null);
    const [selectedStat, setSelectedStat] = useState(null);

    useEffect(() => {
        if (!user?.email) return;
        let cancelled = false;
        const storageKey = `student_seen_tests_${user.email}`;

        const fetchData = async () => {
            try {
                const [tests, results] = await Promise.all([
                    mockDb.getTests(),
                    mockDb.getResultsByStudent(user.email)
                ]);
                if (cancelled) return;
                setAllTests(tests);
                setPastResults(results);

                let seenIds = [];
                try {
                    seenIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
                } catch {
                    seenIds = [];
                }

                const newTests = tests.filter((test) => !seenIds.includes(String(test.id)));
                if (newTests.length > 0) {
                    const newestTest = [...newTests].sort((a, b) => String(b.created_at || b.id).localeCompare(String(a.created_at || a.id)))[0];
                    setLiveTestNotification(newestTest);
                    toast.custom((t) => (
                        <button
                            onClick={() => { toast.dismiss(t.id); navigate('/student/test', { state: { testConfig: newestTest } }); }}
                            className="w-[360px] bg-white border border-emerald-200 shadow-2xl rounded-2xl p-4 text-left flex items-center gap-3"
                        >
                            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                            <span>
                                <span className="block text-sm font-black text-gray-900">New test deployed</span>
                                <span className="block text-xs text-gray-500 mt-1">{newestTest.name} · {newestTest.subject}</span>
                            </span>
                        </button>
                    ), { duration: 10000 });
                    localStorage.setItem(storageKey, JSON.stringify([...new Set([...seenIds, ...tests.map((test) => String(test.id))]) ]));
                } else if (liveTestNotification) {
                    const exists = tests.some((test) => String(test.id) === String(liveTestNotification.id));
                    if (!exists) setLiveTestNotification(null);
                }
            } catch (error) {
                console.error('Unable to refresh student tests:', error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [user?.email, navigate]);

    // ── Proactive Faculty Feedback Notification ─────────────────────────────
    // Fire once per browser session so it's visible but not annoying
    useEffect(() => {
        if (!user?.email) return;
        const sessionKey = `feedback_notified_${user.email}`;
        if (sessionStorage.getItem(sessionKey)) return; // already shown this session

        mockDb.getUnreadFeedbackCount(user.email).then((count) => {
            if (count > 0) {
                sessionStorage.setItem(sessionKey, 'true');
                toast(
                    (t) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '20px' }}>📬</span>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>
                                    {count} new faculty feedback{count > 1 ? 's' : ''} received
                                </p>
                                <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>
                                    Your mentor has reviewed your performance
                                </p>
                            </div>
                            <button
                                onClick={() => { toast.dismiss(t.id); navigate('/student/feedback'); }}
                                style={{
                                    background: '#6366f1', color: '#fff',
                                    border: 'none', borderRadius: '10px',
                                    padding: '6px 14px', fontSize: '11px',
                                    fontWeight: 700, cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                View Now
                            </button>
                        </div>
                    ),
                    {
                        duration: 8000,
                        icon: null,
                        style: {
                            maxWidth: '420px',
                            padding: '14px 18px',
                            borderLeft: '4px solid #6366f1',
                            borderRadius: '16px',
                            boxShadow: '0 20px 40px rgba(99,102,241,0.18)',
                        },
                    }
                );
            }
        });
    }, [user?.email]);

    const upcomingTests = allTests.filter(t => !t.isLive && t.date && new Date(`${t.date}T${t.time || '23:59'}`) >= new Date());
    const aiLiveAssessments = allTests.filter(t => {
        if (!t.isLive) return false;
        if (t.date && t.endTime) {
            const expiry = new Date(`${t.date} ${t.endTime}`);
            return expiry > new Date();
        }
        return true;
    });

    // Calculate Overall Mastery
    const overallMastery = pastResults.length > 0
        ? Math.round(pastResults.reduce((acc, curr) => acc + (typeof curr.score === 'number' ? curr.score : 0), 0) / pastResults.length)
        : 0;

    const assessedCount = pastResults.filter(result => !result.isMissed).length;
    const assessmentParticipation = pastResults.length > 0
        ? Math.round((assessedCount / pastResults.length) * 100)
        : null;
    const completedResults = pastResults.filter(result => !result.isMissed);
    const missedResults = pastResults.filter(result => result.isMissed);
    const statDetails = {
        average: {
            title: 'Assessment Average Details',
            description: 'Scores from your completed assessments.',
            items: completedResults.map(result => ({
                id: result.id,
                title: result.testName || 'Assessment',
                detail: result.timestamp,
                value: typeof result.score === 'number' ? `${result.score}%` : 'Score unavailable'
            }))
        },
        participation: {
            title: 'Assessment Participation Details',
            description: `${assessedCount} completed and ${missedResults.length} missed out of ${pastResults.length} recorded assessments.`,
            items: pastResults.map(result => ({
                id: result.id,
                title: result.testName || 'Assessment',
                detail: result.timestamp,
                value: result.isMissed ? 'Missed' : 'Completed'
            }))
        },
        completed: {
            title: 'Completed Tests',
            description: 'Your completed assessments and scores.',
            items: completedResults.map(result => ({
                id: result.id,
                title: result.testName || 'Assessment',
                detail: result.timestamp,
                value: typeof result.score === 'number' ? `${result.score}%` : 'Score unavailable'
            }))
        },
        missed: {
            title: 'Missed Tests',
            description: 'Assessments recorded as missed.',
            items: missedResults.map(result => ({
                id: result.id,
                title: result.testName || 'Assessment',
                detail: result.timestamp,
                value: 'Missed'
            }))
        },
        upcoming: {
            title: 'Upcoming Tests',
            description: 'Scheduled assessments that are still available.',
            items: upcomingTests.map(test => ({
                id: test.id,
                title: test.name || test.subject || 'Assessment',
                detail: [test.subject, test.date, test.time, test.duration ? `${test.duration} min` : null]
                    .filter(Boolean)
                    .join(' · '),
                test
            }))
        }
    };

    const formatAssessmentDate = (value) => {
        if (!value) return 'Date not available';
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? 'Date not available'
            : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <PageTransition>
            <div className="pb-12 max-w-6xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest mb-4">
                            <HiOutlineFire className="w-3 h-3" />
                            Academic Journey
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-text-primary mb-3 leading-tight">
                            My Learning <span className="text-accent italic">Path</span>
                        </h1>
                        <p className="text-lg text-text-secondary font-medium max-w-xl leading-relaxed">
                            Welcome back, <span className="text-text-primary font-bold">{user?.name || 'Student'}</span>. {pastResults.length > 0 ? <>Your current assessment average is <span className="text-accent underline decoration-2 underline-offset-4">{overallMastery}%</span>.</> : 'Your academic insights will appear here after your first assessment.'}
                        </p>
                    </div>
                </header>

                {liveTestNotification && (
                    <Link
                        to="/student/test"
                        state={{ testConfig: liveTestNotification }}
                        className="mb-8 block rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm hover:bg-emerald-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                            <div>
                                <p className="text-sm font-black text-emerald-900">Live test notification</p>
                                <p className="text-xs font-semibold text-emerald-700 mt-1">
                                    {liveTestNotification.name} · {liveTestNotification.subject} · Tap to view
                                </p>
                            </div>
                        </div>
                    </Link>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                    <StatCard title="Assessment Average" value={pastResults.length > 0 ? `${overallMastery}%` : '—'} icon={HiOutlineFire} index={0} onClick={() => setSelectedStat(selectedStat === 'average' ? null : 'average')} isActive={selectedStat === 'average'} detailsId="student-stat-details" />
                    <StatCard title="Assessment Participation" value={assessmentParticipation === null ? '—' : `${assessmentParticipation}%`} icon={HiOutlineClock} index={1} onClick={() => setSelectedStat(selectedStat === 'participation' ? null : 'participation')} isActive={selectedStat === 'participation'} detailsId="student-stat-details" />
                    <StatCard title="Tests Completed" value={completedResults.length} icon={HiOutlineCheckCircle} index={2} onClick={() => setSelectedStat(selectedStat === 'completed' ? null : 'completed')} isActive={selectedStat === 'completed'} detailsId="student-stat-details" />
                    <StatCard title="Tests Missed" value={missedResults.length} icon={HiOutlineTrendingUp} index={3} onClick={() => setSelectedStat(selectedStat === 'missed' ? null : 'missed')} isActive={selectedStat === 'missed'} detailsId="student-stat-details" />
                    <StatCard title="Upcoming Tests" value={upcomingTests.length} icon={HiOutlineStar} index={4} onClick={() => setSelectedStat(selectedStat === 'upcoming' ? null : 'upcoming')} isActive={selectedStat === 'upcoming'} detailsId="student-stat-details" />
                </div>

                {selectedStat && (
                    <motion.section
                        id="student-stat-details"
                        role="region"
                        aria-labelledby="student-stat-details-title"
                        initial={{ opacity: 0, height: 0, y: -8 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        className="premium-card p-6 mb-12 overflow-hidden"
                    >
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <div>
                                <h2 id="student-stat-details-title" className="text-lg font-black text-text-primary">
                                    {statDetails[selectedStat].title}
                                </h2>
                                <p className="text-sm text-text-secondary mt-1">{statDetails[selectedStat].description}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedStat(null)}
                                className="text-sm font-bold text-text-secondary hover:text-text-primary rounded-lg px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            >
                                Close
                            </button>
                        </div>
                        {statDetails[selectedStat].items.length === 0 ? (
                            <p className="text-sm font-medium text-text-tertiary">No details to show yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {statDetails[selectedStat].items.map(item => (
                                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl bg-surface-secondary/50 border border-border/5 p-4">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-text-primary truncate">{item.title}</h3>
                                            <p className="text-xs text-text-tertiary mt-1">
                                                {selectedStat === 'upcoming'
                                                    ? item.detail
                                                    : formatAssessmentDate(item.detail)}
                                            </p>
                                        </div>
                                        {item.test ? (
                                            <Link
                                                to="/student/test"
                                                state={{ testConfig: item.test }}
                                                className="apple-btn apple-btn-primary !py-2 !px-4 !text-[10px] !font-black !uppercase !tracking-widest flex-shrink-0"
                                            >
                                                View
                                            </Link>
                                        ) : (
                                            <span className={`text-sm font-black flex-shrink-0 ${item.value === 'Missed' ? 'text-red-500' : 'text-accent'}`}>
                                                {item.value}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.section>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
                    {[
                        { to: "/student/doubts", icon: HiOutlineLightBulb, label: "QueryCoach", sub: "Ask Anything" },
                        { to: "/student/assessments", icon: HiOutlineCheckCircle, label: "Live Testing", sub: "Assessments" },
                        { to: "/student/settings", icon: HiOutlineCog, label: "Portal Hub", sub: "Preferences" }
                    ].map((item, i) => (
                        <Link key={i} to={item.to} className="premium-card p-6 border-b-2 border-b-transparent hover:border-b-accent transition-all group overflow-hidden">
                            <div className="absolute -right-2 -top-2 w-16 h-16 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
                            <item.icon className="w-8 h-8 text-accent mb-4 group-hover:scale-110 transition-transform duration-500" />
                            <h4 className="font-bold text-text-primary text-sm leading-none">{item.label}</h4>
                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mt-2">{item.sub}</p>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Live AI Challenges (Active Deployments) */}
                        {aiLiveAssessments.length > 0 && (
                            <div className="premium-card p-8 border-l-4 border-l-indigo-500 bg-indigo-50/20">
                                <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                    Live AI Challenges
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {aiLiveAssessments.map((t) => (
                                        <div key={t.id} className="p-5 rounded-2xl bg-white border border-indigo-100 flex flex-col group hover:shadow-lg hover:border-indigo-300 transition-all">
                                            <div className="mb-4">
                                                <h4 className="font-bold text-text-primary">{t.subject}</h4>
                                                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mt-1">AI Generated • {t.duration} Min • {t.numQuestions} Qs</p>
                                            </div>
                                            <Link to="/student/test" state={{ testConfig: t }} className="apple-btn apple-btn-primary !py-2 !px-4 !text-[9px] !font-black !uppercase !tracking-[0.15em] bg-indigo-600 shadow-indigo-600/20">Launch AI Challenge</Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Faculty Insights - High Priority Feedback */}
                        {pastResults.some(r => r.teacherFeedback) && (
                            <div className="premium-card p-8 border-l-4 border-l-accent shadow-xl shadow-accent/5">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                                        <HiOutlineDocumentReport className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-text-primary tracking-tight">Faculty Insights</h3>
                                        <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Personalized Teacher Assessments</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {pastResults.filter(r => r.teacherFeedback).map((r, i) => (
                                        <div key={i} className="p-6 rounded-3xl bg-surface-secondary/50 border border-border/5 group hover:bg-surface transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-lg shadow-sm border border-accent/10">
                                                        👨‍🏫
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-text-primary text-sm tracking-tight">{r.facultyName || 'Faculty Member'}</h4>
                                                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{r.testName}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-lg font-black text-accent">{r.score}%</span>
                                                    <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest leading-none">Score</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-accent/5 border border-accent/10 rounded-2xl italic text-sm font-medium text-text-primary leading-relaxed">
                                                "{r.teacherFeedback}"
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Practice Hub (Static Topics) */}
                        <div className="premium-card p-8">
                            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
                                <HiOutlineStar className="w-5 h-5 text-accent" />
                                Quick Practice Hub
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {Object.keys(QUESTION_BANK).map((topic, i) => {
                                    const liveConfig = {
                                        id: `live-${topic.toLowerCase().replace(' ', '-')}`,
                                        name: `Live Challenge: ${topic}`,
                                        subject: topic,
                                        duration: 15,
                                        isLive: true,
                                        numQuestions: 10
                                    }
                                    return (
                                        <Link key={i} to="/student/test" state={{ testConfig: liveConfig }} className="px-5 py-3 rounded-2xl bg-surface-secondary/50 border border-border/5 hover:bg-surface hover:border-accent hover:shadow-lg transition-all text-sm font-bold text-text-primary">
                                            {topic}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                    <div className="space-y-8">
                        {/* Real Leaderboard from results */}
                        <RealLeaderboard currentUserEmail={user?.email} currentUserName={user?.name} />
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}

// Leaderboard computed from real stored results
function RealLeaderboard({ currentUserEmail, currentUserName }) {
    const [ranking, setRanking] = useState([]);

    useEffect(() => {
        const compute = async () => {
            const allResults = await mockDb.getResults();
            const scoreMap = {};
            allResults.forEach(r => {
                if (r.isMissed || typeof r.score !== 'number') return;
                if (!scoreMap[r.studentEmail]) {
                    scoreMap[r.studentEmail] = { name: r.studentName, total: 0, count: 0, email: r.studentEmail };
                }
                scoreMap[r.studentEmail].total += r.score;
                scoreMap[r.studentEmail].count += 1;
            });
            const sorted = Object.values(scoreMap)
                .map(s => ({ ...s, avg: Math.round(s.total / s.count) }))
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 5);
            setRanking(sorted);
        };
        compute();
    }, []);

    if (ranking.length === 0) return null;

    return (
        <div className="premium-card p-8 border border-border/10">
            <h3 className="text-lg font-black text-text-primary mb-1">Global Ranking</h3>
            <p className="text-[10px] font-bold text-text-tertiary mb-6 uppercase tracking-widest">Based on Average Test Scores</p>
            <div className="space-y-3">
                {ranking.map((p, i) => {
                    const isCurrent = p.email === currentUserEmail;
                    return (
                        <div key={p.email} className={`flex justify-between p-3 rounded-xl transition-all border ${isCurrent ? 'bg-text-primary text-surface border-text-primary shadow-lg scale-105' : 'bg-surface-secondary/50 text-text-secondary border-transparent'}`}>
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-black w-4 ${isCurrent ? 'text-surface/50' : 'text-text-tertiary'}`}>#{i + 1}</span>
                                <span className={`text-sm ${isCurrent ? 'font-black' : 'font-medium'}`}>
                                    {isCurrent ? `${p.name} (You)` : p.name}
                                </span>
                            </div>
                            <span className="text-sm font-black">{p.avg}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
