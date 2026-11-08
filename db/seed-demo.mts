/**
 * Demo content for Skillhive: attaches a handful of approved sample courses
 * (with upcoming dates) to the test trainer account. Idempotent by slug.
 * Run: npx tsx db/seed-demo.mts   (reads DATABASE_URL from .env.local)
 */
import fs from "fs";
import postgres from "postgres";

const line = fs.readFileSync(".env.local", "utf8").split("\n").find((l) => l.startsWith("DATABASE_URL="))!;
const sql = postgres(line.slice(13).trim().replace(/^["']|["']$/g, ""), { prepare: false, max: 1 });

const EMAIL = "skillhive.tester01@yopmail.com";
const [owner] = await sql`select p.id from profiles p join auth.users u on u.id = p.id where u.email = ${EMAIL}`;
if (!owner) throw new Error("Test trainer profile not found; sign up first.");

const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

const COURSES = [
  { slug: "demo-leading-without-authority", title: "Leading Without Authority", fmt: "Live Virtual", price: 149, hrs: 6, ceu: true, ce: 6, body: "Influence, negotiation and stakeholder alignment for people who lead through trust rather than title.", dates: [[12, 13]], states: [] as string[] },
  { slug: "demo-data-analysis-with-python", title: "Data Analysis with Python", fmt: "Live Virtual", price: 299, hrs: 16, ceu: false, ce: null, body: "Clean, explore and visualise real datasets with pandas. Four hands-on evening sessions.", dates: [[20, 23]], states: [] },
  { slug: "demo-workplace-ethics-essentials", title: "Workplace Ethics Essentials", fmt: "On-Demand", price: 0, hrs: 2, ceu: true, ce: 2, body: "A free self-paced primer on ethical decision making, conflicts of interest and reporting concerns.", dates: [], states: [] },
  { slug: "demo-conflict-resolution-workshop", title: "Conflict Resolution Workshop", fmt: "In-Person", price: 220, hrs: 8, ceu: true, ce: 8, body: "A full-day, practice-heavy workshop on de-escalation and difficult conversations.", dates: [[18, null]], states: ["CA", "NY"] },
  { slug: "demo-content-marketing-bootcamp", title: "Content Marketing Bootcamp", fmt: "Hybrid", price: 380, hrs: 12, ceu: false, ce: null, body: "Plan, write and measure a content engine. Two in-person days plus follow-up online clinics.", dates: [[34, 35]], states: ["TX"] },
  { slug: "demo-product-design-sprints", title: "Product Design Sprints", fmt: "Live Virtual", price: 199, hrs: 5, ceu: false, ce: null, body: "Run a five-day design sprint in a single afternoon: framing, sketching, prototyping and testing.", dates: [[27, null]], states: [] },
  { slug: "demo-mindful-leadership-retreat", title: "Mindful Leadership Retreat", fmt: "In-Person", price: 540, hrs: 20, ceu: true, ce: 12, body: "A weekend retreat on resilience, wellbeing and sustainable leadership habits.", dates: [[45, 47]], states: ["CO"] },
  { slug: "demo-spreadsheet-modeling-masterclass", title: "Spreadsheet Modeling Masterclass", fmt: "On-Demand", price: 79, hrs: 5, ceu: false, ce: null, body: "Build robust financial models with named ranges, scenarios and error checks. Lifetime access.", dates: [], states: [] },
];

for (const c of COURSES) {
  const [row] = await sql`
    insert into listings (trainer_id, slug, status, active, title, description, presenter_names, credentials, format,
      is_online, on_demand, duration_hours, price, registration_url, has_ceu, ce_count, accrediting_body)
    values (${owner.id}, ${c.slug}, 'approved', true, ${c.title}, ${c.body}, 'Skillhive Tester', 'Demo trainer', ${c.fmt},
      ${c.fmt !== "In-Person"}, ${c.fmt === "On-Demand"}, ${c.hrs}, ${c.price}, 'https://example.com/register', ${c.ceu}, ${c.ce}, ${c.ceu ? "Demo Accreditation Board" : null})
    on conflict (slug) do update set title = excluded.title, status = 'approved', active = true
    returning id`;
  await sql`delete from listing_dates where listing_id = ${row.id}`;
  for (const [s, e] of c.dates) {
    await sql`insert into listing_dates (listing_id, start_date, end_date) values (${row.id}, ${day(s as number)}, ${e ? day(e as number) : null})`;
  }
  await sql`delete from listing_states where listing_id = ${row.id}`;
  for (const st of c.states) await sql`insert into listing_states (listing_id, state_code) values (${row.id}, ${st})`;
  console.log("seeded", c.slug);
}
await sql.end();
