'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Trophy, Heart, Coins } from 'lucide-react';

type Props = {
  grade?: number;
  onExit: () => void;
};

type GameResult = {
  won: boolean;
  xp: number; coins: number; stars: number; score: number;
  questionsAttempted: number; questionsCorrect: number; durationSec: number;
};

// ── Math question generator ─────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(grade: number, room: number) {
  const diff = Math.min(5, Math.floor((grade - 6) / 2) + room + 1);
  let a: number, b: number, op: string, answer: number;

  if (diff <= 1)       { a = rand(2, 15);  b = rand(2, 15);  op = rand(0,1) ? '+' : '-'; }
  else if (diff <= 2)  { a = rand(10, 50); b = rand(5, 25);  op = rand(0,1) ? '+' : '-'; }
  else if (diff <= 3)  { a = rand(5, 20);  b = rand(2, 12);  op = '*'; }
  else if (diff <= 4)  { a = rand(10, 30); b = rand(2, 9);   op = '*'; }
  else                 { a = rand(12, 25); b = rand(12, 25); op = '*'; }

  if (op === '+')       answer = a + b;
  else if (op === '-')  { if (a < b) { [a, b] = [b, a]; } answer = a - b; }
  else                  answer = a * b;

  const text = `${a} ${op === '*' ? '×' : op} ${b} = ?`;

  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const delta = rand(1, Math.max(5, Math.floor(Math.abs(answer) * 0.25)));
    const sign = Math.random() < 0.5 ? 1 : -1;
    const w = answer + sign * delta;
    if (w !== answer && w >= 0) wrongs.add(w);
  }
  const choices = [answer, ...wrongs].sort(() => Math.random() - 0.5);
  return { text, answer, choices };
}

// ── Component ───────────────────────────────────────────────────────────────

