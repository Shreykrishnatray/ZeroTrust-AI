import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { verifyDocument } from '../lib/api'
import GlassCard from '../components/GlassCard'

const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function readFileAsPreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function isValidImageFile(file) {
  return file && file.type && ACCEPT_TYPES.includes(file.type)
}

export default function Upload() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const navigate = useNavigate()

  const setFileAndPreview = useCallback(async (newFile) => {
    setError(null)
    if (!newFile) {
      setFile(null)
      setPreview(null)
      return
    }
    if (!isValidImageFile(newFile)) {
      setError('Please use an image file (JPEG, PNG, WebP, or GIF).')
      return
    }
    setFile(newFile)
    try {
      const dataUrl = await readFileAsPreview(newFile)
      setPreview(dataUrl)
    } catch {
      setError('Could not preview this file.')
    }
  }, [])

  const onFileInputChange = (e) => {
    const f = e.target.files?.[0]
    setFileAndPreview(f || null)
  }

  const onDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const onDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const f = e.dataTransfer?.files?.[0]
    setFileAndPreview(f || null)
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setError(null)
    setUploadProgress(0)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a document image first.')
      return
    }
    setLoading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const { data } = await verifyDocument(file, (ev) => {
        const percent = ev.total ? Math.round((ev.loaded / ev.total) * 100) : 0
        setUploadProgress(percent)
      })
      navigate('/results', { state: { result: data } })
    } catch (err) {
      setError(err.userMessage ?? err.message ?? 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto py-12"
    >
      <h1 className="text-3xl font-bold text-slate-100 mb-2">Verify Document</h1>
      <p className="text-slate-400 mb-8">Upload an identity document image for fraud analysis.</p>

      <GlassCard className="p-8">
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Document image</label>
            <motion.div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                isDragging
                  ? 'border-cyan-400/60 bg-cyan-500/10'
                  : 'border-white/10 hover:border-cyan-500/30'
              }`}
              whileHover={!preview ? { scale: 1.01 } : {}}
            >
              <input
                type="file"
                accept={ACCEPT_TYPES.join(',')}
                onChange={onFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={loading}
              />
              <AnimatePresence mode="wait">
                {preview ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-3"
                  >
                    <img
                      src={preview}
                      alt="Document preview"
                      className="max-h-56 mx-auto rounded-lg object-contain shadow-lg"
                    />
                    <p className="text-sm text-slate-400 truncate max-w-full px-2">{file?.name}</p>
                    {!loading && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); clearFile(); }}
                        className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
                      >
                        Remove and choose another
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-4"
                  >
                    <p className="text-slate-500">
                      {isDragging ? 'Drop the image here' : 'Drag and drop an image here or click to browse'}
                    </p>
                    <p className="text-slate-600 text-xs mt-2">JPEG, PNG, WebP, or GIF</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Uploading & analyzing…</span>
                      <span className="text-cyan-400 font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* AI analysis steps animation */}
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                      AI analysis steps
                    </p>
                    <ol className="space-y-1 text-xs">
                      {[
                        'Analyzing document…',
                        'Running OCR…',
                        'Checking image manipulation…',
                        'Running AI fraud detection…',
                        'Generating document hash…',
                      ].map((label, index) => {
                        const normalized = uploadProgress / 100
                        const stepThreshold = (index + 1) / 5
                        const isActive = normalized >= index / 5
                        const isCompleted = normalized >= stepThreshold
                        return (
                          <motion.li
                            key={label}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: isActive ? 1 : 0.4, x: 0 }}
                            transition={{ delay: 0.05 * index }}
                            className="flex items-center gap-2"
                          >
                            <span
                              className={`inline-flex h-2 w-2 rounded-full ${
                                isCompleted
                                  ? 'bg-cyan-400'
                                  : isActive
                                    ? 'bg-cyan-400/60'
                                    : 'bg-slate-600'
                              }`}
                            />
                            <span
                              className={
                                isCompleted
                                  ? 'text-slate-300'
                                  : isActive
                                    ? 'text-slate-400'
                                    : 'text-slate-500'
                              }
                            >
                              {label}
                            </span>
                          </motion.li>
                        )
                      })}
                    </ol>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-400 text-sm"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={!file || loading}
            className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-500/30 hover:to-violet-500/30 transition-all"
            whileHover={!loading && file ? { scale: 1.01 } : {}}
            whileTap={!loading && file ? { scale: 0.99 } : {}}
          >
            {loading ? 'Analyzing…' : 'Verify Document'}
          </motion.button>
        </form>
      </GlassCard>
    </motion.div>
  )
}
