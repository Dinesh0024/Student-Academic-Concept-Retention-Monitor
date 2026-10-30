import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineLightningBolt, HiOutlineX } from 'react-icons/hi';

export default function ShadowGradingModal({ isOpen, onClose, shadowData = [] }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-surface rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-border/10"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border/10 flex justify-between items-center bg-surface-tertiary/40">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-600/20">
                                👻
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-text-primary leading-tight">Shadow Grading — AI Parallel Evaluation</h3>
                                <p className="text-xs text-text-tertiary font-medium">Side-by-side reasoning comparison & divergence point detector</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary transition-all">
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content List */}
                    <div className="p-6 overflow-y-auto space-y-4 flex-1">
                        {shadowData.map((item) => (
                            <div key={item.questionIndex} className={`p-4 rounded-2xl border ${item.isCorrect ? 'bg-emerald-50/20 border-emerald-200' : 'bg-red-50/20 border-red-200'} transition-all`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-black text-xs text-text-primary uppercase tracking-wider">Question #{item.questionIndex}</span>
                                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${item.isCorrect ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                                        {item.isCorrect ? 'Matched AI Model' : 'Divergent Logic'}
                                    </span>
                                </div>

                                <p className="text-xs font-semibold text-text-primary mb-3">{item.questionText}</p>

                                <div className="grid md:grid-cols-2 gap-3 text-xs mb-3">
                                    <div className="p-3 rounded-xl bg-white border border-border/5">
                                        <span className="text-[9px] font-bold text-text-tertiary uppercase block mb-1">Your Submission</span>
                                        <div className="flex items-center gap-2 font-bold text-text-primary">
                                            {item.isCorrect ? <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500" /> : <HiOutlineXCircle className="w-4 h-4 text-red-500" />}
                                            <span>{item.userAnswer}</span>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-white border border-border/5">
                                        <span className="text-[9px] font-bold text-text-tertiary uppercase block mb-1">AI Golden Solution ({item.aiConfidence})</span>
                                        <div className="flex items-center gap-2 font-bold text-indigo-600">
                                            <HiOutlineCheckCircle className="w-4 h-4 text-indigo-500" />
                                            <span>{item.aiGoldenAnswer}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-white/80 rounded-xl border border-border/5 flex items-start gap-2.5 text-xs text-text-secondary">
                                    <HiOutlineLightningBolt className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold text-text-primary block">Reasoning Divergence Point:</span>
                                        <span>{item.divergenceStep}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border/10 bg-surface-tertiary/40 flex justify-end">
                        <button onClick={onClose} className="apple-btn apple-btn-primary !py-2.5 !px-6 !text-xs">
                            Done Reviewing
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
