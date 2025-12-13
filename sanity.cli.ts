import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'noose0ee',
    dataset: 'production'
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/cli#auto-updates
     */
    autoUpdates: true,
    appId: 'ij3bdthmgjgb1dv5ljdkhl3y',
  },
  typegen: {
    path: "../sample-den/groq/**/*.ts",
    schema: './schema.json',
    generates: '../sample-den/generated/groq/sanity-types.ts'
  },
  vite: {
    optimizeDeps: {
      exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
    },
    // Leave just in case, works without it
    // server: {
    //   // Required for SharedArrayBuffer (ffmpeg.wasm) - encoding is multithreaded
    //   headers: {
    //     'Cross-Origin-Opener-Policy': 'same-origin',
    //     'Cross-Origin-Embedder-Policy': 'require-corp',
    //   },
    // },
  },
})
