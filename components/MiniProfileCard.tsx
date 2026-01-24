
import React from 'react';
import { Profile, UserType } from '../types';

interface MiniProfileCardProps {
    profile: Profile;
    onClick: () => void;
}

const MiniProfileCard: React.FC<MiniProfileCardProps> = ({ profile, onClick }) => {
    const isSearching = profile.description?.includes('BUSCANDO_RIVAL');

    return (
        <div 
            onClick={onClick}
            className={`bg-white rounded-lg shadow-md overflow-hidden border active:scale-95 transition-transform cursor-pointer relative ${isSearching ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-slate-200'}`}
        >
            <div className="h-28 bg-slate-200 relative">
                <img 
                    src={profile.imageUrl} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                />
                
                {/* Badges on top of image */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <div className="bg-slate-900/80 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest backdrop-blur-sm">
                        {profile.type === UserType.TEAM ? 'EQUIPO' : 'JUGADOR'}
                    </div>
                    {isSearching && (
                        <div className="bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-lg animate-pulse">
                            BUSCANDO RIVAL
                        </div>
                    )}
                </div>

                {/* Kit Color Preview (Conditional) */}
                {profile.kitColor && (
                    <div 
                        className="absolute bottom-1 right-1 w-6 h-6 rounded-full border border-white shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: profile.kitColor }}
                    >
                         <i className={`fas fa-tshirt text-[10px] ${['#ffffff', '#eab308'].includes(profile.kitColor) ? 'text-black' : 'text-white'}`}></i>
                    </div>
                )}
            </div>
            
            <div className="p-3">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-black text-slate-800 uppercase italic leading-tight truncate w-full">
                        {profile.name}
                    </h3>
                </div>
                
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase mb-2">
                    <i className="fas fa-map-marker-alt text-green-500"></i>
                    <span className="truncate">{profile.location}</span>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <i key={star} className={`fas fa-star text-[9px] ${star <= Math.round(profile.rating) ? 'text-yellow-400' : 'text-slate-200'}`}></i>
                        ))}
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                        <i className="fas fa-users"></i>
                        <span>{profile.type === UserType.TEAM ? profile.membersCount : '1'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiniProfileCard;
