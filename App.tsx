
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './Layout';
import SwipeView from './pages/SwipeView';
import MatchesView from './pages/MatchesView';
import FieldsView from './pages/FieldsView';
import ProfilePage from './pages/Profile';
import CreateEvent from './pages/CreateEvent';
import CreateAnnouncement from './pages/CreateAnnouncement';
import TacticsView from './pages/TacticsView';
import LoginPage from './pages/LoginPage';
import Onboarding from './pages/Onboarding';
import ComplexDashboard from './pages/ComplexDashboard';
import ComplexAgenda from './pages/ComplexAgenda';
import NotificationToast from './components/NotificationToast';
import { isFirebaseConfigured } from './firebaseConfig';
import { UserType } from './types';
import { useNavigate } from 'react-router-dom';

const ComplexTournaments = () => {
    const navigate = useNavigate();
    const { createdEvents, userProfile } = useApp();
    
    // Filtrar torneos propios
    const myTournaments = createdEvents.filter(e => e.organizerId === userProfile.id && e.type === 'TOURNAMENT');

    return (
        <div className="bg-slate-950 h-full flex flex-col overflow-y-auto pb-24 no-scrollbar">
            <div className="p-8 pb-4 text-center">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 shadow-2xl shadow-emerald-500/10 mx-auto mb-4">
                    <i className="fas fa-trophy text-3xl"></i>
                </div>
                <h2 className="text-xl font-black uppercase italic text-white mb-2">Mis Torneos</h2>
                <button 
                    onClick={() => navigate('/create')}
                    className="w-full bg-emerald-500 text-slate-950 px-8 py-3 rounded-2xl font-black uppercase italic text-[10px] shadow-lg active:scale-95 transition-transform"
                >
                    + CREAR NUEVO TORNEO
                </button>
            </div>

            <div className="px-6 space-y-4">
                {myTournaments.length > 0 ? (
                    myTournaments.map((t) => (
                        <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl -mr-12 -mt-12"></div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <h3 className="text-white font-black uppercase italic text-sm">{t.title}</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                                        {t.date} • {t.time}
                                    </p>
                                    <div className="mt-3 flex gap-2">
                                        <span className="bg-slate-800 text-[8px] font-black text-slate-400 px-2 py-0.5 rounded uppercase tracking-widest">{t.format}</span>
                                        <span className="bg-emerald-500/10 text-[8px] font-black text-emerald-400 px-2 py-0.5 rounded uppercase tracking-widest">Abierto</span>
                                    </div>
                                </div>
                                <button className="w-8 h-8 rounded-lg bg-slate-800 text-slate-500 flex items-center justify-center">
                                    <i className="fas fa-cog"></i>
                                </button>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Inscritos: 1/{t.maxTeams || 8}</span>
                                <button className="text-[9px] font-black text-emerald-500 uppercase italic">Ver Fixture</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 opacity-30">
                        <p className="text-[10px] font-black uppercase italic text-slate-500">No tienes torneos activos</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const AppRoutes = () => {
    const { user, isLoading, needsOnboarding, userProfile } = useApp();

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-950">
                <i className="fas fa-futbol fa-spin text-4xl text-emerald-500"></i>
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    if (user && needsOnboarding) {
        return <Onboarding />;
    }

    const isOwner = userProfile.type === UserType.OWNER;

    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={isOwner ? <ComplexDashboard /> : <SwipeView />} />
                
                {/* Rutas Jugador */}
                {!isOwner && (
                    <>
                        <Route path="matches" element={<MatchesView />} />
                        <Route path="fields" element={<FieldsView />} />
                        <Route path="tactics" element={<TacticsView />} />
                    </>
                )}

                {/* Rutas Dueño */}
                {isOwner && (
                    <>
                        <Route path="agenda" element={<ComplexAgenda />} />
                        <Route path="my-tournaments" element={<ComplexTournaments />} />
                    </>
                )}

                <Route path="profile" element={<ProfilePage />} />
                <Route path="create" element={<CreateEvent />} />
                <Route path="create-announcement" element={<CreateAnnouncement />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
};

const App = () => {
    return (
        <AppProvider>
            <NotificationToast />
            {!isFirebaseConfigured && (
                <div className="fixed top-0 left-0 w-full bg-yellow-400 text-slate-900 text-[10px] font-bold text-center py-1 z-[100] uppercase tracking-widest shadow-md">
                    <i className="fas fa-info-circle mr-1"></i> Modo Demo: Datos Locales
                </div>
            )}
            <HashRouter>
                <AppRoutes />
            </HashRouter>
        </AppProvider>
    );
};

export default App;
