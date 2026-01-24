
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MatchCard from '../components/MatchCard';
import MiniProfileCard from '../components/MiniProfileCard';
import AnnouncementCard from '../components/AnnouncementCard';
import { Profile, UserType, SkillLevel, Announcement } from '../types';
import { useNavigate } from 'react-router-dom';

type MainTab = 'EQUIPOS' | 'JUGADORES' | 'URGENTE' | 'NOVEDADES';

const SwipeView = () => {
    const { availableProfiles, startChat, notifications, refreshCommunity, announcements, userProfile } = useApp();
    const navigate = useNavigate();
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<MainTab>('EQUIPOS');
    const [showFilters, setShowFilters] = useState(false);
    const [filterLevel, setFilterLevel] = useState<'ALL' | SkillLevel>('ALL');

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshCommunity();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const handleProfileClick = (profile: Profile) => {
        setSelectedProfile(profile);
    };

    const handleCloseModal = () => {
        setSelectedProfile(null);
    };

    const handleStartChat = () => {
        if (!selectedProfile) return;
        startChat(selectedProfile);
        setSelectedProfile(null);
        navigate('/matches');
    };

    const filteredProfiles = availableProfiles.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'EQUIPOS' ? p.type === UserType.TEAM : p.type === UserType.PLAYER;
        const matchesLevel = filterLevel === 'ALL' || p.skillLevel === filterLevel;
        return matchesSearch && matchesTab && matchesLevel;
    });

    // Mock data for News/Novedades
    const weeklyRanking = availableProfiles
        .sort((a, b) => (b.stats.wins || 0) - (a.stats.wins || 0))
        .slice(0, 3);

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            {/* Header */}
            <div className="px-6 pt-4 pb-2 bg-white border-b border-slate-200 shadow-sm z-10">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-black italic tracking-tighter text-slate-900">
                        FUT<span className="text-green-600">MATCH</span>
                    </h1>
                    <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-slate-100 rounded-full text-slate-500 flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform">
                            <i className="fas fa-bell text-xs"></i>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <button 
                            onClick={handleRefresh}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isRefreshing ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}
                        >
                            <i className={`fas fa-sync-alt text-xs ${isRefreshing ? 'fa-spin' : ''}`}></i>
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-3 shadow-inner overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('EQUIPOS')} className={`shrink-0 flex-1 py-2 px-4 text-[9px] font-black uppercase rounded-lg transition-all ${activeTab === 'EQUIPOS' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>EQUIPOS</button>
                    <button onClick={() => setActiveTab('JUGADORES')} className={`shrink-0 flex-1 py-2 px-4 text-[9px] font-black uppercase rounded-lg transition-all ${activeTab === 'JUGADORES' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>JUGADORES</button>
                    <button onClick={() => setActiveTab('URGENTE')} className={`shrink-0 flex-1 py-2 px-4 text-[9px] font-black uppercase rounded-lg transition-all ${activeTab === 'URGENTE' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400'}`}>URGENTE</button>
                    <button onClick={() => setActiveTab('NOVEDADES')} className={`shrink-0 flex-1 py-2 px-4 text-[9px] font-black uppercase rounded-lg transition-all ${activeTab === 'NOVEDADES' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>NOVEDADES</button>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar pb-24">
                
                {activeTab === 'NOVEDADES' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* MVP of the Week Card */}
                        <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden border-b-8 border-yellow-700">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl rounded-full -mr-10 -mt-10"></div>
                            <div className="relative z-10">
                                <span className="inline-block bg-yellow-900/20 px-3 py-1 rounded-full text-[9px] font-black text-yellow-900 uppercase tracking-widest mb-4">👑 MVP DE LA SEMANA</span>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 p-1 shrink-0">
                                        <img src="https://picsum.photos/200/200?random=44" className="w-full h-full object-cover rounded-xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase italic leading-none">Matías "El Rayo"</h3>
                                        <p className="text-[10px] text-yellow-100 font-bold mt-1 uppercase tracking-tighter">15 Votos de la comunidad • Palermo</p>
                                        <div className="mt-2 flex gap-1">
                                            {[1,2,3,4,5].map(i => <i key={i} className="fas fa-star text-[8px] text-white"></i>)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Team of the Week (TOTW) */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <i className="fas fa-award"></i> EQUIPO DE LA SEMANA
                            </h4>
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="min-w-[140px] bg-slate-900 rounded-2xl p-4 flex flex-col items-center border-2 border-yellow-500 shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-yellow-500/10 to-transparent pointer-events-none"></div>
                                        <div className="w-14 h-14 rounded-full border-2 border-yellow-500 mb-2 overflow-hidden">
                                            <img src={`https://picsum.photos/100/100?random=${i+20}`} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-[10px] font-black text-yellow-500 uppercase italic">CRACK {i}</span>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase">99 OVR</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mini Ranking */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">MINI RANKING EQUIPOS</h4>
                            <div className="space-y-3">
                                {weeklyRanking.length > 0 ? weeklyRanking.map((team, idx) => (
                                    <div key={team.id} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <span className={`text-lg font-black italic ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : 'text-orange-500'}`}>#{idx + 1}</span>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-800 uppercase italic">{team.name}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{team.location}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-green-600 block">{team.stats.wins}W</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase">Victorias</span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase italic">Calculando estadísticas...</p>
                                )}
                            </div>
                        </div>

                        {/* Publicidad / Evento */}
                        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                            <i className="fas fa-futbol absolute -right-4 -bottom-4 text-7xl text-white/10 rotate-12"></i>
                            <h4 className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">PRÓXIMO TORNEO</h4>
                            <h3 className="text-lg font-black uppercase italic leading-tight">COPA RELÁMPAGO<br/>NOCTURNA</h3>
                            <p className="text-xs text-indigo-100 mt-2 font-medium">Sábado 20:00 • Palermo Soho</p>
                            <button className="mt-4 bg-white text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-transform">Ver Info</button>
                        </div>
                    </div>
                )}

                {activeTab === 'URGENTE' && (
                    <div className="space-y-4">
                        {announcements.map(ann => <AnnouncementCard key={ann.id} announcement={ann} />)}
                    </div>
                )}

                {(activeTab === 'EQUIPOS' || activeTab === 'JUGADORES') && (
                    <div className="grid grid-cols-2 gap-3">
                        {filteredProfiles.map(profile => (
                            <MiniProfileCard 
                                key={profile.id} 
                                profile={profile} 
                                onClick={() => handleProfileClick(profile)} 
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Profile Modal */}
            {selectedProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={handleCloseModal}></div>
                    <div className="bg-slate-100 w-full max-w-md h-[85vh] rounded-2xl overflow-hidden shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-10">
                        <button onClick={handleCloseModal} className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center">
                            <i className="fas fa-times"></i>
                        </button>
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <MatchCard profile={selectedProfile} />
                        </div>
                        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
                            <button onClick={handleStartChat} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black uppercase italic shadow-lg flex items-center justify-center gap-2">
                                <i className="fas fa-comments"></i> CONTACTAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SwipeView;
