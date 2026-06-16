"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  createContact,
  updateContact,
} from "@/server/actions/contact-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type ContactInitial = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  source: string | null;
  tags: string[];
  notes: string | null;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function ContactFormDialog({
  locationId,
  contact,
  trigger,
}: {
  locationId: string;
  contact?: ContactInitial;
  trigger?: React.ReactNode;
}) {
  const isEdit = !!contact;
  const action = isEdit
    ? updateContact.bind(null, locationId, contact!.id)
    : createContact.bind(null, locationId);

  const [open, setOpen] = useState(false);

  async function formAction(formData: FormData) {
    const res = await action(undefined, formData);
    if (res?.ok) {
      toast.success(isEdit ? "Contact updated" : "Contact created");
      setOpen(false);
    } else if (res?.error) {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" /> New Contact
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit contact" : "New contact"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this contact's details."
              : "Add a new contact to this sub-account."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" defaultValue={contact?.firstName} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" defaultValue={contact?.lastName ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={contact?.phone ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company</Label>
              <Input id="companyName" name="companyName" defaultValue={contact?.companyName ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" defaultValue={contact?.source ?? ""} placeholder="Manual" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              name="tags"
              defaultValue={contact?.tags.join(", ") ?? ""}
              placeholder="lead, vip (comma-separated)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={contact?.notes ?? ""} rows={3} />
          </div>
          <DialogFooter>
            <SubmitButton label={isEdit ? "Save changes" : "Create contact"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
