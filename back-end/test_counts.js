const http = require('http');

async function request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 3000,
            path: '/api' + path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
            });
        });
        req.on('error', e => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTest() {
    try {
        console.log('--- Testing Product Counts ---');
        // 1. Get Categories
        const cats = await request('/categories?all=true&city_id=1');
        if (!Array.isArray(cats)) throw new Error('Failed to fetch categories');

        console.log(`Found ${cats.length} categories.`);
        for (const c of cats) {
            console.log(`- ${c.name}: ${c.productsCount} products`);
        }

        // 2. Pick first category and add product
        const cat = cats[0];
        const initialCount = cat.productsCount || 0;
        console.log(`Adding product to ${cat.name} (Current: ${initialCount})...`);

        const newProd = await request('/products', 'POST', {
            name: 'Test Product Count',
            description: 'Test',
            price: 100,
            category_id: cat.id,
            city_id: 1,
            is_active: true
        });

        // 3. Check count again
        const catsAfter = await request('/categories?all=true&city_id=1');
        const catAfter = catsAfter.find(c => c.id === cat.id);
        console.log(`- ${catAfter.name}: ${catAfter.productsCount} products (Expected: ${initialCount + 1})`);

        if (catAfter.productsCount === initialCount + 1) console.log('SUCCESS: Count incremented');
        else console.error('FAIL: Count did not increment');

        // 4. Delete product
        console.log('Deleting test product...');
        await request(`/products/${newProd.id}`, 'DELETE');

        // 5. Check count final
        const catsFinal = await request('/categories?all=true&city_id=1');
        const catFinal = catsFinal.find(c => c.id === cat.id);
        console.log(`- ${catFinal.name}: ${catFinal.productsCount} products (Expected: ${initialCount})`);

        if (catFinal.productsCount === initialCount) console.log('SUCCESS: Count decremented');
        else console.error('FAIL: Count did not decrement');

    } catch (e) {
        console.error('TEST ERROR:', e.message);
    }
}

runTest();
