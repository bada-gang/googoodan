/**
 * 저장소 인터페이스. (명세 72)
 *
 * 게임 로직과 상태 스토어는 이 인터페이스에만 의존한다.
 * Phase 8 에서 FirebasePlayerRepository 등을 만들어 갈아끼우면 되고,
 * 게임 코드는 한 줄도 바뀌지 않는다.
 *
 * 참고: 농장/동물/인벤토리는 항상 같은 시점에 함께 저장되므로
 * (자동 저장, 명세 36) 하나의 GameStateRepository 애그리게이트로 다룬다.
 * Firestore 에서는 이 구현체 내부에서 하위 문서로 나눌 수 있다.
 */
import type { AvatarId, GameSaveData, PlayerProfile } from '@/types/game';
import type { LearningStats } from '@/types/learning';

export interface PlayerRepository {
  listProfiles(): Promise<PlayerProfile[]>;
  getProfile(playerId: string): Promise<PlayerProfile | null>;
  createProfile(displayName: string, avatarId: AvatarId): Promise<PlayerProfile>;
  /** 학생이 시작 화면에서 자기 캐릭터를 바꾼다. (명세 9, 10) */
  updateAvatar(playerId: string, avatarId: AvatarId): Promise<void>;
  touchLastPlayed(playerId: string): Promise<void>;
  deleteProfile(playerId: string): Promise<void>;
}

export interface GameStateRepository {
  load(playerId: string): Promise<GameSaveData | null>;
  save(playerId: string, data: GameSaveData): Promise<void>;
  reset(playerId: string): Promise<void>;
}

export interface LearningRepository {
  loadStats(playerId: string): Promise<LearningStats | null>;
  saveStats(playerId: string, stats: LearningStats): Promise<void>;
}

export interface RepositoryBundle {
  player: PlayerRepository;
  gameState: GameStateRepository;
  learning: LearningRepository;
}
