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
