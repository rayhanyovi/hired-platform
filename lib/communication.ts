/**
 * Communication: every channel in one inbox. Seed threads, the call log, and
 * Amara's mocked reply drafts (replace `draftReply` with a model call later).
 */
import { RECRUITER } from "./data";
import { hoursAgo, NOW_MS } from "./time";
import type { CallLog, MessageChannel, Subject, Thread } from "./types";

export const CHANNEL_LABEL: Record<MessageChannel, string> = {
  email: "Email",
  sms: "SMS",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
};

/** Days since we last wrote, when they haven't answered. Drives "Follow up?". */
export function awaitingReply(t: Thread) {
  const last = t.messages.at(-1);
  if (!last || last.from !== "me") return null;
  const days = Math.floor((NOW_MS - last.at) / 86_400_000);
  return days >= 3 ? days : null;
}

/** They wrote last, so the ball is with you. */
export const needsReply = (t: Thread) => t.messages.at(-1)?.from === "them";

const prospect = (id: string, name: string): Subject => ({ kind: "prospect", id, name });
const client = (id: string, name: string): Subject => ({ kind: "client", id, name });
const candidate = (id: string, name: string): Subject => ({ kind: "candidate", id, name });

let n = 0;
const msg = (from: "me" | "them", h: number, body: string, byId = "sam") => ({ id: `m-${n++}`, from, body, at: hoursAgo(h), byId: from === "me" ? byId : undefined });

