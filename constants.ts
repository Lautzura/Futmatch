
import { Profile, UserType, SkillLevel, MatchEvent, Announcement } from './types';

const defaultStats = { pace: 60, shooting: 60, passing: 60, dribbling: 60, defending: 60, physical: 60 };
const defaultReputation = { starRating: 5.0, reviewCount: 0, puntuality: 100, fairPlay: 100, skillVeracity: 100, reports: 0 };

export const EMPTY_PROFILE: Profile = {
    id: '',
    name: '',
    playerName: '',
    teamName: '',
    type: UserType.PLAYER,
    description: '',
    location: '',
    skillLevel: SkillLevel.AMATEUR,
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/847/847969.png', 
    rating: 5.0,
    reputation: { ...defaultReputation },
    stats: { matchesPlayed: 0, wins: 0 },
    attributes: { ...defaultStats },
    matchHistory: [],
    myTeams: [],
    squad: []
};

export const MOCK_PROFILES: Profile[] = [];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    {
        id: 'a1',
        authorId: 'u1',
        authorName: 'Atlético Birra',
        type: 'FALTA_UNO',
        text: '¡URGENTE! Nos falta un arquero para hoy a las 20hs en Palermo. Nivel medio.',
        location: 'Palermo Soho',
        startTime: 'Hoy 20:00',
        timestamp: new Date()
    },
    {
        id: 'a2',
        authorId: 'u2',
        authorName: 'Los Galácticos',
        type: 'BUSCO_RIVAL',
        text: 'Buscamos rival para amistoso mañana 19hs. Tenemos cancha en Belgrano.',
        location: 'Belgrano',
        startTime: 'Mañana 19:00',
        timestamp: new Date()
    }
];

export const CURRENT_USER: Profile = {
    id: '1',
    name: 'Atlético Birra',
    playerName: 'Nico (C)',
    teamName: 'Atlético Birra',
    type: UserType.TEAM,
    myTeams: [], 
    description: 'Equipo en formación buscando rivales y arquero.',
    location: 'Centro',
    skillLevel: SkillLevel.AMATEUR,
    membersCount: 6,
    squad: [
        { id: 'p1', name: 'Nico (C)', position: 'MED', attributes: { ...defaultStats, pace: 70, passing: 80 } }
    ],
    imageUrl: 'https://picsum.photos/400/600?random=1',
    rating: 4.8,
    reputation: { starRating: 4.8, reviewCount: 5, puntuality: 95, fairPlay: 90, skillVeracity: 100, reports: 0 },
    stats: { matchesPlayed: 12, wins: 4 },
    attributes: { pace: 65, shooting: 70, passing: 60, dribbling: 55, defending: 50, physical: 60 },
    matchHistory: [
        // Fix: Added missing matchType property required by MatchRecord interface
        { id: 'm1', date: '2023-10-10', opponent: 'Dep. Tapitas', opponentId: 'u55', result: 'VICTORIA', goals: 2, assists: 1, rating: 8, reviewed: false, matchType: UserType.TEAM }
    ],
    kitColor: '#0f172a',
    badges: []
};

export const MOCK_TOURNAMENTS: MatchEvent[] = [
    {
        id: 't1',
        title: 'Copa Relámpago Nocturna',
        date: '2023-11-20',
        time: '20:00',
        location: 'Palermo, Club de Amigos',
        format: '5v5',
        price: '$15.000 / equipo',
        prize: '$80.000 + Trofeo',
        imageUrl: 'https://picsum.photos/400/200?random=10',
        status: 'OPEN',
        organizerId: 'org1',
        type: 'TOURNAMENT'
    }
];