
import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppNotification } from '../types';

const NotificationToast = () => {
    const { notifications, markAsRead } = useApp();
    const [visibleNotification, setVisibleNotification] = useState<AppNotification | null>(null);

    useEffect(() => {
        // Find the latest unread notification
        const latest = notifications.find(n => !n.read);
        if (latest) {
            setVisibleNotification(latest);
            // Auto hide after 7 seconds (increased time)
            const timer = setTimeout(() => {
                markAsRead(latest.id);
                setVisibleNotification(null);
            }, 7000);
            return () => clearTimeout(timer);
        }
    }, [notifications, markAsRead]);

    if (!visibleNotification) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'MATCH_REMINDER': return 'fa-calendar-check text-green-500';
            case 'MESSAGE': return 'fa-comment-alt text-blue-500';
            default: return 'fa-bell text-yellow-500';
        }
    };

    const getBgColor = (type: string) => {
         switch (type) {
            case 'MATCH_REMINDER': return 'border-l-4 border-green-500';
            case 'MESSAGE': return 'border-l-4 border-blue-500';
            default: return 'border-l-4 border-yellow-500';
        }
    };

    return (
        <div 
            className={`fixed top-4 left-4 right-4 z-[100] bg-white rounded-lg shadow-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-300 ${getBgColor(visibleNotification.type)}`}
            onClick={() => {
                markAsRead(visibleNotification.id);
                setVisibleNotification(null);
            }}
        >
            <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0`}>
                <i className={`fas ${getIcon(visibleNotification.type)}`}></i>
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {visibleNotification.title}
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {visibleNotification.message}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block font-bold">Toca para cerrar</span>
            </div>
            <button className="text-slate-300 hover:text-slate-500">
                <i className="fas fa-times"></i>
            </button>
        </div>
    );
};

export default NotificationToast;