export const THREADS: Thread[] = [
  {
    id: "th-brightline",
    channel: "email",
    contact: { name: "Nadia Kovac", detail: "Talent Lead · Brightline Rail", subject: prospect("brightline-rail", "Brightline Rail") },
    subject: "Signed Terms of Business",
    unread: true,
    messages: [
      msg("me", 24 * 4, "Hi Nadia,\n\nAs promised, our Terms of Business are attached. 20% fee, 3-month rebate, and exclusivity on the two signalling roles if that helps you internally.\n\nSam"),
      msg("them", 18, "Hi Sam,\n\nSigned copy attached. Can we brief you on the first two roles next week? Tuesday or Wednesday morning works for us.\n\nNadia"),
    ],
  },
  {
    id: "th-tidewater",
    channel: "email",
    contact: { name: "Priya Shah", detail: "Head of Talent · Tidewater Bank", subject: client("tidewater-bank", "Tidewater Bank") },
    subject: "Re: Marcus Oyelaran",
    unread: true,
    messages: [
      msg("me", 26, "Hi Priya — quick one on Marcus. Quantia have asked him for a chat, which is almost always a counter. Proposal: $180k base plus an $8k sign-on from the separate budget. If you can confirm by 2pm I'll get his verbal acceptance today.\n\nJordan", "jordan"),
      msg("them", 2, "Hi Jordan,\n\n$180k base is approved. The sign-on needs finance sign-off, which I'll have by midday. Go ahead and sound him out.\n\nPriya"),
    ],
  },
  {
    id: "th-owen",
    channel: "whatsapp",
    contact: { name: "Owen Price", detail: "Candidate · Halcyon Health offer", subject: candidate("owen-price", "Owen Price") },
    unread: true,
    messages: [
      msg("me", 5, "Contract's in your inbox. Shout if anything in it looks off. Happy to walk through it."),
      msg("them", 3, "Signed and sent back! Thanks Sam. One question on the notice period, can I call you at 11?"),
    ],
  },
  {
    id: "th-quokka",
    channel: "email",
    contact: { name: "Amira Haddad", detail: "VP People · Quokka Health", subject: prospect("quokka-health", "Quokka Health") },
    subject: "Tuesday's intro",
    unread: true,
    messages: [
      msg("me", 70, "Hi Amira,\n\nThanks for the time on the phone. Looking forward to Tuesday at 2pm.\n\nJordan", "jordan"),
      msg("them", 20, "Likewise. Could you bring a couple of example profiles? Senior backend engineers, ideally people who'd move to Perth.\n\nAmira"),
    ],
  },
  {
    id: "th-priya-raman",
    channel: "sms",
    contact: { name: "Priya Raman", detail: "Candidate · Engineering Manager", subject: candidate("priya-raman", "Priya Raman") },
    unread: true,
    messages: [
      msg("me", 26, "Round 2 is locked in for Saturday 10am at their Surry Hills office. Prep notes coming tomorrow."),
      msg("them", 3, "Thanks Sam! Quick one: is it the same panel as round 1? And should I bring anything on the scheduling platform?"),
    ],
  },
  {
    id: "th-rohan",
    channel: "linkedin",
    contact: { name: "Rohan Iyer", detail: "Candidate · Senior SRE", subject: candidate("c-rohan", "Rohan Iyer") },
    unread: true,
    messages: [
      msg("me", 48, "Hi Rohan, I'm working on a Senior SRE role at a Melbourne bank rebuilding its payments platform. Your incident command work stood out. Open to a chat?", "mia"),
      msg("them", 20, "Thanks Mia, happy to chat. What's the salary range, and is it hybrid?"),
    ],
  },
  {
    id: "th-marcus",
    channel: "sms",
    contact: { name: "Marcus Oyelaran", detail: "Candidate · Lead Data Engineer", subject: candidate("marcus-oyelaran", "Marcus Oyelaran") },
    unread: false,
    messages: [msg("them", 30, "Manager wants to chat Monday. Can we talk before then?"), msg("me", 29, "Yes. Calling you in 10.", "jordan")],
  },
  {
    id: "th-ben",
    channel: "email",
    contact: { name: "Ben Nakamura", detail: "Candidate · Senior SRE", subject: candidate("ben-nakamura", "Ben Nakamura") },
    subject: "Re: Senior SRE at a Melbourne bank",
    unread: false,
    messages: [
      msg("me", 24 * 4, "Hi Ben,\n\nI'm working on a Senior SRE role at a Melbourne bank that's rebuilding its platform from scratch. Open to a quick chat?\n\nJordan", "jordan"),
      msg("them", 50, "Open to a chat. What's the team size and is it hybrid?"),
    ],
  },
  {
    id: "th-corvid",
    channel: "email",
    contact: { name: "Elena Park", detail: "Co-founder · Corvid Labs", subject: prospect("corvid-labs", "Corvid Labs") },
    subject: "Terms of Business — Whitford Talent",
    unread: false,
    messages: [
      msg("me", 24 * 11, "Hi Elena,\n\nGreat to meet. Our Terms of Business are attached: 20% fee, 3-month rebate.\n\nSam"),
      msg("them", 24 * 10, "Thanks Sam, will review this week. Tariq looks promising by the way."),
      msg("me", 24 * 4, "Hi Elena, just checking the terms landed okay. Happy to jump on a call if anything needs a tweak.\n\nSam"),
    ],
  },
  {
    id: "th-fernhill",
    channel: "email",
    contact: { name: "Greg Tan", detail: "HR Director · Fernhill Foods", subject: prospect("fernhill-foods", "Fernhill Foods") },
    subject: "Supply chain hiring for 2027",
    unread: false,
    messages: [msg("me", 24 * 6, "Hi Greg,\n\nI saw Fernhill is opening the new Wetherill Park site. We've placed three supply chain leads in FMCG this year. Worth 15 minutes to compare notes on the 2027 plan?\n\nSam")],
  },
  {
    id: "th-opal",
    channel: "email",
    contact: { name: "Sophie Grant", detail: "Talent Acquisition Manager · Opal Insurance", subject: prospect("opal-insurance", "Opal Insurance") },
    subject: "Our data and actuarial desk",
    unread: false,
    messages: [msg("me", 24 * 9, "Hi Sophie,\n\nAttached is a one-pager on our data and actuarial desk, including two recent placements at Melbourne insurers.\n\nJordan", "jordan")],
  },
  {
    id: "th-elle",
    channel: "linkedin",
    contact: { name: "Elle Dawson", detail: "Candidate · Head of Talent", subject: candidate("elle-dawson", "Elle Dawson") },
    unread: false,
    messages: [msg("me", 24 * 8, "Hi Elle, I'm working on a Head of Talent role at a Sydney robotics company building its first in-house team. Would you be open to a chat?")],
  },
  {
    id: "th-kestrel",
    channel: "email",
    contact: { name: "Dan Mercer", detail: "CEO · Kestrel Robotics", subject: client("kestrel-robotics", "Kestrel Robotics") },
    subject: "Laura Chen — final round",
    unread: false,
    messages: [
      msg("them", 76, "Loved her. Want one culture chat with the team next Thu."),
      msg("me", 74, "Great to hear, Dan. One flag: Laura has two other finals expected to close by Wednesday. Could the culture chat happen this week instead?\n\nSam"),
    ],
  },
  {
    id: "th-saltwater",
    channel: "sms",
    contact: { name: "Jess Morgan", detail: "Founder · Saltwater Co.", subject: prospect("saltwater-co", "Saltwater Co.") },
    unread: false,
    messages: [msg("them", 21, "Thanks for today. If you can do 15% we're in."), msg("me", 20, "Let me come back to you tomorrow with something that works for both of us.")],
  },
  // People who aren't on your desk yet: no candidate, client or prospect record.
  {
    id: "th-hannah",
    channel: "email",
    contact: { name: "Hannah Whitfield", detail: "hannah@arcadiagames.com.au", email: "hannah@arcadiagames.com.au" },
    subject: "Three platform engineers before March",
    unread: true,
    messages: [
      msg(
        "them",
        5,
        "Hi Sam,\n\nElena at Corvid Labs passed on your name. We're Arcadia Games, about 180 people, and we need three platform engineers in Sydney before the end of March. Do you work on a retained basis? Could we talk this week?\n\nHannah Whitfield\nHead of People, Arcadia Games",
      ),
    ],
  },
  {
    id: "th-kai",
    channel: "sms",
    contact: { name: "+61 412 889 301", detail: "Unknown number", phone: "0412 889 301" },
    unread: true,
    messages: [msg("them", 3, "Hi Sam, it's Kai Nguyen. Ben Nakamura gave me your number. I'm a backend engineer at Atlassian, mostly Go and Kafka, and I'm ready for a change. Could we chat this week?")],
  },
  {
    id: "th-mateo",
    channel: "email",
    contact: { name: "Mateo Alvarez", detail: "m.alvarez@tidewater.com.au", email: "m.alvarez@tidewater.com.au" },
    subject: "Lead Data Engineer shortlist",
    unread: false,
    messages: [
      msg(
        "them",
        27,
        "Hi Jordan,\n\nPriya asked me to get in touch. I'm the hiring manager for the Lead Data Engineer role and I'd like to see the shortlist before Thursday's panel. Can you send the profiles straight to me?\n\nMateo Alvarez\nData Platform Lead, Tidewater Bank",
      ),
    ],
  },
  {
    id: "th-chloe",
    channel: "linkedin",
    contact: { name: "Chloe Bennett", detail: "LinkedIn message" },
    unread: false,
    messages: [msg("them", 46, "Hi Sam, I saw your post about the Head of Design role. I'm a senior product designer at Canva, seven years in, and open to the right move. Is it still open?")],
  },
];

