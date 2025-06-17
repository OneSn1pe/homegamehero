export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const API_ENDPOINTS = {
  games: `${API_BASE_URL}/games`,
  health: `${API_BASE_URL}/health`,
};