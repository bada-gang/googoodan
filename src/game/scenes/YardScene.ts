/**
 * 집 앞 마당 + 농장 + 동물 우리.
 * 게임의 중심 무대이며, 성장·수확·돌보기가 모두 여기서 일어난다.
 */
import Phaser from 'phaser';
import { ASSETS, TREE_STAGE_FRAME } from '@/config/assets';
import { PALETTE } from '@/config/artTokens';
import {
  GROUND_Y,
  HOUSE_DOOR_X,
  PEN,
  PLOT_COUNT,
  TOWN_GATE_X,
  WORLD,
  plotX,
} from '@/config/layout';
import { ANIMAL_SPECIES, TREE_SPECIES, seedIdOf } from '@/config/catalog';
import { MAX_HARVESTS_PER_TREE, STAGE_LABEL } from '@/config/balance';
import { AREA_NAME } from '@/config/strings';
import { gameEvents } from '@/bridge/eventBus';
import type { InteractionPrompt, SceneKey } from '@/bridge/events';
import { useGameStore } from '@/state/gameStore';
import type { AnimalInstance, FarmPlot, TreeSpeciesId } from '@/types/game';
import { audio } from '@/audio/sfx';
import { ANIM } from '../anims';
import {
  burstStars,
  flyToBag,
  floatText,
  idleSway,
  leafPuff,
  soilPuff,
  sparkleAt,
} from '../objects/effects';
import { WorldScene } from './WorldScene';

const PLOT_BASE_Y = GROUND_Y + 26;
const TREE_BASE_Y = GROUND_Y + 24;

