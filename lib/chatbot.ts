import "server-only";

import { searchListings } from "@/lib/queries/directory";
import type { DirectoryFilters } from "@/lib/directory-params";
import type { ListingFormat, PriceRangeId } from "@/lib/constants";

export type ChatCourse = {
  title: string;
  slug: string;
  price: string;
  format: string;
  schedule: string;
  location: string;
};

export type ChatReply = {
  reply: string;
  courses?: ChatCourse[];
  links?: { label: string; href: string }[];
  suggestions?: string[];
};

const STOP = new Set(
  "a an the i me my we you your is are was were be to of for in on at and or with about any some there that this it can could would should do does did find show give want need looking look search get have has can please course courses class classes training trainings workshop workshops something anything near nearby what which who how when where under over than less more cheap cheaper free paid online virtual live person in-person demand self paced self-paced hybrid next upcoming new best good top".split(
    " ",
  ),
);

const HELP_SUGGESTIONS = [
  "Free online courses",
  "Leadership workshops",
  "Courses under $100",
  "How do I list a course?",
];

type Faq = { keys: RegExp; answer: string; links?: { label: string; href: string }[] };

const FAQS: Faq[] = [
  {
    keys: /^(hi|hello|hey|yo|good (morning|afternoon|evening)|help|start)\b/,
    answer:
      "Hi! I can find courses for you (try “leadership workshops under $200” or “free online courses”) or answer questions about how Skillhive works.",
  },
  {
    keys: /\b(how (does|do) (it|this|skillhive) work|what is (this|skillhive)|about)\b/,
    answer:
      "Skillhive is a directory of courses from independent trainers. You search, compare up to three courses side by side, save favourites, and sign up directly on the trainer's own page.",
    links: [{ label: "How it works", href: "/#how-it-works" }],
  },
  {
    keys: /\b(cost|price|pricing|fee|fees|subscription|plan|plans|pay)\b.*\b(trainer|list|listing|publish|teach)\b|\b(trainer|list|listing|publish|teach)\b.*\b(cost|price|pricing|fee|fees|subscription|plan|plans|pay)\b/,
    answer:
      "Trainers choose a plan: Basic is $19/month for up to 2 active listings, and Pro is $29/month for unlimited listings. There is a 30-day free trial and you can cancel any time.",
    links: [{ label: "See plans", href: "/#pricing" }],
  },
  {
    keys: /\b(list|post|add|publish|submit)\b.*\b(course|training|workshop|listing)\b|\bbecome a trainer\b|\bteach\b/,
    answer:
      "To list a course, create a trainer account, pick a plan, then add a listing with its dates, price and registration link. New listings are reviewed before they appear.",
    links: [
      { label: "Create account", href: "/signup" },
      { label: "New listing", href: "/listings/new" },
    ],
  },
  {
    keys: /\b(compare|comparison|side by side)\b/,
    answer:
      "Press “Compare” on up to three course cards, then open the compare tray at the bottom of the page to see price, dates, format and credits in one table.",
    links: [{ label: "Browse courses", href: "/directory" }],
  },
  {
    keys: /\b(calendar|dates|schedule|when)\b.*\b(session|course|workshop|calendar|month)\b|\bcalendar\b/,
    answer: "The calendar shows every upcoming live session laid out by month.",
    links: [{ label: "Open calendar", href: "/calendar" }],
  },
  {
    keys: /\b(alert|alerts|notify|notification|email me|keyword)\b/,
    answer:
      "Sign in, open Saved, and add keywords. We email you when a new course matches. You can turn alert emails off any time in Settings.",
    links: [
      { label: "Saved & alerts", href: "/saved" },
      { label: "Settings", href: "/settings" },
    ],
  },
  {
    keys: /\b(save|saved|bookmark|favourite|favorite)\b/,
    answer: "Sign in and press Save on any course page. Your list lives under Saved.",
    links: [{ label: "Saved courses", href: "/saved" }],
  },
  {
    keys: /\b(review|reviews|rating|ratings)\b/,
    answer:
      "Signed-in learners can rate a course and write a review. Trainers can reply publicly. You can’t review your own course.",
  },
  {
    keys: /\b(is it free|free for|cost to (learners|students|users)|do i pay|pay you|charge)\b/,
    answer:
      "Browsing, comparing and saving are free for learners. You pay the trainer directly when you register for a course, never us.",
  },
  {
    keys: /\b(credit|credits|ceu|cpd|pdu|cpe|certificate|accredit)/,
    answer:
      "Many courses list the credits they carry and who accredits them. Use the “Credits” filter in the directory to narrow to those.",
    links: [{ label: "Browse courses", href: "/directory" }],
  },
  {
    keys: /\b(password|forgot|reset|log ?in|sign ?in|account|sign ?up|register)\b/,
    answer:
      "You can sign up or log in with email and password, or use a magic link. If you forgot your password, use the reset link on the login page.",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Reset password", href: "/reset-password" },
    ],
  },
  {
    keys: /\b(dark|light|theme|mode)\b/,
    answer: "Use the sun/moon button in the header, or pick Light, Dark or System in Settings.",
  },
  {
    keys: /\b(contact|support|email|human|person|talk)\b.*\b(you|us|team|someone|support|help)?\b|\bcontact\b/,
    answer: "You can reach the team through the contact page and we’ll get back to you.",
    links: [{ label: "Contact us", href: "/contact" }],
  },
  {
    keys: /\b(thanks|thank you|thx|cheers)\b/,
    answer: "You’re welcome! Anything else I can help you find?",
  },
];

