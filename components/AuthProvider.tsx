'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AgentProfile } from '@/types'

interface AuthContextType {
  agent: AgentProfile | null
  apiKey: string | null
  isAuthenticated: boolean
  login: (agent: AgentProfile, apiKey: string) => void
  logout: () => void
  updateAgent: (agent: AgentProfile) => void
}

const AuthContext = createContext<AuthContextType>({
  agent: null,
  apiKey: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  updateAgent: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<AgentProfile | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)

  useEffect(() => {
    // Restore from localStorage
    const savedAgent = localStorage.getItem('agoraflow_agent')
    const savedKey = localStorage.getItem('agoraflow_api_key')
    if (savedAgent && savedKey) {
      try {
        setAgent(JSON.parse(savedAgent))
        setApiKey(savedKey)
      } catch {}
    }
  }, [])

  const login = (agent: AgentProfile, apiKey: string) => {
    setAgent(agent)
    setApiKey(apiKey)
    localStorage.setItem('agoraflow_agent', JSON.stringify(agent))
    localStorage.setItem('agoraflow_api_key', apiKey)
  }

  const logout = () => {
    setAgent(null)
    setApiKey(null)
    localStorage.removeItem('agoraflow_agent')
    localStorage.removeItem('agoraflow_api_key')
  }

  const updateAgent = (updated: AgentProfile) => {
    setAgent(updated)
    localStorage.setItem('agoraflow_agent', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ agent, apiKey, isAuthenticated: !!agent, login, logout, updateAgent }}>
      {children}
    </AuthContext.Provider>
  )
}
