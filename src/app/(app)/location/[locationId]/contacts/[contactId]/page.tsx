import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Mail, Phone, Building, Tag } from "lucide-react";
import { requireLocation } from "@/lib/tenant";
import { getContact } from "@/server/contacts";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { DeleteContactButton } from "@/components/contacts/delete-contact-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fullName, initials, formatCurrency } from "@/lib/utils";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ locationId: string; contactId: string }>;
}) {
  const { locationId, contactId } = await params;
  await requireLocation(locationId);
  const contact = await getContact(locationId, contactId);
  if (!contact) notFound();

  const name = fullName(contact.firstName, contact.lastName);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/location/${locationId}/contacts`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <Avatar className="size-11">
            <AvatarFallback className="bg-emerald-500 text-white">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold">{name}</h1>
            <p className="text-muted-foreground text-sm">
              {contact.companyName ?? "No company"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ContactFormDialog
            locationId={locationId}
            contact={{
              id: contact.id,
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              phone: contact.phone,
              companyName: contact.companyName,
              source: contact.source,
              tags: contact.tags,
              notes: contact.notes,
            }}
            trigger={<Button variant="outline" size="sm">Edit</Button>}
          />
          <DeleteContactButton locationId={locationId} contactId={contact.id} />
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[320px_1fr]">
        {/* Left: details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground size-4" />
                {contact.email ?? "—"}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="text-muted-foreground size-4" />
                {contact.phone ?? "—"}
              </div>
              <div className="flex items-center gap-2">
                <Building className="text-muted-foreground size-4" />
                {contact.companyName ?? "—"}
              </div>
              <div className="flex items-center gap-2">
                <Tag className="text-muted-foreground size-4" />
                {contact.source ?? "—"}
              </div>
              {contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {contact.tags.map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {contact.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm whitespace-pre-wrap">
                {contact.notes}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: related activity */}
        <Tabs defaultValue="opportunities">
          <TabsList>
            <TabsTrigger value="opportunities">
              Opportunities ({contact.opportunities.length})
            </TabsTrigger>
            <TabsTrigger value="conversations">
              Conversations ({contact.conversations.length})
            </TabsTrigger>
            <TabsTrigger value="appointments">
              Appointments ({contact.appointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="mt-4 space-y-2">
            {contact.opportunities.length === 0 && (
              <p className="text-muted-foreground text-sm">No opportunities.</p>
            )}
            {contact.opportunities.map((o) => (
              <Card key={o.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{o.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {o.pipeline.name} · {o.stage.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(Number(o.monetaryValue))}</p>
                    <Badge variant="outline" className="text-xs">{o.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="conversations" className="mt-4 space-y-2">
            {contact.conversations.length === 0 && (
              <p className="text-muted-foreground text-sm">No conversations.</p>
            )}
            {contact.conversations.map((c) => (
              <Link key={c.id} href={`/location/${locationId}/conversations/${c.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <Badge variant="outline" className="text-xs">{c.channel}</Badge>
                      <p className="text-muted-foreground mt-1 truncate text-sm">
                        {c.messages[0]?.body ?? "No messages"}
                      </p>
                    </div>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {format(c.lastMessageAt, "MMM d")}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="appointments" className="mt-4 space-y-2">
            {contact.appointments.length === 0 && (
              <p className="text-muted-foreground text-sm">No appointments.</p>
            )}
            {contact.appointments.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-muted-foreground text-xs">{a.calendar.name}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{format(a.startTime, "MMM d, h:mm a")}</p>
                    <Badge variant="outline" className="text-xs">{a.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
