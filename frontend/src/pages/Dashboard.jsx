// Dashboard Page
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FiPackage, FiClock, FiCheckCircle } from 'react-icons/fi';

const statusColors = {
    CREATED: 'badge-info',
    PACKER_ASSIGNED: 'badge-warning',
    ON_THE_WAY: 'badge-warning',
    PACKED: 'badge-success',
    COMPLETED: 'badge-success',
    CANCELLED: 'badge-danger',
};

export default function Dashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders');
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading your orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">My Orders</h1>
                    <Link to="/create-order" className="btn btn-primary">
                        Create New Order
                    </Link>
                </div>

                {orders.length === 0 ? (
                    <div className="card text-center py-12">
                        <FiPackage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                        <p className="text-gray-600 mb-6">Create your first packaging order to get started</p>
                        <Link to="/create-order" className="btn btn-primary">
                            Create Order
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {orders.map((order) => (
                            <div key={order.id} className="card hover:shadow-lg transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-semibold capitalize">
                                                {order.category.replace(/_/g, ' ')}
                                            </h3>
                                            <span className={`badge ${statusColors[order.status]}`}>
                                                {order.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                            <div>
                                                <p className="text-gray-600">Order ID</p>
                                                <p className="font-semibold">#{order.id}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Price</p>
                                                <p className="font-semibold text-primary-600">₹{order.price}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Created</p>
                                                <p className="font-semibold">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Distance</p>
                                                <p className="font-semibold">
                                                    {order.distance_km ? `${order.distance_km} km` : 'Calculating...'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 md:mt-0 md:ml-6">
                                        <Link
                                            to={`/orders/${order.id}`}
                                            className="btn btn-secondary w-full md:w-auto"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
