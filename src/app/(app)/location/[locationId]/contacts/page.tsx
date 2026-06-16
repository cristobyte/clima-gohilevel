import Link from "next/link";
import { format } from "date-fns";
import { requireLocation } from "@/lib/tenant";
import { listContacts, getContactTags } from "@/server/contacts";
import { ModuleHeader } from "@/components/layout/module-header";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { ContactsToolbar } from "@/components/contacts/contacts-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fullName, initials } from "@/lib/utils";

export default async function ContactsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locationId: string }>;
  searchParams: Promise<{ search?: string; tag?: string; page?: string }>;
}) {
  const { locationId } = await params;
  await requireLocation(locationId);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const [{ contacts, total, pageCount }, tags] = await Promise.all([
    listContacts({ locationId, search: sp.search, tag: sp.tag, page }),
    getContactTags(locationId),
  ]);

  const mkPageHref = (p: number) => {
    const next = new URLSearchParams();
    if (sp.search) next.set("search", sp.search);
    if (sp.tag) next.set("tag", sp.tag);
    next.set("page", String(p));
    return `?${next.toString()}`;
  };

  return (
    <div>
      <ModuleHeader
        title="Contacts"
        description={`${total} contact${total === 1 ? "" : "s"} in this sub-account`}
        actions={<ContactFormDialog locationId={locationId} />}
      />
      <div className="space-y-4 p-6">
        <ContactsToolbar tags={tags} />

        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                    No contacts found.
                  </TableCell>
                </TableRow>
              )}
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/location/${locationId}/contacts/${c.id}`}
                      className="flex items-center gap-3 font-medium hover:underline"
                    >
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-muted text-xs">
                          {initials(fullName(c.firstName, c.lastName))}
                        </AvatarFallback>
                      </Avatar>
                      {fullName(c.firstName, c.lastName)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.source ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(c.createdAt, "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {pageCount > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Page {page} of {pageCount}
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={mkPageHref(page - 1)}>Previous</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
              )}
              {page < pageCount ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={mkPageHref(page + 1)}>Next</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
