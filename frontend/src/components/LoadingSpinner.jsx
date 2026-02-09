// Loading Spinner Component
import React from 'react';

export default function LoadingSpinner({ size = 'md', text = null, fullScreen = false }) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]}`} />
            {text && <p className="text-gray-600 animate-pulse">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                {spinner}
            </div>
        );
    }

    return spinner;
}
