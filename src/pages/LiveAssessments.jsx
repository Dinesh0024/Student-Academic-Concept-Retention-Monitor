import { useState, useEffect } from 'react';
import { HiOutlineFire, HiOutlineClock } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import mockDb from '../utils/mockDb';
import { QUESTION_BANK } from '../utils/questionBank';

export default function LiveAssessments() {
    const { user } = useAuth();

    const [allTests, setAllTests] = useState([]);

    useEffect(() => {
        const fetchTests = async () => {
            const tests = await mockDb.getTests();
            setAllTests(tests);
        };
        fetchTests();
    }, []);

    const aiLiveAssessments = allTests.filter(t => t.isLive);

    return (
        <PageTransition>
            <div className="pb-12">
                <div className="mb-10">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Live Assessments</h1>
                    <p className="text-base text-gray-500 font-medium tracking-tight">Active challenges and dynamically generated evaluations.</p>
                </div>

                <div className="premium-card p-10 bg-white">
                    <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                        <HiOutlineFire className="w-6 h-6 text-rose-500" />
                        Available Challenges
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Hardcoded Topics */}
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
                                <div key={`static-${i}`} className="flex flex-col p-6 rounded-3xl bg-gray-50/50 border border-gray-100 group hover:bg-white hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300">
                                    <div className="mb-6">
                                        <h4 className="font-bold text-gray-900 text-xl tracking-tight leading-tight">{topic}</h4>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">{liveConfig.numQuestions} Questions • {liveConfig.duration} Min</p>
                                    </div>
                                    <Link to="/student/test" state={{ testConfig: liveConfig }} className="mt-auto apple-btn px-6 py-3 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 text-center rounded-2xl transition-colors uppercase tracking-widest">
                                        Start Assessment
                                    </Link>
                                </div>
                            )
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

                                    {/* Time Window Display */}
                                    {(test.time && test.endTime) && (
                                        <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-100 rounded-xl text-xs font-black text-indigo-700 uppercase tracking-widest">
                                            <HiOutlineClock className="w-4 h-4" />
                                            <span>{test.time} - {test.endTime}</span>
                                        </div>
                                    )}
                                </div>
                                <Link to="/student/test" state={{ testConfig: test }} className="mt-auto apple-btn px-6 py-3 text-sm font-bold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 text-center rounded-2xl transition-colors uppercase tracking-widest">
                                    Start Assessment
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
