// Order Details Screen
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const statusColors = {
    CREATED: '#3b82f6', PACKER_ASSIGNED: '#f59e0b', ON_THE_WAY: '#f97316',
    PACKED: '#10b981', COMPLETED: '#059669', CANCELLED: '#ef4444',
};

export default function OrderDetailsScreen({ route, navigation }) {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchOrder(); }, []);

    const fetchOrder = async () => {
        try {
            const response = await api.get(`/orders/${orderId}`);
            setOrder(response.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load order');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
            { text: 'No' },
            {
                text: 'Yes', style: 'destructive', onPress: async () => {
                    try {
                        await api.delete(`/orders/${orderId}`);
                        Alert.alert('Cancelled', 'Order has been cancelled');
                        navigation.goBack();
                    } catch (error) {
                        Alert.alert('Error', error.response?.data?.detail || 'Failed to cancel');
                    }
                }
            },
        ]);
    };

    if (loading || !order) {
        return (
            <View style={styles.loading}>
                <Text style={{ color: '#9ca3af' }}>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Status Card */}
            <View style={[styles.statusCard, { backgroundColor: statusColors[order.status] + '15' }]}>
                <Ionicons name="cube" size={24} color={statusColors[order.status]} />
                <Text style={[styles.statusText, { color: statusColors[order.status] }]}>
                    {order.status.replace(/_/g, ' ')}
                </Text>
            </View>

            {/* Order Info */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Order #{order.id}</Text>
                <InfoRow label="Category" value={order.category.replace(/_/g, ' ')} />
                <InfoRow label="Price" value={`₹${order.price}`} highlight />
                <InfoRow label="Fragility" value={order.fragility_level} />
                <InfoRow label="Urgency" value={order.urgency} />
                <InfoRow label="Distance" value={order.distance_km ? `${order.distance_km} km` : 'Calculating...'} />
                <InfoRow label="Created" value={new Date(order.created_at).toLocaleString()} />
            </View>

            {/* Dimensions */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Dimensions</Text>
                <View style={styles.dimRow}>
                    <DimBox label="L" value={`${order.item_dimensions.length}cm`} />
                    <DimBox label="W" value={`${order.item_dimensions.width}cm`} />
                    <DimBox label="H" value={`${order.item_dimensions.height}cm`} />
                    <DimBox label="Wt" value={`${order.item_dimensions.weight}kg`} />
                </View>
            </View>

            {/* Materials */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Materials Required</Text>
                {Object.entries(order.materials_required).map(([name, qty]) => (
                    <View key={name} style={styles.materialRow}>
                        <Text style={styles.materialName}>{name.replace(/_/g, ' ')}</Text>
                        <Text style={styles.materialQty}>{qty}</Text>
                    </View>
                ))}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                {!['COMPLETED', 'CANCELLED'].includes(order.status) && (
                    <>
                        <TouchableOpacity
                            style={styles.trackBtn}
                            onPress={() => navigation.navigate('TrackOrder', { orderId: order.id })}
                        >
                            <Ionicons name="navigate" size={18} color="#fff" />
                            <Text style={styles.trackBtnText}>Track Order</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                            <Text style={styles.cancelBtnText}>Cancel Order</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

function InfoRow({ label, value, highlight }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, highlight && { color: '#4f46e5', fontWeight: '700' }]}>{value}</Text>
        </View>
    );
}

function DimBox({ label, value }) {
    return (
        <View style={styles.dimBox}>
            <Text style={styles.dimLabel}>{label}</Text>
            <Text style={styles.dimValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    statusCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, gap: 10, marginBottom: 16 },
    statusText: { fontSize: 18, fontWeight: '700', textTransform: 'capitalize' },
    card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    infoLabel: { fontSize: 14, color: '#6b7280' },
    infoValue: { fontSize: 14, fontWeight: '600', color: '#111827', textTransform: 'capitalize' },
    dimRow: { flexDirection: 'row', gap: 10 },
    dimBox: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12, alignItems: 'center' },
    dimLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
    dimValue: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 },
    materialRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    materialName: { fontSize: 14, color: '#4b5563', textTransform: 'capitalize' },
    materialQty: { fontSize: 14, fontWeight: '600', color: '#4f46e5' },
    actions: { marginTop: 8, gap: 10 },
    trackBtn: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    trackBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    cancelBtn: { borderWidth: 2, borderColor: '#ef4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    cancelBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 16 },
});
