// Pruebas de las reglas de Firestore de FutMatch.
// Simula cada cosa que hace la app con distintos usuarios y verifica
// que lo permitido funcione y lo prohibido se bloquee.
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, getDocs,
  arrayUnion, arrayRemove, increment,
} from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-futmatch',
  firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
});

const as = uid => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

let passed = 0, failed = 0;
async function test(name, fn) {
  await env.clearFirestore();
  await seed();
  try { await fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { failed++; console.log('  ✘ ' + name + '\n      ' + (e && e.message ? e.message.split('\n')[0] : e)); }
}

// Datos iniciales: capitán C, vice V, miembro M, otro usuario X (ajeno), jugador P (quiere entrar)
async function seed() {
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    for (const u of ['C', 'V', 'M', 'X', 'P']) await setDoc(doc(db, 'users', u), { id: u, name: u, clubIds: ['M', 'C', 'V'].includes(u) ? ['club1'] : [], rating: 5, ratingCount: 0 });
    await setDoc(doc(db, 'users', 'ADMIN'), { id: 'ADMIN', isAdmin: true });
    await setDoc(doc(db, 'clubs', 'club1'), { id: 'club1', name: 'Los Pibes', captainId: 'C', viceCaptainId: 'V', membersCount: 3, inviteCode: 'ABC' });
    for (const [u, r] of [['C', 'captain'], ['V', 'vice'], ['M', 'member']]) await setDoc(doc(db, 'clubs/club1/members', u), { userId: u, role: r });
    await setDoc(doc(db, 'chats', 'group_club1'), { type: 'GROUP', clubId: 'club1', participants: ['C', 'V', 'M'] });
    await setDoc(doc(db, 'chats/group_club1/messages', 'poll1'), { senderId: 'C', type: 'poll', text: 'Encuesta', pollData: { question: '¿Sábado?', options: [{ text: 'Sí', votes: [] }], totalVotes: 0 } });
    await setDoc(doc(db, 'chats', 'P_X'), { participants: ['P', 'X'] });
    await setDoc(doc(db, 'chats/P_X/messages', 'ch1'), { senderId: 'X', type: 'challenge', text: 'Desafío', challengeData: { status: 'PENDING', date: '2026-12-01' } });
    await setDoc(doc(db, 'chats/P_X/messages', 'pay1'), { senderId: 'X', type: 'payment', text: 'Vaquita', paymentData: { contributors: [], collected: 0 } });
    await setDoc(doc(db, 'joinRequests', 'req1'), { clubId: 'club1', playerId: 'P', playerName: 'P', status: 'PENDING' });
    await setDoc(doc(db, 'matches', 'm1'), { id: 'm1', homeId: 'P', awayId: 'X', homeType: 'user', awayType: 'user', status: 'PENDING' });
    await setDoc(doc(db, 'matches', 'm2'), { id: 'm2', homeId: 'club1', awayId: 'X', homeType: 'club', awayType: 'user', status: 'PENDING' });
    await setDoc(doc(db, 'events', 'e1'), { id: 'e1', organizerId: 'C', title: 'Torneo' });
    await setDoc(doc(db, 'fields', 'f1'), { status: 'pending', addedBy: 'X' });
  });
}

console.log('\nPerfiles');
await test('cada uno edita su perfil', () => assertSucceeds(updateDoc(doc(as('X'), 'users/X'), { name: 'Nuevo' })));
await test('nadie edita el nombre de otro', () => assertFails(updateDoc(doc(as('X'), 'users/P'), { name: 'Hackeado' })));
await test('calificar al rival (solo reputación)', () => assertSucceeds(updateDoc(doc(as('X'), 'users/P'), { rating: 4.5, ratingCount: 1, reputationTags: { 'Fair Play 🤝': 1 }, negativeReputationTags: {} })));
await test('no se puede tocar otra cosa al calificar', () => assertFails(updateDoc(doc(as('X'), 'users/P'), { rating: 1, isAdmin: true })));
await test('borrar mi propia cuenta', () => assertSucceeds(deleteDoc(doc(as('X'), 'users/X'))));
await test('no borrar la cuenta de otro', () => assertFails(deleteDoc(doc(as('X'), 'users/P'))));
await test('el capitán suma el club al perfil del aceptado', () => assertSucceeds(updateDoc(doc(as('C'), 'users/P'), { clubIds: arrayUnion('club1') })));
await test('el vice también puede', () => assertSucceeds(updateDoc(doc(as('V'), 'users/P'), { clubIds: arrayUnion('club1') })));
await test('un ajeno no puede meter clubes en otro perfil', () => assertFails(updateDoc(doc(as('X'), 'users/P'), { clubIds: arrayUnion('club1') })));
await test('el capitán no puede sacar clubes de otro perfil', () => assertFails(updateDoc(doc(as('C'), 'users/M'), { clubIds: [] })));

