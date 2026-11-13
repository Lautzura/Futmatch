/**
 * clubService.ts
 * 
 * Servicio nuevo para las colecciones clubs/, matches/ y joinRequests/.
 * No modifica firebaseService.ts existente — funciona en paralelo.
 * 
 * Colecciones que maneja:
 *   clubs/{clubId}
 *   clubs/{clubId}/members/{userId}
 *   matches/{matchId}
 *   joinRequests/{requestId}
 */

import { db } from '../firebaseConfig';
import { notifyPush } from './pushService';
import {
    doc,
    setDoc,
    getDoc,
    collection,
    getDocs,
    updateDoc,
    deleteDoc,
    addDoc,
    query,
    where,
    orderBy,
    arrayUnion,
    arrayRemove,
    increment,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import {
    Club,
    ClubMember,
    ClubRole,
    FutMatch,
    JoinRequest,
    JoinRequestStatus,
    MatchStatus,
    Profile,
    SkillLevel,
    Zone
} from '../types';

// ─── Helpers ─────────────────────────────────────────────────────

const handleError = (fn: string, error: any) => {
    console.error(`[clubService.${fn}]`, error);
};

const generateInviteCode = (): string => {
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TM-${suffix}`;
};

// ─── CLUBS ───────────────────────────────────────────────────────

/**
 * Crear un club nuevo.
 * El fundador queda automáticamente como capitán y primer miembro.
 */
export const createClub = async (
    captainProfile: Profile,
    clubName: string,
    location: string,
    formats: string[],
    zone?: Zone
): Promise<Club | null> => {
    if (!db) return null;
    try {
        const clubRef = doc(collection(db, 'clubs'));
        const clubId = clubRef.id;
        const now = new Date().toISOString();

        const newClub: Club = {
            id: clubId,
            name: clubName,
            imageUrl: captainProfile.teamImageUrl || 'https://cdn-icons-png.flaticon.com/512/1533/1533913.png',
            location,
            zone: zone || captainProfile.zone,
            captainId: captainProfile.id,
            inviteCode: generateInviteCode(),
            skillLevel: captainProfile.skillLevel || SkillLevel.AMATEUR,
            formats,
            description: `Equipo fundado por ${captainProfile.name}.`,
            stats: { matchesPlayed: 0, wins: 0 },
            rating: 5.0,
            ratingCount: 0,
            availabilityStatus: 'AVAILABLE',
            needsPlayers: false,
            spotsNeeded: 0,
            membersCount: 1,
            attributes: captainProfile.attributes,
            createdAt: now,
        };

        // 1. Crear el club
        await setDoc(clubRef, newClub);

        // 2. Agregar al capitán como miembro
        const memberRef = doc(db, 'clubs', clubId, 'members', captainProfile.id);
        const captain: ClubMember = {
            userId: captainProfile.id,
            role: 'captain',
            position: 'C',
            joinedAt: now,
            name: captainProfile.name,
            imageUrl: captainProfile.imageUrl,
        };
        await setDoc(memberRef, captain);

        // 3. Actualizar el perfil del usuario: agregar clubId
        await updateDoc(doc(db, 'users', captainProfile.id), {
            clubIds: arrayUnion(clubId),
        });

        // 4. Crear el chat grupal del club
        await setDoc(doc(db, 'chats', `group_${clubId}`), {
            type: 'GROUP',
            clubId,
            participants: [captainProfile.id],
            lastMessage: {
                text: `¡${clubName} fue fundado!`,
                senderId: 'system',
                timestamp: new Date(),
            },
            createdAt: now,
        });

        console.log(`[clubService] Club creado: ${clubName} (${clubId})`);
        return newClub;
    } catch (error) {
        handleError('createClub', error);
        return null;
    }
};

/**
 * Obtener un club por ID.
 */
export const getClub = async (clubId: string): Promise<Club | null> => {
    if (!db) return null;
    try {
        const snap = await getDoc(doc(db, 'clubs', clubId));
        return snap.exists() ? (snap.data() as Club) : null;
    } catch (error) {
        handleError('getClub', error);
        return null;
    }
};

/**
 * Obtener todos los clubs de un usuario (por sus clubIds).
 */
export const getUserClubs = async (clubIds: string[]): Promise<Club[]> => {
    if (!db || !clubIds.length) return [];
    try {
        const clubs: Club[] = [];
        for (const id of clubIds) {
            const club = await getClub(id);
            if (club) clubs.push(club);
        }
        return clubs;
    } catch (error) {
        handleError('getUserClubs', error);
        return [];
    }
};

/**
 * Auto-reparación al abrir la app:
 *  - Si te sacaron de un club, lo quita de tu lista de clubes.
 *  - Si sos miembro pero no figurás en el chat grupal (bug viejo que pisaba
 *    la lista), te vuelve a sumar.
 * Devuelve la lista de clubIds corregida.
 */
export const repairMyClubs = async (userId: string, clubIds: string[]): Promise<string[]> => {
    if (!db || !userId || !clubIds.length) return clubIds;
    const stillMember: string[] = [];
    for (const clubId of clubIds) {
        try {
            const memberSnap = await getDoc(doc(db, 'clubs', clubId, 'members', userId));
            if (!memberSnap.exists()) continue;
            stillMember.push(clubId);
            await updateDoc(doc(db, 'chats', `group_${clubId}`), {
                participants: arrayUnion(userId),
            }).catch(() => {});
        } catch {
            stillMember.push(clubId); // ante la duda (sin conexión, etc.) no tocamos nada
        }
    }
    if (stillMember.length !== clubIds.length) {
        await updateDoc(doc(db, 'users', userId), { clubIds: stillMember }).catch(() => {});
    }
    return stillMember;
};

/**
 * Obtener los miembros de un club.
 */
export const getClubMembers = async (clubId: string): Promise<ClubMember[]> => {
    if (!db) return [];
    try {
        const snap = await getDocs(collection(db, 'clubs', clubId, 'members'));
        return snap.docs.map(d => d.data() as ClubMember);
    } catch (error) {
        handleError('getClubMembers', error);
        return [];
    }
};

/**
 * Unirse a un club mediante código de invitación.
 */
export const joinClubByCode = async (
    playerProfile: Profile,
    inviteCode: string
): Promise<{ success: boolean; message: string; club?: Club }> => {
    if (!db) return { success: false, message: 'Sin conexión.' };
    try {
        // Buscar el club por código
        const q = query(
            collection(db, 'clubs'),
            where('inviteCode', '==', inviteCode.toUpperCase())
        );
        const snap = await getDocs(q);

        if (snap.empty) {
            return { success: false, message: 'Código de equipo no válido.' };
        }

        const clubDoc = snap.docs[0];
        const club = clubDoc.data() as Club;

        // Verificar si ya es miembro
        const memberSnap = await getDoc(
            doc(db, 'clubs', club.id, 'members', playerProfile.id)
        );
        if (memberSnap.exists()) {
            return { success: false, message: 'Ya sos miembro de este equipo.' };
        }

        // Verificar límite de 15
        if (club.membersCount >= 15) {
            return { success: false, message: 'El equipo está completo (máx. 15 jugadores).' };
        }

        const now = new Date().toISOString();

        // 1. Agregar miembro
        const newMember: ClubMember = {
            userId: playerProfile.id,
            role: 'member',
            joinedAt: now,
            name: playerProfile.name,
            imageUrl: playerProfile.imageUrl,
        };
        await setDoc(
            doc(db, 'clubs', club.id, 'members', playerProfile.id),
            newMember
        );

        // 2. Actualizar contador del club
        await updateDoc(doc(db, 'clubs', club.id), {
            membersCount: increment(1),
        });

        // 3. Actualizar perfil del jugador
        await updateDoc(doc(db, 'users', playerProfile.id), {
            clubIds: arrayUnion(club.id),
        });

        // 4. Agregar al chat grupal
        await setDoc(
            doc(db, 'chats', `group_${club.id}`),
            { participants: arrayUnion(playerProfile.id) },
            { merge: true }
        );

        return {
            success: true,
            message: `Te uniste a ${club.name}. ¡Revisá el chat grupal!`,
            club,
        };
    } catch (error) {
        handleError('joinClubByCode', error);
        return { success: false, message: 'Error de conexión.' };
    }
};

/**
 * Expulsar a un miembro del club.
 * Solo puede hacerlo el capitán o vice.
 */
export const kickMember = async (
    clubId: string,
    memberId: string,
    requesterId: string
): Promise<boolean> => {
    if (!db) return false;
    try {
        const club = await getClub(clubId);
        if (!club) return false;

        // Verificar permisos
        if (club.captainId !== requesterId && club.viceCaptainId !== requesterId) {
            console.warn('[clubService.kickMember] Sin permisos.');
            return false;
        }

        // No se puede expulsar al capitán
        if (memberId === club.captainId) return false;

        // 1. Eliminar de la subcolección
        await deleteDoc(doc(db, 'clubs', clubId, 'members', memberId));

        // 2. Decrementar contador
        await updateDoc(doc(db, 'clubs', clubId), {
            membersCount: increment(-1),
        });

        // 3. Sacarlo del chat grupal del club
        await updateDoc(doc(db, 'chats', `group_${clubId}`), {
            participants: arrayRemove(memberId),
        }).catch(() => {});

        // 4. El perfil del expulsado (clubIds) lo corrige su propia app la próxima
        //    vez que la abra (ver repairMyClubs) — por seguridad, nadie puede
        //    editar el perfil de otro usuario.

        return true;
    } catch (error) {
        handleError('kickMember', error);
        return false;
    }
};

/**
 * Asignar vice-capitán.
 */
export const setViceCaptain = async (
    clubId: string,
    newViceId: string,
    requesterId: string
): Promise<boolean> => {
    if (!db) return false;
    try {
        const club = await getClub(clubId);
        if (!club || club.captainId !== requesterId) return false;

        await updateDoc(doc(db, 'clubs', clubId), { viceCaptainId: newViceId });
        await updateDoc(doc(db, 'clubs', clubId, 'members', newViceId), { role: 'vice' });
        return true;
    } catch (error) {
        handleError('setViceCaptain', error);
        return false;
    }
};

/**
 * Un jugador abandona el club por su cuenta.
 * El capitán NO puede usar esto directamente — primero tiene que
 * transferir la capitanía a otro miembro (o ser el único miembro,
 * en cuyo caso simplemente se queda sin dueño y desaparece de "mis clubes").
 */
export const leaveClub = async (
    clubId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> => {
    if (!db) return { success: false, error: 'Sin conexión a la base de datos.' };
    try {
        const club = await getClub(clubId);
        if (!club) return { success: false, error: 'El club ya no existe.' };

        if (club.captainId === userId && club.membersCount > 1) {
            return { success: false, error: 'Sos el capitán — primero transferí la capitanía a otro miembro antes de irte.' };
        }

        await deleteDoc(doc(db, 'clubs', clubId, 'members', userId));
        await updateDoc(doc(db, 'clubs', clubId), { membersCount: increment(-1) });

        // Sacarlo también del chat grupal del club
        await updateDoc(doc(db, 'chats', `group_${clubId}`), {
            participants: arrayRemove(userId),
        }).catch(() => {}); // si el chat no existe por algún motivo, no frenamos el resto

        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const data = userDoc.data() as Profile;
            const updatedClubIds = (data.clubIds || []).filter(id => id !== clubId);
            await updateDoc(doc(db, 'users', userId), { clubIds: updatedClubIds });
        }

        // Si era el vice, liberamos ese cargo también
        if (club.viceCaptainId === userId) {
            await updateDoc(doc(db, 'clubs', clubId), { viceCaptainId: null });
        }

        return { success: true };
    } catch (error) {
        handleError('leaveClub', error);
        return { success: false, error: 'No se pudo salir del club. Intentá de nuevo.' };
    }
};

/**
 * El capitán le pasa el mando a otro miembro del club.
 * El capitán anterior queda como miembro común (o vice, si así se elige).
 */
export const transferCaptaincy = async (
    clubId: string,
    newCaptainId: string,
    currentCaptainId: string
): Promise<{ success: boolean; error?: string }> => {
    if (!db) return { success: false, error: 'Sin conexión a la base de datos.' };
    try {
        const club = await getClub(clubId);
        if (!club) return { success: false, error: 'El club ya no existe.' };
        if (club.captainId !== currentCaptainId) return { success: false, error: 'Solo el capitán actual puede transferir el mando.' };
        if (newCaptainId === currentCaptainId) return { success: false, error: 'Ya sos el capitán.' };

        const memberDoc = await getDoc(doc(db, 'clubs', clubId, 'members', newCaptainId));
        if (!memberDoc.exists()) return { success: false, error: 'Esa persona no es miembro del club.' };

        // Primero los roles (mientras todavía somos capitán, las reglas lo permiten)
        // y al final el cambio de capitán en el club.
        await updateDoc(doc(db, 'clubs', clubId, 'members', newCaptainId), { role: 'captain' });
        await updateDoc(doc(db, 'clubs', clubId, 'members', currentCaptainId), { role: 'member' });
        await updateDoc(doc(db, 'clubs', clubId), {
            captainId: newCaptainId,
            // Si el nuevo capitán era el vice, ese puesto queda vacante; si no, no tocamos el vice actual
            viceCaptainId: club.viceCaptainId === newCaptainId ? null : (club.viceCaptainId ?? null),
        });

        return { success: true };
    } catch (error) {
        handleError('transferCaptaincy', error);
        return { success: false, error: 'No se pudo transferir la capitanía. Intentá de nuevo.' };
    }
};

/**
 * Editar nombre, zona o formato del club — solo el capitán.
 */
export const editClub = async (
    clubId: string,
    updates: { name?: string; location?: string; formats?: string[] },
    requesterId: string
): Promise<{ success: boolean; error?: string }> => {
    if (!db) return { success: false, error: 'Sin conexión a la base de datos.' };
    try {
        const club = await getClub(clubId);
        if (!club) return { success: false, error: 'El club ya no existe.' };
        if (club.captainId !== requesterId) return { success: false, error: 'Solo el capitán puede editar los datos del club.' };

        const cleanUpdates: Record<string, string | string[]> = {};
        if (updates.name?.trim()) cleanUpdates.name = updates.name.trim();
        if (updates.location?.trim()) cleanUpdates.location = updates.location.trim();
        if (updates.formats && updates.formats.length > 0) cleanUpdates.formats = updates.formats;

        if (Object.keys(cleanUpdates).length === 0) return { success: false, error: 'No hay nada para actualizar.' };

        await updateDoc(doc(db, 'clubs', clubId), cleanUpdates);
        return { success: true };
    } catch (error) {
        handleError('editClub', error);
        return { success: false, error: 'No se pudo actualizar el club. Intentá de nuevo.' };
    }
};

/**
 * Actualizar disponibilidad y si busca jugadores.
 */
export const updateClubAvailability = async (
    clubId: string,
    availabilityStatus: 'AVAILABLE' | 'UNAVAILABLE',
    needsPlayers: boolean,
    spotsNeeded: number
): Promise<boolean> => {
    if (!db) return false;
    try {
        await updateDoc(doc(db, 'clubs', clubId), {
            availabilityStatus,
            needsPlayers,
            spotsNeeded,
        });
        return true;
    } catch (error) {
        handleError('updateClubAvailability', error);
        return false;
    }
};

/**
 * Obtener clubs que buscan jugadores en una zona.
 */
export const getClubsNeedingPlayers = async (zone?: Zone): Promise<Club[]> => {
    if (!db) return [];
    try {
        let q = query(
            collection(db, 'clubs'),
            where('needsPlayers', '==', true),
            where('availabilityStatus', '==', 'AVAILABLE')
        );
        const snap = await getDocs(q);
        let clubs = snap.docs.map(d => d.data() as Club);

        if (zone && zone !== Zone.UNKNOWN) {
            clubs = clubs.filter(c => c.zone === zone);
        }

        return clubs;
    } catch (error) {
        handleError('getClubsNeedingPlayers', error);
        return [];
    }
};

// ─── JOIN REQUESTS ────────────────────────────────────────────────

/**
 * Jugador suelto solicita unirse a un club.
 */
export const sendJoinRequest = async (
    playerProfile: Profile,
    club: Club,
    message?: string
): Promise<boolean> => {
    if (!db) return false;
    try {
        // Verificar que no tenga una solicitud pendiente
        const q = query(
            collection(db, 'joinRequests'),
            where('clubId', '==', club.id),
            where('playerId', '==', playerProfile.id),
            where('status', '==', 'PENDING')
        );
        const existing = await getDocs(q);
        if (!existing.empty) return false;

        const request: Omit<JoinRequest, 'id'> = {
            clubId: club.id,
            clubName: club.name,
            playerId: playerProfile.id,
            playerName: playerProfile.name,
            playerImageUrl: playerProfile.imageUrl,
            message: message || '',
            status: 'PENDING',
            createdAt: new Date().toISOString(),
        };

        const ref = await addDoc(collection(db, 'joinRequests'), request);

        // Push al capitán (y vice) del club — apenas se crea la solicitud
        notifyPush({ type: 'joinRequest', requestId: ref.id });

        // Guardar el id generado
        await updateDoc(ref, { id: ref.id });

        return true;
    } catch (error) {
        handleError('sendJoinRequest', error);
        return false;
    }
};

/**
 * Obtener solicitudes pendientes para un club.
 */
export const getClubJoinRequests = async (clubId: string): Promise<JoinRequest[]> => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, 'joinRequests'),
            where('clubId', '==', clubId),
            where('status', '==', 'PENDING')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as JoinRequest);
    } catch (error) {
        handleError('getClubJoinRequests', error);
        return [];
    }
};

/**
 * Capitán acepta o rechaza una solicitud.
 */
export const respondToJoinRequest = async (
    request: JoinRequest,
    status: 'ACCEPTED' | 'REJECTED',
    requesterId: string
): Promise<boolean> => {
    if (!db) return false;
    try {
        const club = await getClub(request.clubId);
        if (!club) return false;

        // Solo capitán o vice pueden responder
        if (club.captainId !== requesterId && club.viceCaptainId !== requesterId) {
            return false;
        }

        // Actualizar estado de la solicitud
        const reqQuery = query(
            collection(db, 'joinRequests'),
            where('clubId', '==', request.clubId),
            where('playerId', '==', request.playerId),
            where('status', '==', 'PENDING')
        );
        const snap = await getDocs(reqQuery);
        for (const d of snap.docs) {
            await updateDoc(d.ref, { status });
        }

        if (status === 'ACCEPTED') {
            const now = new Date().toISOString();

            // 1. Agregar miembro al club
            const newMember: ClubMember = {
                userId: request.playerId,
                role: 'member',
                joinedAt: now,
                name: request.playerName,
                imageUrl: request.playerImageUrl,
            };
            await setDoc(
                doc(db, 'clubs', request.clubId, 'members', request.playerId),
                newMember
            );

            // 2. Actualizar contador
            await updateDoc(doc(db, 'clubs', request.clubId), {
                membersCount: increment(1),
            });

            // 3. Actualizar perfil del jugador
            await updateDoc(doc(db, 'users', request.playerId), {
                clubIds: arrayUnion(request.clubId),
            });

            // 4. Agregar al chat grupal
            await setDoc(
                doc(db, 'chats', `group_${request.clubId}`),
                { participants: arrayUnion(request.playerId) },
                { merge: true }
            );
        }

        return true;
    } catch (error) {
        handleError('respondToJoinRequest', error);
        return false;
    }
};

// ─── MATCHES ─────────────────────────────────────────────────────

/**
 * Crear un partido cuando se acepta un desafío en el chat.
 */
export const createMatch = async (
    homeId: string,
    awayId: string,
    homeType: 'club' | 'user',
    awayType: 'club' | 'user',
    chatId: string,
    date: string,
    time: string,
    location: string,
    format: string,
    zone?: Zone
): Promise<FutMatch | null> => {
    if (!db) return null;
    try {
        const matchRef = doc(collection(db, 'matches'));
        const matchId = matchRef.id;

        // Calcular scheduledAt combinando date + time
        const scheduledAt = new Date(`${date}T${time || '00:00'}:00`).toISOString();

        const newMatch: FutMatch = {
            id: matchId,
            homeId,
            awayId,
            homeType,
            awayType,
            chatId,
            date,
            time,
            location,
            zone,
            format,
            status: 'PENDING',
            homeConfirmed: false,
            awayConfirmed: false,
            resultConfirmed: false,
            scheduledAt,
            createdAt: new Date().toISOString(),
        };

        await setDoc(matchRef, newMatch);

        // Vincular el matchId al chat
        await setDoc(
            doc(db, 'chats', chatId),
            { matchId },
            { merge: true }
        );

        console.log(`[clubService] Partido creado: ${matchId}`);
        return newMatch;
    } catch (error) {
        handleError('createMatch', error);
        return null;
    }
};

/**
 * Obtener un partido por ID.
 */
export const getMatch = async (matchId: string): Promise<FutMatch | null> => {
    if (!db) return null;
    try {
        const snap = await getDoc(doc(db, 'matches', matchId));
        return snap.exists() ? (snap.data() as FutMatch) : null;
    } catch (error) {
        handleError('getMatch', error);
        return null;
    }
};

/**
 * Un equipo carga su versión del resultado.
 * Si los dos lados coinciden → se confirma automáticamente.
 * Si no coinciden → status = CONFLICT.
 */
export const submitMatchResult = async (
    matchId: string,
    submitterId: string,
    myScore: number,
    rivalScore: number
): Promise<{ confirmed: boolean; conflict: boolean }> => {
    if (!db) return { confirmed: false, conflict: false };
    try {
        const match = await getMatch(matchId);
        if (!match) return { confirmed: false, conflict: false };

        const isHome = match.homeId === submitterId;
        const isAway = match.awayId === submitterId;
        if (!isHome && !isAway) return { confirmed: false, conflict: false };

        const updates: Partial<FutMatch> = {};

        if (isHome) {
            updates.homeScore = myScore;
            updates.homeConfirmed = true;
        } else {
            updates.awayScore = rivalScore;
            updates.awayConfirmed = true;
        }

        // Verificar si el otro lado ya cargó
        const updatedHome = isHome ? true : match.homeConfirmed;
        const updatedAway = isAway ? true : match.awayConfirmed;
        const currentHomeScore = isHome ? myScore : match.homeScore;
        const currentAwayScore = isAway ? rivalScore : match.awayScore;

        if (updatedHome && updatedAway) {
            // Los dos cargaron — verificar si coinciden
            if (currentHomeScore === currentAwayScore ||
                (isHome && myScore === (match.awayScore ?? -1) + 1 - 1) ||
                currentHomeScore !== undefined && currentAwayScore !== undefined &&
                currentHomeScore === currentHomeScore) {

                // Coinciden si home ve el mismo resultado que away
                const homeSeesHome = isHome ? myScore : match.homeScore;
                const homeSeesAway = isHome ? rivalScore : match.awayScore;
                const awaySeesHome = isAway ? rivalScore : match.homeScore;
                const awaySeesAway = isAway ? myScore : match.awayScore;

                const coincide =
                    homeSeesHome === awaySeesHome &&
                    homeSeesAway === awaySeesAway;

                if (coincide) {
                    updates.status = 'PLAYED';
                    updates.resultConfirmed = true;
                } else {
                    updates.status = 'CONFLICT';
                }
            }
        }

        await updateDoc(doc(db, 'matches', matchId), updates as any);

        const confirmed = updates.status === 'PLAYED';
        const conflict = updates.status === 'CONFLICT';

        return { confirmed, conflict };
    } catch (error) {
        handleError('submitMatchResult', error);
        return { confirmed: false, conflict: false };
    }
};

/**
 * Obtener partidos de un equipo o usuario.
 */
export const getMatchesForEntity = async (entityId: string): Promise<FutMatch[]> => {
    if (!db) return [];
    try {
        const [homeSnap, awaySnap] = await Promise.all([
            getDocs(query(collection(db, 'matches'), where('homeId', '==', entityId))),
            getDocs(query(collection(db, 'matches'), where('awayId', '==', entityId))),
        ]);

        const matches: FutMatch[] = [
            ...homeSnap.docs.map(d => d.data() as FutMatch),
            ...awaySnap.docs.map(d => d.data() as FutMatch),
        ];

        // Ordenar por fecha descendente
        return matches.sort((a, b) =>
            new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
        );
    } catch (error) {
        handleError('getMatchesForEntity', error);
        return [];
    }
};

/**
 * Obtener partidos pendientes de resultado (para el recordatorio de 24hs).
 * En producción esto correría en un Cloud Function.
 * En la app lo llamamos al abrir la pantalla de partidos.
 */
export const getPendingResultMatches = async (entityId: string): Promise<FutMatch[]> => {
    if (!db) return [];
    try {
        const all = await getMatchesForEntity(entityId);
        const now = new Date();
        return all.filter(m => {
            if (m.status !== 'PENDING') return false;
            const scheduled = new Date(m.scheduledAt);
            const hoursElapsed = (now.getTime() - scheduled.getTime()) / (1000 * 60 * 60);
            return hoursElapsed > 1;
        });
    } catch (error) {
        handleError('getPendingResultMatches', error);
        return [];
    }
};

// ─── URGENT POSTS ─────────────────────────────────────────────────

import { UrgentPost, UrgentPostType, UrgentWhen, SkillLevel as SkillLevelType } from '../types';

/**
 * Publicar una búsqueda urgente.
 * Expira automáticamente a las 48hs.
 */
export const createUrgentPost = async (
    post: Omit<UrgentPost, 'id' | 'createdAt' | 'expiresAt'>
): Promise<UrgentPost | null> => {
    if (!db) return null;
    try {
        const ref = doc(collection(db, 'urgentPosts'));
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
        const newPost: UrgentPost = {
            ...post,
            id: ref.id,
            createdAt: now.toISOString(),
            expiresAt,
        };
        await setDoc(ref, newPost);
        // Push a los jugadores de la misma zona
        notifyPush({ type: 'urgent', postId: ref.id });
        return newPost;
    } catch (error) {
        handleError('createUrgentPost', error);
        return null;
    }
};

/**
 * Obtener publicaciones urgentes activas por zona.
 * Filtra las expiradas en el cliente.
 */
export const getUrgentPosts = async (zone?: string): Promise<UrgentPost[]> => {
    if (!db) return [];
    try {
        let q = zone && zone !== 'Otra'
            ? query(collection(db, 'urgentPosts'), where('zone', '==', zone))
            : query(collection(db, 'urgentPosts'));

        const snap = await getDocs(q);
        const now = new Date();

        return snap.docs
            .map(d => d.data() as UrgentPost)
            .filter(p => new Date(p.expiresAt) > now)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
        handleError('getUrgentPosts', error);
        return [];
    }
};

/**
 * Eliminar una publicación urgente propia.
 */
export const deleteUrgentPost = async (postId: string, authorId: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const snap = await getDoc(doc(db, 'urgentPosts', postId));
        if (!snap.exists()) return false;
        if (snap.data().authorId !== authorId) return false;
        await deleteDoc(doc(db, 'urgentPosts', postId));
        return true;
    } catch (error) {
        handleError('deleteUrgentPost', error);
        return false;
    }
};
