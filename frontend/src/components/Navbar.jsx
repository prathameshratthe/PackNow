// Navbar Component
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPackage, FiLogOut, FiUser } from 'react-icons/fi';
import { isAuthenticated, removeToken } from '../utils/auth';

export default function Navbar() {
    const navigate = useNavigate();
    const authenticated = isAuthenticated();

    const handleLogout = () => {
        removeToken();
        navigate('/login');
    };

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="bg-primary-600 p-2 rounded-lg">
                            <FiPackage className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                            PackNow
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-4">
                        {authenticated ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/create-order"
                                    className="btn btn-primary"
                                >
                                    New Order
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="btn btn-secondary flex items-center space-x-2"
                                >
                                    <FiLogOut className="h-4 w-4" />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-secondary">
                                    Login
                                </Link>
                                <Link to="/register" className="btn btn-primary">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
