import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const fromRoot = (part) => fileURLToPath(new URL(part, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": fromRoot("./src"),
      "next/image": fromRoot("./src/browser-image.tsx"),
      "next/link": fromRoot("./src/browser-link.tsx"),
      "next/navigation": fromRoot("./src/browser-navigation.ts"),
      "next-intl": "use-intl",
    },
  },
  plugins: [{
    name: "campus-static-route",
    async closeBundle() {
      await mkdir(fromRoot("./dist/campus"), { recursive: true });
      await copyFile(fromRoot("./dist/index.html"), fromRoot("./dist/campus/index.html"));
    },
  }],
});
