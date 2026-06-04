import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import * as api from '../../lib/api'
import type { FilterPreset, FilterConfig } from '../../lib/types'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface NewPresetFormProps {
  categories: string[]
  brands: string[]
  onSave: (name: string, config: FilterConfig) => void
  onCancel: () => void
}

function NewPresetForm({ categories, brands, onSave, onCancel }: NewPresetFormProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [stockBelowAlert, setStockBelowAlert] = useState(false)

  const handleSave = () => {
    if (!name.trim()) return
    const config: FilterConfig = {}
    if (category) config.category = category
    if (brand) config.brand = brand
    if (stockBelowAlert) config.stock_below_alert = true
    onSave(name.trim(), config)
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
      <h4 className="font-bold text-gray-800 mb-3">新建筛选器</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">筛选器名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：低库存商品"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">按分类筛选</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">全部分类</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">按品牌筛选</label>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">全部品牌</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={stockBelowAlert}
            onChange={(e) => setStockBelowAlert(e.target.checked)}
            className="w-5 h-5 rounded"
          />
          <span className="text-base text-gray-700">仅显示库存不足的商品</span>
        </label>
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            保存
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

export function FilterBar() {
  const { filterPresets, activeFilterPreset, setActiveFilter, loadFilterPresets } = useAppStore()
  const categories = useAppStore((s) => s.categories)
  const brands = useAppStore((s) => s.brands)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FilterPreset | null>(null)

  const handlePresetClick = (preset: FilterPreset) => {
    setActiveFilter(preset)
  }

  const handleSavePreset = async (name: string, config: FilterConfig) => {
    await api.upsertFilterPreset({ name, filter_config: config })
    await loadFilterPresets()
    setShowForm(false)
  }

  const handleDeletePreset = async () => {
    if (!deleteTarget) return
    await api.deleteFilterPreset(deleteTarget.id)
    await loadFilterPresets()
    // if deleted preset was active, reset
    if (activeFilterPreset?.id === deleteTarget.id) {
      setActiveFilter(null, {})
    }
    setDeleteTarget(null)
  }

  return (
    <div className="mb-4">
      {showForm && (
        <NewPresetForm
          categories={categories}
          brands={brands}
          onSave={handleSavePreset}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {/* "全部" pill */}
        <button
          onClick={() => setActiveFilter(null, {})}
          className={`px-4 py-2 rounded-full text-base font-medium transition-colors ${
            !activeFilterPreset
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全部
        </button>

        {filterPresets.map((preset) => (
          <div key={preset.id} className="relative group flex items-center">
            <button
              onClick={() => handlePresetClick(preset)}
              className={`pl-4 pr-2 py-2 rounded-full text-base font-medium transition-colors flex items-center gap-1 ${
                activeFilterPreset?.id === preset.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {preset.name}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(preset) }}
              className={`ml-1 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                activeFilterPreset?.id === preset.id
                  ? 'hover:bg-blue-500 text-white'
                  : 'hover:bg-gray-300 text-gray-400 hover:text-gray-600'
              }`}
              title="删除筛选器"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-full text-base font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-1"
        >
          + 新建筛选器
        </button>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除筛选器"
        message={`确认删除筛选器「${deleteTarget?.name}」吗？`}
        confirmLabel="删除"
        onConfirm={handleDeletePreset}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  )
}
