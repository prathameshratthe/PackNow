// Main App Component
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateOrder from './pages/CreateOrder';
import OrderDetails from './pages/OrderDetails';
import { isAuthenticated } from './utils/auth';

function PrivateRoute({ children }) {
    return isAuthenticated() ? children : <Navigate to="/login" />;
}

export default function App() {
    return (
        <ToastProvider>
            <Router>
                <div className="min-h-screen bg-gray-50">
                    <Navbar />
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
                    </Routes>
                </div>
            </Router>
        </ToastProvider>
    );
}
