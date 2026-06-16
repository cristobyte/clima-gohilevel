import { NextResponse } from "next/server";
import { processDueEnrollments } from "@/server/workflow-engine";

// Protected workflow-engine tick. Invoke with:
//   Authorization: Bearer $CRON_SECRET
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await processDueEnrollments();
  return NextResponse.json({ ok: true, ...result });
}

export const GET = POST;
