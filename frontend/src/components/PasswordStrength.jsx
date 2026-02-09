// Password Strength Indicator Component
import React from 'react';

export const validatePasswordStrength = (password) => {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        digit: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;

    return {
        checks,
        strength: passedChecks,
        isValid: passedChecks === 5,
        strengthLabel:
            passedChecks === 5 ? 'Strong' :
                passedChecks >= 3 ? 'Medium' :
                    'Weak'
    };
};

export default function PasswordStrengthIndicator({ password }) {
    if (!password) return null;

    const { checks, strength, strengthLabel } = validatePasswordStrength(password);

    const strengthColor =
        strength === 5 ? 'bg-green-500' :
            strength >= 3 ? 'bg-yellow-500' :
                'bg-red-500';

    const strengthTextColor =
        strength === 5 ? 'text-green-700' :
            strength >= 3 ? 'text-yellow-700' :
                'text-red-700';

    return (
        <div className="mt-2 space-y-2">
            {/* Strength Bar */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${strengthColor} transition-all duration-300`}
                        style={{ width: `${(strength / 5) * 100}%` }}
                    />
                </div>
                <span className={`text-sm font-medium ${strengthTextColor}`}>
                    {strengthLabel}
                </span>
            </div>

            {/* Requirements Checklist */}
            <div className="text-xs space-y-1">
                <CheckItem checked={checks.length}>
                    At least 8 characters
                </CheckItem>
                <CheckItem checked={checks.uppercase}>
                    One uppercase letter
                </CheckItem>
                <CheckItem checked={checks.lowercase}>
                    One lowercase letter
                </CheckItem>
                <CheckItem checked={checks.digit}>
                    One number
                </CheckItem>
                <CheckItem checked={checks.special}>
                    One special character (!@#$%^&*...)
                </CheckItem>
            </div>
        </div>
    );
}

function CheckItem({ checked, children }) {
    return (
        <div className={`flex items-center gap-2 ${checked ? 'text-green-600' : 'text-gray-500'}`}>
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                {checked ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
            </svg>
            <span>{children}</span>
        </div>
    );
}
