import { useEffect, useState } from 'react'
import type { Transaction } from '../lib/types'
import * as api from '../lib/api'

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    load()
  }, [dateFrom, dateTo])

  const load = async () => {
    setLoading(true)
    const data = await api.getTransactions(dateFrom, dateTo)
    setTransactions(data)
    setLoading(false)
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const date = tx.transaction_date
    if (!acc[date]) acc[date] = []
    acc[date].push(tx)
    return acc
  }, {})

  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">交易记录</h1>

      {/* Date filters */}
      <div className="flex gap-4 items-center mb-6 bg-white rounded-xl border border-gray-200 px-5 py-4">
        <label className="text-base font-medium text-gray-700">从</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <label className="text-base font-medium text-gray-700">到</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <span className="text-gray-500 text-base ml-2">共 {transactions.length} 笔</span>
      </div>

      {loading ? (
        <div className="text-gray-400 text-lg py-10 text-center">加载中...</div>
      ) : transactions.length === 0 ? (
        <div className="text-gray-400 text-lg py-10 text-center">该时间段内暂无交易记录</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, txs]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-bold text-gray-700">{date}</h3>
                  <span className="text-sm text-gray-400">{txs.length} 笔交易</span>
                </div>
                <div className="space-y-2">
                  {txs.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      expanded={expanded.has(tx.id)}
                      onToggle={() => toggleExpand(tx.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function TransactionRow({
  tx,
  expanded,
  onToggle,
}: {
  tx: Transaction
  expanded: boolean
  onToggle: () => void
}) {
  const isIn = tx.type === 'in'
  const total = tx.items?.reduce((s, i) => s + i.subtotal, 0) ?? 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
      >
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
            isIn ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}
        >
          {isIn ? '📥 入库' : '📤 出库'}
        </span>

        {tx.customer && (
          <span className="text-base text-gray-700 font-medium">{tx.customer.name}</span>
        )}

        <span className="text-base text-gray-500 flex-1">
          {tx.items?.length ?? 0} 种商品
        </span>

        <span className="text-lg font-bold text-gray-900">¥{total.toFixed(2)}</span>

        <span className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && tx.items && tx.items.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 space-y-2">
          {tx.notes && (
            <p className="text-sm text-gray-500 mb-3">备注：{tx.notes}</p>
          )}
          {tx.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-base">
              <span className="text-gray-900 font-medium">
                {item.product?.name}
                <span className="text-gray-400 text-sm ml-1">/{item.product?.unit}</span>
              </span>
              <div className="flex items-center gap-4 text-gray-600">
                <span>{item.quantity} × ¥{item.unit_price}</span>
                <span className="font-bold text-gray-900 w-20 text-right">
                  ¥{item.subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-2 border-t border-gray-200">
            <span className="text-lg font-bold text-gray-900">合计 ¥{total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
