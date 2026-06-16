import { redirect } from "next/navigation";
import { defaultLocationId } from "@/lib/tenant";

export default async function HomePage() {
  const locationId = await defaultLocationId();
  if (locationId) redirect(`/location/${locationId}`);
  redirect("/agency");
}
