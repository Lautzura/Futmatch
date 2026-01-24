
import React, { useState } from 'react';

interface VaquitaModalProps {
    onClose: () => void;
    onCreate: (data: { description: string, total: number, players: number }) => void;
}

const VaquitaModal: React.FC<VaquitaModalProps> = ({ onClose, onCreate }) => {
    const [concept, setConcept] = useState('Alquiler Cancha');
    const [amount, setAmount] = useState('5000');
    const [players, setPlayers] = useState('10');

    const handleSubmit = () => {
        const total = parseInt(amount);
        const pCount = parseInt(players);
        if (isNaN(total) || isNaN(pCount) || !concept.trim()) {
            alert("Por favor completa los campos correctamente.");
            return;
        }
        onCreate({ description: concept, total, players: pCount });
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Icon Circle */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                        <i className="fas fa-wallet text-2xl"></i>
                    </div>
                </div>

                <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter mb-8 text-center leading-none">
                    NUEVA VAQUITA
                </h2>

                <div className="space-y-6">
                    {/* Concepto */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">CONCEPTO</label>
                        <input 
                            type="text"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={concept}
                            onChange={(e) => setConcept(e.target.value)}
                        />
                    </div>

                    {/* Monto y Jugadores */}
                    <div className="flex gap-4">
                        <div className="flex-[2]">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">MONTO TOTAL ($)</label>
                            <input 
                                type="number"
                                className="w-full px-5 py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl text-sm font-black text-slate-800 outline-none"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">JUGADORES</label>
                            <input 
                                type="number"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-800 outline-none text-center"
                                value={players}
                                onChange={(e) => setPlayers(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-4 pt-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-sm"
                        >
                            CANCELAR
                        </button>
                        <button 
                            onClick={handleSubmit}
                            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all"
                        >
                            CREAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VaquitaModal;
