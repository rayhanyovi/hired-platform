/**
 * Ask HeyAmara: page-aware context and replies for the drawer.
 * Each page describes itself (a label, a one-line summary, starter questions),
 * and replies read the live desk data behind that page.
 */
import { FIT_LABEL, ROLE_LABEL } from "./agency";
import {
  amaraReply,
  type Block,
  type ListItem,
  type Reply,
} from "./amara-chat";
import { draftFollowUp, subjectFor } from "./ai";
import { rolesFor } from "./clients";
import { FOLLOW_UP_LABEL, RECRUITER, STAGES } from "./data";
import {
  fee,
  idleLabel,
  money,
  needsAttention,
  riskValue,
  STAGE_ODDS,
} from "./deal";
import { DOC_KIND_LABEL, tobStatus } from "./documents";
import { invoicesFor, SUGGESTIONS, TEAM_BOARD } from "./home";
import { LESSONS } from "./learnings";
import type { DeskState } from "./store";
import { memberName } from "./store";
import { ago, NOW_MS } from "./time";

export type AskContext = {
  key: string;
  label: string;
  summary: string;
  suggestions: string[];
  /** The record the page is about, e.g. a deal or client id. */
  ref?: string;
};

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

export function askContext(pathname: string, d: DeskState): AskContext {
  const cooling = d.deals.filter(needsAttention);
  const live = d.deals.filter((x) => x.stage !== "placed");

  const deal = pathname.match(/^\/deals\/([^/]+)/)?.[1];
  if (deal) {
    const x = d.deals.find((y) => y.id === deal);
    if (x) {
      return {
        key: "deal",
        ref: x.id,
        label: x.candidate.name,
        summary: `${STAGES.find((s) => s.id === x.stage)?.label} · ${x.role.title} at ${x.role.client} · ${money(fee(x), { compact: true })} fee`,
        suggestions: [
          "What's the risk on this deal?",
          "Prep my next move",
          "Summarise what's happened",
        ],
      };
    }
  }

  const client = pathname.match(/^\/clients\/([^/]+)/)?.[1];
  if (client) {
    const c = d.clients.find((y) => y.id === client);
    if (c) {
      const roles = rolesFor(c.name, d).filter(
        (r) => r.job.status !== "filled",
      );
      return {
        key: "client",
        ref: c.id,
        label: c.name,
        summary: `${plural(roles.length, "open role")} · TOB ${tobStatus(c.name, d.documents)} · ${c.status === "active" ? "active client" : "prospect"}`,
        suggestions: [
          "Summarise this client",
          "Who's in play for each role?",
          `Draft a check-in to ${c.contact.name.split(" ")[0]}`,
        ],
      };
    }
  }

  const page = "/" + (pathname.split("/")[1] ?? "");
  switch (page) {
    case "/":
      return d.homeStage === "day1"
        ? {
            key: "home",
            label: "Home",
            summary: "New desk · no activity yet",
            suggestions: SUGGESTIONS.day1,
          }
        : {
            key: "home",
            label: "Home",
            summary: "8 quiet clients · 1 draft invoice · 63 outstanding",
            suggestions: SUGGESTIONS.day30,
          };
    case "/follow-ups": {
      const overdue = d.followUps.filter((f) => f.daysWaiting >= 3).length;
      return {
        key: "followups",
        label: "Follow-ups",
        summary: `${plural(d.followUps.length, "person", "people")} waiting · ${overdue} overdue`,
        suggestions: [
          "Who's been waiting longest?",
          "Draft the rejections first",
          "Which updates are quick wins?",
        ],
      };
    }
    case "/pipeline": {
      const weighted = live.reduce(
        (s, x) => s + fee(x) * STAGE_ODDS[x.stage],
        0,
      );
      return {
        key: "pipeline",
        label: "Pipeline",
        summary: `${plural(live.length, "live deal")} · ${cooling.length} cooling · ${money(Math.round(weighted), { compact: true })} weighted`,
        suggestions: [
          "What's going cold?",
          "Which deal should I call first?",
          "How's my month tracking?",
        ],
      };
    }
    case "/clients": {
      const open = d.jobs.filter((j) => j.status !== "filled").length;
      return {
        key: "clients",
        label: "Clients",
        summary: `${d.clients.filter((c) => c.status === "active").length} active · ${d.clients.filter((c) => c.status === "prospect").length} prospects · ${open} open roles`,
        suggestions: [
          "Which clients need attention?",
          "Where are my biggest fees?",
          "Which prospects are closest to signing?",
        ],
      };
    }
    case "/applicants": {
      const fresh = d.applicants.filter((a) => a.status === "new");
      return {
        key: "applicants",
        label: "Applicants",
        summary: `${fresh.length} to review · ${fresh.filter((a) => a.fit === "strong").length} strong fits`,
        suggestions: [
          "Who are the strongest applicants?",
          "Summarise what's come in",
          "Who should I decline?",
        ],
      };
    }
    case "/candidates":
      return {
        key: "candidates",
        label: "Candidates",
        summary: `${d.candidates.filter((c) => c.status === "pool").length} shortlisted · ${d.candidates.filter((c) => c.status === "contacted").length} contacted · ${d.candidates.filter((c) => c.status === "pipeline").length} in pipeline`,
        suggestions: [
          "Who should I contact first?",
          "Who's ready for the pipeline?",
        ],
      };
    case "/documents": {
      const pending = d.documents.filter(
        (x) => x.status === "pending-approval",
      ).length;
      return {
        key: "documents",
        label: "Documents",
        summary: `${plural(d.documents.length, "document")} · ${pending} awaiting approval`,
        suggestions: [
          "What's waiting for approval?",
          "Which Terms of Business are unsigned?",
          "What have clients sent me?",
        ],
      };
    }
    case "/team":
      return {
        key: "team",
        label: "Team",
        summary: `${plural(d.members.length, "member")} · ${plural(d.approvals.filter((a) => a.status === "pending").length, "approval")} waiting`,
        suggestions: [
          "What needs my approval?",
          "Who's carrying the most deals?",
          "Who's top of the leaderboard?",
        ],
      };
    case "/audit":
      return {
        key: "audit",
        label: "Audit log",
        summary: `${plural(d.events.length, "event")} on record`,
        suggestions: [
          "What happened today?",
          "What has Jordan done recently?",
          "Any fee changes?",
        ],
      };
    case "/sum":
      return {
        key: "sum",
        label: "The Sum",
        summary: "Billings against take-home",
        suggestions: [
          "Explain these numbers",
          "Is going independent worth it?",
        ],
      };
    case "/learnings":
      return {
        key: "learnings",
        label: "Learnings",
        summary: `${d.completedLessons.length} of ${LESSONS.length} lessons done`,
        suggestions: ["What should I learn next?", "How far through am I?"],
      };
    default:
      return {
        key: "general",
        label: "Your desk",
        summary: "Everything on your desk",
        suggestions: SUGGESTIONS.day30,
      };
  }
}

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));
const list = (items: ListItem[]): Block => ({ type: "list", items });

