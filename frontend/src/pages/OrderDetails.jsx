// Order Details Page
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { FiPackage, FiTruck, FiCheckCircle, FiClock } from 'react-icons/fi';

const statusSteps = [
    { key: 'CREATED', label: 'Order Created', icon: FiPackage },
    { key: 'PACKER_ASSIGNED', label: 'Packer Assigned', icon: FiTruck },
    { key: 'ON_THE_WAY', label: 'Packer On The Way', icon: FiTruck },
    { key: 'PACKED', label: 'Items Packed', icon: FiCheckCircle },
    { key: 'COMPLETED', label: 'Completed', icon: FiCheckCircle },
];

export default function OrderDetails() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrder();
        const interval = setInterval(fetchOrder, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const response = await api.get(`/orders/${orderId}`);
            setOrder(response.data);
        } catch (error) {
            console.error('Failed to fetch order:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
                    <p className="text-gray-600">The order you're looking for does not exist.</p>
                </div>
            </div>
        );
    }

    const currentStepIndex = statusSteps.findIndex((step) => step.key === order.status);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8">Order #{order.id}</h1>

                {/* Status Timeline */}
                <div className="card mb-6">
                    <h2 className="text-xl font-semibold mb-6">Order Status</h2>
                    <div className="relative">
                        {statusSteps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;

                            return (
                                <div key={step.key} className="flex items-center mb-6 last:mb-0">
                                    <div
                                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <p
                                            className={`font-semibold ${isCurrent ? 'text-primary-600' : isActive ? 'text-gray-900' : 'text-gray-500'
                                                }`}
                                        >
                                            {step.label}
                                        </p>
                                    </div>
                                    {isCurrent && (
                                        <span className="badge badge-warning">Current</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Order Details */}
                <div className="card mb-6">
                    <h2 className="text-xl font-semibold mb-4">Order Details</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-600">Category</p>
                            <p className="font-semibold capitalize">{order.category.replace(/_/g, ' ')}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Fragility</p>
                            <p className="font-semibold capitalize">{order.fragility_level}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Urgency</p>
                            <p className="font-semibold capitalize">{order.urgency}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Distance</p>
                            <p className="font-semibold">
                                {order.distance_km ? `${order.distance_km} km` : 'Calculating...'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Materials */}
                <div className="card mb-6">
                    <h2 className="text-xl font-semibold mb-4">Materials Required</h2>
                    <div className="space-y-2">
                        {Object.entries(order.materials_required).map(([material, quantity]) => (
                            <div key={material} className="flex justify-between py-2 border-b last:border-0">
                                <span className="capitalize">{material.replace(/_/g, ' ')}</span>
                                <span className="font-semibold">{quantity} unit(s)</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Price */}
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4">Price</h2>
                    <div className="text-3xl font-bold text-primary-600">₹{order.price}</div>
                </div>
            </div>
        </div>
    );
}
