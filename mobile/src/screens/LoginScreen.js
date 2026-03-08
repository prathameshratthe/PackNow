// Login Screen
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { saveTokens } from '../utils/auth';

export default function LoginScreen({ navigation, onLogin }) {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!phone || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/login/user', { phone, password });
            await saveTokens(response.data.access_token, response.data.refresh_token);
            onLogin();
        } catch (error) {
            Alert.alert('Login Failed', error.response?.data?.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.header}>
                <View style={styles.iconBox}>
                    <Ionicons name="cube" size={40} color="#fff" />
                </View>
                <Text style={styles.title}>PackNow</Text>
                <Text style={styles.subtitle}>Professional Packaging Service</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Phone number"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
                    <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkBtn}>
                    <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#4f46e5', justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 40 },
    iconBox: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 20, marginBottom: 16 },
    title: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    form: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
    inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, marginBottom: 16, paddingHorizontal: 16 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#111827' },
    btn: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    linkBtn: { marginTop: 20, alignItems: 'center' },
    linkText: { color: '#6b7280', fontSize: 14 },
    linkBold: { color: '#4f46e5', fontWeight: '600' },
});
