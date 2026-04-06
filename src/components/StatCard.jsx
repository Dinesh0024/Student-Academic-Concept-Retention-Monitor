import { motion } from 'framer-motion';

export default function StatCard({ title, value, icon: Icon, trend, index = 0, className }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={`premium-card p-6 flex flex-col gap-4 group cursor-default ${className || ''}`}
        >
            <div className="flex justify-between items-start">
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300">
                    <Icon className="w-5 h-5" />
                </div>
                {trend !== undefined && (
                    <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-tight ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </div>
                )}
            </div>

            <div>
                <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-extrabold tracking-tight text-text-primary">{value}</h3>
            </div>
        </motion.div>
    );
}
