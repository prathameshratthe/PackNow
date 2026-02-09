// Create Order Page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const categories = [
    { value: 'gift', label: 'Gift Wrapping', icon: '🎁' },
    { value: 'electronics', label: 'Electronics', icon: '📱' },
    { value: 'food', label: 'Food Packaging', icon: '🍱' },
    { value: 'documents', label: 'Documents', icon: '📄' },
    { value: 'business_orders', label: 'Business Orders', icon: '💼' },
    { value: 'fragile_items', label: 'Fragile Items', icon: '📦' },
    { value: 'house_shifting', label: 'House Shifting', icon: '🏠' },
];

export default function CreateOrder() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        category: '',
        length: '',
        width: '',
        height: '',
        weight: '',
        fragility_level: 'low',
        urgency: 'normal',
        address: '',
        lat: 19.0760,
        lng: 72.8777,
    });
    const [estimate, setEstimate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleEstimate = async () => {
        setLoading(true);
        setError('');

        try {
            const estimateData = {
                category: formData.category,
                item_dimensions: {
                    length: parseFloat(formData.length),
                    width: parseFloat(formData.width),
                    height: parseFloat(formData.height),
                    weight: parseFloat(formData.weight),
                },
                fragility_level: formData.fragility_level,
                urgency: formData.urgency,
                distance_km: 5,
            };

            const [materialRes, priceRes] = await Promise.all([
                api.post('/orders/estimate/materials', estimateData),
                api.post('/orders/estimate/price', estimateData),
            ]);

            setEstimate({
                materials: materialRes.data,
                pricing: priceRes.data,
            });
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to get estimate');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const orderData = {
                category: formData.category,
                item_dimensions: {
                    length: parseFloat(formData.length),
                    width: parseFloat(formData.width),
                    height: parseFloat(formData.height),
                    weight: parseFloat(formData.weight),
                },
                fragility_level: formData.fragility_level,
                urgency: formData.urgency,
                pickup_location: {
                    lat: formData.lat,
                    lng: formData.lng,
                    address: formData.address,
                },
            };

            const response = await api.post('/orders', orderData);
            navigate(`/orders/${response.data.id}`);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8">Create New Order</h1>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <div className="card">
                        <h2 className="text-2xl font-semibold mb-6">Order Details</h2>

                        {/* Category Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Select Category *
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.value}
                                        onClick={() => setFormData({ ...formData, category: cat.value })}
                                        className={`p-4 rounded-lg border-2 transition-all ${formData.category === cat.value
                                                ? 'border-primary-600 bg-primary-50'
                                                : 'border-gray-300 hover:border-primary-400'
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">{cat.icon}</div>
                                        <div className="text-sm font-medium">{cat.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Item Dimensions */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Item Dimensions (cm) *
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Length"
                                        className="input"
                                        value={formData.length}
                                        onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Width"
                                        className="input"
                                        value={formData.width}
                                        onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Height"
                                        className="input"
                                        value={formData.height}
                                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Weight (kg)"
                                        className="input"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fragility Level */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Fragility Level *
                            </label>
                            <div className="flex gap-4">
                                {['low', 'medium', 'high'].map((level) => (
                                    <label key={level} className="flex items-center">
                                        <input
                                            type="radio"
                                            name="fragility"
                                            value={level}
                                            checked={formData.fragility_level === level}
                                            onChange={(e) => setFormData({ ...formData, fragility_level: e.target.value })}
                                            className="mr-2"
                                        />
                                        <span className="capitalize">{level}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Urgency */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Urgency *
                            </label>
                            <div className="flex gap-4">
                                {['normal', 'urgent'].map((level) => (
                                    <label key={level} className="flex items-center">
                                        <input
                                            type="radio"
                                            name="urgency"
                                            value={level}
                                            checked={formData.urgency === level}
                                            onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                                            className="mr-2"
                                        />
                                        <span className="capitalize">{level}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Address */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pickup Address *
                            </label>
                            <textarea
                                className="input"
                                rows="3"
                                placeholder="Enter your complete address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            onClick={handleEstimate}
                            disabled={loading || !formData.category || !formData.address}
                            className="w-full btn btn-primary py-3"
                        >
                            {loading ? 'Calculating...' : 'Get Estimate'}
                        </button>
                    </div>
                )}

                {step === 2 && estimate && (
                    <div className="space-y-6">
                        {/* Material Breakdown */}
                        <div className="card">
                            <h2 className="text-2xl font-semibold mb-4">Material Requirements</h2>
                            <div className="space-y-2">
                                {Object.entries(estimate.materials.materials).map(([material, quantity]) => (
                                    <div key={material} className="flex justify-between items-center py-2 border-b">
                                        <span className="text-gray-700 capitalize">{material.replace(/_/g, ' ')}</span>
                                        <span className="font-semibold">{quantity} unit(s)</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="card">
                            <h2 className="text-2xl font-semibold mb-4">Price Breakdown</h2>
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between">
                                    <span>Material Cost</span>
                                    <span>₹{estimate.pricing.material_cost}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Base Price</span>
                                    <span>₹{estimate.pricing.base_price}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Distance Charge</span>
                                    <span>₹{estimate.pricing.distance_charge}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Urgency Multiplier</span>
                                    <span>{estimate.pricing.urgency_multiplier}x</span>
                                </div>
                                <div className="flex justify-between border-t-2 pt-2 mt-2">
                                    <span className="font-bold text-lg">Total Price</span>
                                    <span className="font-bold text-lg text-primary-600">
                                        ₹{estimate.pricing.final_price}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(1)} className="flex-1 btn btn-secondary">
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-1 btn btn-primary"
                                >
                                    {loading ? 'Creating Order...' : 'Confirm & Book'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
