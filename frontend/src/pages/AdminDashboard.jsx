// Admin Dashboard Page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';
import AnalyticsTab from '../components/AnalyticsTab';
import {
    FiPackage, FiUsers, FiTruck, FiDollarSign,
    FiActivity, FiCheckCircle, FiXCircle, FiUser,
    FiLogOut, FiShield, FiSearch
} from 'react-icons/fi';

const TABS = ['Overview', 'Orders', 'Users', 'Packers', 'Analytics'];

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('Overview');
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [packers, setPackers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (activeTab === 'Orders') fetchOrders();
        if (activeTab === 'Users') fetchUsers();
        if (activeTab === 'Packers') fetchPackers();
    }, [activeTab, statusFilter, searchQuery]);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/admin/dashboard');
            setStats(response.data);
        } catch (error) {
            if (error.response?.status === 403) {
                showToast('Access denied. Admin only.', 'error');
                navigate('/admin/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (searchQuery) params.search = searchQuery;
            const response = await api.get('/admin/orders', { params });
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const fetchPackers = async () => {
        try {
            const response = await api.get('/admin/packers');
            setPackers(response.data);
        } catch (error) {
            console.error('Failed to fetch packers:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        navigate('/admin/login');
    };

    const statusColors = {
        CREATED: 'bg-blue-100 text-blue-700',
        PACKER_ASSIGNED: 'bg-yellow-100 text-yellow-700',
        ON_THE_WAY: 'bg-orange-100 text-orange-700',
        PACKED: 'bg-green-100 text-green-700',
        COMPLETED: 'bg-emerald-100 text-emerald-700',
        CANCELLED: 'bg-red-100 text-red-700',
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FiShield className="h-6 w-6 text-primary-400" />
                        <h1 className="text-xl font-bold">PackNow Admin</h1>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                        <FiLogOut className="h-5 w-5" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-0 overflow-x-auto">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                                        ? 'border-primary-600 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Overview Tab */}
                {activeTab === 'Overview' && stats && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard icon={<FiPackage />} label="Total Orders" value={stats.total_orders} color="bg-blue-500" />
                            <StatCard icon={<FiDollarSign />} label="Revenue" value={`₹${stats.total_revenue.toLocaleString()}`} color="bg-green-500" />
                            <StatCard icon={<FiUsers />} label="Users" value={stats.total_users} color="bg-purple-500" />
                            <StatCard icon={<FiTruck />} label="Packers" value={stats.total_packers} color="bg-orange-500" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                            <StatCard icon={<FiActivity />} label="Active Orders" value={stats.active_orders} color="bg-yellow-500" />
                            <StatCard icon={<FiCheckCircle />} label="Completed" value={stats.completed_orders} color="bg-emerald-500" />
                            <StatCard icon={<FiXCircle />} label="Cancelled" value={stats.cancelled_orders} color="bg-red-500" />
                            <StatCard icon={<FiUser />} label="Available Packers" value={stats.available_packers} color="bg-teal-500" />
                        </div>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'Orders' && (
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h2 className="text-2xl font-bold">All Orders</h2>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        id="order-search"
                                        type="text"
                                        placeholder="Search orders..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="input pl-10 text-sm"
                                        style={{ minWidth: '200px' }}
                                    />
                                </div>
                                <select
                                    id="status-filter"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="input text-sm"
                                >
                                    <option value="">All Status</option>
                                    <option value="CREATED">Created</option>
                                    <option value="PACKER_ASSIGNED">Packer Assigned</option>
                                    <option value="ON_THE_WAY">On The Way</option>
                                    <option value="PACKED">Packed</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Packer</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium">#{order.id}</td>
                                                <td className="px-6 py-4">{order.user_name}</td>
                                                <td className="px-6 py-4 text-gray-500">{order.packer_name || '—'}</td>
                                                <td className="px-6 py-4 capitalize">{order.category.replace(/_/g, ' ')}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                                        {order.status.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium">₹{order.price}</td>
                                                <td className="px-6 py-4 text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-12 text-center text-gray-400">No orders found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'Users' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Registered Users</h2>
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Orders</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium">#{user.id}</td>
                                                <td className="px-6 py-4">{user.name}</td>
                                                <td className="px-6 py-4 text-gray-500">{user.phone}</td>
                                                <td className="px-6 py-4 text-gray-500">{user.email || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
                                                        {user.order_count}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">No users found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Packers Tab */}
                {activeTab === 'Packers' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Registered Packers</h2>
                        <div className="grid gap-6">
                            {packers.map((packer) => (
                                <div key={packer.id} className="bg-white rounded-xl shadow-sm p-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${packer.available ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                <FiUser className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">{packer.name}</h3>
                                                <p className="text-gray-500 text-sm">{packer.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 mt-4 md:mt-0">
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500">Rating</p>
                                                <p className="font-semibold text-yellow-600">★ {packer.rating.toFixed(1)}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500">Orders</p>
                                                <p className="font-semibold">{packer.order_count}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${packer.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {packer.available ? 'Available' : 'Busy'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Inventory Preview */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 mb-2 font-medium">Inventory</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(packer.inventory).slice(0, 6).map(([item, qty]) => (
                                                <span key={item} className={`text-xs px-2 py-1 rounded ${qty < 10 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {item.replace(/_/g, ' ')}: {qty}
                                                </span>
                                            ))}
                                            {Object.keys(packer.inventory).length > 6 && (
                                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                                                    +{Object.keys(packer.inventory).length - 6} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {packers.length === 0 && (
                                <div className="card text-center py-12 text-gray-400">No packers found</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'Analytics' && <AnalyticsTab />}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`${color} text-white p-3 rounded-xl`}>
                <span className="h-6 w-6 block">{icon}</span>
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}
