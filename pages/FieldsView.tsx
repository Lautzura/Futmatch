
import React, { useState, useEffect } from 'react';
import { searchFootballFields, FieldResult } from '../services/geminiService';
import { MOCK_TOURNAMENTS } from '../constants';
import { useApp } from '../context/AppContext';

const FieldsView = () => {
    const { addNotification, createdEvents } = useApp();
    const [viewMode, setViewMode] = useState<'FIELDS' | 'TOURNAMENTS'>('FIELDS');
    const [location, setLocation] = useState('Palermo');
    
    // Fields State
    const [fields, setFields] = useState<FieldResult[]>([]);
    const [loadingFields, setLoadingFields] = useState(false);
    const [hasSearchedFields, setHasSearchedFields] = useState(false);
    const [fieldFilterType, setFieldFilterType] = useState<'ALL' | 'INDOOR' | 'OUTDOOR'>('ALL');

    // Combine Mocks + User Created Events
    const allTournaments = [...createdEvents, ...MOCK_TOURNAMENTS];

    // Initial search on mount
    useEffect(() => {
        handleSearch();
    }, []);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (viewMode === 'FIELDS') {
            setLoadingFields(true);
            setHasSearchedFields(true);
            const results = await searchFootballFields(location);
            setFields(results);
            setLoadingFields(false);
        } else {
            // For tournaments, the filtering happens on render based on 'location' state
            // No API call needed for mock
        }
    };

    const handleJoinTournament = (tournamentTitle: string) => {
        if (window.confirm(`¿Quieres inscribirte en "${tournamentTitle}"?`)) {
            addNotification({
                type: 'MESSAGE',
                title: 'Solicitud Enviada',
                message: `Le avisamos al organizador de "${tournamentTitle}". Te contactarán pronto.`
            });
        }
    };

    const filteredFields = fields.filter(field => {
        if (fieldFilterType === 'ALL') return true;
        return field.type === fieldFilterType;
    });

    const filteredTournaments = allTournaments.filter(t => 
        t.type === 'TOURNAMENT' &&
        (t.location.toLowerCase().includes(location.toLowerCase()) || 
         t.title.toLowerCase().includes(location.toLowerCase()) ||
         location === '')
    );

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="p-4 pb-2">
                    <h1 className="text-2xl font-black italic text-slate-900 uppercase tracking-tight mb-3">
                        Explorar <span className="text-green-600">Zona</span>
                    </h1>
                    
                    {/* Main Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button 
                            onClick={() => setViewMode('FIELDS')}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${viewMode === 'FIELDS' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <i className="fas fa-map-marked-alt mr-2"></i> Canchas
                        </button>
                        <button 
                            onClick={() => setViewMode('TOURNAMENTS')}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${viewMode === 'TOURNAMENTS' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <i className="fas fa-trophy mr-2"></i> Torneos
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-4 pb-4">
                    <form onSubmit={handleSearch} className="relative">
                        <i className="fas fa-search absolute left-4 top-3.5 text-slate-400"></i>
                        <input 
                            type="text" 
                            placeholder={viewMode === 'FIELDS' ? "Buscar barrio (ej: Palermo)..." : "Buscar torneos en..."}
                            className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                        <button 
                            type="submit"
                            className="absolute right-2 top-2 w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800"
                        >
                            {loadingFields && viewMode === 'FIELDS' ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className="fas fa-arrow-right text-xs"></i>}
                        </button>
                    </form>

                    {/* Sub-Filters for Fields */}
                    {viewMode === 'FIELDS' && (
                        <div className="flex gap-2 mt-3 animate-in slide-in-from-top-2">
                            <button 
                                onClick={() => setFieldFilterType('ALL')}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all ${fieldFilterType === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}
                            >Todas</button>
                            <button 
                                onClick={() => setFieldFilterType('INDOOR')}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all flex items-center gap-1 ${fieldFilterType === 'INDOOR' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200'}`}
                            ><i className="fas fa-umbrella"></i> Techadas</button>
                            <button 
                                onClick={() => setFieldFilterType('OUTDOOR')}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all flex items-center gap-1 ${fieldFilterType === 'OUTDOOR' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-white text-slate-500 border-slate-200'}`}
                            ><i className="fas fa-sun"></i> Aire Libre</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                
                {/* === FIELDS VIEW === */}
                {viewMode === 'FIELDS' && (
                    <>
                        {filteredFields.length === 0 && !loadingFields && hasSearchedFields ? (
                            <div className="text-center py-10 opacity-50">
                                <i className="fas fa-map-signs text-4xl mb-3 text-slate-300"></i>
                                <p className="font-bold text-slate-500">No encontramos canchas aquí.</p>
                            </div>
                        ) : fields.length === 0 && !loadingFields && !hasSearchedFields ? (
                            <div className="text-center py-10 opacity-50">
                                <p className="font-bold text-slate-500">Busca tu zona para ver canchas.</p>
                            </div>
                        ) : (
                            filteredFields.map((field, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group active:scale-[0.99] transition-transform animate-in fade-in duration-300">
                                    <div className="flex-1 pr-4">
                                        <h3 className="font-black text-slate-800 text-sm uppercase italic mb-1">
                                            {field.title}
                                        </h3>
                                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mb-2">
                                            <i className="fas fa-map-marker-alt text-green-500"></i>
                                            <span>{location}, Buenos Aires</span>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {field.type === 'INDOOR' ? (
                                                <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase border border-indigo-100 flex items-center gap-1">
                                                    <i className="fas fa-umbrella text-[8px]"></i> Techada
                                                </span>
                                            ) : (
                                                <span className="text-[9px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-bold uppercase border border-orange-100 flex items-center gap-1">
                                                    <i className="fas fa-sun text-[8px]"></i> Aire Libre
                                                </span>
                                            )}
                                            <span className="text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold uppercase border border-green-100">
                                                ★ {field.rating}
                                            </span>
                                        </div>
                                    </div>
                                    <a 
                                        href={field.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-green-500 group-hover:text-white transition-colors shadow-sm"
                                    >
                                        <i className="fas fa-location-arrow transform -rotate-45"></i>
                                    </a>
                                </div>
                            ))
                        )}
                        {loadingFields && (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 h-24 animate-pulse"></div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* === TOURNAMENTS VIEW === */}
                {viewMode === 'TOURNAMENTS' && (
                    <>
                         {filteredTournaments.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <i className="fas fa-trophy text-4xl mb-3 text-slate-300"></i>
                                <p className="font-bold text-slate-500">No hay torneos en esta zona.</p>
                                <p className="text-xs text-slate-400">Intenta buscar "Palermo" o "Belgrano".</p>
                            </div>
                        ) : (
                            filteredTournaments.map((tournament) => (
                                <div key={tournament.id} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden group animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="h-28 bg-slate-800 relative">
                                        <img src={tournament.imageUrl} alt={tournament.title} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-wide">
                                            {tournament.status === 'OPEN' ? 'Inscripción Abierta' : 'Cerrado'}
                                        </div>
                                        <div className="absolute bottom-0 left-0 p-3 w-full bg-gradient-to-t from-black/80 to-transparent">
                                            <h3 className="text-white font-black uppercase italic text-lg leading-none mb-1">{tournament.title}</h3>
                                            <div className="flex text-white/80 text-[10px] font-bold gap-3">
                                                <span><i className="fas fa-calendar mr-1"></i> {tournament.date}</span>
                                                <span><i className="fas fa-clock mr-1"></i> {tournament.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Ubicación</div>
                                                <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                                    <i className="fas fa-map-marker-alt text-green-500"></i> {tournament.location}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                 <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Formato</div>
                                                 <span className="bg-slate-100 px-2 py-1 rounded text-xs font-black text-slate-800 uppercase">{tournament.format}</span>
                                            </div>
                                        </div>

                                        <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg mb-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
                                                <i className="fas fa-trophy text-lg"></i>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-yellow-600 font-bold uppercase">Premio Campeón</div>
                                                <div className="text-sm font-black text-slate-800">{tournament.prize || 'Honor y Gloria'}</div>
                                            </div>
                                        </div>

                                        {/* Progress Bar for Teams */}
                                        {tournament.maxTeams && (
                                            <div className="mb-4">
                                                <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                                                    <span className="text-slate-500">Cupos</span>
                                                    <span className="text-indigo-600">{tournament.currentTeams || 1}/{tournament.maxTeams} Inscriptos</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                    <div 
                                                        className="bg-indigo-500 h-full rounded-full" 
                                                        style={{ width: `${((tournament.currentTeams || 1) / tournament.maxTeams) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                            <div className="text-xs font-bold text-slate-500">
                                                Entrada: <span className="text-slate-900">{tournament.price}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleJoinTournament(tournament.title)}
                                                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-green-600 transition-colors shadow-lg active:scale-95"
                                            >
                                                Inscribirse
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default FieldsView;