console.log('\nChats y mensajes');
await test('leer mi chat', () => assertSucceeds(getDoc(doc(as('M'), 'chats/group_club1'))));
await test('no leer chat ajeno', () => assertFails(getDoc(doc(as('X'), 'chats/group_club1'))));
await test('mandar mensaje al chat del club', () => assertSucceeds(addDoc(collection(as('M'), 'chats/group_club1/messages'), { senderId: 'M', text: 'hola' })));
await test('no mandar mensaje haciéndose pasar por otro', () => assertFails(addDoc(collection(as('M'), 'chats/group_club1/messages'), { senderId: 'C', text: 'hola' })));
await test('actualizar el chat al escribir (sin pisar la lista)', () => assertSucceeds(setDoc(doc(as('M'), 'chats/group_club1'), { lastMessage: { text: 'hola' }, participants: arrayUnion('M') }, { merge: true })));
await test('aceptar un desafío', () => assertSucceeds(updateDoc(doc(as('P'), 'chats/P_X/messages/ch1'), { 'challengeData.status': 'ACCEPTED' })));
await test('votar una encuesta', () => assertSucceeds(updateDoc(doc(as('M'), 'chats/group_club1/messages/poll1'), { 'pollData.options': [{ text: 'Sí', votes: ['M'] }], 'pollData.totalVotes': 1 })));
await test('sumarse a la vaquita', () => assertSucceeds(updateDoc(doc(as('P'), 'chats/P_X/messages/pay1'), { 'paymentData.contributors': ['P'], 'paymentData.collected': 1000 })));
await test('no editar el texto de un mensaje', () => assertFails(updateDoc(doc(as('P'), 'chats/P_X/messages/ch1'), { text: 'cambiado' })));
await test('un ajeno no acepta desafíos de otro chat', () => assertFails(updateDoc(doc(as('M'), 'chats/P_X/messages/ch1'), { 'challengeData.status': 'ACCEPTED' })));
await test('miembro que quedó afuera del chat se vuelve a sumar', async () => {
  await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'chats/group_club1'), { participants: ['C'] }));
  await assertSucceeds(updateDoc(doc(as('M'), 'chats/group_club1'), { participants: arrayUnion('M') }));
});
await test('un ajeno no se puede meter al chat del club', () => assertFails(updateDoc(doc(as('X'), 'chats/group_club1'), { participants: arrayUnion('X') })));
await test('mis chats (lista)', () => assertSucceeds(getDocs(query(collection(as('M'), 'chats'), where('participants', 'array-contains', 'M')))));

