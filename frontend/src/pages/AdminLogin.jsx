// Admin Login Page — Secured with Admin Secret Key
import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { FiShield, FiMail, FiLock, FiKey } from 'react-icons/fi';

export default function AdminLogin() {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({ email: '', password: '', admin_key: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/login/admin', {
                email: formData.email,
                password: formData.password,
                admin_key: formData.admin_key,
            });

            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
            localStorage.setItem('user_role', 'admin');

            window.location.href = '/admin/dashboard';
        } catch (error) {
            showToast(error.response?.data?.detail || 'Invalid credentials', 'error');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
                        <FiShield className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
                    <p className="text-gray-400 mt-2">Secured Access — PackNow Administration</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                        <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                            <FiShield className="h-4 w-4" />
                            This portal requires an Admin Secret Key
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    id="admin-email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input pl-10"
                                    placeholder="admin@packnow.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    id="admin-password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input pl-10"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Secret Key</label>
                            <div className="relative">
                                <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    id="admin-secret-key"
                                    type="password"
                                    value={formData.admin_key}
                                    onChange={(e) => setFormData({ ...formData, admin_key: e.target.value })}
                                    className="input pl-10"
                                    placeholder="Enter admin secret key"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-3 text-lg"
                        >
                            {loading ? 'Verifying...' : 'Secure Sign In'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-gray-500 text-xs mt-6">
                    Protected by PackNow Gateway • Brute force protection active
                </p>
            </div>
        </div>
    );
}
