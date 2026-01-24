
import React from 'react';
import { Announcement } from '../types';
import { useApp } from '../context/AppContext';

interface AnnouncementCardProps {
    announcement: Announcement;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement }) => {
    const { addNotification } = useApp();

    const getIcon = () => {
        switch (announcement.type) {
            case 'FALTA_UNO': return 'fa-user-plus';
            case 'BUSCO_RIVAL': return 'fa-shield-virus';
            case 'BUSCO_EQUIPO': return 'fa-walking';
            default: return 'fa-bullhorn';
        }
    };

    const getTypeLabel = () => {
        switch (announcement.type) {
            case 'FALTA_UNO': return 'Falta Uno';
            case 'BUSCO_RIVAL': return 'Busco Rival';
            case 'BUSCO_EQUIPO': return 'Busco Equipo';
            default: return 'Anuncio';
        }
    };

    const getTypeColor = () => {
        switch (announcement.type) {
            case 'FALTA_UNO': return 'bg-red-500 text-white';
            case 'BUSCO_RIVAL': return 'bg-indigo-600 text-white';
            case 'BUSCO_EQUIPO': return 'bg-green-600 text-white';
            default: return 'bg-slate-800 text-white';
        }
    };

    const handleApply = () => {
        addNotification({
            type: 'MESSAGE',
            title: 'Interés Enviado',
            message: `Le avisamos a ${announcement.authorName} que estás interesado.`
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-right-4">
            <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${getTypeColor()}`}>
                            <i className={`fas ${getIcon()} text-lg`}></i>
                        </div>
                        <div>
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{announcement.authorName}</span>
                            <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${getTypeColor()}`}>
                                {getTypeLabel()}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block text-[10px] font-black text-red-500 uppercase italic">
                             <i className="fas fa-clock mr-1"></i> {announcement.startTime}
                        </span>
                    </div>
                </div>

                <p className="text-slate-800 text-sm font-bold leading-tight mb-4">
                    "{announcement.text}"
                </p>

                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <i className="fas fa-map-marker-alt text-[10px] text-green-500"></i>
                        <span className="text-[10px] font-bold uppercase tracking-wide">{announcement.location}</span>
                    </div>
                    <button 
                        onClick={handleApply}
                        className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-widest shadow-md active:scale-95 transition-transform"
                    >
                        ME INTERESA
                    </button>
                </div>
            </div>
            
            {/* Urgency Bar */}
            <div className="h-1 w-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-red-500 animate-[shimmer_2s_infinite_linear]" style={{ width: '40%' }}></div>
            </div>
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}</style>
        </div>
    );
};

export default AnnouncementCard;
