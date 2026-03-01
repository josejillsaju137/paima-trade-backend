import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});

/**
 * Initializes the database by creating necessary tables if they don't exist.
 */
export const initDb = async () => {
  const client = await pool.connect();
  try {
    console.log('Connected to database, initializing schema...');

    // Create the market_prices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS market_prices (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(50) NOT NULL,
        price NUMERIC NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create an index for faster queries by symbol and time
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_market_prices_symbol_time 
      ON market_prices (symbol, timestamp DESC);
    `);

    // Phase 2 Tables:

    // Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        fiat_balance NUMERIC DEFAULT 100000.0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Trades
    await client.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(50) NOT NULL,
        type VARCHAR(10) CHECK (type IN ('buy', 'sell')) NOT NULL,
        quantity NUMERIC NOT NULL,
        price NUMERIC NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Portfolios (Holdings)
    await client.query(`
      CREATE TABLE IF NOT EXISTS portfolios (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(50) NOT NULL,
        quantity NUMERIC NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, symbol)
      );
    `);

    console.log('Schema initialized successfully.');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export default pool;
