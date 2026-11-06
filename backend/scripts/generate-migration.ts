// Diffs the entities against the live database and writes a migration class.
// Usage: npm run migration:generate -- <Name>
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import 'reflect-metadata';
import { baseDataSourceOptions } from 'src/database/postgres/options';
import { DataSource } from 'typeorm';

async function main() {
  const name = process.argv[2];
  if (!name) {
    console.error('Usage: npm run migration:generate -- <Name>');
    process.exit(1);
  }

  const ds = new DataSource(baseDataSourceOptions());
  await ds.initialize();
  const sql = await ds.driver.createSchemaBuilder().log();
  await ds.destroy();

  if (sql.upQueries.length === 0) {
    console.log('No changes in database schema were found.');
    process.exit(0);
  }

  const timestamp = Date.now();
  const className = `${name}${timestamp}`;
  const render = (q: { query: string; parameters?: unknown[] }) => {
    const text = q.query
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${');
    const params = q.parameters?.length
      ? `, ${JSON.stringify(q.parameters)}`
      : '';
    return `    await queryRunner.query(\`${text}\`${params});`;
  };

  const file = `import type { MigrationInterface, QueryRunner } from 'typeorm';

  export class ${className} implements MigrationInterface {
    name = '${className}';

    public async up(queryRunner: QueryRunner): Promise<void> {
  ${sql.upQueries.map(render).join('\n')}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
  ${[...sql.downQueries].reverse().map(render).join('\n')}
    }
  }
  `;

  const path = join('src', 'database', 'migrations', `${timestamp}-${name}.ts`);
  writeFileSync(path, file);
  console.log(
    `Migration written: ${path} (${sql.upQueries.length} statements). Register it in migrations/index.ts`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
