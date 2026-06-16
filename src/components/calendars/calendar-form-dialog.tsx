"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";
import { createCalendar } from "@/server/actions/appointment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create calendar"}
    </Button>
  );
}

export function CalendarFormDialog({ locationId }: { locationId: string }) {
  const [open, setOpen] = useState(false);

  async function formAction(formData: FormData) {
    const res = await createCalendar(locationId, undefined, formData);
    if (res?.ok) {
      toast.success("Calendar created");
      setOpen(false);
    } else if (res?.error) {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarPlus className="size-4" /> New Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New calendar</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Discovery Calls" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (min)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="5"
                step="5"
                defaultValue={30}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" name="color" type="color" defaultValue="#6366f1" />
            </div>
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
