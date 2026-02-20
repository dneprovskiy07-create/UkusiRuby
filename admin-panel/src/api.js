// ═══════════════════════════════════════════
// UkusiRuby Admin — API Service
// Fallback: uses mock data when backend is unavailable
// ═══════════════════════════════════════════

const BASE = '/api';

export function getImageUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // If we're using a relative BASE (browser dev with Vite proxy), return path as is.
    if (BASE.startsWith('/')) {
        return path;
    }

    // For absolute BASE:
    return path; // Return as is, let the browser handle it relative to the domain
}

async function request(url, options = {}) {
    const res = await fetch(`${BASE}${url}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData.message || `HTTP error! status: ${res.status}`;
        console.error(`[API Error] ${url}:`, message);
        throw new Error(message);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

// ─── File Upload ───
export async function uploadFile(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${BASE}/upload`, {
            method: 'POST',
            body: formData,
            // НЕ устанавливаем Content-Type — browser сам поставит multipart boundary
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('[API] Upload failed:', err.message);
        return null;
    }
}

// ─── Categories ───
export async function fetchCategories(cityId) {
    return request(`/categories?all=true${cityId ? `&city_id=${cityId}` : ''}`);
}
export async function createCategory(data) { return request('/categories', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateCategory(id, data) { return request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function deleteCategory(id) { return request(`/categories/${id}`, { method: 'DELETE' }); }
export async function reorderCategory(id, direction) { return request(`/categories/${id}/reorder`, { method: 'POST', body: JSON.stringify({ direction }) }); }

// ─── Products ───
export async function fetchProducts(cityId) {
    return request(`/products?all=true${cityId ? `&city_id=${cityId}` : ''}`);
}
export async function createProduct(data) { return request('/products', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateProduct(id, data) { return request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function deleteProduct(id) { return request(`/products/${id}`, { method: 'DELETE' }); }
export async function reorderProduct(id, direction) { return request(`/products/${id}/reorder`, { method: 'POST', body: JSON.stringify({ direction }) }); }

// ─── Orders ───
export async function fetchOrders(cityId) {
    return request(`/orders?all=true${cityId ? `&city_id=${cityId}` : ''}`);
}
export async function fetchStats(cityId) {
    return request(`/orders/stats${cityId ? `?city_id=${cityId}` : ''}`);
}
export async function updateOrderStatus(id, s) { return request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: s }) }); }

// ─── Banners ───
export async function fetchBanners(cityId) {
    return request(`/banners/all${cityId ? `?city_id=${cityId}` : ''}`);
}
export async function createBanner(data) { return request('/banners', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateBanner(id, data) { return request(`/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function deleteBanner(id) { return request(`/banners/${id}`, { method: 'DELETE' }); }

// ─── Promocodes ───
export async function fetchPromocodes(cityId) {
    return request(`/promocodes${cityId ? `?city_id=${cityId}` : ''}`);
}
export async function createPromocode(data) { return request('/promocodes', { method: 'POST', body: JSON.stringify(data) }); }
export async function deletePromocode(id) { return request(`/promocodes/${id}`, { method: 'DELETE' }); }

// ─── Settings & Cities ───
export async function fetchSettings() { return request('/settings'); }
export async function updateSetting(key, value) { return request(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }); }

export async function fetchCities() { return request('/settings/cities'); }
export async function createCity(data) { return request('/settings/cities', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateCity(id, data) { return request(`/settings/cities/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function deleteCity(id) { return request(`/settings/cities/${id}`, { method: 'DELETE' }); }

// ─── Pickup Points ───
export async function fetchPickupPoints(cityId) { return request(`/pickup-points?city_id=${cityId}`); }
export async function createPickupPoint(data) { return request('/pickup-points', { method: 'POST', body: JSON.stringify(data) }); }
export async function updatePickupPoint(id, data) { return request(`/pickup-points/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function deletePickupPoint(id) { return request(`/pickup-points/${id}`, { method: 'DELETE' }); }

export async function migrateMenu() { return request('/catalog/migrate', { method: 'POST' }); }
export async function syncMenu(fromCityId, toCityId) {
    return request('/catalog/sync', { method: 'POST', body: JSON.stringify({ fromCityId, toCityId }) });
}

export async function syncAllCities() {
    return request('/catalog/sync-all', { method: 'POST' });
}