/** What an unrecognised sender's signature or message says about them. Prefills "Add to your desk". */
export const SIGNATURES: Record<string, { name: string; title: string; company?: string; location?: string; as: "candidate" | "contact" | "prospect" }> = {
  "th-hannah": { name: "Hannah Whitfield", title: "Head of People", company: "Arcadia Games", location: "Sydney", as: "prospect" },
  "th-kai": { name: "Kai Nguyen", title: "Backend Engineer · Atlassian", location: "Sydney", as: "candidate" },
  "th-mateo": { name: "Mateo Alvarez", title: "Data Platform Lead", company: "Tidewater Bank", as: "contact" },
  "th-chloe": { name: "Chloe Bennett", title: "Senior Product Designer · Canva", location: "Sydney", as: "candidate" },
};

export const CALLS: CallLog[] = [
  { id: "call-marcus", contact: { name: "Marcus Oyelaran", subject: candidate("marcus-oyelaran", "Marcus Oyelaran") }, direction: "outgoing", outcome: "connected", seconds: 372, at: hoursAgo(29), byId: "jordan", note: "Manager wants to chat Monday. Likely counter-offer." },
  { id: "call-owen", contact: { name: "Owen Price", subject: candidate("owen-price", "Owen Price") }, direction: "outgoing", outcome: "connected", seconds: 540, at: hoursAgo(26), byId: "sam", note: "Accepted verbally." },
  { id: "call-jess", contact: { name: "Jess Morgan", subject: prospect("saltwater-co", "Saltwater Co.") }, direction: "incoming", outcome: "connected", seconds: 840, at: hoursAgo(22), byId: "sam", note: "Wants 15%. Floor is 18%." },
  { id: "call-elle", contact: { name: "Elle Dawson", subject: candidate("elle-dawson", "Elle Dawson") }, direction: "outgoing", outcome: "voicemail", seconds: 41, at: hoursAgo(72), byId: "sam" },
  { id: "call-laura", contact: { name: "Laura Chen", subject: candidate("laura-chen", "Laura Chen") }, direction: "outgoing", outcome: "connected", seconds: 1080, at: hoursAgo(98), byId: "sam", note: "Ranked Kestrel first. Two other finals." },
  { id: "call-fernhill", contact: { name: "Greg Tan", subject: prospect("fernhill-foods", "Fernhill Foods") }, direction: "outgoing", outcome: "no-answer", seconds: 0, at: hoursAgo(24 * 5), byId: "sam" },
  { id: "call-tom", contact: { name: "Tom Gallagher", subject: candidate("tom-gallagher", "Tom Gallagher") }, direction: "outgoing", outcome: "connected", seconds: 1320, at: hoursAgo(130), byId: "sam", note: "Screening call. Strong, closes well." },
  { id: "call-rafael", contact: { name: "Rafael Souza", subject: candidate("rafael-souza", "Rafael Souza") }, direction: "outgoing", outcome: "connected", seconds: 720, at: hoursAgo(170), byId: "sam", note: "Prep call for the panel." },
];

