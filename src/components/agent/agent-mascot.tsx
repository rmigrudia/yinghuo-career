import Image from "next/image";
import { cn } from "@/lib/utils";

export function AgentMascot({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/roxy-agent-mascot.webp"
      alt=""
      width={320}
      height={320}
      draggable={false}
      unoptimized
      className={cn("h-full w-full select-none object-contain drop-shadow-[0_4px_5px_rgba(25,46,82,0.23)]", className)}
    />
  );
}
