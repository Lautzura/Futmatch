
import { db } from '../firebaseConfig';
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    getDocs, 
    updateDoc, 
    arrayUnion 
} from 'firebase/firestore';
import { Profile, UserType } from '../types';
import { MOCK_PROFILES } from '../constants';

// Utility to remove undefined values which Firestore doesn't support
const toFirestoreSafe = (data: any) => {
    return JSON.parse(JSON.stringify(data, (key, value) => {
        return value === undefined ? null : value;
    }));
};

// Save or Update User Profile
export const syncUserProfile = async (profile: Profile) => {
    if (!db) return;
    try {
        const userRef = doc(db, "users", profile.id);
        const safeData = toFirestoreSafe(profile);
        await setDoc(userRef, safeData, { merge: true });
        console.log("Perfil sincronizado con Firebase");
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            console.warn("Firestore: Permisos insuficientes. Los cambios se mantendrán solo en esta sesión.");
        } else {
            console.error("Error syncing profile:", error);
        }
    }
};

// Fetch all profiles except the current user
export const getCommunityProfiles = async (currentUserId: string): Promise<Profile[]> => {
    if (!db) return []; 
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const profiles: Profile[] = [];
        querySnapshot.forEach((doc) => {
            if (doc.id !== currentUserId) {
                profiles.push(doc.data() as Profile);
            }
        });
        return profiles;
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            console.warn("Firestore: No se pueden cargar perfiles comunitarios (Permisos).");
        } else {
            console.error("Error getting community profiles:", error);
        }
        return [];
    }
};

// Seed database with mock data (Run once if needed)
export const seedDatabase = async () => {
    if (!db) return;
    try {
        const profilesCollection = collection(db, "users");
        const snapshot = await getDocs(profilesCollection);
        if (snapshot.empty) {
            console.log("Database is empty. Ready for real users.");
        }
    } catch (e) {
        // Silent fail for seed on permission issues
    }
};
