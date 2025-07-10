/**
 * Config Database connection - re-export from infrastructure
 * This file provides a consistent import path for database across the config module
 */

import db, { dbPromise } from '../infrastructure/database/index.js';

export default dbPromise;
export { dbPromise, db };