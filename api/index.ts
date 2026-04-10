import { app } from '../server.ts'

/**
 * Vercel Serverless Function Bridge
 * This file serves as the entry point for Vercel, importing the unified 
 * Express app from the root server.ts to ensure consistency between 
 * local development and production.
 */

export default app
