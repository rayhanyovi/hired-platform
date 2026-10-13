import { redirect } from "next/navigation";

/** Updates people are waiting for live in Communication, next to every other message. */
export default function MovedToCommunication() {
  redirect("/communication");
}
