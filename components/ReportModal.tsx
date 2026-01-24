
import React, { useState } from 'react';

interface ReportModalProps {
    targetName: string;
    onClose: () => void;
    onSubmit: (reason: string, details: string) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ targetName, onClose, onSubmit }) => {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [details, setDetails] = useState('');

    const reasons = [
        "SPAM O PUBLICIDAD",
        "LENGUAJE OFENSIVO",
        "PERFIL FALSO",
        "COMPORTAMIENTO PELIGROSO",
        "OTRO"
    ];

    const handleSubmit = () => {
        if (!selectedReason) {
            alert("Por favor selecciona un motivo.");
            return;
        }
        onSubmit(selectedReason, details);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-red-50 p-6 flex items-center gap-4 border-b border-red-100/50">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                        <i className="fas fa-exclamation-triangle text-xl"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-black italic text-slate-900 leading-none uppercase tracking-tight">REPORTAR USUARIO</h2>
                        <p className="text-red-500 text-xs font-bold mt-1">Denunciar a {targetName}</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Motivos */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">MOTIVO</label>
                        <div className="space-y-2">
                            {reasons.map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => setSelectedReason(reason)}
                                    className={`w-full p-4 rounded-xl text-xs font-bold text-slate-600 uppercase transition-all text-left border ${
                                        selectedReason === reason 
                                        ? 'bg-red-50 border-red-200 text-red-600 shadow-sm' 
                                        : 'bg-slate-50 border-transparent hover:bg-slate-100'
                                    }`}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Detalles */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">DETALLES (OPCIONAL)</label>
                        <textarea
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:border-red-200 h-28 resize-none transition-colors"
                            placeholder="Describe el problema..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-between pt-2">
                        <button 
                            onClick={onClose}
                            className="text-sm font-black text-slate-500 uppercase px-4 py-2 hover:text-slate-700 transition-colors"
                        >
                            CANCELAR
                        </button>
                        <button 
                            onClick={handleSubmit}
                            className="bg-[#fca5a5] hover:bg-red-400 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-xs shadow-lg shadow-red-200 transition-all active:scale-95"
                        >
                            ENVIAR REPORTE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
