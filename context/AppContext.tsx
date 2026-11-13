import React, { createContext, useContext, useState, ReactNode, PropsWithChildren, useEffect, useRef } from 'react';
import { Profile, UserType, AppNotification, MatchEvent, Zone, Club, ClubMember, JoinRequest, FutMatch, UrgentPost } from '../types';
import { EMPTY_PROFILE, detectZone } from '../constants';
import { auth, db, messaging, isFirebaseConfigured } from '../firebaseConfig';
import {
    signInAnonymously,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    deleteUser
} from "firebase/auth";
import { doc, onSnapshot, getDoc, setDoc, collection, query, where, orderBy, limit, updateDoc, arrayUnion } from "firebase/firestore";
import { syncUserProfile, getCommunityProfiles, createEventInDB, getEventsFromDB, getUserChats } from '../services/firebaseService';
import { initializePushNotifications, onForegroundMessage } from '../services/notificationService';
import { requestAndSaveLocation } from '../services/geolocationService';
import {
    createClub,
    getUserClubs,
    getClubMembers,
    joinClubByCode,
    kickMember,
    setViceCaptain,
    updateClubAvailability,
    getClubsNeedingPlayers,
    sendJoinRequest,
    getClubJoinRequests,
    respondToJoinRequest,
    createMatch,
    getMatch,
    submitMatchResult,
    getMatchesForEntity,
    getPendingResultMatches,
    createUrgentPost,
    getUrgentPosts,
    deleteUrgentPost,
    repairMyClubs,
} from '../services/clubService';

// Capacitor Imports
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

interface AppContextType {
    // ── Existente ──────────────────────────────────────────────
    user: User | null;
    userProfile: Profile;
    setUserProfile: (profile: Profile) => void;
    availableProfiles: Profile[];
    refreshCommunity: () => Promise<void>;
    activeChats: Profile[];
    startChat: (profile: Profile) => void;
    closeChat: (profileId: string) => void;
    updateUserBio: (newBio: string) => void;
    notifications: AppNotification[];
    addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => void;
    markAsRead: (id: string) => void;
    clearNotifications: () => void;
    isLoading: boolean;
    loginWithGoogle: () => Promise<void>;
    loginAsGuest: () => Promise<void>;
    registerWithEmail: (email: string, pass: string) => Promise<boolean>;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    checkVerification: () => Promise<boolean>;
    resendVerification: () => Promise<void>;
    resetPassword: (email: string) => Promise<boolean>;
    createdEvents: MatchEvent[];
    createEvent: (event: MatchEvent) => Promise<void>;
    needsOnboarding: boolean;
    profileReady: boolean;
    completeOnboarding: (data: Partial<Profile>) => void;
    deepLinkProfileId: string | null;
    clearDeepLink: () => void;

    // ── Clubs ──────────────────────────────────────────────────
    userClubs: Club[];
    isLoadingClubs: boolean;
    // Crear un club nuevo
    foundClub: (name: string, location: string, formats: string[], zone?: Zone) => Promise<Club | null>;
    // Unirse con código
    joinClub: (inviteCode: string) => Promise<{ success: boolean; message: string; club?: Club }>;
    // Expulsar miembro (solo capitán/vice)
    kickClubMember: (clubId: string, memberId: string) => Promise<boolean>;
    // Asignar vice
    assignViceCaptain: (clubId: string, newViceId: string) => Promise<boolean>;
    // Cambiar disponibilidad del club
    setClubAvailability: (clubId: string, status: 'AVAILABLE' | 'UNAVAILABLE', needsPlayers: boolean, spots: number) => Promise<boolean>;
    // Obtener miembros de un club
    fetchClubMembers: (clubId: string) => Promise<ClubMember[]>;
    // Clubs que buscan jugadores (para mostrar en SwipeView)
    clubsNeedingPlayers: Club[];
    refreshClubsNeedingPlayers: (zone?: Zone) => Promise<void>;

    // ── Solicitudes de unión ───────────────────────────────────
    // Jugador suelto pide unirse
    requestJoinClub: (club: Club, message?: string) => Promise<boolean>;
    // Capitán obtiene solicitudes pendientes
    fetchJoinRequests: (clubId: string) => Promise<JoinRequest[]>;
    // Capitán acepta/rechaza
    handleJoinRequest: (request: JoinRequest, status: 'ACCEPTED' | 'REJECTED') => Promise<boolean>;

