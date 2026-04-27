import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export async function connectWithRetry(retries: number = 5, delay: number = 2000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('[worker] database connected');
      return;
    } catch (err) {
      console.log(`[worker] database connection attempt ${i + 1}/${retries} failed. Retrying in ${delay}ms...`);
      if (i === retries - 1) throw err;
      await new Promise<void>(res => setTimeout(res, delay));
    }
  }
}

export default prisma;
