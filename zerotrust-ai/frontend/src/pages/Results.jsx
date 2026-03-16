import { useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import GlassCard from '../components/GlassCard'

function getAuthenticityDisplay(result) {
  const auth = result.authenticity || result.status
  if (!auth) return '—'
  const u = String(auth).toUpperCase()
  if (u === 'REAL' || u === 'CLEAN') return 'REAL'
  if (u === 'SUSPICIOUS') return 'SUSPICIOUS'
  if (u === 'FAKE' || u === 'FRAUDULENT') return 'FAKE'
  return u
}

function getAuthenticityColor(display) {
  if (display === 'REAL') return 'text-emerald-400'
  if (display === 'SUSPICIOUS') return 'text-amber-400'
  return 'text-red-400'
}

export default function Results() {
  const { state } = useLocation()
  const result = state?.result

  if (!result) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto py-16 text-center"
      >
        <GlassCard className="p-8">
          <p className="text-slate-400 mb-6">No verification result found.</p>
          <Link to="/upload" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Verify a document →
          </Link>
        </GlassCard>
      </motion.div>
    )
  }

  const fraudScore = typeof result.fraud_score === 'number' ? result.fraud_score : 0
  const authenticityDisplay = getAuthenticityDisplay(result)
  const authenticityColor = getAuthenticityColor(authenticityDisplay)
  const breakdown = Array.isArray(result.analysis_breakdown) ? result.analysis_breakdown : []
  const extractedText = result.extracted_text != null ? String(result.extracted_text).trim() : ''

  // Percent view of fraud score
  const fraudPercent = Math.round(Math.min(Math.max(fraudScore, 0), 1) * 100)

  // Try to read structured scores if backend exposes them
  const imageForensicsScore =
    typeof result.image_forensics_score === 'number'
      ? result.image_forensics_score
      : Number(
          breakdown.find((b) => (b.check || b.name) === 'image_forensics_score')?.value ??
            breakdown.find((b) => (b.check || b.name) === 'ocr_extraction')?.confidence ??
            0,
        )

  const ocrAnalysisScore =
    typeof result.text_anomaly_score === 'number'
      ? result.text_anomaly_score
      : Number(
          breakdown.find((b) => (b.check || b.name) === 'ocr_analysis_score')?.value ??
            breakdown.find((b) => (b.check || b.name) === 'ocr_extraction')?.confidence ??
            0,
        )

  const deepLearningScore =
    typeof result.cnn_probability === 'number'
      ? result.cnn_probability
      : Number(
          breakdown.find((b) => (b.check || b.name) === 'deep_learning_score')?.value ??
            fraudScore ??
            0,
        )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto py-12"
    >
      <h1 className="text-3xl font-bold text-slate-100 mb-2">Results Dashboard</h1>
      <p className="text-slate-400 mb-8">Overall fraud risk and multi-layer analysis.</p>

      {/* Top summary: authenticity + fraud meter */}
      <GlassCard className="p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Authenticity status</p>
            <motion.p
              className={`text-3xl md:text-4xl font-bold ${authenticityColor}`}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.3 }}
            >
              {authenticityDisplay === 'REAL'
                ? 'Authentic'
                : authenticityDisplay === 'SUSPICIOUS'
                  ? 'Suspicious Document'
                  : 'Potentially Fraudulent'}
            </motion.p>
            <p className="mt-2 text-slate-400 text-sm">
              Fraud Score:{' '}
              <span className="font-semibold text-slate-100">
                {fraudPercent}
                %
              </span>
            </p>
          </div>
          <div className="w-full md:w-64">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Fraud score meter</p>
            <div className="relative h-3 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-full ${
                  fraudPercent >= 70
                    ? 'bg-red-500'
                    : fraudPercent >= 40
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${fraudPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-slate-500">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard className="p-5 glow-cyan">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Image Forensics Score</p>
          <p className="text-2xl font-semibold text-slate-100">{Math.round(imageForensicsScore * 100)}%</p>
          <p className="text-xs text-slate-500 mt-1">ELA, edges, and noise inconsistency.</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">OCR Analysis Score</p>
          <p className="text-2xl font-semibold text-slate-100">{Math.round(ocrAnalysisScore * 100)}%</p>
          <p className="text-xs text-slate-500 mt-1">Text confidence and anomaly signal.</p>
        </GlassCard>
        <GlassCard className="p-5 glow-violet">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Deep Learning Score</p>
          <p className="text-2xl font-semibold text-slate-100">{Math.round(deepLearningScore * 100)}%</p>
          <p className="text-xs text-slate-500 mt-1">CNN probability of forgery.</p>
        </GlassCard>
      </div>

      {/* Document hash + extracted text below the main dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <GlassCard className="p-6" delay={0.05}>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Document hash</h2>
          <p className="text-slate-400 font-mono text-xs break-all">
            {result.document_hash || '—'}
          </p>
        </GlassCard>
        <GlassCard className="p-6" delay={0.1}>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Extracted text</h2>
          {extractedText ? (
            <p className="text-slate-400 text-xs whitespace-pre-wrap font-mono max-h-40 overflow-auto">
              {extractedText}
            </p>
          ) : (
            <p className="text-slate-500 text-sm italic">No text extracted from this document.</p>
          )}
        </GlassCard>
      </div>

      <div className="text-center">
        <Link to="/upload">
          <motion.span
            className="text-cyan-400 hover:text-cyan-300 font-medium"
            whileHover={{ x: 4 }}
          >
            Verify another document →
          </motion.span>
        </Link>
      </div>
    </motion.div>
  )
}
