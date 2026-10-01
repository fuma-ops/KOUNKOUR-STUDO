export interface CommunityAccessRequest {
  id: string;
  roomId: string;
  roomName: {
    fr: string;
    ar: string;
  };
  userName: string;
  userEmail?: string;
  userRole?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

const STORAGE_KEY_REQUESTS = 'kounkour_community_access_requests';
const STORAGE_KEY_APPROVED_ROOMS = 'kounkour_approved_private_rooms';

const INITIAL_REQUESTS: CommunityAccessRequest[] = [
  {
    id: 'req-init-1',
    roomId: 'c-private-interieur-oral',
    roomName: {
      fr: 'Cercle Privé : Admissibles à l’Oral • Intérieur 2026',
      ar: 'فضاء خاص : المؤهلون للاختبار الشفوي • الداخلية 2026',
    },
    userName: 'Amine El Fassi',
    userEmail: 'amine.elfassi@gmail.com',
    userRole: 'Technicien Spécialisé',
    reason: 'Convoqué pour l’épreuve orale du concours intérieur le 24 Mai 2026. Convocation N° INT-2026-8834.',
    status: 'pending',
    createdAt: 'Il y a 2 heures',
  },
  {
    id: 'req-init-2',
    roomId: 'c-private-finances-elite',
    roomName: {
      fr: 'Groupe d’Élite : Inspecteurs des Finances & Douanes',
      ar: 'نخبة التفتيش : مفتشو المالية وإدارة الجمارك',
    },
    userName: 'Khadija Bennani',
    userEmail: 'khadija.bennani@outlook.com',
    userRole: 'Master Économie',
    reason: 'Admissible au concours des Administrateurs 2e grade, spécialité Finances Publiques & Fiscalité.',
    status: 'pending',
    createdAt: 'Il y a 5 heures',
  },
];

export function loadCommunityRequests(): CommunityAccessRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(INITIAL_REQUESTS));
      return INITIAL_REQUESTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REQUESTS;
  }
}

export function saveCommunityRequests(requests: CommunityAccessRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
  } catch (e) {
    console.warn('Could not save community requests', e);
  }
}

export function createCommunityRequest(
  roomId: string,
  roomName: { fr: string; ar: string },
  userName: string,
  reason: string,
  userEmail?: string,
  userRole?: string
): CommunityAccessRequest {
  const all = loadCommunityRequests();
  const existingIdx = all.findIndex((r) => r.roomId === roomId && (r.userName === userName || (userEmail && r.userEmail === userEmail)));

  const newReq: CommunityAccessRequest = {
    id: `req-${Date.now()}`,
    roomId,
    roomName,
    userName: userName || 'Candidat_Maroc',
    userEmail,
    userRole: userRole || 'Candidat Concours',
    reason: reason.trim(),
    status: 'pending',
    createdAt: 'À l’instant',
  };

  let nextRequests: CommunityAccessRequest[];
  if (existingIdx >= 0) {
    nextRequests = [...all];
    nextRequests[existingIdx] = newReq;
  } else {
    nextRequests = [newReq, ...all];
  }

  saveCommunityRequests(nextRequests);
  return newReq;
}

export function approveCommunityRequest(requestId: string): CommunityAccessRequest | null {
  const all = loadCommunityRequests();
  const req = all.find((r) => r.id === requestId);
  if (!req) return null;

  req.status = 'approved';
  req.updatedAt = new Date().toISOString();
  saveCommunityRequests(all);

  // Add room to user's approved rooms in local storage
  const approvedRooms = loadApprovedRooms();
  if (!approvedRooms.includes(req.roomId)) {
    approvedRooms.push(req.roomId);
    saveApprovedRooms(approvedRooms);
  }

  return req;
}

export function rejectCommunityRequest(requestId: string): CommunityAccessRequest | null {
  const all = loadCommunityRequests();
  const req = all.find((r) => r.id === requestId);
  if (!req) return null;

  req.status = 'rejected';
  req.updatedAt = new Date().toISOString();
  saveCommunityRequests(all);

  // Remove from approved list if present
  const approvedRooms = loadApprovedRooms().filter((id) => id !== req.roomId);
  saveApprovedRooms(approvedRooms);

  return req;
}

export function loadApprovedRooms(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPROVED_ROOMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveApprovedRooms(rooms: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_APPROVED_ROOMS, JSON.stringify(rooms));
  } catch (e) {
    console.warn('Could not save approved rooms', e);
  }
}

export function isUserApprovedForRoom(roomId: string): boolean {
  const approved = loadApprovedRooms();
  return approved.includes(roomId);
}
