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
        signTutoring: resolve(__dirname, "signs/tutoring.html"),
        signKidsChurch: resolve(__dirname, "signs/kids-church.html"),
        signGreenhouseYouth: resolve(__dirname, "signs/greenhouse-youth.html"),
      },
    },
  },
});
