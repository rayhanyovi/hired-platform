"use client";

import { MotionConfig } from "motion/react";
import { MobileHeader, MobileNav, Rail, TopBar } from "./sidebar";
import { Toaster } from "./command-palette";
import { AskDrawer, ShellFrame } from "./ask-drawer";
import { SearchPalette } from "./search";
import { DealDrawer } from "../pipeline/deal-drawer";
import { CreatePlacementsModal } from "../placements/create-placement";
import { CandidatePipelineModal } from "../candidates/pipeline-modal";
import { TourOverlay } from "./tour";

export function AppShell({ children }: { children: React.ReactNode }) {
  const overlays = <><CreatePlacementsModal /><CandidatePipelineModal /><DealDrawer /><AskDrawer /><SearchPalette /><TourOverlay /><Toaster /></>;

  return (
    // Every animation in the app honours the system's reduced-motion setting.
    <MotionConfig reducedMotion="user">
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
    </MotionConfig>
  );
}
