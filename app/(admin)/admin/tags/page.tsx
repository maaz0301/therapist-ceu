import { TagManager } from "@/components/admin/tag-manager";
import { Badge } from "@/components/ui/badge";
import { getAdminTags } from "@/lib/queries/admin";

export const metadata = { title: "Tags" };
export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const { groups, suggestedCount } = await getAdminTags();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Topic tags
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the taxonomy and approve trainer-suggested tags.
          </p>
        </div>
        {suggestedCount > 0 ? (
          <Badge className="bg-clay/15 text-clay-deep">
            {suggestedCount} awaiting approval
          </Badge>
        ) : null}
      </div>

      <TagManager groups={groups} />
    </div>
  );
}
