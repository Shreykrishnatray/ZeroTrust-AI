import { motion } from 'framer-motion'
import GlassCard from '../components/GlassCard'

const layers = [
  { name: 'Upload', desc: 'User uploads identity document image (ID, passport, etc.).', step: 1 },
  { name: 'Hash & Preprocessing', desc: 'SHA-256 hash for integrity; image normalized for analysis.', step: 2 },
  { name: 'CNN (EfficientNet-B0)', desc: 'Pretrained model classifies document as REAL or FAKE.', step: 3 },
  { name: 'Image Forensics', desc: 'Error Level Analysis, edge consistency, noise inconsistency.', step: 4 },
  { name: 'OCR & Text Anomaly', desc: 'EasyOCR extraction; low confidence or inconsistency → anomaly score.', step: 5 },
  { name: 'Combined Score', desc: 'fraud_score = 0.4×CNN + 0.3×forensics + 0.3×text_anomaly.', step: 6 },
]

export default function Architecture() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto py-12"
    >
      <h1 className="text-3xl font-bold text-slate-100 mb-2">Architecture</h1>
      <p className="text-slate-400 mb-10">How ZeroTrust AI verifies identity documents.</p>

      <div className="space-y-4">
        {layers.map((layer, i) => (
          <GlassCard key={layer.name} delay={i * 0.06}>
            <div className="p-6 flex items-start gap-4">
              <motion.span
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.4, delay: i * 0.06 }}
              >
                {layer.step}
              </motion.span>
              <div>
                <h3 className="text-lg font-semibold text-slate-200">{layer.name}</h3>
                <p className="text-slate-400 text-sm mt-1">{layer.desc}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/5 to-violet-500/5"
      >
        <h3 className="text-lg font-semibold text-slate-200 mb-2">Output</h3>
        <p className="text-slate-400 text-sm">
          The API returns <strong className="text-slate-300">status</strong> (clean / suspicious / fraudulent),
          <strong className="text-slate-300"> fraud_score</strong> (0–1), <strong className="text-slate-300">document_hash</strong>,{' '}
          <strong className="text-slate-300">analysis_breakdown</strong>, and <strong className="text-slate-300">extracted_text</strong>.
        </p>
      </motion.div>
    </motion.div>
  )
}
