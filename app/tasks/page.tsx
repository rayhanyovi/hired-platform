import type { Metadata } from "next";
import { TasksPage } from "@/components/tasks/tasks-page";

export const metadata: Metadata = { title: "Tasks · Amara Desk" };

export default function TasksRoute() {
  return <TasksPage />;
}
