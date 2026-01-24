
import React, { createContext, useContext, useState, ReactNode, PropsWithChildren, useEffect } from 'react';
import { Profile, UserType, AppNotification, MatchEvent, Announcement } from '../types';
import { MOCK_PROFILES, CURRENT_USER, EMPTY_PROFILE, MOCK_ANNOUNCEMENTS } from '../constants';
import { auth, db, isFirebaseConfigured } from '../firebaseConfig';
import { 
    signInAnonymously, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "firebase/auth";
import { doc, onSnapshot, getDoc, setDoc } from "firebase/firestore";
import { syncUserProfile, getCommunityProfiles, seedDatabase } from '../services/firebaseService';

interface AppContextType {
    user: User | null;
    userProfile: Profile;
    setUserProfile: (profile: Profile) => void;
    availableProfiles: Profile[];
    refreshCommunity: () => Promise<void>;
    activeChats: Profile[];
    startChat: (profile: Profile) => void;
    updateUserBio: (newBio: string) => void;
    notifications: AppNotification[];
    addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => void;
    markAsRead: (id: string) => void;
    clearNotifications: () => void;
    isLoading: boolean;
    loginWithGoogle: () => Promise<void>;
    loginAsGuest: () => Promise<void>;
    registerWithEmail: (email: string, pass: string) => Promise<void>;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    
    // Events / Tournaments
    createdEvents: MatchEvent[];
    createEvent: (event: MatchEvent) => void;
    
    // Announcements
    announcements: Announcement[];
    addAnnouncement: (ann: Omit<Announcement, 'id' | 'timestamp'>) => void;

    // Onboarding
    needsOnboarding: boolean;
    completeOnboarding: (data: Partial<Profile>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren<{}>) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfileState] = useState<Profile>(EMPTY_PROFILE); 
    const [availableProfiles, setAvailableProfiles] = useState<Profile[]>(MOCK_PROFILES);
    const [activeChats, setActiveChats] = useState<Profile[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [createdEvents, setCreatedEvents] = useState<MatchEvent[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    // Helper to merge profile with defaults to prevent crashes
    const sanitizeProfile = (data: any): Profile => {
        return {
            ...JSON.parse(JSON.stringify(EMPTY_PROFILE)),
            ...data,
            reputation: {
                ...EMPTY_PROFILE.reputation,
                ...(data.reputation || {})
            },
            attributes: {
                ...EMPTY_PROFILE.attributes,
                ...(data.attributes || {})
            },
            stats: {
                ...EMPTY_PROFILE.stats,
                ...(data.stats || {})
            }
        };
    };

    useEffect(() => {
        if (!isFirebaseConfigured || !auth) {
            setIsLoading(false);
            return;
        }

        seedDatabase();

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                
                try {
                    const userRef = doc(db, "users", firebaseUser.uid);
                    let docSnap;
                    
                    try {
                        docSnap = await getDoc(userRef);
                    } catch (e: any) {
                        if (e.code === 'permission-denied') {
                            console.warn("Firestore: Permisos denegados al leer perfil.");
                        }
                        throw e;
                    }

                    if (docSnap && docSnap.exists()) {
                        const loadedProfile = sanitizeProfile(docSnap.data());
                        setUserProfileState(loadedProfile);
                        if (loadedProfile.name.startsWith('Usuario') || loadedProfile.name.startsWith('Invitado') || !loadedProfile.location) {
                            setNeedsOnboarding(true);
                        } else {
                            setNeedsOnboarding(false);
                        }
                    } else {
                        const newProfile: Profile = sanitizeProfile({
                            id: firebaseUser.uid,
                            name: firebaseUser.displayName || `Usuario ${firebaseUser.uid.substring(0, 4)}`,
                            imageUrl: firebaseUser.photoURL || EMPTY_PROFILE.imageUrl,
                        });
                        
                        try {
                            await setDoc(userRef, newProfile);
                        } catch (err: any) {
                            console.warn("No se pudo guardar perfil inicial en DB (Permisos).");
                        }
                        setUserProfileState(newProfile);
                        setNeedsOnboarding(true);
                    }

                    onSnapshot(userRef, 
                        (doc) => {
                            if (doc.exists()) {
                                setUserProfileState(sanitizeProfile(doc.data()));
                            }
                        },
                        (error) => {
                            if (error.code === 'permission-denied') {
                                console.warn("Snapshot listener: Permisos insuficientes.");
                            }
                        }
                    );

                    const others = await getCommunityProfiles(firebaseUser.uid);
                    setAvailableProfiles(others.map(p => sanitizeProfile(p)));

                } catch (error: any) {
                    console.warn("Fallback to offline profile load:", error.message);
                     const fallbackProfile: Profile = sanitizeProfile({
                        id: firebaseUser.uid,
                        name: firebaseUser.displayName || 'Usuario Offline',
                    });
                    setUserProfileState(fallbackProfile);
                    setNeedsOnboarding(true);
                }

            } else {
                if (!user) {
                   setUser(null); 
                   setUserProfileState(EMPTY_PROFILE);
                }
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        if (!auth) return;
        setIsLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error: any) {
            console.error("Error Google login:", error);
            setIsLoading(false);
        }
    };

    const loginAsGuest = async () => {
        setIsLoading(true);
        try {
            if (auth) {
                await signInAnonymously(auth);
            }
        } catch (error: any) {
            const mockUser: any = { uid: 'guest-' + Date.now(), displayName: 'Invitado Local' };
            setUser(mockUser);
            const guestProfile = sanitizeProfile({ id: mockUser.uid, name: 'Invitado', location: '' });
            setUserProfileState(guestProfile);
            setNeedsOnboarding(true);
        } finally {
            setIsLoading(false);
        }
    };

    const registerWithEmail = async (email: string, pass: string) => {
        if (!auth) return;
        setIsLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            alert("Error registro: " + error.message);
            setIsLoading(false);
        }
    };

    const loginWithEmail = async (email: string, pass: string) => {
        if (!auth) return;
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            alert("Error acceso: " + error.message);
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            if (auth) await signOut(auth);
        } catch (error) {
            console.error(error);
        } finally {
            setUserProfileState(EMPTY_PROFILE);
            setNotifications([]);
            setActiveChats([]);
            setUser(null);
            setTimeout(() => setIsLoading(false), 50);
        }
    };

    const refreshCommunity = async () => {
        if (user && isFirebaseConfigured) {
            const others = await getCommunityProfiles(user.uid);
            setAvailableProfiles(others.map(p => sanitizeProfile(p)));
        }
    };

    const setUserProfile = (profile: Profile) => {
        setUserProfileState(profile);
        if (isFirebaseConfigured && user && auth?.currentUser) {
            syncUserProfile(profile);
        }
    };

    const startChat = (profile: Profile) => {
        if (!activeChats.find(p => p.id === profile.id)) {
            setActiveChats(prev => [profile, ...prev]);
        }
        setAvailableProfiles(prev => prev.filter(p => p.id !== profile.id));
    };

    const updateUserBio = (newBio: string) => {
        const updated = { ...userProfile, description: newBio };
        setUserProfile(updated);
    };

    const addNotification = (notif: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => {
        const newNotification: AppNotification = {
            ...notif,
            id: Math.random().toString(36).substr(2, 9),
            read: false,
            timestamp: new Date()
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    const createEvent = (event: MatchEvent) => {
        setCreatedEvents(prev => [event, ...prev]);
        addNotification({
            type: 'SYSTEM',
            title: 'Evento Creado',
            message: `"${event.title}" se ha publicado correctamente.`
        });
    };

    const addAnnouncement = (ann: Omit<Announcement, 'id' | 'timestamp'>) => {
        const newAnn: Announcement = {
            ...ann,
            id: 'ann-' + Math.random().toString(36).substr(2, 9),
            timestamp: new Date()
        };
        setAnnouncements(prev => [newAnn, ...prev]);
    };

    const completeOnboarding = (data: Partial<Profile>) => {
        const updatedProfile = sanitizeProfile({ ...userProfile, ...data });
        setUserProfile(updatedProfile);
        setNeedsOnboarding(false);
    };

    return (
        <AppContext.Provider value={{ 
            user,
            userProfile, 
            setUserProfile, 
            availableProfiles, 
            refreshCommunity,
            activeChats, 
            startChat,
            updateUserBio,
            notifications,
            addNotification,
            markAsRead,
            clearNotifications,
            isLoading,
            loginWithGoogle,
            loginAsGuest,
            registerWithEmail,
            loginWithEmail,
            logout,
            createdEvents,
            createEvent,
            announcements,
            addAnnouncement,
            needsOnboarding,
            completeOnboarding
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};
