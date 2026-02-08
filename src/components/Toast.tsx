// src/components/Toast.tsx
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 5000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const styles = {
        success: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-800',
            icon: <CheckCircle className="h-5 w-5 text-green-600" />
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-800',
            icon: <AlertCircle className="h-5 w-5 text-red-600" />
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-800',
            icon: <Info className="h-5 w-5 text-blue-600" />
        }
    };

    const style = styles[type];

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
            <div className={`${style.bg} ${style.border} border rounded-lg shadow-lg p-4 max-w-md min-w-[300px]`}>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {style.icon}
                    </div>
                    <div className="flex-1">
                        <p className={`text-sm ${style.text} whitespace-pre-line`}>{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`flex-shrink-0 ${style.text} hover:opacity-70 transition-opacity`}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
