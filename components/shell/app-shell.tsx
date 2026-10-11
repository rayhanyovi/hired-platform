"use client";

import { MobileHeader, MobileNav, Rail, TopBar } from "./sidebar";
import { Toaster } from "./command-palette";
import { AskDrawer, ShellFrame } from "./ask-drawer";
import { SearchPalette } from "./search";
import { DealDrawer } from "../pipeline/deal-drawer";
import { TourOverlay } from "./tour";

export function AppShell({ children }: { children: React.ReactNode }) {
  const overlays = <><DealDrawer /><AskDrawer /><SearchPalette /><TourOverlay /><Toaster /></>;

  return (
    <div>

      <div className="flex min-h-dvh">
        <Rail />
        <ShellFrame>
          <TopBar />
          <MobileHeader />
          {children}
        </ShellFrame>
      </div>
      <MobileNav />
      {overlays}
    </div>
  );
}
