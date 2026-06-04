import type { Product } from '../../lib/types'

export function StockBadge({ product }: { product: Product }) {
  const { current_stock, low_stock_alert, unit } = product

  let colorClass = 'bg-green-100 text-green-800'
  if (low_stock_alert !== null) {
    if (current_stock <= low_stock_alert) {
      colorClass = 'bg-red-100 text-red-800'
    } else if (current_stock <= low_stock_alert * 1.5) {
      colorClass = 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-base font-bold ${colorClass}`}>
      {current_stock} {unit}
    </span>
  )
}
