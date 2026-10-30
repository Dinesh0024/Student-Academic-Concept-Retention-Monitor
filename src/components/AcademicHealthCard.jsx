import { motion } from 'framer-motion';
import { HiOutlineHeart, HiOutlineShieldCheck, HiOutlineSparkles, HiOutlineTrendingUp } from 'react-icons/hi';

export default function AcademicHealthCard({ ahsData }) {
    if (!ahsData) return null;
    const { ahs, tier, breakdown } = ahsData;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6 relative overflow-hidden bg-white border border-border/10 shadow-xl shadow-black/5"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center font-bold">
                        <HiOutlineHeart className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Academic Health Score (AHS)</h3>
                        <p className="text-[11px] text-text-tertiary font-medium">Unified 0–1000 Academic Credit Score</p>
                    </div>
                </div>
                <span
                    className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
                    style={{ backgroundColor: tier.bg, color: tier.color }}
                >
                    {tier.title} Tier
                </span>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-center my-4">
                {/* Score Dial */}
                <div className="flex flex-col items-center justify-center p-4 bg-surface-tertiary/50 rounded-2xl border border-border/5">
                    <div className="relative flex items-center justify-center w-28 h-28">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-gray-200"
                                strokeWidth="3"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                strokeWidth="3.2"
                                strokeDasharray={`${(ahs / 1000) * 100}, 100`}
                                strokeLinecap="round"
                                stroke={tier.color}
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-2xl font-black text-text-primary tracking-tighter">{ahs}</span>
                            <span className="text-[9px] font-bold text-text-tertiary uppercase">/ 1000 AHS</span>
                        </div>
                    </div>
                </div>

                {/* Sub-Metric Breakdowns */}
                <div className="md:col-span-2 space-y-3">
                    <div>
                        <div className="flex justify-between text-xs font-bold text-text-secondary mb-1">
                            <span>Retention Stability</span>
                            <span>{breakdown.retentionStability} / 250</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${(breakdown.retentionStability / 250) * 100}%` }} />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-xs font-bold text-text-secondary mb-1">
                            <span>Assessment Velocity</span>
                            <span>{breakdown.testVelocity} / 250</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${(breakdown.testVelocity / 250) * 100}%` }} />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-xs font-bold text-text-secondary mb-1">
                            <span>Performance Consistency</span>
                            <span>{breakdown.performanceConsistency} / 250</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${(breakdown.performanceConsistency / 250) * 100}%` }} />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-xs font-bold text-text-secondary mb-1">
                            <span>Improvement Trajectory</span>
                            <span>{breakdown.improvementTrajectory} / 250</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${(breakdown.improvementTrajectory / 250) * 100}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
