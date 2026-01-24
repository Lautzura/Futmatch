
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const LoginPage = () => {
    const { loginWithGoogle, loginAsGuest, registerWithEmail, loginWithEmail, isLoading } = useApp();
    const currentDomain = window.location.hostname;
    
    const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [activeTab, setActiveTab] = useState<'EMAIL' | 'SOCIAL'>('EMAIL');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showDomainHelp, setShowDomainHelp] = useState(false);

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        
        if (authMode === 'LOGIN') {
            loginWithEmail(email, password);
        } else {
            registerWithEmail(email, password);
        }
    };

    return (
        <div className="h-screen w-full bg-slate-900 relative flex flex-col items-center justify-center p-6 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-green-600/20 blur-3xl rounded-full transform -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-full h-1/2 bg-indigo-600/20 blur-3xl rounded-full transform translate-y-1/2"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

            {/* HELP BUTTON (Top Right) */}
            <button 
                onClick={() => setShowDomainHelp(true)}
                className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-md border border-white/20 hover:bg-white/20 shadow-lg active:scale-90 transition-all"
                title="Ayuda con Dominio"
            >
                <i className="fas fa-question text-lg"></i>
            </button>

            {/* DOMAIN HELP MODAL */}
            {showDomainHelp && (
                <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
                        <button 
                            onClick={() => setShowDomainHelp(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i className="fas fa-shield-alt text-xl"></i>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase italic leading-none">Configuración Firebase</h3>
                            <p className="text-sm text-slate-500 mt-2 font-medium">
                                Para que Google funcione, debes autorizar este dominio en tu consola.
                            </p>
                        </div>

                        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-center">
                            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-2">
                                Copia esto:
                            </label>
                            <input 
                                type="text" 
                                readOnly
                                value={currentDomain}
                                className="w-full bg-white border border-green-500 text-green-700 font-mono text-lg font-bold p-3 rounded-lg focus:outline-none text-center select-all"
                                onClick={(e) => e.currentTarget.select()}
                            />
                            <p className="text-[10px] text-slate-400 mt-2 italic">
                                (Mantén presionado para copiar)
                            </p>
                        </div>

                        <div className="mt-6 text-left space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p><strong>1.</strong> Ve a Firebase Console &gt; Authentication.</p>
                            <p><strong>2.</strong> Pestaña "Configuración" (Settings).</p>
                            <p><strong>3.</strong> "Dominios autorizados" &gt; Agregar dominio.</p>
                            <p><strong>4.</strong> Pega el texto de arriba.</p>
                        </div>

                        <button 
                            onClick={() => setShowDomainHelp(false)}
                            className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="relative z-10 w-full max-w-sm flex flex-col items-center animate-in fade-in zoom-in duration-500">
                
                {/* Logo Area */}
                <div className="mb-6 text-center">
                    <div className="w-20 h-20 bg-gradient-to-tr from-green-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-3 transform rotate-3">
                        <i className="fas fa-futbol text-4xl text-white drop-shadow-md"></i>
                    </div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
                        Fut<span className="text-green-400">Match</span>
                    </h1>
                </div>

                {/* Tabs */}
                <div className="w-full bg-slate-800 p-1 rounded-xl flex mb-6">
                    <button 
                        onClick={() => setActiveTab('EMAIL')}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${activeTab === 'EMAIL' ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <i className="fas fa-envelope mr-2"></i> Email
                    </button>
                    <button 
                        onClick={() => setActiveTab('SOCIAL')}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${activeTab === 'SOCIAL' ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <i className="fab fa-google mr-2"></i> Social
                    </button>
                </div>

                {/* Email Auth Form */}
                {activeTab === 'EMAIL' && (
                    <div className="w-full bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Correo Electrónico</label>
                                <input 
                                    type="email" 
                                    required
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-green-500 transition-colors"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Contraseña</label>
                                <input 
                                    type="password" 
                                    required
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-green-500 transition-colors"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl font-bold uppercase shadow-lg active:scale-95 transition-all mt-2"
                            >
                                {isLoading ? <i className="fas fa-spinner fa-spin"></i> : (authMode === 'LOGIN' ? 'Entrar' : 'Registrarse')}
                            </button>
                        </form>

                        <div className="mt-4 text-center">
                            <button 
                                onClick={() => setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                                className="text-xs text-slate-400 hover:text-white underline"
                            >
                                {authMode === 'LOGIN' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Social Auth Buttons */}
                {activeTab === 'SOCIAL' && (
                    <div className="w-full space-y-4">
                        <button 
                            onClick={loginWithGoogle}
                            disabled={isLoading}
                            className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-70"
                        >
                            {isLoading ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                            )}
                            <span>Continuar con Google</span>
                        </button>
                    </div>
                )}

                {/* EMERGENCY BYPASS BUTTON (ALWAYS VISIBLE) */}
                <div className="mt-8 pt-4 border-t border-slate-800 w-full">
                     <button 
                        onClick={loginAsGuest}
                        disabled={isLoading}
                        className="w-full py-3 bg-slate-800/50 text-slate-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 hover:text-white transition-all text-xs uppercase"
                    >
                        <i className="fas fa-user-secret"></i>
                        <span>Saltar Login (Modo Offline)</span>
                    </button>
                    <p className="text-[9px] text-slate-600 text-center mt-2">
                        Úsalo si tienes problemas con Firebase. Los datos no se guardarán en la nube.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
