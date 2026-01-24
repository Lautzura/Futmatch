
import React, { useState } from 'react';

interface PollModalProps {
    onClose: () => void;
    onLaunch: (question: string, options: string[]) => void;
}

const PollModal: React.FC<PollModalProps> = ({ onClose, onLaunch }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);

    const addOption = () => {
        setOptions([...options, '']);
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleLaunch = () => {
        const validOptions = options.filter(o => o.trim() !== '');
        if (!question.trim() || validOptions.length < 2) {
            alert("Por favor escribe una pregunta y al menos 2 opciones.");
            return;
        }
        onLaunch(question, validOptions);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Icon Circle */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                        <i className="fas fa-poll-h text-2xl"></i>
                    </div>
                </div>

                <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter mb-8 text-center leading-none">
                    CREAR ENCUESTA
                </h2>

                <div className="space-y-6">
                    {/* Pregunta */}
                    <div>
                        <input 
                            type="text"
                            placeholder="¿Qué quieres preguntar?"
                            className="w-full px-5 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                    </div>

                    {/* Opciones */}
                    <div className="space-y-3">
                        {options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <span className="text-xs font-black text-slate-400 w-4">{idx + 1}.</span>
                                <input 
                                    type="text"
                                    placeholder="Opción"
                                    className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                                    value={opt}
                                    onChange={(e) => updateOption(idx, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Agregar Opción */}
                    <button 
                        onClick={addOption}
                        className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-tight hover:text-indigo-700 transition-colors pl-7"
                    >
                        <i className="fas fa-plus-circle text-sm"></i>
                        <span>Agregar opción</span>
                    </button>

                    {/* Botones */}
                    <div className="flex gap-4 pt-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all"
                        >
                            CANCELAR
                        </button>
                        <button 
                            onClick={handleLaunch}
                            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                        >
                            LANZAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PollModal;
