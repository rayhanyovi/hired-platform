/**
 * Mocked Amara. Every "AI" output in the demo comes from here, so swapping in a
 * real model later means replacing these functions with streamed API calls.
 */
import { RECRUITER } from "./data";
import type { Channel, FollowUp, Tone } from "./types";

const BODIES: Record<FollowUp["kind"], Record<Tone, (f: FollowUp) => string>> = {
  rejection: {
    direct: (f) =>
      `I wanted to tell you straight away: ${f.client} have decided not to move forward with you for the ${f.role} role.\n\n${f.reason ?? ""} ${f.positive ?? ""}\n\nI'd like to keep working with you. Can I call you Monday to talk about what's next?`,
    warm: (f) =>
      `Thank you for everything you put into the ${f.client} process. I'm sorry to say they've decided not to move forward for the ${f.role} role.\n\nHonestly: ${lower(f.reason)} ${f.positive ?? ""}\n\nYou'll be the first person I call when the right one comes up. Free for a chat next week?`,
    brief: (f) =>
      `Bad news, sorry: ${f.client} are going another way on the ${f.role} role. ${f.reasonShort ?? ""} Can I call Monday to talk about what's next?`,
  },
  "no-news": {
    direct: (f) =>
      `No news yet on ${f.client}, and I didn't want you hearing nothing from me.\n\n${
        f.id === "rafael-souza"
          ? "They've moved the panel again. It's a calendar issue on their side, not about you."
          : "They haven't come back on your CV yet, which is slower than usual for them."
      } I'm chasing them today and will have a real answer for you by Tuesday either way.`,
    warm: (f) =>
      `Just checking in so you're not left wondering. I haven't heard back from ${f.client} yet.\n\n${
        f.id === "rafael-souza"
          ? "The panel has been rescheduled on their end. It's frustrating, I know, but it isn't a signal about you."
          : "Their hiring manager has been slow this week. I'm following up directly today."
      } I'll update you by Tuesday, sooner if I hear anything.`,
    brief: (f) => `No news from ${f.client} yet. I'm chasing them today. You'll hear from me by Tuesday either way.`,
  },
  progress: {
    direct: (f) =>
      `Good news: ${f.client} want to see you again for the ${f.role} role. They called your portfolio strong.\n\nWe're booking round 2 for Tuesday or Wednesday. Which works better?`,
    warm: (f) =>
      `Lovely feedback from ${f.client}. They were impressed with your portfolio and want to see you again.\n\nI'm locking in round 2 for early next week. Let me know which of Tuesday or Wednesday suits you and I'll send a brief.`,
    brief: (f) => `${f.client} loved you. Round 2 next week, Tue or Wed?`,
  },
  "on-hold": {
    direct: (f) =>
      `I'm sorry to say ${f.client} have frozen hiring for the ${f.role} role until January. It's a company-wide decision, nothing to do with you.\n\nI'll let you know the moment it reopens, and I'll keep you in mind for similar roles in the meantime.`,
    warm: (f) =>
      `Some disappointing news, I'm afraid. ${f.client} have paused hiring until January, so the ${f.role} role is on hold. It's purely a budget decision on their side.\n\nYou'll be first on my list if it reopens, and I'd love to show you a couple of other roles in the meantime.`,
    brief: (f) => `Heads up: ${f.client} paused the ${f.role} role until January. It's a budget call, not about you. I'll keep you posted.`,
  },
  "keep-warm": {
    direct: () =>
      `Nothing live that's right for you yet. I'd rather wait for the right Head of Data role than send you a so-so one.\n\nI've got two scale-ups planning data leadership hires for Q1. Can I keep you posted?`,
    warm: () =>
      `Just keeping in touch. I haven't forgotten about you. Nothing's crossed my desk that's quite right yet, and I'd rather be picky on your behalf.\n\nThere are a couple of promising Q1 conversations, so I'll reach out as soon as one's real.`,
    brief: () => `Still looking out for you. Nothing right yet, but two promising Q1 data leadership roles. I'll be in touch.`,
  },
};

const lower = (text = "") => text.charAt(0).toLowerCase() + text.slice(1);

export function draftFollowUp(f: FollowUp, tone: Tone, channel: Channel) {
  const body = BODIES[f.kind][tone](f);
  const greeting = `Hi ${f.firstName},`;
  if (channel === "sms") return `${greeting} ${body.replace(/\n\n/g, " ")}\n\n– ${RECRUITER.firstName}`;
  const signOff = channel === "email" ? `\n\nCheers,\n${RECRUITER.firstName}` : `\n\n${RECRUITER.firstName}`;
  return `${greeting}\n\n${body}${signOff}`;
}

export function subjectFor(f: FollowUp) {
  switch (f.kind) {
    case "rejection":
      return `${f.client} — an honest update`;
    case "no-news":
      return `${f.client} — where things are`;
    case "progress":
      return `${f.client} want to see you again`;
    case "on-hold":
      return `${f.client} — role on hold`;
    default:
      return "Keeping in touch";
  }
}
