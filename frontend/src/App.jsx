// Main App Component
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateOrder from './pages/CreateOrder';
import OrderDetails from './pages/OrderDetails';
import TrackOrder from './pages/TrackOrder';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { isAuthenticated } from './utils/auth';

function PrivateRoute({ children }) {
    return isAuthenticated() ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
    const role = localStorage.getItem('user_role');
    return isAuthenticated() && role === 'admin' ? children : <Navigate to="/admin/login" />;
}

function AppContent() {
    const location = useLocation();
    const isAdminPage = location.pathname.startsWith('/admin');

    return (
        <div className="min-h-screen bg-gray-50">
            {!isAdminPage && <Navbar />}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/create-order"
                    element={
                        <PrivateRoute>
                            <CreateOrder />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/orders/:orderId"
                    element={
                        <PrivateRoute>
                            <OrderDetails />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/track/:orderId"
                    element={
                        <PrivateRoute>
                            <TrackOrder />
                        </PrivateRoute>
                    }
                />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                    path="/admin/dashboard"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />
            </Routes>
        </div>
    );
}

export default function App() {
    return (
        <ToastProvider>
            <Router>
                <AppContent />
            </Router>
        </ToastProvider>
    );
}
