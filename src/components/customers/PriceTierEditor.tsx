import { useState, useEffect } from 'react'
import type { Customer, Product, CustomerPrice } from '../../lib/types'
import * as api from '../../lib/api'

interface Props {
  customer: Customer
  products: Product[]
}

interface PriceRow {
  product_id: string
  product_name: string
  product_unit: string
  price: string
  saved: boolean
  saving: boolean
}

export function PriceTierEditor({ customer, products }: Props) {
  const [rows, setRows] = useState<PriceRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPrices()
  }, [customer.id, products])

  const loadPrices = async () => {
    setLoading(true)
    const prices: CustomerPrice[] = await api.getCustomerPrices(customer.id)
    const priceMap = new Map(prices.map((p) => [p.product_id, p.price]))
    setRows(
      products.map((p) => ({
        product_id: p.id,
        product_name: p.name,
        product_unit: p.unit,
        price: priceMap.has(p.id) ? priceMap.get(p.id)!.toString() : '',
        saved: priceMap.has(p.id),
        saving: false,
      }))
    )
    setLoading(false)
  }

  const updateRow = (productId: string, price: string) => {
    setRows((prev) =>
      prev.map((r) => (r.product_id === productId ? { ...r, price } : r))
    )
  }

  const saveRow = async (productId: string) => {
    const row = rows.find((r) => r.product_id === productId)
    if (!row) return

    const priceVal = parseFloat(row.price)
    if (isNaN(priceVal) || priceVal < 0) return

    setRows((prev) =>
      prev.map((r) => (r.product_id === productId ? { ...r, saving: true } : r))
    )

    try {
      await api.upsertCustomerPrice(customer.id, productId, priceVal)
      setRows((prev) =>
        prev.map((r) => (r.product_id === productId ? { ...r, saving: false, saved: true } : r))
      )
    } catch {
      setRows((prev) =>
        prev.map((r) => (r.product_id === productId ? { ...r, saving: false } : r))
      )
    }
  }

  const removeRow = async (productId: string) => {
    await api.deleteCustomerPrice(customer.id, productId)
    setRows((prev) =>
      prev.map((r) => (r.product_id === productId ? { ...r, price: '', saved: false } : r))
    )
  }

  if (loading) {
    return <div className="text-gray-500 text-base py-4">加载中...</div>
  }

  const pricedRows = rows.filter((r) => r.saved || r.price)
  const unpricedRows = rows.filter((r) => !r.saved && !r.price)

  return (
    <div>
      <p className="text-gray-600 text-sm mb-3">
        为此客户设置商品专属价格。出库时选择该客户，价格将自动填充。
      </p>

      {rows.length === 0 ? (
        <p className="text-gray-400 text-base py-4">暂无商品，请先在商品管理中添加商品。</p>
      ) : (
        <div className="space-y-2">
          {/* Already priced rows */}
          {pricedRows.map((row) => (
            <PriceRowItem
              key={row.product_id}
              row={row}
              onChange={(v) => updateRow(row.product_id, v)}
              onSave={() => saveRow(row.product_id)}
              onRemove={() => removeRow(row.product_id)}
            />
          ))}

          {/* Divider */}
          {pricedRows.length > 0 && unpricedRows.length > 0 && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-sm text-gray-400">其他商品（未设置价格）</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
          )}

          {/* Unpriced rows */}
          {unpricedRows.map((row) => (
            <PriceRowItem
              key={row.product_id}
              row={row}
              onChange={(v) => updateRow(row.product_id, v)}
              onSave={() => saveRow(row.product_id)}
              onRemove={() => removeRow(row.product_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PriceRowItem({
  row,
  onChange,
  onSave,
  onRemove,
}: {
  row: PriceRow
  onChange: (v: string) => void
  onSave: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
      <div className="flex-1 min-w-0">
        <span className="text-base font-medium text-gray-900 truncate">{row.product_name}</span>
        <span className="text-sm text-gray-500 ml-2">/{row.product_unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-base">¥</span>
        <input
          type="number"
          value={row.price}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave() }}
          placeholder="未设置"
          min="0"
          step="0.01"
          className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-base text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {row.price ? (
          <button
            onClick={onSave}
            disabled={row.saving}
            className="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {row.saving ? '...' : row.saved ? '更新' : '保存'}
          </button>
        ) : null}
        {row.saved && (
          <button
            onClick={onRemove}
            className="px-3 py-2 text-sm font-medium bg-gray-200 text-gray-600 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
          >
            删除
          </button>
        )}
      </div>
    </div>
  )
}