export default function MathDungeonGame({ grade = 9, onExit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [result, setResult] = useState<GameResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Start a game session on the backend
  useEffect(() => {
    fetch('/api/games/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ gameType: 'MATH_DUNGEON', mode: 'SOLO', gradeLevel: grade }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.sessionId) sessionIdRef.current = d.sessionId; })
      .catch(() => {});
    startTimeRef.current = Date.now();
  }, [grade]);

  // Boot Phaser
  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    import('phaser').then(({ default: Phaser }) => {
      if (destroyed || !containerRef.current) return;

      const W = 480, H = 520;

      // ── GameScene ────────────────────────────────────────────────────────

      class GameScene extends Phaser.Scene {
        private room = 0;
        private enemyIdx = 0;
        private playerHp = 100;
        private enemyHp = 0;
        private enemyMaxHp = 0;
        private score = 0;
        private totalQ = 0;
        private correctQ = 0;
        private question: ReturnType<typeof generateQuestion> | null = null;

        private bg!: Phaser.GameObjects.Rectangle;
        private enemyBody!: Phaser.GameObjects.Rectangle;
        private enemyEmoji!: Phaser.GameObjects.Text;
        private eHpGfx!: Phaser.GameObjects.Graphics;
        private pHpGfx!: Phaser.GameObjects.Graphics;
        private qText!: Phaser.GameObjects.Text;
        private btns: Phaser.GameObjects.Container[] = [];
        private infoText!: Phaser.GameObjects.Text;
        private feedbackText!: Phaser.GameObjects.Text;
        private locked = false;

        static ROOMS = 5;
        static EPR = 3;            // enemies per room
        static ENEMY_HP = 80;
        static BOSS_HP = 160;
        static P_DMG = 30;         // player damage per correct answer
        static E_DMG = 20;         // enemy damage per wrong answer

        constructor() { super('GameScene'); }

        create() {
          this.bg = this.add.rectangle(W / 2, H / 2, W, H, 0x0f0f23);

          this.infoText = this.add.text(14, 12, '', {
            fontSize: '13px', color: '#818cf8', fontFamily: 'monospace',
          });

          this.enemyBody = this.add.rectangle(W / 2, 130, 76, 76, 0xe74c3c)
            .setStrokeStyle(3, 0xff6b6b);
          this.enemyEmoji = this.add.text(W / 2, 130, '👹', { fontSize: '38px' })
            .setOrigin(0.5);

          // HP bar backgrounds
          this.add.rectangle(W / 2, 190, 220, 14, 0x1e1b3a).setStrokeStyle(1, 0x4338ca);
          this.add.rectangle(W / 2, 210, 220, 10, 0x1e1b3a).setStrokeStyle(1, 0x312e81);

          this.eHpGfx = this.add.graphics();
          this.pHpGfx = this.add.graphics();

          this.qText = this.add.text(W / 2, 265, '', {
            fontSize: '24px', color: '#f0f4ff', fontFamily: 'monospace', fontStyle: 'bold',
          }).setOrigin(0.5);

          // Choice buttons — 2×2 grid
          const btnW = 100, btnH = 38;
          const positions = [
            { x: W / 2 - 58, y: 330 }, { x: W / 2 + 58, y: 330 },
            { x: W / 2 - 58, y: 376 }, { x: W / 2 + 58, y: 376 },
          ];
          for (let i = 0; i < 4; i++) {
            const { x, y } = positions[i];
            const bg = this.add.rectangle(0, 0, btnW, btnH, 0x1e1b4b)
              .setStrokeStyle(1.5, 0x4f46e5);
            const lbl = this.add.text(0, 0, '', {
              fontSize: '16px', color: '#c7d2fe', fontFamily: 'monospace', fontStyle: 'bold',
            }).setOrigin(0.5);
            const c = this.add.container(x, y, [bg, lbl]);
            c.setSize(btnW, btnH).setInteractive({ useHandCursor: true });
            c.on('pointerover', () => !this.locked && bg.setFillStyle(0x3730a3));
            c.on('pointerout', () => bg.setFillStyle(0x1e1b4b));
            c.on('pointerdown', () => this.onAnswer(i));
            this.btns.push(c);
          }

          this.feedbackText = this.add.text(W / 2, 430, '', {
            fontSize: '13px', color: '#4ade80', fontFamily: 'monospace',
          }).setOrigin(0.5);

          // Score ticker bottom right
          this.add.text(W - 14, 12, 'Score', {
            fontSize: '11px', color: '#6366f1', fontFamily: 'monospace',
          }).setOrigin(1, 0);

          this.startRoom();
        }

        private startRoom() {
          const colors = [0x0f0f23, 0x0f1e0f, 0x1f0f0f, 0x0f0f1f, 0x1a0f1a];
          this.bg.setFillStyle(colors[this.room % colors.length]);
          this.enemyIdx = 0;
          this.nextEnemy();
        }

        private nextEnemy() {
          const isBoss = this.enemyIdx === GameScene.EPR - 1;
          this.enemyMaxHp = isBoss ? GameScene.BOSS_HP : GameScene.ENEMY_HP;
          this.enemyHp = this.enemyMaxHp;
          this.enemyBody.setFillStyle(isBoss ? 0x7c1d1d : 0xc0392b)
            .setStrokeStyle(3, isBoss ? 0xfca5a5 : 0xff6b6b);
          this.enemyEmoji.setText(isBoss ? '🐉' : ['👹', '💀', '🧟', '👾', '🦂'][rand(0, 4)]);
          this.infoText.setText(
            `Room ${this.room + 1}/${GameScene.ROOMS}  ·  Enemy ${this.enemyIdx + 1}/${GameScene.EPR}  ·  HP ❤️ ${this.playerHp}`,
          );
          this.feedbackText.setText('');
          this.nextQuestion();
        }

        private nextQuestion() {
          this.question = generateQuestion(grade, this.room);
          this.totalQ++;
          this.locked = false;
          this.qText.setText(this.question.text);
          this.question.choices.forEach((c, i) => {
            (this.btns[i].list[1] as Phaser.GameObjects.Text).setText(String(c));
            (this.btns[i].list[0] as Phaser.GameObjects.Rectangle)
              .setFillStyle(0x1e1b4b).setStrokeStyle(1.5, 0x4f46e5);
          });
          this.drawBars();
        }

        private onAnswer(idx: number) {
          if (this.locked || !this.question) return;
          this.locked = true;

          const chosen = this.question.choices[idx];
          const correct = chosen === this.question.answer;
          const btnBg = this.btns[idx].list[0] as Phaser.GameObjects.Rectangle;

          if (correct) {
            btnBg.setFillStyle(0x14532d).setStrokeStyle(2, 0x4ade80);
            this.correctQ++;
            this.score += 10 * (this.room + 1) + (this.room > 2 ? 5 : 0);
            this.enemyHp = Math.max(0, this.enemyHp - GameScene.P_DMG);
            this.feedbackText.setText('✓ Correct!').setColor('#4ade80');
          } else {
            btnBg.setFillStyle(0x7f1d1d).setStrokeStyle(2, 0xf87171);
            const ci = this.question.choices.findIndex((c) => c === this.question!.answer);
            (this.btns[ci].list[0] as Phaser.GameObjects.Rectangle).setFillStyle(0x14532d);
            this.playerHp = Math.max(0, this.playerHp - GameScene.E_DMG);
            this.feedbackText.setText(`✗ Answer was ${this.question.answer}`).setColor('#f87171');
          }

          this.drawBars();
          this.infoText.setText(
            `Room ${this.room + 1}/${GameScene.ROOMS}  ·  Enemy ${this.enemyIdx + 1}/${GameScene.EPR}  ·  HP ❤️ ${this.playerHp}`,
          );

          this.time.delayedCall(850, () => {
            if (this.playerHp <= 0) { this.endGame(false); return; }
            if (this.enemyHp <= 0) {
              this.enemyIdx++;
              if (this.enemyIdx >= GameScene.EPR) {
                this.room++;
                if (this.room >= GameScene.ROOMS) { this.endGame(true); return; }
                this.startRoom();
              } else {
                this.nextEnemy();
              }
            } else {
              this.nextQuestion();
            }
          });
        }

        private drawBars() {
          const ePct = this.enemyHp / this.enemyMaxHp;
          const pPct = this.playerHp / 100;
          const BAR_W = 218;

          this.eHpGfx.clear();
          this.eHpGfx.fillStyle(ePct > 0.5 ? 0x22c55e : ePct > 0.25 ? 0xf59e0b : 0xef4444);
          this.eHpGfx.fillRect(W / 2 - BAR_W / 2, 183, BAR_W * ePct, 12);

          this.pHpGfx.clear();
          this.pHpGfx.fillStyle(pPct > 0.5 ? 0x6366f1 : pPct > 0.25 ? 0xf59e0b : 0xef4444);
          this.pHpGfx.fillRect(W / 2 - BAR_W / 2, 205, BAR_W * pPct, 8);
        }

        private endGame(won: boolean) {
          const acc = this.totalQ > 0 ? this.correctQ / this.totalQ : 0;
          const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
          const baseXp = this.correctQ * 10 + this.score;
          const xp = won ? baseXp + 50 : Math.round(baseXp * 0.3);
          const coins = won ? Math.max(10, stars * 15) : 5;
          const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
          this.game.events.emit('gameOver', {
            won, xp, coins, stars,
            score: this.score,
            questionsAttempted: this.totalQ,
            questionsCorrect: this.correctQ,
            durationSec,
          });
        }
      }

      // ── Phaser boot ──────────────────────────────────────────────────────

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        width: W,
        height: H,
        backgroundColor: '#0f0f23',
        parent: containerRef.current!,
        scene: [GameScene],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      });
      gameRef.current = game;

      game.events.on('gameOver', (data: GameResult) => setResult(data));
    });

    return () => {
      destroyed = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [grade]);

  const claimReward = async () => {
    if (!result || saving || saved) return;
    setSaving(true);
    try {
      const sessionId = sessionIdRef.current;
      if (sessionId) {
        await fetch('/api/games/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            sessionId,
            score: result.score,
            questionsAttempted: result.questionsAttempted,
            questionsCorrect: result.questionsCorrect,
            durationSec: result.durationSec,
            starsEarned: result.stars,
            outcome: result.won ? 'won' : 'lost',
          }),
        });
      }
      setSaved(true);
    } catch {
      setSaved(true); // show locally even if network fails
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f23] relative">
      {/* Result overlay */}
      {result && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75">
          <div className="bg-[#1e1b4b] border border-indigo-700 rounded-2xl p-6 w-72 text-center space-y-4 shadow-2xl">
            <p className="text-4xl">
              {result.won ? (result.stars === 3 ? '🏆' : result.stars === 2 ? '🥈' : '🥉') : '💀'}
            </p>
            <h2 className="text-xl font-bold text-white">
              {result.won ? 'Dungeon Cleared!' : 'Defeated…'}
            </h2>
            <p className="text-sm text-indigo-300">
              {result.questionsCorrect}/{result.questionsAttempted} correct
              {' '}· {'⭐'.repeat(result.stars)}
            </p>
            <div className="flex justify-center gap-5">
              <div>
                <p className="text-2xl font-bold text-amber-400">{result.score}</p>
                <p className="text-xs text-indigo-400">Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">+{result.xp}</p>
                <p className="text-xs text-indigo-400">XP</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">+{result.coins}</p>
                <p className="text-xs text-indigo-400">Coins</p>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <button
                onClick={claimReward}
                disabled={saving || saved}
                className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {saved ? '✓ Rewards claimed!' : saving ? 'Saving…' : 'Claim Rewards'}
              </button>
              <button onClick={onExit} className="w-full text-sm text-indigo-300 hover:text-white">
                Back to games
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phaser canvas */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center" />
    </div>
  );
}
