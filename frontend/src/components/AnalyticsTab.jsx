// Analytics Tab Component with Charts
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiTrendingUp, FiPieChart, FiBarChart2, FiAward } from 'react-icons/fi';

// Simple chart components (pure CSS, no additional dependencies needed)
function BarChart({ data, dataKey, nameKey, color = '#6366f1' }) {
    if (!data || data.length === 0) return <EmptyState />;
    const max = Math.max(...data.map(d => d[dataKey]));

    return (
        <div className="space-y-3">
            {data.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-24 truncate">{item[nameKey]}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                                width: `${max > 0 ? (item[dataKey] / max) * 100 : 0}%`,
                                backgroundColor: color,
                                minWidth: item[dataKey] > 0 ? '20px' : '0px'
                            }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-700">
                            {typeof item[dataKey] === 'number' && item[dataKey] % 1 !== 0
                                ? `₹${item[dataKey].toLocaleString()}`
                                : item[dataKey]}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function PieChart({ data, nameKey, valueKey }) {
    if (!data || data.length === 0) return <EmptyState />;
    const total = data.reduce((sum, d) => sum + d[valueKey], 0);
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

    let cumulativePercent = 0;
    const segments = data.map((item, index) => {
        const percent = total > 0 ? (item[valueKey] / total) * 100 : 0;
        const startPercent = cumulativePercent;
        cumulativePercent += percent;
        return { ...item, percent, startPercent, color: colors[index % colors.length] };
    });

    // Create conic-gradient
    const gradientParts = segments.map(s =>
        `${s.color} ${s.startPercent}% ${s.startPercent + s.percent}%`
    ).join(', ');

    return (
        <div className="flex items-center gap-8">
            <div
                className="w-40 h-40 rounded-full flex-shrink-0 shadow-inner"
                style={{ background: `conic-gradient(${gradientParts})` }}
            />
            <div className="space-y-2 flex-1">
                {segments.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-gray-700">{item[nameKey]}</span>
                        <span className="text-sm text-gray-400 ml-auto">{item.percent.toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LineChart({ data, dataKey, nameKey, color = '#6366f1' }) {
    if (!data || data.length === 0) return <EmptyState />;
    const max = Math.max(...data.map(d => d[dataKey]));
    const min = Math.min(...data.map(d => d[dataKey]));
    const range = max - min || 1;
    const height = 200;
    const width = Math.max(data.length * 40, 300);

    const points = data.map((d, i) => ({
        x: (i / Math.max(data.length - 1, 1)) * (width - 40) + 20,
        y: height - 20 - ((d[dataKey] - min) / range) * (height - 40),
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - 20} L ${points[0].x} ${height - 20} Z`;

    return (
        <div className="overflow-x-auto">
            <svg width={width} height={height} className="mx-auto">
                <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                    </linearGradient>
                </defs>
                <path d={areaD} fill="url(#areaGrad)" />
                <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
                        {data.length <= 15 && (
                            <text x={p.x} y={height - 4} textAnchor="middle" className="text-[9px] fill-gray-400">
                                {data[i][nameKey]?.slice(5) || i}
                            </text>
                        )}
                    </g>
                ))}
            </svg>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex items-center justify-center h-40 text-gray-400">
            <p>No data available yet. Create some orders to see analytics.</p>
        </div>
    );
}

export default function AnalyticsTab() {
    const [revenue, setRevenue] = useState([]);
    const [categories, setCategories] = useState([]);
    const [packers, setPackers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [revenueRes, categoriesRes, packersRes] = await Promise.all([
                api.get('/admin/analytics/revenue?days=30'),
                api.get('/admin/analytics/categories'),
                api.get('/admin/analytics/packers'),
            ]);
            setRevenue(revenueRes.data.data);
            setCategories(categoriesRes.data.data);
            setPackers(packersRes.data.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Analytics & Reporting</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FiTrendingUp className="text-primary-600 h-5 w-5" />
                        <h3 className="font-semibold text-lg">Revenue Trend (30 days)</h3>
                    </div>
                    <LineChart data={revenue} dataKey="revenue" nameKey="date" color="#6366f1" />
                </div>

                {/* Category Breakdown */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FiPieChart className="text-pink-600 h-5 w-5" />
                        <h3 className="font-semibold text-lg">Orders by Category</h3>
                    </div>
                    <PieChart data={categories} nameKey="category" valueKey="count" />
                </div>

                {/* Order Volume */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FiBarChart2 className="text-emerald-600 h-5 w-5" />
                        <h3 className="font-semibold text-lg">Category Revenue</h3>
                    </div>
                    <BarChart data={categories} dataKey="revenue" nameKey="category" color="#10b981" />
                </div>

                {/* Packer Leaderboard */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FiAward className="text-yellow-600 h-5 w-5" />
                        <h3 className="font-semibold text-lg">Packer Leaderboard</h3>
                    </div>
                    {packers.length > 0 ? (
                        <div className="space-y-3">
                            {packers.map((packer, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-600' :
                                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-gray-50 text-gray-500'
                                            }`}>
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium">{packer.name}</p>
                                            <p className="text-xs text-gray-500">★ {packer.rating.toFixed(1)} · {packer.orders_completed} orders</p>
                                        </div>
                                    </div>
                                    <p className="font-semibold text-green-600">₹{packer.revenue.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    ) : <EmptyState />}
                </div>
            </div>
        </div>
    );
}
