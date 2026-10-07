/** Placeholder curriculum. All copy is lorem ipsum until real material exists. */

export type LessonKind = "video" | "reading" | "quiz";

export type Question = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type Lesson = {
  id: string;
  trackId: string;
  kind: LessonKind;
  title: string;
  summary: string;
  minutes: number;
  mentor: { name: string; role: string };
  takeaways?: string[];
  body?: { heading?: string; text: string }[];
  questions?: Question[];
};

export type Track = {
  id: string;
  number: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

const P = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus, posuere velit aliquet. Donec ullamcorper nulla non metus auctor fringilla.",
  "Vestibulum id ligula porta felis euismod semper. Cras mattis consectetur purus sit amet fermentum. Aenean lacinia bibendum nulla sed consectetur, maecenas faucibus mollis interdum.",
  "Curabitur blandit tempus porttitor. Nullam quis risus eget urna mollis ornare vel eu leo. Sed posuere consectetur est at lobortis, donec id elit non mi porta gravida at eget metus.",
  "Etiam porta sem malesuada magna mollis euismod. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Praesent commodo cursus magna, vel scelerisque nisl consectetur et.",
  "Maecenas sed diam eget risus varius blandit sit amet non magna. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit.",
];

const TAKEAWAYS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  "Integer posuere erat a ante venenatis dapibus",
  "Donec ullamcorper nulla non metus auctor fringilla",
];

const MENTORS = [
  { name: "Lorem Ipsum", role: "Dolor sit amet" },
  { name: "Consectetur Adipis", role: "Elit sed do" },
  { name: "Tempor Incidid", role: "Ut labore et dolore" },
];

const article = (): Lesson["body"] => [
  { text: P[0] },
  { text: P[1] },
  { heading: "Lorem ipsum dolor sit", text: P[2] },
  { text: P[3] },
  { heading: "Consectetur adipiscing elit", text: P[4] },
  { text: P[0] },
];

const quiz = (count: number): Question[] =>
  Array.from({ length: count }, (_, i) => ({
    prompt: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit?",
      "Integer posuere erat a ante venenatis dapibus posuere velit?",
      "Donec ullamcorper nulla non metus auctor fringilla, sed do eiusmod?",
      "Vestibulum id ligula porta felis euismod semper cras mattis?",
      "Curabitur blandit tempus porttitor nullam quis risus eget urna?",
    ][i % 5],
    options: [
      "Lorem ipsum dolor sit amet",
      "Consectetur adipiscing elit sed do",
      "Eiusmod tempor incididunt ut labore",
      "Dolore magna aliqua ut enim",
    ],
    answer: [1, 3, 0, 2, 1][i % 5],
    explanation: "Aenean lacinia bibendum nulla sed consectetur. Maecenas faucibus mollis interdum, cras mattis consectetur purus sit amet fermentum.",
  }));

function lesson(trackId: string, n: number, kind: LessonKind, title: string, minutes: number, mentor = 0): Lesson {
  return {
    id: `${trackId}-${n}`,
    trackId,
    kind,
    title,
    minutes,
    mentor: MENTORS[mentor],
    summary: P[n % P.length].split(". ")[0] + ".",
    takeaways: kind === "quiz" ? undefined : TAKEAWAYS,
    body: kind === "reading" ? article() : kind === "video" ? [{ text: P[(n + 1) % P.length] }, { text: P[(n + 2) % P.length] }] : undefined,
    questions: kind === "quiz" ? quiz(5) : undefined,
  };
}

export const TRACKS: Track[] = [
  {
    id: "lorem",
    number: "01",
    title: "Lorem ipsum dolor",
    description: "Sit amet consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
    lessons: [
      lesson("lorem", 1, "video", "Lorem ipsum dolor sit amet", 12, 0),
      lesson("lorem", 2, "reading", "Consectetur adipiscing elit sed do", 6, 1),
      lesson("lorem", 3, "video", "Eiusmod tempor incididunt ut labore", 18, 0),
      lesson("lorem", 4, "quiz", "Dolore magna aliqua: check-in", 5, 2),
    ],
  },
  {
    id: "consectetur",
    number: "02",
    title: "Consectetur adipiscing",
    description: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.",
    lessons: [
      lesson("consectetur", 1, "reading", "Ut enim ad minim veniam quis", 8, 1),
      lesson("consectetur", 2, "video", "Nostrud exercitation ullamco laboris", 22, 2),
      lesson("consectetur", 3, "video", "Nisi ut aliquip ex ea commodo", 15, 0),
      lesson("consectetur", 4, "reading", "Duis aute irure dolor in reprehenderit", 7, 1),
      lesson("consectetur", 5, "quiz", "Voluptate velit esse: check-in", 6, 2),
    ],
  },
  {
    id: "eiusmod",
    number: "03",
    title: "Sed do eiusmod tempor",
    description: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt.",
    lessons: [
      lesson("eiusmod", 1, "video", "Excepteur sint occaecat cupidatat", 20, 2),
      lesson("eiusmod", 2, "reading", "Non proident sunt in culpa qui", 9, 0),
      lesson("eiusmod", 3, "video", "Officia deserunt mollit anim id est", 14, 1),
      lesson("eiusmod", 4, "quiz", "Laborum: final check-in", 8, 2),
    ],
  },
];

export const LESSONS = TRACKS.flatMap((t) => t.lessons);

/** Seed progress so the demo opens mid-way through the curriculum. */
export const INITIAL_COMPLETED = ["lorem-1", "lorem-2", "lorem-3", "lorem-4", "consectetur-1"];
export const CONTINUE_LESSON_ID = "consectetur-2";

export const KIND_LABEL: Record<LessonKind, string> = {
  video: "Video",
  reading: "Reading",
  quiz: "Quiz",
};

export function findLesson(id: string) {
  const lesson = LESSONS.find((l) => l.id === id);
  if (!lesson) return null;
  const track = TRACKS.find((t) => t.id === lesson.trackId)!;
  const index = LESSONS.indexOf(lesson);
  return { lesson, track, prev: LESSONS[index - 1] ?? null, next: LESSONS[index + 1] ?? null };
}
