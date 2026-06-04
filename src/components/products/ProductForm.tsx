import { useState, useEffect } from 'react'
import type { Product } from '../../lib/types'
import * as api from '../../lib/api'

interface Props {
  product?: Product | null
  categories: string[]
  brands: string[]
  onSave: () => void
  onCancel: () => void
}

const UNITS = ['个', '箱', '卷', '米', '套', '包', '条', '块', '片', '根']

export function ProductForm({ product, categories, brands, onSave, onCancel }: Props) {
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState(product?.category ?? '')
  const [newCategory, setNewCategory] = useState('')
  const [brand, setBrand] = useState(product?.brand ?? '')
  const [newBrand, setNewBrand] = useState('')
  const [unit, setUnit] = useState(product?.unit ?? '个')
  const [currentStock, setCurrentStock] = useState(product?.current_stock?.toString() ?? '0')
  const [lowStockAlert, setLowStockAlert] = useState(product?.low_stock_alert?.toString() ?? '')
  const [notes, setNotes] = useState(product?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!product

  const effectiveCategory = newCategory.trim() || category

  const handleSave = async () => {
    if (!name.trim()) { setError('请输入商品名称'); return }
    if (!effectiveCategory) { setError('请选择或输入商品分类'); return }

    setSaving(true)
    setError('')
    try {
      const effectiveBrand = newBrand.trim() || brand || null
      await api.upsertProduct({
        id: product?.id,
        name: name.trim(),
        category: effectiveCategory,
        brand: effectiveBrand,
        unit,
        current_stock: parseFloat(currentStock) || 0,
        low_stock_alert: lowStockAlert ? parseFloat(lowStockAlert) : null,
        notes: notes.trim() || null,
      })
      onSave()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    // if category list has the product's category, clear newCategory
    if (product?.category && categories.includes(product.category)) {
      setCategory(product.category)
    }
  }, [categories, product?.category])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isEdit ? '编辑商品' : '新增商品'}
          </h2>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-1">商品名称 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：5芯电线"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-1">商品分类 *</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setNewCategory('') }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
              >
                <option value="">-- 选择分类 --</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="或输入新分类名称"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-1">
                品牌 <span className="font-normal text-gray-500">（选填）</span>
              </label>
              <select
                value={brand}
                onChange={(e) => { setBrand(e.target.value); setNewBrand('') }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
              >
                <option value="">-- 选择品牌 --</option>
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="或输入新品牌名称"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-1">单位</label>
              <div className="flex flex-wrap gap-2">
                {UNITS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`px-4 py-2 rounded-xl text-base font-medium transition-colors ${
                      unit === u ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Stock */}
            {!isEdit && (
              <div>
                <label className="block text-base font-bold text-gray-700 mb-1">初始库存</label>
                <input
                  type="number"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  min="0"
                  step="0.5"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            )}

            {/* Low stock alert */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-1">
                低库存预警阈值 <span className="font-normal text-gray-500">（选填）</span>
              </label>
              <input
                type="number"
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(e.target.value)}
                min="0"
                step="1"
                placeholder="库存低于此数值时显示警告"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-1">
                备注 <span className="font-normal text-gray-500">（选填）</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="可填写规格、产地等信息"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>

            {error && (
              <p className="text-red-600 text-base bg-red-50 rounded-lg px-4 py-3">{error}</p>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={onCancel}
              className="flex-1 py-3 text-lg font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 text-lg font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
