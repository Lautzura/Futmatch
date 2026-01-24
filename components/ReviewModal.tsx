
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface ReviewModalProps {
    targetId: string;
    targetName: string;
    onClose: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ targetId, targetName, onClose }) => {
    const { addNotification } = useApp();
    const [rating, setRating] = useState(5);
    const [puntuality, setPuntuality] = useState(true);
    const [fairPlay, setFairPlay] = useState(true);
    const [levelVeracity, setLevelVeracity] = useState(true);
    const [isReporting, setIsReporting] = useState(false);
    const [reportReason, setReportReason] = useState('');

    const handleSubmit = () => {
        if (isReporting && !reportReason.trim()) {
            alert("Por favor explica el motivo del reporte.");
            return;
        }

        // Mock submission
        console.log("Submit review for", targetId, { rating, puntuality, fairPlay, levelVeracity, isReporting, reportReason });
        
        addNotification({
            type: 'SYSTEM',
            title: isReporting ? 'Denuncia Enviada' : 'Calificación Exitosa',
            message: isReporting ? 'Analizaremos el comportamiento del rival.' : `¡Gracias por calificar a ${targetName}!`
        });
        
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-2 ${isReporting ? 'bg-red-500' : 'bg-green-500'}`}></div>
                
                <h3 className="text-xl font-black text-slate-800 uppercase italic text-center mb-1">
                    {isReporting ? 'Denunciar Rival' : 'Calificar Rival'}
                </h3>
                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest mb-6">
                    {targetName}
                </p>

                {!isReporting ? (
                    <div className="space-y-6">
                        {/* Star Rating */}
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => setRating(star)} className="text-2xl transition-transform active:scale-125">
                                    <i className={`fas fa-star ${star <= rating ? 'text-yellow-400' : 'text-slate-200'}`}></i>
                                </button>
                            ))}
                        </div>

                        {/* Attribute Toggles */}
                        <div className="space-y-3">
                            <button onClick={() => setPuntuality(!puntuality)} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${puntuality ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                <div className="flex items-center gap-3">
                                    <i className="fas fa-clock"></i>
                                    <span className="text-[10px] font-black uppercase tracking-widest">¿Fueron Puntuales?</span>
                                </div>
                                <i className={`fas ${puntuality ? 'fa-check-circle' : 'fa-circle'}`}></i>
                            </button>
                            
                            <button onClick={() => setFairPlay(!fairPlay)} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${fairPlay ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                <div className="flex items-center gap-3">
                                    <i className="fas fa-handshake"></i>
                                    <span className="text-[10px] font-black uppercase tracking-widest">¿Jugaron Limpio?</span>
                                </div>
                                <i className={`fas ${fairPlay ? 'fa-check-circle' : 'fa-circle'}`}></i>
                            </button>

                            <button onClick={() => setLevelVeracity(!levelVeracity)} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${levelVeracity ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                <div className="flex items-center gap-3">
                                    <i className="fas fa-chart-line"></i>
                                    <span className="text-[10px] font-black uppercase tracking-widest">¿Nivel Acorde?</span>
                                </div>
                                <i className={`fas ${levelVeracity ? 'fa-check-circle' : 'fa-circle'}`}></i>
                            </button>
                        </div>

                        <button onClick={handleSubmit} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase italic tracking-widest shadow-xl active:scale-95 transition-all">
                            ENVIAR CALIFICACIÓN
                        </button>

                        <button onClick={() => setIsReporting(true)} className="w-full py-2 text-red-500 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
                            <i className="fas fa-exclamation-triangle"></i> REPORTE DE CONDUCTA GRAVE
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                            <p className="text-[10px] text-red-700 font-bold leading-relaxed">
                                Usa el reporte solo para casos de agresión física, insultos graves o estafas. Un mal nivel de juego no es motivo de reporte grave.
                            </p>
                        </div>
                        <textarea 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium outline-none focus:border-red-500"
                            rows={4}
                            placeholder="Describe lo sucedido..."
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                        />
                        <button onClick={handleSubmit} className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black uppercase italic tracking-widest shadow-xl active:scale-95 transition-all">
                            CONFIRMAR DENUNCIA
                        </button>
                        <button onClick={() => setIsReporting(false)} className="w-full py-2 text-slate-400 font-black text-[9px] uppercase">VOLVER</button>
                    </div>
                )}
                
                <button onClick={onClose} className="w-full py-2 text-slate-300 font-black text-[10px] uppercase mt-2">Cerrar</button>
            </div>
        </div>
    );
};

export default ReviewModal;
