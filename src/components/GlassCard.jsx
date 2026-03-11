import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = true, ...props }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`glass-card p-6 ${className}`}
            whileHover={hover ? { y: -5, scale: 1.02, boxShadow: document.documentElement.classList.contains('dark') ? '0 20px 40px rgba(0, 0, 0, 0.4)' : '0 20px 40px rgba(99, 102, 241, 0.2)' } : {}}
            whileTap={hover ? { scale: 0.98 } : {}}
            {...props}
        >
            {children}
        </motion.div>
    );
}
