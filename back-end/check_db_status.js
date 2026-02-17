const Database = require('better-sqlite3');
const db = new Database('ukusiruby.db');

try {
    console.log('--- Cities ---');
    const cities = db.prepare('SELECT * FROM cities').all();
    console.log(cities);

    console.log('\n--- Products Count by City and Status ---');
    const counts = db.prepare(`
        SELECT city_id, is_active, COUNT(*) as count 
        FROM products 
        GROUP BY city_id, is_active
    `).all();
    console.log(counts);

    if (cities.length > 0) {
        const cityId = cities[0].id;
        console.log(`\n--- Sample Products for City ${cityId} ---`);
        const products = db.prepare(`
            SELECT id, name, category_id, is_active 
            FROM products 
            WHERE city_id = ? 
            LIMIT 5
        `).all(cityId);
        console.log(products);
    }

} catch (e) {
    console.error('DB Error:', e.message);
}
