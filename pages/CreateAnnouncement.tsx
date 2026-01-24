
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Announcement } from '../types';

const CreateAnnouncement = () => {
    const navigate = useNavigate();
    const { addAnnouncement, userProfile } = useApp();
    const [type, setType] = useState<Announcement['type']>('FALTA_UNO');
    const [text, setText] = useState('');
    const [location, setLocation] = useState(userProfile.location || '');
    const [startTime, setStartTime] = useState('En 30 min');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        addAnnouncement({
            authorId: userProfile.id,
            authorName: userProfile.type === 'TEAM' ? (userProfile.teamName || userProfile.name) : userProfile.playerName,
            type,
            text: text.trim(),
            location: location.trim(),
            startTime: startTime.trim()
        });
        
        navigate('/');
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-6 pb-4 bg-white border-b border-slate-200">
                <h1 className="text-2xl font-black italic text-slate-900 uppercase tracking-tight">Anuncio <span className="text-red-600">Urgente</span></h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Busca rival o jugadores ahora mismo</p>
            </div>

            <div className="p-6 overflow-y-auto flex-1 pb-24">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">¿Qué necesitas?</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'FALTA_UNO', label: 'Falta Uno', icon: 'fa-user-plus' },
                                { id: 'BUSCO_RIVAL', label: 'Busco Rival', icon: 'fa-shield-virus' },
                                { id: 'BUSCO_EQUIPO', label: 'Libre', icon: 'fa-walking' }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setType(opt.id as any)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${type === opt.id ? 'bg-red-50 border-red-500 text-red-600 shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}
                                >
                                    <i className={`fas ${opt.icon} text-xl`}></i>
                                    <span className="text-[9px] font-black uppercase leading-tight text-center">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mensaje</label>
                        <textarea 
                            required
                            rows={3}
                            placeholder="Ej: Nos falta uno para las 20hs en Palermo. Nivel medio-bajo."
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 outline-none focus:border-red-500 font-bold text-slate-800 text-sm shadow-inner"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Zona</label>
                            <input 
                                type="text"
                                required
                                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 outline-none text-sm font-bold"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">¿Cuándo?</label>
                            <input 
                                type="text"
                                required
                                placeholder="Ej: Ya / En 1 hora"
                                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 outline-none text-sm font-bold"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit"
                            className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black uppercase italic tracking-widest shadow-xl active:scale-95 transition-transform"
                        >
                            <i className="fas fa-bullhorn mr-2"></i> Publicar Ahora
                        </button>
                        <button 
                            type="button"
                            onClick={() => navigate('/')}
                            className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest mt-2"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAnnouncement;
