import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check, Share, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">App Installed!</CardTitle>
            <CardDescription>
              Win Win Bites is now installed on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => navigate("/")}>
              Open App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
            <Smartphone className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl">Install Win Win Bites</CardTitle>
          <CardDescription>
            Install our app for a better experience with offline access and quick launch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <span>Faster load times</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <span>Quick access from home screen</span>
            </div>
          </div>

          {/* Install button or instructions */}
          {deferredPrompt ? (
            <Button className="w-full" size="lg" onClick={handleInstall}>
              <Download className="mr-2 h-5 w-5" />
              Install App
            </Button>
          ) : isIOS ? (
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">To install on iOS:</p>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">1</span>
                <span>Tap the <Share className="inline h-4 w-4 mx-1" /> Share button</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">2</span>
                <span>Scroll down and tap "Add to Home Screen"</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">3</span>
                <span>Tap "Add" to confirm</span>
              </div>
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">To install on Android:</p>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">1</span>
                <span>Tap the <MoreVertical className="inline h-4 w-4 mx-1" /> menu button</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">2</span>
                <span>Tap "Install app" or "Add to Home screen"</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">3</span>
                <span>Tap "Install" to confirm</span>
              </div>
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
            Continue in Browser
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
