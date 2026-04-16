import { useRef, useEffect, useCallback, useState } from 'react';
import type { Movie } from '../../types/movie';

interface SlotMachineReelProps {
  movies: Movie[];
  spinning: boolean;
  onLanded: (movie: Movie) => void;
}

const POSTER_HEIGHT = 288; // h-72 = 18rem = 288px
const POSTER_GAP = 16;    // gap-4
const ITEM_HEIGHT = POSTER_HEIGHT + POSTER_GAP;
const VISIBLE_COUNT = 3;
const SPIN_DURATION = 5000; // 5 seconds

/**
 * Build an extended reel array that repeats movies enough times
 * to fill the spin animation, plus determines the winning index.
 */
function buildReel(movies: Movie[], winnerIndex: number) {
  // We want enough items to scroll through for ~5s at high speed.
  // Minimum ~30 items gives a convincing spin feel.
  const minItems = Math.max(30, movies.length * 3);
  const repeatCount = Math.ceil(minItems / movies.length);
  const reel: Movie[] = [];

  for (let i = 0; i < repeatCount; i++) {
    reel.push(...movies);
  }

  // Place the winner near the end so the reel scrolls a long distance.
  // We want the winner to land in the center of the visible window.
  const centerOffset = Math.floor(VISIBLE_COUNT / 2);
  const targetIndex = reel.length - 1 - centerOffset;

  // Replace the item at targetIndex with the winner
  reel[targetIndex] = movies[winnerIndex];

  return { reel, targetIndex };
}

export function SlotMachineReel({ movies, spinning, onLanded }: SlotMachineReelProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const hasLandedRef = useRef(false);
  const [reel, setReel] = useState<Movie[]>(movies);
  const [targetIdx, setTargetIdx] = useState(Math.floor(VISIBLE_COUNT / 2));
  const [isAnimating, setIsAnimating] = useState(false);

  // When spinning starts, build a new reel with a random winner
  useEffect(() => {
    if (!spinning || movies.length === 0) return;

    hasLandedRef.current = false;

    const winnerIndex = Math.floor(Math.random() * movies.length);
    const { reel: newReel, targetIndex } = buildReel(movies, winnerIndex);

    setReel(newReel);
    setTargetIdx(targetIndex);

    // Reset position to top instantly, then animate
    const strip = stripRef.current;
    if (!strip) return;

    // Reset to top (no transition)
    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0px)';

    // Force reflow so the reset takes effect before we animate
    strip.getBoundingClientRect();

    // Calculate final position: center the target item in the visible window
    const centerOffset = Math.floor(VISIBLE_COUNT / 2);
    const finalY = -(targetIndex - centerOffset) * ITEM_HEIGHT;

    // Animate with cubic-bezier for a satisfying deceleration
    strip.style.transition = `transform ${SPIN_DURATION}ms cubic-bezier(0.15, 0.6, 0.25, 1)`;
    strip.style.transform = `translateY(${finalY}px)`;

    setIsAnimating(true);
  }, [spinning, movies]);

  // Handle transition end — fire onLanded
  const handleTransitionEnd = useCallback(() => {
    if (hasLandedRef.current) return;
    hasLandedRef.current = true;
    setIsAnimating(false);

    const winner = reel[targetIdx];
    if (winner) {
      // Small delay so the user sees it land before modal opens
      setTimeout(() => onLanded(winner), 400);
    }
  }, [reel, targetIdx, onLanded]);

  // Static display: show first few movies centered
  const displayReel = isAnimating || spinning ? reel : movies;
  const staticCenterOffset = Math.floor(VISIBLE_COUNT / 2);

  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{
        width: '12rem', // w-48
        height: `${VISIBLE_COUNT * ITEM_HEIGHT - POSTER_GAP}px`,
      }}
    >
      {/* Top/bottom fade overlays for depth effect */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none" />

      {/* Center highlight bracket */}
      <div
        className="absolute inset-x-0 z-10 pointer-events-none border-y-2 border-pink-500/60 rounded"
        style={{
          top: `${staticCenterOffset * ITEM_HEIGHT}px`,
          height: `${POSTER_HEIGHT}px`,
        }}
      />

      {/* Scrolling strip */}
      <div
        ref={stripRef}
        className="flex flex-col"
        style={{ gap: `${POSTER_GAP}px` }}
        onTransitionEnd={handleTransitionEnd}
      >
        {displayReel.map((movie, i) => (
          <div
            key={`${movie.id}-${i}`}
            className="shrink-0 rounded-xl overflow-hidden bg-slate-800/50"
            style={{ width: '12rem', height: `${POSTER_HEIGHT}px` }}
          >
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm text-center px-2">
                {movie.title}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
