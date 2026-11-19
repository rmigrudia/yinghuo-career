import type { ComponentProps } from "react";

type BrowserImageProps = ComponentProps<"img"> & {
  fill?: boolean;
  preload?: boolean;
  unoptimized?: boolean;
};

export default function BrowserImage({ fill, preload, unoptimized: _unoptimized, style, ...props }: BrowserImageProps) {
  return (
    <img
      {...props}
      style={fill ? { position: "absolute", width: "100%", height: "100%", inset: 0, objectFit: "cover", ...style } : style}
      fetchPriority={preload ? "high" : undefined}
    />
  );
}
