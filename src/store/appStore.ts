import { create } from 'zustand'
import type { Product, Customer, FilterPreset, FilterConfig } from '../lib/types'
import * as api from '../lib/api'

interface AppState {
  // Products
  products: Product[]
  categories: string[]
  brands: string[]
  activeFilterPreset: FilterPreset | null
  activeFilterConfig: FilterConfig
  productsLoading: boolean

  // Customers
  customers: Customer[]
  customersLoading: boolean

  // Filter presets
  filterPresets: FilterPreset[]
  filterPresetsLoading: boolean

  // Actions
  loadProducts: (filter?: FilterConfig) => Promise<void>
  loadCategories: () => Promise<void>
  loadBrands: () => Promise<void>
  loadCustomers: () => Promise<void>
  loadFilterPresets: () => Promise<void>
  setActiveFilter: (preset: FilterPreset | null, config?: FilterConfig) => void
  refreshAll: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  products: [],
  categories: [],
  brands: [],
  activeFilterPreset: null,
  activeFilterConfig: {},
  productsLoading: false,

  customers: [],
  customersLoading: false,

  filterPresets: [],
  filterPresetsLoading: false,

  loadProducts: async (filter?: FilterConfig) => {
    const config = filter ?? get().activeFilterConfig
    set({ productsLoading: true })
    try {
      const products = await api.getProducts(config)
      set({ products, productsLoading: false })
    } catch (e) {
      set({ productsLoading: false })
      throw e
    }
  },

  loadCategories: async () => {
    const categories = await api.getCategories()
    set({ categories })
  },

  loadBrands: async () => {
    const brands = await api.getBrands()
    set({ brands })
  },

  loadCustomers: async () => {
    set({ customersLoading: true })
    try {
      const customers = await api.getCustomers()
      set({ customers, customersLoading: false })
    } catch (e) {
      set({ customersLoading: false })
      throw e
    }
  },

  loadFilterPresets: async () => {
    set({ filterPresetsLoading: true })
    try {
      const filterPresets = await api.getFilterPresets()
      set({ filterPresets, filterPresetsLoading: false })
    } catch (e) {
      set({ filterPresetsLoading: false })
      throw e
    }
  },

  setActiveFilter: (preset, config) => {
    const filterConfig = config ?? preset?.filter_config ?? {}
    set({ activeFilterPreset: preset, activeFilterConfig: filterConfig })
    get().loadProducts(filterConfig)
  },

  refreshAll: async () => {
    await Promise.all([
      get().loadProducts(),
      get().loadCategories(),
      get().loadBrands(),
      get().loadCustomers(),
      get().loadFilterPresets(),
    ])
  },
}))