console.log('\nClubes');
await test('fundar un club (capitán = yo)', async () => {
  const db = as('X');
  await assertSucceeds(setDoc(doc(db, 'clubs/club2'), { id: 'club2', name: 'Nuevo', captainId: 'X', membersCount: 1 }));
  await assertSucceeds(setDoc(doc(db, 'clubs/club2/members/X'), { userId: 'X', role: 'captain' }));
  await assertSucceeds(setDoc(doc(db, 'chats/group_club2'), { type: 'GROUP', clubId: 'club2', participants: ['X'] }));
});
await test('no fundar un club a nombre de otro', () => assertFails(setDoc(doc(as('X'), 'clubs/club3'), { captainId: 'P' })));
await test('unirse por código (flujo completo)', async () => {
  const db = as('P');
  await assertSucceeds(setDoc(doc(db, 'clubs/club1/members/P'), { userId: 'P', role: 'member' }));
  await assertSucceeds(updateDoc(doc(db, 'clubs/club1'), { membersCount: increment(1) }));
  await assertSucceeds(updateDoc(doc(db, 'users/P'), { clubIds: arrayUnion('club1') }));
  await assertSucceeds(setDoc(doc(db, 'chats/group_club1'), { participants: arrayUnion('P') }, { merge: true }));
});
await test('no autoproclamarse capitán de un club ajeno', () => assertFails(setDoc(doc(as('P'), 'clubs/club1/members/P'), { userId: 'P', role: 'captain' })));
await test('no inflar el contador sin ser miembro', () => assertFails(updateDoc(doc(as('X'), 'clubs/club1'), { membersCount: increment(1) })));
await test('un ajeno no edita el club', () => assertFails(updateDoc(doc(as('X'), 'clubs/club1'), { name: 'Hackeado' })));
await test('capitán edita el club', () => assertSucceeds(updateDoc(doc(as('C'), 'clubs/club1'), { name: 'Los Pibes FC', needsPlayers: true })));
await test('vice edita el club', () => assertSucceeds(updateDoc(doc(as('V'), 'clubs/club1'), { availabilityStatus: 'AVAILABLE' })));
await test('vice no se puede hacer capitán', () => assertFails(updateDoc(doc(as('V'), 'clubs/club1'), { captainId: 'V' })));
await test('capitán nombra vice', async () => {
  const db = as('C');
  await assertSucceeds(updateDoc(doc(db, 'clubs/club1'), { viceCaptainId: 'M' }));
  await assertSucceeds(updateDoc(doc(db, 'clubs/club1/members/M'), { role: 'vice' }));
});
await test('transferir capitanía (orden nuevo)', async () => {
  const db = as('C');
  await assertSucceeds(updateDoc(doc(db, 'clubs/club1/members/M'), { role: 'captain' }));
  await assertSucceeds(updateDoc(doc(db, 'clubs/club1/members/C'), { role: 'member' }));
  await assertSucceeds(updateDoc(doc(db, 'clubs/club1'), { captainId: 'M', viceCaptainId: 'V' }));
});
await test('miembro se va del club (flujo completo)', async () => {
  const db = as('M');
  await assertSucceeds(deleteDoc(doc(db, 'clubs/club1/members/M')));
  await assertSucceeds(updateDoc(doc(db, 'clubs/club1'), { membersCount: increment(-1) }));
  await assertSucceeds(updateDoc(doc(db, 'chats/group_club1'), { participants: arrayRemove('M') }));
  await assertSucceeds(updateDoc(doc(db, 'users/M'), { clubIds: [] }));
});
await test('vice se va y libera el puesto', async () => {
  const db = as('V');
  await assertSucceeds(deleteDoc(doc(db, 'clubs/club1/members/V')));
  await assertSucceeds(updateDoc(doc(db, 'clubs/club1'), { membersCount: increment(-1) }));
  await assertSucceeds(updateDoc(doc(db, 'clubs/club1'), { viceCaptainId: null }));
});
await test('capitán expulsa a un miembro', async () => {
  const db = as('C');
  await assertSucceeds(deleteDoc(doc(db, 'clubs/club1/members/M')));
  await assertSucceeds(updateDoc(doc(db, 'clubs/club1'), { membersCount: increment(-1) }));
  await assertSucceeds(updateDoc(doc(db, 'chats/group_club1'), { participants: arrayRemove('M') }));
});
await test('expulsado limpia su propio perfil', () => assertSucceeds(updateDoc(doc(as('M'), 'users/M'), { clubIds: [] })));
await test('un ajeno no expulsa a nadie', () => assertFails(deleteDoc(doc(as('X'), 'clubs/club1/members/M'))));

console.log('\nSolicitudes para unirse');
await test('pedir unirse + guardar id', async () => {
  const db = as('P');
  const ref = await assertSucceeds(addDoc(collection(db, 'joinRequests'), { clubId: 'club1', playerId: 'P', playerName: 'P', status: 'PENDING' }));
  await assertSucceeds(updateDoc(ref, { id: ref.id }));
});
await test('no pedir a nombre de otro', () => assertFails(addDoc(collection(as('X'), 'joinRequests'), { clubId: 'club1', playerId: 'P', status: 'PENDING' })));
await test('el jugador no se autoacepta', () => assertFails(updateDoc(doc(as('P'), 'joinRequests/req1'), { status: 'ACCEPTED' })));
await test('capitán ve las solicitudes de su club (lista)', () => assertSucceeds(getDocs(query(collection(as('C'), 'joinRequests'), where('clubId', '==', 'club1'), where('status', '==', 'PENDING')))));
await test('el jugador ve sus solicitudes (lista)', () => assertSucceeds(getDocs(query(collection(as('P'), 'joinRequests'), where('playerId', '==', 'P')))));
await test('un ajeno no ve solicitudes del club', () => assertFails(getDocs(query(collection(as('X'), 'joinRequests'), where('clubId', '==', 'club1')))));
await test('capitán acepta (flujo completo)', async () => {
  const db = as('C');
  await assertSucceeds(updateDoc(doc(db, 'joinRequests/req1'), { status: 'ACCEPTED' }));
  await assertSucceeds(setDoc(doc(db, 'clubs/club1/members/P'), { userId: 'P', role: 'member' }));
  await assertSucceeds(updateDoc(doc(db, 'clubs/club1'), { membersCount: increment(1) }));
  await assertSucceeds(updateDoc(doc(db, 'users/P'), { clubIds: arrayUnion('club1') }));
  await assertSucceeds(setDoc(doc(db, 'chats/group_club1'), { participants: arrayUnion('P') }, { merge: true }));
});
await test('vice acepta', () => assertSucceeds(updateDoc(doc(as('V'), 'joinRequests/req1'), { status: 'REJECTED' })));

