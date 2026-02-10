// ../../src/app/vite.config.js
import { defineConfig } from "file:///home/op/Dev/gsender/node_modules/vite/dist/node/index.js";
import path from "path";
import react from "file:///home/op/Dev/gsender/node_modules/@vitejs/plugin-react/dist/index.mjs";
import tailwindcss from "file:///home/op/Dev/gsender/node_modules/tailwindcss/lib/index.js";
import tsconfigPaths from "file:///home/op/Dev/gsender/node_modules/vite-tsconfig-paths/dist/index.js";
import { patchCssModules } from "file:///home/op/Dev/gsender/node_modules/vite-css-modules/dist/index.mjs";
import { nodePolyfills } from "file:///home/op/Dev/gsender/node_modules/vite-plugin-node-polyfills/dist/index.js";
import { sentryVitePlugin } from "file:///home/op/Dev/gsender/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
var __vite_injected_original_dirname = "/home/op/Dev/gsender/src/app";
var vite_config_default = defineConfig({
  root: path.resolve(__vite_injected_original_dirname, "./"),
  // Set root to the directory containing index.html
  base: "./",
  css: {
    postcss: {
      plugins: [tailwindcss()]
    },
    preprocessorOptions: { stylus: { modules: true } },
    modules: {
      // Enable CSS Modules for all .scss files
      localsConvention: "camelCaseOnly",
      generateScopedName: "[name]__[local]___[hash:base64:5]"
    },
    devSourcemap: true
  },
  plugins: [
    tsconfigPaths(),
    react(),
    patchCssModules(),
    tailwindcss(),
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      include: ["process"],
      globals: { global: true, process: true }
    }),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN
    })
  ],
  resolve: {
    alias: {
      app: path.resolve(__vite_injected_original_dirname, "./src"),
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  define: {},
  server: {
    hmr: {
      overlay: false
    }
  },
  optimizeDeps: {
    include: ["**/*.styl"]
  },
  build: {
    sourcemap: true
    /*rollupOptions: {
        rollupOptions: {
            external: ['unenv/node/process']
        }
    }*/
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2FwcC92aXRlLmNvbmZpZy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL29wL0Rldi9nc2VuZGVyL3NyYy9hcHBcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL29wL0Rldi9nc2VuZGVyL3NyYy9hcHAvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvb3AvRGV2L2dzZW5kZXIvc3JjL2FwcC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ3RhaWx3aW5kY3NzJztcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gJ3ZpdGUtdHNjb25maWctcGF0aHMnO1xuaW1wb3J0IHsgcGF0Y2hDc3NNb2R1bGVzIH0gZnJvbSAndml0ZS1jc3MtbW9kdWxlcyc7XG5pbXBvcnQgeyBub2RlUG9seWZpbGxzIH0gZnJvbSAndml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMnO1xuaW1wb3J0IHsgc2VudHJ5Vml0ZVBsdWdpbiB9IGZyb20gJ0BzZW50cnkvdml0ZS1wbHVnaW4nO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIHJvb3Q6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLycpLCAvLyBTZXQgcm9vdCB0byB0aGUgZGlyZWN0b3J5IGNvbnRhaW5pbmcgaW5kZXguaHRtbFxuICAgIGJhc2U6ICcuLycsXG4gICAgY3NzOiB7XG4gICAgICAgIHBvc3Rjc3M6IHtcbiAgICAgICAgICAgIHBsdWdpbnM6IFt0YWlsd2luZGNzcygpXSxcbiAgICAgICAgfSxcbiAgICAgICAgcHJlcHJvY2Vzc29yT3B0aW9uczogeyBzdHlsdXM6IHsgbW9kdWxlczogdHJ1ZSB9IH0sXG4gICAgICAgIG1vZHVsZXM6IHtcbiAgICAgICAgICAgIC8vIEVuYWJsZSBDU1MgTW9kdWxlcyBmb3IgYWxsIC5zY3NzIGZpbGVzXG4gICAgICAgICAgICBsb2NhbHNDb252ZW50aW9uOiAnY2FtZWxDYXNlT25seScsXG4gICAgICAgICAgICBnZW5lcmF0ZVNjb3BlZE5hbWU6ICdbbmFtZV1fX1tsb2NhbF1fX19baGFzaDpiYXNlNjQ6NV0nLFxuICAgICAgICB9LFxuICAgICAgICBkZXZTb3VyY2VtYXA6IHRydWUsXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICAgIHRzY29uZmlnUGF0aHMoKSxcbiAgICAgICAgcmVhY3QoKSxcbiAgICAgICAgcGF0Y2hDc3NNb2R1bGVzKCksXG4gICAgICAgIHRhaWx3aW5kY3NzKCksXG4gICAgICAgIG5vZGVQb2x5ZmlsbHMoe1xuICAgICAgICAgICAgLy8gVG8gYWRkIG9ubHkgc3BlY2lmaWMgcG9seWZpbGxzLCBhZGQgdGhlbSBoZXJlLiBJZiBubyBvcHRpb24gaXMgcGFzc2VkLCBhZGRzIGFsbCBwb2x5ZmlsbHNcbiAgICAgICAgICAgIGluY2x1ZGU6IFsncHJvY2VzcyddLFxuICAgICAgICAgICAgZ2xvYmFsczogeyBnbG9iYWw6IHRydWUsIHByb2Nlc3M6IHRydWUgfSxcbiAgICAgICAgfSksXG4gICAgICAgIHNlbnRyeVZpdGVQbHVnaW4oe1xuICAgICAgICAgICAgb3JnOiBwcm9jZXNzLmVudi5TRU5UUllfT1JHLFxuICAgICAgICAgICAgcHJvamVjdDogcHJvY2Vzcy5lbnYuU0VOVFJZX1BST0pFQ1QsXG4gICAgICAgICAgICBhdXRoVG9rZW46IHByb2Nlc3MuZW52LlNFTlRSWV9BVVRIX1RPS0VOLFxuICAgICAgICB9KSxcbiAgICBdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgICAgYWxpYXM6IHtcbiAgICAgICAgICAgIGFwcDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgZGVmaW5lOiB7fSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgICAgaG1yOiB7XG4gICAgICAgICAgICBvdmVybGF5OiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgICBpbmNsdWRlOiBbJyoqLyouc3R5bCddLFxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgICAgc291cmNlbWFwOiB0cnVlLFxuICAgICAgICAvKnJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBleHRlcm5hbDogWyd1bmVudi9ub2RlL3Byb2Nlc3MnXVxuICAgICAgICAgICAgfVxuICAgICAgICB9Ki9cbiAgICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNRLFNBQVMsb0JBQW9CO0FBQ25TLE9BQU8sVUFBVTtBQUNqQixPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFDeEIsT0FBTyxtQkFBbUI7QUFDMUIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyx3QkFBd0I7QUFQakMsSUFBTSxtQ0FBbUM7QUFTekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsTUFBTSxLQUFLLFFBQVEsa0NBQVcsSUFBSTtBQUFBO0FBQUEsRUFDbEMsTUFBTTtBQUFBLEVBQ04sS0FBSztBQUFBLElBQ0QsU0FBUztBQUFBLE1BQ0wsU0FBUyxDQUFDLFlBQVksQ0FBQztBQUFBLElBQzNCO0FBQUEsSUFDQSxxQkFBcUIsRUFBRSxRQUFRLEVBQUUsU0FBUyxLQUFLLEVBQUU7QUFBQSxJQUNqRCxTQUFTO0FBQUE7QUFBQSxNQUVMLGtCQUFrQjtBQUFBLE1BQ2xCLG9CQUFvQjtBQUFBLElBQ3hCO0FBQUEsSUFDQSxjQUFjO0FBQUEsRUFDbEI7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNMLGNBQWM7QUFBQSxJQUNkLE1BQU07QUFBQSxJQUNOLGdCQUFnQjtBQUFBLElBQ2hCLFlBQVk7QUFBQSxJQUNaLGNBQWM7QUFBQTtBQUFBLE1BRVYsU0FBUyxDQUFDLFNBQVM7QUFBQSxNQUNuQixTQUFTLEVBQUUsUUFBUSxNQUFNLFNBQVMsS0FBSztBQUFBLElBQzNDLENBQUM7QUFBQSxJQUNELGlCQUFpQjtBQUFBLE1BQ2IsS0FBSyxRQUFRLElBQUk7QUFBQSxNQUNqQixTQUFTLFFBQVEsSUFBSTtBQUFBLE1BQ3JCLFdBQVcsUUFBUSxJQUFJO0FBQUEsSUFDM0IsQ0FBQztBQUFBLEVBQ0w7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNILEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUNwQyxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDeEM7QUFBQSxFQUNKO0FBQUEsRUFDQSxRQUFRLENBQUM7QUFBQSxFQUNULFFBQVE7QUFBQSxJQUNKLEtBQUs7QUFBQSxNQUNELFNBQVM7QUFBQSxJQUNiO0FBQUEsRUFDSjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1YsU0FBUyxDQUFDLFdBQVc7QUFBQSxFQUN6QjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0gsV0FBVztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1mO0FBQ0osQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
