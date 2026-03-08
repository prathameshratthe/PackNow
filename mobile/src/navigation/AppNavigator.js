// App Navigator with Auth + Main tab flows
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { isAuthenticated } from '../utils/auth';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CreateOrderScreen from '../screens/CreateOrderScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import TrackOrderScreen from '../screens/TrackOrderScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const THEME = { primary: '#4f46e5', bg: '#f9fafb', card: '#ffffff', text: '#111827' };

function HomeTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'NewOrder') iconName = focused ? 'add-circle' : 'add-circle-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: THEME.primary,
                tabBarInactiveTintColor: '#9ca3af',
                headerStyle: { backgroundColor: THEME.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'My Orders' }} />
            <Tab.Screen name="NewOrder" component={CreateOrderScreen} options={{ title: 'New Order' }} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const [loggedIn, setLoggedIn] = useState(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const auth = await isAuthenticated();
        setLoggedIn(auth);
    };

    if (loggedIn === null) return null; // loading

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: { backgroundColor: THEME.primary },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            >
                {!loggedIn ? (
                    <>
                        <Stack.Screen name="Login" options={{ headerShown: false }}>
                            {(props) => <LoginScreen {...props} onLogin={() => setLoggedIn(true)} />}
                        </Stack.Screen>
                        <Stack.Screen name="Register" options={{ headerShown: false }}>
                            {(props) => <RegisterScreen {...props} onRegister={() => setLoggedIn(true)} />}
                        </Stack.Screen>
                    </>
                ) : (
                    <>
                        <Stack.Screen name="MainTabs" component={HomeTabs} options={{ headerShown: false }} />
                        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'Order Details' }} />
                        <Stack.Screen name="TrackOrder" component={TrackOrderScreen} options={{ title: 'Track Order' }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
