import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineAcademicCap, HiOutlineUserGroup, HiArrowRight, HiOutlineChartBar, HiOutlineSparkles, HiOutlineCheckCircle } from 'react-icons/hi';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { Link } from 'react-router-dom';

export default function Landing() {

    return (
        <PageTransition>
            <div className="min-h-screen bg-[var(--color-surface)] selection:bg-[var(--color-accent)] selection:text-white">
                <Navbar />

                {/* Hero Section */}
                <main className="apple-container pt-32 pb-20">
                    <section className="text-center mb-20 fade-in">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="text-text-primary/60 font-bold text-[10px] uppercase tracking-[0.2em] mb-4 block px-4 py-1.5 rounded-full border border-border/10 bg-surface-tertiary inline-block">Next-Gen Academic Analytics</span>
                            <h1 className="text-title md:text-6xl mb-6 font-black tracking-tighter text-text-primary">
                                Student Academic Concept <br />
                                <span className="text-accent">Retention Monitor</span>
                            </h1>
                            <p className="text-subtitle max-w-2xl mx-auto mb-10 text-text-secondary/80">
                                A premium AI-powered platform bridging the gap between teaching and long-term knowledge retention. Predict outcomes, schedule dynamic assessments, and track individual mastery.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link
                                    to="/student/signup"
                                    className="apple-btn apple-btn-primary px-8 py-3.5 text-base font-black flex items-center gap-2 shadow-xl shadow-black/5"
                                >
                                    Get Started
                                    <HiArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    to="/student/login"
                                    className="apple-btn px-8 py-3.5 text-base font-black bg-surface border border-border text-text-primary hover:bg-surface-secondary"
                                >
                                    Sign In
                                </Link>
                            </div>
                        </motion.div>
                    </section>

                    {/* Features Grid */}
                    <section className="grid md:grid-cols-3 gap-12 max-w-7xl mx-auto mb-32 px-6">
                        {[
                            {
                                icon: HiOutlineSparkles,
                                title: 'AI Question Generation',
                                description: 'Faculty can generate context-aware, topic-specific assessments instantly using Google Gemini AI models.',
                            },
                            {
                                icon: HiOutlineChartBar,
                                title: 'Retention Heatmaps',
                                description: 'Visualize student learning decay over time based on Hermann Ebbinghaus\'s forgetting curve data.',
                            },
                            {
                                icon: HiOutlineCheckCircle,
                                title: 'Automated Testing',
                                description: 'Schedule and deploy tests directly to student dashboards with real-time performance tracking.',
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="premium-card p-8 bg-white border border-gray-100 hover:shadow-xl transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-surface-secondary text-text-primary flex items-center justify-center mb-6 group-hover:bg-text-primary group-hover:text-surface transition-all duration-500">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-text-primary mb-3 tracking-tight">{feature.title}</h3>
                                <p className="text-sm font-medium text-text-secondary leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </section>

                    {/* Dual Intelligence Section */}
                    <section className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto px-6">
                        <div className="premium-card p-12 relative overflow-hidden group hover:shadow-2xl transition-all border border-border/5">
                            <h3 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.3em] mb-6">For Educators</h3>
                            <h2 className="text-3xl font-black text-text-primary mb-6 tracking-tight">Precision Instruction Management</h2>
                            <ul className="space-y-4 text-sm font-medium text-text-secondary mb-10">
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-text-primary"></div>
                                    Monitor overall class health and identify at-risk students
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-text-primary"></div>
                                    Generate tests with tailored difficulty via AI
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-text-primary"></div>
                                    View deep analytics on concept mastery
                                </li>
                            </ul>
                            <div className="flex gap-4">
                                <Link to="/faculty/login" className="px-6 py-3 bg-text-primary text-surface rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity">Access Faculty Portal</Link>
                            </div>
                        </div>

                        <div className="premium-card p-12 relative overflow-hidden group hover:shadow-2xl transition-all border border-border/5">
                            <h3 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.3em] mb-6">For Learners</h3>
                            <h2 className="text-3xl font-black text-text-primary mb-6 tracking-tight">Cognitive Retention Path</h2>
                            <ul className="space-y-4 text-sm font-medium text-text-secondary mb-10">
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-text-primary"></div>
                                    Take assigned tests in a clean, distraction-free interface
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-text-primary"></div>
                                    Track your own performance history across subjects
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-text-primary"></div>
                                    View personalized retention scores to plan study sessions
                                </li>
                            </ul>
                            <div className="flex gap-4">
                                <Link to="/student/signup" className="px-6 py-3 bg-text-primary text-surface rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity">Start Learning</Link>
                            </div>
                        </div>
                    </section>

                    {/* System Snapshot */}
                    <section className="mt-40 max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h3 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.3em] mb-4">Infrastructure Status</h3>
                            <h2 className="text-4xl font-black text-text-primary tracking-tighter">Digital Academic Reservoir</h2>
                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mt-2">Live synchronization with institutional nodes</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Active Candidates', value: '1,240+', trend: '+12%' },
                                { label: 'Knowledge Units', value: '142', trend: 'Stable' },
                                { label: 'Retention Index', value: '78.4%', trend: 'Optimal' },
                                { label: 'System Uptime', value: '99.9%', trend: 'Live' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="premium-card p-10 bg-white text-center border-b-2 border-b-transparent hover:border-b-blue-500 transition-all hover:shadow-2xl hover:shadow-blue-500/5 cursor-default group"
                                >
                                    <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-4 group-hover:text-text-primary transition-colors">{stat.label}</p>
                                    <h4 className="text-5xl font-black text-text-primary mb-3 tracking-tighter">{stat.value}</h4>
                                    <span className="text-[9px] font-black text-text-primary bg-surface-secondary px-3 py-1 rounded-full uppercase tracking-widest border border-border/5">{stat.trend}</span>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Visual Flourish */}
                    <section className="mt-40 text-center pb-20 border-t border-gray-50 pt-20">
                        <div className="flex flex-col items-center gap-10">
                            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Engineered for Scalability</h3>
                            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
                                <span className="text-sm font-black tracking-tighter text-gray-900 italic">React 19.x</span>
                                <span className="text-sm font-black tracking-tighter text-gray-900 italic">PostgreSQL Matrix</span>
                                <span className="text-sm font-black tracking-tighter text-gray-900 italic">AI Cognitive Node</span>
                                <span className="text-sm font-black tracking-tighter text-gray-900 italic">Edge Runtime v5</span>
                                <span className="text-sm font-black tracking-tighter text-gray-900 italic">JWT Protocol</span>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="py-12 border-t border-gray-50 bg-white">
                    <div className="apple-container flex flex-col md:flex-row justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-300">
                        <p>© 2026 StudentRetain. Optimal Instruction Delivery.</p>
                        <div className="flex gap-8 mt-4 md:mt-0">
                            <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
                            <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
                            <a href="#" className="hover:text-gray-900 transition-colors">Documentation</a>
                        </div>
                    </div>
                </footer>
            </div>
        </PageTransition>
    );
}
