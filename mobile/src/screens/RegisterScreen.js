// Register Screen
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { saveTokens } from '../utils/auth';

export default function RegisterScreen({ navigation, onRegister }) {
    const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!form.name || !form.phone || !form.password) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }
        if (form.password !== form.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/register/user', {
                name: form.name,
                phone: form.phone,
                email: form.email || undefined,
                password: form.password,
            });

            // Auto-login after registration
            const loginRes = await api.post('/auth/login/user', {
                phone: form.phone,
                password: form.password,
            });
            await saveTokens(loginRes.data.access_token, loginRes.data.refresh_token);
            onRegister();
        } catch (error) {
            Alert.alert('Registration Failed', error.response?.data?.detail || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const updateForm = (key, value) => setForm({ ...form, [key]: value });

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join PackNow today</Text>
                </View>

                <View style={styles.form}>
                    {[
                        { key: 'name', icon: 'person-outline', placeholder: 'Full Name', type: 'default' },
                        { key: 'phone', icon: 'call-outline', placeholder: 'Phone (+91XXXXXXXXXX)', type: 'phone-pad' },
                        { key: 'email', icon: 'mail-outline', placeholder: 'Email (optional)', type: 'email-address' },
                        { key: 'password', icon: 'lock-closed-outline', placeholder: 'Password', type: 'default', secure: true },
                        { key: 'confirmPassword', icon: 'shield-checkmark-outline', placeholder: 'Confirm Password', type: 'default', secure: true },
                    ].map((field) => (
                        <View key={field.key} style={styles.inputGroup}>
                            <Ionicons name={field.icon} size={20} color="#9ca3af" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={field.placeholder}
                                value={form[field.key]}
                                onChangeText={(v) => updateForm(field.key, v)}
                                keyboardType={field.type}
                                secureTextEntry={field.secure}
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                    ))}

                    <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
                        <Text style={styles.btnText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkBtn}>
                        <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#4f46e5' },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    form: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
    inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, marginBottom: 12, paddingHorizontal: 16 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#111827' },
    btn: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    linkBtn: { marginTop: 20, alignItems: 'center' },
    linkText: { color: '#6b7280', fontSize: 14 },
    linkBold: { color: '#4f46e5', fontWeight: '600' },
});
