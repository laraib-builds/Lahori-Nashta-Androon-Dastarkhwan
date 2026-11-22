import React, { useEffect, useRef } from 'react';
import { HeatLevel, KitchenState, NashtaRecipe } from '../types/game';
import { soundEngine } from '../utils/sound';

interface CookwareCanvasProps {
  recipe: NashtaRecipe;
  kitchenState: KitchenState;
  isDragOver: boolean;
  onDropItem: (itemType: string, itemId: string) => void;
  onDragStateChange: (over: boolean) => void;
  onPanPoke?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  life: number;
  maxLife: number;
  kind: 'steam' | 'bubble' | 'spark';
  color?: string;
}

interface DropAnim {
  id: string;
  label: string;
  color: string;
  accent: string;
  t: number; // 0 -> 1
  duration: number;
  kind: 'drop' | 'splash' | 'spice';
}

export const CookwareCanvas: React.FC<CookwareCanvasProps> = ({
  recipe,
  kitchenState,
  isDragOver,
  onDropItem,
  onDragStateChange,
  onPanPoke,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ recipe, kitchenState, isDragOver });
  const particlesRef = useRef<Particle[]>([]);
  const dropsRef = useRef<DropAnim[]>([]);
  const stirAnimRef = useRef<number>(0); // 0..1 remaining stir duration
  const flipAnimRef = useRef<number>(0); // 0..1 remaining flip duration
  const pokeBounceRef = useRef<number>(0); // 0..1 cookware bounce on tap

  const prevIngredientsRef = useRef<string[]>([]);
  const prevMixedRef = useRef<boolean>(false);
  const prevFlippedRef = useRef<boolean>(false);
  const prevGarnishRef = useRef<boolean>(false);

  // Detect newly added ingredients, mix, flip, or garnish to trigger smooth canvas animations
  useEffect(() => {
    const prevList = prevIngredientsRef.current;
    const newlyAdded = kitchenState.addedIngredients.filter((id) => !prevList.includes(id));

    newlyAdded.forEach((id) => {
      const spec = recipe.ingredients.find((ing) => ing.id === id);
      if (spec) {
        dropsRef.current.push({
          id,
          label: spec.label,
          color: spec.color,
          accent: spec.accentColor,
          t: 0,
          duration: 0.55,
          kind: spec.category === 'spice' ? 'spice' : spec.category === 'fat' ? 'splash' : 'drop',
        });
        pokeBounceRef.current = 0.7;
        for (let i = 0; i < 14; i++) {
          const ang = (i / 14) * Math.PI * 2;
          particlesRef.current.push({
            x: 230 + Math.cos(ang) * 14,
            y: 175 + Math.sin(ang) * 8,
            vx: Math.cos(ang) * (45 + Math.random() * 55),
            vy: Math.sin(ang) * (20 + Math.random() * 25) - 25,
            r: 3 + Math.random() * 3,
            alpha: 0.9,
            life: 0,
            maxLife: 0.45 + Math.random() * 0.25,
            kind: 'spark',
            color: spec.color,
          });
        }
      }
    });
    prevIngredientsRef.current = [...kitchenState.addedIngredients];

    if (kitchenState.isMixed && !prevMixedRef.current) {
      stirAnimRef.current = 1.0;
    }
    prevMixedRef.current = kitchenState.isMixed;

    if (kitchenState.isFlipped && !prevFlippedRef.current) {
      flipAnimRef.current = 1.0;
      pokeBounceRef.current = 1.0;
    }
    prevFlippedRef.current = kitchenState.isFlipped;

    if (kitchenState.garnishAdded && !prevGarnishRef.current) {
      dropsRef.current.push({
        id: recipe.garnish.id,
        label: recipe.garnish.label,
        color: recipe.garnish.color,
        accent: recipe.garnish.accentColor,
        t: 0,
        duration: 0.65,
        kind: 'spice',
      });
    }
    prevGarnishRef.current = kitchenState.garnishAdded;
  }, [
    kitchenState.addedIngredients,
    kitchenState.isMixed,
    kitchenState.isFlipped,
    kitchenState.garnishAdded,
    recipe,
  ]);

  useEffect(() => {
    stateRef.current = { recipe, kitchenState, isDragOver };
  }, [recipe, kitchenState, isDragOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const renderFrame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      if (stirAnimRef.current > 0) stirAnimRef.current = Math.max(0, stirAnimRef.current - dt * 1.1);
      if (flipAnimRef.current > 0) flipAnimRef.current = Math.max(0, flipAnimRef.current - dt * 1.45);
      if (pokeBounceRef.current > 0) pokeBounceRef.current = Math.max(0, pokeBounceRef.current - dt * 3.2);

      const { recipe: rec, kitchenState: ks, isDragOver: dragOver } = stateRef.current;
      const dpr = window.devicePixelRatio || 1;
      const width = 460;
      const height = 340;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const bounceOffset = Math.sin(pokeBounceRef.current * Math.PI) * -6;
      const cx = width / 2;
      const cy = height / 2 + 12 + bounceOffset;

      // Burner base & Aanch flame glow underneath cookware
      const flameIntensity: Record<HeatLevel, number> = {
        band: 0.15,
        dheemi: 0.45,
        darmiyani: 0.78,
        tez: 1.0,
      };
      const fi = flameIntensity[ks.heatLevel];

      // Stove cast-iron ring (fixed on counter)
      ctx.fillStyle = '#2C1B12';
      ctx.beginPath();
      ctx.ellipse(width / 2, height / 2 + 88, 128, 34, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flame glow rings
      if (fi > 0.1) {
        const pulse = 1 + Math.sin(now * 0.014) * 0.07;
        const grad = ctx.createRadialGradient(width / 2, height / 2 + 82, 10, width / 2, height / 2 + 82, 120 * fi * pulse);
        grad.addColorStop(0, `rgba(59, 130, 246, ${0.8 * fi})`);
        grad.addColorStop(0.45, `rgba(249, 115, 22, ${0.65 * fi})`);
        grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2 + 82, 122 * fi * pulse, 34 * fi * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Glowing drop target ring when dragging
      if (dragOver) {
        ctx.save();
        ctx.strokeStyle = '#D98A1E';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.ellipse(cx, cy, 152, 112, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw specific authentic Lahori Cookware (STRICTLY EMPTY BY DEFAULT)
      if (rec.cookware === 'tawa') {
        ctx.fillStyle = '#3B2314';
        ctx.strokeStyle = '#1E110A';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(cx + 108, cy - 10, 92, 20, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#262220';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 4, 132, 92, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#383330';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 124, 84, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (rec.cookware === 'karahi') {
        ctx.strokeStyle = '#2C1B12';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx - 126, cy - 6, 18, Math.PI * 0.5, Math.PI * 1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 126, cy - 6, 18, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();

        ctx.fillStyle = '#B45309';
        ctx.strokeStyle = '#2C1B12';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 12, 130, 90, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#4A3728';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 118, 78, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = '#D97706';
        ctx.strokeStyle = '#2C1B12';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 16, 122, 86, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 114, 76, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#523A28';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 102, 66, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Flip mid-air arc transform
      const flipProgress = 1 - flipAnimRef.current; // 0 -> 1
      const flipLift = flipAnimRef.current > 0 ? Math.sin(flipProgress * Math.PI) * -42 : 0;
      const flipSquash = flipAnimRef.current > 0 ? Math.abs(Math.cos(flipProgress * Math.PI)) : 1;

      const added = ks.addedIngredients;
      const cookFrac = Math.min(1, ks.cookProgress / 100);
      const burnFrac = Math.min(1, ks.burnLevel / 100);

      // Empty state subtle prompt inside cookware
      if (added.length === 0) {
        ctx.fillStyle = 'rgba(255, 248, 235, 0.45)';
        ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Empty ${rec.cookwareLabel} · Drop or click ingredients`, cx, cy + 4);
      }

      // 1. Fat (Desi Ghee / Oil)
      const hasFat = added.some((id) => id === 'ghee' || id === 'oil');
      if (hasFat) {
        const shimmer = 1 + Math.sin(now * 0.008) * 0.04;
        const oilGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 88 * shimmer);
        oilGrad.addColorStop(0, 'rgba(251, 191, 36, 0.62)');
        oilGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.38)');
        oilGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = oilGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 88 * shimmer, 56 * shimmer, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Dish-specific live ingredient rendering with flip animation
      ctx.save();
      ctx.translate(cx, cy + flipLift);
      ctx.scale(1, Math.max(0.22, flipSquash));
      ctx.translate(-cx, -cy);

      if (rec.id === 'anda-half-fry' || rec.id === 'anda-full-fry') {
        const hasParatha = added.includes('lachha-dough') || added.includes('atta-paratha');
        const hasEgg = added.includes('egg');
        const hasSpice = added.includes('kali-mirch') || added.includes('lal-mirch');

        if (hasParatha) {
          const px = hasEgg ? cx - 44 : cx;
          const py = cy + 2;
          const baseColor =
            burnFrac > 0.45
              ? '#5C2C16'
              : ks.isFlipped || cookFrac > 0.45
                ? '#C67D30'
                : '#E6C28B';
          ctx.fillStyle = baseColor;
          ctx.strokeStyle = '#2C1B12';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(px, py, 50, 38, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = ks.isFlipped ? '#78350F' : '#B47B38';
          ctx.lineWidth = 1.6;
          if (rec.id === 'anda-half-fry') {
            for (let r = 12; r <= 34; r += 11) {
              ctx.beginPath();
              ctx.ellipse(px, py, r, r * 0.72, 0, 0, Math.PI * 1.8);
              ctx.stroke();
            }
          } else if (ks.isFlipped || cookFrac > 0.35) {
            [
              [-18, -10],
              [12, 8],
              [-6, 14],
              [16, -12],
            ].forEach(([dx, dy]) => {
              ctx.fillStyle = '#78350F';
              ctx.beginPath();
              ctx.arc(px + dx, py + dy, 3.5, 0, Math.PI * 2);
              ctx.fill();
            });
          }
        }

        if (hasEgg) {
          const ex = hasParatha ? cx + 44 : cx;
          const ey = cy;
          ctx.fillStyle = cookFrac > 0.65 ? '#FFFBEB' : '#F8FAFC';
          ctx.strokeStyle = '#2C1B12';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(ex, ey, 38, 28, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          const yolkColor =
            burnFrac > 0.5
              ? '#9A3412'
              : rec.id === 'anda-half-fry'
                ? '#F59E0B'
                : ks.isFlipped
                  ? '#EA580C'
                  : '#FBBF24';
          ctx.fillStyle = yolkColor;
          ctx.beginPath();
          ctx.arc(ex, ey, rec.id === 'anda-half-fry' ? 12 : 11, 0, Math.PI * 2);
          ctx.fill();

          if (rec.id === 'anda-half-fry' && burnFrac < 0.4) {
            ctx.fillStyle = '#FEF3C7';
            ctx.beginPath();
            ctx.arc(ex - 3.5, ey - 3.5, 3.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (hasSpice) {
          const sx = hasEgg ? cx + 44 : cx;
          const dots = [
            [-14, -6],
            [12, 8],
            [-6, 10],
            [8, -10],
            [0, 2],
          ];
          dots.forEach(([dx, dy]) => {
            ctx.fillStyle = rec.id === 'anda-half-fry' ? '#292524' : '#DC2626';
            ctx.beginPath();
            ctx.arc(sx + dx, cy + dy, 1.8, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      } else if (rec.id === 'masala-omelette') {
        const hasEggs = added.includes('beaten-eggs');
        const hasVeg = added.includes('pyaz-tamatar');
        const hasNaan = added.includes('tandoori-naan');

        if (hasEggs) {
          const omx = hasNaan ? cx - 26 : cx;
          ctx.fillStyle =
            burnFrac > 0.45 ? '#7C2D12' : ks.isFlipped ? '#EAB308' : '#FDE047';
          ctx.strokeStyle = '#2C1B12';
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (ks.isFlipped) {
            ctx.arc(omx, cy + 6, 48, Math.PI, 0);
            ctx.closePath();
          } else {
            ctx.ellipse(omx, cy, 58, 38, 0, 0, Math.PI * 2);
          }
          ctx.fill();
          ctx.stroke();
        }

        if (hasVeg) {
          const vx = hasNaan ? cx - 26 : cx;
          const pieces = [
            [-16, -8, '#DC2626'],
            [14, -4, '#16A34A'],
            [-4, 8, '#F8FAFC'],
            [8, -12, '#DC2626'],
            [-20, 5, '#16A34A'],
            [18, 6, '#F8FAFC'],
          ] as const;
          pieces.forEach(([dx, dy, col]) => {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(vx + dx, cy + (ks.isFlipped ? -Math.abs(dy) : dy), 3.2, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        if (hasNaan) {
          ctx.fillStyle = cookFrac > 0.5 ? '#D99B52' : '#E5B97F';
          ctx.strokeStyle = '#2C1B12';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx + 52, cy + 4, 34, 26, -0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } else if (rec.id === 'halwa-poori') {
        const hasHalwa = added.includes('sooji-halwa');
        const hasTarkari = added.includes('aloo-tarkari');
        const hasPoori = added.includes('poori-dough');

        if (hasHalwa) {
          ctx.fillStyle = ks.isMixed ? '#EA580C' : '#F59E0B';
          ctx.beginPath();
          ctx.ellipse(cx - 42, cy + 12, 34, 22, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        if (hasTarkari) {
          ctx.fillStyle = '#CA8A04';
          ctx.beginPath();
          ctx.ellipse(cx + 42, cy + 14, 30, 20, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FEF08A';
          ctx.fillRect(cx + 32, cy + 8, 8, 7);
          ctx.fillRect(cx + 45, cy + 14, 8, 7);
        }
        if (hasPoori) {
          const puffScale = ks.isFlipped ? 1.18 : 0.92 + cookFrac * 0.14;
          const pooriColor =
            burnFrac > 0.5 ? '#7C2D12' : ks.isFlipped ? '#F59E0B' : '#F3D299';
          ctx.fillStyle = pooriColor;
          ctx.strokeStyle = '#2C1B12';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy - 8, 42 * puffScale, 28 * puffScale, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          if (ks.isFlipped) {
            ctx.fillStyle = 'rgba(254, 243, 199, 0.55)';
            ctx.beginPath();
            ctx.ellipse(cx - 8, cy - 14, 18, 9, -0.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        const isPaye = rec.id === 'bong-paye';
        const hasSpice = added.includes('chana-masala') || added.includes('paye-masala');
        const hasBase = added.includes('boiled-channay') || added.includes('bong-tari');
        const hasBread = added.includes('kulcha-naan') || added.includes('roghni-naan');

        if (hasSpice && !hasBase) {
          ctx.fillStyle = isPaye ? '#991B1B' : '#78350F';
          ctx.beginPath();
          ctx.ellipse(cx, cy, 46, 28, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        if (hasBase) {
          ctx.fillStyle =
            burnFrac > 0.5
              ? '#451A03'
              : isPaye
                ? '#881337'
                : ks.isMixed
                  ? '#B45309'
                  : '#D97706';
          ctx.beginPath();
          ctx.ellipse(cx, cy, 88, 54, 0, 0, Math.PI * 2);
          ctx.fill();

          if (!isPaye) {
            const chanaOffsets = [
              [-35, -10],
              [-15, 14],
              [10, -16],
              [28, 8],
              [-4, -2],
              [42, -6],
              [-48, 8],
              [14, 22],
            ];
            chanaOffsets.forEach(([dx, dy]) => {
              ctx.fillStyle = '#FDE68A';
              ctx.beginPath();
              ctx.arc(cx + dx, cy + dy, 5.5, 0, Math.PI * 2);
              ctx.fill();
            });
          } else {
            ctx.fillStyle = '#7C2D12';
            ctx.strokeStyle = '#FDE68A';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.ellipse(cx - 10, cy, 24, 16, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }

        if (hasBread) {
          ctx.fillStyle = '#E6B87D';
          ctx.strokeStyle = '#2C1B12';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx + 68, cy - 34, 28, 18, 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      // 3. Nani Ka Secret Garnish
      if (ks.garnishAdded) {
        ctx.fillStyle = rec.garnish.color;
        ctx.strokeStyle = '#2C1B12';
        ctx.lineWidth = 1.2;
        if (rec.garnish.id.startsWith('makhan')) {
          ctx.beginPath();
          ctx.roundRect(cx - 32, cy - 8, 16, 12, 3);
          ctx.fill();
          ctx.stroke();
        }
        const gPoints = [
          [-18, -14],
          [14, -12],
          [-8, 14],
          [22, 6],
          [4, 2],
        ];
        gPoints.forEach(([dx, dy]) => {
          ctx.fillStyle = rec.garnish.accentColor;
          ctx.beginPath();
          ctx.arc(cx + dx, cy + dy, 3.2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.restore();

      // Animated Flying/Dropping Ingredient Effects
      dropsRef.current = dropsRef.current.filter((anim) => {
        anim.t += dt / anim.duration;
        if (anim.t >= 1) return false;
        const p = anim.t;
        const easeOut = 1 - Math.pow(1 - p, 3);

        if (anim.kind === 'spice') {
          // Falling spice / garnish shower
          for (let i = 0; i < 8; i++) {
            const sx = cx - 40 + ((i * 19) % 80);
            const sy = cy - 95 + easeOut * 95 + (i % 3) * 8;
            ctx.fillStyle = i % 2 === 0 ? anim.color : anim.accent;
            ctx.globalAlpha = 1 - p * 0.7;
            ctx.beginPath();
            ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        } else if (anim.kind === 'splash') {
          // Golden ghee/oil droplet + expanding ring
          const dy = cy - 90 + easeOut * 90;
          if (p < 0.55) {
            ctx.fillStyle = anim.color;
            ctx.beginPath();
            ctx.ellipse(cx, dy, 10, 14, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.strokeStyle = anim.color;
          ctx.lineWidth = 3 * (1 - p);
          ctx.beginPath();
          ctx.ellipse(cx, cy, 18 + easeOut * 65, 10 + easeOut * 38, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Swooping ingredient drop with bounce
          const dy = cy - 115 + easeOut * 115;
          const squash = p > 0.75 ? 1 + Math.sin(((p - 0.75) / 0.25) * Math.PI) * 0.28 : 1;
          ctx.save();
          ctx.translate(cx, dy);
          ctx.scale(squash, 2 - squash);
          ctx.fillStyle = anim.color;
          ctx.strokeStyle = '#2C1B12';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        return true;
      });

      // Animated Wooden Chamcha / Spoon Stirring Orbit
      if (stirAnimRef.current > 0) {
        const angle = (1 - stirAnimRef.current) * Math.PI * 4;
        const sx = cx + Math.cos(angle) * 42;
        const sy = cy + Math.sin(angle) * 24;
        ctx.save();
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 48, sy - 64);
        ctx.stroke();
        ctx.fillStyle = '#B45309';
        ctx.beginPath();
        ctx.ellipse(sx, sy, 12, 8, angle, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Particles (steam + sizzle bubbles + drop sparks)
      if (added.length > 0 && fi > 0.2) {
        if (Math.random() < fi * 0.45) {
          particlesRef.current.push({
            x: cx + (Math.random() - 0.5) * 110,
            y: cy + (Math.random() - 0.5) * 50,
            vx: (Math.random() - 0.5) * 14,
            vy: -24 - Math.random() * 28 * fi,
            r: 3 + Math.random() * 6,
            alpha: 0.45,
            life: 0,
            maxLife: 1.1 + Math.random() * 0.6,
            kind: Math.random() < 0.6 ? 'steam' : 'bubble',
          });
        }
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life += dt;
        if (p.life >= p.maxLife) return false;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const t = p.life / p.maxLife;
        if (p.kind === 'steam') {
          ctx.fillStyle =
            burnFrac > 0.5
              ? `rgba(80, 60, 50, ${(1 - t) * 0.45})`
              : `rgba(255, 251, 240, ${(1 - t) * 0.45})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (1 + t), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'spark') {
          ctx.fillStyle = p.color || '#F59E0B';
          ctx.globalAlpha = 1 - t;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (1 - t * 0.5), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          ctx.strokeStyle = `rgba(253, 224, 71, ${(1 - t) * 0.7})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 0.55, 0, Math.PI * 2);
          ctx.stroke();
        }
        return true;
      });

      ctx.restore();
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handlePanClick = () => {
    if (kitchenState.addedIngredients.length > 0) {
      pokeBounceRef.current = 0.8;
      soundEngine.playSizzle();
      onPanPoke?.();
    }
  };

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
        const itemType = e.dataTransfer.getData('text/item-type');
        const itemId = e.dataTransfer.getData('text/item-id');
        if (itemType && itemId) {
          onDropItem(itemType, itemId);
        }
      }}
      onClick={handlePanClick}
      className="relative w-full flex items-center justify-center select-none cursor-pointer"
      title={kitchenState.addedIngredients.length > 0 ? 'Tap pan to toss & sizzle!' : 'Drop ingredients here'}
    >
      <canvas
        ref={canvasRef}
        className="w-full max-w-[460px] h-auto aspect-[460/340]"
        aria-label={`${recipe.cookwareLabel} cooking surface`}
      />
    </div>
  );
};
