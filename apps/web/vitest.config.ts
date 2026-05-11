import path from "node:path";
import react from "@vitejs/plugin-react";

export default {
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: true,
    include: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}"]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
};