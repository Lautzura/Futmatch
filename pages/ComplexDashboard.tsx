
import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const ComplexDashboard = () => {
    const { userProfile, logout } = useApp();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-y-auto pb-24 no-scrollbar text-slate-200">
            {/* Header Pro */}
            <div className="p-6 pt-12 bg-gradient-to-b from-emerald-900/20 to-transparent">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                            {userProfile.complexName || "Mi Complejo"}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Panel de Administración</span>
                        </div>
                    </div>
                    <button onClick={logout} className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-red-500">
                        <i className="fas fa-power-off"></i>
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-3xl cursor-pointer active:scale-95 transition-all" onClick={() => navigate('/agenda')}>
                        <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Caja del Día</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-white">$54.200</span>
                            <span className="text-[8px] text-emerald-400 font-bold">+15%</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-3xl cursor-pointer active:scale-95 transition-all" onClick={() => navigate('/agenda')}>
                        <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Ocupación</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-emerald-400">92%</span>
                            <span className="text-[8px] text-slate-500 font-bold">11/12 Turnos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="px-6 grid grid-cols-2 gap-3 -mt-2">
                <button 
                    onClick={() => navigate('/create')}
                    className="bg-emerald-500 text-slate-950 p-4 rounded-3xl flex items-center gap-3 shadow-lg active:scale-95 transition-transform"
                >
                    <div className="w-10 h-10 rounded-full bg-slate-950/10 flex items-center justify-center">
                        <i className="fas fa-plus text-xl"></i>
                    </div>
                    <span className="text-[10px] font-black uppercase leading-tight text-left">Nueva<br/>Reserva</span>
                </button>
                <button 
                    onClick={() => navigate('/create')}
                    className="bg-slate-800 text-white p-4 rounded-3xl flex items-center gap-3 border border-slate-700 active:scale-95 transition-transform"
                >
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <i className="fas fa-trophy text-xl"></i>
                    </div>
                    <span className="text-[10px] font-black uppercase leading-tight text-left">Crear<br/>Torneo</span>
                </button>
            </div>

            {/* Gestión de Partidos Terminados (Validación) */}
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cerrar Resultados</h2>
                    <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Pendientes: 2</span>
                </div>
                
                <div className="space-y-3">
                    {[
                        { time: '19:00 - 20:00', teamA: 'Los Galácticos', teamB: 'Dep. Birra', field: 'Cancha 1' },
                        { time: '19:00 - 20:00', teamA: 'Pichichis FC', teamB: 'La Scaloneta', field: 'Cancha 2' }
                    ].map((match, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-5 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{match.field} • {match.time}</span>
                                <i className="fas fa-ellipsis-h text-slate-700"></i>
                            </div>
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <div className="text-center flex-1">
                                    <div className="w-10 h-10 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-black italic">LG</div>
                                    <span className="text-[10px] font-black uppercase italic truncate block w-full">{match.teamA}</span>
                                </div>
                                <div className="text-slate-700 font-black text-xl italic">VS</div>
                                <div className="text-center flex-1">
                                    <div className="w-10 h-10 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-black italic">DB</div>
                                    <span className="text-[10px] font-black uppercase italic truncate block w-full">{match.teamB}</span>
                                </div>
                            </div>
                            <button className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-slate-950 transition-all">
                                CARGAR RESULTADO OFICIAL
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ocupación de Canchas */}
            <div className="px-6 pb-6">
                 <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Disponibilidad Actual</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { name: 'Cancha 1 (Fútbol 5)', status: 'Ocupada', until: '22:00', color: 'bg-emerald-500' },
                            { name: 'Cancha 2 (Fútbol 5)', status: 'Ocupada', until: '23:00', color: 'bg-emerald-500' },
                            { name: 'Cancha 3 (Fútbol 7)', status: 'Libre', until: 'Ahora', color: 'bg-slate-700' }
                        ].map((field, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${field.color}`}></div>
                                    <span className="text-[11px] font-black uppercase italic text-slate-300">{field.name}</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{field.status === 'Libre' ? 'DISPONIBLE' : `Hasta ${field.until}`}</span>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default ComplexDashboard;
