import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', icon: '🏠', label: '首页', exact: true },
  { to: '/products', icon: '📦', label: '商品管理' },
  { to: '/stock-in', icon: '📥', label: '入库' },
  { to: '/stock-out', icon: '📤', label: '出库' },
  { to: '/customers', icon: '👥', label: '客户管理' },
  { to: '/transactions', icon: '📋', label: '交易记录' },
]

export function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm">
      <div className="px-5 py-5 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">电料库存</h1>
        <p className="text-sm text-gray-500 mt-0.5">管理系统</p>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <span className="text-2xl">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Quick action buttons */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <NavLink
          to="/stock-in"
          className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl transition-colors"
        >
          <span>📥</span> 入库
        </NavLink>
        <NavLink
          to="/stock-out"
          className="flex items-center justify-center gap-2 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-xl transition-colors"
        >
          <span>📤</span> 出库
        </NavLink>
      </div>
    </aside>
  )
}
