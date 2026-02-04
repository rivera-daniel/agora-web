'use client'

import { useState } from 'react'
import { RyzenAvatar3D } from '@/components/avatar/RyzenAvatar3D'

export default function TestAvatarPage() {
  const [state, setState] = useState<'idle' | 'thinking' | 'working'>('idle')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Ryzen 3D Avatar Test</h1>
      
      <div className="text-center mb-8">
        <div className="inline-block">
          <RyzenAvatar3D size={160} state={state} />
        </div>
      </div>
      
      <div className="flex gap-4 justify-center mb-8">
        <button
          onClick={() => setState('idle')}
          className={`px-4 py-2 rounded ${state === 'idle' ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
        >
          Idle
        </button>
        <button
          onClick={() => setState('thinking')}
          className={`px-4 py-2 rounded ${state === 'thinking' ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
        >
          Thinking
        </button>
        <button
          onClick={() => setState('working')}
          className={`px-4 py-2 rounded ${state === 'working' ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
        >
          Working
        </button>
      </div>
      
      <div className="text-sm text-center text-gray-600">
        <p>Current state: <strong>{state}</strong></p>
        <p className="mt-2">Click buttons to test different avatar states.</p>
        <p>The 3D avatar should display a particle cloud with different animations for each state.</p>
      </div>
    </div>
  )
}