function detectFormats(t: string): ListingFormat[] {
  const out: ListingFormat[] = [];
  const demand = /\b(on.?demand|self.?paced|recorded|anytime|at my own pace)\b/.test(t);
  if (/\b(online|virtual|remote|zoom|webinar|live)\b/.test(t) && !demand) {
    out.push("Live Virtual");
    // "online" on its own also covers self-paced courses; "live" does not.
    if (!/\blive\b/.test(t)) out.push("On-Demand");
  }
  if (/\b(in.?person|on.?site|face.to.face|venue)\b/.test(t)) out.push("In-Person");
  if (demand) out.push("On-Demand");
  if (/\bhybrid\b/.test(t)) out.push("Hybrid");
  return out;
}

function detectPrice(t: string): { priceId: PriceRangeId | null; free: boolean; label?: string } {
  if (/\bfree\b|\bno cost\b/.test(t)) return { priceId: "under-100", free: true, label: "free" };
  const m = t.match(/(?:under|below|less than|cheaper than|<)\s*\$?\s*(\d+)/);
  if (m) {
    const n = Number(m[1]);
    const priceId: PriceRangeId = n <= 100 ? "under-100" : n <= 250 ? "100-250" : n <= 500 ? "250-500" : "500-plus";
    return { priceId, free: false, label: `under $${n}` };
  }
  if (/\b(cheap|affordable|budget)\b/.test(t)) return { priceId: "under-100", free: false, label: "under $100" };
  return { priceId: null, free: false };
}

function emptyFilters(): DirectoryFilters {
  return { q: [], states: [], formats: [], priceId: null, providers: [], tagIds: [], page: 1 };
}

function keywords(t: string): string[] {
  return t
    .replace(/[^a-z0-9+#&\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w))
    .slice(0, 3);
}

function toCourse(i: Awaited<ReturnType<typeof searchListings>>["items"][number]): ChatCourse {
  return {
    title: i.title,
    slug: i.slug,
    price: i.price <= 0 ? "Free" : `$${i.price % 1 === 0 ? i.price : i.price.toFixed(2)}`,
    format: i.format,
    schedule: i.schedule,
    location: i.location,
  };
}

export async function answer(message: string): Promise<ChatReply> {
  const text = message.trim().slice(0, 300);
  const t = text.toLowerCase();
  if (!t) return { reply: "Ask me about a topic, a format or a budget, and I’ll find matching courses.", suggestions: HELP_SUGGESTIONS };

  const wantsCourses =
    /\b(find|show|search|looking|need|want|recommend|suggest|any|courses?|classes|workshops?|training|learn|study|upskill)\b/.test(t) ||
    detectFormats(t).length > 0 ||
    detectPrice(t).priceId !== null;

  // Questions about the site win over course search, unless a topic is clearly named.
  const faq = FAQS.find((f) => f.keys.test(t));
  const kw = keywords(t);
  if (faq && !(wantsCourses && kw.length > 0 && !/\b(how|what|why|can i|do i|is it)\b/.test(t))) {
    return { reply: faq.answer, links: faq.links, suggestions: HELP_SUGGESTIONS.slice(0, 3) };
  }

  const formats = detectFormats(t);
  const price = detectPrice(t);
  const filters = emptyFilters();
  filters.formats = formats;
  filters.priceId = price.priceId;
  filters.q = kw;

  let { items } = await searchListings(filters);
  let relaxed = false;
  if (items.length === 0 && kw.length > 0) {
    // Nothing matched the keywords: loosen to the structured filters only.
    filters.q = [];
    ({ items } = await searchListings(filters));
    relaxed = true;
  }
  if (price.free) items = items.filter((i) => i.price <= 0);
  // Keywords matched nothing and there are no other filters: don't show random courses.
  if (relaxed && formats.length === 0 && !price.priceId) items = [];

  const bits = [
    formats.length ? formats.join(" / ").toLowerCase() : null,
    price.label ?? null,
    !relaxed && kw.length ? `“${kw.join(" ")}”` : null,
  ].filter(Boolean);
  const described = bits.length ? ` (${bits.join(", ")})` : "";

  if (items.length === 0) {
    return {
      reply: `I couldn’t find a course${described}. Try a broader topic, or browse the full directory.`,
      links: [{ label: "Browse all courses", href: "/directory" }],
      suggestions: HELP_SUGGESTIONS,
    };
  }

  const shown = items.slice(0, 4).map(toCourse);
  const qs = new URLSearchParams();
  if (!relaxed && kw.length) qs.set("q", kw.join(","));
  if (formats.length) qs.set("formats", formats.join(","));
  if (price.priceId) qs.set("price", price.priceId);
  return {
    reply: relaxed
      ? `I didn’t find an exact match for “${kw.join(" ")}”, but here are courses${described || " you might like"}:`
      : `Here ${shown.length === 1 ? "is a course" : "are courses"}${described} that ${shown.length === 1 ? "fits" : "fit"}:`,
    courses: shown,
    links: [{ label: "See all results", href: `/directory${qs.size ? `?${qs}` : ""}` }],
    suggestions: ["Compare these", "How do I sign up?", "Any free courses?"].slice(0, 3),
  };
}
