// Packer Login Page — Separate interface for service providers
import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { FiTruck, FiPhone, FiLock } from 'react-icons/fi';

export default function PackerLogin() {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({ phone: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/login/packer', {
                phone: formData.phone,
                password: formData.password,
            });

            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
            localStorage.setItem('user_role', 'packer');

            window.location.href = '/packer/dashboard';
        } catch (error) {
            showToast(error.response?.data?.detail || 'Invalid credentials', 'error');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-gray-900 to-emerald-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                        <FiTruck className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Packer Portal</h1>
                    <p className="text-gray-400 mt-2">PackNow Service Provider Login</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <div className="relative">
                                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    id="packer-phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input pl-10"
                                    placeholder="+919876543210"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    id="packer-password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input pl-10"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 text-lg font-semibold text-white rounded-xl transition-all duration-200"
                            style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                        >
                            {loading ? 'Signing in...' : 'Sign In to Packer Portal'}
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
