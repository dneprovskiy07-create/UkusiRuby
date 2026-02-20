import { DataSource } from 'typeorm';
import { join } from 'path';

/**
 * TypeORM CLI data source for migrations.
 * Usage:
 *   npx typeorm migration:generate -d src/data-source.ts src/migrations/MigrationName
 *   npx typeorm migration:run -d src/data-source.ts
 *   npx typeorm migration:revert -d src/data-source.ts
 */
export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'ukusiruby',
    entities: [join(__dirname, 'entities', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    synchronize: false,
});
