export function memberStorageKey(leagueId: string) {
  return `ipl-fantasy-member-${leagueId}`;
}

export function getMemberId(leagueId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(memberStorageKey(leagueId));
}

export function setMemberId(leagueId: string, memberId: string) {
  window.localStorage.setItem(memberStorageKey(leagueId), memberId);
}

export function gamePlayerStorageKey(roomId: string) {
  return `ipl-fantasy-game-player-${roomId}`;
}

export function getGamePlayerId(roomId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(gamePlayerStorageKey(roomId));
}

export function setGamePlayerId(roomId: string, playerId: string) {
  window.localStorage.setItem(gamePlayerStorageKey(roomId), playerId);
}

function normalizeGameDisplayName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function gamePlayerDisplayStorageKey(roomId: string) {
  return `ipl-fantasy-game-player-display-${roomId}`;
}

/** Which Dream11 display name this browser used when joining the room (for home UI). */
export function setGamePlayerDisplayNameForRoom(roomId: string, displayName: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(gamePlayerDisplayStorageKey(roomId), displayName.trim());
}

export function getGamePlayerDisplayNameForRoom(roomId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(gamePlayerDisplayStorageKey(roomId));
}

/** True if we have a saved player id for this room and it matches the given display name. */
export function hasJoinedRoomAsDisplayName(roomId: string, displayName: string): boolean {
  if (!getGamePlayerId(roomId)) return false;
  const stored = getGamePlayerDisplayNameForRoom(roomId);
  if (stored == null) return false;
  return normalizeGameDisplayName(stored) === normalizeGameDisplayName(displayName);
}

/** Remember which game room belongs to a Cricket Data match id (after join). */
export function cricMatchToRoomStorageKey(cricApiMatchId: string) {
  return `ipl-fantasy-cric-match-room-${cricApiMatchId}`;
}

export function setRoomIdForCricMatch(cricApiMatchId: string, roomId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cricMatchToRoomStorageKey(cricApiMatchId), roomId);
}

export function getRoomIdForCricMatch(cricApiMatchId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(cricMatchToRoomStorageKey(cricApiMatchId));
}
