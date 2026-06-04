export interface Product {
  id: string
  name: string
  category: string
  brand: string | null
  unit: string
  current_stock: number
  low_stock_alert: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  phone: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CustomerPrice {
  id: string
  customer_id: string
  product_id: string
  price: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  type: 'in' | 'out'
  transaction_date: string
  customer_id: string | null
  notes: string | null
  created_at: string
  customer?: Customer
  items?: TransactionItem[]
}

export interface TransactionItem {
  id: string
  transaction_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  product?: Product
}

export interface FilterPreset {
  id: string
  name: string
  filter_config: FilterConfig
  created_at: string
}

export interface FilterConfig {
  category?: string
  brand?: string
  stock_below_alert?: boolean
  search?: string
}

export interface TransactionDraftItem {
  product_id: string
  product_name: string
  product_unit: string
  quantity: number
  unit_price: number
}
