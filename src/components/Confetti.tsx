const PIECE_COUNT = 24;
const SHADES = ["bg-white", "bg-neutral-300", "bg-neutral-500"];

export function Confetti() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden motion-reduce:hidden"
    >
      {Array.from({ length: PIECE_COUNT }, (_, i) => (
        <span
          key={i}
          className={`confetti-piece absolute top-[-10px] block h-2 w-2 rounded-sm ${SHADES[i % SHADES.length]}`}
          style={{
            left: `${(i * 97) % 100}%`,
            animationDelay: `${(i % 8) * 0.15}s`,
            opacity: 0.3 + (i % 5) * 0.15,
          }}
        />
      ))}
    </div>
  );
}
