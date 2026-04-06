import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineChatAlt2, HiOutlineUserCircle, HiOutlineClock, HiOutlineChevronRight } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import GlassCard from '../components/GlassCard';
import mockDb from '../utils/mockDb';

export default function StudentFeedback() {
    const { user } = useAuth();
    const [feedbackResults, setFeedbackResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeedback = async () => {
            if (user) {
                try {
                    // Mark feedback as read when student visits the page
                    await mockDb.markFeedbackAsRead(user.email);
                    
                    const results = await mockDb.getResultsByStudent(user.email);
                    // Filter for only results that have teacher feedback
                    const filtered = results.filter(r => r.teacherFeedback);
                    setFeedbackResults(filtered);
                } catch (err) {
                    console.error("Failed to fetch feedback:", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchFeedback();
    }, [user]);

    if (loading) return <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Faculty Insights...</div>;

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto px-6 py-12">
                <header className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest mb-4">
                        <HiOutlineChatAlt2 className="w-3 h-3" />
                        Academic Mentorship
                    </div>
                    <h1 className="text-5xl font-black text-text-primary tracking-tight mb-3">Feedback <span className="text-accent italic">Hub</span></h1>
                    <p className="text-lg text-text-secondary font-medium max-w-2xl">
                        A centralized repository of personalized assessments and direct insights from your faculty members.
                    </p>
                </header>

                <div className="space-y-8">
                    {feedbackResults.length === 0 ? (
                        <GlassCard className="p-20 text-center border-dashed border-2 border-border/20">
                            <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                                <HiOutlineUserCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-2">No feedback received yet</h3>
                            <p className="text-sm text-text-tertiary max-w-sm mx-auto">
                                Once your faculty reviews your assessments, their personalized insights and improvement strategies will appear here.
                            </p>
                        </GlassCard>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            <AnimatePresence mode="popLayout">
                                {feedbackResults.map((r, idx) => (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <GlassCard className="group overflow-hidden border border-border/5 hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/5 transition-all duration-500">
                                            <div className="flex flex-col md:flex-row">
                                                {/* Left Panel: Context */}
                                                <div className="w-full md:w-64 p-8 bg-surface-secondary/30 border-r border-border/5 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-6">
                                                            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-xl border border-accent/10 shadow-sm">
                                                                👨‍🏫
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-text-primary text-sm tracking-tight">{r.facultyName || 'Faculty Member'}</h4>
                                                                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Professor</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <p className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.2em] mb-1">Assessment</p>
                                                                <h5 className="font-bold text-text-primary text-xs leading-tight">{r.testName}</h5>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.2em] mb-1">Date</p>
                                                                <div className="flex items-center gap-1 text-text-secondary text-xs font-medium">
                                                                    <HiOutlineClock className="w-3 h-3 text-accent" />
                                                                    {new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-8 pt-6 border-t border-border/5">
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <p className="text-[9px] font-black text-accent uppercase tracking-widest leading-none mb-1">Performance</p>
                                                                <span className="text-3xl font-black text-text-primary tracking-tighter">{r.score}%</span>
                                                            </div>
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.score >= 80 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                                <HiOutlineChevronRight className="w-5 h-5" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Panel: The Feedback */}
                                                <div className="flex-1 p-8 bg-surface/40 relative">
                                                    <div className="absolute top-8 right-8 opacity-10">
                                                        <HiOutlineChatAlt2 className="w-16 h-16 text-accent" />
                                                    </div>
                                                    
                                                    <div className="relative z-10">
                                                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.3em] mb-6 border-b border-border/5 pb-2 inline-block">Mentorship Note</p>
                                                        <blockquote className="text-lg font-medium text-text-primary leading-relaxed italic mb-8">
                                                            "{r.teacherFeedback}"
                                                        </blockquote>
                                                        
                                                        {r.aiSolutions && (
                                                            <div className="p-5 rounded-2xl bg-accent/5 border border-accent/10">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                                                                    <p className="text-[10px] font-black text-accent uppercase tracking-widest">Growth Recommendation</p>
                                                                </div>
                                                                <p className="text-xs font-bold text-text-primary/80 leading-relaxed capitalize">
                                                                    {r.aiSolutions}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
}
