import type { Metadata } from "next";
import { PlacementsPage } from "@/components/placements/placements-page";
export const metadata: Metadata = { title: "Placements · Amara Desk" };
export default function PlacementsRoute() { return <PlacementsPage />; }
