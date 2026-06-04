import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { FilterBar } from '../components/products/FilterBar'
import { ProductForm } from '../components/products/ProductForm'
import { StockBadge } from '../components/ui/StockBadge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import type { Product } from '../lib/types'
import * as api from '../lib/api'

export function ProductsPage() {
  const { products, productsLoading, categories, brands, filterPresets, loadProducts, loadCategories, loadBrands, loadFilterPresets } = useAppStore()
  const [searchInput, setSearchInput] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [composing, setComposing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    loadProducts()
    loadCategories()
    loadBrands()
    loadFilterPresets()
  }, [])

  const applyFilters = (search: string, category: string, brand: string) => {
    useAppStore.getState().setActiveFilter(null, {
      search: search || undefined,
      category: category || undefined,
      brand: brand || undefined,
    })
  }

  const handleSearch = (val: string) => {
    if (!composing) applyFilters(val, filterCategory, filterBrand)
  }

  const handleCategoryChange = (val: string) => {
    setFilterCategory(val)
    applyFilters(searchInput, val, filterBrand)
  }

  const handleBrandChange = (val: string) => {
    setFilterBrand(val)
    applyFilters(searchInput, filterCategory, val)
  }

  const clearFilters = () => {
    setSearchInput('')
    setFilterCategory('')
    setFilterBrand('')
    applyFilters('', '', '')
  }

  const hasActiveFilter = searchInput || filterCategory || filterBrand

  const handleSaved = () => {
    setShowForm(false)
    setEditTarget(null)
    loadProducts()
    loadCategories()
    loadBrands()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
      setDeleteError('')
      loadProducts()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('transaction_items') || msg.includes('foreign key') || msg.includes('23503')) {
        setDeleteError('该商品存在历史交易记录，无法删除。如不再使用，可修改名称标注为「已停用」。')
      } else {
        setDeleteError('删除失败，请重试。')
      }
    }
  }

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition-colors"
        >
          + 新增商品
        </button>
      </div>

      {/* Search + inline filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); handleSearch(e.target.value) }}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={(e) => {
            setComposing(false)
            const val = (e.target as HTMLInputElement).value
            setSearchInput(val)
            handleSearch(val)
          }}
          placeholder="搜索商品名称..."
          className="w-56 border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <select
          value={filterCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={filterBrand}
          onChange={(e) => handleBrandChange(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">全部品牌</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="px-4 py-3 text-base text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* Filter presets */}
      {filterPresets.length > 0 && <FilterBar />}

      {/* Table */}
      {productsLoading ? (
        <div className="text-gray-400 text-lg py-10 text-center">加载中...</div>
      ) : products.length === 0 ? (
        <EmptyState
          title="暂无商品"
          description="点击右上角「新增商品」按钮添加第一个商品"
          action={
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition-colors"
            >
              + 新增商品
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-4 text-base font-bold text-gray-600">商品名称</th>
                <th className="text-left px-5 py-4 text-base font-bold text-gray-600">分类</th>
                <th className="text-left px-5 py-4 text-base font-bold text-gray-600">品牌</th>
                <th className="text-center px-5 py-4 text-base font-bold text-gray-600">当前库存</th>
                <th className="text-left px-5 py-4 text-base font-bold text-gray-600">备注</th>
                <th className="text-right px-5 py-4 text-base font-bold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-lg font-bold text-gray-900">{product.name}</td>
                  <td className="px-5 py-4">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-base">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {product.brand ? (
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-base">
                        {product.brand}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <StockBadge product={product} />
                    {product.low_stock_alert !== null && (
                      <div className="text-xs text-gray-400 mt-1">预警：{product.low_stock_alert}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-base text-gray-500 max-w-xs truncate">
                    {product.notes ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => { setEditTarget(product); setShowForm(true) }}
                      className="text-blue-600 hover:text-blue-700 font-medium text-base mr-4"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => setDeleteTarget(product)}
                      className="text-red-500 hover:text-red-600 font-medium text-base"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showForm || editTarget) && (
        <ProductForm
          product={editTarget}
          categories={categories}
          brands={brands}
          onSave={handleSaved}
          onCancel={() => { setShowForm(false); setEditTarget(null) }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除商品"
        message={`确认删除商品「${deleteTarget?.name}」吗？此操作无法撤销。`}
        confirmLabel="删除"
        errorMessage={deleteError}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError('') }}
        danger
      />
    </div>
  )
}
