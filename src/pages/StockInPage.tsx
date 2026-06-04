import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { TransactionForm } from '../components/transactions/TransactionForm'

export function StockInPage() {
  const { products, customers, loadProducts, loadCustomers } = useAppStore()

  useEffect(() => {
    loadProducts()
    loadCustomers()
  }, [])

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
          📥
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">入库</h1>
          <p className="text-gray-500 text-base">记录商品入库数量</p>
        </div>
      </div>

      <TransactionForm
        type="in"
        products={products}
        customers={customers}
        onSuccess={() => loadProducts()}
      />
    </div>
  )
}
