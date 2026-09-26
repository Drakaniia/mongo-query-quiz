import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import { defineConfig } from "vite-plus";

export default defineConfig(({ command }) => ({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [varlockVitePlugin({ ssrInjectMode: "resolved-env" }), tailwindcss(), reactRouter()],
  ssr: {
    // The deployment artifact has no node_modules; bundle all server dependencies.
    noExternal: command === "build" ? true : undefined,
  },
  environments: {
    ssr: {
      build: {
        rollupOptions: {
          input: "./prisma.server.ts",
        },
      },
    },
  },
}));
