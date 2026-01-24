
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserType } from '../types';

const Navigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userProfile } = useApp();
    const [showMenu, setShowMenu] = useState(false);

    const isOwner = userProfile.type === UserType.OWNER;

    const playerItems = [
        { path: '/', icon: 'fa-futbol', label: 'CANCHA' },
        { path: '/matches', icon: 'fa-clipboard-list', label: 'VESTUARIO' },
        { path: '/fields', icon: 'fa-map-marked-alt', label: 'CANCHAS' },
        { path: '/profile', icon: 'fa-id-card', label: 'MI FICHA' },
    ];

    const ownerItems = [
        { path: '/', icon: 'fa-chart-pie', label: 'DATOS' },
        { path: '/agenda', icon: 'fa-calendar-check', label: 'AGENDA' },
        { path: '/my-tournaments', icon: 'fa-trophy', label: 'TORNEOS' },
        { path: '/profile', icon: 'fa-building', label: 'COMPLEJO' },
    ];

    const navItems = isOwner ? ownerItems : playerItems;

    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    const handleAction = (path: string) => {
        setShowMenu(false);
        navigate(path);
    };

    return (
        <>
            {/* Pop-up Menu Adaptado */}
            {showMenu && (
                <div 
                    className="fixed inset-0 bg-slate-900/90 z-40 flex flex-col items-center justify-end pb-24 animate-in fade-in duration-200 backdrop-blur-sm"
                    onClick={() => setShowMenu(false)}
                >
                    <div className="flex flex-col gap-4 w-64 px-4">
                        {isOwner ? (
                            <>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleAction('/create-announcement'); }}
                                    className="bg-green-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-4 font-black uppercase italic tracking-wide active:scale-95 transition-transform"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                                        <i className="fas fa-bolt text-lg"></i>
                                    </div>
                                    Oferta Flash
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleAction('/create'); }}
                                    className="bg-white text-slate-900 p-4 rounded-2xl shadow-xl flex items-center gap-4 font-black uppercase italic tracking-wide active:scale-95 transition-transform"
                                >
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <i className="fas fa-plus text-lg"></i>
                                    </div>
                                    Nueva Reserva
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleAction('/create-announcement'); }}
                                    className="bg-red-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-4 font-black uppercase italic tracking-wide active:scale-95 transition-transform"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                                        <i className="fas fa-bullhorn text-lg"></i>
                                    </div>
                                    Pedido Urgente
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleAction('/create'); }}
                                    className="bg-white text-slate-900 p-4 rounded-2xl shadow-xl flex items-center gap-4 font-black uppercase italic tracking-wide active:scale-95 transition-transform"
                                >
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <i className="fas fa-calendar-plus text-lg"></i>
                                    </div>
                                    Organizar Partido
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="fixed bottom-0 left-0 w-full bg-slate-900 text-white border-t border-slate-800 h-16 flex justify-between items-center z-50 pb-safe shadow-lg px-2">
                <div className="flex w-2/5 justify-around">
                    {navItems.slice(0, 2).map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center h-full space-y-1 transition-colors ${location.pathname === item.path ? 'text-green-400' : 'text-slate-500'}`}
                        >
                            <i className={`fas ${item.icon} text-xl`}></i>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                        </button>
                    ))}
                </div>

                <div className="relative -top-5">
                    <button 
                        onClick={toggleMenu}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-slate-900 transition-transform active:scale-95 ${showMenu ? 'bg-slate-700 rotate-45' : isOwner ? 'bg-indigo-600' : 'bg-green-500'}`}
                    >
                        <i className="fas fa-plus text-white text-2xl"></i>
                    </button>
                </div>

                <div className="flex w-2/5 justify-around">
                    {navItems.slice(2, 4).map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center h-full space-y-1 transition-colors ${location.pathname === item.path ? 'text-green-400' : 'text-slate-500'}`}
                        >
                            <i className={`fas ${item.icon} text-xl`}></i>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Navigation;