/**
 * From Home (or with no page context), send a question to the page that owns
 * the answer, so "who's waiting longest?" reads the follow-up queue.
 */
function routeKey(key: string, q: string) {
  if (key !== "home" && key !== "general") return key;
  if (/(waiting|ghost|owe|who needs an update)/.test(q) && !/draft/.test(q))
    return "followups";
  if (/(applicant|applied|strong fit)/.test(q)) return "applicants";
  if (/(unsigned|approval|approve|document|terms of business sent)/.test(q))
    return "documents";
  if (/(prospect|which clients|biggest fees|clients need)/.test(q))
    return "clients";
  if (/(cold|call first|stuck|at risk)/.test(q)) return "pipeline";
  return key;
}

export function askReply(
  prompt: string,
  ctx: AskContext | null,
  d: DeskState,
): Reply {
  const q = prompt.toLowerCase();
  const key = routeKey(ctx?.key ?? "general", q);

  if (key === "followups") {
    const waiting = [...d.followUps].sort(
      (a, b) => b.daysWaiting - a.daysWaiting,
    );
    if (!waiting.length)
      return {
        text: "Nobody is waiting on you. Every candidate has heard back.",
        blocks: [],
        followups: [],
      };
    if (has(q, "reject")) {
      const rejections = waiting.filter((f) => f.kind === "rejection");
      return {
        text: rejections.length
          ? `${plural(rejections.length, "rejection")} to send. These are the ones people dread waiting for, so they go first. Each draft gives the honest reason and one thing they did well.`
          : "No rejections in the queue right now.",
        blocks: rejections.length
          ? [
              {
                type: "drafts",
                items: rejections.map((f) => ({
                  company: f.name,
                  initials: f.name
                    .split(" ")
                    .map((p) => p[0])
                    .join(""),
                  subject: subjectFor(f),
                  body: draftFollowUp(f, "warm", "email")
                    .replace(/^Hi [^,]+,\n\n/, "")
                    .replace(/\n\nCheers,\n\w+$/, ""),
                })),
              },
            ]
          : [],
        followups: [
          "Which updates are quick wins?",
          "Who's been waiting longest?",
        ],
      };
    }
    if (has(q, "quick", "easy", "right now")) {
      const quick = waiting.filter(
        (f) => f.kind === "progress" || f.kind === "no-news",
      );
      return {
        text: `${plural(quick.length, "update")} you can send in under a minute each. They're good news or honest "no news yet" notes, nothing to soften:`,
        blocks: [
          list(
            quick.map((f) => ({
              title: f.name,
              meta: FOLLOW_UP_LABEL[f.kind],
              detail: f.detail,
              href: "/follow-ups",
            })),
          ),
        ],
        followups: ["Draft the rejections first"],
      };
    }
    return {
      text: `${waiting[0].name} has waited longest, ${waiting[0].daysWaiting} days. Here's everyone, longest wait first:`,
      blocks: [
        list(
          waiting.map((f) => ({
            title: f.name,
            meta: `${f.daysWaiting}d · ${FOLLOW_UP_LABEL[f.kind]}`,
            detail: f.detail,
            href: "/follow-ups",
            tone: f.daysWaiting >= 3 ? ("warm" as const) : undefined,
          })),
        ),
      ],
      followups: [
        "Draft the rejections first",
        "Which updates are quick wins?",
      ],
    };
  }

  if (key === "pipeline") {
    const atRisk = d.deals
      .filter(needsAttention)
      .sort((a, b) => riskValue(b) - riskValue(a));
    if (has(q, "call first", "first", "which deal")) {
      const top = atRisk[0];
      if (!top)
        return {
          text: "Nothing is at risk. Use the time to source for your open roles.",
          blocks: [],
          followups: [],
        };
      return {
        text: `${top.candidate.name}. ${top.read}\n\nThe move: ${top.next.label.toLowerCase()}.`,
        blocks: [
          list([
            {
              title: `${top.candidate.name} → ${top.role.client}`,
              meta: `${money(fee(top), { compact: true })} · idle ${idleLabel(top.hoursIdle)}`,
              detail: top.signals[0],
              href: `/deals/${top.id}`,
              tone: "warm",
            },
          ]),
        ],
        followups: ["What's going cold?", "How's my month tracking?"],
      };
    }
    if (has(q, "month", "track", "target")) {
      const weighted = d.deals
        .filter((x) => x.stage !== "placed")
        .reduce((s, x) => s + fee(x) * STAGE_ODDS[x.stage], 0);
      return {
        text: `You've placed ${money(RECRUITER.placedThisMonth)} of your ${money(RECRUITER.monthlyTarget)} October target, ${money(RECRUITER.monthlyTarget - RECRUITER.placedThisMonth)} to go. Weighted by stage, your live pipeline is worth ${money(Math.round(weighted))}. The deals most likely to close the gap are the late-stage ones below:`,
        blocks: [
          list(
            d.deals
              .filter((x) => x.stage === "final" || x.stage === "offer")
              .map((x) => ({
                title: `${x.candidate.name} → ${x.role.client}`,
                meta: `${STAGES.find((s) => s.id === x.stage)?.label} · ${money(fee(x), { compact: true })}`,
                href: `/deals/${x.id}`,
              })),
          ),
        ],
        followups: ["Which deal should I call first?"],
      };
    }
    return {
      text: atRisk.length
        ? `${plural(atRisk.length, "deal")} cooling, sorted by what's actually at risk: fee × how close to an offer × how cold.`
        : "Nothing is cooling. Every live deal was touched inside its window.",
      blocks: atRisk.length
        ? [
            list(
              atRisk.map((x) => ({
                title: `${x.candidate.name} → ${x.role.client}`,
                meta: `${money(fee(x), { compact: true })} · idle ${idleLabel(x.hoursIdle)}`,
                detail: x.signals[0],
                href: `/deals/${x.id}`,
                tone: "warm" as const,
              })),
            ),
          ]
        : [],
      followups: [
        "Which deal should I call first?",
        "How's my month tracking?",
      ],
    };
  }

  if (key === "deal" && ctx?.ref) {
    const x = d.deals.find((y) => y.id === ctx.ref);
    if (x) {
      if (has(q, "prep", "next move", "next")) {
        return {
          text: `${x.next.label}. Here's what I'd say:\n\n${x.next.output}`,
          blocks: [],
          followups: ["What's the risk on this deal?"],
        };
      }
      if (has(q, "summar", "happened", "history")) {
        const events = d.events.filter((e) => e.dealId === x.id).slice(0, 6);
        return {
          text: `Here's the story of ${x.candidate.name}'s deal, newest first:`,
          blocks: [
            list(
              events.map((e) => ({
                title: e.summary,
                meta: `${memberName(e.actorId)} · ${ago(e.at)}`,
              })),
            ),
          ],
          followups: ["Prep my next move"],
        };
      }
      return {
        text: x.read,
        blocks: [
          list(x.signals.map((s) => ({ title: s, tone: "warm" as const }))),
        ],
        followups: ["Prep my next move", "Summarise what's happened"],
      };
    }
  }

  if (key === "client" && ctx?.ref) {
    const c = d.clients.find((y) => y.id === ctx.ref);
    if (c) {
      const roles = rolesFor(c.name, d).filter(
        (r) => r.job.status !== "filled",
      );
      if (has(q, "invoice", "chase", "reminder", "billed", "owe")) {
        const inv = invoicesFor(c.name);
        const sent = inv
          .filter((i) => i.status === "sent")
          .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
        const aud = (n: number) => `A$${n.toLocaleString("en-AU")}`;
        if (!sent.length) {
          return {
            text: inv.length
              ? `Nothing to chase with ${c.name}. ${plural(inv.filter((i) => i.status === "paid").length, "invoice")} paid${inv.some((i) => i.status === "draft") ? ", and one draft is waiting for the Owner's sign-off" : ""}.`
              : `You haven't invoiced ${c.name} yet. The first placement creates one, filled in from the deal.`,
            blocks: [],
            followups: ["Summarise this client"],
          };
        }
        const first = c.contact.name.split(" ")[0];
        return {
          text: `${plural(sent.length, "invoice")} sent and unpaid, ${aud(sent.reduce((n, i) => n + i.amount, 0))} in total. A polite reminder to ${first}:`,
          blocks: [
            {
              type: "drafts",
              items: [
                {
                  company: `${c.contact.name} · ${c.name}`,
                  initials: c.contact.name
                    .split(" ")
                    .map((p) => p[0])
                    .join(""),
                  subject: `Invoice from ${sent[0].date}`,
                  body: `Hi ${first}, a quick nudge on ${sent.length > 1 ? `our invoices from ${sent.map((i) => i.date).join(" and ")}` : `our invoice from ${sent[0].date}`} (${aud(sent.reduce((n, i) => n + i.amount, 0))}). Could you let me know when it's scheduled for payment? Happy to resend if it's gone missing.`,
                },
              ],
            },
          ],
          followups: ["Summarise this client"],
        };
      }
      if (has(q, "check-in", "check in", "draft")) {
        return {
          text: `A short check-in to ${c.contact.name}. It gives them something useful rather than just asking for news:`,
          blocks: [
            {
              type: "drafts",
              items: [
                {
                  company: `${c.contact.name} · ${c.name}`,
                  initials: c.contact.name
                    .split(" ")
                    .map((p) => p[0])
                    .join(""),
                  subject: `Quick update on your ${roles[0]?.job.title ?? "roles"}`,
                  body: `Hi ${c.contact.name.split(" ")[0]}, a quick update from my side: ${roles.map((r) => `${r.live.length + r.pool.length} strong people in play for ${r.job.title}`).join(", ") || "I'm building a shortlist for you"}. Do you have 15 minutes this week to go through them?`,
                },
              ],
            },
          ],
          followups: ["Who's in play for each role?"],
        };
      }
      if (has(q, "in play", "each role", "who")) {
        return {
          text: `Everyone attached to ${c.name}'s open roles:`,
          blocks: [
            list(
              roles.map((r) => ({
                title: r.job.title,
                meta: `${r.live.length} in pipeline · ${r.pool.length} shortlisted · ${r.applicants.length} to review`,
                detail:
                  [
                    ...r.live.map((x) => x.candidate.name),
                    ...r.pool.map((x) => x.name),
                  ].join(", ") || "Nobody yet",
                href: `/clients/${c.id}`,
              })),
            ),
          ],
          followups: ["Summarise this client"],
        };
      }
      const people = roles.reduce(
        (s, r) => s + r.live.length + r.pool.length + r.applicants.length,
        0,
      );
      return {
        text: `${c.name} is ${c.status === "active" ? "an active client" : "a prospect"} in ${c.industry.toLowerCase()}, working with you since ${new Date(c.since).toLocaleDateString("en-AU", { month: "long", year: "numeric" })}. They have ${plural(roles.length, "open role")} with ${plural(people, "person", "people")} attached, at a ${Math.round(c.feePct * 100)}% fee. Terms of Business: ${tobStatus(c.name, d.documents)}.`,
        blocks: [],
        followups: [
          "Who's in play for each role?",
          `Draft a check-in to ${c.contact.name.split(" ")[0]}`,
        ],
      };
    }
  }

  if (key === "clients") {
    const all = d.clients.map((c) => ({
      c,
      roles: rolesFor(c.name, d),
      tob: tobStatus(c.name, d.documents),
    }));
    if (has(q, "fee", "biggest", "money")) {
      const ranked = all
        .map((x) => ({
          ...x,
          fees: x.roles.reduce(
            (s, r) => s + r.live.reduce((t, y) => t + fee(y), 0),
            0,
          ),
        }))
        .filter((x) => x.fees > 0)
        .sort((a, b) => b.fees - a.fees);
      return {
        text: "Fees currently in play, by client:",
        blocks: [
          list(
            ranked.map((x) => ({
              title: x.c.name,
              meta: money(x.fees, { compact: true }),
              href: `/clients/${x.c.id}`,
            })),
          ),
        ],
        followups: ["Which clients need attention?"],
      };
    }
    if (has(q, "prospect", "closest", "signing")) {
      const prospects = all.filter((x) => x.c.status === "prospect");
      return {
        text: "Your prospects, and how close each is to becoming a client:",
        blocks: [
          list(
            prospects.map((x) => ({
              title: x.c.name,
              meta: `TOB ${x.tob}`,
              detail:
                x.tob === "sent"
                  ? "Terms are with them. Chase for a signature."
                  : "Send your Terms of Business next.",
              href: `/clients/${x.c.id}`,
              tone: x.tob === "sent" ? ("good" as const) : undefined,
            })),
          ),
        ],
        followups: ["Where are my biggest fees?"],
      };
    }
    const needs = all.flatMap((x) => [
      ...(x.tob !== "signed"
        ? [
            {
              title: x.c.name,
              meta: `TOB ${x.tob}`,
              detail:
                "No signed terms yet, so a placement here isn't protected.",
              href: `/clients/${x.c.id}`,
              tone: "warm" as const,
            },
          ]
        : []),
      ...x.roles
        .filter(
          (r) =>
            r.job.status === "open" &&
            r.live.length + r.pool.length + r.applicants.length === 0,
        )
        .map((r) => ({
          title: `${x.c.name} · ${r.job.title}`,
          meta: "No candidates",
          detail: "Nobody attached to this role yet.",
          href: `/clients/${x.c.id}`,
          tone: "warm" as const,
        })),
    ]);
    return {
      text: needs.length
        ? "These need you:"
        : "Every client has signed terms and candidates in play.",
      blocks: needs.length ? [list(needs)] : [],
      followups: [
        "Where are my biggest fees?",
        "Which prospects are closest to signing?",
      ],
    };
  }

  if (key === "applicants") {
    const fresh = d.applicants.filter((a) => a.status === "new");
    const jobTitle = (id: string) =>
      d.jobs.find((j) => j.id === id)?.title ?? "a role";
    if (has(q, "decline", "reject")) {
      const weak = fresh.filter((a) => a.fit === "unlikely");
      return {
        text: weak.length
          ? "These don't fit their briefs. Declining them queues an honest update in Follow-ups:"
          : "No clear declines right now. Everyone left is at least a possible fit.",
        blocks: weak.length
          ? [
              list(
                weak.map((a) => ({
                  title: a.name,
                  meta: `${FIT_LABEL[a.fit]} · ${jobTitle(a.jobId)}`,
                  detail: a.gaps[0],
                  href: "/applicants",
                })),
              ),
            ]
          : [],
        followups: ["Who are the strongest applicants?"],
      };
    }
    if (has(q, "summar", "come in")) {
      const byJob = new Map<string, number>();
      fresh.forEach((a) =>
        byJob.set(jobTitle(a.jobId), (byJob.get(jobTitle(a.jobId)) ?? 0) + 1),
      );
      return {
        text: `${plural(fresh.length, "application")} waiting, ${fresh.filter((a) => a.fit === "strong").length} of them strong fits. By role:`,
        blocks: [
          list(
            [...byJob].map(([title, n]) => ({
              title,
              meta: plural(n, "applicant"),
              href: "/applicants",
            })),
          ),
        ],
        followups: [
          "Who are the strongest applicants?",
          "Who should I decline?",
        ],
      };
    }
    const strong = fresh.filter((a) => a.fit === "strong");
    return {
      text: `${plural(strong.length, "strong fit")} to review. I'd shortlist these first:`,
      blocks: [
        list(
          strong.map((a) => ({
            title: a.name,
            meta: jobTitle(a.jobId),
            detail: a.summary,
            href: "/applicants",
            tone: "good" as const,
          })),
        ),
      ],
      followups: ["Who should I decline?", "Summarise what's come in"],
    };
  }

  if (key === "candidates") {
    if (has(q, "ready", "pipeline")) {
      const ready = d.candidates.filter((c) => c.status === "contacted");
      return {
        text: ready.length
          ? "You've already spoken to these people, so they're ready to become deals:"
          : "Nobody's been contacted yet. Reach out first.",
        blocks: ready.length
          ? [
              list(
                ready.map((c) => ({
                  title: c.name,
                  meta: c.headline,
                  href: "/candidates",
                })),
              ),
            ]
          : [],
        followups: ["Who should I contact first?"],
      };
    }
    const pool = d.candidates
      .filter((c) => c.status === "pool")
      .sort(
        (a, b) => (a.fit === "strong" ? -1 : 0) - (b.fit === "strong" ? -1 : 0),
      );
    return {
      text: "Shortlisted but not contacted yet, strongest first:",
      blocks: [
        list(
          pool.map((c) => ({
            title: c.name,
            meta: c.fit ? FIT_LABEL[c.fit] : c.source,
            detail: c.summary,
            href: "/candidates",
          })),
        ),
      ],
      followups: ["Who's ready for the pipeline?"],
    };
  }

  if (key === "documents") {
    if (has(q, "unsigned", "terms", "tob")) {
      const open = d.documents.filter(
        (x) => x.kind === "tob" && x.status !== "signed",
      );
      return {
        text: open.length
          ? "Terms of Business that aren't signed yet:"
          : "Every Terms of Business is signed.",
        blocks: open.length
          ? [
              list(
                open.map((x) => ({
                  title: x.client,
                  meta:
                    x.status === "sent"
                      ? "Sent, waiting for signature"
                      : "Draft, not sent",
                  href: "/documents",
                  tone: "warm" as const,
                })),
              ),
            ]
          : [],
        followups: ["What's waiting for approval?"],
      };
    }
    if (has(q, "sent me", "clients sent", "received", "came in")) {
      const got = d.documents
        .filter((x) => x.direction === "received")
        .sort((a, b) => b.at - a.at);
      return {
        text: "What clients have sent you, newest first:",
        blocks: [
          list(
            got.map((x) => ({
              title: DOC_KIND_LABEL[x.kind],
              meta: `${x.client} · ${ago(x.at)}`,
              detail: x.note,
              href: "/documents",
            })),
          ),
        ],
        followups: ["Which Terms of Business are unsigned?"],
      };
    }
    const pending = d.approvals.filter((a) => a.status === "pending");
    return {
      text: pending.length
        ? `${plural(pending.length, "item")} waiting for the Owner:`
        : "Nothing is waiting for approval.",
      blocks: pending.length
        ? [
            list(
              pending.map((a) => ({
                title: a.title,
                meta: memberName(a.requestedBy),
                detail: a.detail,
                href: `/deals/${a.dealId}`,
                tone: "warm" as const,
              })),
            ),
          ]
        : [],
      followups: [
        "Which Terms of Business are unsigned?",
        "What have clients sent me?",
      ],
    };
  }

  if (key === "team") {
    if (has(q, "leaderboard", "rank", "climb", "top", "ahead")) {
      const [top, ...rest] = TEAM_BOARD;
      const stuck = rest.find(
        (r) => r.stats.submittals > 0 && r.stats.interviews === 0,
      );
      return {
        text: `${top.name} leads the team with ${plural(top.stats.placements, "placement")}.${stuck ? ` ${stuck.name.split(" ")[0]} has ${stuck.stats.submittals} submittals and no interviews yet, which is the gap worth a coaching chat.` : ""}`,
        blocks: [
          list(
            TEAM_BOARD.map((r, i) => ({
              title: `${i + 1}. ${r.name}`,
              meta: `${r.score} pts · ${r.stats.placements} placements`,
              detail: `${r.stats.calls} calls → ${r.stats.submittals} submittals → ${r.stats.interviews} interviews`,
            })),
          ),
        ],
        followups: rest.length
          ? ["Who's carrying the most deals?", "What needs my approval?"]
          : ["What needs my approval?"],
      };
    }
    if (has(q, "carrying", "most deals", "who's doing")) {
      return {
        text: "Live deals per person:",
        blocks: [
          list(
            d.members.map((m) => ({
              title: m.name,
              meta: ROLE_LABEL[m.role],
              detail: `${plural(d.deals.filter((x) => x.ownerId === m.id && x.stage !== "placed").length, "live deal")}`,
            })),
          ),
        ],
        followups: ["What needs my approval?"],
      };
    }
    const pending = d.approvals.filter((a) => a.status === "pending");
    return {
      text: pending.length
        ? "Waiting for your sign-off:"
        : "Nothing needs your approval.",
      blocks: pending.length
        ? [
            list(
              pending.map((a) => ({
                title: a.title,
                meta: `from ${memberName(a.requestedBy)}`,
                detail: a.detail,
                href: `/deals/${a.dealId}`,
                tone: "warm" as const,
              })),
            ),
          ]
        : [],
      followups: ["Who's carrying the most deals?"],
    };
  }

  if (key === "audit") {
    const take = (
      filter: (e: DeskState["events"][number]) => boolean,
      text: string,
    ) => {
      const evs = d.events.filter(filter).slice(0, 8);
      return {
        text: evs.length ? text : "Nothing on record for that.",
        blocks: evs.length
          ? [
              list(
                evs.map((e) => ({
                  title: e.summary,
                  meta: `${memberName(e.actorId)} · ${ago(e.at)}`,
                })),
              ),
            ]
          : [],
        followups: ["What happened today?", "Any fee changes?"],
      };
    };
    if (has(q, "jordan"))
      return take(
        (e) => e.actorId === "jordan",
        "Jordan's most recent actions:",
      );
    if (has(q, "fee"))
      return take(
        (e) =>
          e.action.includes("fee") || e.summary.toLowerCase().includes("fee"),
        "Fee changes and fee approvals:",
      );
    return take(
      (e) => e.at >= NOW_MS - 24 * 3_600_000,
      "The last 24 hours on your desk:",
    );
  }

  if (key === "learnings") {
    const next = LESSONS.find((l) => !d.completedLessons.includes(l.id));
    return {
      text: next
        ? `You've finished ${d.completedLessons.length} of ${LESSONS.length} lessons. Next up is "${next.title}", ${next.minutes} minutes.`
        : "You've finished every lesson. Nice work.",
      blocks: next
        ? [
            list([
              {
                title: next.title,
                meta: `${next.minutes} min`,
                href: `/learnings/${next.id}`,
              },
            ]),
          ]
        : [],
      followups: [],
    };
  }

  if (key === "sum") {
    if (has(q, "independent", "worth")) {
      return {
        text: "Usually, if you bill over about $300k and at least half your clients would follow you. Below that, the costs of running a desk (insurance, tools, accounting) eat most of the difference. Above it, the gap compounds every year because the clients become yours. Try lowering 'Billings you'd keep' to see where it stops being worth it for you.",
        blocks: [],
        followups: ["Explain these numbers"],
      };
    }
    return {
      text: "The Sum compares what you bill for an agency with what you take home. Your take-home is base plus commission, and commission only starts after a threshold. The agency keeps the rest. The second card shows the same desk under your own name, after your costs and the clients who'd follow you. Change any number by dragging or typing it.",
      blocks: [],
      followups: ["Is going independent worth it?"],
    };
  }

  // Home, Dashboard and anything without its own handler use Amara's general replies.
  return amaraReply(prompt, key === "home" ? d.homeStage : "day30");
}
