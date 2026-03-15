import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import GlassCard from '../components/GlassCard'

export default function Landing() {
  return (
    <div className="max-w-6xl mx-auto">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-16 pb-24 text-center"
      >
        <motion.p
          className="text-cyan-400 font-medium tracking-wider uppercase text-sm mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Identity Document Fraud Detection
        </motion.p>
        <motion.h1
          className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-100 via-cyan-200 to-violet-300 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          ZeroTrust AI
        </motion.h1>
        <motion.p
          className="text-slate-400 text-lg max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Detect forged and manipulated identity documents with AI-powered analysis:
          deep learning, image forensics, and OCR-based checks in one pipeline.
        </motion.p>
        <motion.div
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link to="/upload">
            <motion.span
              className="inline-block px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400/50 hover:from-cyan-500/30 hover:to-violet-500/30 transition-all"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Verify a Document
            </motion.span>
          </Link>
          <Link to="/architecture">
            <motion.span
              className="inline-block px-8 py-4 rounded-xl font-semibold border border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5 transition-all"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              How It Works
            </motion.span>
          </Link>
        </motion.div>
      </motion.section>

      <section className="grid md:grid-cols-3 gap-6 py-12">
        {[
          { title: 'CNN Classification', desc: 'EfficientNet-B0 trained to classify documents as real or fake.', icon: '🔬', delay: 0.1 },
          { title: 'Image Forensics', desc: 'ELA, edge consistency, and noise analysis to spot manipulation.', icon: '🖼️', delay: 0.2 },
          { title: 'OCR & Text', desc: 'Extract text and flag anomalies for consistency and tampering.', icon: '📄', delay: 0.3 },
        ].map(({ title, desc, icon, delay }) => (
          <Link key={title} to="/architecture">
            <GlassCard delay={delay} className="p-6 h-full block">
              <span className="text-3xl mb-3 block">{icon}</span>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
              <p className="text-slate-400 text-sm">{desc}</p>
            </GlassCard>
          </Link>
        ))}
      </section>
    </div>
  )
}
