import { useState, useEffect } from 'react';
import { HiOutlineBookOpen, HiOutlineCheckCircle, HiOutlineClock, HiOutlineFire, HiOutlineTrendingUp, HiOutlineStar } from 'react-icons/hi';
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
            <div className="pb-12">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-2">My Learning Path</h1>
                        <p className="text-base md:text-lg text-gray-500 font-medium tracking-tight">Welcome back, {user?.name || 'Student'}. Here is your retention summary.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard title="Overall Mastery" value={`${overallMastery}%`} trend={overallMastery > 75 ? 3.2 : -1.5} icon={HiOutlineFire} />
                    <StatCard title="Tests Taken" value="12" trend={1} icon={HiOutlineCheckCircle} />
                    <StatCard title="Topic Velocity" value="High" icon={HiOutlineTrendingUp} />
                    <StatCard title="Certificates" value="2" icon={HiOutlineStar} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Upcoming Assessments */}
                        <div className="premium-card p-8 bg-white">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <HiOutlineClock className="w-5 h-5 text-[var(--color-accent)]" />
                                Pending Assessments
                            </h3>
                            <div className="space-y-4">
                                {upcomingTests.length === 0 ? (
                                    <p className="text-sm text-gray-400 font-medium">No pending assessments at this time.</p>
                                ) : (
                                    upcomingTests.map((t) => (
                                        <div key={t.id} className="flex flex-col sm:flex-row justify-between items-center p-5 rounded-2xl bg-gray-50/50 border border-gray-100 group hover:bg-white hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500">
                                            <div className="mb-4 sm:mb-0">
                                                <h4 className="font-bold text-gray-800 tracking-tight">{t.name}</h4>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t.subject} • {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {t.time}</p>
                                            </div>
                                            <Link to="/student/test" state={{ testConfig: t }} className="apple-btn apple-btn-primary !py-2.5 !px-8 text-sm !bg-emerald-500 hover:!bg-emerald-600">Launch Test</Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Concept Weakness - Dynamic Drawbacks */}
                        <div className="premium-card p-10 bg-white border-l-8 border-l-rose-500 shadow-xl shadow-rose-500/5">
                            <h3 className="text-2xl font-black text-gray-800 mb-3 tracking-tight">Attention Required</h3>
                            <p className="text-base font-medium text-gray-500 mb-8">
                                {pastResults.length > 0 && weakTopics[0]?.name !== 'Dynamic Programming'
                                    ? "Automated diagnostics identified critical gaps based on your recent assessments:"
                                    : "Automated diagnostics identified critical gaps in the following fundamental concepts:"}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {weakTopics.map((topic, i) => (
                                    <div key={i} className="p-6 rounded-3xl bg-rose-50/50 border border-rose-100 hover:bg-rose-50 hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-base font-bold text-gray-900">{topic.name}</span>
                                            <span className="text-sm font-black text-rose-500 bg-rose-100 px-3 py-1 rounded-xl">{topic.mastery}% Retention</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-rose-200/50 rounded-full overflow-hidden mb-3">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${topic.mastery}%` }}
                                                className="h-full bg-rose-500"
                                            />
                                        </div>
                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{topic.subject}</p>
                                    </div>
                                ))}
                            </div>
                        </div>


                    </div>

                    <div className="space-y-8">
                        {/* History */}
                        <div className="premium-card p-8 bg-white">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <HiOutlineBookOpen className="w-5 h-5 text-[var(--color-accent)]" />
                                Previous Scores
                            </h3>
                            <div className="space-y-4">
                                {pastResults.length === 0 ? (
                                    <p className="text-sm text-gray-400 font-medium">No completed assessments yet.</p>
                                ) : (
                                    pastResults.map((r) => (
                                        <div key={r.id} className="flex flex-col p-4 bg-gray-50/50 rounded-xl transition-colors border border-gray-100 group">
                                            <div className="flex justify-between items-center mb-2">
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-800">{r.testName}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{new Date(r.timestamp).toLocaleDateString()}</p>
                                                </div>
                                                <div className={`text-sm font-black ${r.score >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {r.score}%
                                                </div>
                                            </div>
                                            {r.aiDrawbacks && (
                                                <div className="mt-3 space-y-2">
                                                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                                                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Identified Fault</p>
                                                        <p className="text-[11px] font-medium text-rose-800">{r.aiDrawbacks}</p>
                                                    </div>
                                                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Recommended Solution</p>
                                                        <p className="text-[11px] font-medium text-emerald-800">{r.aiSolutions}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {r.teacherFeedback && (
                                                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Faculty Feedback</p>
                                                    <p className="text-[11px] font-medium text-blue-800">{r.teacherFeedback}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Leaderboard */}
                        <div className="premium-card p-8 bg-blue-600 text-white shadow-blue-500/20">
                            <h3 className="text-lg font-bold mb-1">Global Ranking</h3>
                            <p className="text-xs font-medium text-blue-100 mb-6 opacity-80 uppercase tracking-widest">Department Benchmarking</p>

                            <div className="space-y-3">
                                {[
                                    { name: 'Alex M.', score: 96, isCurrent: false },
                                    { name: 'Sophia L.', score: 94, isCurrent: false },
                                    { name: `${user?.name || 'Student'} (You)`, score: 88, isCurrent: true },
                                    { name: 'David K.', score: 82, isCurrent: false },
                                ].map((p, i) => (
                                    <div key={i} className={`flex justify-between p-3 rounded-xl transition-all ${p.isCurrent ? 'bg-white text-blue-600 shadow-lg scale-105' : 'bg-white/10 text-white'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-black w-4 ${p.isCurrent ? 'text-blue-600' : 'text-blue-200'}`}>#{i + 1}</span>
                                            <span className={`text-sm ${p.isCurrent ? 'font-bold' : 'font-medium opacity-90'}`}>{p.name}</span>
                                        </div>
                                        <span className={`text-sm font-black ${p.isCurrent ? '' : 'opacity-90'}`}>{p.score}%</span>
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

