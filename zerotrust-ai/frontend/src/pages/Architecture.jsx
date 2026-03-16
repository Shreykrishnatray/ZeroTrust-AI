import { motion } from 'framer-motion'
import GlassCard from '../components/GlassCard'

const pipelineSteps = [
  {
    label: 'User Upload',
    desc: 'ZeroTrust AI receives an ID image from the browser or an API client.',
    icon: '📤',
  },
  {
    label: 'Computer Vision',
    desc: 'Preprocessing, normalization, and basic checks prepare the image for analysis.',
    icon: '👁️',
  },
  {
    label: 'OCR Analysis',
    desc: 'EasyOCR extracts text to detect anomalies and inconsistencies.',
    icon: '🔎',
  },
  {
    label: 'Deep Learning Model',
    desc: 'EfficientNet-based classifier estimates the probability the document is fake.',
    icon: '🧠',
  },
  {
    label: 'Fraud Score Engine',
    desc: 'Combines CNN, forensics, and text signals into a single fraud score.',
    icon: '📊',
  },
  {
    label: 'Blockchain Hash',
    desc: 'Document hash is ready to be anchored to a ledger for tamper-evidence.',
    icon: '⛓️',
  },
]

export default function Architecture() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto py-12"
    >
      <h1 className="text-3xl font-bold text-slate-100 mb-2">Architecture</h1>
      <p className="text-slate-400 mb-10">
        End-to-end pipeline from user upload to fraud score and tamper-evident hash.
      </p>

      {/* Animated pipeline diagram */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-900/70 p-6 md:p-8 mb-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute -top-32 left-10 w-64 h-64 bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-32 right-10 w-64 h-64 bg-violet-500/10 blur-3xl" />
        </motion.div>

        <div className="relative">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Verification pipeline</p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-4">
            {pipelineSteps.map((step, index) => (
              <div key={step.label} className="flex items-center md:flex-col gap-3 md:gap-2">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, type: 'spring', bounce: 0.35 }}
                  className="relative"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
                    <span className="text-xl">{step.icon}</span>
                  </div>
                  {index < pipelineSteps.length - 1 && (
                    <motion.div
                      className="hidden md:block absolute top-1/2 -right-6 w-12 h-px bg-gradient-to-r from-cyan-400/60 to-violet-400/60"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: index * 0.08 + 0.1, duration: 0.4 }}
                    />
                  )}
                </motion.div>
                <div className="md:text-center">
                  <p className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                    {step.label}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs md:max-w-[10rem]">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Textual breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6" delay={0.05}>
          <h2 className="text-sm font-semibold text-slate-200 mb-2">Signals combined</h2>
          <p className="text-slate-400 text-sm">
            The fraud score engine blends three independent views of the document:
            computer vision for quality and tampering, OCR for textual consistency, and a
            deep learning classifier for authenticity.
          </p>
        </GlassCard>
        <GlassCard className="p-6" delay={0.1}>
          <h2 className="text-sm font-semibold text-slate-200 mb-2">Zero-trust posture</h2>
          <p className="text-slate-400 text-sm">
            Every document is treated as untrusted: no single model decision is enough.
            All layers must agree before a document is considered authentic, and hashes
            enable independent verification over time.
          </p>
        </GlassCard>
      </div>
    </motion.div>
  )
}
