import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>404</h1>
      <p className="text-lg mb-6" style={{ color: 'var(--text-tertiary)' }}>Page not found</p>
      <Link href="/" className="btn-primary">Back to Home</Link>
    </div>
  )
}