const REPLIES: Record<string, string> = {
  "th-hannah":
    "Hi Hannah,\n\nThanks for reaching out, and please thank Elena for me. Yes, we work retained for multi-hire searches like this one. I can do Wednesday at 10 or Thursday at 2 for 30 minutes to understand the team and the stack.\n\n{me}",
  "th-kai": "Hi Kai, thanks for getting in touch, and good to hear from a friend of Ben's. I'd love to chat. Does Wednesday at 12:30 work for a 20 minute call?",
  "th-mateo": "Hi Mateo,\n\nGood to meet you. I'll send the three shortlisted profiles to you today, each with a one-paragraph read, so you have them well before Thursday's panel.\n\n{me}",
  "th-chloe": "Hi Chloe, thanks for reaching out. The role is still open and your background looks like a strong fit. Could we have a quick call this week to talk it through?",
  "th-priya-raman": "Different panel this time: the CTO and two staff engineers. No need to bring anything, but expect a systems question on their scheduling platform. Prep notes land tomorrow morning.",
  "th-rohan": "Hi Rohan,\n\nThe range is $165k to $180k plus super, hybrid with two days a week in their Melbourne office. Would Monday 12:30 or Tuesday 5pm work for 20 minutes?\n\n{me}",
  "th-brightline":
    "Hi Nadia,\n\nThat's great news, thank you. Wednesday at 9:30 works well. I'll send an invite with a short brief template so we can get both roles live by Friday.\n\n{me}",
  "th-tidewater": "Thanks Priya, that's exactly what we needed. I'll speak to Marcus this morning and come back to you with his answer before 2pm.\n\n{me}",
  "th-owen": "Brilliant, congratulations Owen! 11 works. I'll call you then and we can go through the notice period.",
  "th-quokka":
    "Hi Amira,\n\nOf course. I'll bring two senior backend profiles, both open to Perth, with a one-paragraph read on each. See you Tuesday.\n\n{me}",
  "th-ben": "Hi Ben,\n\nTeam of 8, hybrid with two days a week in the Melbourne office. Would Monday 12:30 or Tuesday 5pm work for 20 minutes?\n\n{me}",
  "th-saltwater":
    "Hi Jess, thanks again for yesterday. I can't go to 15%, but I can do 18% with exclusivity on your next three roles and a 4-month rebate. Can I send that over?",
};

