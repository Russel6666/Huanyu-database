import { useState, useEffect } from 'react'
import type { TransactionDraftItem } from '../../lib/types'

interface Props {
  item: TransactionDraftItem
  transactionType: 'in' | 'out'
  maxStock?: number
  onChange: (updated: TransactionDraftItem) => void
  onRemove: () => void
}

export function ProductPickerRow({ item, transactionType, maxStock, onChange, onRemove }: Props) {
  const accentColor = transactionType === 'in' ? 'focus:ring-green-400' : 'focus:ring-orange-400'

  // Use local string state so the input can be freely edited (including emptied)
  const [qtyStr, setQtyStr] = useState(item.quantity.toString())
  const [priceStr, setPriceStr] = useState(item.unit_price.toString())

  // Sync inbound changes (e.g. when customer is selected and price is auto-filled)
  useEffect(() => {
    setPriceStr(item.unit_price.toString())
  }, [item.unit_price])

  useEffect(() => {
    setQtyStr(item.quantity.toString())
  }, [item.quantity])

  const handleQtyChange = (val: string) => {
    setQtyStr(val)
    const qty = parseFloat(val)
    if (!isNaN(qty) && qty > 0) {
      onChange({ ...item, quantity: qty })
    }
  }

  const handlePriceChange = (val: string) => {
    setPriceStr(val)
    const price = parseFloat(val)
    if (!isNaN(price) && price >= 0) {
      onChange({ ...item, unit_price: price })
    }
  }

  const adjustQuantity = (delta: number) => {
    const current = parseFloat(qtyStr) || 0
    const newQty = Math.max(0.5, current + delta)
    setQtyStr(newQty.toString())
    onChange({ ...item, quantity: newQty })
  }

  const overStock = transactionType === 'out' && maxStock !== undefined && item.quantity > maxStock

  return (
    <div className={`bg-gray-50 rounded-xl p-4 ${overStock ? 'ring-2 ring-red-400' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-lg font-bold text-gray-900">{item.product_name}</span>
          <span className="text-base text-gray-500 ml-2">/{item.product_unit}</span>
          {maxStock !== undefined && (
            <span className="text-sm text-gray-400 ml-2">（库存：{maxStock}）</span>
          )}
        </div>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 transition-colors text-xl leading-none px-1"
        >
          ✕
        </button>
      </div>

      {overStock && (
        <p className="text-red-600 text-sm mb-2 bg-red-50 px-3 py-1 rounded-lg">
          出库数量超过当前库存，请修改
        </p>
      )}

      <div className="flex gap-3 flex-wrap">
        {/* Quantity */}
        <div className="flex-1 min-w-36">
          <label className="block text-sm font-medium text-gray-600 mb-1">数量</label>
          <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => adjustQuantity(-1)}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-xl font-bold text-gray-700 transition-colors"
            >
              −
            </button>
            <input
              type="number"
              value={qtyStr}
              onChange={(e) => handleQtyChange(e.target.value)}
              min="0.5"
              step="0.5"
              className={`flex-1 text-center text-lg font-bold py-3 focus:outline-none focus:ring-2 ${accentColor} bg-white`}
            />
            <button
              type="button"
              onClick={() => adjustQuantity(1)}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-xl font-bold text-gray-700 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Unit price */}
        <div className="flex-1 min-w-36">
          <label className="block text-sm font-medium text-gray-600 mb-1">单价（元）</label>
          <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
            <span className="px-3 py-3 bg-gray-100 text-gray-500 text-base">¥</span>
            <input
              type="number"
              value={priceStr}
              onChange={(e) => handlePriceChange(e.target.value)}
              min="0"
              step="0.01"
              className={`flex-1 text-center text-lg font-bold py-3 focus:outline-none focus:ring-2 ${accentColor} bg-white`}
            />
          </div>
        </div>

        {/* Subtotal */}
        <div className="flex items-end">
          <div className="text-right">
            <div className="text-sm text-gray-500">小计</div>
            <div className="text-xl font-bold text-gray-900">
              ¥{(item.quantity * item.unit_price).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
