const Database = require('better-sqlite3');
const db = new Database('ukusiruby.db');
const columns = db.pragma('table_info(cities)');
console.log(JSON.stringify(columns, null, 2));
