// API Service for Mobile
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your backend URL
const API_BASE_URL = 'http://10.0.2.2:8000/api/v1'; // Android emulator
// const API_BASE_URL = 'http://localhost:8000/api/v1'; // iOS simulator
// const API_BASE_URL = 'https://your-api.onrender.com/api/v1'; // Production

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(async (config) => {
    try {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        console.log('Token read error:', e);
    }
    return config;
});

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
        }
        return Promise.reject(error);
    }
);

export default api;
