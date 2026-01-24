
import React, { useState } from 'react';
import { Profile, UserType, ProfileAttributes } from '../types';
import { analyzeOpponent } from '../services/geminiService';
import { useApp } from '../context/AppContext';

interface MatchCardProps {
    profile: Profile;
}

const MatchCard: React.FC<MatchCardProps> = ({ profile }) => {
    const { userProfile, addNotification } = useApp();
    const [analysis, setAnalysis] = useState<any>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    // Destructure with fallbacks to avoid crashes
    const { attributes = {}, rating = 0, reputation = {} as any } = profile || {};

    const handleAnalysis = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (analysis) {
            setShowDetails(!showDetails);
            return;
        }

        setLoadingAnalysis(true);
        const result = await analyzeOpponent(userProfile, profile);
        try {
            const json = JSON.parse(result);
            setAnalysis(json);
            setShowDetails(true);
        } catch (err) {
            console.error("Failed to parse analysis");
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const handleInviteToTeam = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!userProfile.myTeams || userProfile.myTeams.length === 0) {
            alert("No tienes un equipo propio para invitar jugadores. ¡Funda uno en tu perfil!");
            return;
        }
        addNotification({
            type: 'MESSAGE',
            title: 'Oferta Enviada',
            message: `Le has enviado una oferta de fichaje a ${profile.name} para unirse a ${userProfile.myTeams[0].name}.`
        });
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const text = `⚽ ¡Mira la ficha de ${profile.name} en FutMatch!\n⭐ Nivel: ${profile.skillLevel}\n📍 ${profile.location}\n\n¡Descarga la app y jugamos!`;
        if (navigator.share) {
            navigator.share({
                title: `Ficha de ${profile.name}`,
                text: text,
                url: window.location.href
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text);
            alert("Enlace copiado al portapapeles");
        }
    };

    const getStatColor = (value: number) => {
        if (value >= 80) return 'text-green-600';
        if (value >= 60) return 'text-yellow-600';
        return 'text-red-500';
    };

    const getBadges = () => {
        const badges = [];
        const attrs = attributes as ProfileAttributes;
        
        if (attrs.pace >= 80) badges.push({ icon: 'fa-bolt', label: 'Velocista', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' });
        if (attrs.shooting >= 80) badges.push({ icon: 'fa-crosshairs', label: 'Francotirador', color: 'bg-red-100 text-red-700 border-red-300' });
        if (attrs.passing >= 80) badges.push({ icon: 'fa-magic', label: 'Mago', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' });
        
        if ((reputation?.puntuality || 0) >= 95) badges.push({ icon: 'fa-clock', label: 'Puntual', color: 'bg-blue-100 text-blue-700 border-blue-300' });
        if ((reputation?.fairPlay || 0) >= 95) badges.push({ icon: 'fa-handshake', label: 'Fair Play', color: 'bg-green-100 text-green-700 border-green-300' });
        
        const mvpCount = (profile.matchHistory || []).filter(m => m.isMVP).length;
        if (mvpCount > 0) badges.push({ icon: 'fa-award', label: `${mvpCount} MVPs`, color: 'bg-orange-100 text-orange-700 border-orange-300' });

        if ((reputation?.reports || 0) > 3) badges.push({ icon: 'fa-exclamation-triangle', label: 'RIVAL DE RIESGO', color: 'bg-red-600 text-white border-red-800 animate-pulse' });
        if (rating >= 4.8) badges.push({ icon: 'fa-crown', label: 'Crack', color: 'bg-gradient-to-r from-yellow-200 to-yellow-400 text-yellow-900 border-yellow-500' });
        
        return badges;
    };

    const badges = getBadges();

    return (
        <div className="relative w-full min-h-full bg-white flex flex-col">
            <div className="bg-slate-900 p-3 flex justify-between items-center text-white sticky top-0 z-10 shadow-sm">
                <span className="font-black text-lg italic tracking-tighter uppercase">{profile.type === UserType.TEAM ? 'EQUIPO' : 'JUGADOR'}</span>
                <div className="flex items-center gap-3">
                     <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <i key={star} className={`fas fa-star text-[10px] ${star <= Math.round(reputation?.starRating || 0) ? 'text-yellow-400' : 'text-slate-700'}`}></i>
                        ))}
                    </div>
                    <button onClick={handleShare} className="text-white hover:text-green-400 transition-colors">
                        <i className="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>

            <div className="relative h-72 w-full bg-slate-100 shrink-0">
                <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900 to-transparent p-4 pt-12">
                    <h2 className="text-3xl font-black text-white leading-none uppercase italic tracking-tight drop-shadow-md">{profile.name}</h2>
                    <div className="flex items-center text-gray-300 text-sm font-semibold mt-1">
                        <i className="fas fa-map-marker-alt mr-1 text-green-400"></i> {profile.location}
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-slate-50 p-4 flex flex-col gap-4 pb-12">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Análisis Técnico</h3>
                    <div className="grid grid-cols-6 gap-2">
                        {Object.keys(attributes).map(attr => (
                            <div key={attr} className="text-center">
                                <span className={`block text-lg font-black ${getStatColor(attributes[attr as keyof ProfileAttributes] || 0)}`}>{attributes[attr as keyof ProfileAttributes] || 0}</span>
                                <span className="block text-[9px] text-slate-400 font-bold uppercase">{attr.substring(0, 3).toUpperCase()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {profile.type === UserType.PLAYER && (
                     <button onClick={handleInviteToTeam} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                        <i className="fas fa-file-signature text-green-400"></i> OFRECER FICHAJE
                    </button>
                )}

                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center gap-1">
                        <i className={`fas fa-clock ${(reputation?.puntuality || 0) > 90 ? 'text-blue-500' : 'text-slate-400'}`}></i>
                        <span className="text-[8px] font-black uppercase text-slate-400 text-center">Puntualidad</span>
                        <span className="text-xs font-black text-slate-800">{reputation?.puntuality || 0}%</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center gap-1">
                        <i className={`fas fa-handshake ${(reputation?.fairPlay || 0) > 90 ? 'text-green-500' : 'text-slate-400'}`}></i>
                        <span className="text-[8px] font-black uppercase text-slate-400 text-center">Fair Play</span>
                        <span className="text-xs font-black text-slate-800">{reputation?.fairPlay || 0}%</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center gap-1">
                        <i className={`fas fa-check-double ${(reputation?.skillVeracity || 0) > 90 ? 'text-indigo-500' : 'text-slate-400'}`}></i>
                        <span className="text-[8px] font-black uppercase text-slate-400 text-center">Nivel Veraz</span>
                        <span className="text-xs font-black text-slate-800">{reputation?.skillVeracity || 0}%</span>
                    </div>
                </div>

                {badges.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {badges.map((badge, idx) => (
                            <div key={idx} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm shrink-0 ${badge.color}`}>
                                <i className={`fas ${badge.icon} text-xs`}></i>
                                <span className="text-[10px] font-black uppercase tracking-wide">{badge.label}</span>
                            </div>
                        ))}
                    </div>
                )}

                <button onClick={handleAnalysis} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold text-xs uppercase tracking-wide shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mb-4">
                    {loadingAnalysis ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-search-plus"></i> Scouting IA</>}
                </button>

                {showDetails && analysis && (
                     <div className="p-4 bg-indigo-900 text-white rounded-xl shadow-inner animate-in slide-in-from-top-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-3">Informe del Scout</h4>
                        {analysis.error ? (
                            <p className="text-xs">{analysis.error}</p>
                        ) : (
                            <div className="space-y-4">
                                <ul className="space-y-2">
                                    {analysis.tactics?.map((t: string, i: number) => (
                                        <li key={i} className="text-xs flex gap-2">
                                            <i className="fas fa-check text-green-400 mt-0.5"></i>
                                            <span>{t}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="pt-3 border-t border-indigo-800 italic text-xs text-indigo-200">
                                    "{analysis.prediction}"
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchCard;
