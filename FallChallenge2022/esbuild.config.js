/* eslint-disable import/no-extraneous-dependencies */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: ["src/main.ts"],
    outfile: "dist/index.js",
    bundle: true,
    minify: false,
    platform: "node",
    sourcemap: false,
    target: "node16",
    watch: true,
    tsconfig: "./tsconfig.json",
  })
  .catch((err) => {
    console.log("Error building", err);
    process.exit(1);
  });
