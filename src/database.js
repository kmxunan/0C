/**
 * Database connection - re-export from infrastructure
 * This file provides a consistent import path for database across the application
 */

import db, { dbPromise } from './infrastructure/database/index.js';

export default dbPromise;
export { dbPromise, db };