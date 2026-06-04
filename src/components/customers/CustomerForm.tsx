import { useState } from 'react'
import type { Customer } from '../../lib/types'
import * as api from '../../lib/api'

interface Props {
  customer?: Customer | null
  onSave: () => void
  onCancel: () => void
}

export function CustomerForm({ customer, onSave, onCancel }: Props) {
  const [name, setName] = useState(customer?.name ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [notes, setNotes] = useState(customer?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim()) { setError('请输入客户名称'); return }
    setSaving(true)
    setError('')
    try {
      await api.upsertCustomer({
        id: customer?.id,
        name: name.trim(),
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      })
      onSave()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {customer ? '编辑客户' : '新增客户'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-base font-bold text-gray-700 mb-1">客户名称 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：李老板"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-base font-bold text-gray-700 mb-1">
                联系电话 <span className="font-normal text-gray-500">（选填）</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="138xxxxxxxx"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-base font-bold text-gray-700 mb-1">
                备注 <span className="font-normal text-gray-500">（选填）</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="例如：工程队，长期合作"
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
