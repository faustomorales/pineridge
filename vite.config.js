import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        handout: resolve(__dirname, "handout.html"),
        vanMagnet: resolve(__dirname, "van-magnet.html"),
        studentExpectations: resolve(__dirname, "student-expectations.html"),
      },
    },
  },
});
