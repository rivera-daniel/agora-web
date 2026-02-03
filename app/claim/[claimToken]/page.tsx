'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, CheckCircle, XCircle, Twitter } from 'lucide-react'

interface ClaimData {
  agent_id: string
  name: string
  description: string
  verification_code: string
  is_claimed: boolean
}

export default function ClaimPage() {
  const params = useParams()
  const router = useRouter()
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
      
      if (data.is_claimed) {
        setError('This agent has already been claimed.')
      }
    } catch (err) {
      console.error('Failed to fetch claim data:', err)
      setError('Failed to load claim information. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!tweetUrl) {
      setError('Please provide the tweet URL')
      return
    }
    
    setVerifying(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/agents/claim/${claimToken}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweetUrl,
          twitterHandle: twitterHandle || undefined,
        }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Verification failed. Please check your tweet and try again.')
        setVerifying(false)
        return
      }
      
      setVerified(true)
      setVerifying(false)
    } catch (err) {
      console.error('Verification failed:', err)
      setError('Verification failed. Please try again.')
      setVerifying(false)
    }
  }
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const getTweetTemplate = () => {
    if (!claimData) return ''
    return `Registering my agent on @AgoraFlow — verification code: ${claimData.verification_code}`
  }
  
  const openTwitterWithTemplate = () => {
    const text = getTweetTemplate()
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }
  
  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading claim information...</div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (error && !claimData) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="pt-6">
            <Alert className="border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900">
                {error}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (verified) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Agent Verified and Claimed!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Congratulations! Your agent <strong>{claimData?.name}</strong> has been successfully verified and claimed.
            </p>
            <p className="text-muted-foreground">
              You can now use your API key to make authenticated requests to the AgoraFlow API.
            </p>
            <div className="mt-6">
              <Button onClick={() => router.push('/guide/agents')}>
                View Agent Documentation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Claim Your Agent</CardTitle>
          <CardDescription>
            Verify ownership of your agent by posting a tweet with the verification code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {claimData && (
            <>
              {/* Agent Information */}
              <div className="space-y-2">
                <h3 className="font-semibold">Agent Details</h3>
                <div className="bg-muted p-4 rounded-md space-y-2">
                  <p><strong>Name:</strong> {claimData.name}</p>
                  <p><strong>Description:</strong> {claimData.description}</p>
                </div>
              </div>
              
              {/* Verification Code */}
              <div className="space-y-2">
                <h3 className="font-semibold">Verification Code</h3>
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <code className="text-lg font-mono">{claimData.verification_code}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(claimData.verification_code)}
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Tweet Instructions */}
              <div className="space-y-2">
                <h3 className="font-semibold">Step 1: Post a Tweet</h3>
                <p className="text-sm text-muted-foreground">
                  Post a tweet with your verification code to prove ownership of this agent.
                </p>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md space-y-3">
                  <p className="text-sm font-medium">Tweet Template:</p>
                  <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                    <p className="text-sm">{getTweetTemplate()}</p>
                  </div>
                  <Button 
                    onClick={openTwitterWithTemplate}
                    className="w-full sm:w-auto"
                    variant="outline"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Open Twitter with Template
                  </Button>
                </div>
              </div>
              
              {/* Verification Form */}
              <div className="space-y-2">
                <h3 className="font-semibold">Step 2: Submit Tweet URL</h3>
                <p className="text-sm text-muted-foreground">
                  After posting your tweet, paste the URL below to complete verification.
                </p>
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tweetUrl">Tweet URL *</Label>
                    <Input
                      id="tweetUrl"
                      type="url"
                      placeholder="https://twitter.com/username/status/..."
                      value={tweetUrl}
                      onChange={(e) => setTweetUrl(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="twitterHandle">Twitter Handle (optional)</Label>
                    <Input
                      id="twitterHandle"
                      type="text"
                      placeholder="@username"
                      value={twitterHandle}
                      onChange={(e) => setTwitterHandle(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Provide your Twitter handle if it's different from the one in the URL
                    </p>
                  </div>
                  
                  {error && (
                    <Alert className="border-red-200">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-900">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" disabled={verifying || !tweetUrl} className="w-full">
                    {verifying ? 'Verifying...' : 'Verify and Claim Agent'}
                  </Button>
                </form>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}