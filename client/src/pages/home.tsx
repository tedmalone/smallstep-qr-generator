import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  QrCode,
  Download,
  Link2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Shield,
  Zap,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { QRResponse, QRError } from "@shared/schema";

export default function Home() {
  const [url, setUrl] = useState("");
  const [qrData, setQrData] = useState<QRResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (inputUrl: string) => {
      const res = await fetch(
        `/api/qr?url=${encodeURIComponent(inputUrl)}&format=json`,
      );
      if (!res.ok) {
        const errData: QRError = await res.json();
        throw new Error(errData.message);
      }
      return (await res.json()) as QRResponse;
    },
    onSuccess: (data) => {
      setQrData(data);
      setErrorMsg(null);
    },
    onError: (error: Error) => {
      setErrorMsg(error.message);
      setQrData(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setErrorMsg("Please enter a URL");
      return;
    }
    let processedUrl = url.trim();
    if (
      !processedUrl.startsWith("https://") &&
      !processedUrl.startsWith("http://")
    ) {
      processedUrl = "https://" + processedUrl;
      setUrl(processedUrl);
    }
    generateMutation.mutate(processedUrl);
  };

  const handleDownload = () => {
    if (!qrData) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${qrData.qr_code}`;
    link.download = "qr-code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Downloaded",
      description: "QR code saved as qr-code.png",
    });
  };

  const handleCopyUrl = () => {
    if (!qrData) return;
    const imgUrl = `/api/qr?url=${encodeURIComponent(qrData.url)}`;
    navigator.clipboard.writeText(window.location.origin + imgUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied",
      description: "Direct image URL copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <img
              src="/images/smallstep-logo.png"
              alt="Smallstep"
              className="h-8 w-8 rounded-md"
              data-testid="img-logo"
            />
            <div>
              <h1
                className="text-base font-semibold leading-tight"
                data-testid="text-app-title"
              >
                Smallstep QR Generator
              </h1>
              <p className="text-xs text-muted-foreground leading-tight">
                Branded QR codes with logo overlay
              </p>
            </div>
          </div>
          <a
            href="https://smallstep.com"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-smallstep"
          >
            <Badge variant="secondary">smallstep.com</Badge>
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <QrCode className="w-4 h-4" />
            <span>QR Code Generator</span>
          </div>
          <h2
            className="text-2xl sm:text-4xl font-bold tracking-tight mb-3"
            data-testid="text-heading"
          >
            Generate branded QR codes
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Enter any HTTPS URL to generate a scannable QR code with the
            Smallstep logo embedded in the center.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-6">
            <Card className="p-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="url-input"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    Enter URL
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="url-input"
                      ref={inputRef}
                      type="text"
                      placeholder="https://your-url.com"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setErrorMsg(null);
                      }}
                      className="pl-10"
                      data-testid="input-url"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div
                    className="flex items-start gap-2 text-destructive text-sm p-3 rounded-md bg-destructive/10"
                    data-testid="text-error"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={generateMutation.isPending}
                  style={{ backgroundColor: "#4B5FCA", borderColor: "#4B5FCA" }}
                  data-testid="button-generate"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate QR Code
                    </>
                  )}
                </Button>
              </form>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-md bg-card border border-card-border">
                <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">HTTPS Only</p>
                  <p className="text-xs text-muted-foreground">
                    Secure URLs only
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-md bg-card border border-card-border">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Branded</p>
                  <p className="text-xs text-muted-foreground">
                    Logo embedded
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-md bg-card border border-card-border">
                <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Level H</p>
                  <p className="text-xs text-muted-foreground">
                    30% error correction
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <Card className="w-full p-5 sm:p-6 flex flex-col items-center justify-center min-h-[360px]">
              {qrData ? (
                <div className="space-y-5 w-full flex flex-col items-center">
                  <div className="relative">
                    <img
                      src={`data:image/png;base64,${qrData.qr_code}`}
                      alt="Generated QR Code"
                      className="w-64 h-64 sm:w-72 sm:h-72 rounded-lg"
                      data-testid="img-qr-code"
                    />
                    <div className="absolute -top-2 -right-2">
                      <Badge
                        variant="default"
                        style={{
                          backgroundColor: "#4B5FCA",
                          borderColor: "#4B5FCA",
                        }}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    </div>
                  </div>

                  <p
                    className="text-xs text-muted-foreground truncate max-w-full px-4 text-center"
                    data-testid="text-encoded-url"
                  >
                    {qrData.url}
                  </p>

                  <div className="flex gap-2 w-full max-w-xs">
                    <Button
                      onClick={handleDownload}
                      className="flex-1"
                      style={{
                        backgroundColor: "#4B5FCA",
                        borderColor: "#4B5FCA",
                      }}
                      data-testid="button-download"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PNG
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={handleCopyUrl}
                      data-testid="button-copy-url"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
                  <div className="w-20 h-20 rounded-xl bg-muted/50 flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Your QR code will appear here
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Enter a URL and click Generate
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="mt-12 sm:mt-16 border-t pt-8">
          <h3
            className="text-lg font-semibold mb-4"
            data-testid="text-api-heading"
          >
            API Usage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Get QR as PNG image</p>
              <code className="text-xs bg-muted px-3 py-2 rounded-md block font-mono break-all">
                curl
                &quot;{window.location.origin}/api/qr?url=https://smallstep.com&quot;
                -o qr.png
              </code>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Get QR as Base64 JSON</p>
              <code className="text-xs bg-muted px-3 py-2 rounded-md block font-mono break-all">
                curl
                &quot;{window.location.origin}/api/qr?url=https://smallstep.com&amp;format=json&quot;
              </code>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t mt-8 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Built with Smallstep QR Code Generator
          </p>
          <a
            href="https://smallstep.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            smallstep.com
          </a>
        </div>
      </footer>
    </div>
  );
}
