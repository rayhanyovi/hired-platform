/** Seed tasks. Each hangs off a client, prospect or candidate, so it shows on that record and on Home. */
import { sydney } from "./calendar";
import { hoursAgo } from "./time";
import type { Note, Subject, Task } from "./types";

const client = (id: string, name: string): Subject => ({ kind: "client", id, name });
const prospect = (id: string, name: string): Subject => ({ kind: "prospect", id, name });
const candidate = (id: string, name: string): Subject => ({ kind: "candidate", id, name });

type Seed = [id: string, title: string, dueDay: number | null, priority: Task["priority"], subject: Subject, ownerId?: string, done?: boolean];

const SEEDS: Seed[] = [
  ["t-fernhill", "Follow up: no reply to your intro email", -2, 3, prospect("fernhill-foods", "Fernhill Foods")],
  ["t-opal", "Follow up: no reply to your capabilities deck", -1, 2, prospect("opal-insurance", "Opal Insurance"), "jordan"],
  ["t-northwind-cfo", "Check in on the CFO decision", -1, 2, client("northwind-capital", "Northwind Capital")],
  ["t-corvid-tob", "Chase Elena to sign the Terms of Business", 0, 3, prospect("corvid-labs", "Corvid Labs")],
  ["t-bluegum-tom", "Ask Jen for feedback on Tom Gallagher", 0, 3, client("bluegum-energy", "Bluegum Energy")],
  ["t-priya-prep", "Send round-2 prep notes", 0, 3, candidate("priya-raman", "Priya Raman")],
  ["t-marcus-close", "Get Marcus's verbal acceptance", 0, 3, candidate("marcus-oyelaran", "Marcus Oyelaran"), "jordan"],
  ["t-saltwater-fee", "Send the revised fee proposal", 0, 2, prospect("saltwater-co", "Saltwater Co.")],
  ["t-brightline", "Make Brightline a client and book a role brief", 1, 3, prospect("brightline-rail", "Brightline Rail")],
  ["t-rohan", "Book an intro call", 1, 2, candidate("c-rohan", "Rohan Iyer"), "mia"],
  ["t-owen-ref", "Reference check before the contract is countersigned", 2, 2, candidate("owen-price", "Owen Price")],
  ["t-lumen-plan", "Ask Marco for the Q4 hiring plan", 3, 1, client("lumen-logistics", "Lumen Logistics")],
  ["t-quokka-prep", "Prep two anonymised engineer profiles", 4, 2, prospect("quokka-health", "Quokka Health"), "jordan"],
  ["t-corvid-more", "Find two more fullstack engineers", 5, 1, prospect("corvid-labs", "Corvid Labs"), "mia"],
  ["t-elle", "Try Elle on LinkedIn with a shorter note", null, 1, candidate("elle-dawson", "Elle Dawson")],
  ["t-laura-pack", "Send interview prep pack", -8, 2, candidate("laura-chen", "Laura Chen"), "sam", true],
];

export const TASKS_SEED: Task[] = SEEDS.map(([id, title, dueDay, priority, subject, ownerId = "sam", done = false], i) => ({
  id,
  title,
  due: dueDay === null ? undefined : sydney(dueDay, 17),
  priority,
  done,
  subject,
  ownerId,
  createdAt: hoursAgo(48 + i * 7),
}));

export const NOTES_SEED: Note[] = [
  { id: "n-laura", subjectId: "laura-chen", body: "Prefers calls after 6pm. Partner is relocating from Brisbane in January, so start date is flexible.", at: hoursAgo(96), authorId: "sam" },
  { id: "n-marcus", subjectId: "marcus-oyelaran", body: "Real number is $182k. Sign-on matters more to him than base because of a bonus he'd forfeit.", at: hoursAgo(31), authorId: "jordan" },
  { id: "n-corvid", subjectId: "corvid-labs", body: "Elena signs everything herself, usually on Sunday nights. Small team, so speed beats volume.", at: hoursAgo(24 * 10), authorId: "sam" },
  { id: "n-quokka", subjectId: "quokka-health", body: "Amira was burned by an agency that sent 40 CVs. Lead with quality: two profiles, no more.", at: hoursAgo(70), authorId: "jordan" },
  { id: "n-kestrel", subjectId: "kestrel-robotics", body: "Dan decides fast when he hears about competing offers. Use that, don't overplay it.", at: hoursAgo(24 * 20), authorId: "sam" },
];
