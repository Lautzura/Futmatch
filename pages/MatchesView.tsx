
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Profile, ChatMessage, UserType } from '../types';
import ReviewModal from '../components/ReviewModal';
import ReportModal from '../components/ReportModal';
import VaquitaModal from '../components/VaquitaModal';
import ChallengeModal from '../components/ChallengeModal';
import PollModal from '../components/PollModal';
import { db } from '../firebaseConfig';
import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    serverTimestamp,
    doc,
    updateDoc,
    getDoc,
    arrayUnion
} from 'firebase/firestore';

const MatchesView = () => {
    const { activeChats, userProfile, addNotification } = useApp();
    const [selectedChat, setSelectedChat] = useState<{ id: string, name: string, imageUrl?: string, isGroup?: boolean } | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMsg, setInputMsg] = useState('');
    const [activeTab, setActiveTab] = useState<'RIVALES' | 'EQUIPOS'>('RIVALES');
    const [showTools, setShowTools] = useState(false);
    
    // Composer & Modals States
    const [composerMode, setComposerMode] = useState<'NONE' | 'POLL' | 'VAQUITA' | 'CHALLENGE'>('NONE');
    const [showReview, setShowReview] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const getChatId = (otherId: string, isGroup: boolean = false) => {
        if (!userProfile.id || !otherId) return null;
        if (isGroup) return `group_${otherId}`; 
        return [userProfile.id, otherId].sort().join('_');
    };

    useEffect(() => {
        if (!selectedChat || !userProfile.id || !db) {
            setMessages([]);
            return;
        }
        const chatId = getChatId(selectedChat.id, selectedChat.isGroup);
        if (!chatId) return;

        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ChatMessage[];
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [selectedChat, userProfile.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedChat]);

    const sendMessage = async (data: Partial<ChatMessage>) => {
        if (!selectedChat || !db) return;
        
        setShowTools(false);
        setComposerMode('NONE');

        const chatId = getChatId(selectedChat.id, selectedChat.isGroup);
        const senderName = userProfile.type === UserType.PLAYER ? (userProfile.playerName || userProfile.name) : (userProfile.teamName || userProfile.name);

        try {
            await addDoc(collection(db, "chats", chatId!, "messages"), {
                ...data,
                senderId: userProfile.id,
                senderName,
                timestamp: serverTimestamp()
            });
        } catch (e) {
            console.error("Error al enviar:", e);
        }
    };

    const handleVoteMVP = () => {
        // En una app real esto abriría una lista de jugadores del equipo.
        // Aquí simulamos el voto.
        const msgText = `📢 He votado a un compañero como MVP del partido. ¡Revisen sus perfiles! 🏆`;
        sendMessage({ type: 'system', text: msgText });
        addNotification({ 
            type: 'SYSTEM', 
            title: 'Voto Registrado', 
            message: 'Tu voto para el MVP del equipo ha sido contabilizado.' 
        });
        setShowTools(false);
    };

    const renderMessageContent = (msg: ChatMessage) => {
        const isMe = msg.senderId === userProfile.id;

        if (msg.type === 'system') {
            return (
                <div className="w-full flex justify-center my-2">
                    <span className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 px-4 py-1 rounded-full border border-slate-200">{msg.text}</span>
                </div>
            );
        }

        if (msg.type === 'poll' && msg.pollData) {
            const totalVotes = msg.pollData.options.reduce((acc, opt) => acc + opt.votes.length, 0);
            return (
                <div className="bg-white rounded-3xl w-full max-w-[280px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95">
                    <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-chart-bar text-sm"></i>
                            <span className="text-[10px] font-black uppercase tracking-widest">ENCUESTA</span>
                        </div>
                        <span className="text-sm font-black italic tracking-tight">{totalVotes}</span>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                            <span className="text-[10px] font-black text-slate-800 uppercase italic tracking-tight leading-none">{msg.pollData.question}</span>
                        </div>
                        <div className="space-y-2">
                            {msg.pollData.options.map((opt, idx) => {
                                const percentage = totalVotes > 0 ? (opt.votes.length / totalVotes) * 100 : 0;
                                return (
                                    <div key={idx} className="w-full relative p-3 rounded-2xl border border-slate-100 overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 bg-indigo-50 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                        <div className="flex justify-between items-center relative z-10">
                                            <span className="text-[11px] font-black uppercase italic text-slate-600">{opt.text}</span>
                                            <span className="text-[10px] font-black text-slate-400">{opt.votes.length}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm font-medium ${isMe ? 'bg-indigo-600 text-white rounded-br-none shadow-md' : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-none'}`}>
                {msg.text}
            </div>
        );
    };

    const renderToolItem = (icon: string, label: string, circleColor: string, iconColor: string, onClick: () => void) => (
        <button onClick={onClick} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${circleColor} ${iconColor}`}>
                <i className={`fas ${icon} text-xl`}></i>
            </div>
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight text-center leading-tight">{label}</span>
        </button>
    );

    if (selectedChat) {
        return (
            <div className="flex flex-col h-full bg-slate-50 relative">
                <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm z-10">
                    <button onClick={() => setSelectedChat(null)} className="text-slate-500 p-2"><i className="fas fa-arrow-left"></i></button>
                    <div className="w-10 h-10 rounded-full bg-indigo-100 overflow-hidden border border-indigo-200 flex items-center justify-center">
                        {selectedChat?.imageUrl ? <img src={selectedChat.imageUrl} className="w-full h-full object-cover" /> : <i className={`fas ${selectedChat?.isGroup ? 'fa-shield-alt' : 'fa-user'} text-indigo-400`}></i>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-slate-800 uppercase italic text-sm leading-none truncate">{selectedChat?.name}</h2>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase">{selectedChat?.isGroup ? 'Vestuario Equipo' : 'Cancha Desafío'}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 pb-32 no-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.senderId === userProfile.id ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                            {msg.senderId !== userProfile.id && msg.type !== 'system' && <span className="text-[9px] font-black text-slate-400 uppercase mb-1 ml-2 tracking-widest">{msg.senderName}</span>}
                            {renderMessageContent(msg)}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="absolute bottom-0 w-full bg-white border-t border-slate-200 pb-safe z-30">
                    {showTools && (
                        <div className="absolute bottom-[100%] left-4 right-4 mb-4 bg-white rounded-[2.5rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.25)] animate-in zoom-in-90 origin-bottom">
                            <div className="grid grid-cols-3 gap-y-8 gap-x-4">
                                {renderToolItem('fa-calendar-alt', 'DESAFIAR', 'bg-orange-50', 'text-orange-400', () => setComposerMode('CHALLENGE'))}
                                {selectedChat?.isGroup && renderToolItem('fa-trophy', 'VOTAR MVP', 'bg-yellow-50', 'text-yellow-500', handleVoteMVP)}
                                {renderToolItem('fa-chart-bar', 'ENCUESTA', 'bg-indigo-50', 'text-indigo-400', () => setComposerMode('POLL'))}
                                {renderToolItem('fa-wallet', 'VAQUITA', 'bg-blue-50', 'text-blue-400', () => setComposerMode('VAQUITA'))}
                                {!selectedChat?.isGroup && renderToolItem('fa-star', 'CALIFICAR', 'bg-yellow-50', 'text-yellow-400', () => setShowReview(true))}
                                {!selectedChat?.isGroup && renderToolItem('fa-exclamation-triangle', 'REPORTAR', 'bg-red-50', 'text-red-500', () => setShowReportModal(true))}
                            </div>
                        </div>
                    )}
                    <form className="p-3 flex gap-2 items-center" onSubmit={(e) => { e.preventDefault(); if(inputMsg.trim()) sendMessage({ type: 'text', text: inputMsg }); setInputMsg(''); }}>
                        <button type="button" onClick={() => setShowTools(!showTools)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showTools ? 'bg-slate-900 text-white rotate-45 shadow-lg' : 'bg-slate-100 text-slate-500'}`}><i className="fas fa-plus"></i></button>
                        <input className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Escribe algo..." value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} />
                        <button type="submit" className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"><i className="fas fa-paper-plane text-sm"></i></button>
                    </form>
                </div>

                {showReview && selectedChat && <ReviewModal targetId={selectedChat.id} targetName={selectedChat.name} onClose={() => setShowReview(false)} />}
                {showReportModal && selectedChat && <ReportModal targetName={selectedChat.name} onClose={() => setShowReportModal(false)} onSubmit={() => setShowReportModal(false)} />}
                {composerMode === 'VAQUITA' && <VaquitaModal onClose={() => setComposerMode('NONE')} onCreate={(data) => sendMessage({ type: 'vaquita', vaquitaData: { total: data.total, perHead: Math.round(data.total / data.players), description: data.description, paid: [] } })} />}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-6 pb-2 border-b border-slate-200 bg-white shadow-sm">
                <h1 className="text-2xl font-black italic text-slate-900 uppercase tracking-tight">Vestuario</h1>
                <div className="flex bg-slate-100 p-1 rounded-xl mt-4">
                    <button onClick={() => setActiveTab('RIVALES')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeTab === 'RIVALES' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Rivales</button>
                    <button onClick={() => setActiveTab('EQUIPOS')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeTab === 'EQUIPOS' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Equipos</button>
                </div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
                {activeTab === 'RIVALES' ? (
                    <div className="space-y-3">
                        {activeChats.map((match) => (
                            <div key={match.id} onClick={() => setSelectedChat({ id: match.id, name: match.name, imageUrl: match.imageUrl, isGroup: false })} className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-slate-100 active:bg-slate-50 transition-colors cursor-pointer">
                                <img src={match.imageUrl} className="w-12 h-12 rounded-lg bg-slate-200 object-cover mr-4" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 truncate text-sm uppercase tracking-wide italic">{match.name}</h3>
                                    <p className="text-xs text-slate-500 truncate font-medium">Chat de organización...</p>
                                </div>
                                <i className="fas fa-chevron-right text-slate-200"></i>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {(userProfile.myTeams || []).map(team => (
                            <div key={team.id} onClick={() => setSelectedChat({ id: team.id, name: team.name, isGroup: true })} className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-slate-100 cursor-pointer">
                                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 mr-4"><i className="fas fa-shield-alt text-xl"></i></div>
                                <div className="flex-1">
                                    <h3 className="font-black text-slate-800 text-sm uppercase italic mb-1">{team.name}</h3>
                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Vestuario del equipo</span>
                                </div>
                                <i className="fas fa-chevron-right text-slate-200"></i>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchesView;
