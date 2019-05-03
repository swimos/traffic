import nodeResolve from "rollup-plugin-node-resolve";
import sourcemaps from "rollup-plugin-sourcemaps";

const script = "swim-traffic";
const namespace = "swim.traffic";

const main = {
  input: "./lib/main/index.js",
  output: {
    file: `./dist/main/${script}.js`,
    name: namespace,
    format: "umd",
    globals: {
      "@swim/util": "swim",
      "@swim/codec": "swim",
      "@swim/collections": "swim",
      "@swim/structure": "swim",
      "@swim/streamlet": "swim",
      "@swim/dataflow": "swim",
      "@swim/math": "swim",
      "@swim/recon": "swim",
      "@swim/uri": "swim",
      "@swim/warp": "swim",
      "@swim/client": "swim",
      "@swim/core": "swim",

      "@swim/angle": "swim",
      "@swim/length": "swim",
      "@swim/color": "swim",
      "@swim/font": "swim",
      "@swim/transform": "swim",
      "@swim/interpolate": "swim",
      "@swim/scale": "swim",
      "@swim/transition": "swim",
      "@swim/animate": "swim",
      "@swim/dom": "swim",
      "@swim/style": "swim",
      "@swim/render": "swim",
      "@swim/constraint": "swim",
      "@swim/view": "swim",
      "@swim/shape": "swim",
      "@swim/typeset": "swim",
      "@swim/gesture": "swim",
      "@swim/ui": "swim",

      "@swim/gauge": "swim",
      "@swim/pie": "swim",
      "@swim/chart": "swim",
      "@swim/map": "swim",
      "@swim/mapbox": "swim",
      "@swim/ui": "swim",

      "mapbox-gl": "mapboxgl",
    },
    sourcemap: true,
    interop: false,
    extend: true,
  },
  external: [
    "@swim/util",
    "@swim/codec",
    "@swim/collections",
    "@swim/structure",
    "@swim/streamlet",
    "@swim/dataflow",
    "@swim/math",
    "@swim/time",
    "@swim/recon",
    "@swim/uri",
    "@swim/warp",
    "@swim/client",
    "@swim/core",

    "@swim/angle",
    "@swim/length",
    "@swim/color",
    "@swim/font",
    "@swim/transform",
    "@swim/interpolate",
    "@swim/scale",
    "@swim/transition",
    "@swim/animate",
    "@swim/dom",
    "@swim/style",
    "@swim/render",
    "@swim/constraint",
    "@swim/view",
    "@swim/shape",
    "@swim/typeset",
    "@swim/gesture",
    "@swim/ui",

    "@swim/gauge",
    "@swim/pie",
    "@swim/chart",
    "@swim/map",
    "@swim/mapbox",
    "@swim/ui",

    "mapbox-gl",
  ],
  plugins: [
    nodeResolve({customResolveOptions: {paths: "."}}),
    sourcemaps(),
  ],
  onwarn(warning, warn) {
    if (warning.code === "CIRCULAR_DEPENDENCY") return;
    warn(warning);
  },
};

const targets = [main];
targets.main = main;
export default targets;