    // ── Partidos (nuevo sistema) ───────────────────────────────
    // Crear partido cuando se confirma un desafío en el chat
    confirmMatch: (
        homeId: string, awayId: string,
        homeType: 'club' | 'user', awayType: 'club' | 'user',
        chatId: string, date: string, time: string,
        location: string, format: string, zone?: Zone
    ) => Promise<FutMatch | null>;
    // Cargar resultado (cada equipo lo hace por separado)
    loadMatchResult: (matchId: string, myScore: number, rivalScore: number) => Promise<{ confirmed: boolean; conflict: boolean }>;
    // Obtener partidos pendientes de resultado
    pendingResultMatches: FutMatch[];
    refreshPendingResults: () => Promise<void>;

    // ── Urgente ────────────────────────────────────────────────
    urgentPosts: UrgentPost[];
    publishUrgentPost: (post: Omit<UrgentPost, 'id' | 'createdAt' | 'expiresAt'>) => Promise<UrgentPost | null>;
    refreshUrgentPosts: () => Promise<void>;
    removeUrgentPost: (postId: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren<{}>) => {
    // ── Estado existente ───────────────────────────────────────
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfileState] = useState<Profile>(EMPTY_PROFILE);
    const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
    const [activeChats, setActiveChats] = useState<Profile[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [createdEvents, setCreatedEvents] = useState<MatchEvent[]>([]);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    // Evita el "colado": mientras esto es false, todavía no sabemos con certeza
    // si el usuario necesita onboarding o no — hay que esperar antes de decidir la ruta.
    const [profileReady, setProfileReady] = useState(false);
    const [deepLinkProfileId, setDeepLinkProfileId] = useState<string | null>(null);

    // ── Estado nuevo: clubs ────────────────────────────────────
    const [userClubs, setUserClubs] = useState<Club[]>([]);
    const [isLoadingClubs, setIsLoadingClubs] = useState(false);
    const [clubsNeedingPlayers, setClubsNeedingPlayers] = useState<Club[]>([]);
    const [pendingResultMatches, setPendingResultMatches] = useState<FutMatch[]>([]);
    const [urgentPosts, setUrgentPosts] = useState<UrgentPost[]>([]);

    // Refs
    const lastEventCount = useRef(0);
    const userProfileRef = useRef<Profile>(EMPTY_PROFILE);

    // Token de notificaciones del celular (app nativa) y para qué usuario ya se guardó
    const nativePushTokenRef = useRef<string | null>(null);
    const nativePushSavedForRef = useRef<string | null>(null);
    const saveNativePushToken = (userId?: string) => {
        const token = nativePushTokenRef.current;
        if (!db || !token || !userId) return;
        const key = `${userId}:${token}`;
        if (nativePushSavedForRef.current === key) return;
        nativePushSavedForRef.current = key;
        updateDoc(doc(db, 'users', userId), { fcmTokens: arrayUnion(token) })
            .catch(err => {
                nativePushSavedForRef.current = null; // reintentar la próxima vez
                console.warn('No se pudo guardar el token nativo:', err);
            });
    };

    // ── Helpers ────────────────────────────────────────────────
    const playNotificationSound = () => {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
        } catch (e) {}
    };

