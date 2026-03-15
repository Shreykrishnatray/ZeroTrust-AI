import { motion } from 'framer-motion'

export default function GlassCard({ children, className = '', hover = true, delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`glass-card ${hover ? 'glass-card-hover transition-all duration-300' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
