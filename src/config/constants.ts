// Configuration constants for the application
export const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScZRI6NlR_A-PHbpJksaDk8_c_adfxLCmh-syN3Mqlw2L_rYw/viewform';

// Base URL for internal API routes. Empty in production (same origin on Vercel).
// Set VITE_API_BASE_URL=http://localhost:3000 when using `vercel dev` locally.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';