// Home Page
import React from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiClock, FiTruck, FiCheckCircle } from 'react-icons/fi';

export default function Home() {
    const features = [
        {
            icon: <FiClock className="h-8 w-8" />,
            title: '10-Minute Service',
            description: 'Get professional packaging at your doorstep in just 10 minutes',
        },
        {
            icon: <FiPackage className="h-8 w-8" />,
            title: 'Professional Packing',
            description: 'Trained packers with all materials for safe packaging',
        },
        {
            icon: <FiTruck className="h-8 w-8" />,
            title: 'Multiple Categories',
            description: 'Gift, electronics, food, fragile items, and more',
        },
        {
            icon: <FiCheckCircle className="h-8 w-8" />,
            title: 'Real-time Tracking',
            description: 'Track your order status and packer location live',
        },
    ];

    const categories = [
        { name: 'Gift Wrapping', icon: '🎁', color: 'bg-pink-100 text-pink-600' },
        { name: 'Electronics', icon: '📱', color: 'bg-blue-100 text-blue-600' },
        { name: 'Food Packaging', icon: '🍱', color: 'bg-green-100 text-green-600' },
        { name: 'Fragile Items', icon: '📦', color: 'bg-red-100 text-red-600' },
        { name: 'Documents', icon: '📄', color: 'bg-yellow-100 text-yellow-600' },
        { name: 'House Shifting', icon: '🏠', color: 'bg-purple-100 text-purple-600' },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Professional Packaging
                            <br />
                            <span className="text-accent-500">In 10 Minutes</span>
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto">
                            On-demand professional packaging service. Book now and get a trained packer
                            at your doorstep with all required materials.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/create-order" className="btn btn-accent text-lg px-8 py-4">
                                Book Now
                            </Link>
                            <Link to="/register" className="btn bg-white text-primary-700 hover:bg-gray-100 text-lg px-8 py-4">
                                Sign Up Free
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-12">Why Choose PackNow?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="card text-center hover:shadow-lg transition-shadow">
                                <div className="text-primary-600 flex justify-center mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Categories Section */}
            <div className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-12">Service Categories</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {categories.map((category, index) => (
                            <div
                                key={index}
                                className={`${category.color} rounded-xl p-6 text-center hover:scale-105 transition-transform cursor-pointer`}
                            >
                                <div className="text-4xl mb-3">{category.icon}</div>
                                <h4 className="font-semibold">{category.name}</h4>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-primary-700 text-white py-16">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                    <p className="text-xl mb-8">
                        Create your account and book your first packaging service in minutes.
                    </p>
                    <Link to="/register" className="btn btn-accent text-lg px-8 py-4">
                        Get Started Now
                    </Link>
                </div>
            </div>
        </div>
    );
}
