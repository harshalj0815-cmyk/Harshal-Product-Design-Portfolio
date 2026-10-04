import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Large audio files can EBUSY-crash the watcher on Windows
      ignored: ["**/public/audio/**"],
    },
  },
});
