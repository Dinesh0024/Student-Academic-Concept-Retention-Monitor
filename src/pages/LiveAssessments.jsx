import mockDb from '../utils/apiDb';
import { useState, useEffect } from 'react';
import { HiOutlineFire, HiOutlineClock, HiOutlineCalendar, HiOutlineDocumentText, HiOutlineLockClosed, HiOutlinePlay, HiOutlineRefresh } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { QUESTION_BANK } from '../utils/questionBank';

// Compute real-time status of a scheduled test
function getTestStatus(test) {
    const now = new Date();
    if (!test.date || !test.time) return 'upcoming';

    const startDT = new Date(`${test.date}T${test.time}`);
    const durationMs = (parseInt(test.duration) || 60) * 60 * 1000;
    const endDT = test.endTime
        ? new Date(`${test.date}T${test.endTime}`)
        : new Date(startDT.getTime() + durationMs);

    if (now < startDT) return 'upcoming';
    if (now >= startDT && now <= endDT) return 'live';
    return 'ended';
}

// Countdown string to a future datetime
function useCountdown(targetDate, targetTime) {
    const [countdown, setCountdown] = useState('');
    useEffect(() => {
        if (!targetDate || !targetTime) return;
        const tick = () => {
            const diff = new Date(`${targetDate}T${targetTime}`) - new Date();
            if (diff <= 0) { setCountdown('Now'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetDate, targetTime]);
    return countdown;
}

function ScheduledTestCard({ test, index, studentResults }) {
    const status = getTestStatus(test);
    const countdown = useCountdown(test.date, test.time);

    // How many times has this student already attempted this test?
    const attemptCount = studentResults.filter(r => r.testId === test.id && !r.isMissed).length;
    const maxAttempts = test.maxAttempts || 1;
    const allowReattempt = !!test.allowReattempt;
    const attemptsExhausted = allowReattempt
        ? attemptCount >= maxAttempts
        : attemptCount >= 1;
    const isLocked = attemptsExhausted;

    const testConfig = {
        id: test.id,
        name: test.name,
        subject: test.subject,
        duration: test.duration,
        time: test.time,
        endTime: test.endTime,
        numQuestions: test.numQuestions || 10,
        isLive: false,
    };

    const statusStyles = {
        live:     { dot: 'bg-emerald-500 animate-pulse', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'Live Now' },
        upcoming: { dot: 'bg-amber-400',                  badge: 'bg-amber-50 text-amber-600 border-amber-200',   label: 'Upcoming'  },
        ended:    { dot: 'bg-gray-300',                    badge: 'bg-gray-50 text-gray-400 border-gray-200',      label: 'Ended'     },
    };
    const s = statusStyles[status];

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className={`flex flex-col p-6 rounded-3xl border transition-all duration-300 group
                ${status === 'live'
                    ? 'bg-emerald-50/40 border-emerald-200 hover:shadow-2xl hover:shadow-emerald-500/10'
                    : status === 'upcoming'
                    ? 'bg-amber-50/30 border-amber-100 hover:bg-white hover:shadow-2xl hover:shadow-amber-500/10'
                    : 'bg-gray-50/50 border-gray-100 opacity-60'}`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                    <HiOutlineDocumentText className="w-5 h-5 text-gray-500" />
                </div>
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${s.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                    {s.label}
                </span>
            </div>

            {/* Info */}
            <h4 className="font-bold text-gray-900 text-lg tracking-tight leading-tight mb-1">{test.name}</h4>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{test.subject}</p>

            <div className="flex flex-wrap gap-3 mb-5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                    <HiOutlineCalendar className="w-3.5 h-3.5" />
                    {test.date ? new Date(test.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                    <HiOutlineClock className="w-3.5 h-3.5" />
                    {test.time || '—'}{test.endTime ? ` – ${test.endTime}` : ''}
                </div>
            </div>

            {/* Countdown for upcoming */}
            {status === 'upcoming' && countdown && (
                <div className="mb-4 px-4 py-2.5 bg-amber-100 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-0.5">Starts in</p>
                    <p className="text-sm font-black text-amber-700 tabular-nums">{countdown}</p>
                </div>
            )}

            {/* Attempt counter info */}
            {attemptCount > 0 && (
                <div className="flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-gray-100 rounded-xl w-fit">
                    <HiOutlineRefresh className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        {attemptCount}/{allowReattempt ? maxAttempts : 1} attempt{attemptCount > 1 ? 's' : ''} used
                    </span>
                </div>
            )}

            {/* CTA — locked if attempts exhausted */}
            {status === 'ended' ? (
                <div className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gray-100 text-gray-400 text-xs font-black uppercase tracking-widest cursor-not-allowed">
                    <HiOutlineLockClosed className="w-4 h-4" />
                    Test Ended
                </div>
            ) : isLocked ? (
                <div className="mt-auto flex flex-col items-center justify-center gap-1 w-full py-3 rounded-2xl bg-red-50 border border-red-100 text-red-400 cursor-not-allowed">
                    <div className="flex items-center gap-2">
                        <HiOutlineLockClosed className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Attempts Exhausted</span>
                    </div>
                    <span className="text-[10px] font-bold text-red-300">
                        {allowReattempt ? `Max ${maxAttempts} attempts reached` : 'Re-attempt not allowed'}
                    </span>
                </div>
            ) : status === 'live' ? (
                <Link
                    to="/student/test"
                    state={{ testConfig }}
                    className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                >
                    <HiOutlinePlay className="w-4 h-4" />
                    {attemptCount > 0 ? 'Re-attempt Test' : 'Attend Test'}
                </Link>
            ) : (
                <Link
                    to="/student/test"
                    state={{ testConfig }}
                    className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-amber-400/20"
                >
                    <HiOutlinePlay className="w-4 h-4" />
                    {attemptCount > 0 ? 'Re-attempt Test' : 'Attend Test'}
                </Link>
            )}
        </motion.div>
    );
}

export default function LiveAssessments() {
    const { user } = useAuth();
    const [allTests, setAllTests] = useState([]);
    const [studentResults, setStudentResults] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const tests = await mockDb.getTests();
            setAllTests(tests);
            if (user?.email) {
                const results = await mockDb.getResultsByStudent(user.email);
                setStudentResults(results);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [user]);

    // Hide completed tests unless faculty explicitly allows another attempt.
    const scheduledTests = allTests.filter((test) => {
        if (test.isLive) return false;
        const attempts = studentResults.filter((result) => String(result.testId) === String(test.id) && !result.isMissed).length;
        const maxAttempts = test.allowReattempt ? (Number(test.maxAttempts) || 2) : 1;
        return attempts < maxAttempts;
    });

    // AI-generated live tests
    const aiLiveAssessments = allTests.filter(t => {
        if (!t.isLive) return false;
        if (t.date && t.endTime) {
            const expiry = new Date(`${t.date} ${t.endTime}`);
            return expiry > new Date();
        }
        return true;
    });

    return (
        <PageTransition>
            <div className="pb-12 space-y-12">
                <div className="mb-2">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Live Assessments</h1>
                    <p className="text-base text-gray-500 font-medium tracking-tight">Active challenges and dynamically generated evaluations.</p>
                </div>

                {/* ── Scheduled Tests from Faculty ── */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <HiOutlineCalendar className="w-5 h-5 text-gray-400" />
                        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Faculty Scheduled Tests</h2>
                    </div>
                    {scheduledTests.length === 0 ? (
                        <div className="premium-card p-10 bg-white text-center border-2 border-dashed border-gray-100">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No scheduled tests yet</p>
                            <p className="text-xs text-gray-300 mt-1 font-medium">Your faculty hasn't deployed any tests yet. Check back soon.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {scheduledTests.map((test, i) => (
                                <ScheduledTestCard key={test.id} test={test} index={i} studentResults={studentResults} />
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Open Live Challenges ── */}
                <section>
                    <div className="premium-card p-10 bg-white">
                        <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                            <HiOutlineFire className="w-6 h-6 text-rose-500" />
                            Open Practice Challenges
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.keys(QUESTION_BANK).map((topic, i) => {
                                const liveConfig = {
                                    id: `live-${topic.toLowerCase().replace(' ', '-')}`,
                                    name: `Live Challenge: ${topic}`,
                                    subject: topic,
                                    duration: 15,
                                    isLive: true,
                                    numQuestions: 10
                                };
                                return (
                                    <motion.div
                                        key={`static-${i}`}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex flex-col p-6 rounded-3xl bg-gray-50/50 border border-gray-100 group hover:bg-white hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300"
                                    >
                                        <div className="mb-6">
                                            <h4 className="font-bold text-gray-900 text-xl tracking-tight leading-tight">{topic}</h4>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">{liveConfig.numQuestions} Questions • {liveConfig.duration} Min</p>
                                        </div>
                                        <Link
                                            to="/student/test"
                                            state={{ testConfig: liveConfig }}
                                            className="mt-auto flex items-center justify-center gap-2 py-3 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 text-center rounded-2xl transition-colors uppercase tracking-widest"
                                        >
                                            <HiOutlinePlay className="w-4 h-4" />
                                            Start Now
                                        </Link>
                                    </motion.div>
                                );
                            })}

                            {/* AI Generated Live Assessments */}
                            {aiLiveAssessments.map((test, i) => (
                                <div key={`ai-${test.id}`} className="flex flex-col p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100 group hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-300 transition-all duration-300">
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                            <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">AI Generated</span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-xl tracking-tight leading-tight">{test.subject}</h4>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">{test.numQuestions} Questions • {test.duration} Min</p>
                                        {(test.time && test.endTime) && (
                                            <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-100 rounded-xl text-xs font-black text-indigo-700 uppercase tracking-widest">
                                                <HiOutlineClock className="w-4 h-4" />
                                                <span>{test.time} - {test.endTime}</span>
                                            </div>
                                        )}
                                    </div>
                                    <Link to="/student/test" state={{ testConfig: test }} className="mt-auto flex items-center justify-center gap-2 py-3 text-sm font-bold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 text-center rounded-2xl transition-colors uppercase tracking-widest">
                                        <HiOutlinePlay className="w-4 h-4" />
                                        Start Assessment
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </PageTransition>
    );
}
