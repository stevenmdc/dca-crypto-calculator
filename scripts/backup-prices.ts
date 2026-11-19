import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import { localDatabasePath } from '@/lib/db';
import { utcDay } from '@/lib/price-dates';

async function backupPrices() {
  const databasePath = localDatabasePath();
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  const destination = path.resolve(process.env.CRYPTO_BACKUP_DIR || path.join(path.dirname(databasePath), 'backups'));
  const backup = path.join(destination, `crypto-${utcDay(Date.now())}.db`);
  const temporary = `${backup}.${randomUUID()}.tmp`;
  try {
    await mkdir(destination, { recursive: true });
    await db.backup(temporary);
    // Keep the uploadable snapshot self-contained when it is opened again.
    const snapshot = new Database(temporary, { fileMustExist: true });
    try {
      snapshot.pragma('journal_mode = DELETE');
    } finally {
      snapshot.close();
    }
    await rename(temporary, backup);
    console.log(`[${new Date().toISOString()}] Backup saved to ${backup}`);
  } finally {
    db.close();
    await rm(temporary, { force: true });
  }
}

void backupPrices().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
