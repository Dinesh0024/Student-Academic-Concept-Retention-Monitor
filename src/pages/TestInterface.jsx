import mockDb from '../utils/apiDb';
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineClock, HiOutlineExclamationCircle, HiOutlineCheckCircle, HiOutlineLightBulb } from 'react-icons/hi';
import PageTransition from '../components/PageTransition';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { generateUniqueQuestions } from '../utils/questionGeneratorEngine';
import ShadowGradingModal from '../components/ShadowGradingModal';
import { generateShadowGradingAnalysis } from '../utils/analytics';

const MotionDiv = motion.div;
const isValidClockTime = (time) => typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

const formatClockTime = (time) => {
    if (!isValidClockTime(time)) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

export default function TestInterface() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Router state is preferred; storage keeps notification launches working after reloads.
    let storedTestConfig = null;
    try {
        storedTestConfig = JSON.parse(sessionStorage.getItem('active_deployed_test') || 'null');
    } catch {
        storedTestConfig = null;
    }
    const testConfig = location.state?.testConfig || storedTestConfig;

    // Dynamically generate the test based on config
    const [realTest] = useState(() => {
        if (!testConfig) return null;

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
        } else {
            // Generate non-repeating dynamic questions with anti-repeat deduplication
            const qCount = Math.min(testConfig.numQuestions || 10, 50);
            finalQuestions = generateUniqueQuestions({
                subject: testConfig.subject,
                numQuestions: qCount
            }).map(q => ({
                id: q.id,
                text: q.text,
                options: q.options,
                answer: q.answer || q.correctAnswer
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
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [aiFeedback, setAiFeedback] = useState(null);
    const [resultId, setResultId] = useState(null);
    const [studentFeedback, setStudentFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingFeedback, setIsSavingFeedback] = useState(false);
    const [timeLeft, setTimeLeft] = useState(() => realTest ? realTest.duration * 60 : 0);
    const [missedReason, setMissedReason] = useState('');
    const [showShadowModal, setShowShadowModal] = useState(false);

    // Calculate time window enforcement
    const checkTimeWindow = () => {
        if (!realTest || !isValidClockTime(realTest.time) || !isValidClockTime(realTest.endTime)) return 'within';
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();

        const parseMins = (timeStr) => {
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

    const handleMissedSubmit = async () => {
        if (!user || !realTest) return;
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

    const handleSubmit = useCallback(async () => {
        if (!realTest || !user || isSubmitting || submitted) return;
        setIsSubmitting(true);
        try {
            let correct = 0;
            realTest.questions.forEach(q => {
                if (answers[q.id] === q.answer) correct++;
            });
            const finalScore = Math.round((correct / realTest.questions.length) * 100);

            const drawbacks = finalScore < 100
                ? `AI identified conceptual gaps in ${realTest.subject} fundamentals during complex reasoning tasks.`
                : 'No conceptual gaps detected. Mastery confirmed.';

            const solutions = finalScore < 100
                ? 'AI Recommendation: Review primary source materials and complete secondary practice modules for weak points.'
                : 'Maintain current velocity and exploration.';

            const savedResult = await mockDb.saveResult({
                testId: realTest.id,
                testName: realTest.title,
                studentName: user.name,
                studentEmail: user.email,
                score: finalScore,
                aiDrawbacks: drawbacks,
                aiSolutions: solutions
            });

            setCorrectAnswers(correct);
            setScore(finalScore);
            setAiFeedback({ drawbacks, solutions });
            setResultId(savedResult.id);
            setSubmitted(true);
        } catch (error) {
            console.error('Assessment submission failed:', error);
            toast.error(error.message || 'Could not submit the assessment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [answers, isSubmitting, realTest, submitted, user]);

    const handleFeedbackAndExit = async (event) => {
        event.preventDefault();
        const wordCount = studentFeedback.trim().split(/\s+/).filter(Boolean).length;
        if (!resultId || wordCount < 4) {
            toast.error('Please enter at least four words of feedback.');
            return;
        }

        setIsSavingFeedback(true);
        try {
            await mockDb.updateStudentTestFeedback(resultId, studentFeedback.trim());
            toast.success('Feedback saved. Returning to your dashboard.');
            navigate('/student', { replace: true });
        } catch (error) {
            console.error('Assessment feedback could not be saved:', error);
            toast.error(error.message || 'Could not save your feedback. Please try again.');
        } finally {
            setIsSavingFeedback(false);
        }
    };

    useEffect(() => {
        let timer;
        if (started && !submitted && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && started && !submitted) {
            handleSubmit();
            toast('Window timeout: Auto-submission initialized.', { icon: '⏱️' });
        }
        return () => clearInterval(timer);
    }, [started, submitted, timeLeft, handleSubmit]);

    if (!testConfig || !realTest) {
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

    const formatRemainingTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleSelectOption = (qId, option) => {
        setAnswers({ ...answers, [qId]: option });
    };

    if (submitted) {
        const shadowData = generateShadowGradingAnalysis(realTest.questions, answers);

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
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Your Score</p>
                            <h3 className={`text-6xl font-black ${score >= 70 ? 'text-emerald-500' : 'text-amber-500'} tracking-tighter`}>
                                {correctAnswers} <span className="text-3xl text-gray-400">/ {realTest.questions.length}</span>
                            </h3>
                            <p className="text-xs font-bold text-gray-500 mt-3">Correct answers out of total questions</p>
                        </div>

                        <div className="bg-blue-50/50 rounded-3xl p-6 mb-6 border border-blue-100/50 text-left">
                            <div className="flex items-center gap-2 mb-3">
                                <HiOutlineLightBulb className="w-5 h-5 text-blue-500" />
                                <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest">Feedback</h4>
                            </div>
                            <p className="text-xs font-medium text-blue-800 leading-relaxed">{aiFeedback.drawbacks}</p>
                            <p className="text-xs font-medium text-emerald-700 leading-relaxed mt-3">{aiFeedback.solutions}</p>
                        </div>

                        <form onSubmit={handleFeedbackAndExit} className="bg-gray-50 rounded-3xl p-6 mb-6 border border-gray-100 text-left">
                            <label htmlFor="assessment-feedback" className="block text-sm font-black text-gray-900 mb-2">
                                How was this assessment?
                            </label>
                            <p className="text-xs text-gray-500 mb-3">Share at least four words of feedback before exiting.</p>
                            <textarea
                                id="assessment-feedback"
                                value={studentFeedback}
                                onChange={(event) => setStudentFeedback(event.target.value)}
                                className="apple-input w-full min-h-28 resize-y"
                                placeholder="Tell us what worked well or could be improved..."
                                required
                            />
                            <button
                                type="submit"
                                disabled={isSavingFeedback || studentFeedback.trim().split(/\s+/).filter(Boolean).length < 4}
                                className="apple-btn apple-btn-primary w-full mt-4 !py-4 !text-xs !font-black !uppercase !tracking-widest disabled:opacity-50"
                            >
                                {isSavingFeedback ? 'Saving Feedback...' : 'Submit Feedback and Exit'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/student', { replace: true })}
                                className="w-full mt-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-900"
                            >
                                Skip feedback and exit
                            </button>
                        </form>

                        {/* Feature 8: Shadow Grading Launcher */}
                        <div className="mb-6">
                            <button
                                onClick={() => setShowShadowModal(true)}
                                className="w-full py-3 px-4 rounded-2xl bg-indigo-600/10 text-indigo-600 border border-indigo-200 font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            >
                                <span>👻 View Shadow Grading (AI Reasoning Divergence)</span>
                            </button>
                        </div>

                        <ShadowGradingModal
                            isOpen={showShadowModal}
                            onClose={() => setShowShadowModal(false)}
                            shadowData={shadowData}
                        />
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
                            {isValidClockTime(realTest.time) && isValidClockTime(realTest.endTime) && (
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Access Period</p>
                                    <div className="text-sm font-bold text-gray-700 flex flex-col justify-center items-center gap-1">
                                        <span className="flex items-center gap-2"><HiOutlineClock className="w-4 h-4 text-amber-500" /> Start: {formatClockTime(realTest.time)}</span>
                                            <span>End: {formatClockTime(realTest.endTime)}</span>
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
                                <p className="text-xs text-gray-400 mt-1 font-medium">Please return between {formatClockTime(realTest.time)} and {formatClockTime(realTest.endTime)}</p>
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
                            <button
                                onClick={() => setStarted(true)}
                                className="apple-btn apple-btn-primary !text-xs !font-black !uppercase !tracking-[0.2em] !px-16 !py-4 shadow-2xl shadow-blue-500/20"
                            >
                                Initialize Session
                            </button>
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
                            {formatRemainingTime(timeLeft)}
                        </div>
                        <button onClick={handleSubmit} className="apple-btn apple-btn-primary !py-2.5 !px-6 !text-[10px] !font-black !uppercase !tracking-widest !bg-emerald-500">
                            Finalize
                        </button>
                    </div>
                </div>

                <div className="mb-12">
                    <ProgressBar value={progress} height={4} showLabel={false} />
                </div>

                <MotionDiv
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
                </MotionDiv>

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
