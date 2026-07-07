import type { User } from "@/lib/types";

interface UserAvatarProps {
  user: User;
  size?: "xs" | "sm";
}

export default function UserAvatar({ user, size = "xs" }: UserAvatarProps) {
  const dims = size === "xs" ? "h-5 w-5 text-[10px]" : "h-7 w-7 text-xs";
  const initial = user.username.charAt(0).toUpperCase();

  return (
    <div
      className={`${dims} flex shrink-0 items-center justify-center rounded-full font-bold text-white`}
      style={{ backgroundColor: user.avatarColor }}
    >
      {initial}
    </div>
  );
}
