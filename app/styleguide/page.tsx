"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Logo } from "@/components/logo";
import { FormatBadge } from "@/components/format-badge";
import { CeuBadge } from "@/components/ceu-badge";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/empty-state";
import { SAMPLE_LISTINGS } from "@/lib/sample-listings";
import { LISTING_FORMATS } from "@/lib/constants";
import { Inbox } from "lucide-react";

const SWATCHES = [
  { name: "background", className: "bg-background border border-border" },
  { name: "foreground", className: "bg-foreground" },
  { name: "primary", className: "bg-primary" },
  { name: "secondary", className: "bg-secondary" },
  { name: "clay", className: "bg-clay" },
  { name: "muted", className: "bg-muted" },
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "destructive", className: "bg-destructive" },
  { name: "border", className: "bg-border" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <Separator />
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-12 sm:px-6">
      <header className="flex items-center justify-between">
        <div>
          <Logo />
          <h1 className="mt-3 text-2xl font-bold text-foreground">
            Design system
          </h1>
          <p className="text-sm text-muted-foreground">
            TherapyDen-inspired tokens and components for TherapistCEU.com.
          </p>
        </div>
      </header>

      <Section title="Colors">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SWATCHES.map((s) => (
            <div key={s.name} className="space-y-1.5">
              <div className={`h-16 w-full rounded-lg ${s.className}`} />
              <p className="text-xs text-muted-foreground">{s.name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Heading 1 · Plus Jakarta Sans</h1>
          <h2 className="text-3xl font-bold">Heading 2</h2>
          <h3 className="text-2xl font-semibold">Heading 3</h3>
          <p className="text-base text-foreground">
            Body text uses Inter — clean, readable, and friendly.
          </p>
          <p className="text-sm text-muted-foreground">
            Muted small text for secondary information.
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="clay">Clay CTA</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="xs">XS</Button>
          <Button size="sm">SM</Button>
          <Button size="default">Default</Button>
          <Button size="lg">LG</Button>
          <Button size="xl" variant="clay">
            XL CTA
          </Button>
          <Button onClick={() => toast.success("Saved!")}>Trigger toast</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <CeuBadge ceCount="6" />
          {LISTING_FORMATS.map((f) => (
            <FormatBadge key={f} format={f} />
          ))}
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Training title</Label>
            <Input id="title" placeholder="e.g. EMDR Intensive" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Select defaultValue="Live Virtual">
              <SelectTrigger id="format" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LISTING_FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" placeholder="Describe the training…" rows={3} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="ceu" defaultChecked />
            <Label htmlFor="ceu">Offers CEU credit</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="ondemand" />
            <Label htmlFor="ondemand">Available on demand</Label>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>CEU accreditation</Label>
            <RadioGroup defaultValue="either" className="flex gap-6">
              {["either", "yes", "no"].map((v) => (
                <label key={v} className="flex items-center gap-2 text-sm capitalize">
                  <RadioGroupItem value={v} />
                  {v}
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4 text-sm text-muted-foreground">
            Overview tab content.
          </TabsContent>
          <TabsContent value="analytics" className="pt-4 text-sm text-muted-foreground">
            Analytics tab content.
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Cards & states">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ListingCard listing={SAMPLE_LISTINGS[0]} />
          <Card className="space-y-3 p-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-9 w-full" />
          </Card>
          <EmptyState
            icon={Inbox}
            title="Nothing here yet"
            description="Empty states keep the product feeling intentional."
          />
        </div>
      </Section>
    </div>
  );
}
