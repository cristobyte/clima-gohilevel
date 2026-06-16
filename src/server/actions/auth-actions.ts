"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { db } from "@/lib/db";

export type AuthFormState = { error?: string } | undefined;

export async function authenticate(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error; // re-throw redirect
  }
}

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function register(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // New self-serve users get their own agency + first location.
  const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const agencySlug = `${slugBase || "agency"}-${Math.random().toString(36).slice(2, 7)}`;

  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email: normalizedEmail, hashedPassword },
    });
    const agency = await tx.agency.create({
      data: { name: `${name}'s Agency`, slug: agencySlug },
    });
    const location = await tx.location.create({
      data: { agencyId: agency.id, name: "My First Location", slug: "main" },
    });
    await tx.membership.create({
      data: {
        userId: user.id,
        agencyId: agency.id,
        locationId: location.id,
        role: "AGENCY_ADMIN",
      },
    });
  });

  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Please log in." };
    }
    throw error;
  }
}
