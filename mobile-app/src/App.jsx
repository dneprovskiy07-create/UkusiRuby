import { useState, useEffect, useMemo } from 'react'
import { Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { categories as mockCategories, products as mockProducts, banners as mockBanners, userPromocodes as mockPromocodes } from './data'
import * as api from './api'

// ═══════════════════════════════════════════
// STORE (simple state management)
// ═══════════════════════════════════════════
function useStore() {
    const [cart, setCart] = useState([])
    const [favorites, setFavorites] = useState([])
    const [toast, setToast] = useState(null)
    const [apiCategories, setApiCategories] = useState(null)
    const [apiProducts, setApiProducts] = useState(null)
    const [apiBanners, setApiBanners] = useState(null)
    const [apiPromocodes, setApiPromocodes] = useState(null)
    const [apiSettings, setApiSettings] = useState({
        delivery_fee: 50,
        min_order_amount: 200,
        delivery_time: '30–50 мин',
        support_phone: '+380 ...',
        loyalty_enabled: 'false', // DISABLED
        cashback_percent: 5,
        max_cashback_use_percent: 50
    })
    const [apiCities, setApiCities] = useState([])
    const [user, setUser] = useState(() => {
        try {
            const u = JSON.parse(localStorage.getItem('ukusi_user'))
            return u && u.email ? u : null
        } catch (e) {
            return null
        }
    })
    const [selectedCity, setSelectedCity] = useState(() => {
        try {
            const s = JSON.parse(localStorage.getItem('ukusi_city'))
            return s || null
        } catch (e) {
            return null
        }
    })
    const [promoCode, setPromoCode] = useState(null)
    const [promoData, setPromoData] = useState(null)
    const [giftProduct, setGiftProduct] = useState(null) // Keep for backward compat or refactor
    const [loading, setLoading] = useState(true)

    // Persist user and city
    useEffect(() => {
        if (user) localStorage.setItem('ukusi_user', JSON.stringify(user))
        else localStorage.removeItem('ukusi_user')
    }, [user])

    useEffect(() => {
        if (selectedCity) localStorage.setItem('ukusi_city', JSON.stringify(selectedCity))
    }, [selectedCity])

    // Load initialization data (cities, settings)
    useEffect(() => {
        async function init() {
            try {
                const [settings, cities] = await Promise.all([
                    api.fetchSettings().catch(() => null),
                    api.fetchCities().catch(() => null),
                ])
                if (settings) {
                    settings.delivery_fee = Number(settings.delivery_fee)
                    settings.min_order_amount = Number(settings.min_order_amount)
                    settings.loyalty_enabled = 'false'
                    setApiSettings(settings)
                }
                if (cities) {
                    setApiCities(cities)

                    // IF selected city exists, refresh it with new data
                    if (selectedCity) {
                        const fresh = cities.find(c => c.id === selectedCity.id)
                        if (fresh) setSelectedCity(fresh)
                    }
                    // ELSE pick default
                    else if (cities.length > 0) {
                        const active = cities.find(c => c.is_active) || cities[0]
                        setSelectedCity(active)
                    }
                }
            } catch (e) { console.error('Init fail', e) }
        }
        init()
    }, [])

    // Refetch catalog when city changes
    useEffect(() => {
        async function loadCatalog() {
            if (!selectedCity) return
            setLoading(true)
            try {
                const [cats, prods, bans, prom] = await Promise.all([
                    api.fetchCategories(selectedCity.id).catch(() => null),
                    api.fetchProducts(null, selectedCity.id).catch(() => null),
                    api.fetchBanners(selectedCity.id).catch(() => null),
                    api.fetchVisiblePromocodes(selectedCity.id, user?.id).catch(() => null),
                ])
                if (cats) setApiCategories(cats)
                if (prods) setApiProducts(prods)
                if (bans) setApiBanners(bans)
                if (prom) setApiPromocodes(prom)
            } catch (e) { console.error('Catalog load fail', e) }
            finally { setLoading(false) }
        }
        loadCatalog()
    }, [selectedCity])

    // Use API data or fallback to mock
    const categories = apiCategories || mockCategories
    const products = apiProducts || mockProducts
    const banners = apiBanners || mockBanners
    const promocodes = apiPromocodes || mockPromocodes
    const settings = apiSettings
    const cities = apiCities.length > 0 ? apiCities : [{ id: 1, name: 'Киев' }]

    const showToast = (msg) => {
        setToast(msg)
        setTimeout(() => setToast(null), 2000)
    }

    const addToCart = (product, qty = 1, selectedOpts = []) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id)
            if (existing) {
                return prev.map(i =>
                    i.product.id === product.id ? { ...i, qty: i.qty + qty } : i
                )
            }
            return [...prev, { product, qty, selectedOpts }]
        })
        showToast(`${product.name} добавлен в корзину`)
    }

    const clearCart = () => {
        setCart([])
        setPromoCode(null)
        setPromoData(null)
        setGiftProduct(null)
    }

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(i => i.product.id !== productId))
    }

    const updateQty = (productId, qty) => {
        if (qty <= 0) return removeFromCart(productId)
        setCart(prev => prev.map(i =>
            i.product.id === productId ? { ...i, qty } : i
        ))
    }

    const toggleFav = (productId) => {
        setFavorites(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        )
    }

    const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0)
    const cartCount = cart.reduce((sum, i) => sum + i.qty, 0)

    // Dynamic Promo Logic
    const isPromoActive = promoData && cartTotal >= (promoData.min_order_amount || 0)
    let promoDiscount = 0
    let activeGift = null

    if (promoData && isPromoActive) {
        if (promoData.discount_type === 'percentage') {
            promoDiscount = Math.round(cartTotal * (promoData.discount_value / 100))
        } else if (promoData.discount_type === 'fixed') {
            promoDiscount = promoData.discount_value
        } else if (promoData.discount_type === 'gift') {
            const product = promoData.gift_product;
            activeGift = product
                ? {
                    ...product,
                    name: product.name,
                    image: product.image || product.image_url,
                    image_url: product.image_url || product.image,
                    price: promoData.gift_price ?? product.price
                }
                : { name: 'Подарок', price: promoData.gift_price || 0 }
        }
    }

    const removePromo = () => {
        setPromoCode(null)
        setPromoData(null)
        setGiftProduct(null)
        showToast('Промокод удален')
    }

    return {
        cart, addToCart, removeFromCart, updateQty, cartTotal, cartCount,
        favorites, toggleFav, toast, showToast, loading,
        categories, products, banners, promocodes,
        settings, cities,
        selectedCity, setSelectedCity,
        user, setUser, clearCart,
        promoCode, setPromoCode,
        promoData, setPromoData,
        promoDiscount, activeGift, removePromo,
        logout: () => {
            setUser(null)
            setCart([])
            setFavorites([])
            localStorage.removeItem('ukusi_user')
        }
    }
}

