// Create Order Screen
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import api from '../services/api';

const CATEGORIES = [
    { key: 'gift', label: 'Gift', icon: 'gift' },
    { key: 'electronics', label: 'Electronics', icon: 'phone-portrait' },
    { key: 'food', label: 'Food', icon: 'fast-food' },
    { key: 'documents', label: 'Documents', icon: 'document-text' },
    { key: 'fragile_items', label: 'Fragile', icon: 'wine' },
    { key: 'house_shifting', label: 'House Shift', icon: 'home' },
    { key: 'business_orders', label: 'Business', icon: 'briefcase' },
];

export default function CreateOrderScreen({ navigation }) {
    const [category, setCategory] = useState('');
    const [dimensions, setDimensions] = useState({ length: '', width: '', height: '', weight: '' });
    const [fragility, setFragility] = useState('low');
    const [urgency, setUrgency] = useState('normal');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!category) { Alert.alert('Error', 'Please select a category'); return; }
        if (!dimensions.length || !dimensions.width || !dimensions.height || !dimensions.weight) {
            Alert.alert('Error', 'Please fill in all dimensions'); return;
        }

        setLoading(true);
        try {
            // Get location
            const { status } = await Location.requestForegroundPermissionsAsync();
            let lat = 19.0760, lng = 72.8777, address = 'Mumbai, India';

            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                lat = loc.coords.latitude;
                lng = loc.coords.longitude;
                try {
                    const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
                    if (geo.length > 0) address = `${geo[0].street || ''}, ${geo[0].city || ''}`.trim();
                } catch (e) { /* ignore geocode errors */ }
            }

            await api.post('/orders', {
                category,
                item_dimensions: {
                    length: parseFloat(dimensions.length),
                    width: parseFloat(dimensions.width),
                    height: parseFloat(dimensions.height),
                    weight: parseFloat(dimensions.weight),
                },
                fragility_level: fragility,
                urgency,
                pickup_location: { lat, lng, address },
            });

            Alert.alert('Success', 'Order created! A packer is on the way.', [
                { text: 'OK', onPress: () => navigation.navigate('Home') },
            ]);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Category Selection */}
            <Text style={styles.sectionTitle}>Select Category</Text>
            <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.key}
                        style={[styles.categoryCard, category === cat.key && styles.categoryActive]}
                        onPress={() => setCategory(cat.key)}
                    >
                        <Ionicons name={cat.icon} size={24} color={category === cat.key ? '#fff' : '#4f46e5'} />
                        <Text style={[styles.categoryLabel, category === cat.key && { color: '#fff' }]}>{cat.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Dimensions */}
            <Text style={styles.sectionTitle}>Item Dimensions</Text>
            <View style={styles.dimGrid}>
                {[
                    { key: 'length', label: 'Length (cm)', icon: 'resize' },
                    { key: 'width', label: 'Width (cm)', icon: 'resize' },
                    { key: 'height', label: 'Height (cm)', icon: 'resize' },
                    { key: 'weight', label: 'Weight (kg)', icon: 'scale' },
                ].map((dim) => (
                    <View key={dim.key} style={styles.dimInput}>
                        <Text style={styles.dimLabel}>{dim.label}</Text>
                        <TextInput
                            style={styles.input}
                            value={dimensions[dim.key]}
                            onChangeText={(v) => setDimensions({ ...dimensions, [dim.key]: v })}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                ))}
            </View>

            {/* Fragility */}
            <Text style={styles.sectionTitle}>Fragility Level</Text>
            <View style={styles.optionRow}>
                {['low', 'medium', 'high'].map((level) => (
                    <TouchableOpacity
                        key={level}
                        style={[styles.optionBtn, fragility === level && styles.optionActive]}
                        onPress={() => setFragility(level)}
                    >
                        <Text style={[styles.optionText, fragility === level && { color: '#fff' }]}>{level.charAt(0).toUpperCase() + level.slice(1)}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Urgency */}
            <Text style={styles.sectionTitle}>Urgency</Text>
            <View style={styles.optionRow}>
                {['normal', 'urgent'].map((level) => (
                    <TouchableOpacity
                        key={level}
                        style={[styles.optionBtn, urgency === level && styles.optionActive]}
                        onPress={() => setUrgency(level)}
                    >
                        <Text style={[styles.optionText, urgency === level && { color: '#fff' }]}>{level.charAt(0).toUpperCase() + level.slice(1)}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Submit */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                <Ionicons name="cube" size={20} color="#fff" />
                <Text style={styles.submitText}>{loading ? 'Creating...' : 'Create Order'}</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 12 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    categoryCard: { width: '30%', backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
    categoryActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
    categoryLabel: { fontSize: 12, fontWeight: '600', color: '#4b5563', marginTop: 6 },
    dimGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    dimInput: { width: '47%' },
    dimLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
    input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#e5e7eb', color: '#111827' },
    optionRow: { flexDirection: 'row', gap: 10 },
    optionBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
    optionActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
    optionText: { fontWeight: '600', color: '#4b5563' },
    submitBtn: { backgroundColor: '#4f46e5', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
    submitText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
