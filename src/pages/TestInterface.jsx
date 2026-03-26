import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineClock, HiOutlineExclamationCircle, HiOutlineCheckCircle, HiOutlineLightBulb } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';
import mockDb from '../utils/mockDb';
import toast from 'react-hot-toast';
import { QUESTION_BANK } from '../utils/questionBank';
export default function TestInterface() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Retrieve the assigned test config if the user clicked "Launch Test" from dashboard
    const testConfig = location.state?.testConfig;

    if (!testConfig) {
        return (
            <PageTransition>
                <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <HiOutlineExclamationCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Assessment Selected</h2>
                    <p className="text-gray-500 mb-8 max-w-sm">Please return to your Learning Path and select a specific pending or live assessment to initialize.</p>
                    <button onClick={() => navigate('/student')} className="apple-btn apple-btn-primary !px-8 !py-3">
                        Return to Command Center
                    </button>
                </div>
            </PageTransition>
        );
    }

    // Dynamically generate the test based on config
    const [realTest, setRealTest] = useState(() => {

        let finalQuestions = [];

        if (testConfig.questions && testConfig.questions.length > 0) {
            // Use custom/embedded questions (e.g. from Faculty AI Generator)
            finalQuestions = testConfig.questions.map(q => ({
                id: q.id,
                text: q.text,
                options: q.options,
                // Ensure field mappings match TestInterface expectations (correctAnswer vs answer)
                answer: q.correctAnswer || q.answer
            }));
        } else if (testConfig.isLive && QUESTION_BANK[testConfig.subject]) {
            // Use the curated hardcoded question bank for live assessments
            finalQuestions = QUESTION_BANK[testConfig.subject];
        } else {
            // Fallback to generating mock generic questions
            const qCount = Math.min(testConfig.numQuestions || 5, 20); // Cap at 20 for UI sanity
            finalQuestions = Array.from({ length: qCount }).map((_, i) => ({
                id: i + 1,
                text: `(Generated) Analyze the core principle underlying ${testConfig.subject} mechanism #${i + 1}?`,
                options: ['Option Alpha', 'Option Beta', 'Option Gamma', 'Option Delta'],
                answer: 'Option Alpha' // Simplify mock answering
            }));
        }

        return {
            id: testConfig.id,
            title: testConfig.name,
            subject: testConfig.subject,
            duration: testConfig.duration,
            time: testConfig.time,
            endTime: testConfig.endTime,
            questions: finalQuestions
        };
    });

    const [started, setStarted] = useState(false);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const [aiFeedback, setAiFeedback] = useState(null);

    // Calculate time window enforcement
    const checkTimeWindow = () => {
        if (!realTest.time || !realTest.endTime) return 'within';
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();

        const parseMins = (timeStr) => {
            if (!timeStr) return 0;
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        };

        const startMins = parseMins(realTest.time);
        const endMins = parseMins(realTest.endTime);

        if (currentMins < startMins) return 'before';
        if (currentMins > endMins) return 'after';
        return 'within';
    };

    const windowStatus = checkTimeWindow();
    const [timeLeft, setTimeLeft] = useState(realTest.duration * 60);
    const [missedReason, setMissedReason] = useState('');
    const [lateReason, setLateReason] = useState('');
    const [reasonConfirmed, setReasonConfirmed] = useState(false);


    const handleMissedSubmit = async () => {
        if (!user) return;
        await mockDb.saveResult({
            testId: realTest.id,
            testName: realTest.title,
            studentName: user.name,
            studentEmail: user.email,
            score: 'Missed',
            isMissed: true,
            missedReason: missedReason,
            aiDrawbacks: 'N/A',
            aiSolutions: 'Student missed the designated assessment window.'
        });
        toast.success("Reason submitted to faculty.");
        navigate('/student');
    };

    useEffect(() => {
        let timer;
        if (started && !submitted && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && !submitted) {
            handleSubmit();
            toast('Window timeout: Auto-submission initialized.', { icon: '⏱️' });
        }
        return () => clearInterval(timer);
    }, [started, submitted, timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleSelectOption = (qId, option) => {
        setAnswers({ ...answers, [qId]: option });
    };

    const handleSubmit = async () => {
        let correct = 0;
        realTest.questions.forEach(q => {
            if (answers[q.id] === q.answer) correct++;
        });
        const finalScore = Math.round((correct / realTest.questions.length) * 100);
        setScore(finalScore);

        // Generate AI insights
        const drawbacks = finalScore < 100
            ? `AI identified conceptual gaps in ${realTest.subject} fundamentals during complex reasoning tasks.`
            : 'No conceptual gaps detected. Mastery confirmed.';

        const solutions = finalScore < 100
            ? 'AI Recommendation: Review primary source materials and complete secondary practice modules for weak points.'
            : 'Maintain current velocity and exploration.';

        setAiFeedback({ drawbacks, solutions });

        // Save result
        if (user) {
            await mockDb.saveResult({
                testId: realTest.id,
                testName: realTest.title,
                studentName: user.name,
                studentEmail: user.email,
                score: finalScore,
                aiDrawbacks: drawbacks,
                aiSolutions: solutions,
                lateReason: lateReason
            });
        }

        setSubmitted(true);
    };

    if (submitted) {
        return (
            <PageTransition>
                <div className="min-h-[80vh] flex items-center justify-center p-6">
                    <div className="premium-card p-12 max-w-lg w-full text-center bg-white shadow-2xl shadow-emerald-500/10 border-t-4 border-t-emerald-500">
                        <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <HiOutlineCheckCircle className="w-12 h-12" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Transmission Complete</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10">Assessment data successfully uploaded</p>

                        <div className="bg-gray-50 rounded-3xl p-8 mb-6 border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Retention Index</p>
                            <h3 className={`text-6xl font-black ${score >= 70 ? 'text-emerald-500' : 'text-amber-500'} tracking-tighter`}>
                                {score}%
                            </h3>
                            <div className="w-full h-1.5 bg-gray-200 rounded-full mt-6 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score}%` }}
                                    className={`h-full ${score >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                />
                            </div>
                            <p className="text-xs font-bold text-gray-500 mt-6 leading-relaxed">
                                {score >= 70 ? 'Optimal mastery detected. Cognitive architecture is stable.' : 'Sub-optimal retention. Concept reinforcement is highly recommended.'}
                            </p>
                        </div>

                        {/* AI Insights Panel */}
                        <div className="bg-blue-50/50 rounded-3xl p-6 mb-10 border border-blue-100/50 text-left">
                            <div className="flex items-center gap-2 mb-4">
                                <HiOutlineLightBulb className="w-5 h-5 text-blue-500" />
                                <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest">AI Performance Diagnostics</h4>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Identified Drawbacks</p>
                                    <p className="text-xs font-medium text-blue-800 leading-relaxed">{aiFeedback.drawbacks}</p>
                                </div>
                                <div className="h-px w-full bg-blue-100/50"></div>
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">AI Solution Route</p>
                                    <p className="text-xs font-medium text-emerald-700 leading-relaxed">{aiFeedback.solutions}</p>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => navigate('/student')} className="apple-btn apple-btn-primary w-full !py-4 !text-xs !font-black !uppercase !tracking-widest">
                            Return to Command Center
                        </button>
                    </div>
                </div>
            </PageTransition>
        );
    }

    if (!started) {
        return (
            <PageTransition>
                <div className="max-w-3xl mx-auto py-12 px-6">
                    <div className="premium-card p-12 md:p-16 text-center bg-white relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-blue-500"></div>
                        <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-inner">
                            <HiOutlineLightBulb className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">{realTest.title}</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-12">{realTest.subject}</p>

                        <div className="flex flex-wrap items-center justify-center gap-10 mb-16">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Window</p>
                                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 justify-center">
                                    <HiOutlineClock className="w-4 h-4 text-blue-500" />
                                    <span>{realTest.duration} MIN</span>
                                </div>
                            </div>
                            {realTest.time && realTest.endTime && (
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Access Period</p>
                                    <div className="text-sm font-bold text-gray-700 flex justify-center items-center gap-2">
                                        <HiOutlineClock className="w-4 h-4 text-amber-500" />
                                        <span>{realTest.time} - {realTest.endTime}</span>
                                    </div>
                                </div>
                            )}
                            <div className="text-center">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Payload</p>
                                <div className="text-sm font-bold text-gray-700 flex justify-center items-center gap-2">
                                    <span className="text-blue-500 font-black">{realTest.questions.length}</span> items
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 mb-12 text-left">
                            <div className="flex gap-4 items-start">
                                <HiOutlineExclamationCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Protocol Warning</p>
                                    <ul className="text-xs font-bold text-amber-700/80 space-y-2 leading-relaxed">
                                        <li>• Continuous uplink required; refresh will terminate session.</li>
                                        <li>• Automated submission trigger on timer expiration.</li>
                                        <li>• Secure interface: switching tabs may trigger violation.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {windowStatus === 'before' && (
                            <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                                    Outside Authorization Window
                                </p>
                                <p className="text-xs text-gray-400 mt-1 font-medium">Please return between {realTest.time} and {realTest.endTime}</p>
                            </div>
                        )}

                        {windowStatus === 'after' && (
                            <div className="p-6 bg-rose-50 border-2 border-dashed border-rose-200 rounded-2xl text-left">
                                <div className="flex items-center gap-2 mb-4">
                                    <HiOutlineExclamationCircle className="w-6 h-6 text-rose-500" />
                                    <p className="text-sm font-bold text-rose-600 uppercase tracking-widest">Assessment Ended</p>
                                </div>
                                <p className="text-sm text-rose-800 font-medium mb-4">You have missed the authorized time window for this assessment. Please provide a reason to your faculty.</p>
                                <textarea
                                    className="apple-input w-full min-h-[100px] mb-4 text-sm"
                                    placeholder="Enter reason for missing the test..."
                                    value={missedReason}
                                    onChange={(e) => setMissedReason(e.target.value)}
                                ></textarea>
                                <button
                                    onClick={handleMissedSubmit}
                                    disabled={!missedReason.trim()}
                                    className="apple-btn apple-btn-primary !bg-rose-500 hover:!bg-rose-600 !w-full"
                                >
                                    Submit Reason
                                </button>
                            </div>
                        )}

                        {windowStatus === 'within' && (
                            <>
                                {(!realTest.time || !realTest.endTime) && (
                                    <div className={`bg-blue-50/50 rounded-2xl p-6 border border-blue-100 transition-all duration-500 overflow-hidden ${reasonConfirmed ? 'mb-0 opacity-0 max-h-0 py-0 border-none' : 'mb-8 opacity-100 max-h-[300px]'}`}>
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Untimed Assessment Audit</p>
                                        <p className="text-xs font-bold text-blue-800/80 mb-3">Please provide a reason for taking this untimed or retroactive assessment before initializing.</p>
                                        <textarea
                                            className="apple-input w-full min-h-[80px] text-sm mb-4"
                                            placeholder="Enter reason..."
                                            value={lateReason}
                                            onChange={(e) => setLateReason(e.target.value)}
                                            required
                                        ></textarea>
                                        <button
                                            type="button"
                                            onClick={() => setReasonConfirmed(true)}
                                            disabled={!lateReason.trim()}
                                            className="apple-btn apple-btn-primary !py-2 !px-6 !text-[10px] !bg-blue-600 disabled:opacity-50"
                                        >
                                            Confirm Purpose
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => setStarted(true)}
                                    className="apple-btn apple-btn-primary !text-xs !font-black !uppercase !tracking-[0.2em] !px-16 !py-4 shadow-2xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={(!realTest.time || !realTest.endTime) && !reasonConfirmed}
                                >
                                    Initialize Session
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </PageTransition>
        );
    }

    const currentQ = realTest.questions[currentIdx];
    const progress = ((currentIdx + 1) / realTest.questions.length) * 100;
    const isLast = currentIdx === realTest.questions.length - 1;

    return (
        <PageTransition>
            <div className="max-w-4xl mx-auto pb-20 px-6">
                <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl p-6 mb-8 sticky top-4 z-20 shadow-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-10 bg-blue-500 rounded-full"></div>
                        <div>
                            <h2 className="font-bold text-gray-900 tracking-tight leading-none mb-1">Current Item</h2>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currentIdx + 1} of {realTest.questions.length}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className={`px-5 py-2.5 rounded-2xl font-black text-sm tracking-widest flex items-center gap-2 transition-all ${timeLeft < 60 ? 'bg-rose-50 text-rose-500 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
                            <HiOutlineClock className="w-4 h-4" />
                            {formatTime(timeLeft)}
                        </div>
                        <button onClick={handleSubmit} className="apple-btn apple-btn-primary !py-2.5 !px-6 !text-[10px] !font-black !uppercase !tracking-widest !bg-emerald-500">
                            Finalize
                        </button>
                    </div>
                </div>

                <div className="mb-12">
                    <ProgressBar value={progress} height={4} showLabel={false} />
                </div>

                <motion.div
                    key={currentIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="premium-card bg-white p-12 mb-8 min-h-[400px] flex flex-col justify-center"
                >
                    <h3 className="text-2xl font-bold text-gray-900 mb-12 leading-tight tracking-tight">
                        <span className="text-blue-500 mr-4 opacity-30 font-black">?</span>
                        {currentQ.text}
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        {currentQ.options.map((opt, idx) => {
                            const isSelected = answers[currentQ.id] === opt;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectOption(currentQ.id, opt)}
                                    className={`group w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${isSelected
                                        ? 'border-blue-500 bg-blue-50 shadow-xl shadow-blue-500/5'
                                        : 'border-gray-50 bg-gray-50 hover:border-gray-200'
                                        }`}
                                >
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-blue-500 bg-blue-500 scale-110' : 'border-gray-300'}`}>
                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <span className={`font-bold transition-colors ${isSelected ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-900'}`}>{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                <div className="flex items-center justify-between gap-6">
                    <button
                        onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                        disabled={currentIdx === 0}
                        className="px-10 py-3 text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    {!isLast ? (
                        <button
                            onClick={() => setCurrentIdx(prev => Math.min(realTest.questions.length - 1, prev + 1))}
                            className="apple-btn apple-btn-primary !px-12 !py-3.5 !text-xs !font-black !uppercase !tracking-[0.2em]"
                        >
                            Next Sequence
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="apple-btn apple-btn-primary !px-12 !py-3.5 !text-xs !font-black !uppercase !tracking-[0.2em] !bg-emerald-500"
                        >
                            Commit Final
                        </button>
                    )}
                </div>
            </div>
        </PageTransition>
    );
}
