// Authentication utilities
export const setToken = (accessToken, refreshToken) => {
    if (accessToken) {
        localStorage.setItem('access_token', accessToken);
    }
    if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
    }
};

export const getToken = () => {
    return localStorage.getItem('access_token');
};

export const removeToken = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

export const isAuthenticated = () => {
    return !!getToken();
};
