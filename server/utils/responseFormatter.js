'use strict';

/**
 * Standardized API response formatter.
 * All responses must use these helpers to maintain a consistent envelope.
 */

/**
 * Returns a success response object.
 * @param {any} data - The payload to return.
 * @param {string} message - Optional success message.
 */
const success = (data = {}, message = 'Success') => ({
  success: true,
  data,
  message,
});

/**
 * Returns a failure response object.
 * Never expose internal stack traces.
 * @param {string} error - Human-readable error description.
 * @param {object} details - Optional safe details object.
 */
const failure = (error = 'An error occurred', details = {}) => ({
  success: false,
  error,
  details,
});

module.exports = { success, failure };
