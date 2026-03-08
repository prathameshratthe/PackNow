// Main App Component — Industry-level role isolation
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
import PackerLogin from './pages/PackerLogin';
import PackerDashboard from './pages/PackerDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { isAuthenticated } from './utils/auth';

// ═══════════════════════════════════════════════════════════
// STRICT ROLE-BASED ROUTE GUARDS — Cross-role access blocked
// ═══════════════════════════════════════════════════════════

function CustomerRoute({ children }) {
    const role = localStorage.getItem('user_role');
    if (!isAuthenticated()) return <Navigate to="/login" />;
    if (role && role !== 'user') {
        // Cross-role block: packer/admin trying to access customer pages
        return <Navigate to={role === 'packer' ? '/packer/dashboard' : '/admin/dashboard'} />;
    }
    return children;
}

function PackerRoute({ children }) {
    const role = localStorage.getItem('user_role');
    if (!isAuthenticated()) return <Navigate to="/packer/login" />;
    if (role !== 'packer') {
        // Cross-role block
        return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/dashboard'} />;
    }
    return children;
}

function AdminRoute({ children }) {
    const role = localStorage.getItem('user_role');
    if (!isAuthenticated()) return <Navigate to="/admin/login" />;
    if (role !== 'admin') {
        // Cross-role block
        return <Navigate to={role === 'packer' ? '/packer/dashboard' : '/dashboard'} />;
    }
    return children;
}

function AppContent() {
    const location = useLocation();
    const isAdminPage = location.pathname.startsWith('/admin');
    const isPackerPage = location.pathname.startsWith('/packer');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar only on customer pages */}
            {!isAdminPage && !isPackerPage && <Navbar />}

            <Routes>
                {/* ── PUBLIC ── */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* ── CUSTOMER (role: user) ── */}
                <Route path="/dashboard" element={<CustomerRoute><Dashboard /></CustomerRoute>} />
                <Route path="/create-order" element={<CustomerRoute><CreateOrder /></CustomerRoute>} />
                <Route path="/orders/:orderId" element={<CustomerRoute><OrderDetails /></CustomerRoute>} />
                <Route path="/track/:orderId" element={<CustomerRoute><TrackOrder /></CustomerRoute>} />

                {/* ── PACKER (role: packer) ── */}
                <Route path="/packer/login" element={<PackerLogin />} />
                <Route path="/packer/dashboard" element={<PackerRoute><PackerDashboard /></PackerRoute>} />

                {/* ── ADMIN (role: admin) ── */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
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
