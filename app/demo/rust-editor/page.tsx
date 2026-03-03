'use client'

import React, { useState } from 'react'
import { RustEditor } from '@/components/editor'
import { Card } from '@/components/ui'

export default function RustEditorDemo() {
  const [rustCode, setRustCode] = useState('')
  const [anchorCode, setAnchorCode] = useState('')
  const [activeTab, setActiveTab] = useState<'rust' | 'anchor'>('rust')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-400">
            Rust & Anchor Code Editor
          </h1>
          <p className="text-gray-400">
            Write, compile, and execute Rust and Anchor code directly in your browser
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-terminal-border">
          <button
            onClick={() => setActiveTab('rust')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'rust'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Rust
          </button>
          <button
            onClick={() => setActiveTab('anchor')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'anchor'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Anchor
          </button>
        </div>

        {/* Editor */}
        <Card className="p-6 border-2 border-terminal-border bg-slate-900/50">
          {activeTab === 'rust' && (
            <RustEditor
              language="rust"
              value={rustCode}
              onChange={setRustCode}
              height="600px"
              showTemplates={true}
            />
          )}

          {activeTab === 'anchor' && (
            <RustEditor
              language="anchor"
              value={anchorCode}
              onChange={setAnchorCode}
              height="600px"
              showTemplates={true}
            />
          )}
        </Card>

        {/* Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 border border-cyan-500/30 bg-cyan-500/5">
            <h3 className="text-cyan-400 font-semibold mb-2">Features</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>✓ Real Rust compilation</li>
              <li>✓ Anchor program support</li>
              <li>✓ Code templates</li>
              <li>✓ Error highlighting</li>
              <li>✓ Compile time tracking</li>
            </ul>
          </Card>

          <Card className="p-4 border border-magenta-500/30 bg-magenta-500/5">
            <h3 className="text-magenta-400 font-semibold mb-2">How It Works</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>1. Write your code</li>
              <li>2. Click Run to compile</li>
              <li>3. View output & errors</li>
              <li>4. Use templates for quick start</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
