import { motion } from 'framer-motion';
import { HiOutlineEyeOff, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiArrowRight } from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function BlindSpotDetector({ blindSpotData }) {
    if (!blindSpotData) return null;
    const { coveragePercentage, totalUntestedCount, blindSpots = [] } = blindSpotData;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6 bg-white border border-border/10 shadow-xl shadow-black/5"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                        <HiOutlineEyeOff className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Faculty Blind Spot Detector</h3>
                        <p className="text-[11px] text-text-tertiary font-medium">Auto-scans un-assessed curriculum concepts</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-text-primary">{coveragePercentage}% Covered</span>
                    <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${coveragePercentage}%` }} />
                    </div>
                </div>
            </div>

            {totalUntestedCount > 0 ? (
                <div className="space-y-3">
                    <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center gap-3 text-xs text-amber-700 font-medium">
                        <HiOutlineExclamationCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                        <span>Found <strong>{totalUntestedCount} concepts</strong> with zero assessment data across all subjects.</span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {blindSpots.slice(0, 5).map((concept) => (
                            <div key={concept.id} className="p-2.5 bg-surface-tertiary/50 border border-border/5 rounded-xl flex justify-between items-center text-xs">
                                <div>
                                    <span className="font-bold text-text-primary block">{concept.name}</span>
                                    <span className="text-[10px] text-text-tertiary font-medium">{concept.description}</span>
                                </div>
                                <Link
                                    to={`/faculty/questions?conceptId=${concept.id}`}
                                    className="px-2.5 py-1 rounded-lg bg-accent text-white text-[10px] font-bold flex items-center gap-1 hover:opacity-90 transition-opacity"
                                >
                                    Generate Test
                                    <HiArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-xs text-emerald-700 font-bold">
                    <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Zero Blind Spots! All curriculum concepts have active assessment metrics.</span>
                </div>
            )}
        </motion.div>
    );
}