/** Amara's draft reply to the last message in a thread, signed by whoever is sending. */
export function draftReply(t: Thread, me = RECRUITER.firstName) {
  if (REPLIES[t.id]) return REPLIES[t.id].replace("{me}", me);
  const first = t.contact.name.split(" ")[0];
  return `Hi ${first},\n\nThanks for getting back to me. I'll look into this today and come back to you by tomorrow with next steps.\n\n${me}`;
}

/** A short, honest nudge for a thread that's gone quiet. */
export function draftNudge(t: Thread, me = RECRUITER.firstName) {
  const first = t.contact.name.split(" ")[0];
  const days = awaitingReply(t) ?? 0;
  const short = t.channel === "sms" || t.channel === "whatsapp" || t.channel === "linkedin";
  if (short) return `Hi ${first}, just bumping this in case it got buried. Worth a quick chat this week?`;
  return `Hi ${first},\n\nFollowing up on my note from ${days} days ago${t.subject ? ` about "${t.subject.replace(/^Re: /, "")}"` : ""}. I know things get busy, so a one-line reply is plenty: is now a good time, or should I check back next month?\n\n${me}`;
}

export const callLength = (s: number) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`);

export type TemplateKind = "consent" | "workstyle" | "booking" | "pre-call";

/** Standard requests and links, sent from a record's right-click menu. Templates, not AI. */
export function templateFor(kind: TemplateKind, contact: Thread["contact"], me: string) {
  const first = contact.name.split(" ")[0];
  const company = contact.subject && contact.subject.kind !== "candidate";
  switch (kind) {
    case "consent":
      return {
        subject: "Information and consent",
        body: `Hi ${first},\n\nBefore I put you forward anywhere, I need your consent to share your details and a few quick facts (right to work, notice period, salary expectations). It takes about two minutes: whitfordtalent.com.au/consent\n\nThanks,\n${me}`,
      };
    case "workstyle":
      return company
        ? {
            subject: "Your team's Workstyle Profile",
            body: `Hi ${first},\n\nCould you fill in a short Workstyle Profile for the team? It tells me how you work day to day, so I only send people who'll fit. About 10 minutes: whitfordtalent.com.au/workstyle\n\n${me}`,
          }
        : {
            subject: "Your Workstyle Profile",
            body: `Hi ${first},\n\nCould you complete a short Workstyle Profile? It helps me match you with teams that work the way you do. About 10 minutes: whitfordtalent.com.au/workstyle\n\n${me}`,
          };
    case "booking":
      return {
        subject: "Pick a time to talk",
        body: `Hi ${first},\n\nHere's my calendar so you can grab whatever time suits you: whitfordtalent.com.au/book/${me.toLowerCase()}\n\n${me}`,
      };
    case "pre-call":
      return company
        ? {
            subject: "Before our call",
            body: `Hi ${first},\n\nAhead of our call, a one-pager on how we work: our fee and rebate, how we shortlist, and two recent placements in your space. Nothing to prepare on your side.\n\n${me}`,
          }
        : {
            subject: "Before our call",
            body: `Hi ${first},\n\nA few things to have handy for our chat: your current package, notice period, and the kind of team you'd like next. I'll walk you through the role and the company.\n\n${me}`,
          };
  }
}

export const TEMPLATE_LABEL: Record<TemplateKind, string> = {
  consent: "Information and consent",
  workstyle: "Workstyle profile",
  booking: "Booking link",
  "pre-call": "Pre-call pack",
};
