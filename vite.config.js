import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  root: "test",
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    open: "/test/index.html",
    host: '0.0.0.0', // Allow access from network (for mobile debugging)
    port: 5173
  }
};
