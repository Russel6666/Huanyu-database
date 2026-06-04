import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { StockBadge } from '../components/ui/StockBadge'
import * as api from '../lib/api'
import type { Product } from '../lib/types'

export function DashboardPage() {
  const { products, loadProducts } = useAppStore()
  const [stats, setStats] = useState({ in_count: 0, out_count: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      await loadProducts()
      const s = await api.getTodayStats()
      setStats(s)
      setLoading(false)
    }
    init()
  }, [])

  const lowStockProducts: Product[] = products.filter(
    (p) => p.low_stock_alert !== null && p.current_stock <= p.low_stock_alert
  )

  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">首页</h1>

      {/* Today stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          icon="📦"
          label="商品总数"
          value={products.length.toString()}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon="📥"
          label="今日入库"
          value={stats.in_count.toString()}
          color="green"
          loading={loading}
        />
        <StatCard
          icon="📤"
          label="今日出库"
          value={stats.out_count.toString()}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          to="/stock-in"
          className="flex items-center gap-4 p-6 bg-green-500 hover:bg-green-600 text-white rounded-2xl shadow-sm transition-colors"
        >
          <span className="text-4xl">📥</span>
          <div>
            <div className="text-xl font-bold">入库</div>
            <div className="text-green-100 text-base">记录商品入库</div>
          </div>
        </Link>
        <Link
          to="/stock-out"
          className="flex items-center gap-4 p-6 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-sm transition-colors"
        >
          <span className="text-4xl">📤</span>
          <div>
            <div className="text-xl font-bold">出库</div>
            <div className="text-orange-100 text-base">自动填入客户价格</div>
          </div>
        </Link>
      </div>

      {/* Low stock warning */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
            ⚠️ 库存不足警告
            <span className="text-base font-normal text-red-600">（{lowStockProducts.length} 件商品）</span>
          </h2>
          <div className="space-y-2">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
                <div>
                  <span className="text-base font-bold text-gray-900">{p.name}</span>
                  <span className="text-sm text-gray-500 ml-2">{p.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StockBadge product={p} />
                  <span className="text-sm text-gray-400">预警：{p.low_stock_alert}</span>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/stock-in"
            className="mt-4 inline-flex items-center gap-2 text-base font-medium text-red-700 hover:text-red-800"
          >
            → 去入库补货
          </Link>
        </div>
      )}

      {/* Recent products */}
      {lowStockProducts.length === 0 && products.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-3">所有商品库存</h2>
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 8).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
                <span className="text-base font-medium text-gray-900 truncate mr-3">{p.name}</span>
                <StockBadge product={p} />
              </div>
            ))}
          </div>
          {products.length > 8 && (
            <Link to="/products" className="block text-center mt-3 text-blue-600 text-base hover:underline">
              查看全部 {products.length} 件商品 →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
  loading,
}: {
  icon: string
  label: string
  value: string
  color: 'blue' | 'green' | 'orange'
  loading: boolean
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
  }

  return (
    <div className={`rounded-2xl p-5 ${colorMap[color]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold">{loading ? '...' : value}</div>
      <div className="text-base font-medium opacity-80 mt-1">{label}</div>
    </div>
  )
}
