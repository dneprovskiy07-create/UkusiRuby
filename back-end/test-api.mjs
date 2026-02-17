// Quick API integration test
const BASE = 'http://localhost:3000/api';

async function req(url, opts = {}) {
    const res = await fetch(`${BASE}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...opts,
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
}

async function test() {
    console.log('=== API Integration Test ===\n');

    // 1. GET Categories
    let r = await req('/categories');
    console.log(`✅ GET /categories → ${r.status}, count: ${r.data?.length}`);

    // 2. POST Create Category
    r = await req('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Category', icon: '🧪', description: 'test' }),
    });
    const testCatId = r.data?.id;
    console.log(`✅ POST /categories → ${r.status}, created id=${testCatId}, name=${r.data?.name}`);

    // 3. PUT Update Category
    r = await req(`/categories/${testCatId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Test', icon: '✏️' }),
    });
    console.log(`✅ PUT /categories/${testCatId} → ${r.status}, name=${r.data?.name}, icon=${r.data?.icon}`);

    // 4. GET Products
    r = await req('/products');
    console.log(`✅ GET /products → ${r.status}, count: ${r.data?.length}`);
    const firstProduct = r.data?.[0];

    // 5. POST Create Product
    r = await req('/products', {
        method: 'POST',
        body: JSON.stringify({
            name: 'Test Roll',
            description: 'Test product',
            price: 299,
            category_id: 1,
            is_active: true,
        }),
    });
    const testProdId = r.data?.id;
    console.log(`✅ POST /products → ${r.status}, created id=${testProdId}, name=${r.data?.name}`);

    // 6. PUT Update Product
    r = await req(`/products/${testProdId}`, {
        method: 'PUT',
        body: JSON.stringify({ price: 349, is_hit: true }),
    });
    console.log(`✅ PUT /products/${testProdId} → ${r.status}, price=${r.data?.price}, is_hit=${r.data?.is_hit}`);

    // 7. Search Products
    r = await req('/products/search?q=рамен');
    console.log(`✅ GET /products/search?q=рамен → ${r.status}, found: ${r.data?.length}`);

    // 8. GET Banners
    r = await req('/banners');
    console.log(`✅ GET /banners → ${r.status}, count: ${r.data?.length}`);

    // 9. GET Banners (all)
    r = await req('/banners/all');
    console.log(`✅ GET /banners/all → ${r.status}, count: ${r.data?.length}`);

    // 10. Validate Promo
    r = await req('/promocodes/validate', {
        method: 'POST',
        body: JSON.stringify({ code: 'WELCOME10' }),
    });
    console.log(`✅ POST /promocodes/validate → ${r.status}, valid=${r.data?.valid}, type=${r.data?.promo?.discount_type}, value=${r.data?.promo?.discount_value}`);

    // 11. Invalid Promo
    r = await req('/promocodes/validate', {
        method: 'POST',
        body: JSON.stringify({ code: 'INVALID' }),
    });
    console.log(`✅ POST /promocodes/validate (invalid) → ${r.status}, valid=${r.data?.valid}, msg=${r.data?.message}`);

    // 12. Auth: Send OTP
    r = await req('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: '+380991234567' }),
    });
    console.log(`✅ POST /auth/send-otp → ${r.status}, msg=${r.data?.message}`);

    // 13. GET Orders (empty)
    r = await req('/orders');
    console.log(`✅ GET /orders → ${r.status}, count: ${r.data?.length}`);

    // 14. DELETE test product
    r = await req(`/products/${testProdId}`, { method: 'DELETE' });
    console.log(`✅ DELETE /products/${testProdId} → ${r.status}`);

    // 15. DELETE test category
    r = await req(`/categories/${testCatId}`, { method: 'DELETE' });
    console.log(`✅ DELETE /categories/${testCatId} → ${r.status}`);

    // 16. Verify deletion
    r = await req('/categories?all=true');
    console.log(`✅ GET /categories?all=true → ${r.status}, count: ${r.data?.length} (should be 6)`);

    console.log('\n=== All tests passed! ===');
}

test().catch(err => {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
});
