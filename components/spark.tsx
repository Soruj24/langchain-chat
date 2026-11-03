import { cn } from "@/lib/utils";

export function Spark({
  spinning = false,
  className = "size-5",
}: {
  spinning?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(
        "shrink-0 text-[#D97757]",
        spinning && "animate-spin [animation-duration:3s]",
        className
      )}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M12 2.5v19" />
        <path d="M3.8 7.25l16.4 9.5" />
        <path d="M3.8 16.75l16.4-9.5" />
      </g>
    </svg>
  );
}
