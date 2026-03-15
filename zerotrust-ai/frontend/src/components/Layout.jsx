import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/upload', label: 'Upload' },
  { to: '/results', label: 'Results' },
  { to: '/architecture', label: 'Architecture' },
]

export default function Layout({ children }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gradient-mesh">
      {/* Subtle animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/5">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <motion.span
              className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent"
              whileHover={{ scale: 1.02 }}
            >
              ZeroTrust AI
            </motion.span>
          </Link>
          <ul className="flex items-center gap-1">
            {navLinks.map(({ to, label }) => {
              const active = location.pathname === to
              return (
                <li key={to}>
                  <Link to={to}>
                    <motion.span
                      className="relative block px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-lg bg-white/5 border border-white/10 -z-[0]"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                      <span className={active ? 'text-cyan-400 relative z-10' : 'text-slate-400 hover:text-slate-200 relative z-10'}>
                        {label}
                      </span>
                    </motion.span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </header>

      <main className="relative pt-20 pb-16 px-4 min-h-screen">
        {children}
      </main>
    </div>
  )
}
