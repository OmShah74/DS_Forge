import axios from 'axios';

// When running in Docker (browser side), localhost:8000 works.
// When running server-side (Next.js server), we might need the container name, 
// but for this client-side dashboard, localhost is fine.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const checkHealth = async () => {
  try {
    const response = await api.get('/test');
    return response.data;
  } catch (error) {
    console.error("API Connection Error", error);
    return { status: "error", message: "Backend unreachable" };
  }
};
