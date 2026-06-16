"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteContact } from "@/server/actions/contact-actions";

export function DeleteContactButton({
  locationId,
  contactId,
}: {
  locationId: string;
  contactId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onDelete() {
    if (!confirm("Delete this contact? This cannot be undone.")) return;
    start(async () => {
      await deleteContact(locationId, contactId);
      toast.success("Contact deleted");
      router.push(`/location/${locationId}/contacts`);
    });
  }

  return (
    <Button variant="destructive" size="sm" onClick={onDelete} disabled={pending}>
      <Trash2 className="size-4" /> {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
