import { useRef, useEffect, useCallback, useState } from 'react';
import type { Movie } from '../../types/movie';

interface SlotMachineReelProps {
  movies: Movie[];
  spinning: boolean;
  onLanded: (movie: Movie) => void;
}

// Mobile dimensions
const SM_POSTER_HEIGHT = 160;
const SM_POSTER_WIDTH = 107;
// Desktop dimensions
const LG_POSTER_HEIGHT = 240;
const LG_POSTER_WIDTH = 160;

const POSTER_GAP = 12;
const VISIBLE_COUNT = 3;
const SPIN_DURATION = 5000;

function getDimensions() {
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  const pw = isDesktop ? LG_POSTER_WIDTH : SM_POSTER_WIDTH;
  const ph = isDesktop ? LG_POSTER_HEIGHT : SM_POSTER_HEIGHT;
  return { pw, ph, itemH: ph + POSTER_GAP };
}

function buildReel(movies: Movie[], winnerIndex: number) {
  const minItems = Math.max(30, movies.length * 3);
  const repeatCount = Math.ceil(minItems / movies.length);
  const reel: Movie[] = [];

  for (let i = 0; i < repeatCount; i++) {
    reel.push(...movies);
  }

  const centerOffset = Math.floor(VISIBLE_COUNT / 2);
  const targetIndex = reel.length - 1 - centerOffset;
  reel[targetIndex] = movies[winnerIndex];

  return { reel, targetIndex };
}

function Poster({ movie, width, height }: { movie: Movie; width: number; height: number }) {
  return (
    <div
      className="shrink-0 rounded-lg overflow-hidden bg-slate-800/50"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {movie.poster_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
          alt={movie.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs text-center px-1">
          {movie.title}
        </div>
      )}
    </div>
  );
}

export function SlotMachineReel({ movies, spinning, onLanded }: SlotMachineReelProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const hasLandedRef = useRef(false);
  const [reel, setReel] = useState<Movie[]>([]);
  const [targetIdx, setTargetIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dims, setDims] = useState(getDimensions);

  // Re-measure on resize
  useEffect(() => {
    const onResize = () => setDims(getDimensions());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!spinning || movies.length === 0) return;

    hasLandedRef.current = false;
    const currentDims = getDimensions();
    setDims(currentDims);

    const winnerIndex = Math.floor(Math.random() * movies.length);
    const { reel: newReel, targetIndex } = buildReel(movies, winnerIndex);

    setReel(newReel);
    setTargetIdx(targetIndex);

    const strip = stripRef.current;
    if (!strip) return;

    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0px)';
    strip.getBoundingClientRect();

    const centerOffset = Math.floor(VISIBLE_COUNT / 2);
    const finalY = -(targetIndex - centerOffset) * currentDims.itemH;

    strip.style.transition = `transform ${SPIN_DURATION}ms cubic-bezier(0.15, 0.6, 0.25, 1)`;
    strip.style.transform = `translateY(${finalY}px)`;

    setIsAnimating(true);
  }, [spinning, movies]);

  const handleTransitionEnd = useCallback(() => {
    if (hasLandedRef.current) return;
    hasLandedRef.current = true;
    setIsAnimating(false);

    const winner = reel[targetIdx];
    if (winner) {
      setTimeout(() => onLanded(winner), 400);
    }
  }, [reel, targetIdx, onLanded]);

  const showReel = isAnimating || spinning;
  const centerSlotTop = Math.floor(VISIBLE_COUNT / 2) * dims.itemH;
  const staticMovies = movies.slice(0, VISIBLE_COUNT);

  return (
    <div
      className="relative mx-auto overflow-hidden flex-1 min-h-0"
      style={{ width: `${dims.pw}px` }}
    >
      {/* Top/bottom darkening overlays — heavy fade so only center poster is clear */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{
          height: `${centerSlotTop + 6}px`,
          background: 'linear-gradient(to bottom, rgba(2,6,23,0.8) 0%, rgba(2,6,23,0.6) 60%, rgba(2,6,23,0.2) 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{
          height: `calc(100% - ${centerSlotTop + dims.ph + 6}px)`,
          background: 'linear-gradient(to top, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.7) 60%, rgba(2,6,23,0.25) 100%)',
        }}
      />

      {/* Center highlight — glowing selection frame */}
      <div
        className="absolute z-10 pointer-events-none rounded-xl border-[3px] border-pink-400 shadow-[0_0_30px_rgba(236,72,153,0.6),0_0_60px_rgba(236,72,153,0.3),inset_0_0_30px_rgba(236,72,153,0.15)]"
        style={{
          top: `${centerSlotTop - 6}px`,
          height: `${dims.ph + 12}px`,
          left: '-8px',
          right: '-8px',
        }}
      />

      {/* Scrolling strip */}
      <div
        ref={stripRef}
        className="flex flex-col"
        style={{ gap: `${POSTER_GAP}px` }}
        onTransitionEnd={handleTransitionEnd}
      >
        {(showReel ? reel : staticMovies).map((movie, i) => (
          <Poster key={`${movie.id}-${i}`} movie={movie} width={dims.pw} height={dims.ph} />
        ))}
      </div>
    </div>
  );
}
