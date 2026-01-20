/**
 * Production-grade error handling for HubSpot OAuth
 */

export interface OAuthError {
  code: string;
  message: string;
  details?: string;
  statusCode: number;
  timestamp: string;
}

export class HubSpotOAuthError extends Error {
  code: string;
  statusCode: number;
  details?: string;

  constructor(code: string, message: string, statusCode: number = 500, details?: string) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'HubSpotOAuthError';
  }

  toJSON(): OAuthError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode,
      timestamp: new Date().toISOString(),
    };
  }
}

export const OAuthErrors = {
  MISSING_CODE: (details?: string) => 
    new HubSpotOAuthError('MISSING_CODE', 'Authorization code not provided', 400, details),
  
  MISSING_STATE: (details?: string) => 
    new HubSpotOAuthError('MISSING_STATE', 'State parameter not provided', 400, details),
  
  SESSION_EXPIRED: (details?: string) => 
    new HubSpotOAuthError('SESSION_EXPIRED', 'Authorization session expired. Please try connecting again.', 401, details),
  
  TOKEN_EXCHANGE_FAILED: (details?: string) => 
    new HubSpotOAuthError('TOKEN_EXCHANGE_FAILED', 'Failed to exchange authorization code for token', 400, details),
  
  USER_INFO_FAILED: (details?: string) => 
    new HubSpotOAuthError('USER_INFO_FAILED', 'Failed to retrieve HubSpot user information', 500, details),
  
  SESSION_SAVE_FAILED: (details?: string) => 
    new HubSpotOAuthError('SESSION_SAVE_FAILED', 'Failed to save session data', 500, details),
  
  INIT_FAILED: (details?: string) => 
    new HubSpotOAuthError('INIT_FAILED', 'Failed to initiate OAuth flow', 500, details),
};
