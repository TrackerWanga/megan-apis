import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import { exec } from "child_process";
import cors from "cors";
import {
  securityHeaders,
  antiClone,
  responseFingerprint,
  blockDirectSourceAccess,
  ipBlocklistGuard,
  botBlocker,
  globalLimiter,
} from "./security";

function autoUpdateYtDlp() {
  // First check if yt-dlp exists
  exec("which yt-dlp 2>&1", { timeout: 10000 }, (whichErr, whichStdout) => {
    if (whichErr || !whichStdout.trim()) {
      console.log("[yt-dlp] Not found. Installing via pip...");
      exec("pip install yt-dlp 2>&1 || pip3 install yt-dlp 2>&1", { timeout: 120000 }, (installErr, installStdout) => {
        if (installErr) {
          console.log("[yt-dlp] pip install failed, trying direct download...");
          exec("curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp 2>&1", { timeout: 60000 }, (dlErr, dlStdout) => {
            if (dlErr) {
              console.log(`[yt-dlp] All install methods failed: ${dlErr.message.substring(0, 100)}`);
            } else {
              console.log("[yt-dlp] Installed via direct download!");
            }
          });
        } else {
          console.log("[yt-dlp] Installed via pip!");
        }
      });
    } else {
      exec("yt-dlp --update-to stable 2>&1", { timeout: 60000 }, (err, stdout) => {
        if (err) {
          console.log(`[yt-dlp] Update skipped: ${err.message.substring(0, 100)}`);
          return;
        }
        console.log(`[yt-dlp] Updated: ${stdout.trim().split("\n")[0] || "done"}`);
      });
    }
  });
}

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.set("trust proxy", 1);
app.set("query parser", "extended");

// CORS — allow all origins for public API
app.use(cors());

// Security middleware
app.use(securityHeaders());
app.use(ipBlocklistGuard);
app.use(globalLimiter);
app.use(botBlocker);
app.use(blockDirectSourceAccess);
app.use(antiClone);
app.use(responseFingerprint);

app.use(
  express.json({
    limit: "5mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// URL decode validator
app.use((req: Request, res: Response, next: NextFunction) => {
  try {
    decodeURIComponent(req.path);
    if (req.query) {
      for (const key of Object.keys(req.query)) {
        const val = req.query[key];
        if (typeof val === "string") {
          decodeURIComponent(val);
        }
      }
    }
  } catch (e) {
    return res.status(400).json({ error: "Malformed URL encoding" });
  }
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  autoUpdateYtDlp();

  await registerRoutes(httpServer, app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return;
    }

    return res.status(status).json({ success: false, error: message });
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
