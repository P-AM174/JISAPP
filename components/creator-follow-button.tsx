"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { isFollowingCreator, toggleFollowCreator } from "@/lib/follow-creators";

export function CreatorFollowButton({
  creatorName,
  className,
  size = "sm",
}: {
  creatorName: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const [following, setFollowing] = useState(() => isFollowingCreator(creatorName));

  if (!creatorName.trim() || creatorName === "匿名") return null;

  return (
    <button
      type="button"
      onClick={() => setFollowing(toggleFollowCreator(creatorName))}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold transition-all active:scale-95",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        following
          ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200",
        className
      )}
    >
      {following ? (
        <>
          <UserCheck className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          フォロー中
        </>
      ) : (
        <>
          <UserPlus className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          フォローする
        </>
      )}
    </button>
  );
}
