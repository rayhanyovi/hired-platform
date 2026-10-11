/**
 * The raw application behind each applicant: what actually arrived from the
 * job board or the inbox, before Amara read it. Mocked from the applicant
 * record, with hand-written letters for a few people so the demo reads real.
 */
import type { Applicant, Job } from "./types";

export type Attachment = {
  name: string;
  size: string;
  kind: "cv" | "portfolio" | "other";
};

export type Application =
  | {
      kind: "email";
      from: string;
      to: string;
      subject: string;
      body: string;
      attachments: Attachment[];
    }
  | {
      kind: "board";
      /** e.g. "Seek", "LinkedIn Easy Apply" */
      via: string;
      email: string;
      phone: string;
      questions: { q: string; a: string }[];
      coverLetter?: string;
      attachments: Attachment[];
    }
  | {
      kind: "referral";
      referrer: string;
      note: string;
      attachments: Attachment[];
    };

const ascii = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const slug = (name: string) =>
  ascii(name)
    .toLowerCase()
    .replace(/[^a-z]+/g, ".");
const fileName = (name: string) => ascii(name).replace(/\s+/g, "_");
/** Stable pseudo-random number from a string, so the mock never flickers. */
const hash = (s: string) =>
  [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);

const role = (headline: string) => headline.split(" · ")[0];
const company = (headline: string) => headline.split(" · ")[1] ?? "";

function yearsOf(a: Applicant) {
  const starts = a.experience
    .map((x) => Number(x.match(/(\d{4})–/)?.[1]))
    .filter(Boolean);
  return starts.length ? Math.max(0, 2026 - Math.min(...starts)) : 0;
}

function cv(a: Applicant): Attachment {
  return {
    name: `${fileName(a.name)}_CV.pdf`,
    size: `${180 + (hash(a.name) % 240)} KB`,
    kind: "cv",
  };
}

const COVER_LETTERS: Record<string, string> = {
  "a-hamish": `Hi,

I'm applying for the Senior SRE role. For the last four years I've run the Kubernetes platform at REA Group, about 400 services across three clusters, and I've led the on-call rotation for our payments team since 2022.

I'll be upfront that I haven't worked inside a bank, so APRA CPS 230 would be new to me. I have done SOC 2 and PCI audits end to end and I'm comfortable learning a compliance framework quickly.

I'm in Melbourne and happy to be in the office a few days a week.

Thanks for your time,
Hamish`,
  "a-oliver": `Hello!

I just finished the Coder Academy bootcamp and I'm really keen to get my first role as a frontend developer. I know this role says senior but I'm a fast learner and I'd love the chance to show what I can do. My final project was a booking app in React and TypeScript.

Even if this one isn't right, I'd really appreciate any feedback.

Cheers,
Oliver`,
};

const EMAILS: Record<
  string,
  { subject: string; body: string; extra?: Attachment[] }
> = {
  "a-leo": {
    subject: "Head of Talent – Leo Fitzgerald",
    body: `Hi,

Saw the Head of Talent role on your LinkedIn and wanted to get my CV straight to you.

I've spent ten years in tech recruitment at Hays, the last four running a desk of three consultants placing engineers across Sydney. I know the market and most of the hiring managers in it.

I haven't worked in-house yet, but it's the move I've been wanting to make, and I'd bring the agency pace with me.

Happy to jump on a call whenever suits.

Best,
Leo Fitzgerald
0412 553 908`,
  },
  "a-ines": {
    subject: "Head of Data (Northwind) – application",
    body: `Hello,

A former colleague mentioned you're recruiting a Head of Data for a funds business, and I'd like to be considered.

I lead the data platform group at Xero (7 engineers). Over the last two years we moved the whole warehouse from Redshift to Snowflake with no reporting downtime, and I own the finance data models our CFO reports from.

I haven't worked in funds management specifically, but I've spent nine years around finance data, including four at Macquarie.

CV and a short write-up of the migration are attached.

Kind regards,
Inês Duarte`,
    extra: [
      {
        name: "Xero_data_platform_migration.pdf",
        size: "1.2 MB",
        kind: "portfolio",
      },
    ],
  },
};

