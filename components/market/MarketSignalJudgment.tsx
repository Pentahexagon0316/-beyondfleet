'use client'

import { useEffect, useState } from 'react'

type Judgment = 'worth-watching' | 'probably-noise' | 'temporary' | 'structural' | 'not-sure'

const options: Array<{ value: Judgment; label: string }> = [
  { value: 'worth-watching', label: 'Worth watching' },
  { value: 'probably-noise', label: 'Probably noise' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'structural', label: 'Structural' },
  { value: 'not-sure', label: 'Not sure' },
]

const STORAGE_KEY = 'beyondfleet:ambient-market-judgment:v1'

export default function MarketSignalJudgment({ signalId }: { signalId: string }) {
  const [selected, setSelected] = useState<Judgment | null>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      const parsed = saved ? JSON.parse(saved) as Record<string, Judgment> : {}
      setSelected(parsed[signalId] || null)
    } catch {
      setSelected(null)
    }
  }, [signalId])

  function choose(value: Judgment) {
    setSelected(value)

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      const parsed = saved ? JSON.parse(saved) as Record<string, Judgment> : {}
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...parsed,
        [signalId]: value,
      }))
    } catch {
      // Local reflection is optional.
    }
  }

  return (
    <div className="bf-mobile-card rounded-lg border border-white/[0.075] bg-white/[0.026] p-5">
      <p className="text-sm font-semibold text-white">How does this signal feel?</p>
      <p className="mt-2 text-xs leading-5 text-gray-500">
        A quiet marker for your own thinking. No prediction score.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => choose(option.value)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                isSelected
                  ? 'border-cyan-300/40 bg-cyan-300/[0.12] text-cyan-50'
                  : 'border-white/[0.075] bg-black/15 text-gray-400 hover:border-white/18 hover:text-gray-200'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-gray-600">
        {selected ? 'Saved quietly on this device.' : 'You can skip this.'}
      </p>
    </div>
  )
}
