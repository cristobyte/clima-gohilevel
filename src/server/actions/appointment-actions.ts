"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireLocation } from "@/lib/tenant";
import { enrollContactTriggers } from "@/server/workflow-engine";

export type ApptFormState = { error?: string; ok?: boolean } | undefined;

const apptSchema = z.object({
  calendarId: z.string().min(1, "Calendar is required"),
  contactId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"), // YYYY-MM-DD
  time: z.string().min(1, "Time is required"), // HH:mm
  durationMinutes: z.coerce.number().int().positive().default(30),
});

export async function createAppointment(
  locationId: string,
  _prev: ApptFormState,
  formData: FormData,
): Promise<ApptFormState> {
  await requireLocation(locationId);

  const parsed = apptSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  const start = new Date(`${d.date}T${d.time}:00`);
  if (Number.isNaN(start.getTime())) return { error: "Invalid date/time" };
  const end = new Date(start.getTime() + d.durationMinutes * 60_000);

  const contactId = d.contactId && d.contactId !== "__none__" ? d.contactId : null;

  const appt = await db.appointment.create({
    data: {
      locationId,
      calendarId: d.calendarId,
      contactId,
      title: d.title,
      startTime: start,
      endTime: end,
      status: "BOOKED",
    },
  });

  if (appt.contactId) {
    await enrollContactTriggers(locationId, appt.contactId, "APPOINTMENT_BOOKED");
  }

  revalidatePath(`/location/${locationId}/calendars`);
  return { ok: true };
}

type ApptStatus = "BOOKED" | "CONFIRMED" | "SHOWED" | "NO_SHOW" | "CANCELLED";

export async function setAppointmentStatus(
  locationId: string,
  appointmentId: string,
  status: ApptStatus,
) {
  await requireLocation(locationId);
  await db.appointment.updateMany({
    where: { id: appointmentId, locationId },
    data: { status },
  });
  revalidatePath(`/location/${locationId}/calendars`);
}

export async function deleteAppointment(
  locationId: string,
  appointmentId: string,
) {
  await requireLocation(locationId);
  await db.appointment.deleteMany({ where: { id: appointmentId, locationId } });
  revalidatePath(`/location/${locationId}/calendars`);
}

const calendarSchema = z.object({
  name: z.string().min(1, "Name is required"),
  durationMinutes: z.coerce.number().int().positive().default(30),
  color: z.string().optional(),
});

export async function createCalendar(
  locationId: string,
  _prev: ApptFormState,
  formData: FormData,
): Promise<ApptFormState> {
  await requireLocation(locationId);
  const parsed = calendarSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const slug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  await db.calendar.create({
    data: {
      locationId,
      name: d.name,
      slug: slug || "calendar",
      durationMinutes: d.durationMinutes,
      color: d.color || "#6366f1",
    },
  });

  revalidatePath(`/location/${locationId}/calendars`);
  return { ok: true };
}
