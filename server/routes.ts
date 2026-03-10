import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateQRCode, validateUrl, validateFormat } from "./qr";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "qr-generator" });
  });

  app.get("/api/qr", async (req, res) => {
    try {
      const url = req.query.url as string | undefined;
      const format = (req.query.format as string | undefined) || "png";

      const urlError = validateUrl(url);
      if (urlError) {
        const status = urlError.code === "MISSING_URL" || urlError.code === "EMPTY_URL" ? 422 : 400;
        return res.status(status).json(urlError);
      }

      const formatError = validateFormat(format);
      if (formatError) {
        return res.status(400).json(formatError);
      }

      const qrBuffer = await generateQRCode(url!);

      if (format === "json") {
        const base64 = qrBuffer.toString("base64");
        return res.json({ qr_code: base64, url });
      }

      res.set("Content-Type", "image/png");
      res.set("Content-Disposition", 'inline; filename="qr-code.png"');
      return res.send(qrBuffer);
    } catch (error) {
      console.error("QR generation error:", error);
      return res.status(500).json({
        error: true,
        code: "INTERNAL_ERROR",
        message: "an unexpected error occurred",
      });
    }
  });

  return httpServer;
}
