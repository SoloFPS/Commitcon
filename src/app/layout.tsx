import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "FoodBridge — Smart Food Waste Redistribution Platform",
  description:
    "Connecting restaurants, supermarkets, and hotels with verified shelters and charities to eliminate food waste through intelligent matching.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-cream text-ink antialiased">
        <Providers>
          <Navbar />
          <div className="flex-1">{children}</div>
          <footer className="mt-auto border-t border-ink/10 bg-white/60 py-6 text-center text-xs text-ink/60">
            <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>© {new Date().getFullYear()} FoodBridge Platform. Safe, explainable surplus food logistics.</p>
              <div className="flex gap-4">
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Network
                </span>
                <span>FAO Waste-Reduction Standard</span>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
