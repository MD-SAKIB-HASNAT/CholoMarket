// npm run migration:run | migration:revert | migration:show
import 'reflect-metadata';
import { AppDataSource } from 'src/database/postgres/data-source';

async function main() {
  const command = process.argv[2] ?? 'run';
  await AppDataSource.initialize();
  try {
    if (command === 'run') {
      const done = await AppDataSource.runMigrations({ transaction: 'each' });
      console.log(
        done.length
          ? `Applied: ${done.map((m) => m.name).join(', ')}`
          : 'Database is up to date.',
      );
    } else if (command === 'revert') {
      await AppDataSource.undoLastMigration({ transaction: 'each' });
      console.log('Reverted the last migration.');
    } else if (command === 'show') {
      const pending = await AppDataSource.showMigrations();
      console.log(
        pending ? 'There are pending migrations.' : 'No pending migrations.',
      );
    } else {
      throw new Error(`Unknown command: ${command}`);
    }
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
