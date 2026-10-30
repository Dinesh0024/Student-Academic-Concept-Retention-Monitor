import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineSparkles, HiOutlineClock, HiOutlineExclamationCircle } from 'react-icons/hi';

export default function ConceptDecayRadar({ radarData = [] }) {
    const [activeConcept, setActiveConcept] = useState(null);

    return (
        <div className="premium-card p-6 bg-white border border-border/10 shadow-xl shadow-black/5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                        Concept Decay Radar
                    </h3>
                    <p className="text-[11px] font-medium text-text-tertiary">Live spatial mapping of concept memory retention & half-life</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-accent/10 text-accent uppercase tracking-widest">
                    Spaced Repetition Radar
                </span>
            </div>

            <div className="grid md:grid-cols-12 gap-6 items-center">
                {/* Visual Radar Container */}
                <div className="md:col-span-7 flex justify-center py-4">
                    <div className="relative w-64 h-64 rounded-full border border-gray-200 bg-gradient-to-b from-gray-50 to-white flex items-center justify-center shadow-inner overflow-hidden">
                        {/* Radar Circles */}
                        <div className="absolute w-48 h-48 rounded-full border border-gray-200 border-dashed" />
                        <div className="absolute w-32 h-32 rounded-full border border-gray-200 border-dashed" />
                        <div className="absolute w-16 h-16 rounded-full border border-accent/20 bg-accent/5" />

                        {/* Radar Axis */}
                        <div className="absolute w-full h-[1px] bg-gray-100" />
                        <div className="absolute h-full w-[1px] bg-gray-100" />

                        {/* Center core */}
                        <div className="z-10 w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center text-[8px] font-black shadow-md">
                            M
                        </div>

                        {/* Concept Nodes on Radar */}
                        {radarData.map((node) => {
                            const isHovered = activeConcept?.id === node.id;
                            return (
                                <motion.div
                                    key={node.id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: isHovered ? 1.4 : 1 }}
                                    className="absolute cursor-pointer z-20"
                                    style={{
                                        transform: `translate(${node.x}px, ${node.y}px)`
                                    }}
                                    onMouseEnter={() => setActiveConcept(node)}
                                    onMouseLeave={() => setActiveConcept(null)}
                                >
                                    <div
                                        className="w-3.5 h-3.5 rounded-full ring-4 ring-white shadow-md flex items-center justify-center"
                                        style={{ backgroundColor: node.color }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-75" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Radar Details / Selected Concept Sidebar */}
                <div className="md:col-span-5 bg-surface-tertiary/40 p-4 rounded-2xl border border-border/5">
                    {activeConcept ? (
                        <div className="space-y-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">Selected Concept</span>
                            <h4 className="font-black text-sm text-text-primary">{activeConcept.name}</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white p-2 rounded-xl border border-border/5">
                                    <span className="text-[9px] font-bold text-text-tertiary uppercase block">Current Score</span>
                                    <span className="font-black text-sm" style={{ color: activeConcept.color }}>{activeConcept.score}%</span>
                                </div>
                                <div className="bg-white p-2 rounded-xl border border-border/5">
                                    <span className="text-[9px] font-bold text-text-tertiary uppercase block">Half-Life</span>
                                    <span className="font-black text-sm text-text-primary">{activeConcept.halfLifeDays} Days</span>
                                </div>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-border/5 flex items-center justify-between text-xs">
                                <span className="font-medium text-text-secondary">Decay Status</span>
                                <span className="font-bold px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: `${activeConcept.color}20`, color: activeConcept.color }}>
                                    {activeConcept.status}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Radar Legend</h4>
                            <div className="space-y-1.5 text-xs font-medium text-text-secondary">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <span>Center Core: Freshly Mastered (&gt;80%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                    <span>Mid Ring: Stable Memory (70-80%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    <span>Outer Ring: Decay Impending (&lt;70%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                    <span>Edge: Critical Revision Needed</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-text-tertiary italic mt-3">Hover over any radar dot to inspect its retention half-life.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