console.log('\nPartidos');
await test('crear partido en el que juego', () => assertSucceeds(setDoc(doc(as('P'), 'matches/m9'), { homeId: 'P', awayId: 'X', status: 'PENDING' })));
await test('no crear partido entre otros', () => assertFails(setDoc(doc(as('M'), 'matches/m9'), { homeId: 'P', awayId: 'X' })));
await test('cargar resultado de mi partido', () => assertSucceeds(updateDoc(doc(as('X'), 'matches/m1'), { awayScore: 2, status: 'PLAYED' })));
await test('miembro del club carga resultado', () => assertSucceeds(updateDoc(doc(as('M'), 'matches/m2'), { homeScore: 3 })));
await test('un ajeno no toca el partido', () => assertFails(updateDoc(doc(as('M'), 'matches/m1'), { status: 'PLAYED' })));
await test('no cambiar quién juega', () => assertFails(updateDoc(doc(as('X'), 'matches/m1'), { homeId: 'M' })));
await test('cualquiera ve los partidos', () => assertSucceeds(getDoc(doc(anon(), 'matches/m1'))));

console.log('\nTorneos e inscripciones');
await test('crear torneo propio', () => assertSucceeds(setDoc(doc(as('X'), 'events/e2'), { id: 'e2', organizerId: 'X' })));
await test('no crear torneo a nombre de otro', () => assertFails(setDoc(doc(as('X'), 'events/e3'), { organizerId: 'C' })));
await test('organizador genera el fixture', () => assertSucceeds(updateDoc(doc(as('C'), 'events/e1'), { fixture: [] })));
await test('un ajeno no edita el torneo', () => assertFails(updateDoc(doc(as('X'), 'events/e1'), { title: 'x' })));
await test('organizador borra su torneo', () => assertSucceeds(deleteDoc(doc(as('C'), 'events/e1'))));
await test('ver torneos', () => assertSucceeds(getDocs(collection(anon(), 'events'))));
await test('inscribirse', () => assertSucceeds(addDoc(collection(as('P'), 'registrations'), { userId: 'P', tournamentId: 'e1', status: 'PENDING' })));
await test('no inscribir a otro', () => assertFails(addDoc(collection(as('P'), 'registrations'), { userId: 'X', tournamentId: 'e1' })));
await test('ver si ya estoy inscripto', () => assertSucceeds(getDocs(query(collection(as('P'), 'registrations'), where('userId', '==', 'P'), where('tournamentId', '==', 'e1')))));

console.log('\nUrgentes, reportes y canchas');
await test('publicar urgente propio', () => assertSucceeds(setDoc(doc(as('P'), 'urgentPosts/u1'), { authorId: 'P', zone: 'Zona Sur' })));
await test('no publicar urgente a nombre de otro', () => assertFails(setDoc(doc(as('P'), 'urgentPosts/u2'), { authorId: 'X' })));
await test('reportar', () => assertSucceeds(addDoc(collection(as('P'), 'reports'), { reason: 'x' })));
await test('cargar cancha (pendiente)', () => assertSucceeds(addDoc(collection(as('P'), 'fields'), { addedBy: 'P', status: 'pending' })));
await test('no cargarla ya aprobada', () => assertFails(addDoc(collection(as('P'), 'fields'), { addedBy: 'P', status: 'approved' })));
await test('admin aprueba cancha', () => assertSucceeds(updateDoc(doc(as('ADMIN'), 'fields/f1'), { status: 'approved' })));
await test('no-admin no aprueba', () => assertFails(updateDoc(doc(as('X'), 'fields/f1'), { status: 'approved' })));

await env.cleanup();
console.log(`\n${passed} pruebas OK, ${failed} fallaron\n`);
process.exit(failed ? 1 : 0);
