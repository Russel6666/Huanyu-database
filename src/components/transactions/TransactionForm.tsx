import { useState, useEffect, useRef } from 'react'
import type { Product, Customer, TransactionDraftItem } from '../../lib/types'
import * as api from '../../lib/api'
import { CustomerSelector } from './CustomerSelector'
import { ProductPickerRow } from './ProductPickerRow'

interface Props {
  type: 'in' | 'out'
  products: Product[]
  customers: Customer[]
  onSuccess: () => void
}

const DRAFT_KEY = (type: 'in' | 'out') => `draft_transaction_${type}`

export function TransactionForm({ type, products, customers, onSuccess }: Props) {
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<TransactionDraftItem[]>([])
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [composing, setComposing] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const accentColor = type === 'in' ? 'green' : 'orange'
  const typeLabel = type === 'in' ? '入库' : '出库'

  // Load draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY(type))
      if (saved) {
        const draft = JSON.parse(saved)
        if (draft.items?.length) {
          setItems(draft.items)
          setCustomerId(draft.customerId ?? '')
          setNotes(draft.notes ?? '')
        }
      }
    } catch { /* ignore */ }
  }, [type])

  // Save draft to localStorage
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY(type), JSON.stringify({ items, customerId, notes }))
  }, [items, customerId, notes, type])

  // When customer changes, re-price items (out only)
  useEffect(() => {
    if (type !== 'out' || !customerId) return
    const updatePrices = async () => {
      const updated = await Promise.all(
        items.map(async (item) => {
          const price = await api.getPriceForCustomerProduct(customerId, item.product_id)
          return price !== null ? { ...item, unit_price: price } : item
        })
      )
      setItems(updated)
    }
    updatePrices()
  }, [customerId])

  const filteredProducts = products.filter(
    (p) =>
      !items.some((i) => i.product_id === p.id) &&
      (composing || !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const addProduct = async (product: Product) => {
    let unitPrice = 0
    if (type === 'out' && customerId) {
      const price = await api.getPriceForCustomerProduct(customerId, product.id)
      if (price !== null) unitPrice = price
    }
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        product_unit: product.unit,
        quantity: 1,
        unit_price: unitPrice,
      },
    ])
    setSearchQuery('')
    setShowSearch(false)
  }

  const updateItem = (productId: string, updated: TransactionDraftItem) => {
    setItems((prev) => prev.map((i) => (i.product_id === productId ? updated : i)))
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }

  const getProductStock = (productId: string) => {
    return products.find((p) => p.id === productId)?.current_stock
  }

  const hasStockError = type === 'out' && items.some((item) => {
    const stock = getProductStock(item.product_id)
    return stock !== undefined && item.quantity > stock
  })

  const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)

  const handleSubmit = async () => {
    if (items.length === 0) { setSubmitError('请至少添加一个商品'); return }
    if (hasStockError) { setSubmitError('存在出库数量超过库存的商品，请修改'); return }

    setSubmitting(true)
    setSubmitError('')
    try {
      await api.createTransaction(type, items, customerId || null, notes, date)
      localStorage.removeItem(DRAFT_KEY(type))
      setItems([])
      setCustomerId('')
      setNotes('')
      setDate(new Date().toISOString().split('T')[0])
      setSubmitSuccess(true)
      setTimeout(() => {
        setSubmitSuccess(false)
        onSuccess()
      }, 1500)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '提交失败，请重试'
      if (msg.includes('stock_non_negative')) {
        setSubmitError('出库数量超过库存，请刷新后重试')
      } else {
        setSubmitError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900">{typeLabel}成功！</h2>
        <p className="text-gray-500 text-lg mt-2">正在刷新库存...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Customer (out only) */}
      {type === 'out' && (
        <div className="mb-5">
          <label className="block text-base font-bold text-gray-700 mb-2">
            客户 <span className="font-normal text-gray-500">（选填，选择后自动填入价格）</span>
          </label>
          <CustomerSelector
            customers={customers}
            value={customerId}
            onChange={setCustomerId}
          />
        </div>
      )}

      {/* Date */}
      <div className="mb-5">
        <label className="block text-base font-bold text-gray-700 mb-2">日期</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Product search */}
      <div className="mb-4">
        <label className="block text-base font-bold text-gray-700 mb-2">
          添加商品
        </label>
        {showSearch ? (
          <div className="relative">
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={(e) => {
                setComposing(false)
                setSearchQuery((e.target as HTMLInputElement).value)
              }}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              placeholder="输入商品名称搜索..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
            {filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                {filteredProducts.slice(0, 10).map((p) => (
                  <button
                    key={p.id}
                    onMouseDown={() => addProduct(p)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-base font-medium text-gray-900">{p.name}</span>
                    <span className="text-sm text-gray-500 ml-2">/{p.unit}</span>
                    <span className="text-sm text-gray-400 ml-2">库存：{p.current_stock}</span>
                  </button>
                ))}
              </div>
            )}
            {searchQuery && filteredProducts.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 px-4 py-3 text-gray-400">
                未找到匹配商品
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => { setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 50) }}
            className={`w-full py-3 border-2 border-dashed rounded-xl text-lg font-medium transition-colors ${
              accentColor === 'green'
                ? 'border-green-300 text-green-700 hover:bg-green-50'
                : 'border-orange-300 text-orange-700 hover:bg-orange-50'
            }`}
          >
            + 搜索并添加商品
          </button>
        )}
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="space-y-3 mb-5">
          {items.map((item) => (
            <ProductPickerRow
              key={item.product_id}
              item={item}
              transactionType={type}
              maxStock={type === 'out' ? getProductStock(item.product_id) : undefined}
              onChange={(updated) => updateItem(item.product_id, updated)}
              onRemove={() => removeItem(item.product_id)}
            />
          ))}
        </div>
      )}

      {/* Notes */}
      <div className="mb-5">
        <label className="block text-base font-bold text-gray-700 mb-2">
          备注 <span className="font-normal text-gray-500">（选填）</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="可填写送货方式、票据编号等"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
      </div>

      {/* Total and submit */}
      {items.length > 0 && (
        <div className={`rounded-xl p-5 mb-5 ${
          accentColor === 'green' ? 'bg-green-50' : 'bg-orange-50'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-700">
              共 {items.length} 种商品
            </span>
            <span className="text-2xl font-bold text-gray-900">
              合计 ¥{total.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {submitError && (
        <p className="text-red-600 text-base bg-red-50 rounded-xl px-4 py-3 mb-4">
          {submitError}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || items.length === 0 || hasStockError}
        className={`w-full py-4 text-xl font-bold text-white rounded-xl transition-colors disabled:opacity-50 ${
          accentColor === 'green'
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-orange-500 hover:bg-orange-600'
        }`}
      >
        {submitting ? '提交中...' : `完成${typeLabel}`}
      </button>

      {items.length > 0 && (
        <p className="text-center text-sm text-gray-400 mt-2">
          草稿已自动保存，关闭页面后重新打开可继续填写
        </p>
      )}
    </div>
  )
}
