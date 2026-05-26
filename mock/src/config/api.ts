// Centralized API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  SERVER_URL: import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'
};

// Helper function to get full image URL
export const getImageUrl = (path: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path; // already full URL
  return `${API_CONFIG.SERVER_URL}${path}`;
};

// Helper function to get API endpoint URL
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};