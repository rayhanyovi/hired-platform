import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { DeskProvider } from "@/lib/store";
import { MobileHeader, MobileNav, Sidebar } from "@/components/shell/sidebar";
import { CommandPalette, Toaster } from "@/components/shell/command-palette";
import { DealDrawer } from "@/components/pipeline/deal-drawer";
import { TourOverlay } from "@/components/shell/tour";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Amara Desk",
  description: "A recruiter's desk where AI does the volume — a concept for HeyAmara.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} antialiased`}>
      <body className="min-h-dvh">
        <DeskProvider>
          <div className="flex min-h-dvh">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
              <MobileHeader />
              {children}
            </div>
          </div>
          <MobileNav />
          <DealDrawer />
          <CommandPalette />
          <TourOverlay />
          <Toaster />
        </DeskProvider>
      </body>
    </html>
  );
}
