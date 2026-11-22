import React, { useEffect, useRef } from 'react';
import { ChaiRecipe, ChaiState } from '../types/game';
import { soundEngine } from '../utils/sound';

interface ChaiPatilaCanvasProps {
  selectedChai: ChaiRecipe;
  chaiState: ChaiState;
  isDragOver: boolean;
  onDropAction: (action: string) => void;
  onDragStateChange: (over: boolean) => void;
  onPatilaTap: () => void;
}

interface ChaiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  kind: 'steam' | 'bubble' | 'spark';
  color: string;
}

interface ChaiAnimEvent {
  kind: 'pour' | 'scoop' | 'shock' | 'phainti' | 'garnish';
  color: string;
  t: number;
  duration: number;
}

export const ChaiPatilaCanvas: React.FC<ChaiPatilaCanvasProps> = ({
  selectedChai,
  chaiState,
  isDragOver,
  onDropAction,
  onDragStateChange,
  onPatilaTap,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ selectedChai, chaiState, isDragOver });
  const particlesRef = useRef<ChaiParticle[]>([]);
  const animsRef = useRef<ChaiAnimEvent[]>([]);
  const patilaBounceRef = useRef<number>(0);

  const prevBaseRef = useRef<string[]>([]);
  const prevPattiRef = useRef<number>(0);
  const prevCheeniRef = useRef<number>(0);
  const prevPhaintiRef = useRef<number>(0);
  const prevShockRef = useRef<boolean>(false);
  const prevGarnishRef = useRef<boolean>(false);

  useEffect(() => {
    stateRef.current = { selectedChai, chaiState, isDragOver };
  }, [selectedChai, chaiState, isDragOver]);

  // Trigger canvas animations whenever ingredients/actions happen
  useEffect(() => {
    const newlyAdded = chaiState.addedBaseItems.filter((i) => !prevBaseRef.current.includes(i));
    newlyAdded.forEach((item) => {
      if (item === 'water') {
        animsRef.current.push({ kind: 'pour', color: '#BAE6FD', t: 0, duration: 0.6 });
      } else if (item === 'milk') {
        animsRef.current.push({ kind: 'pour', color: '#FFFDF7', t: 0, duration: 0.65 });
      } else {
        animsRef.current.push({
          kind: 'scoop',
          color: item === 'ilaichi' ? '#65A30D' : '#F8FAFC',
          t: 0,
          duration: 0.55,
        });
      }
      patilaBounceRef.current = 0.6;
    });
    prevBaseRef.current = [...chaiState.addedBaseItems];

    if (chaiState.pattiScoops > prevPattiRef.current) {
      animsRef.current.push({
        kind: 'scoop',
        color: selectedChai.id === 'kashmiri-chai' ? '#15803D' : '#29170D',
        t: 0,
        duration: 0.5,
      });
    }
    prevPattiRef.current = chaiState.pattiScoops;

    if (chaiState.cheeniScoops > prevCheeniRef.current) {
      animsRef.current.push({
        kind: 'scoop',
        color: '#FFFFFF',
        t: 0,
        duration: 0.45,
      });
    }
    prevCheeniRef.current = chaiState.cheeniScoops;

    if (chaiState.pinkShockTriggered && !prevShockRef.current) {
      animsRef.current.push({
        kind: 'shock',
        color: '#F472B6',
        t: 0,
        duration: 0.85,
      });
      patilaBounceRef.current = 0.9;
    }
    prevShockRef.current = chaiState.pinkShockTriggered;

    if (chaiState.phaintiCount > prevPhaintiRef.current) {
      animsRef.current.push({
        kind: 'phainti',
        color: selectedChai.liquidColorFinish,
        t: 0,
        duration: 0.75,
      });
      patilaBounceRef.current = 0.5;
    }
    prevPhaintiRef.current = chaiState.phaintiCount;

    if (chaiState.garnishAdded && !prevGarnishRef.current) {
      animsRef.current.push({
        kind: 'garnish',
        color: '#84CC16',
        t: 0,
        duration: 0.65,
      });
    }
    prevGarnishRef.current = chaiState.garnishAdded;
  }, [
    chaiState.addedBaseItems,
    chaiState.pattiScoops,
    chaiState.cheeniScoops,
    chaiState.pinkShockTriggered,
    chaiState.phaintiCount,
    chaiState.garnishAdded,
    selectedChai,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const draw = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      if (patilaBounceRef.current > 0) {
        patilaBounceRef.current = Math.max(0, patilaBounceRef.current - dt * 3.0);
      }

      const { selectedChai: ch, chaiState: cs, isDragOver: dragOver } = stateRef.current;
      const dpr = window.devicePixelRatio || 1;
      const w = 440;
      const h = 320;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const bounceY = Math.sin(patilaBounceRef.current * Math.PI) * -5;
      const cx = w / 2;
      const cy = h / 2 + 24 + bounceY;

      // Cast-iron Chulha stove stand
      ctx.fillStyle = '#2C1B12';
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2 + 94, 120, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Animated Aanch flame glow underneath patila
      const fi =
        cs.heatLevel === 'tez'
          ? 1.0
          : cs.heatLevel === 'darmiyani'
            ? 0.78
            : cs.heatLevel === 'dheemi'
              ? 0.45
              : 0.16;
      const pulse = 1 + Math.sin(now * 0.015) * 0.07;
      const grad = ctx.createRadialGradient(w / 2, h / 2 + 88, 10, w / 2, h / 2 + 88, 108 * fi * pulse);
      grad.addColorStop(0, `rgba(59, 130, 246, ${0.82 * fi})`);
      grad.addColorStop(0.45, `rgba(249, 115, 22, ${0.65 * fi})`);
      grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2 + 88, 114 * fi * pulse, 28 * fi * pulse, 0, 0, Math.PI * 2);
      ctx.fill();

      // Brass Patila Wooden Handle
      ctx.fillStyle = '#3B2314';
      ctx.strokeStyle = '#1E110A';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(cx + 96, cy - 20, 96, 18, 9);
      ctx.fill();
      ctx.stroke();

      // Hammered Brass Patila Side Wall (3/4 perspective saucepan silhouette)
      const bodyGrad = ctx.createLinearGradient(cx - 112, cy, cx + 112, cy);
      bodyGrad.addColorStop(0, '#B45309');
      bodyGrad.addColorStop(0.35, '#F59E0B');
      bodyGrad.addColorStop(0.65, '#D97706');
      bodyGrad.addColorStop(1, '#92400E');

      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = '#2C1B12';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(cx - 108, cy - 8);
      ctx.lineTo(cx - 98, cy + 44);
      ctx.bezierCurveTo(cx - 96, cy + 74, cx + 96, cy + 74, cx + 98, cy + 44);
      ctx.lineTo(cx + 108, cy - 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Patila Top Brass Rim
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 8, 110, 56, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner Empty Steel Interior (STRICTLY EMPTY BEFORE INGREDIENTS ADDED)
      ctx.fillStyle = '#D6D3D1';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 8, 98, 48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78716C';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      const hasMilk = cs.addedBaseItems.includes('milk');
      const hasWater = cs.addedBaseItems.includes('water');
      const hasAnyLiquid = hasMilk || hasWater;

      if (!hasAnyLiquid && cs.pattiScoops === 0 && cs.cheeniScoops === 0) {
        ctx.fillStyle = '#57534E';
        ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Empty Brass Patila · Add liquid & chamach!', cx, cy - 4);
      }

      // Draw liquid ONLY if milk or water was added
      if (hasAnyLiquid) {
        let liqColor = ch.liquidColorStart;
        if (ch.id === 'kashmiri-chai') {
          if (cs.pinkShockTriggered && hasMilk) {
            liqColor = '#E88DA8';
          } else if (cs.pinkShockTriggered) {
            liqColor = '#D96B8A';
          } else if (cs.pattiScoops > 0) {
            liqColor = '#3F6212';
          }
        } else if (cs.pattiScoops > 0 && hasMilk) {
          const strength = Math.min(1, cs.pattiScoops / ch.targetPattiScoops);
          liqColor = strength >= 1 ? ch.liquidColorFinish : '#DEC29B';
        } else if (cs.pattiScoops > 0 && hasWater) {
          liqColor = '#78350F';
        } else if (hasMilk) {
          liqColor = '#FFFDF7';
        } else {
          liqColor = '#E0F2FE';
        }

        const boilLift = (cs.boilLevel / 100) * 16;
        const rx = 92 + (cs.boilLevel / 100) * 5;
        const ry = 43 + (cs.boilLevel / 100) * 4;

        ctx.fillStyle = liqColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 8 - boilLift * 0.45, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        // Froth & Phainti crema ring
        if (cs.boilLevel > 35 || cs.phaintiCount > 0) {
          const foamAlpha = Math.min(0.9, cs.boilLevel / 105 + cs.phaintiCount * 0.14);
          ctx.strokeStyle = `rgba(255, 250, 240, ${foamAlpha})`;
          ctx.lineWidth = 4 + cs.phaintiCount * 0.9;
          ctx.beginPath();
          ctx.ellipse(cx, cy - 8 - boilLift * 0.45, rx - 9, ry - 5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Emit gentle rising steam & simmering bubbles
        if (fi > 0.25 && Math.random() < fi * 0.45) {
          particlesRef.current.push({
            x: cx + (Math.random() - 0.5) * 120,
            y: cy - 12 - boilLift * 0.4 + (Math.random() - 0.5) * 25,
            vx: (Math.random() - 0.5) * 12,
            vy: -26 - Math.random() * 28 * fi,
            r: 3 + Math.random() * 5,
            life: 0,
            maxLife: 1.0 + Math.random() * 0.5,
            kind: cs.boilLevel > 45 && Math.random() < 0.45 ? 'bubble' : 'steam',
            color: liqColor,
          });
        }
      }

      // Patti tea leaves (ONLY if pattiScoops > 0)
      if (cs.pattiScoops > 0) {
        for (let i = 0; i < Math.min(18, cs.pattiScoops * 5); i++) {
          const ang = (i * 1.6 + now * 0.0012) % (Math.PI * 2);
          const dist = 18 + (i % 4) * 12;
          ctx.fillStyle = ch.id === 'kashmiri-chai' ? '#14532D' : '#29170D';
          ctx.beginPath();
          ctx.arc(cx + Math.cos(ang) * dist, cy - 8 + Math.sin(ang) * (dist * 0.44), 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Sugar crystals (ONLY if cheeniScoops > 0 and dissolving)
      if (cs.cheeniScoops > 0 && cs.chaiProgress < 48) {
        for (let i = 0; i < Math.min(12, cs.cheeniScoops * 4); i++) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(cx - 22 + ((i * 11) % 44), cy - 14 + ((i * 7) % 16), 3, 3);
        }
      }

      // Ilaichi pods
      if (cs.addedBaseItems.includes('ilaichi')) {
        ctx.fillStyle = '#65A30D';
        ctx.beginPath();
        ctx.ellipse(cx - 26, cy - 6, 6, 3.5, 0.4, 0, Math.PI * 2);
        ctx.ellipse(cx + 24, cy - 2, 6, 3.5, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Garnish
      if (cs.garnishAdded) {
        [
          [-20, -12, '#84CC16'],
          [14, -14, '#FEF08A'],
          [0, 2, '#84CC16'],
          [26, -4, '#FEF08A'],
          [-28, 2, '#FEF08A'],
        ].forEach(([dx, dy, col]) => {
          ctx.fillStyle = col as string;
          ctx.beginPath();
          ctx.arc(cx + (dx as number), cy - 8 + (dy as number), 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Active Action Animations (Pour Stream, Spoon Tip, Cold Shock Wave, Ladle Phainti!)
      animsRef.current = animsRef.current.filter((ev) => {
        ev.t += dt / ev.duration;
        if (ev.t >= 1) return false;
        const p = ev.t;

        if (ev.kind === 'pour') {
          // Pouring liquid arc from upper left into patila
          ctx.save();
          ctx.strokeStyle = ev.color;
          ctx.lineWidth = 10 * (1 - p * 0.4);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(cx - 75, cy - 118);
          ctx.quadraticCurveTo(cx - 25, cy - 90, cx - 8, cy - 10);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(255,255,255,0.65)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(cx - 8, cy - 8, 12 + p * 48, 6 + p * 22, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (ev.kind === 'scoop') {
          // Animated Chamach spoon tipping granules into patila
          const tilt = Math.sin(p * Math.PI) * 0.5;
          ctx.save();
          ctx.translate(cx + 26, cy - 66);
          ctx.rotate(-tilt);
          ctx.strokeStyle = '#64748B';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(58, -22);
          ctx.stroke();
          ctx.fillStyle = '#CBD5E1';
          ctx.beginPath();
          ctx.ellipse(-6, 2, 12, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          for (let i = 0; i < 9; i++) {
            const gx = cx + 10 + ((i * 9) % 28) - 14;
            const gy = cy - 60 + p * 54 + (i % 3) * 5;
            ctx.fillStyle = ev.color;
            ctx.beginPath();
            ctx.arc(gx, gy, 2.6, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (ev.kind === 'shock') {
          // Cold water shock icy ring transforming into pink bloom
          ctx.strokeStyle = `rgba(244, 114, 182, ${1 - p})`;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.ellipse(cx, cy - 8, 20 + p * 74, 10 + p * 38, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (ev.kind === 'phainti') {
          // Brass Doi (Ladle) lifting & pouring tall frothy chai stream!
          const lift = Math.sin(p * Math.PI) * 78;
          ctx.save();
          ctx.strokeStyle = '#92400E';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(cx + 8, cy - 26 - lift);
          ctx.lineTo(cx + 62, cy - 72 - lift * 0.6);
          ctx.stroke();

          ctx.fillStyle = '#F59E0B';
          ctx.strokeStyle = '#2C1B12';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx + 4, cy - 22 - lift, 12, 0, Math.PI);
          ctx.fill();
          ctx.stroke();

          // Tall frothy pour stream back into the patila
          if (lift > 15) {
            ctx.strokeStyle = ev.color;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(cx + 2, cy - 18 - lift);
            ctx.lineTo(cx - 2, cy - 8);
            ctx.stroke();
          }
          ctx.restore();
        } else if (ev.kind === 'garnish') {
          for (let i = 0; i < 8; i++) {
            const gx = cx - 35 + ((i * 15) % 70);
            const gy = cy - 72 + p * 64 + (i % 3) * 4;
            ctx.fillStyle = i % 2 === 0 ? '#84CC16' : '#FEF08A';
            ctx.beginPath();
            ctx.arc(gx, gy, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        return true;
      });

      // Render particles
      particlesRef.current = particlesRef.current.filter((pt) => {
        pt.life += dt;
        if (pt.life >= pt.maxLife) return false;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        const t = pt.life / pt.maxLife;
        if (pt.kind === 'steam') {
          ctx.fillStyle = `rgba(255, 251, 240, ${(1 - t) * 0.45})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.r * (1 + t), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - t) * 0.75})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.r * 0.65, 0, Math.PI * 2);
          ctx.stroke();
        }
        return true;
      });

      if (dragOver) {
        ctx.strokeStyle = '#D98A1E';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([8, 5]);
        ctx.beginPath();
        ctx.ellipse(cx, cy - 4, 124, 68, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!isDragOver) onDragStateChange(true);
      }}
      onDragLeave={() => onDragStateChange(false)}
      onDrop={(e) => {
        e.preventDefault();
        onDragStateChange(false);
        const kind = e.dataTransfer.getData('text/chai-action');
        if (kind) onDropAction(kind);
      }}
      onClick={() => {
        patilaBounceRef.current = 0.65;
        soundEngine.playBubble();
        onPatilaTap();
      }}
      title="Tap Patila to do Phainti swirl or drop ingredients here"
      className="rounded-2xl bg-gradient-to-b from-[#F8EFE2] to-[#EAD7BE] border border-[#2C1B12]/15 py-2 flex items-center justify-center cursor-pointer select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full max-w-[440px] h-auto aspect-[440/320]"
        aria-label="Interactive Brass Chai Patila"
      />
    </div>
  );
};
