// Auth utilities for mobile
import * as SecureStore from 'expo-secure-store';

export const saveTokens = async (accessToken, refreshToken) => {
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
};

export const getAccessToken = async () => {
    return await SecureStore.getItemAsync('access_token');
};

export const removeTokens = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
};

export const isAuthenticated = async () => {
    const token = await SecureStore.getItemAsync('access_token');
    return !!token;
};
