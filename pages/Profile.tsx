
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserType, SkillLevel, ProfileAttributes, FieldDetail } from '../types';

const ProfilePage = () => {
    const { userProfile, setUserProfile, logout } = useApp();
    const [editMode, setEditMode] = useState(false);
    const [tempProfile, setTempProfile] = useState(userProfile);
    
    const isOwner = userProfile.type === UserType.OWNER;

    const handleSave = () => {
        setUserProfile(tempProfile);
        setEditMode(false);
    };

    const addField = () => {
        const newField: FieldDetail = {
            id: 'f-' + Date.now(),
            name: `Cancha ${ (tempProfile.fields?.length || 0) + 1 }`,
            size: '5v5',
            surface: 'Sintético'
        };
        setTempProfile({
            ...tempProfile,
            fields: [...(tempProfile.fields || []), newField],
            fieldsCount: (tempProfile.fields?.length || 0) + 1
        });
    };

    const removeField = (id: string) => {
        const updatedFields = (tempProfile.fields || []).filter(f => f.id !== id);
        setTempProfile({
            ...tempProfile,
            fields: updatedFields,
            fieldsCount: updatedFields.length
        });
    };

    if (isOwner) {
        return (
            <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-24 no-scrollbar">
                {/* Header Complejo */}
                <div className="bg-slate-900 text-white p-8 pt-16 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-white rounded-[2rem] p-1 mb-4 shadow-xl overflow-hidden">
                            <img src={userProfile.imageUrl || 'https://picsum.photos/200/200?random=complex'} className="w-full h-full object-cover rounded-[1.8rem]" alt="logo" />
                        </div>
                        {editMode ? (
                            <input 
                                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xl font-black text-center text-white outline-none uppercase italic"
                                value={tempProfile.complexName}
                                onChange={e => setTempProfile({...tempProfile, complexName: e.target.value})}
                            />
                        ) : (
                            <h1 className="text-2xl font-black uppercase italic tracking-tighter">{userProfile.complexName}</h1>
                        )}
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Complejo Verificado</p>
                    </div>
                </div>

                <div className="px-6 -mt-6 space-y-6 relative z-20">
                    {/* Información de Contacto */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <i className="fas fa-id-card text-emerald-500"></i> DATOS DE CONTACTO
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Dirección Exacta</label>
                                {editMode ? (
                                    <input 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold"
                                        value={tempProfile.address}
                                        onChange={e => setTempProfile({...tempProfile, address: e.target.value})}
                                        placeholder="Ej: Av. Libertador 1234, CABA"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 italic">
                                        <i className="fas fa-map-marker-alt text-emerald-500"></i>
                                        {userProfile.address || "No definida"}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Teléfono / WhatsApp</label>
                                {editMode ? (
                                    <input 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold"
                                        value={tempProfile.phoneNumber}
                                        onChange={e => setTempProfile({...tempProfile, phoneNumber: e.target.value})}
                                        placeholder="Ej: +54 9 11 2233-4455"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 italic">
                                        <i className="fas fa-phone text-emerald-500"></i>
                                        {userProfile.phoneNumber || "No definido"}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Gestión de Canchas */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-layer-group text-emerald-500"></i> MIS CANCHAS ({tempProfile.fieldsCount || 0})
                            </h3>
                            {editMode && (
                                <button onClick={addField} className="text-emerald-500 text-xs font-black">
                                    + AGREGAR
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-3">
                            {(tempProfile.fields || []).map((field) => (
                                <div key={field.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                    <div>
                                        {editMode ? (
                                            <input 
                                                className="bg-transparent text-[11px] font-black uppercase italic text-slate-800 border-b border-slate-200 focus:border-emerald-500 outline-none"
                                                value={field.name}
                                                onChange={e => {
                                                    const updated = tempProfile.fields?.map(f => f.id === field.id ? {...f, name: e.target.value} : f);
                                                    setTempProfile({...tempProfile, fields: updated});
                                                }}
                                            />
                                        ) : (
                                            <span className="text-[11px] font-black uppercase italic text-slate-800">{field.name}</span>
                                        )}
                                        <div className="flex gap-2 mt-1">
                                            {editMode ? (
                                                <select 
                                                    className="bg-white border border-slate-200 text-[8px] font-black uppercase rounded px-1"
                                                    value={field.size}
                                                    onChange={e => {
                                                        const updated = tempProfile.fields?.map(f => f.id === field.id ? {...f, size: e.target.value as any} : f);
                                                        setTempProfile({...tempProfile, fields: updated});
                                                    }}
                                                >
                                                    <option value="5v5">F5</option>
                                                    <option value="7v7">F7</option>
                                                    <option value="11v11">F11</option>
                                                </select>
                                            ) : (
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{field.size}</span>
                                            )}
                                        </div>
                                    </div>
                                    {editMode && (
                                        <button onClick={() => removeField(field.id)} className="text-red-400">
                                            <i className="fas fa-trash-alt text-xs"></i>
                                        </button>
                                    )}
                                </div>
                            ))}
                            {(tempProfile.fields || []).length === 0 && (
                                <p className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase italic">No has cargado canchas aún.</p>
                            )}
                        </div>
                    </div>

                    {/* Acciones de Perfil */}
                    <div className="flex flex-col gap-3">
                        {editMode ? (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setEditMode(false)}
                                    className="flex-1 py-4 bg-slate-200 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                                >
                                    CANCELAR
                                </button>
                                <button 
                                    onClick={handleSave}
                                    className="flex-1 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                                >
                                    GUARDAR CAMBIOS
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => { setTempProfile(userProfile); setEditMode(true); }}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-edit text-xs"></i> EDITAR DATOS DEL COMPLEJO
                            </button>
                        )}
                        
                        <button 
                            onClick={logout}
                            className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-red-100"
                        >
                            CERRAR SESIÓN DE ADMINISTRADOR
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // VISTA DE JUGADOR / EQUIPO
    return (
        <div className="flex flex-col h-full overflow-y-auto bg-slate-50 pb-24 no-scrollbar">
            {/* Header / Cover */}
            <div className={`relative p-8 pt-16 rounded-b-[3rem] shadow-2xl text-white overflow-hidden ${userProfile.type === UserType.TEAM ? 'bg-indigo-900' : 'bg-slate-900'}`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="relative">
                        <div className="w-28 h-28 bg-white/10 backdrop-blur-md rounded-[2.5rem] p-1 mb-4 border border-white/20 overflow-hidden">
                            <img src={userProfile.imageUrl} className="w-full h-full object-cover rounded-[2.2rem]" alt="avatar" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-green-500 w-10 h-10 rounded-2xl border-4 border-slate-900 flex items-center justify-center shadow-lg">
                            <span className="text-xs font-black italic">{userProfile.rating.toFixed(1)}</span>
                        </div>
                    </div>

                    {editMode ? (
                        <input 
                            className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xl font-black text-center text-white outline-none uppercase italic italic"
                            value={tempProfile.name}
                            onChange={e => setTempProfile({...tempProfile, name: e.target.value})}
                        />
                    ) : (
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter drop-shadow-lg">{userProfile.name}</h1>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                        <i className="fas fa-map-marker-alt text-green-400 text-xs"></i>
                        {editMode ? (
                             <input 
                                className="bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold text-center text-white outline-none uppercase"
                                value={tempProfile.location}
                                onChange={e => setTempProfile({...tempProfile, location: e.target.value})}
                            />
                        ) : (
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{userProfile.location}</span>
                        )}
                    </div>

                    <div className="flex gap-8 mt-8">
                        <div className="text-center">
                            <span className="block text-2xl font-black text-white leading-none">{userProfile.stats.matchesPlayed}</span>
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Partidos</span>
                        </div>
                        <div className="w-[1px] h-8 bg-white/10 self-center"></div>
                        <div className="text-center">
                            <span className="block text-2xl font-black text-green-400 leading-none">{userProfile.stats.wins}</span>
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Victorias</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 -mt-6 space-y-6 relative z-20 pb-10">
                {/* Atributos / Stats Pro */}
                <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atributos Técnicos</h3>
                        <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase italic">{userProfile.skillLevel}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        {Object.entries(userProfile.attributes).map(([key, val]) => {
                            const value = val as number;
                            return (
                                <div key={key}>
                                    <div className="flex justify-between items-end mb-1.5">
                                        <span className="text-[10px] font-black text-slate-500 uppercase italic tracking-wider">{key.toUpperCase()}</span>
                                        <span className={`text-xs font-black italic ${value >= 80 ? 'text-green-600' : value >= 60 ? 'text-yellow-600' : 'text-slate-400'}`}>{value}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${value >= 80 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : value >= 60 ? 'bg-yellow-500' : 'bg-slate-300'}`} 
                                            style={{ width: `${value}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Historial de Partidos */}
                <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Últimos Encuentros</h3>
                    <div className="space-y-4">
                        {userProfile.matchHistory && userProfile.matchHistory.length > 0 ? (
                            userProfile.matchHistory.map((match, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${
                                            match.result === 'VICTORIA' ? 'bg-green-500 text-white' : 
                                            match.result === 'DERROTA' ? 'bg-red-500 text-white' : 'bg-slate-300 text-slate-600'
                                        }`}>
                                            {match.result[0]}
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-black text-slate-800 uppercase italic leading-none">{match.opponent}</span>
                                            <span className="block text-[8px] font-bold text-slate-400 uppercase mt-1">{match.date}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-black italic text-slate-700">{match.goals} Goles</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase italic">Aún no has registrado partidos</div>
                        )}
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-3">
                    {editMode ? (
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setEditMode(false)}
                                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                            >
                                CANCELAR
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                            >
                                GUARDAR
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => { setTempProfile(userProfile); setEditMode(true); }}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-edit text-xs"></i> EDITAR MI FICHA
                        </button>
                    )}
                    
                    <button 
                        onClick={logout}
                        className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-red-100"
                    >
                        CERRAR SESIÓN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
