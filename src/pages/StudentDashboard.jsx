import { useState, useEffect } from 'react';
import { HiOutlineBookOpen, HiOutlineCheckCircle, HiOutlineClock, HiOutlineFire, HiOutlineTrendingUp, HiOutlineStar, HiOutlineLightBulb, HiOutlineDocumentReport, HiOutlineCog } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import StatCard from '../components/StatCard';
import mockDb from '../utils/mockDb';
import { QUESTION_BANK } from '../utils/questionBank';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [allTests, setAllTests] = useState([]);
    const [pastResults, setPastResults] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const tests = await mockDb.getTests();
            setAllTests(tests);
            if (user) {
                const results = await mockDb.getResultsByStudent(user.email);
                setPastResults(results);
            }
        };
        fetchData();
    }, [user]);

    const upcomingTests = allTests.filter(t => !t.isLive);
    const aiLiveAssessments = allTests.filter(t => t.isLive);

    // Calculate Overall Mastery
    const overallMastery = pastResults.length > 0
        ? Math.round(pastResults.reduce((acc, curr) => acc + (typeof curr.score === 'number' ? curr.score : 0), 0) / pastResults.length)
        : 0;

    // Dynamically calculate weak topics based on past results
    const calculateWeakTopics = () => {
        if (!pastResults || pastResults.length === 0) return [];

        const subjectScores = {};

        pastResults.forEach(r => {
            if (typeof r.score === 'number') {
                if (!subjectScores[r.testName]) {
                    subjectScores[r.testName] = { total: 0, count: 0, subject: r.testName.replace(/ Midterm| Baseline| Quiz/g, '') };
                }
                subjectScores[r.testName].total += r.score;
                subjectScores[r.testName].count += 1;
            }
        });

        const topics = Object.keys(subjectScores).map(testName => {
            const data = subjectScores[testName];
            return {
                name: testName,
                subject: data.subject,
                mastery: Math.round(data.total / data.count)
            };
        });

        const filteredTopics = topics.filter(t => t.mastery < 80).sort((a, b) => a.mastery - b.mastery).slice(0, 4);

        // If no past data or no weak topics, provide some sample defaults
        if (filteredTopics.length === 0) {
            return [
                { name: 'Dynamic Programming', subject: 'Algorithms', mastery: 45 },
                { name: 'Paging Algorithms', subject: 'Operating Systems', mastery: 55 },
                { name: 'Red-Black Trees', subject: 'Data Structures', mastery: 38 },
                { name: 'TCP/IP Handshake', subject: 'Networks', mastery: 62 }
            ];
        }

        return filteredTopics;
    };

    const weakTopics = calculateWeakTopics();


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
                            Welcome back, <span className="text-text-primary font-bold">{user?.name || 'Student'}</span>. Your intellectual retention is currently at <span className="text-accent underline decoration-2 underline-offset-4">{overallMastery}%</span> capacity.
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatCard title="Overall Mastery" value={`${overallMastery}%`} trend={overallMastery > 75 ? 3.2 : -1.5} icon={HiOutlineFire} index={0} />
                    <StatCard title="Tests Completed" value="12" icon={HiOutlineCheckCircle} index={1} />
                    <StatCard title="Concept Velocity" value="High" icon={HiOutlineTrendingUp} index={2} />
                    <StatCard title="Global Rank" value="#3" icon={HiOutlineStar} index={3} />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
                    {[
                        { to: "/student/concepts", icon: HiOutlineLightBulb, label: "Knowledge Map", sub: "Deep Insights" },
                        { to: "/student/reports", icon: HiOutlineDocumentReport, label: "Academic Audit", sub: "Performance" },
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
                        {/* Upcoming Assessments */}
                        <div className="premium-card p-8">
                            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
                                <HiOutlineClock className="w-5 h-5 text-accent" />
                                Pending Assessments
                            </h3>
                            <div className="space-y-4">
                                {upcomingTests.length === 0 ? (
                                    <p className="text-sm text-text-tertiary font-medium">No pending assessments at this time.</p>
                                ) : (
                                    upcomingTests.map((t) => (
                                        <div key={t.id} className="flex flex-col sm:flex-row justify-between items-center p-5 rounded-2xl bg-surface-secondary/50 border border-border/5 group hover:bg-surface hover:shadow-xl hover:shadow-accent/5 transition-all duration-500">
                                            <div className="mb-4 sm:mb-0">
                                                <h4 className="font-bold text-text-primary tracking-tight">{t.name}</h4>
                                                <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mt-1">{t.subject} • {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {t.time}</p>
                                            </div>
                                            <Link to="/student/test" state={{ testConfig: t }} className="apple-btn apple-btn-primary !py-2.5 !px-8 text-[11px] font-black uppercase tracking-widest">Launch Test</Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Concept Weakness - Dynamic Drawbacks */}
                        <div className="premium-card p-10 border-l-8 border-l-text-primary/20 flex flex-col shadow-xl shadow-black/5">
                            <h3 className="text-2xl font-black text-text-primary mb-3 tracking-tight">Attention Required</h3>
                            <p className="text-base font-medium text-text-secondary mb-8">
                                {pastResults.length > 0 && weakTopics[0]?.name !== 'Dynamic Programming'
                                    ? "Automated diagnostics identified critical gaps based on your recent assessments:"
                                    : "Automated diagnostics identified critical gaps in the following fundamental concepts:"}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {weakTopics.map((topic, i) => (
                                    <div key={i} className="p-6 rounded-3xl bg-surface-secondary/50 border border-border/10 hover:border-text-primary transition-all">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-base font-bold text-text-primary">{topic.name}</span>
                                            <span className="text-[10px] font-black text-text-primary bg-text-primary/5 px-3 py-1 rounded-xl">{topic.mastery}% Retention</span>
                                        </div>
                                        <div className="w-full h-2 bg-surface-tertiary rounded-full overflow-hidden mb-3">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${topic.mastery}%` }}
                                                className="h-full bg-text-primary"
                                            />
                                        </div>
                                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{topic.subject}</p>
                                    </div>
                                ))}
                            </div>
                        </div>


                    </div>

                    <div className="space-y-8">
                        {/* History */}
                        <div className="premium-card p-8">
                            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
                                <HiOutlineBookOpen className="w-5 h-5 text-accent" />
                                Previous Scores
                            </h3>
                            <div className="space-y-4">
                                {pastResults.length === 0 ? (
                                    <p className="text-sm text-text-tertiary font-medium">No completed assessments yet.</p>
                                ) : (
                                    pastResults.map((r) => (
                                        <div key={r.id} className="flex flex-col p-4 bg-surface-secondary/50 rounded-xl transition-colors border border-border/5 group">
                                            <div className="flex justify-between items-center mb-2">
                                                <div>
                                                    <h4 className="text-sm font-bold text-text-primary">{r.testName}</h4>
                                                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-tighter">{new Date(r.timestamp).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-[11px] font-black text-text-primary">
                                                    {r.score}%
                                                </div>
                                            </div>
                                            {r.aiDrawbacks && (
                                                <div className="mt-3 space-y-2">
                                                    <div className="p-3 bg-surface-tertiary border border-border/10 rounded-xl">
                                                        <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-1">Identified Fault</p>
                                                        <p className="text-[11px] font-medium text-text-secondary">{r.aiDrawbacks}</p>
                                                    </div>
                                                    <div className="p-3 bg-text-primary/5 border border-text-primary/10 rounded-xl">
                                                        <p className="text-[9px] font-black text-text-primary uppercase tracking-widest mb-1">Recommended Solution</p>
                                                        <p className="text-[11px] font-black text-text-primary">{r.aiSolutions}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Leaderboard */}
                        <div className="premium-card p-8 border border-border/10">
                            <h3 className="text-lg font-black text-text-primary mb-1">Global Ranking</h3>
                            <p className="text-[10px] font-bold text-text-tertiary mb-6 uppercase tracking-widest">Department Benchmarking</p>

                            <div className="space-y-3">
                                {[
                                    { name: 'Alex M.', score: 96, isCurrent: false },
                                    { name: 'Sophia L.', score: 94, isCurrent: false },
                                    { name: `${user?.name || 'Student'} (You)`, score: 88, isCurrent: true },
                                    { name: 'David K.', score: 82, isCurrent: false },
                                ].map((p, i) => (
                                    <div key={i} className={`flex justify-between p-3 rounded-xl transition-all border ${p.isCurrent ? 'bg-text-primary text-surface border-text-primary shadow-lg scale-105' : 'bg-surface-secondary/50 text-text-secondary border-transparent'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black w-4 ${p.isCurrent ? 'text-surface/50' : 'text-text-tertiary'}`}>#{i + 1}</span>
                                            <span className={`text-sm ${p.isCurrent ? 'font-black' : 'font-medium'}`}>{p.name}</span>
                                        </div>
                                        <span className="text-sm font-black">{p.score}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}

