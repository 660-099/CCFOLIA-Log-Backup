import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import imgurHandler from "./api/imgur.ts";
import imageProxyHandler from "./api/imageProxy.ts";

async function startServer() {
  const app = express();
  const portArgIndex = process.argv.indexOf('--port');
  const portFromArg = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : undefined;
  const PORT = Number(process.env.PORT) || portFromArg || 3000;

  const hostArgIndex = process.argv.indexOf('--host');
  const hostFromArg = hostArgIndex !== -1 ? process.argv[hostArgIndex + 1] : undefined;
  const HOST = hostFromArg || process.env.HOST || "0.0.0.0";

  // JSON 파싱 미들웨어
  app.use(express.json());

  // API 라우트
  app.post("/api/imgur", imgurHandler);
  app.get("/api/image-proxy", imageProxyHandler);

  // Vite 미들웨어 및 SPA 처리
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
