
import React, { useState } from 'react';
import { getTacticalAdvice, getTrainingDrill, TacticalAdvice, TrainingDrill } from '../services/geminiService';

const TacticsView = () => {
    const [mode, setMode] = useState<'TACTIC' | 'TRAINING'>('TACTIC');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Results
    const [tactic, setTactic] = useState<TacticalAdvice | null>(null);
    const [drill, setDrill] = useState<TrainingDrill | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        
        setLoading(true);
        setTactic(null);
        setDrill(null);

        if (mode === 'TACTIC') {
            const result = await getTacticalAdvice(query);
            setTactic(result);
        } else {
            const result = await getTrainingDrill(query);
            setDrill(result);
        }
        setLoading(false);
    };

    // Helper to position dots based on formation string (Simplified logic)
    const renderFormation = (fmt: string) => {
        // Defaults to 2-1-2 if unknown
        let positions = [
            { top: '85%', left: '50%' }, // GK
            { top: '65%', left: '30%' }, // Def L
            { top: '65%', left: '70%' }, // Def R
            { top: '40%', left: '50%' }, // Mid
            { top: '20%', left: '50%' }, // Fwd
        ];
        
        if (fmt.includes("1-2-1")) { // Diamond
            positions = [
                { top: '90%', left: '50%' }, // GK
                { top: '70%', left: '50%' }, // Def
                { top: '45%', left: '20%' }, // Mid L
                { top: '45%', left: '80%' }, // Mid R
                { top: '20%', left: '50%' }, // Fwd
            ];
        } else if (fmt.includes("2-2")) { // Square
            positions = [
                { top: '90%', left: '50%' }, // GK
                { top: '65%', left: '30%' }, // Def L
                { top: '65%', left: '70%' }, // Def R
                { top: '25%', left: '30%' }, // Fwd L
                { top: '25%', left: '70%' }, // Fwd R
            ];
        } else if (fmt.includes("3-1")) { // Pyramid
             positions = [
                { top: '90%', left: '50%' }, // GK
                { top: '70%', left: '20%' }, // Def L
                { top: '70%', left: '50%' }, // Def C
                { top: '70%', left: '80%' }, // Def R
                { top: '25%', left: '50%' }, // Fwd
            ];
        } else if (fmt.includes("1-3")) { // Reverse Pyramid
             positions = [
                { top: '90%', left: '50%' }, // GK
                { top: '70%', left: '50%' }, // Def
                { top: '30%', left: '20%' }, // Fwd L
                { top: '30%', left: '50%' }, // Fwd C
                { top: '30%', left: '80%' }, // Fwd R
            ];
        }

        return positions.map((pos, i) => (
            <div 
                key={i}
                className="absolute w-8 h-8 bg-slate-900 border-2 border-white rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg"
                style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
            >
                {i === 0 ? 'GK' : i}
            </div>
        ));
    };

    const renderDrillElements = (elements: TrainingDrill['elements']) => {
        return elements.map((el, idx) => {
            let className = '';
            let content = null;

            if (el.type === 'player') {
                className = "w-8 h-8 bg-indigo-600 border-2 border-white rounded-full text-white";
                content = el.label || 'P';
            } else if (el.type === 'cone') {
                className = "w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[16px] border-b-orange-500 drop-shadow-md";
            } else if (el.type === 'ball') {
                className = "w-4 h-4 bg-white border border-slate-900 rounded-full shadow-sm";
            }

            return (
                <div 
                    key={idx}
                    className={`absolute flex items-center justify-center text-[10px] font-bold ${className}`}
                    style={{ top: `${el.y}%`, left: `${el.x}%`, transform: 'translate(-50%, -50%)' }}
                >
                    {content}
                </div>
            );
        });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="p-6 pb-4 bg-white border-b border-slate-200">
                <h1 className="text-2xl font-black italic text-slate-900 uppercase tracking-tight">
                    <span className="text-indigo-600">DT</span> VIRTUAL
                </h1>
                <p className="text-sm text-slate-500 font-medium">Pregunta, analiza y entrena</p>
                
                {/* Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-lg mt-3">
                    <button 
                        onClick={() => setMode('TACTIC')}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${mode === 'TACTIC' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
                    >
                        Partido
                    </button>
                    <button 
                        onClick={() => setMode('TRAINING')}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${mode === 'TRAINING' ? 'bg-white shadow text-green-600' : 'text-slate-400'}`}
                    >
                        Entrenamiento
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24">
                {/* Chat / Input Section */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
                    <form onSubmit={handleSubmit}>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                            {mode === 'TACTIC' ? '¿Cuál es tu problema táctico?' : '¿Qué quieres entrenar hoy?'}
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={mode === 'TACTIC' ? "Ej: El rival es muy rápido..." : "Ej: Mejorar pases cortos..."}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                            />
                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`${mode === 'TACTIC' ? 'bg-indigo-600' : 'bg-green-600'} text-white px-4 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-colors`}
                            >
                                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                            </button>
                        </div>
                    </form>
                </div>

                {(tactic || drill) && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* The Field */}
                        <div className="w-full aspect-[2/3] bg-green-500 rounded-xl shadow-inner border-4 border-green-700 relative overflow-hidden mb-6">
                            {/* Grass Stripes */}
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_40px]"></div>
                            
                            {/* Field Lines */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full"></div>
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30"></div>
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-b-2 border-x-2 border-white/30"></div>
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-t-2 border-x-2 border-white/30"></div>

                            {/* Render Elements */}
                            {mode === 'TACTIC' && tactic ? renderFormation(tactic.formation) : null}
                            {mode === 'TRAINING' && drill ? renderDrillElements(drill.elements) : null}
                        </div>

                        {/* Advice/Drill Card */}
                        <div className={`bg-white rounded-xl shadow-lg border-l-4 ${mode === 'TACTIC' ? 'border-indigo-500' : 'border-green-500'} overflow-hidden`}>
                            <div className={`p-4 ${mode === 'TACTIC' ? 'bg-indigo-50 border-indigo-100' : 'bg-green-50 border-green-100'} border-b flex justify-between items-center`}>
                                <h2 className={`font-bold uppercase ${mode === 'TACTIC' ? 'text-indigo-900' : 'text-green-900'}`}>
                                    {mode === 'TACTIC' ? `Formación: ${tactic?.formation}` : `Ejercicio: ${drill?.title}`}
                                </h2>
                                <i className={`fas ${mode === 'TACTIC' ? 'fa-chess-knight' : 'fa-stopwatch'} ${mode === 'TACTIC' ? 'text-indigo-400' : 'text-green-400'}`}></i>
                            </div>
                            
                            <div className="p-4">
                                {mode === 'TRAINING' && drill && (
                                     <div className="mb-4">
                                        <div className="inline-block bg-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-500 uppercase mb-2">
                                            <i className="fas fa-clock mr-1"></i> {drill.duration}
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Materiales:</p>
                                        <p className="text-sm text-slate-700 mb-3">{drill.setup}</p>
                                     </div>
                                )}

                                <p className="text-sm text-slate-700 italic mb-4">
                                    "{mode === 'TACTIC' ? tactic?.explanation : drill?.explanation}"
                                </p>
                                
                                {mode === 'TACTIC' && tactic && (
                                    <>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Claves del partido</h3>
                                        <ul className="space-y-2">
                                            {tactic.keyPoints.map((point, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                                    <i className="fas fa-check-circle text-green-500 mt-1"></i>
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!tactic && !drill && !loading && (
                    <div className="text-center py-10 opacity-40">
                        <i className={`fas ${mode === 'TACTIC' ? 'fa-clipboard-list' : 'fa-running'} text-6xl text-slate-300 mb-4`}></i>
                        <p className="font-bold text-slate-500">
                            {mode === 'TACTIC' ? 'Pide una estrategia para el partido.' : 'Pide una rutina de entrenamiento.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TacticsView;
