import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import vue from "@vitejs/plugin-vue";
import { dirname, resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    vue(),
    VueI18nPlugin({
      runtimeOnly: false,
      include: resolve(dirname(fileURLToPath(import.meta.url)), "./src/i18n/**"),
    }),
  ],
  resolve: {
    alias: {
      "@common": fileURLToPath(new URL("../common/dist", import.meta.url)),
      "@client": fileURLToPath(new URL("./src", import.meta.url)),
      stream: "stream-browserify",
      buffer: "buffer",
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@client/assets/scss/_variables.scss";`,
      },
    },
  },
  server: {
    // in dev mode we have to proxy all api calls to the api server which runs on localhost:5000 in dev.
    // In prod mode it is done the other way around: The server will serve the built files for the client.
    proxy: {
      "/api": {
        target: "http://localhost:5000",
      },
    },
  },
});
