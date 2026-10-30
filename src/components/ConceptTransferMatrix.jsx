import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineShare, HiArrowRight, HiOutlineX, HiOutlinePlay } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

export default function ConceptTransferMatrix({ transfers = [], onSelectBridge }) {
    const navigate = useNavigate();
    const [selectedItem, setSelectedItem] = useState(null);

    const handleLaunchTest = (bridge) => {
        setSelectedItem(null);
        navigate('/student/test', {
            state: {
                testConfig: {
                    id: `bridge-${bridge.id}`,
                    name: `Concept Bridge: ${bridge.sourceConcept} ➔ ${bridge.targetConcept}`,
                    subject: bridge.targetSubject,
                    duration: 10,
                    numQuestions: 5,
                    isLive: true
                }
            }
        });
    };

    if (!transfers || transfers.length === 0) {
        return (
            <div className="premium-card p-8 bg-surface dark:bg-surface-secondary border border-border/10 text-center">
                <p className="text-sm font-bold text-text-secondary">No concept transfer bridges found for the selected filter.</p>
                <p className="text-xs text-text-tertiary mt-1">Switch to "Global" or clear search to view all cross-subject intelligence links.</p>
            </div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-card p-6 bg-surface dark:bg-surface-secondary border border-border/10 shadow-xl shadow-black/5"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                            <HiOutlineShare className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Concept Transfer Engine (Cross-Subject Intelligence)</h3>
                            <p className="text-[11px] text-text-tertiary font-medium">Click any bridge card below to launch interactive practice or filter concepts</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">
                        {transfers.length} Active Bridges
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {transfers.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="p-4 bg-surface-tertiary/50 dark:bg-surface-tertiary/20 border border-border/10 rounded-2xl flex flex-col justify-between group hover:shadow-lg hover:border-emerald-500/50 cursor-pointer transition-all"
                        >
                            <div className="mb-3">
                                <div className="flex items-center justify-between text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{item.sourceSubject}</span>
                                    <HiArrowRight className="w-3 h-3 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                                    <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{item.targetSubject}</span>
                                </div>

                                <div className="p-3 bg-surface dark:bg-surface-secondary rounded-xl border border-border/10 space-y-1.5 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="font-bold text-xs text-text-primary">{item.sourceConcept}</span>
                                    </div>
                                    <div className="flex items-center gap-2 pl-4 text-xs font-semibold text-text-secondary">
                                        <HiArrowRight className="w-3 h-3 text-text-tertiary" />
                                        <span>Boosts: <strong className="text-text-primary">{item.targetConcept}</strong></span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs border-t border-border/10 pt-2.5 mt-1">
                                <span className="font-black text-emerald-600 dark:text-emerald-400">{item.impact}</span>
                                <span className="text-[10px] font-bold bg-surface dark:bg-surface-secondary px-2.5 py-0.5 rounded-full border border-border/10 text-text-secondary shadow-2xs">
                                    {item.transferCorrelation}% Match • Inspect ➔
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Interactive Bridge Inspection Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-surface dark:bg-surface-secondary rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-border/10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                                        🔗
                                    </div>
                                    <h3 className="font-black text-base text-text-primary uppercase tracking-wide">Knowledge Bridge Diagnostic</h3>
                                </div>
                                <button onClick={() => setSelectedItem(null)} className="p-2 rounded-full hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary transition-all">
                                    <HiOutlineX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                    <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest block mb-1">Transfer Correlation</span>
                                    <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400">{selectedItem.impact}</h4>
                                    <p className="text-xs text-text-secondary font-medium mt-1">
                                        Data shows students who master <strong>{selectedItem.sourceConcept}</strong> ({selectedItem.sourceSubject}) absorb <strong>{selectedItem.targetConcept}</strong> ({selectedItem.targetSubject}) with <strong>{selectedItem.transferCorrelation}% higher retention</strong>.
                                    </p>
                                </div>

                                <div className="space-y-2 text-xs">
                                    <div className="p-3 bg-surface-tertiary/50 rounded-xl flex justify-between items-center">
                                        <span className="font-medium text-text-tertiary">Prerequisite Domain:</span>
                                        <span className="font-bold text-text-primary">{selectedItem.sourceSubject}</span>
                                    </div>
                                    <div className="p-3 bg-surface-tertiary/50 rounded-xl flex justify-between items-center">
                                        <span className="font-medium text-text-tertiary">Target Application:</span>
                                        <span className="font-bold text-text-primary">{selectedItem.targetSubject}</span>
                                    </div>
                                    <div className="p-3 bg-surface-tertiary/50 rounded-xl flex justify-between items-center">
                                        <span className="font-medium text-text-tertiary">Bridge Status:</span>
                                        <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{selectedItem.status}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => {
                                        if (onSelectBridge) onSelectBridge(selectedItem);
                                        setSelectedItem(null);
                                    }}
                                    className="flex-1 py-3 px-4 rounded-xl border border-border/10 text-text-secondary hover:text-text-primary font-bold text-xs hover:bg-surface-tertiary transition-colors"
                                >
                                    Filter Concept Cards
                                </button>
                                <button
                                    onClick={() => handleLaunchTest(selectedItem)}
                                    className="flex-1 apple-btn apple-btn-primary !py-3 !px-4 !text-xs !font-black flex items-center justify-center gap-2"
                                >
                                    <HiOutlinePlay className="w-4 h-4" />
                                    Launch Practice Test
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
