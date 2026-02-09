// Enhanced Register Page with validation and UX improvements
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { setToken } from '../utils/auth';
import { useToast } from '../components/Toast';
import PasswordStrengthIndicator, { validatePasswordStrength } from '../components/PasswordStrength';
import { validatePhone, validateEmail, validatePassword, validateName } from '../utils/validation';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
    });
    const [location, setLocation] = useState(null); // Store location separately
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    // Get user's current location
    const getCurrentLocation = () => {
        setLoadingLocation(true);

        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            setLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                toast.success('Location detected successfully!');
                setLoadingLocation(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                toast.error('Unable to get your location. Please allow location access or enter manually.');
                setLoadingLocation(false);
            }
        );
    };

    // Validate field on blur
    const validateField = (name, value) => {
        let error = null;

        switch (name) {
            case 'name':
                error = validateName(value);
                break;
            case 'phone':
                error = validatePhone(value);
                break;
            case 'email':
                error = validateEmail(value);
                break;
            case 'password':
                error = validatePassword(value);
                break;
            default:
                break;
        }

        setErrors(prev => ({
            ...prev,
            [name]: error
        }));

        return error === null;
    };

    const handleBlur = (e) => {
        validateField(e.target.name, e.target.value);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all fields
        const nameValid = validateField('name', formData.name);
        const phoneValid = validateField('phone', formData.phone);
        const emailValid = formData.email ? validateField('email', formData.email) : true;
        const passwordValid = validateField('password', formData.password);

        if (!nameValid || !phoneValid || !emailValid || !passwordValid) {
            toast.error('Please fix the errors in the form');
            return;
        }

        // Check password strength
        const { isValid } = validatePasswordStrength(formData.password);
        if (!isValid) {
            toast.error('Please use a stronger password meeting all requirements');
            return;
        }

        // Check location
        if (!location) {
            toast.error('Please allow location access or enter your location');
            return;
        }

        setLoading(true);

        try {
            // Prepare registration data with location as a dictionary
            const registrationData = {
                ...formData,
                location: location  // Send as {lat: ..., lng: ...}
            };

            console.log('Registering user:', { ...registrationData, password: '[REDACTED]' });
            await api.post('/auth/register/user', registrationData);

            toast.success('Account created successfully!', 'Welcome to PackNow');

            // Auto login
            const loginResponse = await api.post('/auth/login/user', {
                phone: formData.phone,
                password: formData.password,
            });

            setToken(loginResponse.data.access_token, loginResponse.data.refresh_token);
            console.log('Login successful, redirecting to dashboard');

            // Small delay for user to see success message
            setTimeout(() => {
                navigate('/dashboard');
            }, 500);
        } catch (err) {
            console.error('Registration error:', err);
            const errorMessage = err.response?.data?.detail || 'Registration failed. Please try again.';
            toast.error(errorMessage, 'Registration Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="card shadow-xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
                        <p className="mt-2 text-gray-600">Join PackNow for professional packaging services</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name *
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className={`input ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number *
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                className={`input ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="+919876543210"
                                value={formData.phone}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">International format with country code</p>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address (Optional)
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password *
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className={`input pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                            <PasswordStrengthIndicator password={formData.password} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Location *
                            </label>
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                disabled={loadingLocation || location}
                                className="w-full btn btn-secondary flex items-center justify-center gap-2"
                            >
                                {loadingLocation ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                        Getting location...
                                    </>
                                ) : location ? (
                                    <>
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1  1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Location Detected
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Get Current Location
                                    </>
                                )}
                            </button>
                            {location && (
                                <p className="mt-1 text-xs text-green-600">
                                    ✓ Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Privacy Note */}
                <p className="mt-4 text-center text-xs text-gray-500">
                    By creating an account, you agree to our{' '}
                    <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
                </p>
            </div>
        </div>
    );
}
