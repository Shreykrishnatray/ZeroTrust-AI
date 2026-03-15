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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto py-12"
    >
      <h1 className="text-3xl font-bold text-slate-100 mb-2">Verification Result</h1>
      <p className="text-slate-400 mb-8">Analysis result for your submitted document.</p>

      {/* Fraud score & Authenticity */}
      <GlassCard className="p-8 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Fraud score</p>
            <p className="text-3xl font-bold text-slate-100">{fraudScore.toFixed(2)}</p>
            <div className="w-full max-w-[200px] h-2 mt-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${fraudScore >= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(fraudScore * 100, 100)}%` }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Authenticity result</p>
            <motion.p
              className={`text-3xl font-bold ${authenticityColor}`}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.3 }}
            >
              {authenticityDisplay}
            </motion.p>
          </div>
        </div>
      </GlassCard>

      {/* Document hash */}
      <GlassCard className="p-6 mb-6" delay={0.05}>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Document hash</h2>
        <p className="text-slate-400 font-mono text-sm break-all">
          {result.document_hash || '—'}
        </p>
      </GlassCard>

      {/* Analysis breakdown */}
      <GlassCard className="p-6 mb-6" delay={0.1}>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Analysis breakdown</h2>
        {breakdown.length > 0 ? (
          <ul className="space-y-2">
            {breakdown.map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex justify-between items-center py-2 border-b border-white/5 last:border-0"
              >
                <span className="text-slate-300">{item.check ?? item.name ?? 'Check'}</span>
                <span className="text-slate-400 text-sm">
                  {item.result ?? (item.confidence != null ? `confidence ${item.confidence}` : '—')}
                </span>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-sm">No breakdown available.</p>
        )}
      </GlassCard>

      {/* Extracted text */}
      <GlassCard className="p-6 mb-8" delay={0.15}>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Extracted text</h2>
        {extractedText ? (
          <p className="text-slate-400 text-sm whitespace-pre-wrap font-mono">{extractedText}</p>
        ) : (
          <p className="text-slate-500 text-sm italic">No text extracted from this document.</p>
        )}
      </GlassCard>

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
