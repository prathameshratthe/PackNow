import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';
import PasswordStrengthIndicator, { validatePasswordStrength } from '../components/PasswordStrength';

export default function ForgotPassword() {
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') || 'user';

    const [step, setStep] = useState(1); // 1: phone, 2: OTP, 3: new password
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        if (!phone) { toast.error('Please enter your phone number'); return; }
        setLoading(true);
        try {
            await api.post('/auth/forgot-password/request-otp', { phone, role });
            toast.success('OTP sent to your phone number!');
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to send OTP');
        } finally { setLoading(false); }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) { toast.error('Please enter a valid 6-digit OTP'); return; }
        setLoading(true);
        try {
            await api.post('/auth/forgot-password/verify-otp', { phone, otp, role });
            toast.success('OTP verified! Set your new password.');
            setStep(3);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Invalid OTP');
        } finally { setLoading(false); }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
        const { isValid } = validatePasswordStrength(newPassword);
        if (!isValid) { toast.error('Please choose a stronger password'); return; }
        setLoading(true);
        try {
            await api.post('/auth/forgot-password/reset-password', {
                phone, otp, new_password: newPassword, role
            });
            toast.success('Password reset successfully!', 'You can now log in');
            setTimeout(() => {
                navigate(role === 'packer' ? '/packer/login' : '/login');
            }, 1500);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to reset password');
        } finally { setLoading(false); }
    };

    const stepTitles = ['Enter Phone Number', 'Verify OTP', 'Set New Password'];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="card shadow-xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
                        <p className="mt-2 text-gray-600">{stepTitles[step - 1]}</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${s < step ? 'bg-green-500 text-white' :
                                        s === step ? 'bg-primary-600 text-white' :
                                            'bg-gray-200 text-gray-500'
                                    }`}>
                                    {s < step ? '✓' : s}
                                </div>
                                {s < 3 && <div className={`w-8 h-0.5 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Phone Number */}
                    {step === 1 && (
                        <form onSubmit={handleRequestOTP} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    className="input"
                                    placeholder="+919876543210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <p className="mt-1 text-xs text-gray-500">Enter the phone number associated with your {role === 'packer' ? 'packer' : ''} account</p>
                            </div>
                            <button type="submit" disabled={loading} className="w-full btn btn-primary py-3 text-lg font-semibold">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                        Sending OTP...
                                    </span>
                                ) : 'Send OTP via SMS'}
                            </button>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-Digit OTP</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    className="input text-center text-2xl tracking-[0.5em] font-mono"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    autoFocus
                                />
                                <p className="mt-2 text-xs text-gray-500 text-center">
                                    OTP sent to <strong>{phone}</strong>. Expires in 5 minutes.
                                </p>
                            </div>
                            <button type="submit" disabled={loading || otp.length !== 6} className="w-full btn btn-primary py-3 text-lg font-semibold">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                        Verifying...
                                    </span>
                                ) : 'Verify OTP'}
                            </button>
                            <button type="button" onClick={() => { setOtp(''); handleRequestOTP({ preventDefault: () => { } }); }} className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium">
                                Resend OTP
                            </button>
                        </form>
                    )}

                    {/* Step 3: New Password */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="input pr-10"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPassword ? '🙈' : '👁'}
                                    </button>
                                </div>
                                <PasswordStrengthIndicator password={newPassword} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="input"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                                )}
                            </div>
                            <button type="submit" disabled={loading || !newPassword || newPassword !== confirmPassword} className="w-full btn btn-primary py-3 text-lg font-semibold">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                        Resetting...
                                    </span>
                                ) : 'Reset Password'}
                            </button>
                        </form>
                    )}

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Link to={role === 'packer' ? '/packer/login' : '/login'} className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                            ← Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
