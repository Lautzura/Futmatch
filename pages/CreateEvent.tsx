
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const CreateEvent = () => {
    const navigate = useNavigate();
    const { createEvent, userProfile } = useApp();
    const [eventType, setEventType] = useState<'MATCH' | 'TOURNAMENT'>('MATCH');
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        location: '',
        format: '5v5',
        price: '', // "Entrada" o "Precio Cancha"
        prize: '', // "Premio"
        maxTeams: 8
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Construct event object
        const newEvent: any = {
            id: 'evt-' + Date.now(),
            title: formData.title,
            date: formData.date,
            time: formData.time,
            location: formData.location,
            format: formData.format,
            price: formData.price || 'Gratis',
            prize: formData.prize || 'Honor',
            imageUrl: eventType === 'TOURNAMENT' ? 'https://picsum.photos/400/200?random=88' : 'https://picsum.photos/400/200?random=99',
            status: 'OPEN',
            organizerId: userProfile.id,
            type: eventType,
            maxTeams: eventType === 'TOURNAMENT' ? formData.maxTeams : 2,
            currentTeams: 1 // Starts with creator
        };

        // Delay slightly for effect, then save
        setTimeout(() => {
            createEvent(newEvent);
            setIsSubmitting(false);
            navigate('/fields'); // Go to Explore/Tournaments view
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-6 pb-4 bg-white border-b border-slate-200">
                <h1 className="text-2xl font-black italic text-slate-900 uppercase tracking-tight">Organizar</h1>
            </div>

            <div className="p-6 overflow-y-auto flex-1 pb-24">
                {/* Toggle Type */}
                <div className="bg-slate-200 p-1 rounded-lg flex mb-8">
                    <button 
                        onClick={() => setEventType('MATCH')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all uppercase tracking-wide ${eventType === 'MATCH' ? 'bg-white shadow text-green-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Amistoso
                    </button>
                    <button 
                        onClick={() => setEventType('TOURNAMENT')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all uppercase tracking-wide ${eventType === 'TOURNAMENT' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Torneo
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Título</label>
                        <input 
                            type="text" 
                            required
                            placeholder={eventType === 'MATCH' ? "Ej: Amistoso vs Amigos" : "Ej: Copa de Verano"}
                            className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all font-medium text-slate-800"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                        />
                    </div>

                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fecha</label>
                            <input 
                                type="date" 
                                required
                                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 focus:border-green-500 outline-none font-medium text-slate-800"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hora</label>
                            <input 
                                type="time" 
                                required
                                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 focus:border-green-500 outline-none font-medium text-slate-800"
                                value={formData.time}
                                onChange={e => setFormData({...formData, time: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cancha / Ubicación</label>
                        <div className="relative">
                            <i className="fas fa-map-marker-alt absolute left-4 top-3.5 text-slate-400"></i>
                            <input 
                                type="text" 
                                required
                                placeholder="Nombre del complejo o dirección"
                                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-slate-200 focus:border-green-500 outline-none font-medium text-slate-800"
                                value={formData.location}
                                onChange={e => setFormData({...formData, location: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                {eventType === 'MATCH' ? 'Costo (Cancha)' : 'Inscripción'}
                            </label>
                            <input 
                                type="text"
                                placeholder={eventType === 'MATCH' ? "$20.000" : "$50.000 / equipo"}
                                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 outline-none text-sm"
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: e.target.value})}
                            />
                        </div>
                        {eventType === 'TOURNAMENT' && (
                             <div className="w-1/3">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cupos</label>
                                <input 
                                    type="number"
                                    min="2"
                                    max="64"
                                    className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 outline-none text-sm text-center font-bold"
                                    value={formData.maxTeams}
                                    onChange={e => setFormData({...formData, maxTeams: parseInt(e.target.value)})}
                                />
                            </div>
                        )}
                    </div>

                    {eventType === 'TOURNAMENT' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Premio (Opcional)</label>
                            <div className="relative">
                                <i className="fas fa-trophy absolute left-4 top-3.5 text-yellow-400"></i>
                                <input 
                                    type="text"
                                    placeholder="Ej: $100.000 + Trofeo"
                                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-slate-200 focus:border-indigo-500 outline-none font-medium text-slate-800"
                                    value={formData.prize}
                                    onChange={e => setFormData({...formData, prize: e.target.value})}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Formato de juego</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['5v5', '7v7', '11v11'].map(fmt => (
                                <button
                                    key={fmt}
                                    type="button"
                                    onClick={() => setFormData({...formData, format: fmt})}
                                    className={`py-2 rounded text-sm font-bold border-2 uppercase tracking-wide transition-all ${formData.format === fmt ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                >
                                    {fmt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-lg text-white font-black text-lg uppercase tracking-wide shadow-lg mt-6 transition-transform active:scale-95 border-b-4 flex items-center justify-center gap-2 ${eventType === 'MATCH' ? 'bg-green-600 border-green-800 hover:bg-green-500' : 'bg-indigo-600 border-indigo-800 hover:bg-indigo-500'} ${isSubmitting ? 'opacity-80' : ''}`}
                    >
                        {isSubmitting ? (
                            <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                            <>
                                <i className="fas fa-paper-plane"></i> Publicar
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateEvent;
