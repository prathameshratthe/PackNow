// Packer Dashboard — Separate interface for service providers
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import {
    FiTruck, FiPackage, FiMapPin, FiToggleLeft, FiToggleRight,
    FiLogOut, FiClock, FiCheckCircle, FiUser, FiPhone
} from 'react-icons/fi';

export default function PackerDashboard() {
    const { showToast } = useToast();
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [liveOrders, setLiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const [acceptingOrder, setAcceptingOrder] = useState(null);
    const [otpInputs, setOtpInputs] = useState({});

    useEffect(() => {
        fetchProfileAndOrders();
    }, []);

    const fetchProfileAndOrders = async () => {
        try {
            const [profileRes, ordersRes, liveRes] = await Promise.all([
                api.get('/packers/me'),
                api.get('/packers/me/orders'),
                api.get('/packers/live-orders').catch(() => ({ data: [] }))
            ]);
            setProfile(profileRes.data);
            setOrders(ordersRes.data);
            setLiveOrders(liveRes.data);
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                window.location.href = '/packer/login';
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = async () => {
        try {
            const res = await api.patch('/packers/me/availability', {
                available: !profile.available,
            });
            setProfile(res.data);
            showToast(
                res.data.available ? 'You are now available for orders!' : 'You are now offline.',
                res.data.available ? 'success' : 'info'
            );
        } catch (error) {
            showToast('Failed to update availability', 'error');
        }
    };

    const acceptOrder = async (orderId) => {
        setAcceptingOrder(orderId);
        try {
            await api.post(`/packers/orders/${orderId}/accept`);
            showToast('Order accepted successfully!', 'success');
            fetchProfileAndOrders();
        } catch (error) {
            showToast(error.response?.data?.detail || 'Failed to accept order', 'error');
            // Refresh feed in case someone else accepted it
            fetchProfileAndOrders();
        } finally {
            setAcceptingOrder(null);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        setUpdatingStatus(orderId);
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            showToast(`Order #${orderId} updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
            fetchProfileAndOrders();
        } catch (error) {
            showToast(error.response?.data?.detail || 'Failed to update order', 'error');
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleCompleteWithOtp = async (orderId) => {
        const otp = otpInputs[orderId];
        if (!otp || otp.length !== 6) {
            showToast('Please enter a valid 6-digit OTP', 'error');
            return;
        }
        setUpdatingStatus(orderId);
        try {
            await api.post(`/orders/${orderId}/verify-otp`, { otp });
            showToast(`Order #${orderId} completed successfully!`, 'success');
            setOtpInputs(prev => {
                const newInputs = { ...prev };
                delete newInputs[orderId];
                return newInputs;
            });
            fetchProfileAndOrders();
        } catch (error) {
            showToast(error.response?.data?.detail || 'Invalid OTP. Ask customer again.', 'error');
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        window.location.href = '/packer/login';
    };

    const statusColors = {
        CREATED: 'bg-blue-100 text-blue-700',
        PACKER_ASSIGNED: 'bg-yellow-100 text-yellow-700',
        ON_THE_WAY: 'bg-orange-100 text-orange-700',
        PACKED: 'bg-green-100 text-green-700',
        COMPLETED: 'bg-emerald-100 text-emerald-700',
        CANCELLED: 'bg-red-100 text-red-700',
    };

    const nextStatusMap = {
        PACKER_ASSIGNED: 'ON_THE_WAY',
        ON_THE_WAY: 'PACKED',
        PACKED: 'COMPLETED',
    };

    const nextStatusLabels = {
        PACKER_ASSIGNED: 'Start Journey',
        ON_THE_WAY: 'Mark as Packed',
        PACKED: 'Complete Order',
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading packer dashboard...</p>
                </div>
            </div>
        );
    }

    const activeOrders = orders.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.status));
    const completedOrders = orders.filter(o => o.status === 'COMPLETED');
    const totalEarnings = completedOrders.reduce((sum, order) => sum + Number(order.price), 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Packer Header — Green theme */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FiTruck className="h-6 w-6 text-emerald-300" />
                        <h1 className="text-xl font-bold">PackNow Packer</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {profile && (
                            <span className="text-emerald-200 text-sm hidden sm:block">
                                {profile.name}
                            </span>
                        )}
                        <button onClick={handleLogout} className="flex items-center gap-2 text-emerald-200 hover:text-white transition-colors">
                            <FiLogOut className="h-5 w-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Profile & Availability */}
                {profile && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${profile.available ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                    <FiUser className="h-7 w-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{profile.name}</h2>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <FiPhone className="h-3.5 w-3.5" />
                                            {profile.phone}
                                        </span>
                                        <span className="text-yellow-600">★ {profile.rating.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mt-4 md:mt-0">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500">Earnings</p>
                                    <p className="text-2xl font-bold text-emerald-600">₹{totalEarnings.toFixed(2)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500">Total Orders</p>
                                    <p className="text-2xl font-bold">{orders.length}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500">Completed</p>
                                    <p className="text-2xl font-bold text-emerald-600">{completedOrders.length}</p>
                                </div>

                                {/* Availability Toggle */}
                                <button
                                    onClick={toggleAvailability}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${profile.available
                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                >
                                    {profile.available ? (
                                        <><FiToggleRight className="h-5 w-5" /> Online</>
                                    ) : (
                                        <><FiToggleLeft className="h-5 w-5" /> Offline</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Inventory Section */}
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">My Inventory</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(profile.inventory).map(([item, qty]) => (
                                    <span
                                        key={item}
                                        className={`text-xs px-3 py-1.5 rounded-full font-medium ${qty < 10 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        {item.replace(/_/g, ' ')}: {qty}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Available Live Orders (Gig Feed) */}
                {profile?.available && (
                    <div className="mb-8 border-t-4 border-emerald-500 bg-emerald-50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-900">
                                <span className="relative flex h-3 w-3 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                Live Requests ({liveOrders.length})
                            </h3>
                            <button
                                onClick={fetchProfileAndOrders}
                                className="text-xs text-emerald-700 hover:text-emerald-900 font-medium px-3 py-1 bg-emerald-100 rounded-full"
                            >
                                Refresh Feed
                            </button>
                        </div>

                        {liveOrders.length === 0 ? (
                            <div className="bg-white/50 rounded-xl border border-emerald-100 p-8 text-center text-emerald-700/70">
                                <FiPackage className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p>Waiting for new order requests in your area...</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {liveOrders.map((order) => (
                                    <div key={order.id} className="bg-white rounded-xl shadow-lg border border-emerald-100 p-5 transform transition-all hover:-translate-y-1">
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 uppercase tracking-widest">
                                                        New Ping
                                                    </span>
                                                    {order.urgency === 'HIGH' && (
                                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 uppercase">
                                                            Urgent
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-lg text-gray-900">
                                                    {order.category.replace(/_/g, ' ')} Packaging
                                                </h4>
                                                {order.pickup_location && (
                                                    <div className="text-sm text-gray-600 font-medium mt-1">
                                                        <FiMapPin className="inline h-4 w-4 mr-1 text-emerald-500" />
                                                        <span className="font-bold">Pickup: </span>
                                                        {order.pickup_location.address || "Pincode: " + Math.round(order.pickup_location.lat * 1000)}
                                                    </div>
                                                )}
                                                {order.dropoff_location && (
                                                    <div className="text-sm text-gray-600 font-medium mt-1">
                                                        <FiMapPin className="inline h-4 w-4 mr-1 text-blue-500" />
                                                        <span className="font-bold">Dropoff: </span>
                                                        {order.dropoff_location.address || "Pincode: " + Math.round(order.dropoff_location.lat * 1000)}
                                                    </div>
                                                )}
                                                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                                                    <span>Dimensions: {order.item_dimensions.length}x{order.item_dimensions.width}x{order.item_dimensions.height}</span>
                                                    <span>Weight: {order.item_dimensions.weight}kg</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 md:mt-0 text-left md:text-right flex flex-col justify-between">
                                                <div>
                                                    <p className="text-2xl font-black text-emerald-600">₹{order.price}</p>
                                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Est. Earnings</p>
                                                </div>
                                                <button
                                                    onClick={() => acceptOrder(order.id)}
                                                    disabled={acceptingOrder === order.id}
                                                    className="mt-3 w-full md:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-500/30 transition-all disabled:opacity-50"
                                                >
                                                    {acceptingOrder === order.id ? 'Accepting...' : 'ACCEPT REQUEST'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Active Orders */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <FiClock className="text-orange-500" />
                        Active Orders ({activeOrders.length})
                    </h3>
                    {activeOrders.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
                            <FiPackage className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No active orders right now</p>
                            <p className="text-sm mt-1">Make sure you're online to receive orders!</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {activeOrders.map((order) => (
                                <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                                    <div className="p-6 border-l-4 border-emerald-500">
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-bold text-lg">Order #{order.id}</h4>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                                        {order.status.replace(/_/g, ' ')}
                                                    </span>
                                                    {order.urgency === 'HIGH' && (
                                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                            URGENT
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 capitalize mb-1">
                                                    <FiPackage className="inline h-3.5 w-3.5 mr-1" />
                                                    {order.category.replace(/_/g, ' ')}
                                                </p>
                                                {order.pickup_location && (
                                                    <div className="text-sm text-gray-600 font-medium">
                                                        <FiMapPin className="inline h-4 w-4 mr-1 text-emerald-600" />
                                                        <span className="font-bold">Pickup: </span>
                                                        {order.pickup_location.address || "Location Provided"}
                                                    </div>
                                                )}
                                                {order.dropoff_location && (
                                                    <div className="text-sm text-gray-600 font-medium mt-1">
                                                        <FiMapPin className="inline h-4 w-4 mr-1 text-blue-600" />
                                                        <span className="font-bold">Dropoff: </span>
                                                        {order.dropoff_location.address || "Location Provided"}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right mt-4 md:mt-0">
                                                <p className="text-2xl font-bold text-emerald-600">₹{order.price}</p>
                                                <p className="text-xs text-gray-400">Estimated Payout</p>
                                            </div>
                                        </div>

                                        {/* Detailed Order Info for Packer */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Item Details</h5>
                                                {order.item_dimensions && (
                                                    <p className="text-sm text-gray-700">
                                                        <span className="font-medium">Dimensions:</span> {order.item_dimensions.length}x{order.item_dimensions.width}x{order.item_dimensions.height} cm
                                                        <br />
                                                        <span className="font-medium">Weight:</span> {order.item_dimensions.weight} kg
                                                    </p>
                                                )}
                                                {order.fragility_level && (
                                                    <p className="text-sm text-gray-700 mt-1">
                                                        <span className="font-medium">Fragility:</span> <span className="capitalize">{order.fragility_level.toLowerCase()}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Materials Required</h5>
                                                <div className="flex flex-wrap gap-1">
                                                    {order.materials_required ? Object.entries(order.materials_required).map(([mat, qty]) => (
                                                        <span key={mat} className="text-xs px-2 py-1 bg-white border border-gray-200 rounded">
                                                            {mat.replace(/_/g, ' ')}: <span className="font-bold">{qty}</span>
                                                        </span>
                                                    )) : <span className="text-sm text-gray-500">None</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                {order.pickup_location?.lat && order.pickup_location?.lng && (
                                                    <a
                                                        href={`https://www.google.com/maps/dir/?api=1&destination=${order.pickup_location.lat},${order.pickup_location.lng}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn flex-1 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center justify-center gap-2 rounded-lg font-medium transition-colors text-xs px-2"
                                                    >
                                                        <FiMapPin /> Go to Pickup
                                                    </a>
                                                )}
                                                {order.dropoff_location?.lat && order.dropoff_location?.lng && (
                                                    <a
                                                        href={`https://www.google.com/maps/dir/?api=1&origin=${order.pickup_location?.lat},${order.pickup_location?.lng}&destination=${order.dropoff_location.lat},${order.dropoff_location.lng}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn flex-1 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 flex items-center justify-center gap-2 rounded-lg font-medium transition-colors text-xs px-2"
                                                    >
                                                        <FiMapPin /> Go to Dropoff
                                                    </a>
                                                )}
                                            </div>

                                            {nextStatusMap[order.status] === 'COMPLETED' ? (
                                                <div className="flex-1 flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter 6-digit Delivery OTP"
                                                        maxLength={6}
                                                        value={otpInputs[order.id] || ''}
                                                        onChange={(e) => setOtpInputs({ ...otpInputs, [order.id]: e.target.value.replace(/\D/g, '') })}
                                                        className="flex-1 input text-center text-lg font-bold tracking-widest border-emerald-300 focus:ring-emerald-500 rounded-lg py-2 h-full"
                                                    />
                                                    <button
                                                        onClick={() => handleCompleteWithOtp(order.id)}
                                                        disabled={updatingStatus === order.id || (otpInputs[order.id] || '').length !== 6}
                                                        className="px-6 text-white rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
                                                        style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                                                    >
                                                        {updatingStatus === order.id ? 'Checking...' : 'Complete Delivery'}
                                                    </button>
                                                </div>
                                            ) : nextStatusMap[order.status] ? (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, nextStatusMap[order.status])}
                                                    disabled={updatingStatus === order.id}
                                                    className="flex-1 w-full sm:w-auto px-6 py-2.5 text-white rounded-lg text-sm font-semibold transition-all shadow-sm mt-2 sm:mt-0"
                                                    style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                                                >
                                                    {updatingStatus === order.id
                                                        ? 'Updating...'
                                                        : nextStatusLabels[order.status]
                                                    }
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Completed Orders */}
                <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <FiCheckCircle className="text-emerald-500" />
                        Completed Orders ({completedOrders.length})
                    </h3>
                    {completedOrders.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
                            No completed orders yet
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {completedOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium">#{order.id}</td>
                                            <td className="px-6 py-4 capitalize">{order.category.replace(/_/g, ' ')}</td>
                                            <td className="px-6 py-4 font-medium text-emerald-600">₹{order.price}</td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
