import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import contentCollections from "@content-collections/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    contentCollections(), // MUST come after react()
  ],
});
