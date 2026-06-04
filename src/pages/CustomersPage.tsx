import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { CustomerForm } from '../components/customers/CustomerForm'
import { PriceTierEditor } from '../components/customers/PriceTierEditor'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import type { Customer } from '../lib/types'
import * as api from '../lib/api'

export function CustomersPage() {
  const { customers, customersLoading, products, loadCustomers, loadProducts } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    loadCustomers()
    loadProducts()
  }, [])

  const handleSaved = () => {
    setShowForm(false)
    setEditTarget(null)
    loadCustomers()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await api.deleteCustomer(deleteTarget.id)
    if (selectedCustomer?.id === deleteTarget.id) setSelectedCustomer(null)
    setDeleteTarget(null)
    loadCustomers()
  }

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">客户管理</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition-colors"
        >
          + 新增客户
        </button>
      </div>

      <div className="flex gap-6">
        {/* Customer list */}
        <div className="w-72 shrink-0">
          {customersLoading ? (
            <div className="text-gray-400 py-8 text-center">加载中...</div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon="👥"
              title="暂无客户"
              description="点击右上角按钮添加第一个客户"
            />
          ) : (
            <div className="space-y-2">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedCustomer?.id === customer.id
                      ? 'border-blue-400 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{customer.name}</div>
                      {customer.phone && (
                        <div className="text-sm text-gray-500 mt-0.5">{customer.phone}</div>
                      )}
                      {customer.notes && (
                        <div className="text-sm text-gray-400 mt-0.5 truncate max-w-44">{customer.notes}</div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditTarget(customer); setShowForm(true) }}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        编辑
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(customer) }}
                        className="text-red-400 hover:text-red-600 text-sm font-medium"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price tier editor */}
        <div className="flex-1">
          {selectedCustomer ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {selectedCustomer.name} 的价格档位
              </h2>
              <PriceTierEditor customer={selectedCustomer} products={products} />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center min-h-64">
              <p className="text-gray-400 text-lg">← 点击左侧客户，设置专属价格</p>
            </div>
          )}
        </div>
      </div>

      {(showForm || editTarget) && (
        <CustomerForm
          customer={editTarget}
          onSave={handleSaved}
          onCancel={() => { setShowForm(false); setEditTarget(null) }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除客户"
        message={`确认删除客户「${deleteTarget?.name}」吗？该客户的所有价格档位也将被删除。`}
        confirmLabel="删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  )
}
