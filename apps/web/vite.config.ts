import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import { defineConfig } from "vite-plus";

export default defineConfig(() => ({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [varlockVitePlugin({ ssrInjectMode: "resolved-env" }), tailwindcss(), reactRouter()],
}));
