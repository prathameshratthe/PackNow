// Track Order Screen
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const STATUS_INFO = {
    CREATED: { label: 'Order Created', icon: 'create', color: '#3b82f6' },
    PACKER_ASSIGNED: { label: 'Packer Assigned', icon: 'person', color: '#f59e0b' },
    ON_THE_WAY: { label: 'On The Way', icon: 'car', color: '#f97316' },
    PACKED: { label: 'Packed', icon: 'cube', color: '#10b981' },
    COMPLETED: { label: 'Completed', icon: 'checkmark-circle', color: '#059669' },
    CANCELLED: { label: 'Cancelled', icon: 'close-circle', color: '#ef4444' },
};

const STEPS = ['CREATED', 'PACKER_ASSIGNED', 'ON_THE_WAY', 'PACKED', 'COMPLETED'];

export default function TrackOrderScreen({ route }) {
    const { orderId } = route.params;
    const [tracking, setTracking] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTracking = useCallback(async () => {
        setRefreshing(true);
        try {
            const response = await api.get(`/orders/${orderId}/tracking`);
            setTracking(response.data);
        } catch (error) {
            console.log('Tracking error:', error);
        } finally {
            setRefreshing(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchTracking();
        const interval = setInterval(fetchTracking, 10000);
        return () => clearInterval(interval);
    }, [fetchTracking]);

    if (!tracking) {
        return (
            <View style={styles.loading}>
                <Text style={{ color: '#9ca3af' }}>Loading tracking...</Text>
            </View>
        );
    }

    const currentIndex = STEPS.indexOf(tracking.current_status);

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchTracking} tintColor="#4f46e5" />}
        >
            {/* Current Status */}
            <View style={styles.statusCard}>
                <Ionicons
                    name={STATUS_INFO[tracking.current_status]?.icon || 'cube'}
                    size={32}
                    color="#4f46e5"
                />
                <View>
                    <Text style={styles.statusLabel}>Current Status</Text>
                    <Text style={styles.statusValue}>
                        {STATUS_INFO[tracking.current_status]?.label || tracking.current_status}
                    </Text>
                </View>
            </View>

            {/* Progress Steps */}
            {tracking.current_status !== 'CANCELLED' && (
                <View style={styles.progressCard}>
                    {STEPS.map((step, index) => {
                        const isActive = index <= currentIndex;
                        const info = STATUS_INFO[step];
                        return (
                            <View key={step} style={styles.stepRow}>
                                <View style={styles.stepLeft}>
                                    <View style={[styles.stepDot, isActive && { backgroundColor: info.color }]}>
                                        <Ionicons name={info.icon} size={14} color={isActive ? '#fff' : '#d1d5db'} />
                                    </View>
                                    {index < STEPS.length - 1 && (
                                        <View style={[styles.stepLine, index < currentIndex && { backgroundColor: '#4f46e5' }]} />
                                    )}
                                </View>
                                <Text style={[styles.stepLabel, isActive && { color: '#111827', fontWeight: '600' }]}>
                                    {info.label}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Packer Info */}
            {tracking.packer_name && (
                <View style={styles.packerCard}>
                    <Text style={styles.cardTitle}>Your Packer</Text>
                    <View style={styles.packerRow}>
                        <View style={styles.packerAvatar}>
                            <Ionicons name="person" size={24} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.packerName}>{tracking.packer_name}</Text>
                            <Text style={styles.packerPhone}>{tracking.packer_phone}</Text>
                        </View>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={14} color="#f59e0b" />
                            <Text style={styles.ratingText}>{tracking.packer_rating?.toFixed(1)}</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Timeline Events */}
            <View style={styles.timelineCard}>
                <Text style={styles.cardTitle}>Timeline</Text>
                {tracking.events.map((event, index) => (
                    <View key={event.id} style={styles.eventRow}>
                        <View style={styles.eventDotCol}>
                            <View style={[styles.eventDot, index === tracking.events.length - 1 && styles.eventDotActive]} />
                            {index < tracking.events.length - 1 && <View style={styles.eventLine} />}
                        </View>
                        <View style={styles.eventContent}>
                            <Text style={styles.eventMessage}>{event.message}</Text>
                            <Text style={styles.eventTime}>{new Date(event.created_at).toLocaleString()}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Auto-refresh indicator */}
            <View style={styles.refreshNote}>
                <View style={styles.refreshDot} />
                <Text style={styles.refreshText}>Auto-refreshing every 10 seconds</Text>
            </View>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    statusCard: { backgroundColor: '#eef2ff', borderRadius: 14, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    statusLabel: { fontSize: 12, color: '#6366f1', fontWeight: '500' },
    statusValue: { fontSize: 22, fontWeight: '700', color: '#312e81' },
    progressCard: { backgroundColor: '#fff', borderRadius: 14, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
    stepLeft: { alignItems: 'center', marginRight: 16 },
    stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
    stepLine: { width: 2, height: 24, backgroundColor: '#e5e7eb', marginVertical: 2 },
    stepLabel: { fontSize: 14, color: '#9ca3af', paddingTop: 4 },
    packerCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
    packerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    packerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
    packerName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    packerPhone: { fontSize: 13, color: '#6b7280' },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    ratingText: { fontSize: 14, fontWeight: '600', color: '#92400e' },
    timelineCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    eventRow: { flexDirection: 'row' },
    eventDotCol: { alignItems: 'center', marginRight: 14 },
    eventDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#d1d5db', marginTop: 6 },
    eventDotActive: { backgroundColor: '#4f46e5', width: 12, height: 12, borderRadius: 6 },
    eventLine: { width: 2, flex: 1, backgroundColor: '#e5e7eb', minHeight: 30 },
    eventContent: { flex: 1, paddingBottom: 16 },
    eventMessage: { fontSize: 14, color: '#374151', fontWeight: '500' },
    eventTime: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
    refreshNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
    refreshDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
    refreshText: { fontSize: 12, color: '#9ca3af' },
});
