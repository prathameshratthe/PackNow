// Track Order Page — Real-time order tracking with timeline
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { FiPackage, FiUser, FiPhone, FiStar, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';

const STATUS_STEPS = ['CREATED', 'PACKER_ASSIGNED', 'ON_THE_WAY', 'PACKED', 'COMPLETED'];

const STATUS_INFO = {
    CREATED: { label: 'Order Created', icon: '📝', color: 'bg-blue-500' },
    PACKER_ASSIGNED: { label: 'Packer Assigned', icon: '👤', color: 'bg-yellow-500' },
    ON_THE_WAY: { label: 'On The Way', icon: '🚗', color: 'bg-orange-500' },
    PACKED: { label: 'Packed', icon: '📦', color: 'bg-green-500' },
    COMPLETED: { label: 'Completed', icon: '✅', color: 'bg-emerald-600' },
    CANCELLED: { label: 'Cancelled', icon: '❌', color: 'bg-red-500' },
};

export default function TrackOrder() {
    const { orderId } = useParams();
    const [tracking, setTracking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchTracking = useCallback(async () => {
        try {
            const response = await api.get(`/orders/${orderId}/tracking`);
            setTracking(response.data);
            setError(null);
            setLastRefresh(new Date());
        } catch (err) {
            setError('Failed to load tracking data');
            console.error('Tracking error:', err);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchTracking();
        // Auto-refresh every 10 seconds
        const interval = setInterval(fetchTracking, 10000);
        return () => clearInterval(interval);
    }, [fetchTracking]);

    const getStepIndex = (status) => STATUS_STEPS.indexOf(status);
    const currentStepIndex = tracking ? getStepIndex(tracking.current_status) : -1;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading tracking info...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="card text-center py-12 max-w-md">
                    <p className="text-red-500 text-lg mb-4">{error}</p>
                    <button onClick={fetchTracking} className="btn btn-primary">Try Again</button>
                </div>
            </div>
        );
    }

    const isCancelled = tracking.current_status === 'CANCELLED';

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
                            <FiArrowLeft className="h-6 w-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Track Order #{orderId}</h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Last updated: {lastRefresh.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchTracking}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        <FiRefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Status Timeline */}
                    <div className="lg:col-span-2">
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-6">Order Status</h2>

                            {/* Current Status Badge */}
                            <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">
                                        {STATUS_INFO[tracking.current_status]?.icon || '📦'}
                                    </span>
                                    <div>
                                        <p className="text-sm text-primary-600 font-medium">Current Status</p>
                                        <p className="text-xl font-bold text-primary-800">
                                            {STATUS_INFO[tracking.current_status]?.label || tracking.current_status}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Steps */}
                            {!isCancelled && (
                                <div className="mb-8">
                                    <div className="flex items-center justify-between">
                                        {STATUS_STEPS.map((step, index) => {
                                            const isActive = index <= currentStepIndex;
                                            const isCurrent = index === currentStepIndex;
                                            return (
                                                <React.Fragment key={step}>
                                                    <div className="flex flex-col items-center" style={{ minWidth: '60px' }}>
                                                        <div
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                                                                ${isCurrent ? 'ring-4 ring-primary-200 ' : ''}
                                                                ${isActive ? STATUS_INFO[step].color + ' text-white' : 'bg-gray-200 text-gray-400'}`}
                                                        >
                                                            {STATUS_INFO[step].icon}
                                                        </div>
                                                        <p className={`text-xs mt-2 text-center font-medium ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                                                            {STATUS_INFO[step].label}
                                                        </p>
                                                    </div>
                                                    {index < STATUS_STEPS.length - 1 && (
                                                        <div className={`flex-1 h-1 mx-1 rounded ${index < currentStepIndex ? 'bg-primary-500' : 'bg-gray-200'}`} />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Event Timeline */}
                            <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                            <div className="space-y-0">
                                {tracking.events.map((event, index) => (
                                    <div key={event.id} className="flex gap-4">
                                        {/* Timeline Line */}
                                        <div className="flex flex-col items-center">
                                            <div className={`w-3 h-3 rounded-full mt-1.5 ${index === tracking.events.length - 1
                                                ? 'bg-primary-600 ring-4 ring-primary-100'
                                                : 'bg-gray-300'
                                                }`} />
                                            {index < tracking.events.length - 1 && (
                                                <div className="w-0.5 h-full bg-gray-200 min-h-[40px]" />
                                            )}
                                        </div>
                                        {/* Event Content */}
                                        <div className="pb-6">
                                            <p className="font-medium text-gray-800">{event.message}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {new Date(event.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Auto-refresh indicator */}
                            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-400">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                Auto-refreshing every 10 seconds
                            </div>
                        </div>
                    </div>

                    {/* Packer Info Sidebar */}
                    <div className="lg:col-span-1">
                        {tracking.packer_name ? (
                            <div className="card">
                                <h2 className="text-xl font-semibold mb-4">Your Packer</h2>
                                <div className="text-center mb-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FiUser className="h-10 w-10 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold">{tracking.packer_name}</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <FiPhone className="h-5 w-5 text-primary-600" />
                                        <div>
                                            <p className="text-xs text-gray-500">Phone</p>
                                            <p className="font-medium">{tracking.packer_phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <FiStar className="h-5 w-5 text-yellow-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">Rating</p>
                                            <p className="font-medium">{tracking.packer_rating?.toFixed(1)} / 5.0</p>
                                        </div>
                                    </div>
                                    {tracking.delivery_otp && !['COMPLETED', 'CANCELLED'].includes(tracking.current_status) && (
                                        <div className="mt-4 p-4 border border-dashed border-emerald-300 bg-emerald-50 rounded-lg text-center">
                                            <p className="text-xs text-emerald-800 font-bold uppercase mb-1">Delivery OTP</p>
                                            <p className="text-3xl font-black text-emerald-600 tracking-widest">{tracking.delivery_otp}</p>
                                            <p className="text-xs text-emerald-700 mt-2">Share this with your packer at the final dropoff to complete the delivery.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="card text-center py-8">
                                <FiPackage className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="font-semibold text-gray-500">Finding Packer</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    We're looking for the nearest available packer...
                                </p>
                                <div className="mt-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto" />
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="card mt-6">
                            <h3 className="font-semibold mb-3">Quick Actions</h3>
                            <div className="space-y-2">
                                <Link
                                    to={`/orders/${orderId}`}
                                    className="btn btn-secondary w-full text-center block"
                                >
                                    View Order Details
                                </Link>
                                <Link
                                    to="/dashboard"
                                    className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 w-full text-center block"
                                >
                                    Back to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
