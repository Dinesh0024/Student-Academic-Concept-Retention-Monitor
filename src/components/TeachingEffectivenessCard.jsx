import { motion } from 'framer-motion';
import { HiOutlineAcademicCap, HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineChartSquareBar } from 'react-icons/hi';

export default function TeachingEffectivenessCard({ effectivenessData }) {
    if (!effectivenessData) return null;
    const { overallScore, gradeTier, conceptMetrics = [] } = effectivenessData;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6 bg-surface dark:bg-surface-secondary border border-border/10 shadow-xl shadow-black/5"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                        <HiOutlineAcademicCap className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Teaching Effectiveness Score (Reverse Analytics)</h3>
                        <p className="text-[11px] text-text-tertiary font-medium">Evaluates course instruction quality per concept topic</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-indigo-600 leading-none">{overallScore}%</span>
                    <span className="block text-[9px] font-bold text-text-tertiary uppercase">{gradeTier}</span>
                </div>
            </div>

            <div className="space-y-3">
                {conceptMetrics.map((item) => (
                    <div key={item.conceptId} className="p-3 bg-surface-tertiary/40 border border-border/5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-text-primary">{item.conceptName}</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                                    {item.health}
                                </span>
                            </div>
                            <span className="text-[10px] text-text-tertiary font-medium">{item.subjectName}</span>
                        </div>

                        <div className="flex items-center gap-6 text-[11px] font-medium text-text-secondary">
                            <div>
                                <span className="text-[9px] font-bold text-text-tertiary uppercase block">Class Pass Rate</span>
                                <span className="font-black text-text-primary">{item.passRate}%</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-text-tertiary uppercase block">Retention Rate</span>
                                <span className="font-black text-text-primary">{item.retentionRate}%</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-text-tertiary uppercase block">Decay Speed</span>
                                <span className="font-bold text-text-primary">{item.decaySpeedDays} Days</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
