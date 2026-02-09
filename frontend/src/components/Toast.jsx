// Toast Notification Component
import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

const Toast = ({ toast, onClose }) => {
    const icons = {
        success: <FiCheckCircle className="h-5 w-5" />,
        error: <FiAlertCircle className="h-5 w-5" />,
        info: <FiInfo className="h-5 w-5" />,
    };

    const colors = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
    };

    return (
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${colors[toast.type]} shadow-lg animate-slide-in`}>
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <div className="flex-1">
                {toast.title && <p className="font-semibold">{toast.title}</p>}
                <p className="text-sm">{toast.message}</p>
            </div>
            <button
                onClick={() => onClose(toast.id)}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
                <FiX className="h-5 w-5" />
            </button>
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', title = null, duration = 5000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type, title }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const toast = {
        success: (message, title) => addToast(message, 'success', title),
        error: (message, title) => addToast(message, 'error', title),
        info: (message, title) => addToast(message, 'info', title),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onClose={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
