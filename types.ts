
export enum UserType {
    PLAYER = 'PLAYER', 
    TEAM = 'TEAM',
    OWNER = 'OWNER'      
}

export enum SkillLevel {
    AMATEUR = 'Amateur',
    INTERMEDIATE = 'Intermedio',
    PRO = 'Semi-Pro',
    SUNDAY_LEAGUE = 'Fútbol de Domingo'
}

export interface ProfileAttributes {
    pace: number;      
    shooting: number;  
    passing: number;   
    dribbling: number; 
    defending: number; 
    physical: number;  
}

export interface ReputationStats {
    starRating: number;
    reviewCount: number;
    puntuality: number; 
    fairPlay: number;   
    skillVeracity: number; 
    reports: number;    
}

export interface SquadMember {
    id: string;
    name: string;
    position: string; 
    number?: number;  
    attributes: ProfileAttributes;
}

export interface MatchRecord {
    id: string;
    date: string;
    opponent: string;
    opponentId?: string; 
    result: 'VICTORIA' | 'DERROTA' | 'EMPATE';
    goals: number;
    assists: number;
    rating: number; 
    reviewed?: boolean; 
    notes?: string; 
    matchType: UserType; 
    mvpName?: string; 
    isMVP?: boolean; 
}

export interface ComplexService {
    id: string;
    label: string;
    icon: string;
    available: boolean;
}

export interface FieldDetail {
    id: string;
    name: string;
    size: '5v5' | '7v7' | '11v11';
    surface: 'Sintético' | 'Césped' | 'Parquet';
}

export interface Profile {
    id: string;
    name: string;          
    playerName: string;    
    teamName?: string;
    complexName?: string;
    address?: string;      
    phoneNumber?: string;  
    type: UserType;
    myTeams?: { id: string; name: string }[]; 
    teamCode?: string;     
    description: string;
    location: string;
    skillLevel: SkillLevel;
    membersCount?: number; 
    squad?: SquadMember[];      
    imageUrl: string;
    rating: number; 
    reputation: ReputationStats; 
    stats: {
        matchesPlayed: number;
        wins: number;
        bookingsCount?: number;
    };
    attributes: ProfileAttributes; 
    badges?: { icon: string; label: string; color: string }[];
    matchHistory: MatchRecord[];   
    kitColor?: string;
    services?: ComplexService[];
    fieldsCount?: number;
    fields?: FieldDetail[];
}

export interface MatchEvent {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    format: string; 
    price: string;
    prize: string;
    imageUrl: string;
    status: 'OPEN' | 'CLOSED' | 'Live';
    organizerId: string;
    type: 'MATCH' | 'TOURNAMENT';
    maxTeams?: number;
    currentTeams?: number;
    isOfficial?: boolean;
}

export interface Announcement {
    id: string;
    authorId: string;
    authorName: string;
    type: 'BUSCO_RIVAL' | 'FALTA_UNO' | 'BUSCO_EQUIPO' | 'PROMO_CANCHA';
    text: string;
    location: string;
    startTime: string; 
    timestamp: Date;
}

export interface AppNotification {
    id: string;
    type: 'MESSAGE' | 'MATCH_REMINDER' | 'SYSTEM' | 'REVIEW_PENDING' | 'BOOKING_REQUEST';
    title: string;
    message: string;
    read: boolean;
    timestamp: Date;
    relatedId?: string; 
}

export interface ChatMessage {
    id?: string;
    senderId: string;
    senderName?: string;
    text?: string;
    type: 'text' | 'poll' | 'vaquita' | 'availability' | 'system' | 'challenge' | 'booking_confirm';
    timestamp: any; 
    pollData?: {
        question: string;
        options: { text: string; votes: string[] }[];
    };
    vaquitaData?: {
        total: number;
        perHead: number;
        description: string;
        paid: string[];
    };
    challengeData?: {
        location: string;
        date: string;
        time: string;
        format: string;
        status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    };
}