function coverLetter(a: Applicant, job?: Job) {
  if (COVER_LETTERS[a.id]) return COVER_LETTERS[a.id];
  const before = a.experience[1];
  return `Hi,

I'd like to apply for the ${job?.title ?? "open"} role. I'm currently ${role(a.headline)} at ${company(a.headline) || "my current company"}${before ? `, and before that I was ${before.split(" · ")[0].replace(",", " at")}` : ""}.

A few things that seem relevant: ${a.matches.map((m) => (/^[A-Z][a-z]/.test(m) ? m.charAt(0).toLowerCase() + m.slice(1) : m)).join("; ")}.

I'm based in ${a.location.replace(/^Remote · /, "")} and free to talk any time this week.

Thanks,
${a.firstName}`;
}

function boardQuestions(a: Applicant, job?: Job): { q: string; a: string }[] {
  const h = hash(a.id);
  const years = yearsOf(a);
  const salary = job
    ? Math.round((job.salary * (0.92 + (h % 15) / 100)) / 5000) * 5000
    : 0;
  const notice = ["2 weeks", "4 weeks", "4 weeks", "1 month", "Available now"][
    h % 5
  ];
  const qs = [
    {
      q: "Which of the following statements best describes your right to work in Australia?",
      a: [
        "I'm an Australian citizen",
        "I'm a permanent resident",
        "I'm an Australian citizen",
        "I have a temporary visa with full work rights",
      ][h % 4],
    },
    {
      q: `How many years' experience do you have as a ${job?.title ?? role(a.headline)}?`,
      a: years >= 1 ? `${years} years` : "Less than 1 year",
    },
    {
      q: "What's your expected annual base salary?",
      a: salary ? `$${salary.toLocaleString("en-AU")}` : "Open to discussion",
    },
    {
      q: "How much notice are you required to give your current employer?",
      a: years ? notice : "Available now",
    },
  ];
  if (
    job &&
    !job.location.startsWith("Remote") &&
    !a.location.includes(job.location)
  ) {
    qs.push({
      q: `This role is based in ${job.location}. Are you willing to relocate or commute?`,
      a: a.location.includes("→")
        ? "Yes, already relocating"
        : "Open to discussing",
    });
  }
  return qs;
}

export function applicationFor(a: Applicant, job?: Job): Application {
  const email = `${slug(a.name)}@${["gmail.com", "outlook.com", "icloud.com"][hash(a.name) % 3]}`;
  const phone = `04${String(10_000_000 + (hash(a.name) % 89_999_999)).slice(0, 2)} ${String(hash(a.id) % 1000).padStart(3, "0")} ${String(hash(a.name + a.id) % 1000).padStart(3, "0")}`;

  if (a.source === "Email") {
    const e = EMAILS[a.id];
    return {
      kind: "email",
      from: `${a.name} <${email}>`,
      to: "jobs@youragency.com.au",
      subject: e?.subject ?? `Application: ${job?.title ?? "your open role"}`,
      body: e?.body ?? coverLetter(a, job),
      attachments: [cv(a), ...(e?.extra ?? [])],
    };
  }

  if (a.source === "Referral") {
    return {
      kind: "referral",
      referrer: "Laura Chen",
      note: `${a.firstName} is one of the best people I've worked with. Worth a call for the ${job?.title ?? "role"}.`,
      attachments: [cv(a)],
    };
  }

  const via = {
    Seek: "Seek",
    LinkedIn: "LinkedIn Easy Apply",
    Indeed: "Indeed",
    Website: "Your careers page",
  }[a.source];
  const questions = boardQuestions(a, job);
  return {
    kind: "board",
    via,
    email,
    phone,
    // LinkedIn Easy Apply only asks a couple of questions and rarely carries a letter.
    questions: a.source === "LinkedIn" ? questions.slice(1, 3) : questions,
    coverLetter: a.source === "LinkedIn" ? undefined : coverLetter(a, job),
    attachments: [
      cv(a),
      ...(a.source === "Website"
        ? [
            {
              name: `${fileName(a.name)}_portfolio.pdf`,
              size: "4.8 MB",
              kind: "portfolio" as const,
            },
          ]
        : []),
    ],
  };
}
