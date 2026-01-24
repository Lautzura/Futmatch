
import React, { useState } from 'react';

const ComplexAgenda = () => {
    const [selectedField, setSelectedField] = useState(1);
    const hours = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'];
    const fields = [1, 2, 3];

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden pb-24">
            <div className="p-6 pt-12">
                <h1 className="text-2xl font-black uppercase italic tracking-tighter">Agenda Semanal</h1>
                <div className="flex gap-2 mt-4">
                    {fields.map(f => (
                        <button 
                            key={f}
                            onClick={() => setSelectedField(f)}
                            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                selectedField === f ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'
                            }`}
                        >
                            Cancha {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 no-scrollbar">
                <div className="space-y-2 pb-10">
                    {hours.map((hour, idx) => {
                        const isBooked = Math.random() > 0.4;
                        return (
                            <div key={hour} className="flex gap-4 items-center">
                                <span className="text-[10px] font-black text-slate-600 w-10">{hour}</span>
                                <div className={`flex-1 p-4 rounded-3xl border transition-all ${
                                    isBooked 
                                    ? 'bg-slate-900 border-slate-800 text-slate-400' 
                                    : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500 border-dashed cursor-pointer active:scale-[0.98]'
                                }`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase italic tracking-wide">
                                            {isBooked ? 'Reserva: Los Galácticos' : 'Disponible'}
                                        </span>
                                        {isBooked ? (
                                            <i className="fas fa-check-circle text-emerald-500"></i>
                                        ) : (
                                            <i className="fas fa-plus-circle opacity-30"></i>
                                        )}
                                    </div>
                                    {isBooked && (
                                        <div className="mt-2 flex gap-3 text-[8px] font-bold uppercase opacity-50">
                                            <span><i className="fas fa-user mr-1"></i> Nico (C)</span>
                                            <span><i className="fas fa-phone mr-1"></i> 11-2233...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Stats Footer for Agenda */}
            <div className="p-6 pt-0 absolute bottom-16 w-full">
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-3xl flex justify-between items-center">
                    <div>
                        <span className="text-[8px] font-black text-slate-500 uppercase block">Ocupación Mañana</span>
                        <span className="text-sm font-black text-white">4 / 7 Turnos</span>
                    </div>
                    <button className="bg-white text-slate-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic">Ver Semana</button>
                </div>
            </div>
        </div>
    );
};

export default ComplexAgenda;
