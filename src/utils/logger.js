/**
 * Logger utility - re-export from shared utils
 * This file provides a consistent import path for logger across the application
 */

import logger from '../shared/utils/logger.js';

export default logger;

// Also export the Logger class if needed
export { Logger } from '../shared/utils/logger.js';