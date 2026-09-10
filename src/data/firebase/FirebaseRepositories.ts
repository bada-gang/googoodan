/**
 * Firestore 기반 저장소 구현. (명세 72 · Phase 8)
 *
 * 데이터 구조 — 한 학급이 하나의 프로젝트를 함께 쓴다.
 *
 *   players/{playerId}                  이름 · 캐릭터 · 마지막 접속
 *   saves/{playerId}                    진행도 (돈 · 농장 · 동물 · 가방 · 집)
 *   stats/{playerId}                    학습 통계 (문제별 정답률)
 *   players/{playerId}/attempts/{자동}   문제 풀이 기록 한 건씩
 *
 * 학생 계정이 없으므로 문서 키는 익명 UID 가 아니라 playerId 다.
 * 그래서 어느 태블릿에서 접속하든 이름만 고르면 이어서 할 수 있다.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { AvatarId, CharacterId, GameSaveData, PlayerProfile } from '@/types/game';
import type { LearningStats } from '@/types/learning';
import type {
  GameStateRepository,
  LearningRepository,
  PlayerRepository,
  RepositoryBundle,
} from '../repositories';
import { firestore } from './app';

const PLAYERS = 'players';
const SAVES = 'saves';
const STATS = 'stats';

function newPlayerId(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `player_${Date.now().toString(36)}_${random}`;
}

export class FirebasePlayerRepository implements PlayerRepository {
  async listProfiles(): Promise<PlayerProfile[]> {
    const snapshot = await getDocs(collection(firestore(), PLAYERS));
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }) as PlayerProfile)
      .sort((a, b) => (b.lastPlayedAt ?? '').localeCompare(a.lastPlayedAt ?? ''));
  }

  async getProfile(playerId: string): Promise<PlayerProfile | null> {
    const snapshot = await getDoc(doc(firestore(), PLAYERS, playerId));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as PlayerProfile;
  }

  async createProfile(
    displayName: string,
    avatarId: AvatarId,
    characterId: CharacterId = 'boy',
  ): Promise<PlayerProfile> {
    const now = new Date().toISOString();
    const profile: PlayerProfile = {
      id: newPlayerId(),
      displayName: displayName.trim(),
      avatarId,
      characterId,
      createdAt: now,
      lastPlayedAt: null,
    };
    const { id, ...body } = profile;
    await setDoc(doc(firestore(), PLAYERS, id), body);
    return profile;
  }

  async updateLook(
    playerId: string,
    look: { avatarId?: AvatarId; characterId?: CharacterId },
  ): Promise<void> {
    // undefined 를 그대로 보내면 Firestore 가 거부한다. 채워진 것만 보낸다.
    const patch = Object.fromEntries(Object.entries(look).filter(([, v]) => v !== undefined));
    if (Object.keys(patch).length === 0) return;
    await updateDoc(doc(firestore(), PLAYERS, playerId), patch);
  }

  async touchLastPlayed(playerId: string): Promise<void> {
    await updateDoc(doc(firestore(), PLAYERS, playerId), {
      lastPlayedAt: new Date().toISOString(),
    });
  }

  async deleteProfile(playerId: string): Promise<void> {
    const db = firestore();
    await Promise.all([
      deleteDoc(doc(db, PLAYERS, playerId)),
      deleteDoc(doc(db, SAVES, playerId)),
      deleteDoc(doc(db, STATS, playerId)),
    ]);
  }
}

export class FirebaseGameStateRepository implements GameStateRepository {
  async load(playerId: string): Promise<GameSaveData | null> {
    const snapshot = await getDoc(doc(firestore(), SAVES, playerId));
    return snapshot.exists() ? (snapshot.data() as GameSaveData) : null;
  }

  async save(playerId: string, data: GameSaveData): Promise<void> {
    // 오프라인이면 이 호출은 로컬 큐에 쌓였다가 연결되면 자동으로 올라간다.
    await setDoc(doc(firestore(), SAVES, playerId), data);
  }

  async reset(playerId: string): Promise<void> {
    await deleteDoc(doc(firestore(), SAVES, playerId));
  }
}

export class FirebaseLearningRepository implements LearningRepository {
  async loadStats(playerId: string): Promise<LearningStats | null> {
    const snapshot = await getDoc(doc(firestore(), STATS, playerId));
    return snapshot.exists() ? (snapshot.data() as LearningStats) : null;
  }

  async saveStats(playerId: string, stats: LearningStats): Promise<void> {
    await setDoc(doc(firestore(), STATS, playerId), stats);
  }

}

export function createFirebaseRepositories(): RepositoryBundle {
  return {
    player: new FirebasePlayerRepository(),
    gameState: new FirebaseGameStateRepository(),
    learning: new FirebaseLearningRepository(),
  };
}
