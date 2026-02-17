import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import * as api from './api'

// ═══════════════════════════════════════════
// Mock Data (fallback when backend unavailable)
// ═══════════════════════════════════════════
const mockCategories = [
    { id: 1, name: 'Роллы', icon: '🍣', sort: 1, active: true, count: 12 },
    { id: 2, name: 'Суши', icon: '🍱', sort: 2, active: true, count: 8 },
    { id: 3, name: 'Сеты', icon: '🎁', sort: 3, active: true, count: 5 },
    { id: 4, name: 'Горячее', icon: '🍜', sort: 4, active: false, count: 3 },
    { id: 5, name: 'Салаты', icon: '🥗', sort: 5, active: true, count: 6 },
    { id: 6, name: 'Напитки', icon: '🥤', sort: 6, active: true, count: 10 },
]

const mockProducts = [
    { id: 1, name: 'Филадельфия Классик', description: 'Лосось, сливочный сыр, рис, нори', price: 289, category: 'Роллы', category_id: 1, active: true, is_hit: true, is_new: false, is_promo: false, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=80&h=80&fit=crop' },
    { id: 2, name: 'Дракон Ролл', description: 'Угорь, авокадо, огурец, унаги соус', price: 349, category: 'Роллы', category_id: 1, active: true, is_hit: false, is_new: true, is_promo: false, image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=80&h=80&fit=crop' },
    { id: 3, name: 'Калифорния', description: 'Краб, авокадо, огурец, тобико', price: 259, category: 'Роллы', category_id: 1, active: true, is_hit: false, is_new: false, is_promo: true, image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=80&h=80&fit=crop' },
    { id: 4, name: 'Нигири лосось', description: 'Свежий лосось на рисе', price: 149, category: 'Суши', category_id: 2, active: true, is_hit: true, is_new: false, is_promo: false, image: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=80&h=80&fit=crop' },
    { id: 5, name: 'Сет «Для двоих»', description: '24 шт: Филадельфия, Калифорния, Дракон', price: 699, category: 'Сеты', category_id: 3, active: true, is_hit: false, is_new: false, is_promo: true, image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=80&h=80&fit=crop' },
    { id: 6, name: 'Том Ям', description: 'Суп с морепродуктами', price: 219, category: 'Горячее', category_id: 4, active: false, is_hit: false, is_new: true, is_promo: false, image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=80&h=80&fit=crop' },
]

const mockOrders = [
    { id: 'UKR-4821', customer: 'Иван Петров', phone: '+380 93 123 45 67', items: 3, total: 897, status: 'new', time: '12:34', payment: 'card' },
    { id: 'UKR-4820', customer: 'Мария Коваль', phone: '+380 67 234 56 78', items: 1, total: 289, status: 'cooking', time: '12:28', payment: 'cash' },
    { id: 'UKR-4819', customer: 'Олег Сидоренко', phone: '+380 50 345 67 89', items: 5, total: 1450, status: 'delivering', time: '12:15', payment: 'leekpay' },
    { id: 'UKR-4818', customer: 'Анна Шевченко', phone: '+380 63 456 78 90', items: 2, total: 548, status: 'done', time: '11:50', payment: 'wayforpay' },
    { id: 'UKR-4817', customer: 'Дмитрий Бондар', phone: '+380 97 567 89 01', items: 1, total: 699, status: 'cancelled', time: '11:30', payment: 'cash' },
]

const mockBanners = [
    { id: 1, title: 'Скидка 20% на сеты', link: 'category/3', is_active: true, sort: 1 },
    { id: 2, title: 'Бесплатная доставка от 500₴', link: 'promo', is_active: true, sort: 2 },
    { id: 3, title: 'Новинки недели', link: 'new', is_active: false, sort: 3 },
]

const mockPromos = [
    { id: 1, code: 'WELCOME15', type: 'percentage', value: 15, usageCount: 42, usageLimit: 100, expires: '2026-03-01', active: true },
    { id: 2, code: 'SET20', type: 'percentage', value: 20, usageCount: 18, usageLimit: 50, expires: '2026-03-15', active: true },
    { id: 3, code: 'FREE50', type: 'fixed', value: 50, usageCount: 5, usageLimit: 30, expires: '2026-02-28', active: true },
    { id: 4, code: 'VIP100', type: 'fixed', value: 100, usageCount: 0, usageLimit: 10, expires: '2026-04-01', active: false },
]

const cities = [
    { id: 1, name: 'Киев', active: true },
    { id: 2, name: 'Одесса', active: true },
    { id: 3, name: 'Львов', active: false },
]

// ═══════════════════════════════════════════
// APP
// ═══════════════════════════════════════════
export default function App() {
    const [toast, setToast] = useState(null)
    const [connected, setConnected] = useState(null)
    const [cities, setCities] = useState([])
    const [activeCity, setActiveCity] = useState(() => {
        const saved = localStorage.getItem('admin_active_city')
        return saved ? JSON.parse(saved) : null
    })

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

    useEffect(() => {
        const load = async () => {
            try {
                const c = await api.fetchCities()
                if (c) {
                    setCities(c)
                    setConnected(true)

                    // IF active city is set, update it with fresh data
                    if (activeCity) {
                        const fresh = c.find(cit => cit.id === activeCity.id)
                        if (fresh) {
                            setActiveCity(fresh)
                            localStorage.setItem('admin_active_city', JSON.stringify(fresh))
                        }
                    }
                    // If no active city set, pick first active
                    else if (c.length > 0) {
                        const first = c.find(cit => cit.is_active) || c[0]
                        setActiveCity(first)
                        localStorage.setItem('admin_active_city', JSON.stringify(first))
                    }
                } else {
                    setConnected(false)
                }
            } catch (e) {
                setConnected(false)
            }
        }
        load()
    }, [])

    const handleCityChange = (city) => {
        setActiveCity(city)
        localStorage.setItem('admin_active_city', JSON.stringify(city))
        // Force reload relevant pages or trigger refetch
        window.location.reload() // Simplest way to ensure all components refetch with new city context
    }

    return (
        <div className="layout">
            <Sidebar connected={connected} />
            <div className="main">
                <TopHeader
                    connected={connected}
                    cities={cities}
                    activeCity={activeCity}
                    onCityChange={handleCityChange}
                />
                <div className="content">
                    {!activeCity && connected ? (
                        <div style={{ padding: 40, textAlign: 'center' }}>
                            <h2>Выберите город для начала работы</h2>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
                                {cities.map(c => (
                                    <button key={c.id} className="btn btn-primary" onClick={() => handleCityChange(c)}>{c.name}</button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Routes>
                            <Route path="/" element={<DashboardPage showToast={showToast} activeCity={activeCity} />} />
                            <Route path="/categories" element={<CategoriesPage showToast={showToast} activeCity={activeCity} />} />
                            <Route path="/products" element={<ProductsPage showToast={showToast} activeCity={activeCity} />} />
                            <Route path="/orders" element={<OrdersPage showToast={showToast} activeCity={activeCity} />} />
                            <Route path="/banners" element={<BannersPage showToast={showToast} activeCity={activeCity} />} />
                            <Route path="/promos" element={<PromosPage showToast={showToast} activeCity={activeCity} />} />
                            <Route path="/delivery" element={<DeliveryPage showToast={showToast} activeCity={activeCity} onCityUpdated={() => api.fetchCities().then(setCities)} />} />
                            <Route path="/settings" element={<SettingsPage showToast={showToast} activeCity={activeCity} />} />
                            <Route path="/push" element={<PushPage showToast={showToast} activeCity={activeCity} />} />
                        </Routes>
                    )}
                </div>
            </div>
            {toast && <div className="toast-admin">{toast}</div>}
        </div>
    )
}

// ═══════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════
function Sidebar({ connected }) {
    const nav = useNavigate()
    const loc = useLocation()
    const isActive = (p) => loc.pathname === p ? 'active' : ''

    const items = [
        {
            label: 'МЕНЮ', items: [
                { icon: '📊', text: 'Дашборд', path: '/' },
                { icon: '📁', text: 'Категории', path: '/categories' },
                { icon: '🍣', text: 'Товары', path: '/products' },
                { icon: '🖼️', text: 'Баннеры', path: '/banners' },
            ]
        },
        {
            label: 'ЗАКАЗЫ', items: [
                { icon: '📦', text: 'Заказы', path: '/orders', badge: 3 },
            ]
        },
        {
            label: 'МАРКЕТИНГ', items: [
                { icon: '🎟️', text: 'Промокоды', path: '/promos' },
                { icon: '🔔', text: 'Push-уведомления', path: '/push' },
            ]
        },
        {
            label: 'НАСТРОЙКИ', items: [
                { icon: '⚙️', text: 'Общие настройки', path: '/settings' },
                { icon: '🚚', text: 'Доставка', path: '/delivery' },
            ]
        },
    ]

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">🍣 Ukusi<span className="dot">Ruby</span></div>
                <div className="sidebar-subtitle">Админ-панель</div>
            </div>
            <nav className="sidebar-nav">
                {items.map((group, gi) => (
                    <div key={gi}>
                        <div className="sidebar-label">{group.label}</div>
                        {group.items.map(item => (
                            <button
                                key={item.path}
                                className={`sidebar-item ${isActive(item.path)}`}
                                onClick={() => nav(item.path)}
                            >
                                <span className="icon">{item.icon}</span>
                                {item.text}
                                {item.badge && <span className="badge-count">{item.badge}</span>}
                            </button>
                        ))}
                    </div>
                ))}
            </nav>
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 11 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: connected === true ? '#10B981' : connected === false ? '#EF4444' : '#F59E0B', marginRight: 8 }} />
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {connected === true ? 'API подключён' : connected === false ? 'Моковые данные' : 'Проверка...'}
                </span>
            </div>
        </aside>
    )
}

// ═══════════════════════════════════════════
// TOP HEADER
// ═══════════════════════════════════════════
function TopHeader({ connected, cities, activeCity, onCityChange }) {
    const loc = useLocation()
    const titles = {
        '/': 'Дашборд', '/categories': 'Категории', '/products': 'Товары',
        '/orders': 'Заказы', '/banners': 'Баннеры', '/promos': 'Промокоды',
        '/delivery': 'Города и доставка', '/push': 'Push-уведомления', '/settings': 'Настройки сайта',
    }
    return (
        <header className="top-header">
            <div className="top-header-left">
                <h1>{titles[loc.pathname] || 'Дашборд'}</h1>
                {connected === false && (
                    <span style={{ fontSize: 11, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '3px 10px', borderRadius: 6 }}>
                        ⚠️ Backend не подключён — используются моковые данные
                    </span>
                )}
            </div>
            <div className="top-header-right">
                {cities.length > 0 && (
                    <div className="city-switcher" style={{ marginRight: 16 }}>
                        <select
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 12px', background: 'white', border: '1px solid #e5e7eb', color: '#374151' }}
                            value={activeCity?.id || ''}
                            onChange={(e) => {
                                const city = cities.find(c => c.id === Number(e.target.value))
                                if (city) onCityChange(city)
                            }}
                        >
                            <option value="" disabled>Выберите город...</option>
                            {cities.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="header-search">
                    <span className="icon">🔍</span>
                    <input placeholder="Поиск..." />
                </div>
                <div className="header-avatar">👤</div>
            </div>
        </header>
    )
}

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function DashboardPage({ showToast, activeCity }) {
    const nav = useNavigate()
    const [statsData, setStatsData] = useState(null)
    const [orders, setOrders] = useState([])
    const [period, setPeriod] = useState('today') // today, yesterday, week, month, year
    const [error, setError] = useState(null)

    useEffect(() => {
        if (activeCity) {
            setError(null)
            api.fetchStats(activeCity.id)
                .then(r => {
                    if (r) setStatsData(r)
                    else setError('API вернул пустой результат')
                })
                .catch(err => {
                    console.error('Stats fetch error:', err)
                    setError(err.message || 'Ошибка сети')
                })
            api.fetchOrders(activeCity.id).then(r => { if (r) setOrders(r) }).catch(() => { })
        }
    }, [activeCity])

    if (error) return (
        <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
            <h3 style={{ color: '#EF4444' }}>Ошибка загрузки статистики</h3>
            <p style={{ color: '#6B7280', marginTop: 8 }}>{error}</p>
            <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => window.location.reload()}>Попробовать снова</button>
        </div>
    )

    if (!statsData) return <div style={{ padding: 40, textAlign: 'center' }}>Загрузка статистики...</div>

    const currentStats = statsData[period] || statsData.today || {}

    // Calculate changes (simple logic: compare with previous period if possible, else 0%)
    // For "today", we compare with "yesterday"
    // For ranges, we just show raw numbers for now as "change" logic is complex without history
    const getChange = (key) => {
        if (period === 'today') {
            const now = statsData.today[key] || 0
            const prev = statsData.yesterday[key] || 0
            if (prev === 0) return now > 0 ? '+100%' : '0%'
            const diff = ((now - prev) / prev) * 100
            return (diff > 0 ? '+' : '') + diff.toFixed(0) + '%'
        }
        return ''
    }

    const stats = [
        { icon: '📦', label: 'Заказов', value: String(currentStats.count || 0), change: getChange('count'), up: !getChange('count').startsWith('-'), color: 'orange' },
        { icon: '💰', label: 'Выручка', value: Math.round(currentStats.revenue || 0) + '₴', change: getChange('revenue'), up: !getChange('revenue').startsWith('-'), color: 'green' },
        { icon: '👥', label: 'Новых клиентов', value: String(currentStats.newClients || 0), change: '', up: true, color: 'blue' },
        { icon: '⭐', label: 'Средний чек', value: Math.round(currentStats.avgCheck || 0) + '₴', change: '', up: true, color: 'red' },
    ]

    const periods = [
        { id: 'today', label: 'Сегодня' },
        { id: 'yesterday', label: 'Вчера' },
        { id: 'week', label: '7 дней' },
        { id: 'month', label: '30 дней' },
        { id: 'year', label: 'Год' },
    ]

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Period Tabs */}
            <div className="filter-tabs" style={{ marginBottom: 24, padding: 0, border: 'none', background: 'transparent' }}>
                {periods.map(p => (
                    <button
                        key={p.id}
                        className={`filter-tab ${period === p.id ? 'active' : ''}`}
                        onClick={() => setPeriod(p.id)}
                        style={{ padding: '8px 16px', borderRadius: 8 }}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Stat Cards */}
            <div className="stats-grid">
                {stats.map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-card-header">
                            <div className={`stat-card-icon ${s.color}`}>{s.icon}</div>
                            {s.change && <span className={`stat-card-change ${s.up ? 'up' : 'down'}`}>{s.change}</span>}
                        </div>
                        <div className="stat-card-value">{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
                <div className="table-card" style={{ padding: 24, height: 400 }}>
                    <div className="table-card-header" style={{ padding: '0 0 24px 0', border: 'none' }}>
                        <h2>Динамика выручки (30 дней)</h2>
                    </div>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={statsData.chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} tickFormatter={v => `${v / 1000}k`} />
                            <Tooltip
                                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={{ fill: 'rgba(255, 92, 0, 0.05)' }}
                            />
                            <Bar dataKey="revenue" fill="#FF5C00" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Mini Top Products or similar (placeholder for now, or just Orders below) */}
                <div className="table-card" style={{ padding: 0 }}>
                    <div className="table-card-header">
                        <h2>Последние заказы</h2>
                        <button className="btn btn-ghost btn-sm" onClick={() => nav('/orders')}>Все →</button>
                    </div>
                    <table style={{ marginTop: -1 }}>
                        <tbody>
                            {orders.slice(0, 5).map(o => (
                                <tr key={o.id} style={{ cursor: 'pointer', backgroundColor: o.status === 'done' ? 'var(--success-bg)' : 'transparent' }} onClick={() => nav('/orders')}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>#{o.id.slice(0, 8)}</div>
                                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{new Date(o.created_at).toLocaleTimeString().slice(0, 5)}</div>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700 }}>{Number(o.final_amount)}₴</div>
                                        <span className={`status status-${o.status === 'done' ? 'done' : o.status === 'new' ? 'new' : 'pending'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                                            {o.status === 'done' ? 'Вып' : o.status === 'new' ? 'Нов' : o.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}


function OrderStatus({ status }) {
    const map = {
        new: ['status-new', '🔵 Новый'],
        pending: ['status-new', '🔵 Ожидает'],
        cooking: ['status-pending', '🟡 Готовится'],
        preparing: ['status-pending', '🟡 Готовится'],
        delivering: ['status-active', '🟢 Доставляется'],
        in_delivery: ['status-active', '🟢 Доставляется'],
        done: ['status-done', '✅ Выполнен'],
        completed: ['status-done', '✅ Выполнен'],
        cancelled: ['status-cancelled', '❌ Отменён'],
    }
    const [cls, text] = map[status] || ['', status || '—']
    return <span className={`status ${cls}`}>{text}</span>
}

// ═══════════════════════════════════════════
// CATEGORIES PAGE
// ═══════════════════════════════════════════
function CategoriesPage({ showToast, activeCity }) {
    const [cats, setCats] = useState([])
    const [modal, setModal] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (activeCity) {
            api.fetchCategories(activeCity.id).then(r => {
                if (r) setCats(r);
                setLoading(false)
            }).catch(() => setLoading(false))
        }
    }, [activeCity])

    const toggleActive = async (id) => {
        const cat = cats.find(c => c.id === id)
        if (!cat) return
        const updated = await api.updateCategory(id, { is_active: !cat.is_active })
        if (updated) {
            setCats(prev => prev.map(c => c.id === id ? updated : c))
            showToast('Статус обновлён')
        }
    }
    const handleDelete = async (id) => {
        const result = await api.deleteCategory(id)
        setCats(prev => prev.filter(c => c.id !== id))
        showToast(result ? 'Категория удалена (API)' : 'Категория удалена (локально)')
    }

    const handleReorder = async (id, direction) => {
        try {
            await api.reorderCategory(id, direction);
            // Re-fetch categories to show updated order
            api.fetchCategories(activeCity.id).then(r => { if (r) setCats(r) });
        } catch (e) {
            showToast('Ошибка: ' + e.message);
        }
    }
    const handleSave = async (formData) => {
        const { products, count, ...cleanData } = formData
        if (formData.id) {
            const result = await api.updateCategory(formData.id, cleanData)
            if (result) setCats(prev => prev.map(c => c.id === formData.id ? result : c))
            showToast('Категория обновлена!')
        } else {
            const result = await api.createCategory({ ...cleanData, city_id: activeCity.id })
            if (result) setCats(prev => [...prev, result])
            showToast('Категория создана!')
        }
        setModal(null)
    }

    return (
        <>
            <div className="table-card">
                <div className="table-card-header">
                    <h2>Категории ({cats.length})</h2>
                    <button className="btn btn-primary" onClick={() => setModal({ name: '', icon: '' })}>+ Добавить</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}></th>
                            <th>Иконка</th>
                            <th>Название</th>
                            <th>Товаров</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cats.map((c, idx) => (
                            <tr key={c.id}>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <button className="btn-icon-sm" onClick={() => handleReorder(c.id, 'up')} disabled={idx === 0}>↑</button>
                                        <button className="btn-icon-sm" onClick={() => handleReorder(c.id, 'down')} disabled={idx === cats.length - 1}>↓</button>
                                    </div>
                                </td>
                                <td style={{ fontSize: 24 }}>
                                    {c.icon && (c.icon.includes('/') || c.icon.includes('http'))
                                        ? <img src={api.getImageUrl(c.icon)} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                        : c.icon}
                                </td>
                                <td className="table-name">{c.name}</td>
                                <td>{c.productsCount || 0}</td>
                                <td>
                                    <div className={`toggle ${c.is_active ? 'on' : ''}`} onClick={() => toggleActive(c.id)} />
                                </td>
                                <td>
                                    <div className="actions-cell">
                                        <button className="btn-icon-sm" onClick={() => setModal(c)}>✏️</button>
                                        <button className="btn-icon-sm" onClick={() => handleDelete(c.id)}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modal !== null && (
                <CategoryModal data={modal} onClose={() => setModal(null)} onSave={handleSave} />
            )}
        </>
    )
}

function CategoryModal({ data, onClose, onSave }) {
    const [form, setForm] = useState({ name: data.name || '', icon: data.icon || '' })
    const [uploading, setUploading] = useState(false)

    const handleUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setUploading(true)
        const result = await api.uploadFile(file)
        if (result && result.url) {
            setForm(prev => ({ ...prev, icon: result.url }))
        } else {
            alert('Ошибка загрузки')
        }
        setUploading(false)
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{data.id ? 'Редактировать категорию' : 'Новая категория'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Название</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Например: Роллы" />
                    </div>
                    {/* <div className="form-group">
                        <label>Иконка (emoji)</label>
                        <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="🍣" />
                    </div> */}
                    <div className="form-group">
                        <label>Изображение / Иконка</label>
                        <div className="file-upload" style={{ position: 'relative' }}>
                            {form.icon && (form.icon.includes('/') || form.icon.includes('http')) ? (
                                <img src={api.getImageUrl(form.icon)} alt="Preview" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 8 }} />
                            ) : (
                                <div style={{ fontSize: 24 }}>{form.icon || '📷'}</div>
                            )}
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{uploading ? 'Загрузка...' : 'Нажмите для загрузки или введите emoji'}</p>
                            <input type="file" accept="image/*" onChange={handleUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                        </div>
                        <input
                            value={form.icon}
                            onChange={e => setForm({ ...form, icon: e.target.value })}
                            placeholder="Или введите emoji (🍣)"
                            style={{ marginTop: 8 }}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
                    <button className="btn btn-primary" onClick={() => onSave({ ...data, ...form })}>Сохранить</button>
                </div>
            </div>
        </div>
    )
}



function BannerModal({ data, onClose, onSave }) {
    const [form, setForm] = useState({
        title: data.title || '',
        description: data.description || '',
        link: data.link || '',
        image_url: data.image_url || data.image || '',
        is_active: data.is_active ?? true
    })
    const [uploading, setUploading] = useState(false)

    const handleUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setUploading(true)
        const result = await api.uploadFile(file)
        if (result && result.url) {
            setForm(prev => ({ ...prev, image_url: result.url }))
        } else {
            alert('Ошибка загрузки')
        }
        setUploading(false)
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{data.id ? 'Редактировать баннер' : 'Новый баннер'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Изображение баннера</label>
                        <div className="file-upload" style={{ position: 'relative' }}>
                            {form.image_url ? (
                                <img src={api.getImageUrl(form.image_url)} alt="Preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                            ) : (
                                <div style={{ padding: 20, textAlign: 'center' }}>
                                    <div className="emoji">🖼️</div>
                                    {uploading ? 'Загрузка...' : 'Нажмите для загрузки'}
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Рекомендуемый размер: 1200×400px</div>
                    </div>
                    <div className="form-group">
                        <label>Заголовок</label>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Скидка 20% на сеты" />
                    </div>
                    <div className="form-group">
                        <label>Описание / Текст</label>
                        <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Только до конца недели..." />
                    </div>
                    <div className="form-group">
                        <label>Ссылка (URL или ID)</label>
                        <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="category/3" />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
                    <button className="btn btn-primary" onClick={() => onSave({ ...data, ...form })}>Сохранить</button>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════
// PRODUCTS PAGE
// ═══════════════════════════════════════════
function ProductsPage({ showToast, activeCity }) {
    const [items, setItems] = useState([])
    const [categories, setCategories] = useState([])
    const [selectedCatId, setSelectedCatId] = useState('all')
    const [modal, setModal] = useState(null)

    useEffect(() => {
        if (activeCity) {
            api.fetchProducts(activeCity.id).then(r => { if (r) setItems(r) })
            api.fetchCategories(activeCity.id).then(r => { if (r) setCategories(r) })
            setSelectedCatId('all') // Reset filter on city change
        }
    }, [activeCity])

    const filteredItems = selectedCatId === 'all'
        ? items
        : items.filter(p => p.category_id === selectedCatId || (p.category && p.category.id === selectedCatId))

    const toggleActive = async (id) => {
        const prod = items.find(p => p.id === id)
        if (!prod) return
        const updated = await api.updateProduct(id, { is_active: !prod.is_active })
        if (updated) {
            setItems(prev => prev.map(p => p.id === id ? updated : p))
            showToast('Статус обновлён')
        }
    }
    const handleDelete = async (id) => {
        if (!window.confirm('Удалить товар?')) return
        try {
            await api.deleteProduct(id)
            setItems(prev => prev.filter(p => p.id !== id))
            showToast('Товар удалён')
        } catch (e) {
            showToast('Ошибка при удалении: ' + e.message)
        }
    }

    const handleReorder = async (id, direction) => {
        try {
            await api.reorderProduct(id, direction);
            // Re-fetch products to show updated order
            api.fetchProducts(activeCity.id).then(r => { if (r) setItems(r) });
        } catch (e) {
            showToast('Ошибка: ' + e.message);
        }
    }
    const handleSave = async (formData) => {
        const payload = {
            ...formData,
            image_url: formData.image_url || formData.image,
            description: formData.description || formData.desc,
            category_id: formData.category_id ? Number(formData.category_id) : (formData.category ? Number(formData.category) : null), // Try ID first
            city_id: activeCity.id,
            price: Number(formData.price),
            is_active: formData.is_active !== undefined ? formData.is_active : (formData.active !== undefined ? formData.active : true)
        }

        if (!payload.category_id) {
            showToast('❌ Ошибка: Выберите категорию!')
            return
        }

        // Clean up UI-specific fields if needed, but backend ignores extras usually.
        // Or explicitly construct clean payload:
        /*
        const cleanPayload = {
            name: payload.name,
            price: payload.price,
            image_url: payload.image_url,
            description: payload.description,
            category_id: payload.category_id,
            city_id: payload.city_id,
            is_active: payload.is_active !== undefined ? payload.is_active : true,
            is_hit: payload.is_hit,
            is_new: payload.is_new,
            is_promo: payload.is_promo,
            options: payload.options
        }
        */

        if (formData.id) {
            const result = await api.updateProduct(formData.id, payload)
            if (result) setItems(prev => prev.map(p => p.id === formData.id ? result : p))
            showToast('Товар обновлён!')
        } else {
            const result = await api.createProduct(payload)
            if (result) setItems(prev => [...prev, result])
            showToast('Товар создан!')
        }
        setModal(null)
    }

    return (
        <>
            <div className="table-card">
                <div className="table-card-header" style={{ borderBottom: 'none' }}>
                    <h2>Товары ({filteredItems.length})</h2>
                    <button className="btn btn-primary" onClick={() => setModal({})}>+ Добавить товар</button>
                </div>

                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${selectedCatId === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedCatId('all')}
                    >
                        Все товары
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`filter-tab ${selectedCatId === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCatId(cat.id)}
                        >
                            {cat.icon && <span style={{ marginRight: 8 }}>{cat.icon}</span>}
                            {cat.name}
                        </button>
                    ))}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}></th>
                            <th>Фото</th>
                            <th>Название</th>
                            <th>Категория</th>
                            <th>Цена</th>
                            <th>Метки</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((p, idx) => (
                            <tr key={p.id}>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <button
                                            className="btn-icon-sm"
                                            onClick={() => handleReorder(p.id, 'up')}
                                            disabled={selectedCatId === 'all' || idx === 0}
                                            title={selectedCatId === 'all' ? "Для изменения порядка выберите конкретную категорию" : ""}
                                        >↑</button>
                                        <button
                                            className="btn-icon-sm"
                                            onClick={() => handleReorder(p.id, 'down')}
                                            disabled={selectedCatId === 'all' || idx === filteredItems.length - 1}
                                            title={selectedCatId === 'all' ? "Для изменения порядка выберите конкретную категорию" : ""}
                                        >↓</button>
                                    </div>
                                </td>
                                <td><img className="table-img" src={api.getImageUrl(p.image || p.image_url)} alt={p.name} /></td>
                                <td>
                                    <div className="table-name">{p.name}</div>
                                    <div className="table-desc">{p.description || p.desc}</div>
                                </td>
                                <td>{p.category?.name || p.category}</td>
                                <td><strong>{p.price}₴</strong></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {p.is_hit && <span className="status status-cancelled" style={{ fontSize: 11 }}>🔥 Хит</span>}
                                        {p.is_new && <span className="status status-new" style={{ fontSize: 11 }}>✨ Новинка</span>}
                                        {p.is_promo && <span className="status status-active" style={{ fontSize: 11 }}>🏷️ Акция</span>}
                                    </div>
                                </td>
                                <td>
                                    <div className={`toggle ${p.is_active ? 'on' : ''}`} onClick={() => toggleActive(p.id)} />
                                </td>
                                <td>
                                    <div className="actions-cell">
                                        <button className="btn-icon-sm" onClick={() => setModal(p)}>✏️</button>
                                        <button className="btn-icon-sm" onClick={() => handleDelete(p.id)}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modal !== null && (
                <ProductModal data={modal} categories={categories} onClose={() => setModal(null)} onSave={handleSave} />
            )}
        </>
    )
}

function ProductModal({ data, categories, onClose, onSave }) {
    const [form, setForm] = useState({
        name: data.name || '', description: data.description || data.desc || '',
        price: data.price || '', category: data.category || categories[0]?.name || '',
        category_id: data.category_id || categories[0]?.id,
        is_hit: data.is_hit || false, is_new: data.is_new || false, is_promo: data.is_promo || false,
        image_url: data.image_url || data.image || '',
        is_active: data.is_active ?? true,
    })
    const [uploading, setUploading] = useState(false)

    // Ensure category is selected if missing
    useEffect(() => {
        if (!form.category_id && categories.length > 0) {
            setForm(prev => ({ ...prev, category_id: categories[0].id, category: categories[0].name }))
        }
    }, [categories])

    const handleUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setUploading(true)
        const result = await api.uploadFile(file)
        if (result && result.url) {
            setForm(prev => ({ ...prev, image_url: result.url }))
        } else {
            alert('Ошибка загрузки')
        }
        setUploading(false)
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{data.id ? 'Редактировать товар' : 'Новый товар'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Фото</label>
                        <div className="file-upload" style={{ position: 'relative' }}>
                            {form.image_url ? (
                                <img src={api.getImageUrl(form.image_url)} alt="Preview" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }} />
                            ) : (
                                <div style={{ padding: 40, textAlign: 'center' }}>
                                    <div className="emoji">📷</div>
                                    {uploading ? 'Загрузка...' : 'Нажмите для загрузки'}
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Название</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Филадельфия Классик" />
                    </div>
                    <div className="form-group">
                        <label>Описание</label>
                        <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Состав, ингредиенты..." />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Цена (₴)</label>
                            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} placeholder="289" />
                        </div>
                        <div className="form-group">
                            <label>Категория</label>
                            <select
                                value={form.category_id}
                                onChange={e => {
                                    const cat = categories.find(c => String(c.id) === e.target.value)
                                    setForm({ ...form, category_id: Number(e.target.value), category: cat ? cat.name : '' })
                                }}
                            >
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                        <label className="form-checkbox"><input type="checkbox" checked={form.is_hit} onChange={e => setForm({ ...form, is_hit: e.target.checked })} /> 🔥 Хит</label>
                        <label className="form-checkbox"><input type="checkbox" checked={form.is_new} onChange={e => setForm({ ...form, is_new: e.target.checked })} /> ✨ Новинка</label>
                        <label className="form-checkbox"><input type="checkbox" checked={form.is_promo} onChange={e => setForm({ ...form, is_promo: e.target.checked })} /> 🏷️ Акция</label>
                        <label className="form-checkbox"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Включен</label>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
                    <button className="btn btn-primary" onClick={() => onSave({ ...data, ...form })}>Сохранить</button>
                </div>
            </div>
        </div>
    )
}

// ─── New Order Overlay ───
function NewOrderOverlay({ count, onClose }) {
    return (
        <div className="new-order-alert-overlay">
            <div className="new-order-alert-content">
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <span className="new-order-alert-icon">🍱🔥</span>
                    <h1 className="new-order-alert-title">У вас новый заказ!</h1>
                    <p style={{ fontSize: 22, color: '#64748B', marginBottom: 40, fontWeight: 500 }}>
                        Поступило заказов: <span style={{ color: '#FF5C00', fontWeight: 900, borderBottom: '3px solid #FF5C00' }}>{count}</span>
                    </p>
                    <button className="new-order-alert-btn" onClick={onClose}>ПОНЯЛ, СПАСИБО!</button>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════
// ORDERS PAGE
// ═══════════════════════════════════════════
function OrdersPage({ showToast, activeCity }) {
    const [orders, setOrders] = useState([])
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [newOrderAlert, setNewOrderAlert] = useState(null) // null or count
    const lastOrderIds = useRef(new Set())
    const isFirstLoad = useRef(true)

    const playSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
        audio.play().catch(e => console.warn('Audio auto-play blocked:', e))
    }

    useEffect(() => {
        if (!activeCity) return

        const fetch = () => api.fetchOrders(activeCity.id).then(r => {
            if (r) {
                // Check for new orders
                if (!isFirstLoad.current) {
                    const newIds = r.map(o => o.id).filter(id => !lastOrderIds.current.has(id))
                    if (newIds.length > 0) {
                        playSound()
                        setNewOrderAlert(newIds.length)
                        showToast(`🔔 Получено новых заказов: ${newIds.length}`)
                    }
                }

                // Update refs and state
                lastOrderIds.current = new Set(r.map(o => o.id))
                isFirstLoad.current = false
                setOrders(r)
            }
        })

        fetch()
        const interval = setInterval(fetch, 10000)
        return () => clearInterval(interval)
    }, [activeCity])

    const updateStatus = async (id, newStatus) => {
        const result = await api.updateOrderStatus(id, newStatus)
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
        showToast(`Статус заказа ${id} обновлён${result ? ' (API)' : ' (локально)'}`)
    }

    return (
        <div className="table-card">
            <div className="table-card-header">
                <h2>Заказы ({orders.length})</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm">📥 Экспорт</button>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Клиент</th>
                        <th>Телефон</th>
                        <th>Позиции</th>
                        <th>Сумма</th>
                        <th>Оплата</th>
                        <th>Статус</th>
                        <th>Время</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(orders) && orders.map(o => {
                        const oStatus = o.status || o.order_status || 'new'
                        const oTotal = o.total || o.final_amount || 0
                        const oPay = o.payment || o.payment_method || 'cash'
                        return (
                            <tr key={o.id} style={(oStatus === 'done' || oStatus === 'completed') ? { backgroundColor: 'var(--success-bg)' } : {}}>
                                <td><strong>{String(o.id).slice(0, 8)}</strong></td>
                                <td className="table-name">{o.customer || o.user?.name || 'Гость'}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{o.phone || o.user?.phone || '—'}</td>
                                <td>{Array.isArray(o.items) ? o.items.length : (o.items || 0)} шт</td>
                                <td><strong>{Math.round(oTotal)}₴</strong></td>
                                <td>
                                    <span className="status status-inactive" style={{ fontSize: 11 }}>
                                        {oPay === 'cash' || oPay === 'cash_on_delivery' ? '💵 Нал' : oPay === 'card' ? '💳 Карта' : oPay === 'leekpay' ? '🏦 LeekPay' : '🌐 WayForPay'}
                                    </span>
                                </td>
                                <td><OrderStatus status={oStatus} /></td>
                                <td style={{ color: 'var(--text-tertiary)' }}>{o.time || (o.created_at ? new Date(o.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : '—')}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <button className="btn-icon-sm" title="Просмотр" onClick={() => setSelectedOrder(o)}>👁️</button>
                                        <select
                                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }}
                                            value={oStatus}
                                            onChange={(e) => updateStatus(o.id, e.target.value)}
                                        >
                                            <option value="new">Новый</option>
                                            <option value="cooking">Готовится</option>
                                            <option value="delivering">Доставляется</option>
                                            <option value="done">Выполнен</option>
                                            <option value="cancelled">Отменён</option>
                                        </select>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            {selectedOrder && (
                <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Заказ #{String(selectedOrder.id).slice(0, 8)}</h2>
                            <button className="modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Клиент</div>
                                    <div style={{ fontWeight: 600 }}>{selectedOrder.customer || selectedOrder.user?.name || 'Гость'}</div>
                                    <div>{selectedOrder.phone || selectedOrder.user?.phone || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Доставка</div>
                                    <div style={{ fontWeight: 600 }}>{selectedOrder.address_text || selectedOrder.address?.street || 'Самовывоз / Не указан'}</div>
                                    <div>{selectedOrder.courier_comment}</div>
                                </div>
                            </div>

                            <h4 style={{ marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Состав заказа</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {selectedOrder.items?.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <div>{item.product?.name || 'Товар удален'}</div>
                                            {item.selected_options && item.selected_options.length > 0 && (
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>+ опции</div>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div>{item.quantity} x {item.price_at_purchase}₴</div>
                                            <div style={{ fontWeight: 600 }}>{item.quantity * item.price_at_purchase}₴</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Сумма товаров:</span>
                                    <span>{selectedOrder.total_amount}₴</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Доставка:</span>
                                    <span>{selectedOrder.delivery_fee}₴</span>
                                </div>
                                {selectedOrder.discount_amount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                                        <span>Скидка:</span>
                                        <span>-{selectedOrder.discount_amount}₴</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, marginTop: 8 }}>
                                    <span>Итого:</span>
                                    <span>{selectedOrder.final_amount}₴</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Закрыть</button>
                        </div>
                    </div>
                </div>
            )}

            {newOrderAlert && (
                <NewOrderOverlay count={newOrderAlert} onClose={() => setNewOrderAlert(null)} />
            )}
        </div>
    )
}

// ═══════════════════════════════════════════
// BANNERS PAGE
// ═══════════════════════════════════════════
function BannersPage({ showToast, activeCity }) {
    const [items, setItems] = useState([])
    const [modal, setModal] = useState(null)

    useEffect(() => {
        if (activeCity) {
            api.fetchBanners(activeCity.id).then(r => { if (r) setItems(r) })
        }
    }, [activeCity])

    const toggleActive = (id) => {
        setItems(prev => prev.map(b => b.id === id ? { ...b, is_active: !b.is_active } : b))
        showToast('Статус обновлён')
    }
    const handleDelete = async (id) => {
        await api.deleteBanner(id)
        setItems(prev => prev.filter(b => b.id !== id))
        showToast('Баннер удалён')
    }
    const handleSave = async (formData) => {
        // Clean data: remove relations and old field names
        const { category, options, image, desc, ...cleanData } = formData

        if (formData.id) {
            const result = await api.updateBanner(formData.id, cleanData)
            if (result) {
                setItems(prev => prev.map(b => b.id === formData.id ? result : b))
                showToast('Баннер обновлён!')
            }
        } else {
            const result = await api.createBanner({ ...cleanData, city_id: activeCity.id })
            if (result) {
                setItems(prev => [...prev, result])
                showToast('Баннер создан!')
            }
        }
        setModal(null)
    }

    return (
        <>
            <div className="table-card">
                <div className="table-card-header">
                    <h2>Баннеры ({items.length})</h2>
                    <button className="btn btn-primary" onClick={() => setModal({ title: '', link: '' })}>+ Добавить баннер</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}></th>
                            <th>Фото</th>
                            <th>Название</th>
                            <th>Ссылка</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(b => (
                            <tr key={b.id}>
                                <td><span className="drag-handle">⠿</span></td>
                                <td><img className="table-img" src={api.getImageUrl(b.image_url || b.image)} alt={b.title} /></td>
                                <td className="table-name">{b.title}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{b.link}</td>
                                <td>
                                    <div className={`toggle ${b.is_active ? 'on' : ''}`} onClick={() => toggleActive(b.id)} />
                                </td>
                                <td>
                                    <div className="actions-cell">
                                        <button className="btn-icon-sm" onClick={() => setModal(b)}>✏️</button>
                                        <button className="btn-icon-sm" onClick={() => handleDelete(b.id)}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modal !== null && (
                <BannerModal data={modal} onClose={() => setModal(null)} onSave={handleSave} />
            )}
        </>
    )
}



// ═══════════════════════════════════════════
// PROMOCODES PAGE
// ═══════════════════════════════════════════
function PromosPage({ showToast, activeCity }) {
    const [items, setItems] = useState([])
    const [modal, setModal] = useState(null)
    const [products, setProducts] = useState([])

    useEffect(() => {
        if (activeCity) {
            api.fetchPromocodes(activeCity.id).then(r => { if (r) setItems(r) })
            api.fetchProducts(activeCity.id).then(r => { if (r) setProducts(r) })
        }
    }, [activeCity])

    const handleDelete = async (id) => {
        await api.deletePromocode(id)
        setItems(prev => prev.filter(p => p.id !== id))
        showToast('Промокод удалён')
    }
    const handleSave = async (data) => {
        await api.createPromocode({ ...data, city_id: activeCity.id })
        const updated = await api.fetchPromocodes(activeCity.id)
        if (updated) setItems(updated)

        setModal(null)
        showToast('Промокод сохранён!')
    }

    return (
        <>
            <div className="table-card">
                <div className="table-card-header">
                    <h2>Промокоды ({items.length})</h2>
                    <button className="btn btn-primary" onClick={() => setModal({ code: '', type: 'percentage', value: '', usageLimit: '', expires: '' })}>+ Создать промокод</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Код</th>
                            <th>Тип</th>
                            <th>Скидка</th>
                            <th>Мин. заказ</th>
                            <th>Срок</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(p => (
                            <tr key={p.id}>
                                <td><strong style={{ letterSpacing: 1 }}>{p.code}</strong></td>
                                <td>
                                    {(p.discount_type || p.type) === 'percentage' ? 'Процент' :
                                        (p.discount_type || p.type) === 'fixed' ? 'Фикс' : 'Подарок'}
                                </td>
                                <td>
                                    <strong>
                                        {(p.discount_type || p.type) === 'percentage' ? `${p.discount_value || p.value}%` :
                                            (p.discount_type || p.type) === 'fixed' ? `${p.discount_value || p.value}₴` :
                                                (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <img
                                                            src={api.getImageUrl(p.gift_product?.image_url || p.gift_product?.image)}
                                                            style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', background: '#f5f5f5' }}
                                                            alt=""
                                                            onError={e => e.target.style.display = 'none'}
                                                        />
                                                        <span>{p.gift_price}₴ + {p.gift_product?.name || 'Товар'}</span>
                                                    </div>
                                                )
                                        }
                                    </strong>
                                </td>
                                <td style={{ fontSize: 13 }}>{p.min_order_amount || 0}₴</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{p.expires_at || p.expires || p.valid_to || '—'}</td>
                                <td>
                                    <div className="status-container" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div
                                            className={`toggle ${p.is_visible ? 'on' : ''}`}
                                            onClick={async () => {
                                                const updatedPromo = { ...p, is_visible: !p.is_visible };
                                                delete updatedPromo.gift_product;
                                                delete updatedPromo.city;
                                                await api.createPromocode(updatedPromo);
                                                const updated = await api.fetchPromocodes(activeCity.id);
                                                if (updated) setItems(updated);
                                                showToast('Видимость обновлена');
                                            }}
                                        />
                                        <span style={{ fontSize: 12 }}>{p.is_visible ? 'В приложении' : 'Скрыт'}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="actions-cell">
                                        <button className="btn-icon-sm" onClick={() => setModal(p)}>✏️</button>
                                        <button className="btn-icon-sm" onClick={() => handleDelete(p.id)}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modal !== null && (
                <PromoModal data={modal} products={products} onClose={() => setModal(null)} onSave={handleSave} />
            )}
        </>
    )
}

function PromoModal({ data, products, onClose, onSave }) {
    const [form, setForm] = useState({
        code: data.code || '',
        discount_type: data.discount_type || data.type || 'percentage',
        discount_value: data.discount_value || data.value || '',
        usage_limit: 1000000,
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString().slice(0, 16) : '',
        min_order_amount: data.min_order_amount || 0,
        gift_product_id: data.gift_product_id || '',
        gift_price: data.gift_price || 0,
        is_visible: data.is_visible ?? false,
    });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{data.id ? 'Редактировать промокод' : 'Новый промокод'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Код промокода</label>
                        <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME15" style={{ textTransform: 'uppercase', letterSpacing: 2 }} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Тип скидки</label>
                            <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}>
                                <option value="percentage">Процент (%)</option>
                                <option value="fixed">Фиксированная сумма (₴)</option>
                                <option value="gift">Подарок за заказ 🎁</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{form.discount_type === 'gift' ? 'Цена подарка (₴)' : 'Размер скидки'}</label>
                            <input type="number" value={form.discount_type === 'gift' ? form.gift_price : form.discount_value}
                                onChange={e => setForm({ ...form, [form.discount_type === 'gift' ? 'gift_price' : 'discount_value']: Number(e.target.value) })}
                                placeholder={form.discount_type === 'gift' ? '5' : '15'} />
                        </div>
                    </div>

                    {form.discount_type === 'gift' && (
                        <div className="form-group" style={{ marginTop: 16 }}>
                            <label>Выберите подарочный продукт</label>
                            <select value={form.gift_product_id} onChange={e => setForm({ ...form, gift_product_id: e.target.value })}>
                                <option value="">-- Выберите из меню --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.price}₴)</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-row" style={{ marginTop: 16 }}>
                        <div className="form-group">
                            <label>Действует до (Таймер) ⏱️</label>
                            <input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 22 }}>
                                <input type="checkbox" checked={form.is_visible} onChange={e => setForm({ ...form, is_visible: e.target.checked })} />
                                <b>Показывать в приложении</b>
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Мин. сумма заказа (₴)</label>
                        <input type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: Number(e.target.value) })} placeholder="500" />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
                    <button className="btn btn-primary" onClick={() => {
                        const payload = { ...data, ...form };
                        if (payload.discount_type === 'gift') {
                            payload.discount_value = 0;
                            payload.gift_price = Number(payload.gift_price);
                        } else {
                            payload.discount_value = Number(payload.discount_value);
                            payload.gift_price = 0;
                            payload.gift_product_id = null;
                        }
                        onSave(payload);
                    }}>Сохранить</button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// SETTINGS PAGE (Global: Logo, etc.)
// ═══════════════════════════════════════════
function SettingsPage({ showToast, activeCity }) {
    const [settings, setSettings] = useState({
        logo_url: '',
    })
    const [citySettings, setCitySettings] = useState({
        delivery_time: '',
        support_phone: '',
        working_hours: '',
        work_start_time: '',
        work_end_time: '',
        delivery_fee: 0,
        min_order_amount: 0
    })
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        const load = async () => {
            const s = await api.fetchSettings()
            if (s) setSettings(prev => ({ ...prev, ...s }))

            if (activeCity) {
                setCitySettings({
                    delivery_time: activeCity.delivery_time || '',
                    support_phone: activeCity.support_phone || '',
                    working_hours: activeCity.working_hours || '',
                    work_start_time: activeCity.work_start_time || '',
                    work_end_time: activeCity.work_end_time || '',
                    delivery_fee: activeCity.delivery_fee || 0,
                    min_order_amount: activeCity.min_order_amount || 0
                })
            }
            setLoading(false)
        }
        load()
    }, [activeCity])

    const handleUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setUploading(true)
        const result = await api.uploadFile(file)
        if (result && result.url) {
            setSettings(prev => ({ ...prev, logo_url: result.url }))
        } else {
            alert('Ошибка загрузки')
        }
        setUploading(false)
    }

    const saveSettings = async () => {
        // Save global
        for (const key in settings) {
            await api.updateSetting(key, settings[key])
        }
        // Save city-specific
        if (activeCity) {
            await api.updateCity(activeCity.id, citySettings)
            showToast(`Настройки для ${activeCity.name} сохранены!`)
            setTimeout(() => window.location.reload(), 1000)
        } else {
            showToast('Настройки сохранены!')
            setTimeout(() => window.location.reload(), 1000)
        }
    }

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Загрузка...</div>

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <div className="table-card">
                <div className="table-card-header" style={{ borderBottom: '1px solid #eee' }}>
                    <h2>⚙️ Настройки сайта</h2>
                    <button className="btn btn-primary" onClick={saveSettings}>Сохранить</button>
                </div>
                <div style={{ padding: 24 }}>
                    <div className="form-group">
                        <label>Логотип приложения</label>
                        <div className="file-upload" style={{ position: 'relative', maxWidth: 300 }}>
                            {settings.logo_url ? (
                                <img src={api.getImageUrl(settings.logo_url)} alt="Logo" style={{ width: '100%', height: 120, objectFit: 'contain', background: '#f5f5f5', borderRadius: 8, padding: 8 }} />
                            ) : (
                                <div style={{ padding: 20, textAlign: 'center', background: '#f5f5f5', borderRadius: 8 }}>
                                    <div style={{ fontSize: 32 }}>🖼️</div>
                                    {uploading ? 'Загрузка...' : 'Загрузить логотип'}
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                        </div>
                        <p style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>Будет отображаться в шапке мобильного приложения. Рекомендуется PNG с прозрачным фоном.</p>
                    </div>

                    {activeCity && (
                        <>
                            <h3 style={{ marginTop: 32, marginBottom: 16, pb: 8, borderBottom: '1px solid #eee' }}>📍 Настройки города: {activeCity.name}</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Стоимость доставки (₴)</label>
                                    <input
                                        type="number"
                                        value={citySettings.delivery_fee}
                                        onChange={e => setCitySettings({ ...citySettings, delivery_fee: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Миним. заказ (₴)</label>
                                    <input
                                        type="number"
                                        value={citySettings.min_order_amount}
                                        onChange={e => setCitySettings({ ...citySettings, min_order_amount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Время доставки</label>
                                    <input
                                        value={citySettings.delivery_time}
                                        onChange={e => setCitySettings({ ...citySettings, delivery_time: e.target.value })}
                                        placeholder="30–50 мин"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Телефон поддержки города</label>
                                    <input
                                        value={citySettings.support_phone}
                                        onChange={e => setCitySettings({ ...citySettings, support_phone: e.target.value })}
                                        placeholder="+380..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Время работы</label>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <input
                                            type="time"
                                            value={citySettings.work_start_time}
                                            onChange={e => setCitySettings({ ...citySettings, work_start_time: e.target.value, working_hours: `${e.target.value} - ${citySettings.work_end_time}` })}
                                        />
                                        <input
                                            type="time"
                                            value={citySettings.work_end_time}
                                            onChange={e => setCitySettings({ ...citySettings, work_end_time: e.target.value, working_hours: `${citySettings.work_start_time} - ${e.target.value}` })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════
// DELIVERY PAGE
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════

function DeliveryPage({ showToast, activeCity, onCityUpdated }) {
    const [cities, setCities] = useState([])
    const [modal, setModal] = useState(null)
    const [loading, setLoading] = useState(true)
    const [syncModal, setSyncModal] = useState(null)

    useEffect(() => {
        const load = async () => {
            const c = await api.fetchCities()
            if (c) setCities(c)
            setLoading(false)
        }
        load()
    }, [])

    const handleSaveCity = async (data) => {
        if (data.id) {
            const res = await api.updateCity(data.id, data)
            if (res) setCities(prev => prev.map(c => c.id === data.id ? res : c))
        } else {
            const res = await api.createCity(data)
            if (res) setCities(prev => [...prev, res])
        }
        setModal(null)
        showToast('Город сохранён')
    }

    const deleteCity = async (id) => {
        if (!window.confirm('Удалить город?')) return
        try {
            await api.deleteCity(id)
            setCities(prev => prev.filter(c => c.id !== id))
            showToast('Город удалён')
        } catch (e) {
            showToast('Ошибка при удалении: ' + e.message)
        }
    }

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Загрузка...</div>

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <div className="table-card">
                <div className="table-card-header">
                    <h2>Города доставки</h2>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-secondary btn-sm" onClick={async () => {
                            if (window.confirm('Это назначит все текущие категории и товары первому городу в списке. Продолжить?')) {
                                const res = await api.migrateMenu();
                                if (res && res.success) showToast(`Успешно! Все данные привязаны к городу ${res.city}`);
                                else showToast('Ошибка миграции');
                            }
                        }}>📦 Привязать данные</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSyncModal(true)}>🔄 Синхронизация</button>
                        <button className="btn btn-secondary btn-sm" onClick={async () => {
                            if (window.confirm('Это скопирует меню, баннеры и настройки из первого города во ВСЕ другие города. Данные в других городах будут перезаписаны. Продолжить?')) {
                                const res = await api.syncAllCities();
                                if (res && res.success) showToast(`Успешно синхронизировано ${res.count} городов!`);
                                else showToast('Ошибка синхронизации');
                            }
                        }}>✨ Синхронизировать всё</button>
                        <button className="btn btn-primary btn-sm" onClick={() => setModal({ name: '', is_active: true })}>+ Добавить город</button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Город</th>
                            <th>Доставка (₴)</th>
                            <th>Мин. заказ (₴)</th>
                            <th>Время</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cities.map(c => (
                            <tr key={c.id}>
                                <td className="table-name">{c.name}</td>
                                <td>{c.delivery_fee}₴</td>
                                <td>{c.min_order_amount}₴</td>
                                <td className="table-desc">{c.delivery_time}</td>
                                <td>
                                    <span className={`status ${c.is_active ? 'status-active' : 'status-inactive'}`}>
                                        <span className="status-dot" />
                                        {c.is_active ? 'Активен' : 'Выкл'}
                                    </span>
                                </td>
                                <td>
                                    <div className="actions-cell">
                                        <button className="btn-icon-sm" onClick={() => setModal(c)}>✏️</button>
                                        <button className="btn-icon-sm" onClick={() => deleteCity(c.id)}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modal && (
                <CityModal data={modal} onClose={() => setModal(null)} onSave={handleSaveCity} />
            )}

            {syncModal && (
                <SyncMenuModal
                    cities={cities}
                    onClose={() => setSyncModal(null)}
                    onSync={async (from, to) => {
                        const res = await api.syncMenu(from, to);
                        if (res && res.success) showToast('Меню успешно скопировано!');
                        else showToast('Ошибка синхронизации');
                        setSyncModal(null);
                    }}
                />
            )}
        </div>
    )
}

function SyncMenuModal({ cities, onClose, onSync }) {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <div className="modal-header">
                    <h2>Копировать меню</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                        Эта функция скопирует все категории и товары со всеми опциями из одного города в другой.
                    </p>
                    <div className="form-group">
                        <label>Откуда копировать</label>
                        <select value={from} onChange={e => setFrom(e.target.value)}>
                            <option value="">Выберите источник...</option>
                            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Куда копировать</label>
                        <select value={to} onChange={e => setTo(e.target.value)}>
                            <option value="">Выберите цель...</option>
                            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
                    <button
                        className="btn btn-primary"
                        disabled={!from || !to || from === to}
                        onClick={() => onSync(Number(from), Number(to))}
                    >
                        Начать синхронизацию
                    </button>
                </div>
            </div>
        </div>
    )
}

function CityModal({ data, onClose, onSave }) {
    const [form, setForm] = useState({
        name: data.name || '',
        is_active: data.is_active ?? true,
        delivery_fee: data.delivery_fee ?? 0,
        min_order_amount: data.min_order_amount ?? 0,
        delivery_time: data.delivery_time || '',
        support_phone: data.support_phone || '',
        work_start_time: data.work_start_time || '10:00',
        work_end_time: data.work_end_time || '22:00',
        payment_methods: Array.isArray(data.payment_methods) ? data.payment_methods : (typeof data.payment_methods === 'string' ? data.payment_methods.split(',') : ['cash', 'card_online', 'terminal'])
    })
    const [points, setPoints] = useState([])

    useEffect(() => {
        if (data.id) {
            api.fetchPickupPoints(data.id).then(res => {
                if (res) setPoints(res)
            })
        }
    }, [data.id])

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                <div className="modal-header">
                    <h2>{data.id ? 'Редактировать город' : 'Новый город'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Название города</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Например: Киев" />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Доставка (₴)</label>
                            <input type="number" value={form.delivery_fee} onChange={e => setForm({ ...form, delivery_fee: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Мин. заказ (₴)</label>
                            <input type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Время доставки</label>
                            <input value={form.delivery_time} onChange={e => setForm({ ...form, delivery_time: e.target.value })} placeholder="40-60 мин" />
                        </div>
                        <div className="form-group">
                            <label>Телефон поддержки</label>
                            <input value={form.support_phone} onChange={e => setForm({ ...form, support_phone: e.target.value })} placeholder="+380..." />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Время работы (с - до)</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <input type="time" value={form.work_start_time} onChange={e => setForm({ ...form, work_start_time: e.target.value })} />
                            <input type="time" value={form.work_end_time} onChange={e => setForm({ ...form, work_end_time: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Доступные методы оплаты</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                            {[
                                { id: 'cash', label: '💵 Наличными' },
                                { id: 'card_online', label: '💳 Картой на сайте' },
                                { id: 'terminal', label: '📱 Картой при получении' }
                            ].map(method => (
                                <label key={method.id} className="form-checkbox" style={{ fontSize: 14 }}>
                                    <input
                                        type="checkbox"
                                        checked={form.payment_methods.includes(method.id)}
                                        onChange={e => {
                                            const newMethods = e.target.checked
                                                ? [...form.payment_methods, method.id]
                                                : form.payment_methods.filter(m => m !== method.id)
                                            setForm({ ...form, payment_methods: newMethods })
                                        }}
                                    />
                                    {method.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-checkbox">
                            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                            Активен для доставки
                        </label>
                    </div>

                    {data.id && (
                        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #eee' }}>
                            <h3 style={{ fontSize: 16, marginBottom: 12 }}>📍 Точки самовывоза</h3>

                            <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                                {points.map(p => (
                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', padding: '8px 12px', borderRadius: 8 }}>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{p.name}</div>
                                            <div style={{ fontSize: 12, color: '#666' }}>{p.address}</div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Удалить точку?')) {
                                                    await api.deletePickupPoint(p.id)
                                                    setPoints(points.filter(x => x.id !== p.id))
                                                }
                                            }}
                                            style={{ border: 'none', background: 'transparent', color: '#dc3545', cursor: 'pointer', fontSize: 16 }}
                                        >✕</button>
                                    </div>
                                ))}
                                {points.length === 0 && <div style={{ color: '#999', fontSize: 13, fontStyle: 'italic' }}>Нет точек самовывоза</div>}
                            </div>

                            <div style={{ display: 'grid', gap: 8, padding: 12, border: '1px dashed #ddd', borderRadius: 8 }}>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>Добавить точку</div>
                                <input id="new_point_name" placeholder="Название (напр. Центр)" style={{ fontSize: 14, padding: 8, border: '1px solid #ddd', borderRadius: 6 }} />
                                <input id="new_point_addr" placeholder="Адрес (напр. ул. Ленина 1)" style={{ fontSize: 14, padding: 8, border: '1px solid #ddd', borderRadius: 6 }} />
                                <button
                                    className="btn btn-sm"
                                    onClick={async () => {
                                        const nameEl = document.getElementById('new_point_name')
                                        const addrEl = document.getElementById('new_point_addr')
                                        if (!nameEl.value || !addrEl.value) return alert('Заполните оба поля')

                                        try {
                                            const newPoint = await api.createPickupPoint({
                                                city_id: data.id,
                                                name: nameEl.value,
                                                address: addrEl.value
                                            })
                                            setPoints([...points, newPoint])
                                            nameEl.value = ''
                                            addrEl.value = ''
                                        } catch (e) {
                                            alert('Ошибка создания')
                                        }
                                    }}
                                    style={{ background: '#eee', color: '#333' }}
                                >
                                    + Добавить
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
                    <button className="btn btn-primary" onClick={() => onSave({ ...data, ...form })}>Сохранить</button>
                </div>
            </div>
        </div >
    )
}

// ═══════════════════════════════════════════
// PUSH NOTIFICATIONS PAGE
// ═══════════════════════════════════════════
function PushPage({ showToast }) {
    const [segment, setSegment] = useState('all')

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <div className="table-card">
                <div className="table-card-header"><h2>Отправить уведомление</h2></div>
                <div style={{ padding: 24, display: 'grid', gap: 16 }}>
                    <div className="form-group">
                        <label>Аудитория</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {[
                                { id: 'all', label: '👥 Все пользователи' },
                                { id: 'active', label: '🔥 Активные' },
                                { id: 'one', label: '👤 Один пользователь' },
                            ].map(s => (
                                <button
                                    key={s.id}
                                    className={`btn ${segment === s.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                    onClick={() => setSegment(s.id)}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {segment === 'one' && (
                        <div className="form-group">
                            <label>Телефон или ID пользователя</label>
                            <input placeholder="+380 93 123 45 67" />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Заголовок</label>
                        <input placeholder="🍣 Скидка 20% на все сеты!" />
                    </div>
                    <div className="form-group">
                        <label>Текст сообщения</label>
                        <textarea rows={3} placeholder="Используйте промокод SET20 при заказе!" />
                    </div>
                    <button className="btn btn-primary" style={{ width: 'fit-content' }} onClick={() => showToast('Push-уведомление отправлено!')}>
                        🔔 Отправить уведомление
                    </button>
                </div>
            </div>

            <div className="table-card">
                <div className="table-card-header"><h2>Шаблоны</h2></div>
                <table>
                    <thead>
                        <tr>
                            <th>Название</th>
                            <th>Текст</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="table-name">Приветствие</td>
                            <td className="table-desc">Добро пожаловать! Промокод WELCOME15 ждёт вас 🎉</td>
                            <td><button className="btn btn-secondary btn-sm">Использовать</button></td>
                        </tr>
                        <tr>
                            <td className="table-name">Акция</td>
                            <td className="table-desc">🔥 Только сегодня: скидка 30% на все сеты!</td>
                            <td><button className="btn btn-secondary btn-sm">Использовать</button></td>
                        </tr>
                        <tr>
                            <td className="table-name">Напоминание</td>
                            <td className="table-desc">Скучаем! Вернитесь и получите подарок 🎁</td>
                            <td><button className="btn btn-secondary btn-sm">Использовать</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}
