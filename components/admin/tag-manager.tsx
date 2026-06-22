"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";

import {
  approveTag,
  createTag,
  deleteTag,
  updateTag,
  type ActionResult,
} from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TAG_CATEGORIES } from "@/lib/constants";
import type { AdminTag, AdminTagGroup } from "@/lib/queries/admin";

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function TagManager({ groups }: { groups: AdminTagGroup[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(TAG_CATEGORIES[0].id);

  const [editTag, setEditTag] = useState<AdminTag | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<string>(
    TAG_CATEGORIES[0].id,
  );

  function run(fn: () => Promise<ActionResult>, successMsg: string) {
    startTransition(async () => {
      const result = await fn();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(successMsg);
      router.refresh();
    });
  }

  function openEdit(tag: AdminTag) {
    setEditTag(tag);
    setEditName(tag.name);
    setEditCategory(tag.category);
  }

  return (
    <div className="space-y-6">
      {/* Add tag */}
      <Card className="space-y-3 p-5">
        <h2 className="font-heading text-base font-semibold">Add a tag</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="new-tag">Name</Label>
            <Input
              id="new-tag"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Grief Counseling"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:w-56">
            <Label htmlFor="new-cat">Category</Label>
            <select
              id="new-cat"
              value={newCategory}
              onChange={(e) =>
                setNewCategory(e.target.value as typeof newCategory)
              }
              className={selectClass}
            >
              {TAG_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="coral"
            disabled={isPending || newName.trim().length < 2}
            onClick={() =>
              run(async () => {
                const result = await createTag(newName, newCategory);
                if (!("error" in result)) setNewName("");
                return result;
              }, "Tag added")
            }
          >
            <Plus data-icon="inline-start" />
            Add
          </Button>
        </div>
      </Card>

      {/* Grouped tags */}
      {groups.map((group) => (
        <Card key={group.category} className="p-5">
          <h2 className="font-heading text-base font-semibold">
            {group.label}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {group.tags.length}
            </span>
          </h2>
          {group.tags.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No tags yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {group.tags.map((tag) => (
                <li
                  key={tag.id}
                  className="flex flex-wrap items-center gap-3 py-2.5"
                >
                  <span className="font-medium text-foreground">
                    {tag.name}
                  </span>
                  {tag.status === "suggested" ? (
                    <Badge className="bg-amber-100 text-amber-700">
                      Suggested
                      {tag.suggestedByName ? ` · ${tag.suggestedByName}` : ""}
                    </Badge>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {tag.usageCount} use{tag.usageCount === 1 ? "" : "s"}
                  </span>

                  <div className="ml-auto flex items-center gap-1.5">
                    {tag.status === "suggested" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          run(() => approveTag(tag.id), "Tag approved")
                        }
                      >
                        <Check data-icon="inline-start" />
                        Approve
                      </Button>
                    ) : null}
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Edit tag"
                      disabled={isPending}
                      onClick={() => openEdit(tag)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive"
                      aria-label="Delete tag"
                      disabled={isPending}
                      onClick={() =>
                        run(() => deleteTag(tag.id), "Tag deleted")
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}

      {/* Edit dialog */}
      <Dialog
        open={editTag !== null}
        onOpenChange={(open) => !open && setEditTag(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit tag</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-cat">Category</Label>
              <select
                id="edit-cat"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className={selectClass}
              >
                {TAG_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTag(null)}>
              Cancel
            </Button>
            <Button
              disabled={isPending || editName.trim().length < 2}
              onClick={() => {
                if (!editTag) return;
                run(async () => {
                  const result = await updateTag(
                    editTag.id,
                    editName,
                    editCategory,
                  );
                  if (!("error" in result)) setEditTag(null);
                  return result;
                }, "Tag updated");
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
