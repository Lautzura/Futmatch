
import React, { useState } from 'react';

interface ChallengeModalProps {
    targetName: string;
    onClose: () => void;
    onConfirm: (data: { location: string; date: string; time: string; format: string }) => void;
}

const ChallengeModal: React.FC<ChallengeModalProps> = ({ targetName, onClose, onConfirm }) => {
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [format, setFormat] = useState('Fútbol 5 (5v5)');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!location || !date || !time) {
            alert("Por favor completa los campos del desafío.");
            return;
        }
        onConfirm({ location, date, time, format });
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <h2 className="text-2xl font-black italic text-[#0f172a] uppercase tracking-tighter mb-8 text-left leading-none">
                    DESAFIAR RIVAL
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Lugar / Cancha */}
                    <div className="relative">
                        <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input 
                            type="text"
                            placeholder="Lugar / Cancha"
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    {/* Fecha y Hora */}
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <input 
                                type="date"
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-green-500 transition-all appearance-none"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                            <i className="fas fa-calendar-alt absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px] opacity-40"></i>
                        </div>
                        <div className="relative flex-1">
                            <input 
                                type="time"
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#2ccb68] transition-all appearance-none"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                            <i className="fas fa-clock absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px] opacity-40"></i>
                        </div>
                    </div>

                    {/* Formato */}
                    <div className="relative">
                        <select 
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-[#0f172a] outline-none focus:ring-2 focus:ring-green-500 transition-all appearance-none"
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                        >
                            <option>Fútbol 5 (5v5)</option>
                            <option>Fútbol 7 (7v7)</option>
                            <option>Fútbol 11 (11v11)</option>
                        </select>
                        <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-4 pt-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all"
                        >
                            CANCELAR
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-4 bg-[#2ccb68] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-all"
                        >
                            ENVIAR DESAFÍO
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChallengeModal;
