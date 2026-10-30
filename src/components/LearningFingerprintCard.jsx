import { motion } from 'framer-motion';
import { HiOutlineAcademicCap, HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineLightBulb } from 'react-icons/hi';

export default function LearningFingerprintCard({ fingerprint }) {
    if (!fingerprint) return null;

    const { headline, summary, traits, strengths, watchouts, recommendations, averageScore, weakCount } = fingerprint;

    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-8 border-l-4 border-l-violet-500 bg-gradient-to-br from-violet-50/60 via-white to-indigo-50/50"
        >
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                        <HiOutlineAcademicCap className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-600">Student Learning Fingerprint</p>
                        <h3 className="text-2xl font-black text-text-primary mt-1">{headline}</h3>
                    </div>
                </div>
                <div className="px-3 py-2 rounded-full bg-violet-600/10 text-violet-700 text-xs font-black uppercase tracking-[0.2em]">
                    Avg {averageScore}%
                </div>
            </div>

            <p className="text-sm font-medium text-text-secondary leading-relaxed mb-6">{summary}</p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
                {traits.map((trait) => (
                    <div key={trait.label} className="rounded-2xl border border-violet-100 bg-white/80 p-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">{trait.label}</p>
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-violet-700">{trait.level}</span>
                        </div>
                        <p className="text-sm font-bold text-text-primary">{trait.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-white/80 border border-violet-100 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500" />
                        <h4 className="font-black text-text-primary">Strengths</h4>
                    </div>
                    <ul className="space-y-2">
                        {strengths.map((item) => (
                            <li key={item} className="flex gap-2 text-sm text-text-secondary">
                                <span className="mt-1 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="rounded-2xl bg-white/80 border border-violet-100 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <HiOutlineExclamation className="w-5 h-5 text-amber-500" />
                        <h4 className="font-black text-text-primary">Watch-outs</h4>
                    </div>
                    <ul className="space-y-2">
                        {watchouts.map((item) => (
                            <li key={item} className="flex gap-2 text-sm text-text-secondary">
                                <span className="mt-1 w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mt-6 rounded-2xl bg-violet-600/5 border border-violet-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                    <HiOutlineLightBulb className="w-5 h-5 text-violet-600" />
                    <h4 className="font-black text-text-primary">Recommended interventions</h4>
                </div>
                <ul className="space-y-2">
                    {recommendations.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-text-secondary">
                            <span className="mt-1 w-2 h-2 rounded-full bg-violet-600 flex-shrink-0" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
                {weakCount > 0 && (
                    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">
                        {weakCount} weak areas identified for focused revision
                    </p>
                )}
            </div>
        </motion.div>
    );
}
