import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

export default function ThemeToggle({ className = "" }) {
    const { dark, toggle } = useTheme();

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggle}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-[var(--color-surface)] shadow-lg border border-[var(--color-border)] text-[var(--color-text-primary)] transition-all ${className}`}
            title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {dark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
        </motion.button>
    );
}
