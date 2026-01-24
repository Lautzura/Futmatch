
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserType, SkillLevel, ProfileAttributes } from '../types';

const Onboarding = () => {
    const { completeOnboarding } = useApp();
    const [step, setStep] = useState(1);
    
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [type, setType] = useState<UserType>(UserType.PLAYER);
    const [skillLevel, setSkillLevel] = useState<SkillLevel>(SkillLevel.AMATEUR);

    const [attributes, setAttributes] = useState<ProfileAttributes>({
        pace: 60, shooting: 60, passing: 60, dribbling: 60, defending: 60, physical: 60
    });

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1) {
            if (!name.trim() || !location.trim()) return;
            // Si es dueño de complejo, el flujo es más corto o diferente, pero aquí lo simplificamos
            if (type === UserType.OWNER) {
                 completeOnboarding({
                    name: name.trim(),
                    complexName: name.trim(),
                    location: location.trim(),
                    type: UserType.OWNER,
                    description: 'Complejo Deportivo Verificado',
                    imageUrl: 'https://picsum.photos/400/400?random=complex',
                    services: [
                        { id: 's1', label: 'Duchas', icon: 'fa-shower', available: true },
                        { id: 's2', label: 'Buffet', icon: 'fa-hamburger', available: true },
                        { id: 's3', label: 'Parking', icon: 'fa-car', available: false }
                    ],
                    fieldsCount: 3
                });
                return;
            }
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        } else {
            completeOnboarding({
                name: name.trim(), 
                playerName: type === UserType.PLAYER ? name.trim() : `Capitán ${name.split(' ')[0]}`,
                teamName: type === UserType.TEAM ? name.trim() : '',
                location: location.trim(),
                type,
                skillLevel,
                attributes,
                matchHistory: [],
                myTeams: type === UserType.TEAM ? [{ id: 't1', name: name.trim() }] : []
            });
        }
    };

    return (
        <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
            
            <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-300">
                <div className="flex gap-2 mb-8">
                    <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-green-500' : 'bg-slate-100'}`}></div>
                    {type !== UserType.OWNER && <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-green-500' : 'bg-slate-100'}`}></div>}
                    {type !== UserType.OWNER && <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-green-500' : 'bg-slate-100'}`}></div>}
                </div>

                <h1 className="text-2xl font-black text-slate-800 uppercase italic mb-6 text-center">
                    {step === 1 ? '¡Bienvenido Crack!' : step === 2 ? 'Tu Estilo' : 'Tus Stats'}
                </h1>

                <form onSubmit={handleNext} className="space-y-6">
                    {step === 1 && (
                        <>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">¿Quién eres?</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: UserType.PLAYER, label: 'Jugador', icon: 'fa-user' },
                                        { id: UserType.TEAM, label: 'Equipo', icon: 'fa-users' },
                                        { id: UserType.OWNER, label: 'Complejo', icon: 'fa-building' }
                                    ].map((opt) => (
                                        <button key={opt.id} type="button" onClick={() => setType(opt.id as any)} className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all gap-1 ${type === opt.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-50 text-slate-300'}`}>
                                            <i className={`fas ${opt.icon} text-lg`}></i>
                                            <span className="text-[8px] font-black uppercase">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">
                                    {type === UserType.OWNER ? 'Nombre del Complejo' : 'Tu Nombre / Equipo'}
                                </label>
                                <input required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-green-500" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: La Bombonerita" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Ubicación</label>
                                <input required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-green-500" value={location} onChange={e => setLocation(e.target.value)} placeholder="Barrio o Ciudad" />
                            </div>
                        </>
                    )}

                    {step === 2 && type !== UserType.OWNER && (
                        <div className="grid grid-cols-2 gap-2">
                            {Object.values(SkillLevel).map(lvl => (
                                <button key={lvl} type="button" onClick={() => setSkillLevel(lvl)} className={`py-4 rounded-xl border text-[9px] font-black uppercase transition-all ${skillLevel === lvl ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 3 && type !== UserType.OWNER && (
                        <div className="space-y-4">
                            {['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'].map(attr => (
                                <div key={attr} className="flex items-center gap-4">
                                    <span className="text-[9px] font-black text-slate-400 uppercase w-12">{attr.slice(0,3)}</span>
                                    <input type="range" className="flex-1 accent-green-500" value={attributes[attr as keyof ProfileAttributes]} onChange={e => setAttributes({...attributes, [attr]: parseInt(e.target.value)})} />
                                    <span className="text-xs font-black w-6">{attributes[attr as keyof ProfileAttributes]}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <button type="submit" className="w-full py-4 bg-green-500 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-lg active:scale-95 transition-transform">
                        {step === (type === UserType.OWNER ? 1 : 3) ? '¡LISTO PARA JUGAR!' : 'SIGUIENTE'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Onboarding;
