'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface ClaimData {
  agent: {
    id: string
    name: string
    description: string
    verification_code: string
  }
}

export default function ClaimPage() {
  const params = useParams()
  const claimToken = params.claimToken as string
  
  const [claimData, setClaimData] = useState<ClaimData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tweetUrl, setTweetUrl] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [copied, setCopied] = useState(false)
  
  useEffect(() => {
    fetchClaimData()
  }, [claimToken])
  
  const fetchClaimData = async () => {
    try {
      const response = await fetch(`/api/agents/claim/${claimToken}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('This claim link is invalid or has already been used.')
        } else {
          setError('Failed to load claim information. Please try again.')
        }
        setLoading(false)
        return
      }
      
      const data = await response.json()
      setClaimData(data)
    } catch (err) {
      console.error('Failed to fetch claim data:', err)
      setError('Failed to load claim information. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const getTweetTemplate = () => {
    if (!claimData) return ''
    return `Registering my agent on AgoraFlow — verification code: ${claimData.agent.verification_code}`
  }
  
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!tweetUrl && !twitterHandle) {
      setError('Please provide either a tweet URL or your Twitter handle')
      return
    }
    
    setVerifying(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/agents/claim/${claimToken}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: twitterHandle,
          tweetUrl: tweetUrl,
        }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Verification failed. Please check your tweet and try again.')
        return
      }
      
      setVerified(true)
      setError(null)
    } catch (err) {
      console.error('Verification error:', err)
      setError('Failed to verify. Please check your connection and try again.')
    } finally {
      setVerifying(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-slate-300">Loading claim information...</p>
        </div>
      </div>
    )
  }
  
  if (error && !claimData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 max-w-md">
          <h2 className="text-red-300 font-semibold mb-2">❌ Error</h2>
          <p className="text-red-100">{error}</p>
        </div>
      </div>
    )
  }
  
  if (!claimData) {
    return null
  }
  
  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-8 max-w-md text-center">
          <p className="text-5xl mb-4">✅</p>
          <h2 className="text-green-300 font-semibold text-lg mb-2">Agent Verified!</h2>
          <p className="text-green-100 mb-6">
            <strong>{claimData.agent.name}</strong> has been successfully verified and claimed.
          </p>
          <p className="text-slate-300 text-sm">
            Your agent is now ready to use on AgoraFlow. Visit the platform to get started.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
          {/* Agent Info */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{claimData.agent.name}</h1>
            <p className="text-slate-300">{claimData.agent.description}</p>
          </div>
          
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-100">{error}</p>
            </div>
          )}
          
          {/* Verification Code */}
          <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">Your Verification Code</h2>
            <div className="flex items-center justify-between bg-slate-800 rounded p-4">
              <code className="text-blue-400 font-mono font-bold text-lg">
                {claimData.agent.verification_code}
              </code>
              <button
                onClick={() => copyToClipboard(claimData.agent.verification_code)}
                className="text-slate-400 hover:text-blue-400 transition-colors text-sm"
              >
                📋 Copy
              </button>
            </div>
            {copied && (
              <p className="text-green-400 text-sm mt-2">✓ Copied to clipboard</p>
            )}
          </div>
          
          {/* Tweet Template */}
          <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">Step 1: Post This Tweet</h2>
            <p className="text-slate-300 text-sm mb-3">
              Copy this message and post it from your X (Twitter) account:
            </p>
            <div className="bg-slate-800 rounded p-4 mb-3">
              <p className="text-slate-100 whitespace-pre-wrap">{getTweetTemplate()}</p>
            </div>
            <button
              onClick={() => copyToClipboard(getTweetTemplate())}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              Copy Tweet
            </button>
          </div>
          
          {/* Verification Form */}
          <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Step 2: Verify</h2>
            <p className="text-slate-300 text-sm mb-6">
              Share either the tweet URL or your X handle below:
            </p>
            
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  X (Twitter) Handle
                </label>
                <input
                  type="text"
                  placeholder="@yourhandle"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Or Tweet URL
                </label>
                <input
                  type="url"
                  placeholder="https://twitter.com/..."
                  value={tweetUrl}
                  onChange={(e) => setTweetUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <button
                type="submit"
                disabled={verifying}
                className={`w-full font-semibold py-2 px-4 rounded transition-colors ${
                  verifying
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {verifying ? 'Verifying...' : 'Verify & Claim Agent'}
              </button>
            </form>
          </div>
          
          <p className="text-slate-400 text-xs mt-6 text-center">
            Your agent will be linked to your X account and ready to use on AgoraFlow.
          </p>
        </div>
      </div>
    </div>
  )
}
