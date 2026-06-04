import { supabase } from './supabase'
import type {
  Product,
  Customer,
  CustomerPrice,
  Transaction,
  FilterPreset,
  FilterConfig,
  TransactionDraftItem,
} from './types'

// ─── Products ────────────────────────────────────────────────────────────────

export async function getProducts(filter: FilterConfig = {}): Promise<Product[]> {
  let query = supabase.from('products').select('*').order('name')

  if (filter.category) {
    query = query.eq('category', filter.category)
  }
  if (filter.brand) {
    query = query.eq('brand', filter.brand)
  }
  if (filter.search) {
    query = query.ilike('name', `%${filter.search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  let products: Product[] = data ?? []

  // client-side filter for low_stock_alert comparison (current_stock <= low_stock_alert)
  if (filter.stock_below_alert) {
    products = products.filter(
      (p) => p.low_stock_alert !== null && p.current_stock <= p.low_stock_alert
    )
  }

  return products
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function upsertProduct(product: Partial<Product> & { name: string }): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .upsert({ ...product, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .order('category')
  if (error) throw error
  const cats = [...new Set((data ?? []).map((r: { category: string }) => r.category))]
  return cats
}

export async function getBrands(): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('brand')
    .not('brand', 'is', null)
    .order('brand')
  if (error) throw error
  const brands = [...new Set((data ?? []).map((r: { brand: string }) => r.brand).filter(Boolean))]
  return brands
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export async function upsertCustomer(customer: Partial<Customer> & { name: string }): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .upsert({ ...customer, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
}

// ─── Customer Prices ─────────────────────────────────────────────────────────

export async function getCustomerPrices(customerId: string): Promise<CustomerPrice[]> {
  const { data, error } = await supabase
    .from('customer_prices')
    .select('*')
    .eq('customer_id', customerId)
  if (error) throw error
  return data ?? []
}

export async function getPriceForCustomerProduct(
  customerId: string,
  productId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from('customer_prices')
    .select('price')
    .eq('customer_id', customerId)
    .eq('product_id', productId)
    .maybeSingle()
  if (error) throw error
  return data?.price ?? null
}

export async function upsertCustomerPrice(
  customerId: string,
  productId: string,
  price: number
): Promise<void> {
  const { error } = await supabase.from('customer_prices').upsert(
    {
      customer_id: customerId,
      product_id: productId,
      price,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'customer_id,product_id' }
  )
  if (error) throw error
}

export async function deleteCustomerPrice(customerId: string, productId: string): Promise<void> {
  const { error } = await supabase
    .from('customer_prices')
    .delete()
    .eq('customer_id', customerId)
    .eq('product_id', productId)
  if (error) throw error
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactions(dateFrom?: string, dateTo?: string): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select(`*, customer:customers(id, name), items:transaction_items(*, product:products(id, name, unit))`)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (dateFrom) query = query.gte('transaction_date', dateFrom)
  if (dateTo) query = query.lte('transaction_date', dateTo)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getTodayStats(): Promise<{ in_count: number; out_count: number }> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('transactions')
    .select('type')
    .eq('transaction_date', today)
  if (error) throw error
  const rows = data ?? []
  return {
    in_count: rows.filter((r: { type: string }) => r.type === 'in').length,
    out_count: rows.filter((r: { type: string }) => r.type === 'out').length,
  }
}

export async function createTransaction(
  type: 'in' | 'out',
  items: TransactionDraftItem[],
  customerId?: string | null,
  notes?: string,
  date?: string
): Promise<void> {
  const transaction_date = date ?? new Date().toISOString().split('T')[0]

  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({ type, transaction_date, customer_id: customerId ?? null, notes: notes ?? null })
    .select()
    .single()
  if (txError) throw txError

  const itemRows = items.map((item) => ({
    transaction_id: tx.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }))

  const { error: itemError } = await supabase.from('transaction_items').insert(itemRows)
  if (itemError) throw itemError
}

// ─── Filter Presets ───────────────────────────────────────────────────────────

export async function getFilterPresets(): Promise<FilterPreset[]> {
  const { data, error } = await supabase
    .from('filter_presets')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function upsertFilterPreset(preset: Partial<FilterPreset> & { name: string; filter_config: FilterConfig }): Promise<FilterPreset> {
  const { data, error } = await supabase
    .from('filter_presets')
    .upsert(preset)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteFilterPreset(id: string): Promise<void> {
  const { error } = await supabase.from('filter_presets').delete().eq('id', id)
  if (error) throw error
}
