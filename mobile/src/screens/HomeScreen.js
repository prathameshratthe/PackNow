// Home Screen — Dashboard with order list
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const statusColors = {
    CREATED: '#3b82f6',
    PACKER_ASSIGNED: '#f59e0b',
    ON_THE_WAY: '#f97316',
    PACKED: '#10b981',
    COMPLETED: '#059669',
    CANCELLED: '#ef4444',
};

export default function HomeScreen({ navigation }) {
    const [orders, setOrders] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const fetchOrders = async () => {
        setRefreshing(true);
        try {
            const response = await api.get('/orders');
            setOrders(response.data);
        } catch (error) {
            console.log('Error fetching orders:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const renderOrder = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.category}>{item.category.replace(/_/g, ' ')}</Text>
                <View style={[styles.badge, { backgroundColor: statusColors[item.status] + '22' }]}>
                    <Text style={[styles.badgeText, { color: statusColors[item.status] }]}>
                        {item.status.replace(/_/g, ' ')}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Order</Text>
                    <Text style={styles.value}>#{item.id}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Price</Text>
                    <Text style={[styles.value, { color: '#4f46e5' }]}>₹{item.price}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Date</Text>
                    <Text style={styles.value}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
            </View>

            {!['COMPLETED', 'CANCELLED'].includes(item.status) && (
                <TouchableOpacity
                    style={styles.trackBtn}
                    onPress={() => navigation.navigate('TrackOrder', { orderId: item.id })}
                >
                    <Ionicons name="navigate" size={16} color="#fff" />
                    <Text style={styles.trackBtnText}>Track</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {orders.length === 0 && !refreshing ? (
                <View style={styles.empty}>
                    <Ionicons name="cube-outline" size={64} color="#d1d5db" />
                    <Text style={styles.emptyTitle}>No orders yet</Text>
                    <Text style={styles.emptyText}>Create your first packaging order!</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderOrder}
                    contentContainerStyle={{ padding: 16 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchOrders} tintColor="#4f46e5" />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    category: { fontSize: 18, fontWeight: '600', color: '#111827', textTransform: 'capitalize' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    cardBody: { flexDirection: 'row', justifyContent: 'space-between' },
    infoRow: { alignItems: 'center' },
    label: { fontSize: 12, color: '#9ca3af', marginBottom: 2 },
    value: { fontSize: 14, fontWeight: '600', color: '#111827' },
    trackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 10, marginTop: 12, gap: 6 },
    trackBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 20, fontWeight: '600', color: '#6b7280', marginTop: 16 },
    emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
});
