import { useState, useRef, useEffect } from 'react'
import type { Customer } from '../../lib/types'

interface Props {
  customers: Customer[]
  value: string
  onChange: (customerId: string) => void
}

export function CustomerSelector({ customers, value, onChange }: Props) {
  const selected = customers.find((c) => c.id === value) ?? null
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [composing, setComposing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = query && !composing
    ? customers.filter((c) => c.name.includes(query) || (c.phone ?? '').includes(query))
    : customers

  const handleSelect = (customer: Customer) => {
    onChange(customer.id)
    setQuery('')
    setOpen(false)
  }

  const handleClear = () => {
    onChange('')
    setQuery('')
    inputRef.current?.focus()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {selected && !open ? (
        // Show selected customer as a tag
        <div className="flex items-center gap-3 border border-orange-300 rounded-xl px-4 py-3 bg-orange-50">
          <span className="text-lg font-bold text-gray-900 flex-1">{selected.name}</span>
          {selected.phone && <span className="text-base text-gray-500">{selected.phone}</span>}
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none ml-1"
            title="更换客户"
          >
            ✕
          </button>
        </div>
      ) : (
        // Search input
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={(e) => {
              setComposing(false)
              setQuery((e.target as HTMLInputElement).value)
            }}
            onFocus={() => setOpen(true)}
            placeholder="输入客户姓名搜索..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {query && (
            <button
              onMouseDown={(e) => { e.preventDefault(); setQuery('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Dropdown results */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
          {/* No customer option */}
          <button
            onMouseDown={() => { onChange(''); setOpen(false); setQuery('') }}
            className="w-full text-left px-4 py-3 text-base text-gray-400 hover:bg-gray-50 border-b border-gray-100"
          >
            不选择客户
          </button>

          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-gray-400 text-base">未找到匹配客户</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onMouseDown={() => handleSelect(c)}
                className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-50 last:border-0"
              >
                <span className="text-base font-bold text-gray-900">{c.name}</span>
                {c.phone && <span className="text-sm text-gray-500 ml-2">{c.phone}</span>}
                {c.notes && <span className="text-sm text-gray-400 ml-2 truncate">{c.notes}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
