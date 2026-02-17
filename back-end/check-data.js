const Database = require('better-sqlite3');
const db = new Database('ukusiruby.db');
const rows = db.prepare('SELECT id, name, working_hours, work_start_time, work_end_time FROM cities').all();
console.log(JSON.stringify(rows, null, 2));
