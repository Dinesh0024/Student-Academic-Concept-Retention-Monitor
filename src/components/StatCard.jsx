import { motion } from 'framer-motion';

export default function StatCard({ title, value, icon: Icon, trend, index = 0, className }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={`premium-card p-6 bg-white dark:bg-[#13111C]/80 dark:backdrop-blur-2xl border border-transparent dark:border-white/5 flex flex-col gap-4 ${className || ''}`}
        >
            <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-[var(--color-accent)] border border-gray-100 dark:border-white/10 shadow-inner">
                    <Icon className="w-6 h-6" />
                </div>
                {trend !== undefined && (
                    <div className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-tight ${trend >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </div>
                )}
            </div>

            <div>
                <p className="text-sm font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</h3>
            </div>
        </motion.div>
    );
}
