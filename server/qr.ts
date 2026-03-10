import QRCode from "qrcode";
import sharp from "sharp";
import path from "path";
import fs from "fs";

function getLogoPath(): string {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "server", "assets", "smallstep-logo.png"),
    path.join(cwd, "dist", "assets", "smallstep-logo.png"),
  ];

  if (typeof __dirname !== "undefined") {
    candidates.push(
      path.join(__dirname, "assets", "smallstep-logo.png"),
      path.join(__dirname, "..", "server", "assets", "smallstep-logo.png"),
    );
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

const LOGO_PATH = getLogoPath();

let cachedLogo: Buffer | null = null;

async function loadLogo(): Promise<Buffer> {
  if (cachedLogo) return cachedLogo;
  cachedLogo = fs.readFileSync(LOGO_PATH);
  return cachedLogo;
}

export interface QRValidationError {
  error: true;
  code: string;
  message: string;
  detail?: string;
}

export function validateUrl(url: string | undefined): QRValidationError | null {
  if (url === undefined || url === null) {
    return {
      error: true,
      code: "MISSING_URL",
      message: "url parameter is required",
    };
  }

  if (url.trim() === "") {
    return {
      error: true,
      code: "EMPTY_URL",
      message: "url must not be empty",
    };
  }

  if (url.length > 2048) {
    return {
      error: true,
      code: "URL_TOO_LONG",
      message: "url exceeds maximum length of 2048 characters",
    };
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return {
        error: true,
        code: "INVALID_URL_SCHEME",
        message: "only https URLs are accepted",
        detail: `received: ${url}`,
      };
    }
  } catch {
    return {
      error: true,
      code: "INVALID_URL",
      message: "url is not a valid URL",
      detail: `received: ${url}`,
    };
  }

  return null;
}

export function validateFormat(
  format: string | undefined,
): QRValidationError | null {
  if (format && !["png", "json"].includes(format)) {
    return {
      error: true,
      code: "INVALID_FORMAT",
      message: "format must be 'png' or 'json'",
      detail: `received: ${format}`,
    };
  }
  return null;
}

export async function generateQRCode(url: string): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    type: "png",
    width: 400,
    margin: 4,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  const logoBuffer = await loadLogo();

  const qrImage = sharp(qrBuffer);
  const qrMetadata = await qrImage.metadata();
  const qrWidth = qrMetadata.width || 400;
  const qrHeight = qrMetadata.height || 400;

  const maxLogoSize = Math.floor(qrWidth * 0.22);
  const padding = 6;
  const borderRadius = 8;

  const resizedLogo = await sharp(logoBuffer)
    .resize(maxLogoSize, maxLogoSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  const resizedMeta = await sharp(resizedLogo).metadata();
  const logoW = resizedMeta.width || maxLogoSize;
  const logoH = resizedMeta.height || maxLogoSize;

  const paddedW = logoW + padding * 2;
  const paddedH = logoH + padding * 2;

  const roundedMask = Buffer.from(
    `<svg width="${paddedW}" height="${paddedH}">
      <rect x="0" y="0" width="${paddedW}" height="${paddedH}" rx="${borderRadius}" ry="${borderRadius}" fill="white"/>
    </svg>`,
  );

  const paddedLogo = await sharp({
    create: {
      width: paddedW,
      height: paddedH,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: roundedMask, blend: "dest-in" },
      { input: resizedLogo, top: padding, left: padding },
    ])
    .png()
    .toBuffer();

  const posX = Math.floor((qrWidth - paddedW) / 2);
  const posY = Math.floor((qrHeight - paddedH) / 2);

  const result = await qrImage
    .composite([{ input: paddedLogo, top: posY, left: posX }])
    .png()
    .toBuffer();

  return result;
}