    const addNotification = (notif: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => {
        const newNotification: AppNotification = {
            ...notif,
            id: Math.random().toString(36).substr(2, 9),
            read: false,
            timestamp: new Date()
        };
        playNotificationSound();
        setNotifications(prev => [newNotification, ...prev]);
    };

    // ── Cargar clubs del usuario ───────────────────────────────
    const loadUserClubs = async (profile: Profile) => {
        if (!profile.clubIds?.length) return;
        setIsLoadingClubs(true);
        try {
            const clubs = await getUserClubs(profile.clubIds);
            setUserClubs(clubs);
        } catch (e) {
            console.error('[AppContext] Error loading clubs:', e);
        } finally {
            setIsLoadingClubs(false);
        }
    };

    // ── Cargar partidos pendientes de resultado ────────────────
    const refreshPendingResults = async () => {
        if (!userProfile.id) return;
        try {
            const matches = await getPendingResultMatches(userProfile.id);
            setPendingResultMatches(matches);

            // Notificar si hay pendientes
            if (matches.length > 0) {
                matches.forEach(m => {
                    addNotification({
                        type: 'MATCH_REMINDER',
                        title: '⚽ Partido sin resultado',
                        message: `¿Cómo salió? Cargá el resultado del partido.`,
                    });
                });
            }
        } catch (e) {
            console.error('[AppContext] Error loading pending results:', e);
        }
    };

    // ── Deep Link listener ─────────────────────────────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const profileId = params.get('profile');
        if (profileId) {
            setDeepLinkProfileId(profileId);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // ── Push Notifications foreground listener ────────────────
    useEffect(() => {
        if (!isFirebaseConfigured) return;
        const unsubscribe = onForegroundMessage((title, body) => {
            addNotification({ type: 'MESSAGE', title, message: body });
        });
        return () => unsubscribe();
    }, []);
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            const initPush = async () => {
                try {
                    let permStatus = await PushNotifications.checkPermissions();
                    if (permStatus.receive === 'prompt') {
                        permStatus = await PushNotifications.requestPermissions();
                    }
                    if (permStatus.receive !== 'granted') return;
                    await PushNotifications.register();
                    PushNotifications.addListener('registration', (token) => {
                        console.log('Push Token:', token.value);
                        // Se guarda en memoria y se sube a Firestore apenas sepamos quién es
                        // el usuario (a veces el token llega ANTES de que termine el login,
                        // y antes se perdía).
                        nativePushTokenRef.current = token.value;
                        saveNativePushToken(userProfileRef.current?.id);
                    });
                    PushNotifications.addListener('registrationError', (error) => {
                        console.warn('Push registration failed:', error);
                    });
                    PushNotifications.addListener('pushNotificationReceived', (notification) => {
                        addNotification({
                            type: 'SYSTEM',
                            title: notification.title || 'FutMatch',
                            message: notification.body || 'Tienes una novedad'
                        });
                    });
                } catch (error) {
                    console.error("Push init error (Safe Mode):", error);
                }
            };
            initPush();
        }
    }, []);

    // ── Firebase Auth + carga inicial ─────────────────────────
    useEffect(() => {
        if (!isFirebaseConfigured || !auth || !db) {
            setIsLoading(false);
            return;
        }

        const loadEvents = async () => {
            const events = await getEventsFromDB();
            setCreatedEvents(events);
            lastEventCount.current = events.length;
        };
        loadEvents();

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            const firestore = db;
            if (!firestore) return;

            if (firebaseUser) {
                setProfileReady(false); // todavía no sabemos si necesita onboarding

                // Todo esto es INSTANTÁNEO — no depende de ninguna llamada de red,
                // así que nunca hace falta esperar nada para poder empezar a usar la app.
                setUser({ ...firebaseUser } as User);
                setUserProfileState(prev => ({ ...prev, id: firebaseUser.uid }));
                userProfileRef.current = { ...userProfileRef.current, id: firebaseUser.uid };

                // El reload (para refrescar el estado de "email verificado") se hace aparte,
                // con su propio tope de tiempo — si tarda, no bloquea nada de lo de arriba.
                const reloadTimeout = new Promise<void>(resolve => setTimeout(resolve, 5000));
                await Promise.race([firebaseUser.reload().catch(() => {}), reloadTimeout]);
                setUser({ ...firebaseUser } as User); // actualizado por si el reload trajo algo nuevo

                try {
                    const userRef = doc(firestore, "users", firebaseUser.uid);
                    const timeout = new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout cargando el perfil')), 10000)
                    );
                    const docSnap = await Promise.race([getDoc(userRef), timeout]) as Awaited<ReturnType<typeof getDoc>>;

                    if (docSnap.exists()) {
                        let loadedProfile = docSnap.data() as Profile;
                        if (!loadedProfile.zone && loadedProfile.location) {
                            loadedProfile.zone = detectZone(loadedProfile.location);
                        }
                        setUserProfileState(loadedProfile);
                        userProfileRef.current = loadedProfile;

                        if (!loadedProfile.name || loadedProfile.name.startsWith('Usuario ') || !loadedProfile.location) {
                            setNeedsOnboarding(true);
                        } else {
                            setNeedsOnboarding(false);
                        }
                        setProfileReady(true); // ahora sí sabemos con certeza si hace falta onboarding

                        // ── NUEVO: cargar clubs del usuario ──
                        // (antes, auto-reparar: clubes de los que te sacaron y chat grupal)
                        if (loadedProfile.clubIds?.length) {
                            const fixedIds = await repairMyClubs(firebaseUser.uid, loadedProfile.clubIds);
                            if (fixedIds.length !== loadedProfile.clubIds.length) {
                                loadedProfile = { ...loadedProfile, clubIds: fixedIds };
                            }
                        }
                        await loadUserClubs(loadedProfile);

                        // ── NUEVO: chequear partidos sin resultado ──
                        setTimeout(() => refreshPendingResults(), 2000);

                        // ── NUEVO: inicializar push notifications ──
                        // Solo en web (no nativo — Capacitor lo maneja por separado)
                        if (!Capacitor.isNativePlatform() && 'Notification' in window) {
                            initializePushNotifications(firebaseUser.uid).catch(() => {});
                        }

                        // ── NUEVO: pedir y guardar la ubicación GPS real ──
                        // Se suma a la ciudad/zona elegida a mano, no la reemplaza
                        requestAndSaveLocation(firebaseUser.uid).catch(() => {});

                    } else {
                        console.log("Creating new profile for user:", firebaseUser.uid);
                        const newProfile: Profile = {
                            ...JSON.parse(JSON.stringify(EMPTY_PROFILE)),
                            id: firebaseUser.uid,
                            name: firebaseUser.displayName || `Usuario ${firebaseUser.uid.substring(0, 4)}`,
                            imageUrl: firebaseUser.photoURL || EMPTY_PROFILE.imageUrl,
                        };
                        await setDoc(userRef, newProfile);
                        setUserProfileState(newProfile);
                        userProfileRef.current = newProfile;
                        setNeedsOnboarding(true);
                        setProfileReady(true); // ahora sí sabemos con certeza si hace falta onboarding
                    }

                    // Si el celular ya nos dio su token de notificaciones, guardarlo ahora
                    saveNativePushToken(firebaseUser.uid);

                    // onSnapshot para actualizaciones en tiempo real del perfil
                    onSnapshot(userRef, (snap) => {
                        if (snap.exists()) {
                            const updated = snap.data() as Profile;
                            setUserProfileState(updated);
                            userProfileRef.current = updated;
                            // Recargar clubs si cambió clubIds
                            if (updated.clubIds?.length !== userProfileRef.current.clubIds?.length) {
                                loadUserClubs(updated);
                            }
                        }
                    });

                    const others = await getCommunityProfiles(firebaseUser.uid);
                    setAvailableProfiles(others);

                    const existingChats = await getUserChats(firebaseUser.uid);
                    setActiveChats(existingChats);

                    // onSnapshot chats
                    const chatsQuery = query(
                        collection(firestore, "chats"),
                        where("participants", "array-contains", firebaseUser.uid)
                    );
                    onSnapshot(chatsQuery, (snapshot) => {
                        snapshot.docChanges().forEach((change) => {
                            if (change.type === "modified") {
                                const data = change.doc.data();
                                const lastMsg = data.lastMessage;
                                if (lastMsg && lastMsg.senderId !== firebaseUser.uid) {
                                    const msgTime = lastMsg.timestamp?.toDate
                                        ? lastMsg.timestamp.toDate()
                                        : new Date(lastMsg.timestamp || Date.now());
                                    const now = new Date();
                                    if ((now.getTime() - msgTime.getTime()) < 30000) {
                                        let messagePreview = lastMsg.text || "Nuevo mensaje.";
                                        if (messagePreview.includes('Encuesta')) messagePreview = "📊 Nueva Encuesta.";
                                        else if (messagePreview.includes('Vaquita')) messagePreview = "💰 Se armó una Vaquita.";
                                        addNotification({
                                            type: 'MESSAGE',
                                            title: 'Nuevo Mensaje',
                                            message: messagePreview.length > 50
                                                ? messagePreview.substring(0, 50) + '...'
                                                : messagePreview
                                        });
                                    }
                                }
                            }
                        });
                    });

                    // onSnapshot events
                    const eventsQuery = query(collection(firestore, "events"));
                    onSnapshot(eventsQuery, (snapshot) => {
                        const allEvents = snapshot.docs.map(d => d.data() as MatchEvent);
                        setCreatedEvents(allEvents);
                        if (allEvents.length > lastEventCount.current && userProfileRef.current.location) {
                            const myZone = detectZone(userProfileRef.current.location);
                            const newest = allEvents.sort((a, b) =>
                                (b.createdAt || '').localeCompare(a.createdAt || '')
                            )[0];
                            if (newest && newest.organizerId !== firebaseUser.uid && newest.zone === myZone) {
                                const isTournament = newest.type === 'TOURNAMENT';
                                addNotification({
                                    type: 'TOURNAMENT_ALERT',
                                    title: isTournament ? '🏆 Nuevo Torneo en tu Zona' : '⚽ Nuevo Partido en tu Zona',
                                    message: `Se creó "${newest.title}" en ${newest.location}.`
                                });
                            }
                        }
                        lastEventCount.current = allEvents.length;
                    });

                } catch (error) {
                    console.error("Critical Error loading profile:", error);
                    setProfileReady(true); // no dejar al usuario trabado en la pantalla de carga
                }
            } else {
                setProfileReady(false); // se resetea para la próxima vez que alguien inicie sesión
                if (user) {
                    setUser(null);
                    setUserProfileState(EMPTY_PROFILE);
                    userProfileRef.current = EMPTY_PROFILE;
                }
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // ── Auth methods (sin cambios) ─────────────────────────────

    const loginWithGoogle = async () => {
        if (!auth) { alert("Error: Firebase no está configurado."); return; }
        setIsLoading(true);
        try {
            await signOut(auth);
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account consent' });
            await signInWithPopup(auth, provider);
        } catch (error: any) {
            if (error.code === 'auth/unauthorized-domain') {
                alert(`ERROR DE DOMINIO:\nAgrega: ${window.location.hostname} en Firebase.`);
            } else if (error.code !== 'auth/popup-closed-by-user') {
                alert("Error: " + error.message);
            }
        } finally {
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
            console.warn("Using Local Fallback:", error);
            const mockUser: any = { uid: 'guest-' + Date.now(), displayName: 'Invitado Local' };
            setUser(mockUser);
            const guestProfile = {
                ...JSON.parse(JSON.stringify(EMPTY_PROFILE)),
                id: mockUser.uid,
                name: 'Invitado'
            };
            setUserProfileState(guestProfile);
            setNeedsOnboarding(true);
        } finally {
            setIsLoading(false);
        }
    };

    const registerWithEmail = async (email: string, pass: string): Promise<boolean> => {
        if (!auth || !db) return false;
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            try { await sendEmailVerification(userCredential.user); } catch (e) {}
            setIsLoading(false);
            return true;
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') alert("Este correo ya está registrado.");
            else if (error.code === 'auth/operation-not-allowed') alert("Registro con email no habilitado en Firebase.");
            else alert(`Error (${error.code || 'unknown'}): ${error.message}`);
            setIsLoading(false);
            return false;
        }
    };

    const loginWithEmail = async (email: string, pass: string) => {
        if (!auth) return;
        setIsLoading(true);
        try {
            const credential = await signInWithEmailAndPassword(auth, email, pass);
            if (credential.user) setUser({ ...credential.user } as User);
            setIsLoading(false);
        } catch (error: any) {
            if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(error.code)) {
                alert("Correo o contraseña incorrectos.");
            } else if (error.code === 'auth/too-many-requests') {
                alert("Demasiados intentos. Intenta más tarde.");
            } else {
                alert("Error de acceso: " + error.message);
            }
            setIsLoading(false);
        }
    };

    const checkVerification = async (): Promise<boolean> => {
        if (auth && auth.currentUser) {
            await auth.currentUser.reload();
            setUser({ ...auth.currentUser } as User);
            return auth.currentUser.emailVerified;
        }
        return false;
    };

    const resendVerification = async () => {
        if (auth && auth.currentUser) {
            try {
                await sendEmailVerification(auth.currentUser);
                alert("Correo reenviado. Revisa tu bandeja (y Spam).");
            } catch (error: any) {
                if (error.code === 'auth/too-many-requests') alert("Espera antes de solicitar otro correo.");
                else alert("Error al enviar: " + error.message);
            }
        }
    };

    const resetPassword = async (email: string): Promise<boolean> => {
        if (!auth) return false;
        try {
            await sendPasswordResetEmail(auth, email);
            return true;
        } catch (error: any) {
            alert("Error: " + error.message);
            return false;
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
            setUserClubs([]);
            setPendingResultMatches([]);
            setUser(null);
            setTimeout(() => setIsLoading(false), 50);
        }
    };

    // ── Profile methods (sin cambios) ─────────────────────────

    const refreshCommunity = async () => {
        if (user && isFirebaseConfigured) {
            const others = await getCommunityProfiles(user.uid);
            setAvailableProfiles(others);
            const events = await getEventsFromDB();
            setCreatedEvents(events);
        }
    };

    const setUserProfile = (profile: Profile) => {
        setUserProfileState(profile);
        userProfileRef.current = profile;
        if (isFirebaseConfigured && user && auth?.currentUser) {
            syncUserProfile(profile);
        }
    };

    const startChat = (profile: Profile) => {
        if (!activeChats.find(p => p.id === profile.id)) {
            setActiveChats(prev => [profile, ...prev]);
        }
    };

    const closeChat = (profileId: string) => {
        setActiveChats(prev => prev.filter(p => p.id !== profileId));
    };

    const updateUserBio = (newBio: string) => {
        setUserProfile({ ...userProfile, description: newBio });
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const clearNotifications = () => setNotifications([]);

    const createEvent = async (event: MatchEvent) => {
        event.zone = detectZone(event.location);
        event.createdAt = new Date().toISOString();
        setCreatedEvents(prev => [event, ...prev]);
        await createEventInDB(event);
    };

    const completeOnboarding = (data: Partial<Profile>) => {
        const updatedProfile = { ...userProfile, ...data };
        setUserProfile(updatedProfile);
        setNeedsOnboarding(false);
    };

    const clearDeepLink = () => setDeepLinkProfileId(null);

    // ── Club methods ──────────────────────────────────────────

    const foundClub = async (
        name: string, location: string, formats: string[], zone?: Zone
    ): Promise<Club | null> => {
        const club = await createClub(userProfile, name, location, formats, zone);
        if (club) {
            setUserClubs(prev => [club, ...prev]);
            // Actualizar clubIds en el perfil local
            const updatedProfile = {
                ...userProfile,
                clubIds: [...(userProfile.clubIds || []), club.id]
            };
            setUserProfileState(updatedProfile);
            userProfileRef.current = updatedProfile;
            addNotification({
                type: 'SYSTEM',
                title: '¡Club fundado!',
                message: `${name} fue creado. Tu código: ${club.inviteCode}`
            });
        }
        return club;
    };

    const joinClub = async (
        inviteCode: string
    ): Promise<{ success: boolean; message: string; club?: Club }> => {
        const result = await joinClubByCode(userProfile, inviteCode);
        if (result.success && result.club) {
            setUserClubs(prev => [result.club!, ...prev]);
            const updatedProfile = {
                ...userProfile,
                clubIds: [...(userProfile.clubIds || []), result.club.id]
            };
            setUserProfileState(updatedProfile);
            userProfileRef.current = updatedProfile;
            addNotification({ type: 'SYSTEM', title: '¡Te uniste!', message: result.message });
        }
        return result;
    };

    const kickClubMember = async (clubId: string, memberId: string): Promise<boolean> => {
        const ok = await kickMember(clubId, memberId, userProfile.id);
        if (ok) {
            setUserClubs(prev =>
                prev.map(c => c.id === clubId
                    ? { ...c, membersCount: Math.max(0, c.membersCount - 1) }
                    : c
                )
            );
        }
        return ok;
    };

    const assignViceCaptain = async (clubId: string, newViceId: string): Promise<boolean> => {
        return setViceCaptain(clubId, newViceId, userProfile.id);
    };

    const setClubAvailability = async (
        clubId: string,
        status: 'AVAILABLE' | 'UNAVAILABLE',
        needsPlayers: boolean,
        spots: number
    ): Promise<boolean> => {
        const ok = await updateClubAvailability(clubId, status, needsPlayers, spots);
        if (ok) {
            setUserClubs(prev =>
                prev.map(c => c.id === clubId
                    ? { ...c, availabilityStatus: status, needsPlayers, spotsNeeded: spots }
                    : c
                )
            );
        }
        return ok;
    };

    const fetchClubMembers = async (clubId: string): Promise<ClubMember[]> => {
        return getClubMembers(clubId);
    };

    const refreshClubsNeedingPlayers = async (zone?: Zone) => {
        const clubs = await getClubsNeedingPlayers(zone);
        setClubsNeedingPlayers(clubs);
    };

    // ── Join Request methods ───────────────────────────────────

    const requestJoinClub = async (club: Club, message?: string): Promise<boolean> => {
        const ok = await sendJoinRequest(userProfile, club, message);
        if (ok) {
            addNotification({
                type: 'SYSTEM',
                title: 'Solicitud enviada',
                message: `Le pediste unirte a ${club.name}. El capitán tiene que aceptarte.`
            });
        }
        return ok;
    };

    const fetchJoinRequests = async (clubId: string): Promise<JoinRequest[]> => {
        return getClubJoinRequests(clubId);
    };

    const handleJoinRequest = async (
        request: JoinRequest,
        status: 'ACCEPTED' | 'REJECTED'
    ): Promise<boolean> => {
        const ok = await respondToJoinRequest(request, status, userProfile.id);
        if (ok && status === 'ACCEPTED') {
            // Actualizar membersCount local
            setUserClubs(prev =>
                prev.map(c => c.id === request.clubId
                    ? { ...c, membersCount: c.membersCount + 1 }
                    : c
                )
            );
            addNotification({
                type: 'SYSTEM',
                title: 'Nuevo miembro',
                message: `${request.playerName} se unió al equipo.`
            });
        }
        return ok;
    };

    // ── Match methods ──────────────────────────────────────────

    const confirmMatch = async (
        homeId: string, awayId: string,
        homeType: 'club' | 'user', awayType: 'club' | 'user',
        chatId: string, date: string, time: string,
        location: string, format: string, zone?: Zone
    ): Promise<FutMatch | null> => {
        return createMatch(homeId, awayId, homeType, awayType, chatId, date, time, location, format, zone);
    };

    const loadMatchResult = async (
        matchId: string, myScore: number, rivalScore: number
    ): Promise<{ confirmed: boolean; conflict: boolean }> => {
        const result = await submitMatchResult(matchId, userProfile.id, myScore, rivalScore);
        if (result.confirmed) {
            addNotification({
                type: 'SYSTEM',
                title: '✅ Resultado confirmado',
                message: 'Los dos equipos coincidieron. ¡Resultado guardado!'
            });
            // Quitar de pendientes
            setPendingResultMatches(prev => prev.filter(m => m.id !== matchId));
        } else if (result.conflict) {
            addNotification({
                type: 'SYSTEM',
                title: '⚠️ Conflicto de resultado',
                message: 'El rival cargó un resultado diferente. Hablen para resolverlo.'
            });
        }
        return result;
    };

    // ── Urgent Post methods ───────────────────────────────────

    const refreshUrgentPosts = async () => {
        const posts = await getUrgentPosts(userProfile.zone);
        setUrgentPosts(posts);
    };

    const publishUrgentPost = async (
        post: Omit<UrgentPost, 'id' | 'createdAt' | 'expiresAt'>
    ): Promise<UrgentPost | null> => {
        const created = await createUrgentPost(post);
        if (created) {
            setUrgentPosts(prev => [created, ...prev]);
            addNotification({
                type: 'SYSTEM',
                title: 'Publicado',
                message: 'Tu búsqueda urgente está activa por 48hs.'
            });
        }
        return created;
    };

    const removeUrgentPost = async (postId: string): Promise<boolean> => {
        const ok = await deleteUrgentPost(postId, userProfile.id);
        if (ok) setUrgentPosts(prev => prev.filter(p => p.id !== postId));
        return ok;
    };

    return (
        <AppContext.Provider value={{
            // Existente
            user,
            userProfile,
            setUserProfile,
            availableProfiles,
            refreshCommunity,
            activeChats,
            startChat,
            closeChat,
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
            checkVerification,
            resendVerification,
            resetPassword,
            logout,
            createdEvents,
            createEvent,
            needsOnboarding,
            profileReady,
            completeOnboarding,
            deepLinkProfileId,
            clearDeepLink,
            // Clubs
            userClubs,
            isLoadingClubs,
            foundClub,
            joinClub,
            kickClubMember,
            assignViceCaptain,
            setClubAvailability,
            fetchClubMembers,
            clubsNeedingPlayers,
            refreshClubsNeedingPlayers,
            // Join requests
            requestJoinClub,
            fetchJoinRequests,
            handleJoinRequest,
            // Matches
            confirmMatch,
            loadMatchResult,
            pendingResultMatches,
            refreshPendingResults,
            // Urgente
            urgentPosts,
            publishUrgentPost,
            refreshUrgentPosts,
            removeUrgentPost,
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