// ═══════════════════════════════════════════
// APP
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// APP
// ═══════════════════════════════════════════
export default function App() {
    const store = useStore()
    const loc = useLocation()

    // Routes that don't need auth
    const publicRoutes = ['/auth', '/forgot-password', '/reset-password']
    const isPublic = publicRoutes.includes(loc.pathname)

    // Redirect to auth if not logged in and trying to access private route
    useEffect(() => {
        if (!store.loading && !store.user && !isPublic) {
            // Check if we are already redirecting to avoid loops
            if (window.location.pathname !== '/auth') {
                window.location.href = '/auth' // Using href for hard redirect to ensure clean state or use nav('/auth')
            }
        }
    }, [store.user, store.loading, isPublic])

    if (store.loading && !store.user && !isPublic) return <div className="loading-screen">Загрузка...</div>

    return (
        <>
            {store.toast && <div className={`toast show`}>{store.toast}</div>}
            <Routes>
                {/* Public Routes */}
                <Route path="/auth" element={<AuthPage store={store} />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage store={store} />} />
                <Route path="/reset-password" element={<ResetPasswordPage store={store} />} />

                {/* Protected Routes (rendered only if user exists, else Effect redirects) */}
                {store.user && (
                    <>
                        <Route path="/" element={<HomePage store={store} />} />
                        <Route path="/product/:id" element={<ProductPage store={store} />} />
                        <Route path="/cart" element={<CartPage store={store} />} />
                        <Route path="/checkout" element={<CheckoutPage store={store} />} />
                        <Route path="/success" element={<SuccessPage />} />
                        <Route path="/profile" element={<ProfilePage store={store} />} />
                        <Route path="/orders" element={<UserOrdersPage store={store} />} />
                        <Route path="/addresses" element={<AddressesPage store={store} />} />
                        <Route path="/promos" element={<PromosPage store={store} />} />
                        <Route path="/favorites" element={<FavoritesPage store={store} />} />
                    </>
                )}
                {/* Catch-all for 404 or unauth access attempt -> Redirect handled by Effect */}
                <Route path="*" element={!store.user ? <AuthPage store={store} /> : <HomePage store={store} />} />
            </Routes>

            {/* Show Nav only if user is logged in */}
            {store.user && <BottomNav cartCount={store.cartCount} />}
            {store.user && store.cartCount > 0 && <MiniCart store={store} />}
        </>
    )
}

// ═══════════════════════════════════════════
// BOTTOM NAV
// ═══════════════════════════════════════════
function BottomNav({ cartCount }) {
    const nav = useNavigate()
    const loc = useLocation()
    const isActive = (path) => loc.pathname === path ? 'active' : ''

    return (
        <nav className="bottom-nav">
            <button className={`nav-item ${isActive('/promos')}`} onClick={() => nav('/promos')}>
                <span className="nav-icon">🎟️</span>
                Промо
            </button>
            <button className={`nav-item ${isActive('/favorites')}`} onClick={() => nav('/favorites')}>
                <span className="nav-icon">❤️</span>
                Избранное
            </button>
            <button className="nav-item center-btn" onClick={() => nav('/')}>
                <span className="nav-icon">🍣</span>
            </button>
            <button className={`nav-item ${isActive('/cart')}`} onClick={() => nav('/cart')}>
                <span className="nav-icon">🛒</span>
                Корзина
            </button>
            <button className={`nav-item ${isActive('/profile')}`} onClick={() => nav('/profile')}>
                <span className="nav-icon">👤</span>
                Кабинет
            </button>
        </nav>
    )
}

// ═══════════════════════════════════════════
// MINI CART FLOAT
// ═══════════════════════════════════════════
function MiniCart({ store }) {
    const nav = useNavigate()
    const loc = useLocation()
    if (loc.pathname === '/cart' || loc.pathname === '/checkout') return null
    return (
        <div className="mini-cart" onClick={() => nav('/cart')}>
            <span className="mini-cart-count">{store.cartCount}</span>
            <span className="mini-cart-text">Корзина</span>
            <span className="mini-cart-price">{store.cartTotal}₴</span>
        </div>
    )
}

