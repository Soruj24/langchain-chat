"use client";

type ThreadSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ThreadSearch({ value, onChange }: ThreadSearchProps) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search chats"
      aria-label="Search chats"
      className="w-full rounded-xl border border-[#E6E3D8] bg-white/70 px-3 py-2 text-sm placeholder:text-[#73726C] focus:border-[#D97757] focus:outline-none focus:ring-2 focus:ring-[#D97757]/20 dark:border-[#3F3E3A] dark:bg-[#30302E] dark:placeholder:text-[#A3A29B]"
    />
  );
}
