import type { PlannerStickerKey } from "@/lib/planner-media";

type StickerArtProps = {
  stickerKey: PlannerStickerKey;
};

export function StickerArt({ stickerKey }: StickerArtProps) {
  if (stickerKey === "flower") {
    return (
      <svg className="sticker-art" viewBox="0 0 100 100" aria-hidden="true">
        <g fill="#ed8897" stroke="#684b49" strokeWidth="3" strokeLinejoin="round">
          <ellipse cx="50" cy="25" rx="14" ry="22" />
          <ellipse cx="75" cy="48" rx="22" ry="14" />
          <ellipse cx="60" cy="75" rx="14" ry="22" />
          <ellipse cx="25" cy="53" rx="22" ry="14" />
        </g>
        <path d="M37 67C22 73 16 86 17 92c13 0 24-8 29-19" fill="#9eb47e" stroke="#684b49" strokeWidth="3" />
        <circle cx="50" cy="51" r="14" fill="#f2c967" stroke="#684b49" strokeWidth="3" />
      </svg>
    );
  }

  if (stickerKey === "star") {
    return (
      <svg className="sticker-art" viewBox="0 0 100 100" aria-hidden="true">
        <path d="m50 9 11 25 27 3-20 18 6 27-24-14-24 14 6-27-20-18 27-3Z" fill="#f3c961" stroke="#684b49" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="42" cy="49" r="2.6" fill="#684b49" />
        <circle cx="59" cy="49" r="2.6" fill="#684b49" />
        <path d="M44 58q7 7 14 0" fill="none" stroke="#684b49" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (stickerKey === "heart") {
    return (
      <svg className="sticker-art" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M50 84C36 70 14 57 14 35c0-13 9-22 21-22 8 0 13 4 15 10 3-6 8-10 16-10 12 0 21 9 21 22 0 22-23 35-37 49Z" fill="#ee9eaa" stroke="#684b49" strokeWidth="3" strokeLinejoin="round" />
        <path d="M27 30c3-6 8-8 14-7" fill="none" stroke="#fff5ed" strokeWidth="4" strokeLinecap="round" opacity=".8" />
      </svg>
    );
  }

  if (stickerKey === "rainbow") {
    return (
      <svg className="sticker-art" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M17 70a33 33 0 0 1 66 0" fill="none" stroke="#de8e96" strokeWidth="17" />
        <path d="M27 70a23 23 0 0 1 46 0" fill="none" stroke="#efc56c" strokeWidth="14" />
        <path d="M38 70a12 12 0 0 1 24 0" fill="none" stroke="#8fb3aa" strokeWidth="10" />
        <g fill="#fff9ef" stroke="#684b49" strokeWidth="2.5"><circle cx="19" cy="70" r="14" /><circle cx="34" cy="72" r="12" /><circle cx="66" cy="72" r="12" /><circle cx="82" cy="70" r="14" /></g>
      </svg>
    );
  }

  if (stickerKey === "cherry") {
    return (
      <svg className="sticker-art" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M48 50c1-23 11-31 27-35M48 49C43 30 35 24 25 23" fill="none" stroke="#68805e" strokeWidth="4" strokeLinecap="round" />
        <path d="M49 33c9-13 22-12 28-8-8 10-19 15-28 8Z" fill="#91aa75" stroke="#684b49" strokeWidth="2.5" />
        <circle cx="35" cy="66" r="18" fill="#d96868" stroke="#684b49" strokeWidth="3" />
        <circle cx="67" cy="67" r="18" fill="#e47777" stroke="#684b49" strokeWidth="3" />
        <circle cx="29" cy="59" r="4" fill="#ffd9d1" opacity=".8" />
        <circle cx="61" cy="60" r="4" fill="#ffd9d1" opacity=".8" />
      </svg>
    );
  }

  return (
    <svg className="sticker-art" viewBox="0 0 100 100" aria-hidden="true">
      <g fill="#f0c868" stroke="#684b49" strokeWidth="2.5" strokeLinejoin="round">
        <path d="m50 8 5 15 15 5-15 5-5 15-5-15-15-5 15-5Z" />
        <path d="m77 47 3 10 10 3-10 3-3 10-3-10-10-3 10-3Z" />
        <path d="m28 56 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" />
      </g>
    </svg>
  );
}
