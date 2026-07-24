/**
 * Centralized API client for NextChapter
 * Handles all API calls with consistent error handling
 */

import { call } from 'frappe-ui'

/**
 * Make an API call with consistent error handling
 * @param {string} method - API method path (e.g., 'next_chapter.api.setup.get_bootstrap')
 * @param {Object} params - Parameters to pass to the API
 * @returns {Promise<any>} - API response
 */
export function useApi() {
  const apiCall = async (method, params = {}) => {
    try {
      const response = await call(method, params)
      return response
    } catch (error) {
      // Log error for debugging
      console.error(`API Error [${method}]:`, error)
      
      // Re-throw with consistent error structure
      const message = error?.messages?.[0] || error?.message || 'An unknown error occurred'
      const validationError = error?._server_messages || []
      
      throw {
        message,
        validationError,
        originalError: error,
      }
    }
  }

  /**
   * Helper to extract error message from various error formats
   * @param {Error|Object} error - The error object
   * @param {string} fallback - Fallback message
   * @returns {string} - Human-readable error message
   */
  const getErrorMessage = (error, fallback = 'Something went wrong') => {
    if (!error) return fallback
    return error?.messages?.[0] || error?.message || fallback
  }

  return {
    apiCall,
    getErrorMessage,
  }
}

export default useApi
