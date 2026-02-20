// ═══════════════════════════════════════════
// UkusiRuby Mobile — API Service
// Fallback: uses mock data when backend is unavailable
// ═══════════════════════════════════════════

const BASE = 'https://ukusiruby.com/api';

export async function request(url, options = {}) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const res = await fetch(`${BASE}${url}`, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            signal: controller.signal,
            ...options,
            body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
            console.warn(`[API] ${url} failed with status ${res.status}`);
            return null; // Return null on error to trigger fallback
        }
        return await res.json();
    } catch (err) {
        console.warn(`[API] ${url} failed, using fallback:`, err.message);
        return null;
    }
}

// ─── Catalog ───
export async function fetchCategories(cityId) {
    return request(`/categories${cityId ? `?city_id=${cityId}` : ''}`);
}

export async function fetchProducts(categoryId, cityId) {
    const params = new URLSearchParams();
    if (categoryId) params.append('category_id', categoryId);
    if (cityId) params.append('city_id', cityId);

    const qs = params.toString();
    const url = qs ? `/products?${qs}` : '/products';
    return request(url);
}

export async function fetchProductById(id) {
    return request(`/products/${id}`);
}

export async function searchProducts(query, cityId) {
    const url = `/products/search?q=${encodeURIComponent(query)}${cityId ? `&city_id=${cityId}` : ''}`;
    return request(url);
}

// ─── Banners ───
export async function fetchBanners(cityId) {
    return request(`/banners${cityId ? `?city_id=${cityId}` : ''}`);
}

// ─── Orders ───
export async function createOrder(data) {
    return request('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function fetchOrder(id) {
    return request(`/orders/${id}`);
}

export async function fetchUserOrders(userId) {
    return request(`/orders?user_id=${userId}`);
}

// ─── Auth ───
export async function register(data) {
    return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function login(data) {
    return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function forgotPassword(email) {
    return request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export async function resetPassword(token, newPassword) {
    return request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
    });
}

export async function sendOtp(phone) {
    return request('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
    });
}

export async function verifyOtp(phone, code) {
    return request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
    });
}

export async function fetchProfile(userId) {
    return request(`/auth/profile/${userId}`);
}

// ─── Promocodes ───
export async function validatePromocode(code, cityId) {
    return request('/promocodes/validate', {
        method: 'POST',
        body: JSON.stringify({ code, city_id: cityId }),
    });
}

export async function fetchVisiblePromocodes(cityId, userId) {
    return request(`/promocodes/visible?city_id=${cityId}&user_id=${userId || 'guest'}`);
}

// ─── Favorites ───
export async function fetchFavorites(userId) {
    return request(`/products/favorites?user_id=${userId}`);
}

export async function toggleFavorite(userId, productId) {
    return request(`/products/favorites`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, product_id: productId }),
    });
}

// ─── Settings & Cities ───
export async function fetchSettings() {
    return request('/settings');
}

export async function fetchCities() {
    return request('/settings/cities');
}

export async function fetchPickupPoints(cityId) {
    return request(`/pickup-points?city_id=${cityId}`);
}


// ─── Addresses ───

export async function fetchUserAddresses(userId) {
    return request(`/auth/profile/${userId}/addresses`);
}

export async function addUserAddress(userId, data) {
    return request(`/auth/profile/${userId}/addresses`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function deleteUserAddress(userId, addressId) {
    return request(`/auth/profile/${userId}/addresses/${addressId}`, {
        method: 'DELETE'
    });
}

export function getImageUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    const serverRoot = BASE.replace('/api', '');
    return `${serverRoot}${path}`;
}
