import type { PersonStatus } from "./people";

export const FORM_STATUSES: PersonStatus[] = ["screening", "submitted", "interview", "final", "offer", "offer-sent", "interested", "placed", "fell-off"];
export type PipelineDetails = Record<string, string | string[] | boolean>;
export const FORM_TITLES: Partial<Record<PersonStatus, string>> = {
  screening: "Schedule Screening", submitted: "Configure Submission", interview: "Schedule Interview",
  final: "Schedule Follow-Up", offer: "Expect Offer", "offer-sent": "Upload Document",
  interested: "Record Interest", placed: "Confirm Placement", "fell-off": "Fell Off",
};
export const FORM_ACTIONS: Partial<Record<PersonStatus, string>> = {
  screening: "Schedule Screening", submitted: "Record Submission", interview: "Confirm Interview",
  final: "Confirm Follow Up", offer: "Record Expected Offer", "offer-sent": "Record Offer Sent",
  interested: "Confirm Interest", placed: "Confirm Placement", "fell-off": "Confirm",
};
export function validatePipeline(to: PersonStatus, data: PipelineDetails): string | null {
  const required: string[] = to === "screening" ? ["date", "timezone", "start", "end", "email"]
    : to === "final" ? ["date", "timezone", "start", "end", "assignee"]
    : to === "interview" ? ["client", "role", "date", "timezone", "start", "end", "interviewType", "attendees", ...(data.attendees === "Candidate + Client" ? ["contacts"] : []), ...(data.interviewType === "In-Person" ? ["location"] : [])]
    : to === "submitted" ? ["submittalType", "emailStyle", "clients", "message"]
    : to === "offer" ? ["client", "role"]
    : to === "offer-sent" ? ["documentType", "file", "client", "role", "offerSalary", "offerStart", "reviewed"]
    : to === "interested" ? ["roles"]
    : to === "placed" ? ["client", "role", "startDate"]
    : to === "fell-off" ? ["reason"] : [];
  for (const key of required) {
    const value = data[key];
    if (!value || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && !value.length)) return `Complete ${key.replace(/([A-Z])/g, " $1").toLowerCase()} before changing status.`;
  }
  if (["screening", "interview", "final"].includes(to)) {
    if (![data.start, data.end].every((v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v)))) return "Choose valid start and end times.";
    if (String(data.end) <= String(data.start)) return "End time must be after start time.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.date))) return "Choose a valid date.";
  }
  if (to === "screening" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))) return "Enter a valid candidate email.";
  if (to === "interview" && data.stage === "Custom..." && !String(data.customStage ?? "").trim()) return "Enter a custom interview stage.";
  if (to === "offer-sent" && !/\.(pdf|doc|docx)$/i.test(String(data.file))) return "Choose a PDF or Word offer document.";
  if (data.fee && (!Number.isFinite(Number(data.fee)) || Number(data.fee) < 0)) return "Placement fee must be a positive number.";
  return null;
}

/** Convert the scheduled wall time in the selected IANA zone to an instant. */
export function scheduledInstant(date: string, time: string, timezone: string): number {
  const target = Date.parse(`${date}T${time}:00Z`);
  let instant = target;
  const formatter = new Intl.DateTimeFormat("sv-SE", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  for (let i = 0; i < 3; i++) {
    const local = formatter.format(new Date(instant)).replace(" ", "T");
    instant += target - Date.parse(`${local}Z`);
  }
  const roundtrip = formatter.format(new Date(instant)).replace(" ", "T").slice(0, 16);
  if (roundtrip !== `${date}T${time}`) throw new Error("This local time does not exist due to a daylight-saving change. Choose another time.");
  return instant;
}


export function pipelinePayload(to: PersonStatus, data: PipelineDetails): PipelineDetails {
  const schedule = ["date", "timezone", "start", "end", "invite"];
  const fields: Partial<Record<PersonStatus, string[]>> = {
    screening: [...schedule, "email", "meetingNotes"],
    interview: [...schedule, "client", "role", "contacts", "stage", "customStage", "interviewType", "attendees", "location", "meetingNotes"],
    final: [...schedule, "assignee", "description"], submitted: ["submittalType", "emailStyle", "clients", "attachments", "includePay", "message"],
    offer: ["client", "role", "notes"], "offer-sent": ["documentType", "file", "client", "role", "offerSalary", "offerStart", "offerTerms", "offerNotes", "reviewed"],
    interested: ["roles"], placed: ["client", "role", "startDate", "fee"], "fell-off": ["reason"],
  };
  return Object.fromEntries(Object.entries(data).filter(([key]) => fields[to]?.includes(key)));
}