// ═══════════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════════
function HomePage({ store }) {
    const [activeCategory, setActiveCategory] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    // const [searchResults, setSearchResults] = useState(null) // Removed server-side search
    const [cityModal, setCityModal] = useState(false)
    const nav = useNavigate()

    // Filter products locally for instant search
    const getFilteredProducts = () => {
        if (!searchQuery) return null
        const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean)
        return store.products.filter(p => {
            const text = (p.name + ' ' + (p.description || '')).toLowerCase()
            return terms.every(term => text.includes(term))
        })
    }

    const displayProducts = searchQuery
        ? getFilteredProducts()
        : activeCategory
            ? store.products.filter(p => {
                const pCatId = p.category_id || p.category?.id;
                return String(pCatId) === String(activeCategory);
            })
            : store.products

    return (
        <div style={{ paddingBottom: store.cartCount > 0 ? '140px' : '90px' }}>
            {/* Header */}
            {/* Header */}
            <header className="header" style={{ padding: '12px 16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                {/* Left: City */}
                <div className="header-left-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, flexShrink: 0 }}>
                    <div className="header-location" onClick={() => setCityModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        <div className="address" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            {store.selectedCity ? store.selectedCity.name : 'Город'} ›
                        </div>
                    </div>
                </div>

                {/* Center: Phone & Schedule */}
                {store.selectedCity && (
                    <div className="header-center-phone" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <a href={`tel:${store.selectedCity.support_phone || store.settings.support_phone}`} className="info-item phone" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                            📞 {store.selectedCity.support_phone || store.settings.support_phone}
                        </a>
                        <span style={{ fontSize: 11, color: '#888' }}>
                            🕒 {store.selectedCity?.working_hours || store.settings.work_schedule || '10:00 - 22:00'}
                        </span>
                    </div>
                )}

                {/* Right: Logo */}
                <div className="header-right-logo" style={{ flexShrink: 0 }}>
                    {store.settings.logo_url ? (
                        <img src={api.getImageUrl(store.settings.logo_url)} alt="Logo" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
                    ) : (
                        <button className="btn-icon" onClick={() => nav('/auth')}>
                            <span>🍣</span>
                        </button>
                    )}
                </div>
            </header>

            {cityModal && (
                <CitySelectionModal
                    cities={store.cities}
                    selectedId={store.selectedCity?.id}
                    onSelect={(c) => { store.setSelectedCity(c); setCityModal(false) }}
                    onClose={() => setCityModal(false)}
                />
            )}

            {/* Search */}
            <div className="search-bar" style={{ margin: '5px 16px 0 16px' }}>
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Найти суши, роллы..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Banners */}
            {!searchQuery && (
                <div style={{ marginTop: 5, marginBottom: 0 }}>
                    <BannerCarousel banners={store.banners} />
                </div>
            )}

            {/* Categories */}
            <div className="categories-section" style={{ marginTop: 5, marginBottom: 0 }}>
                {/* <h2 className="section-title">Категории</h2> - Removed as requested */}
                <div className="categories-scroll">
                    <button
                        className={`chip ${!activeCategory ? 'active' : ''}`}
                        onClick={() => setActiveCategory(null)}
                    >
                        Все
                    </button>
                    {store.categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`chip ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            <span className="chip-icon">
                                {cat.icon && typeof cat.icon === 'string' && (cat.icon.includes('/') || cat.icon.includes('http'))
                                    ? <img src={api.getImageUrl(cat.icon)} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                                    : cat.icon}
                            </span>
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products */}
            <div className="products-section" style={{ marginTop: 5 }}>
                {/* <h2 className="section-title">...</h2> - Removed "Popular" title as requested */}
                {store.loading ? (
                    <div className="products-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="product-card">
                                <div className="skeleton" style={{ width: '100%', aspectRatio: 1 }} />
                                <div style={{ padding: 12 }}>
                                    <div className="skeleton" style={{ height: 14, marginBottom: 8 }} />
                                    <div className="skeleton" style={{ height: 10, width: '60%', marginBottom: 12 }} />
                                    <div className="skeleton" style={{ height: 16, width: '40%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayProducts.length === 0 ? (
                    <div className="empty-state">
                        <div className="emoji">🔍</div>
                        <h3>Ничего не найдено</h3>
                        <p>Попробуйте другой запрос</p>
                    </div>
                ) : (
                    <div className="products-grid">
                        {displayProducts.map(p => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                isFav={store.favorites.includes(p.id)}
                                onFav={() => store.toggleFav(p.id)}
                                onAdd={() => store.addToCart(p)}
                                onClick={() => nav(`/product/${p.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════
// BANNER CAROUSEL
// ═══════════════════════════════════════════
function BannerCarousel({ banners }) {
    const [active, setActive] = useState(0)
    return (
        <div className="banner-section">
            <div className="banner-carousel" onScroll={(e) => {
                const idx = Math.round(e.target.scrollLeft / e.target.offsetWidth)
                setActive(idx)
            }}>
                {banners.map((b, i) => (
                    <div key={b.id} className="banner-card" style={{ background: b.gradient || `linear-gradient(135deg, #FF5C00, #FF8A3D)` }}>
                        {b.image_url && <img src={api.getImageUrl(b.image_url)} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        <div className="banner-overlay">
                            <h3>{b.title}</h3>
                            <p>{b.subtitle || b.description || ''}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="banner-dots">
                {banners.map((_, i) => (
                    <div key={i} className={`banner-dot ${active === i ? 'active' : ''}`} />
                ))}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════
// PRODUCT CARD
// ═══════════════════════════════════════════
function ProductCard({ product, isFav, onFav, onAdd, onClick }) {
    return (
        <div className="product-card" onClick={onClick}>
            <img className="product-card-img" src={api.getImageUrl(product.image || product.image_url)} alt={product.name} loading="lazy" />
            <div className="product-card-badges">
                {product.is_hit && <span className="badge badge-hit">ХИТ</span>}
                {product.is_new && <span className="badge badge-new">NEW</span>}
                {product.is_promo && <span className="badge badge-promo">АКЦИЯ</span>}
            </div>
            <button
                className={`product-card-fav ${isFav ? 'liked' : ''}`}
                onClick={(e) => { e.stopPropagation(); onFav() }}
            >
                {isFav ? '❤️' : '🤍'}
            </button>
            <div className="product-card-body">
                <div className="product-card-name">{product.name}</div>
                <div className="product-card-desc">{product.description}</div>
                <div className="product-card-footer">
                    <div className="product-card-price">
                        {product.price}<span className="currency">₴</span>
                    </div>
                    <button
                        className="product-card-add"
                        onClick={(e) => { e.stopPropagation(); onAdd() }}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════
// PRODUCT DETAIL PAGE
// ═══════════════════════════════════════════
function ProductPage({ store }) {
    const nav = useNavigate()
    const id = window.location.pathname.split('/').pop()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [qty, setQty] = useState(1)
    const [selectedOpts, setSelectedOpts] = useState([])

    useEffect(() => {
        async function load() {
            setLoading(true)
            // Try API first
            const apiProduct = await api.fetchProductById(id)
            if (apiProduct) {
                setProduct(apiProduct)
            } else {
                // Fallback to mock
                const mock = store.products.find(p => String(p.id) === String(id))
                setProduct(mock || null)
            }
            setLoading(false)
        }
        load()
    }, [id])

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><div className="skeleton" style={{ height: 300, marginBottom: 20 }} /><div className="skeleton" style={{ height: 24, width: '60%', margin: '0 auto 12px' }} /><div className="skeleton" style={{ height: 14, width: '80%', margin: '0 auto' }} /></div>
    if (!product) return <div className="empty-state"><div className="emoji">😕</div><h3>Товар не найден</h3></div>

    const toggleOpt = (optId) => {
        setSelectedOpts(prev =>
            prev.includes(optId) ? prev.filter(o => o !== optId) : [...prev, optId]
        )
    }

    const options = product.options || []
    const optionsPrice = options
        .filter(o => selectedOpts.includes(o.id))
        .reduce((sum, o) => sum + (o.additional_price || 0), 0)
    const totalPrice = (Number(product.price) + optionsPrice) * qty

    return (
        <div className="product-detail">
            <div className="page-header">
                <button className="back-btn" onClick={() => nav(-1)}>←</button>
                <h2>{product.name}</h2>
            </div>
            <img className="product-detail-img" src={api.getImageUrl(product.image || product.image_url)} alt={product.name} />
            <div className="product-detail-content">
                <h1>{product.name}</h1>
                <p className="desc">{product.description}</p>
                <div className="product-detail-price">{product.price}₴</div>

                {options.length > 0 && (
                    <div className="product-detail-options">
                        <h3>Добавки</h3>
                        {options.map(opt => (
                            <div
                                key={opt.id}
                                className={`option-item ${selectedOpts.includes(opt.id) ? 'selected' : ''}`}
                                onClick={() => toggleOpt(opt.id)}
                            >
                                <span className="option-name">{opt.name}</span>
                                <span className="option-price">+{opt.additional_price}₴</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="quantity-control">
                    <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                    <span className="qty-value">{qty}</span>
                    <button className="qty-btn" onClick={() => setQty(qty + 1)}>+</button>
                </div>
            </div>

            <div className="add-to-cart-bar">
                <button
                    className="btn btn-primary btn-block"
                    onClick={() => { store.addToCart(product, qty, selectedOpts); nav(-1) }}
                >
                    В корзину · {totalPrice}₴
                </button>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════
// CART PAGE
// ═══════════════════════════════════════════
function CartPage({ store }) {
    const nav = useNavigate()
    const [promo, setPromo] = useState('')
    const [promoLoading, setPromoLoading] = useState(false)
    const delivery = store.selectedCity?.delivery_fee ?? store.settings.delivery_fee
    const minOrder = store.selectedCity?.min_order_amount ?? store.settings.min_order_amount

    // Clear promo input when code is successfully applied
    useEffect(() => {
        if (store.promoCode) {
            setPromo('')
        }
    }, [store.promoCode])

    const applyPromo = async () => {
        if (!promo) return
        setPromoLoading(true)
        const result = await api.validatePromocode(promo, store.selectedCity?.id)
        if (result && result.valid) {
            const p = result.promo
            store.setPromoData(p)
            store.setPromoCode(p.code)

            const promoMinOrder = p.min_order_amount || 0
            if (store.cartTotal < Number(promoMinOrder)) {
                store.showToast(`Промокод принят! Дозакажите на ${promoMinOrder - store.cartTotal}₴ для получения выгоды`)
            } else {
                const msg = p.discount_type === 'gift'
                    ? `Подарок добавлен: ${p.gift_product?.name || 'Товар'}`
                    : `Промокод применён! -${p.discount_type === 'percentage' ? p.discount_value + '%' : p.discount_value + '₴'}`
                store.showToast(msg)
            }
        } else {
            store.showToast(result?.message || 'Неверный промокод')
            store.setPromoCode(null)
            store.setPromoData(null)
        }
        setPromoLoading(false)
    }

    if (store.cart.length === 0) {
        return (
            <div>
                <div className="page-header">
                    <button className="back-btn" onClick={() => nav(-1)}>←</button>
                    <h2>Корзина</h2>
                </div>
                <div className="empty-state">
                    <div className="emoji">🛒</div>
                    <h3>Корзина пуста</h3>
                    <p>Добавьте что-нибудь вкусное!</p>
                    <button className="btn btn-primary" onClick={() => nav('/')}>В меню</button>
                </div>
            </div>
        )
    }

    const isMinOrderReached = store.cartTotal >= minOrder

    return (
        <div>
            <div className="page-header">
                <button className="back-btn" onClick={() => nav(-1)}>←</button>
                <h2>Корзина</h2>
            </div>
            <div className="cart-page">
                {store.cart.map(item => (
                    <div key={item.product.id} className="cart-item">
                        <img className="cart-item-img" src={api.getImageUrl(item.product.image || item.product.image_url)} alt={item.product.name} />
                        <div className="cart-item-info">
                            <div className="cart-item-name">{item.product.name}</div>
                            <div className="cart-item-price">{item.product.price * item.qty}₴</div>
                            <div className="quantity-control" style={{ marginTop: 8, marginBottom: 0 }}>
                                <button className="qty-btn" style={{ width: 32, height: 32 }}
                                    onClick={() => store.updateQty(item.product.id, item.qty - 1)}>−</button>
                                <span className="qty-value" style={{ fontSize: 15 }}>{item.qty}</span>
                                <button className="qty-btn" style={{ width: 32, height: 32 }}
                                    onClick={() => store.updateQty(item.product.id, item.qty + 1)}>+</button>
                            </div>
                        </div>
                        <button className="cart-item-remove" onClick={() => store.removeFromCart(item.product.id)}>✕</button>
                    </div>
                ))}

                {store.activeGift && (
                    <div className="cart-item gift-item" style={{
                        background: 'rgba(255,92,0,0.03)',
                        border: '1px dashed var(--primary)',
                        width: 'calc(100% - 32px)',
                        margin: '0 auto 12px',
                        borderRadius: 12,
                        padding: 12,
                        alignItems: 'center'
                    }}>
                        <img className="cart-item-img" src={api.getImageUrl(store.activeGift.image || store.activeGift.image_url)} alt={store.activeGift.name} />
                        <div className="cart-item-info">
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--primary)', letterSpacing: 1, marginBottom: 4 }}>ВАШ ПОДАРОК</div>
                            <div className="cart-item-name">{store.activeGift.name}</div>
                            <div className="cart-item-price">{store.activeGift.price}₴</div>
                        </div>
                    </div>
                )}

                <div className="promo-input">
                    {store.promoCode ? (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: 'rgba(0, 200, 83, 0.1)',
                            borderRadius: 12,
                            border: '1px solid #00C853',
                            color: '#00C853',
                            fontWeight: 600,
                            fontSize: 14
                        }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                🏷️ {store.promoCode}
                            </span>
                            <button onClick={store.removePromo} style={{
                                background: 'none',
                                color: 'inherit',
                                fontSize: 18,
                                padding: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.8
                            }}>✕</button>
                        </div>
                    ) : (
                        <>
                            <input
                                placeholder="ПРОМОКОД"
                                value={promo}
                                onChange={(e) => setPromo(e.target.value)}
                            />
                            <button className="btn btn-secondary btn-sm" onClick={applyPromo} disabled={promoLoading}>
                                {promoLoading ? '...' : 'Применить'}
                            </button>
                        </>
                    )}
                </div>

                {store.promoData && !store.activeGift && store.promoData.discount_type === 'gift' && (
                    <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,92,0,0.05)', borderRadius: 8, color: 'var(--primary)', fontSize: 13, textAlign: 'center' }}>
                        Добавьте еще на <b>{store.promoData.min_order_amount - store.cartTotal}₴</b>, чтобы получить 🎁 <b>{store.promoData.gift_product?.name || 'подарок'}</b>!
                    </div>
                )}

                <div className="cart-summary">
                    <div className="cart-summary-row">
                        <span>Товары</span>
                        <span>{store.cartTotal}₴</span>
                    </div>
                    <div className="cart-summary-row">
                        <span>Доставка</span>
                        <span>{delivery}₴</span>
                    </div>
                    {store.promoDiscount > 0 && (
                        <div className="cart-summary-row">
                            <span>Скидка</span>
                            <span className="discount">-{store.promoDiscount}₴</span>
                        </div>
                    )}
                    <div className="cart-summary-row total">
                        <span>Итого</span>
                        <span>{store.cartTotal + delivery - store.promoDiscount + (store.activeGift ? Number(store.activeGift.price) : 0)}₴</span>
                    </div>

                    {!isMinOrderReached && (
                        <div style={{ marginTop: 12, padding: 12, background: '#fff9f0', borderRadius: 8, color: '#b25e09', fontSize: 13, textAlign: 'center' }}>
                            Минимальная сумма заказа: <b>{minOrder}₴</b>. <br />
                            Вам не хватает еще <b>{minOrder - store.cartTotal}₴</b>
                        </div>
                    )}
                </div>
            </div>

            <div className="cart-footer">
                <button
                    className="btn btn-primary btn-block"
                    disabled={!isMinOrderReached}
                    onClick={() => nav('/checkout')}
                >
                    {isMinOrderReached
                        ? `Оформить заказ · ${store.cartTotal + delivery - store.promoDiscount + (store.activeGift ? Number(store.activeGift.price) : 0)}₴`
                        : `Мин. заказ ${minOrder}₴`}
                </button>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════
// CHECKOUT PAGE
// ═══════════════════════════════════════════
function CheckoutPage({ store }) {
    const nav = useNavigate()
    const [orderType, setOrderType] = useState('delivery') // 'delivery' | 'pickup'
    const [pickupPoints, setPickupPoints] = useState([])
    const [selectedPoint, setSelectedPoint] = useState(null)
    const [userAddresses, setUserAddresses] = useState([])
    const [payment, setPayment] = useState('cash')
    const [submitting, setSubmitting] = useState(false)
    const [cityModal, setCityModal] = useState(false)
    const [isAddressListOpen, setIsAddressListOpen] = useState(false)
    const [cutlery, setCutlery] = useState(1)
    const [dontCall, setDontCall] = useState(false)
    const [form, setForm] = useState({
        phone: (store.user && store.user.phone) || '',
        address: '',
        comment: '',
        saveAddress: false,
        delivery_time: 'asap'
    })

    const deliveryFee = orderType === 'delivery' ? (store.selectedCity?.delivery_fee ?? store.settings.delivery_fee) : 0
    const baseTotal = store.cartTotal + deliveryFee - store.promoDiscount + (store.activeGift ? Number(store.activeGift.price) : 0)

    // Loyalty Logic
    const isLoyaltyEnabled = store.settings.loyalty_enabled === 'true'
    const maxUsePercent = store.settings.max_cashback_use_percent || 50
    const maxPointsAllowed = Math.floor(baseTotal * (maxUsePercent / 100))
    const pointsToUse = Math.min(Math.floor(store.user?.cashback_balance || 0), maxPointsAllowed, baseTotal)

    useEffect(() => {
        if (store.selectedCity?.id) {
            api.fetchPickupPoints(store.selectedCity.id).then(res => {
                setPickupPoints(res || [])
                if (res?.length > 0) setSelectedPoint(res[0])
                else setSelectedPoint(null)
            })
        }
    }, [store.selectedCity?.id])

    useEffect(() => {
        if (store.user?.id) {
            loadAddresses()
        }
    }, [store.user?.id])

    // Validate payment method when city changes
    useEffect(() => {
        const methods = store.selectedCity?.payment_methods
        if (!methods || methods.length === 0) return

        const currentKey =
            payment === 'cash' ? 'cash' :
                payment === 'card' ? 'terminal' :
                    ['leekpay', 'wayforpay'].includes(payment) ? 'card_online' : null

        if (!currentKey || !methods.includes(currentKey)) {
            if (methods.includes('cash')) setPayment('cash')
            else if (methods.includes('terminal')) setPayment('card')
            else if (methods.includes('card_online')) setPayment('leekpay')
        }
    }, [store.selectedCity?.id, store.selectedCity?.payment_methods])

    const loadAddresses = () => {
        api.fetchUserAddresses(store.user.id).then(res => {
            setUserAddresses(res || [])
        })
    }

    const handleDeleteAddress = async (e, id) => {
        e.stopPropagation()
        if (!window.confirm('Удалить этот адрес?')) return
        await api.deleteUserAddress(store.user.id, id)
        loadAddresses()
        store.showToast('Адрес удален')
    }


    // Filter addresses based on input
    const filteredAddresses = useMemo(() => {
        if (!form.address) return userAddresses
        return userAddresses.filter(addr => {
            const searchStr = (addr.street + (addr.address_text || '')).toLowerCase()
            return searchStr.includes(form.address.toLowerCase())
        })
    }, [userAddresses, form.address])

    // Generate time slots (ASAP + 45min buffer, 15min intervals)
    // Generate time slots (ASAP + 45min buffer, 15min intervals)
    // Generate time slots based on city working hours
    const availableTimeSlots = useMemo(() => {
        const slots = []
        const now = new Date()

        // Get working hours from city settings or defaults
        const workStart = store.selectedCity?.work_start_time || '10:00'
        const workEnd = store.selectedCity?.work_end_time || '22:00'
        const [startHour, startMin] = workStart.split(':').map(Number)
        const [endHour, endMin] = workEnd.split(':').map(Number)

        // Calculate potential start time (Now + 45 min buffer)
        let start = new Date(now.getTime() + 45 * 60000)

        // Round to next 15 min
        let minutes = start.getMinutes()
        let remainder = minutes % 15
        if (remainder !== 0) {
            start.setMinutes(minutes + (15 - remainder))
        }
        start.setSeconds(0)
        start.setMilliseconds(0)

        // Define today's working boundaries
        const todayOpen = new Date(now)
        todayOpen.setHours(startHour, startMin, 0, 0)

        const todayClose = new Date(now)
        todayClose.setHours(endHour, endMin, 0, 0)

        // Logic switch
        let isTomorrow = false

        // If calculated start is before opening, shift to opening
        if (start < todayOpen) {
            start = new Date(todayOpen)
        }

        // Check if we missed today's window
        // If current calculated start is past closing time
        if (start > todayClose) {
            isTomorrow = true
        }

        // If next day needed
        if (isTomorrow) {
            start = new Date(now)
            start.setDate(start.getDate() + 1)
            start.setHours(startHour, startMin, 0, 0)

            // Recalculate close time for tomorrow
            todayClose.setDate(todayClose.getDate() + 1)
        }

        // Generate slots
        while (start <= todayClose) {
            const timeString = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            slots.push((isTomorrow ? 'Завтра, ' : '') + timeString)
            start.setMinutes(start.getMinutes() + 15)
        }

        return slots
    }, [store.selectedCity])

    const handleSubmit = async () => {
        if (!form.phone) return store.showToast('Введите номер телефона')
        if (orderType === 'delivery' && !form.address) return store.showToast('Введите адрес доставки')
        if (orderType === 'pickup' && !selectedPoint) return store.showToast('Выберите точку самовывоза')

        setSubmitting(true)

        // Save address if requested
        // Save address if requested
        if (orderType === 'delivery' && form.saveAddress && store.user?.id) {
            try {
                await api.addUserAddress(store.user.id, {
                    city_id: store.selectedCity?.id,
                    address_text: form.address,
                    street: form.address // Save full string as requested by user
                })
                loadAddresses() // Refresh list for next time
            } catch (e) {
                console.error('Failed to save address', e)
            }
        }

        const orderData = {
            user_id: store.user ? store.user.id : 'guest',
            phone: form.phone,
            address_text: orderType === 'delivery' ? form.address : `Самовывоз: ${selectedPoint.name} (${selectedPoint.address})`,
            courier_comment: form.comment,
            delivery_time: form.delivery_time,
            payment_method: payment,
            promo_code: store.promoCode,
            city_id: store.selectedCity?.id,
            order_type: orderType,
            pickup_point_id: orderType === 'pickup' ? selectedPoint?.id : undefined,
            use_cashback: !!form.useCashback,
            items: store.cart.map(i => ({
                product_id: i.product.id,
                quantity: i.qty,
                selected_options: i.selectedOpts,
            })),
        }
        await api.createOrder(orderData)
        setSubmitting(false)
        store.clearCart()
        nav('/success')
    }

    return (
        <div>
            <div className="page-header">
                <button className="back-btn" onClick={() => nav(-1)}>←</button>
                <h2>Оформление</h2>
            </div>
            <div className="checkout-page">
                {/* City Picker */}
                <div className="form-group">
                    <label>Город</label>
                    <div
                        className="input-like"
                        onClick={() => setCityModal(true)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px 16px', background: '#f9f9f9', borderRadius: 12, border: '1px solid #eee' }}
                    >
                        <span>{store.selectedCity?.name || 'Выберите город'}</span>
                        <span style={{ fontSize: 12, color: '#999' }}>Изменить ›</span>
                    </div>
                </div>

                {/* Delivery/Pickup Toggle */}
                <div style={{ display: 'flex', background: '#f5f5f5', padding: 4, borderRadius: 14, marginBottom: 24, marginTop: 8 }}>
                    <button
                        style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: orderType === 'delivery' ? '#fff' : 'transparent', fontWeight: orderType === 'delivery' ? 700 : 500, boxShadow: orderType === 'delivery' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', color: orderType === 'delivery' ? 'var(--primary)' : '#888' }}
                        onClick={() => setOrderType('delivery')}
                    >
                        🛵 Доставка
                    </button>
                    <button
                        style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: orderType === 'pickup' ? '#fff' : 'transparent', fontWeight: orderType === 'pickup' ? 700 : 500, boxShadow: orderType === 'pickup' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', color: orderType === 'pickup' ? 'var(--primary)' : '#888' }}
                        onClick={() => setOrderType('pickup')}
                    >
                        🥡 Самовывоз
                    </button>
                </div>

                {orderType === 'delivery' ? (
                    <>
                        <div className="form-group" style={{ position: 'relative', zIndex: 10 }}>
                            <label>Адрес доставки</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    placeholder="ул. Крещатик, д. 1, кв. 10"
                                    value={form.address}
                                    onChange={e => {
                                        setForm({ ...form, address: e.target.value })
                                        setIsAddressListOpen(true)
                                    }}
                                    onFocus={() => setIsAddressListOpen(true)}
                                    style={{ paddingRight: 40 }}
                                />
                                {filteredAddresses.length > 0 && (
                                    <div
                                        onClick={() => setIsAddressListOpen(!isAddressListOpen)}
                                        style={{
                                            position: 'absolute',
                                            right: 0, top: 0, bottom: 0,
                                            width: 44,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: '#999',
                                            zIndex: 2
                                        }}
                                    >
                                        <span style={{ transform: isAddressListOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: 12 }}>▼</span>
                                    </div>
                                )}

                                {/* Combobox Dropdown List */}
                                {isAddressListOpen && filteredAddresses.length > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%', left: 0, right: 0,
                                        marginTop: 4,
                                        background: '#fff',
                                        border: '1px solid #eee',
                                        borderRadius: 12,
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                        zIndex: 100,
                                        maxHeight: 220,
                                        overflowY: 'auto'
                                    }}>
                                        {filteredAddresses.map((addr, i) => (
                                            <div
                                                key={addr.id || i}
                                                onClick={() => {
                                                    setForm({ ...form, address: addr.address_text || addr.street })
                                                    setIsAddressListOpen(false)
                                                }}
                                                style={{
                                                    padding: '12px 16px',
                                                    borderBottom: i < filteredAddresses.length - 1 ? '1px solid #f5f5f5' : 'none',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: form.address === (addr.address_text || addr.street) ? '#f0f9ff' : '#fff'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <span style={{ fontSize: 16 }}>📍</span>
                                                    <div>
                                                        <div style={{ fontSize: 14, fontWeight: 500 }}>{addr.street}</div>
                                                        {addr.address_text && addr.address_text !== addr.street && (
                                                            <div style={{ fontSize: 12, color: '#888' }}>{addr.address_text}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteAddress(e, addr.id)}
                                                    style={{
                                                        border: 'none',
                                                        background: 'transparent',
                                                        color: '#ff4d4f',
                                                        fontSize: 14,
                                                        cursor: 'pointer',
                                                        padding: 8,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <input
                                type="checkbox"
                                id="saveAddr"
                                checked={form.saveAddress}
                                onChange={e => setForm({ ...form, saveAddress: e.target.checked })}
                                style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                            />
                            <label htmlFor="saveAddr" style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Сохранить адрес</label>
                        </div>
                    </>
                ) : (
                    <div className="form-group">
                        <label>Точка самовывоза</label>
                        {pickupPoints.length === 0 ? (
                            <div style={{ padding: 16, background: '#fff9f0', borderRadius: 12, color: '#b25e09', fontSize: 14 }}>
                                В этом городе пока нет точек самовывоза
                            </div>
                        ) : (
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={selectedPoint?.id || ''}
                                    onChange={(e) => {
                                        const point = pickupPoints.find(p => p.id === e.target.value)
                                        setSelectedPoint(point)
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        borderRadius: 14,
                                        border: '1px solid #e0e0e0',
                                        fontSize: 15,
                                        appearance: 'none',
                                        background: '#fff',
                                        color: '#333',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="" disabled>Выберите точку самовывоза</option>
                                    {pickupPoints.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.address})
                                        </option>
                                    ))}
                                </select>
                                <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: '#999' }}>
                                    ▼
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="form-group">
                    <label>Телефон</label>
                    <input type="tel" placeholder="+380 (__) ___-__-__" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Комментарий к заказу</label>
                    <textarea rows={3} placeholder="Домофон не работает..." value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} />
                </div>

                <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ marginBottom: 0 }}>🍴 Приборы</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f5f5f5', padding: '6px 12px', borderRadius: 12 }}>
                        <button
                            onClick={() => setCutlery(c => Math.max(1, c - 1))}
                            style={{ border: 'none', background: 'transparent', fontSize: 18, color: cutlery > 1 ? '#000' : '#ccc', padding: '0 4px', cursor: 'pointer' }}
                        >–</button>
                        <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{cutlery}</span>
                        <button
                            onClick={() => setCutlery(c => Math.min(10, c + 1))}
                            style={{ border: 'none', background: 'transparent', fontSize: 18, color: cutlery < 10 ? '#000' : '#ccc', padding: '0 4px', cursor: 'pointer' }}
                        >+</button>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: '#fff', border: '1px solid #eee', borderRadius: 12 }}>
                    <input
                        type="checkbox"
                        id="dontCall"
                        checked={dontCall}
                        onChange={e => setDontCall(e.target.checked)}
                        style={{ width: 20, height: 20, accentColor: 'var(--primary)', margin: 0 }}
                    />
                    <label htmlFor="dontCall" style={{ margin: 0, fontSize: 14, fontWeight: 500, flex: 1, cursor: 'pointer' }}>
                        📞 Не перезванивать
                    </label>
                </div>
                <div className="form-group">
                    <label>Время {orderType === 'delivery' ? 'доставки' : 'готовности'}</label>
                    <select
                        value={form.delivery_time}
                        onChange={e => setForm({ ...form, delivery_time: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #eee', fontSize: 16, background: '#fff' }}
                    >
                        <option value="asap">Как можно скорее</option>
                        {availableTimeSlots.map(time => (
                            <option key={time} value={time}>{time}</option>
                        ))}
                    </select>
                </div>

                <h3 style={{ marginTop: 24, marginBottom: 12 }}>Способ оплаты</h3>
                <div className="payment-options">
                    {[
                        { id: 'cash', label: '💵  Наличными при получении', key: 'cash' },
                        { id: 'card', label: '💳  Картой при получении', key: 'terminal' },
                        { id: 'leekpay', label: '🏦  LeekPay (онлайн)', key: 'card_online' },
                        { id: 'wayforpay', label: '🌐  WayForPay (онлайн)', key: 'card_online' },
                    ].filter(opt => {
                        // If no settings (default), show all
                        if (!store.selectedCity?.payment_methods || store.selectedCity.payment_methods.length === 0) return true
                        // Check if method is allowed
                        return store.selectedCity.payment_methods.includes(opt.key)
                    }).map(opt => (
                        <div
                            key={opt.id}
                            className={`payment-option ${payment === opt.id ? 'selected' : ''}`}
                            onClick={() => setPayment(opt.id)}
                        >
                            <div className="payment-radio" />
                            <span className="payment-label">{opt.label}</span>
                        </div>
                    ))}
                </div>

                {store.user && store.user.cashback_balance > 0 && isLoyaltyEnabled && (
                    <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,92,0,0.05)', borderRadius: 12, border: '1px solid rgba(255,92,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>Использовать кэшбэк</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    Доступно для списания: {pointsToUse}₴ <br />
                                    <span style={{ opacity: 0.7 }}>(макс. {maxUsePercent}% от заказа)</span>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                style={{ width: 22, height: 22, accentColor: 'var(--primary)' }}
                                checked={!!form.useCashback}
                                onChange={e => setForm({ ...form, useCashback: e.target.checked })}
                            />
                        </div>
                    </div>
                )}

                <div style={{ marginTop: 24, padding: 16, background: '#f9f9f9', borderRadius: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                        <span style={{ color: '#888' }}>Сумма заказа</span>
                        <span>{store.cartTotal}₴</span>
                    </div>
                    {deliveryFee > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                            <span style={{ color: '#888' }}>Доставка</span>
                            <span>{deliveryFee}₴</span>
                        </div>
                    )}
                    {store.promoDiscount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#10B981' }}>
                            <span>Скидка по промокоду</span>
                            <span>-{store.promoDiscount}₴</span>
                        </div>
                    )}
                    {form.useCashback && pointsToUse > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: 'var(--primary)' }}>
                            <span>Кэшбэк</span>
                            <span>-{pointsToUse}₴</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid #eee' }}>
                        <span style={{ fontWeight: 800, fontSize: 18 }}>К оплате</span>
                        <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>
                            {Math.max(0, baseTotal - (form.useCashback ? pointsToUse : 0))}₴
                        </span>
                    </div>
                </div>

                <button
                    className="btn btn-primary btn-block"
                    style={{ marginTop: 24 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? 'Оформляем...' : `Подтвердить заказ`}
                </button>
            </div>

            {cityModal && (
                <CitySelectionModal
                    cities={store.cities}
                    selectedId={store.selectedCity?.id}
                    onSelect={(c) => { store.setSelectedCity(c); setCityModal(false) }}
                    onClose={() => setCityModal(false)}
                />
            )}
        </div>
    )
}

// ═══════════════════════════════════════════
// SUCCESS PAGE
// ═══════════════════════════════════════════
function SuccessPage() {
    const nav = useNavigate()
    return (
        <div className="success-page">
            <div className="success-icon">✅</div>
            <h1 className="h2">Заказ принят!</h1>
            <p className="order-num">Заказ #UKR-{Math.floor(1000 + Math.random() * 9000)}</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
                Мы уже готовим ваш заказ. Ожидаемое время доставки ~40 мин.
            </p>
            <button className="btn btn-primary" onClick={() => nav('/')}>В меню</button>
            <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => nav('/orders')}>Мои заказы</button>
        </div>
    )
}

// ═══════════════════════════════════════════
// AUTH PAGE
// ═══════════════════════════════════════════
function AuthPage({ store }) {
    const nav = useNavigate()
    const [mode, setMode] = useState('login') // 'login' | 'register'
    const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!form.email || !form.password) return store.showToast('Заполните Email и пароль')
        if (mode === 'register' && (!form.name || !form.phone)) return store.showToast('Заполните все поля')

        setLoading(true)
        let res
        try {
            if (mode === 'login') {
                res = await api.login({ email: form.email, password: form.password })
            } else {
                res = await api.register(form)
            }
        } catch (e) {
            console.error(e)
        }
        setLoading(false)

        if (res && (res.id || res.email)) {
            store.setUser(res)
            store.showToast(`Добро пожаловать, ${res.name || 'Пользователь'}!`)
            nav('/profile')
        } else {
            store.showToast(res?.message || 'Ошибка авторизации')
        }
    }

    return (
        <div className="auth-page">
            <div className="logo">🍣</div>
            <h1 className="h2" style={{ marginBottom: 24 }}>UkusiRuby</h1>

            <div className="auth-tabs" style={{ display: 'flex', marginBottom: 24, background: '#f5f5f5', padding: 4, borderRadius: 12 }}>
                <button
                    style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: mode === 'login' ? '#fff' : 'transparent', fontWeight: mode === 'login' ? 600 : 400, boxShadow: mode === 'login' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                    onClick={() => setMode('login')}
                >
                    Вход
                </button>
                <button
                    style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: mode === 'register' ? '#fff' : 'transparent', fontWeight: mode === 'register' ? 600 : 400, boxShadow: mode === 'register' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                    onClick={() => setMode('register')}
                >
                    Регистрация
                </button>
            </div>

            <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="hello@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            {mode === 'register' && (
                <>
                    <div className="form-group">
                        <label>Имя</label>
                        <input type="text" placeholder="Ваше имя" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Телефон</label>
                        <input type="tel" placeholder="+380" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                </>
            )}

            <div className="form-group">
                <label>Пароль</label>
                <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>

            <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Загрузка...' : (mode === 'login' ? 'Войти' : 'Зарегистрироваться')}
            </button>

            {mode === 'login' && (
                <button className="btn btn-ghost" style={{ marginTop: 12, fontSize: 13 }} onClick={() => nav('/forgot-password')}>
                    Забыли пароль?
                </button>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════
// FORGOT PASSWORD PAGE
// ═══════════════════════════════════════════
function ForgotPasswordPage({ store }) {
    const nav = useNavigate()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!email) return store.showToast('Введите Email')
        setLoading(true)
        const res = await api.forgotPassword(email)
        setLoading(false)
        if (res && res.message) {
            store.showToast(res.message)
        } else {
            store.showToast('Ошибка отправки')
        }
    }

    return (
        <div className="auth-page">
            <div className="page-header" style={{ position: 'absolute', top: 0, width: '100%', background: 'transparent' }}>
                <button className="back-btn" onClick={() => nav(-1)}>←</button>
            </div>
            <h1 className="h2" style={{ marginTop: 40 }}>Сброс пароля</h1>
            <p className="subtitle">Введите ваш email, чтобы получить ссылку</p>
            <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="hello@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Отправляем...' : 'Отправить ссылку'}
            </button>
        </div>
    )
}

// ═══════════════════════════════════════════
// RESET PASSWORD PAGE
// ═══════════════════════════════════════════
function ResetPasswordPage({ store }) {
    const nav = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    const [pass, setPass] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)

    if (!token) return <div className="auth-page"><p>Неверная ссылка</p></div>

    const handleSubmit = async () => {
        if (!pass || !confirm) return store.showToast('Заполните все поля')
        if (pass !== confirm) return store.showToast('Пароли не совпадают')

        setLoading(true)
        const res = await api.resetPassword(token, pass)
        setLoading(false)

        if (res && res.success) {
            store.showToast('Пароль изменён!')
            nav('/auth')
        } else {
            store.showToast(res?.message || 'Ошибка сброса')
        }
    }

    return (
        <div className="auth-page">
            <h1 className="h2">Новый пароль</h1>
            <p className="subtitle">Придумайте новый пароль</p>
            <div className="form-group">
                <label>Новый пароль</label>
                <input type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} />
            </div>
            <div className="form-group">
                <label>Подтверждение</label>
                <input type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
            </button>
        </div>
    )
}

// ═══════════════════════════════════════════
// PROFILE PAGE
// ═══════════════════════════════════════════
function ProfilePage({ store }) {
    const nav = useNavigate()
    const user = store.user || { name: 'Гость', phone: '' }

    const menuItems = [
        { icon: '📦', label: 'Мои заказы', action: () => nav('/orders') },
        { icon: '📍', label: 'Адреса доставки', action: () => nav('/addresses') },
        { icon: '❤️', label: 'Избранное', action: () => nav('/favorites') },
        { icon: '🎟️', label: 'Промокоды', action: () => nav('/promos') },
        { icon: '🚪', label: 'Выйти', action: () => { store.logout(); nav('/auth') } },
    ]

    return (
        <div>
            <div className="page-header">
                <h2>Личный кабинет</h2>
            </div>
            <div className="profile-page">
                <div className="profile-header">
                    <div className="profile-avatar">👤</div>
                    <div>
                        <div className="profile-name">{user.name || (user.id ? 'Пользователь' : 'Гость')}</div>
                        <div className="profile-phone">{user.phone || user.email || 'Войдите в аккаунт'}</div>
                        {user.id && store.settings.loyalty_enabled === 'true' && (
                            <div style={{ marginTop: 8, padding: '4px 10px', background: 'rgba(255,92,0,0.1)', color: 'var(--primary)', borderRadius: 20, fontSize: 13, fontWeight: 700, display: 'inline-block' }}>
                                💰 Кэшбэк: {Math.round(user.cashback_balance || 0)}₴
                            </div>
                        )}
                    </div>
                </div>
                <div className="profile-menu">
                    {menuItems.map((item, i) => (
                        <div key={i} className="profile-menu-item" onClick={item.action}>
                            <div className="profile-menu-icon">{item.icon}</div>
                            <span className="profile-menu-text">{item.label}</span>
                            <span className="profile-menu-arrow">›</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════
// USER ORDERS PAGE
// ═══════════════════════════════════════════
function UserOrdersPage({ store }) {
    const nav = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedOrderId, setExpandedOrderId] = useState(null)

    useEffect(() => {
        if (store.user) {
            api.fetchUserOrders(store.user.id).then(data => {
                setOrders(data || [])
                setLoading(false)
            })
        }
    }, [store.user])

    const toggleOrder = (id) => {
        setExpandedOrderId(prev => prev === id ? null : id)
    }

    const repeatOrder = (order) => {
        store.clearCart()
        order.items.forEach(item => {
            if (item.product) {
                store.addToCart(item.product, item.quantity, item.selected_options)
            }
        })
        store.showToast('Заказ добавлен в корзину')
        nav('/cart')
    }

    if (loading) return <div className="loading-screen">Загрузка истории...</div>

    return (
        <div>
            <div className="page-header">
                <button className="back-btn" onClick={() => nav('/profile')}>←</button>
                <h2>Мои заказы</h2>
            </div>
            <div className="orders-page" style={{ padding: 16, paddingBottom: 100 }}>
                {orders.length === 0 ? (
                    <div className="empty-state">
                        <div className="emoji">📜</div>
                        <h3>История пуста</h3>
                        <p>Вы еще ничего не заказывали</p>
                        <button className="btn btn-primary" onClick={() => nav('/')}>В меню</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {orders.map(o => {
                            const isExpanded = expandedOrderId === o.id
                            const statusColor = o.order_status === 'done' ? '#10B981' : o.order_status === 'cancelled' ? '#EF4444' : '#F59E0B'
                            return (
                                <div key={o.id} style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {/* Card Header (Clickable) */}
                                    <div onClick={() => toggleOrder(o.id)} style={{ padding: 16, cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontWeight: 700, fontSize: 15 }}>Заказ #{String(o.id).slice(0, 8)}</span>
                                            <span style={{
                                                color: statusColor,
                                                fontSize: 13, fontWeight: 600,
                                                background: `${statusColor}15`,
                                                padding: '2px 8px',
                                                borderRadius: 6
                                            }}>
                                                {o.order_status === 'new' ? 'Новый' :
                                                    o.order_status === 'cooking' ? 'Готовится' :
                                                        o.order_status === 'delivering' ? 'В пути' :
                                                            o.order_status === 'done' ? 'Выполнен' : 'Отменён'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 12 }}>
                                            {new Date(o.created_at).toLocaleString('ru', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: -8 }}>
                                                {o.items?.slice(0, 3).map((item, i) => (
                                                    <div key={i} style={{
                                                        width: 32, height: 32, borderRadius: 8,
                                                        background: '#f5f5f5', border: '1px solid #fff',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        overflow: 'hidden', marginLeft: i > 0 ? -10 : 0, zIndex: 10 - i
                                                    }}>
                                                        <img src={api.getImageUrl(item.product?.image || item.product?.image_url)}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                ))}
                                                {o.items?.length > 3 && (
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: 8,
                                                        background: '#f5f5f5', border: '1px solid #fff',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 10, fontWeight: 700, color: '#666',
                                                        marginLeft: -10, zIndex: 0
                                                    }}>
                                                        +{o.items.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontWeight: 700, fontSize: 16 }}>{Math.round(o.final_amount)}₴</span>
                                                <span style={{
                                                    fontSize: 12, color: '#9CA3AF',
                                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.3s ease'
                                                }}>▼</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    <div style={{
                                        maxHeight: isExpanded ? 1000 : 0,
                                        opacity: isExpanded ? 1 : 0,
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        background: '#FAFAFA',
                                        borderTop: '1px solid #F0F0F0'
                                    }}>
                                        <div style={{ padding: 16 }}>
                                            <div style={{ marginBottom: 16 }}>
                                                {o.items?.map((item, i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                                                        <span style={{ color: '#4B5563' }}>
                                                            {item.quantity}x {item.product?.name || 'Товар удален'}
                                                        </span>
                                                        <span style={{ fontWeight: 600 }}>{Math.round(item.price_at_purchase * item.quantity)}₴</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 12, marginBottom: 16 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                                    <span style={{ color: '#9CA3AF' }}>Доставка</span>
                                                    <span>{Math.round(o.delivery_fee)}₴</span>
                                                </div>
                                                {o.discount_amount > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: '#10B981' }}>
                                                        <span>Скидка</span>
                                                        <span>-{Math.round(o.discount_amount)}₴</span>
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginTop: 8 }}>
                                                    <span>Итого</span>
                                                    <span>{Math.round(o.final_amount)}₴</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => toggleOrder(o.id)}>
                                                    Свернуть
                                                </button>
                                                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => repeatOrder(o)}>
                                                    ↻ Повторить заказ
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════
// PROMOS PAGE
// ═══════════════════════════════════════════
function PromosPage({ store }) {
    const nav = useNavigate()
    const [copied, setCopied] = useState(null)

    const copyCode = (code) => {
        navigator.clipboard?.writeText(code)
        setCopied(code)
        setTimeout(() => setCopied(null), 1500)
    }

    return (
        <div>
            <div className="page-header">
                <button className="back-btn" onClick={() => nav(-1)}>←</button>
                <h2>Мои промокоды</h2>
            </div>
            <div className="promo-page">
                {store.promocodes.map(p => (
                    <div key={p.code} className="promo-card">
                        <div className="promo-card-code">{p.code}</div>
                        <div className="promo-card-desc">{p.description || (p.discount_type === 'percentage' ? `Скидка ${p.discount_value}%` : p.discount_type === 'fixed' ? `Скидка ${p.discount_value}₴` : 'Подарок за заказ 🎁')}</div>
                        <div className="promo-card-expires">
                            Действует до: {p.expires_at ? new Date(p.expires_at).toLocaleString('ru', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '∞'}
                        </div>
                        <button className="promo-card-copy" onClick={() => copyCode(p.code)}>
                            {copied === p.code ? '✓ Скопировано' : '📋 Копировать'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════
// ADDRESSES PAGE
// ═══════════════════════════════════════════
function AddressesPage({ store }) {
    const nav = useNavigate()
    const [addresses, setAddresses] = useState([])
    const [loading, setLoading] = useState(true)
    const [newAddr, setNewAddr] = useState('')

    useEffect(() => {
        load()
    }, [])

    const load = () => {
        api.fetchUserAddresses(store.user.id).then(res => {
            setAddresses(res || [])
            setLoading(false)
        })
    }

    const handleAdd = async () => {
        if (!newAddr.trim()) return
        await api.addUserAddress(store.user.id, {
            address_text: newAddr,
            city_id: store.selectedCity?.id,
            street: newAddr // Save full string as requested by user
        })
        setNewAddr('')
        load()
        store.showToast('Адрес добавлен')
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить адрес?')) return
        await api.deleteUserAddress(store.user.id, id)
        load()
        store.showToast('Адрес удален')
    }

    return (
        <div>
            <div className="page-header">
                <button className="back-btn" onClick={() => nav(-1)}>←</button>
                <h2>Адреса доставки</h2>
            </div>
            <div className="promo-page"> {/* Reuse styling */}
                <div style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
                    <input
                        placeholder="Введите адрес (улица, дом...)"
                        value={newAddr}
                        onChange={e => setNewAddr(e.target.value)}
                        style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid #ddd' }}
                    />
                    <button className="btn btn-primary" onClick={handleAdd}>+</button>
                </div>

                {loading ? <div className="loading-screen">Загрузка...</div> :
                    addresses.length === 0 ? (
                        <div className="empty-state">
                            <div className="emoji">📍</div>
                            <h3>Нет адресов</h3>
                            <p>Добавьте адрес для быстрой доставки</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {addresses.map(a => (
                                <div key={a.id} style={{
                                    padding: 16, background: '#fff', borderRadius: 12,
                                    margin: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{a.street}</div>
                                        <div style={{ fontSize: 13, color: '#888' }}>{a.address_text}</div>
                                        {a.city && <div style={{ fontSize: 12, color: 'var(--primary)' }}>{a.city.name}</div>}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(a.id)}
                                        style={{ border: 'none', background: '#ffebee', color: '#d32f2f', width: 32, height: 32, borderRadius: 8, cursor: 'pointer' }}
                                    >✕</button>
                                </div>
                            ))}
                        </div>
                    )
                }
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════
// FAVORITES PAGE
// ═══════════════════════════════════════════
function FavoritesPage({ store }) {
    const nav = useNavigate()
    const favProducts = store.products.filter(p => store.favorites.includes(p.id))

    return (
        <div>
            <div className="page-header">
                <button className="back-btn" onClick={() => nav(-1)}>←</button>
                <h2>Избранное</h2>
            </div>
            <div className="favorites-page">
                {favProducts.length === 0 ? (
                    <div className="empty-state">
                        <div className="emoji">💔</div>
                        <h3>Пока пусто</h3>
                        <p>Нажмите ❤️ на товаре, чтобы добавить его сюда</p>
                        <button className="btn btn-primary" onClick={() => nav('/')}>В меню</button>
                    </div>
                ) : (
                    <div className="products-grid">
                        {favProducts.map(p => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                isFav={true}
                                onFav={() => store.toggleFav(p.id)}
                                onAdd={() => store.addToCart(p)}
                                onClick={() => nav(`/product/${p.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════
// CITY SELECTION MODAL
// ═══════════════════════════════════════════
function CitySelectionModal({ cities, selectedId, onSelect, onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal bottom-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Выберите город</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body" style={{ padding: '0 0 20px 0' }}>
                    <div className="city-list">
                        {cities.filter(c => c.is_active).map(city => (
                            <div
                                key={city.id}
                                className={`city-item ${city.id === selectedId ? 'active' : ''}`}
                                onClick={() => onSelect(city)}
                            >
                                <span className="city-name">{city.name}</span>
                                {city.id === selectedId && <span className="check">✓</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
