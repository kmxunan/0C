/**
 * HTTP Error Handler Utility
 * Re-exports error handling functionality for HTTP interfaces
 */

import { enhancedErrorHandler, notFoundHandler } from '../../../shared/middleware/enhancedErrorHandler.js';
import { AppError, ValidationError, AuthenticationError, DatabaseError } from '../../../shared/middleware/enhancedErrorHandler.js';

// Re-export error classes
export {
  AppError,
  ValidationError,
  AuthenticationError,
  DatabaseError,
  enhancedErrorHandler,
  notFoundHandler
};

// Default export for convenience
export default enhancedErrorHandler;