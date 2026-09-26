import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  // Cloudflare Pages deploys build/client as static assets, so there is no
  // server runtime. Safe here: no loaders, actions or .server modules exist.
  ssr: false,
} satisfies Config;