export class YardScene extends WorldScene {
  private treeSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private animalSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super('YardScene');
  }

  get sceneKey(): SceneKey {
    return 'YardScene';
  }

  get worldWidth(): number {
    return WORLD.yard.width;
  }

  protected get defaultSpawnX(): number {
    return HOUSE_DOOR_X + 190;
  }

  protected buildWorld(): void {
    this.placementArea = 'yard';
    this.treeSprites.clear();
    this.animalSprites.clear();

    this.addSky();
    this.addParallax(ASSETS.environment.farHills, 300, 320, 0.12, 1);
    this.addParallax(ASSETS.environment.farTrees, 430, 220, 0.28, 2);
    this.addParallax(ASSETS.environment.midTrees, 452, 250, 0.5, 3);
    this.addClouds(4);
    this.addGround(ASSETS.environment.groundYard);
    this.addForeground();

    this.buildHouse();
    this.buildFarm();
    this.buildPen();
    this.buildTownGate();
    this.scatterDecor();

    this.unsubscribe = useGameStore.subscribe(() => {
      this.syncTrees();
      this.syncAnimals();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
    });

    this.syncTrees();
    this.syncAnimals();

    this.track(
      gameEvents.on('seedpicker:choose', ({ plotId, species }) =>
        this.plantWithMath(plotId, species as TreeSpeciesId),
      ),
    );
  }

  /* --------------------------------- 집 --------------------------------- */

  private buildHouse(): void {
    const house = this.add
      .image(HOUSE_DOOR_X, GROUND_Y + 30, ASSETS.buildings.house)
      .setOrigin(0.5, 1)
      .setDepth(10);
    void house;

    this.addSignLabel(HOUSE_DOOR_X, GROUND_Y - 300, AREA_NAME.home);

    this.addInteractable({
      id: 'house_door',
      getX: () => HOUSE_DOOR_X,
      range: 140,
      prompts: () => [{ id: 'enter_home', label: '집에 들어가기', enabled: true }],
      onAction: () => this.gotoScene('HomeScene'),
      markerAt: () => null,
    });
  }

  /* -------------------------------- 농장 -------------------------------- */

  private buildFarm(): void {
    for (let i = 0; i < PLOT_COUNT; i += 1) {
      const x = plotX(i);
      this.add.image(x, PLOT_BASE_Y, ASSETS.environment.soilPlot).setOrigin(0.5, 1).setDepth(8);

      const plotId = `plot_${i}`;
      this.addInteractable({
        id: plotId,
        getX: () => x,
        prompts: () => this.plotPrompts(plotId),
        onAction: (actionId) => this.handlePlotAction(plotId, actionId),
        markerAt: () => {
          const plot = this.plot(plotId);
          return plot?.stage === 'fruiting' ? { x, y: TREE_BASE_Y - 250 } : null;
        },
      });
    }

    // 농장 입구 표지판. 집과 첫 번째 밭 사이에 둔다.
    const signX = plotX(0) - 160;
    this.add
      .image(signX, GROUND_Y + 26, ASSETS.environment.signpost)
      .setOrigin(0.5, 1)
      .setDepth(22);
    this.addSignText(signX, GROUND_Y - 109, AREA_NAME.farm);
  }

  private plot(plotId: string): FarmPlot | undefined {
    return useGameStore.getState().plots.find((p) => p.id === plotId);
  }

  private ownedSeeds(): TreeSpeciesId[] {
    const inventory = useGameStore.getState().inventory;
    return (Object.keys(TREE_SPECIES) as TreeSpeciesId[]).filter(
      (species) => (inventory[seedIdOf(species)] ?? 0) > 0,
    );
  }

  private plotPrompts(plotId: string): InteractionPrompt[] {
    const plot = this.plot(plotId);
    if (!plot) return [];

    if (!plot.species) {
      const seeds = this.ownedSeeds();
      return [
        {
          id: 'plant',
          label: '씨앗 심기',
          enabled: seeds.length > 0,
          hint: seeds.length === 0 ? '농장 가게에서 씨앗을 사 오세요' : undefined,
        },
      ];
    }

    if (plot.stage === 'fruiting') {
      const left = MAX_HARVESTS_PER_TREE - plot.harvestCount;
      return [
        {
          id: 'harvest',
          // 밭이 여섯 개라 어떤 나무 앞인지 버튼에서 바로 보여 준다
          label: `${TREE_SPECIES[plot.species].name} 수확하기`,
          enabled: true,
          highlight: true,
          // 나무가 곧 사라진다는 걸 미리 알려 준다. (요청 3)
          hint: left <= 1 ? '이번이 마지막 수확이에요' : `앞으로 ${left}번 딸 수 있어요`,
        },
      ];
    }

    const water = useGameStore.getState().itemCount('water');
    return [
      {
        id: 'grow',
        label: `${TREE_SPECIES[plot.species].name} 물 주기`,
        enabled: water > 0,
        hint:
          water > 0
            ? `${STAGE_LABEL[plot.stage]} · 물 ${water}개`
            : '물이 없어요. 농장 가게에서 사 오세요',
      },
    ];
  }

  private handlePlotAction(plotId: string, actionId: string): void {
    const plot = this.plot(plotId);
    if (!plot) return;

    if (actionId === 'plant') {
      const seeds = this.ownedSeeds();
      if (seeds.length === 0) return;
      if (seeds.length === 1) {
        this.plantWithMath(plotId, seeds[0]);
        return;
      }
      gameEvents.emit('seedpicker:open', { plotId });
      return;
    }

    if (actionId === 'grow') {
      const species = plot.species;
      if (!species) return;
      this.askMath('GROW', `${TREE_SPECIES[species].name}를 키워 볼까요?`, () => {
        const before = this.plot(plotId)?.stage;
        // 물이 없으면 아무 일도 일어나지 않는다.
        if (!useGameStore.getState().growPlot(plotId)) {
          this.toast('물이 없어요. 농장 가게에서 사 오세요', 'warn');
          return;
        }
        const after = this.plot(plotId)?.stage;
        const x = plotX(plot.index);
        leafPuff(this, x, TREE_BASE_Y - 90);
        if (before !== after) {
          floatText(this, x, TREE_BASE_Y - 150, STAGE_LABEL[after ?? 'sprout'], PALETTE.leafShade);
          audio.play('harvest');
          if (after === 'fruiting') {
            burstStars(this, x, TREE_BASE_Y - 200, 12);
            this.toast('열매가 열렸어요! 수확해 보세요', 'reward');
          }
        } else {
          floatText(this, x, TREE_BASE_Y - 130, '쑥쑥!', PALETTE.leafShade);
        }
        this.awardExperience('GROW');
      });
      return;
    }

    if (actionId === 'harvest') {
      const species = plot.species;
      if (!species) return;
      const def = TREE_SPECIES[species];
      this.askMath('HARVEST', `${def.fruitName}를 따 볼까요?`, (wrongAttempts) => {
        const result = useGameStore.getState().harvestPlot(plotId, wrongAttempts);
        if (!result) return;
        const x = plotX(plot.index);

        // 다 틀려도 최소 1개는 딴다 (HARVEST_BY_ATTEMPTS) — 빈손으로 끝나는 경우는 없다.
        audio.play('harvest');
        burstStars(this, x, TREE_BASE_Y - 180, 6 + result.count * 3);
        for (let i = 0; i < result.count; i += 1) {
          flyToBag(
            this,
            x + (i - 1) * 34,
            TREE_BASE_Y - 170,
            ASSETS.crops[def.fruitId],
            this.player.x,
            this.player.y - 60,
            i,
          );
        }
        floatText(this, x, TREE_BASE_Y - 230, `${def.fruitName} +${result.count}`, PALETTE.gold);

        if (result.finished) {
          // 다 딴 나무는 밭에서 사라진다. (요청 3)
          leafPuff(this, x, TREE_BASE_Y - 120);
          this.toast(
            `${def.name}가 열매를 다 맺었어요. 밭이 비었으니 새로 심어 보세요`,
            'info',
          );
        } else {
          this.toast(`${def.fruitName} ${result.count}개를 얻었어요`, 'reward');
        }
        this.awardExperience('HARVEST');
      });
    }
  }

  private plantWithMath(plotId: string, species: TreeSpeciesId): void {
    const plot = this.plot(plotId);
    if (!plot || plot.species) return;
    const def = TREE_SPECIES[species];
    this.askMath('PLANT', `${def.seedName}을 심어 볼까요?`, () => {
      if (!useGameStore.getState().plantSeed(plotId, species)) return;
      const x = plotX(plot.index);
      soilPuff(this, x, PLOT_BASE_Y - 20);
      audio.play('place');
      floatText(this, x, PLOT_BASE_Y - 90, `${def.name} 심기`, PALETTE.leafShade);
      this.awardExperience('PLANT');
    });
  }

  private syncTrees(): void {
    const plots = useGameStore.getState().plots;
    for (const plot of plots) {
      const existing = this.treeSprites.get(plot.id);
      if (!plot.species) {
        if (existing) {
          existing.destroy();
          this.treeSprites.delete(plot.id);
        }
        continue;
      }
      const textureKey = ASSETS.trees[plot.species];
      const frameIndex = TREE_STAGE_FRAME[plot.stage];
      if (!existing) {
        const sprite = this.add
          .sprite(plotX(plot.index), TREE_BASE_Y, textureKey, frameIndex)
          .setOrigin(0.5, 1)
          .setDepth(20 + TREE_BASE_Y * 0.01);
        sprite.setData('stage', plot.stage);
        idleSway(this, sprite, 0.015, 2600);
        this.treeSprites.set(plot.id, sprite);
        this.tweens.add({
          targets: sprite,
          scaleX: { from: 0.75, to: 1 },
          scaleY: { from: 0.75, to: 1 },
          duration: 320,
          ease: 'Back.easeOut',
        });
        continue;
      }
      // 지금 그려진 단계를 직접 기억해 둔다.
      // frame.name 은 임시 아트(숫자)와 실제 스프라이트시트(문자열)에서 타입이 달라
      // 비교에 쓰면 매번 다르다고 판단돼 성장 연출이 계속 다시 재생된다.
      const shownStage = existing.getData('stage') as string | undefined;
      if (existing.texture.key !== textureKey) {
        existing.setTexture(textureKey, frameIndex);
        existing.setData('stage', plot.stage);
      } else if (shownStage !== plot.stage) {
        existing.setFrame(frameIndex);
        existing.setData('stage', plot.stage);
        this.tweens.add({
          targets: existing,
          scaleX: { from: 0.86, to: 1 },
          scaleY: { from: 0.86, to: 1 },
          duration: 280,
          ease: 'Back.easeOut',
        });
      }
    }
  }

  /* ------------------------------ 동물 우리 ------------------------------ */

  private buildPen(): void {
    const barnX = PEN.x + PEN.width - 120;
    this.add
      .image(barnX, GROUND_Y + 28, ASSETS.buildings.barn)
      .setOrigin(0.5, 1)
      .setDepth(10);
    this.addSignLabel(barnX, GROUND_Y - 290, AREA_NAME.pen);

    // 울타리는 뒤쪽에 세운다. 앞에 두면 동물이 가려진다.
    for (let x = PEN.x; x <= PEN.x + PEN.width; x += 158) {
      this.add
        .image(x, GROUND_Y + 14, ASSETS.environment.fenceRail)
        .setOrigin(0.5, 1)
        .setDepth(12);
    }

    // 여물통
    const feederX = PEN.x + 60;
    this.add.image(feederX, GROUND_Y + 30, ASSETS.buildings.pen).setOrigin(0.5, 1).setDepth(22);
  }

  private animalX(animal: AnimalInstance, index: number): number {
    const slot = PEN.x + 150 + ((index * 170 + animal.spot * 90) % (PEN.width - 200));
    return slot;
  }

  private syncAnimals(): void {
    const animals = useGameStore.getState().animals;
    const seen = new Set<string>();

    animals.forEach((animal, index) => {
      seen.add(animal.id);
      let sprite = this.animalSprites.get(animal.id);
      if (!sprite) {
        const x = this.animalX(animal, index);
        sprite = this.add
          .sprite(x, GROUND_Y + 24, ASSETS.animals[animal.species].idle)
          .setOrigin(0.5, 1)
          .setDepth(25);
        sprite.play(ANIM.animal(animal.species, 'idle'));
        this.animalSprites.set(animal.id, sprite);
        this.wander(sprite, animal);

        this.addInteractable({
          id: `animal_${animal.id}`,
          getX: () => sprite?.x ?? x,
          prompts: () => this.animalPrompts(animal.id),
          onAction: (actionId) => this.handleAnimalAction(animal.id, actionId),
          markerAt: () => {
            const current = this.animal(animal.id);
            if (!current?.produceReady || !sprite) return null;
            return { x: sprite.x, y: sprite.y - sprite.displayHeight - 34 };
          },
        });
      }
    });

    for (const [id, sprite] of [...this.animalSprites]) {
      if (!seen.has(id)) {
        sprite.destroy();
        this.animalSprites.delete(id);
      }
    }
  }

  /** 동물이 정지 이미지처럼 보이지 않도록 천천히 돌아다닌다. (명세 45) */
  private wander(sprite: Phaser.GameObjects.Sprite, animal: AnimalInstance): void {
    const home = sprite.x;
    const range = 70;
    const step = () => {
      if (!sprite.active) return;
      const target = Phaser.Math.Clamp(
        home + Phaser.Math.Between(-range, range),
        PEN.x + 120,
        PEN.x + PEN.width - 60,
      );
      const distance = Math.abs(target - sprite.x);
      if (distance < 12) {
        this.time.delayedCall(1400 + Math.random() * 2200, step);
        return;
      }
      sprite.setFlipX(target < sprite.x);
      sprite.play(ANIM.animal(animal.species, 'walk'), true);
      this.tweens.add({
        targets: sprite,
        x: target,
        duration: (distance / 40) * 1000,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          sprite.play(ANIM.animal(animal.species, 'idle'), true);
          this.time.delayedCall(1600 + Math.random() * 2600, step);
        },
      });
    };
    this.time.delayedCall(600 + Math.random() * 2400, step);
  }

  private animal(animalId: string): AnimalInstance | undefined {
    return useGameStore.getState().animals.find((a) => a.id === animalId);
  }

  private animalPrompts(animalId: string): InteractionPrompt[] {
    const animal = this.animal(animalId);
    if (!animal) return [];
    const def = ANIMAL_SPECIES[animal.species];
    if (animal.produceReady) {
      return [
        {
          id: 'collect',
          label: `${def.produceName} 받기`,
          enabled: true,
          highlight: true,
          // 생산물 이름에 동물 이름을 또 붙이면 "양 양털 받기" 처럼 겹친다. 부제로 둔다.
          hint: def.name,
        },
      ];
    }
    const feed = useGameStore.getState().itemCount('feed');
    return [
      {
        id: 'feed',
        label: `${def.name} 먹이 주기`,
        enabled: feed > 0,
        hint:
          feed > 0
            ? `돌봄 ${animal.care} / ${def.careGoal} · 먹이 ${feed}개`
            : '먹이가 없어요. 농장 가게에서 사 오세요',
      },
    ];
  }

  private handleAnimalAction(animalId: string, actionId: string): void {
    const animal = this.animal(animalId);
    if (!animal) return;
    const def = ANIMAL_SPECIES[animal.species];
    const sprite = this.animalSprites.get(animalId);

    if (actionId === 'feed') {
      this.askMath('ANIMAL', `${def.name}에게 먹이를 줄까요?`, () => {
        if (!useGameStore.getState().feedAnimal(animalId)) return;
        audio.play('animal');
        if (sprite) {
          sprite.play(ANIM.animal(animal.species, 'eat'), true);
          sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () =>
            sprite.play(ANIM.animal(animal.species, 'idle'), true),
          );
          sparkleAt(this, sprite.x, sprite.y - 40, 6);
          floatText(this, sprite.x, sprite.y - 90, '냠냠', PALETTE.accentPink);
        }
        const updated = this.animal(animalId);
        if (updated?.produceReady) {
          this.toast(`${def.produceName}이(가) 준비됐어요!`, 'reward');
          if (sprite) burstStars(this, sprite.x, sprite.y - 60, 9);
        }
        this.awardExperience('ANIMAL');
      });
      return;
    }

    if (actionId === 'collect') {
      this.askMath('ANIMAL', `${def.produceName}을(를) 받아 볼까요?`, (wrongAttempts) => {
        const result = useGameStore.getState().collectProduce(animalId, wrongAttempts);
        if (!result) return;

        // 다 틀려도 최소 1개는 받는다 (PRODUCE_BY_ATTEMPTS)
        audio.play('harvest');
        if (sprite) {
          sprite.play(ANIM.animal(animal.species, 'happy'), true);
          sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () =>
            sprite.play(ANIM.animal(animal.species, 'idle'), true),
          );
          for (let i = 0; i < result.count; i += 1) {
            flyToBag(
              this,
              sprite.x + (i - (result.count - 1) / 2) * 34,
              sprite.y - 60,
              ASSETS.crops[result.produce],
              this.player.x,
              this.player.y - 60,
              i,
            );
          }
          burstStars(this, sprite.x, sprite.y - 70, 6 + result.count * 4);
          floatText(this, sprite.x, sprite.y - 120, `${def.produceName} +${result.count}`, PALETTE.gold);
        }
        this.toast(`${def.produceName} ${result.count}개를 얻었어요`, 'reward');
        this.awardExperience('ANIMAL');
      });
    }
  }

  /* ------------------------------ 마을 입구 ------------------------------ */

  private buildTownGate(): void {
    this.add
      .image(TOWN_GATE_X, GROUND_Y + 26, ASSETS.environment.signpost)
      .setOrigin(0.5, 1)
      .setDepth(22);
    this.addSignText(TOWN_GATE_X, GROUND_Y - 109, `${AREA_NAME.market} →`);

    this.addInteractable({
      id: 'town_gate',
      getX: () => TOWN_GATE_X,
      range: 150,
      prompts: () => [{ id: 'go_town', label: `${AREA_NAME.market} 가기`, enabled: true }],
      onAction: () => this.gotoScene('TownScene', 200),
      markerAt: () => null,
    });
  }

  private scatterDecor(): void {
    // 캐릭터 시작 위치(집 앞)와 밭 · 우리를 피해서 배치한다.
    // 집 · 표지판 · 밭 · 우리와 겹치지 않는 자리에만 둔다.
    const spots = [2900, 3180];
    spots.forEach((x, i) => {
      const key = i % 2 === 0 ? ASSETS.environment.bush : ASSETS.environment.flowerTuft;
      const item = this.add
        .image(x, GROUND_Y + 30, key)
        .setOrigin(0.5, 1)
        .setDepth(18);
      idleSway(this, item, 0.012, 3000);
    });
  }

}
