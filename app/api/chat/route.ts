import { NextResponse } from "next/server";

import { answer } from "@/lib/chatbot";

export const dynamic = "force-dynamic";

// Small in-memory limiter: 20 messages per minute per IP per server instance.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 20;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) {
    return NextResponse.json({ reply: "You’re sending messages quickly. Please wait a moment." }, { status: 429 });
  }
  let message = "";
  try {
    const body = (await request.json()) as { message?: unknown };
    message = typeof body.message === "string" ? body.message : "";
  } catch {
    return NextResponse.json({ reply: "Sorry, I couldn’t read that." }, { status: 400 });
  }
  try {
    return NextResponse.json(await answer(message));
  } catch {
    return NextResponse.json(
      { reply: "Something went wrong on my side. You can still browse the directory.", links: [{ label: "Browse courses", href: "/directory" }] },
      { status: 500 },
    );
  }
}
