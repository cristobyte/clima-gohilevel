import { PrismaClient, Prisma } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
faker.seed(20260616);

const DEMO_PASSWORD = "password123";

const CHANNELS = ["SMS", "EMAIL", "WEBCHAT", "FB", "IG"] as const;
const CONTACT_SOURCES = [
  "Facebook Ad",
  "Google Ad",
  "Website Form",
  "Referral",
  "Walk-in",
  "Manual",
];
const TAG_POOL = [
  "lead",
  "customer",
  "hot",
  "cold",
  "vip",
  "newsletter",
  "follow-up",
];

function pick<T>(arr: readonly T[]): T {
  return faker.helpers.arrayElement(arr as T[]);
}

async function main() {
  console.log("Seeding database…");

  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);

  // --- Agency -------------------------------------------------------------
  const agency = await db.agency.upsert({
    where: { slug: "clima-marketing" },
    update: { name: "Clima Marketing" },
    create: { name: "Clima Marketing", slug: "clima-marketing" },
  });

  // --- Users --------------------------------------------------------------
  const admin = await db.user.upsert({
    where: { email: "demo@clima.test" },
    update: { hashedPassword: hashed, name: "Demo Admin" },
    create: {
      email: "demo@clima.test",
      name: "Demo Admin",
      hashedPassword: hashed,
    },
  });

  const staff = await db.user.upsert({
    where: { email: "staff@clima.test" },
    update: { hashedPassword: hashed, name: "Sam Staffer" },
    create: {
      email: "staff@clima.test",
      name: "Sam Staffer",
      hashedPassword: hashed,
    },
  });

  // Agency-wide admin membership (access to all locations).
  // Compound uniques with a null column can't be used in upsert `where`, so
  // we find-then-create instead.
  const existingAgencyMembership = await db.membership.findFirst({
    where: { userId: admin.id, agencyId: agency.id, locationId: null },
  });
  if (!existingAgencyMembership) {
    await db.membership.create({
      data: { userId: admin.id, agencyId: agency.id, role: "AGENCY_ADMIN" },
    });
  }

  // --- Locations ----------------------------------------------------------
  const locationSpecs = [
    { slug: "climatecnologia", name: "ClimaTecnologia", phone: "+1 305 555 0142" },
    { slug: "apex-fitness", name: "Apex Fitness", phone: "+1 305 555 0199" },
  ];

  const locations = [];
  for (const spec of locationSpecs) {
    const location = await db.location.upsert({
      where: { agencyId_slug: { agencyId: agency.id, slug: spec.slug } },
      update: { name: spec.name, phone: spec.phone },
      create: {
        agencyId: agency.id,
        slug: spec.slug,
        name: spec.name,
        phone: spec.phone,
        timezone: "America/New_York",
      },
    });
    locations.push(location);
  }

  // Staff gets a location-level admin membership at the first location.
  await db.membership.upsert({
    where: {
      userId_agencyId_locationId: {
        userId: staff.id,
        agencyId: agency.id,
        locationId: locations[0].id,
      },
    },
    update: { role: "LOCATION_ADMIN" },
    create: {
      userId: staff.id,
      agencyId: agency.id,
      locationId: locations[0].id,
      role: "LOCATION_ADMIN",
    },
  });

  const staffUsers = [admin.id, staff.id];

  // --- Per-location data (wiped + recreated for idempotency) --------------
  for (const location of locations) {
    // Clear existing module data for a clean reseed.
    await db.opportunity.deleteMany({ where: { locationId: location.id } });
    await db.pipeline.deleteMany({ where: { locationId: location.id } });
    await db.message.deleteMany({
      where: { conversation: { locationId: location.id } },
    });
    await db.conversation.deleteMany({ where: { locationId: location.id } });
    await db.appointment.deleteMany({ where: { locationId: location.id } });
    await db.calendar.deleteMany({ where: { locationId: location.id } });
    await db.workflowEnrollment.deleteMany({
      where: { workflow: { locationId: location.id } },
    });
    await db.workflowStep.deleteMany({
      where: { workflow: { locationId: location.id } },
    });
    await db.workflow.deleteMany({ where: { locationId: location.id } });
    await db.contact.deleteMany({ where: { locationId: location.id } });

    // Contacts
    const contacts = [];
    const contactCount = 16;
    for (let i = 0; i < contactCount; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const contact = await db.contact.create({
        data: {
          locationId: location.id,
          firstName,
          lastName,
          email: faker.internet
            .email({ firstName, lastName })
            .toLowerCase(),
          phone: faker.phone.number({ style: "national" }),
          companyName: faker.datatype.boolean()
            ? faker.company.name()
            : null,
          source: pick(CONTACT_SOURCES),
          tags: faker.helpers.arrayElements(TAG_POOL, { min: 0, max: 3 }),
          dnd: faker.datatype.boolean({ probability: 0.1 }),
          createdAt: faker.date.recent({ days: 60 }),
        },
      });
      contacts.push(contact);
    }

    // Pipelines + stages
    const pipelineSpecs = [
      {
        name: "Sales Pipeline",
        stages: [
          { name: "New Lead", color: "#6366f1" },
          { name: "Contacted", color: "#0ea5e9" },
          { name: "Qualified", color: "#f59e0b" },
          { name: "Proposal Sent", color: "#a855f7" },
          { name: "Won", color: "#10b981" },
        ],
      },
      {
        name: "Onboarding",
        stages: [
          { name: "Welcome", color: "#6366f1" },
          { name: "Setup", color: "#f59e0b" },
          { name: "Training", color: "#0ea5e9" },
          { name: "Active", color: "#10b981" },
        ],
      },
    ];

    for (const [pIndex, pSpec] of pipelineSpecs.entries()) {
      const pipeline = await db.pipeline.create({
        data: {
          locationId: location.id,
          name: pSpec.name,
          order: pIndex,
          stages: {
            create: pSpec.stages.map((s, i) => ({
              name: s.name,
              color: s.color,
              order: i,
            })),
          },
        },
        include: { stages: { orderBy: { order: "asc" } } },
      });

      // Opportunities — only on the primary (Sales) pipeline for a lively board.
      if (pIndex === 0) {
        for (const stage of pipeline.stages) {
          const count = faker.number.int({ min: 1, max: 4 });
          for (let i = 0; i < count; i++) {
            const contact = pick(contacts);
            const won = stage.name === "Won";
            await db.opportunity.create({
              data: {
                locationId: location.id,
                pipelineId: pipeline.id,
                stageId: stage.id,
                contactId: contact.id,
                name: `${contact.firstName}'s ${faker.commerce.productName()}`,
                monetaryValue: new Prisma.Decimal(
                  faker.number.int({ min: 500, max: 15000 }),
                ),
                status: won ? "WON" : "OPEN",
                assignedUserId: pick(staffUsers),
                position: i * 1000 + 1000,
                createdAt: faker.date.recent({ days: 45 }),
              },
            });
          }
        }
      }
    }

    // Conversations + messages
    const convCount = 7;
    for (let i = 0; i < convCount; i++) {
      const contact = pick(contacts);
      const channel = pick(CHANNELS);
      const msgCount = faker.number.int({ min: 3, max: 8 });
      const baseTime = faker.date.recent({ days: 10 });

      const messages: Prisma.MessageCreateWithoutConversationInput[] = [];
      let cursor = baseTime.getTime();
      for (let m = 0; m < msgCount; m++) {
        const inbound = m % 2 === 0;
        cursor += faker.number.int({ min: 2, max: 90 }) * 60_000;
        messages.push({
          direction: inbound ? "INBOUND" : "OUTBOUND",
          channel,
          body: faker.lorem.sentence(),
          sender: inbound ? undefined : { connect: { id: pick(staffUsers) } },
          status: "DELIVERED",
          createdAt: new Date(cursor),
        });
      }

      const unread = faker.datatype.boolean({ probability: 0.4 })
        ? faker.number.int({ min: 1, max: 3 })
        : 0;

      await db.conversation.create({
        data: {
          locationId: location.id,
          contactId: contact.id,
          channel,
          status: pick(["OPEN", "OPEN", "CLOSED"] as const),
          lastMessageAt: new Date(cursor),
          unreadCount: unread,
          assignedUserId: faker.datatype.boolean()
            ? pick(staffUsers)
            : null,
          messages: { create: messages },
        },
      });
    }

    // Calendars + appointments
    const calendarSpecs = [
      { name: "Consultations", slug: "consultations", color: "#6366f1", duration: 30 },
      { name: "Follow-ups", slug: "follow-ups", color: "#10b981", duration: 15 },
    ];
    const calendars = [];
    for (const c of calendarSpecs) {
      const cal = await db.calendar.create({
        data: {
          locationId: location.id,
          name: c.name,
          slug: c.slug,
          color: c.color,
          durationMinutes: c.duration,
          ownerUserId: pick(staffUsers),
        },
      });
      calendars.push(cal);
    }

    const apptStatuses = [
      "BOOKED",
      "CONFIRMED",
      "SHOWED",
      "NO_SHOW",
      "CANCELLED",
    ] as const;
    for (let i = 0; i < 12; i++) {
      const cal = pick(calendars);
      const contact = pick(contacts);
      // Spread appointments across past week and next two weeks.
      const offsetDays = faker.number.int({ min: -7, max: 14 });
      const start = new Date();
      start.setDate(start.getDate() + offsetDays);
      start.setHours(faker.number.int({ min: 8, max: 17 }), 0, 0, 0);
      const end = new Date(start.getTime() + cal.durationMinutes * 60_000);
      await db.appointment.create({
        data: {
          locationId: location.id,
          calendarId: cal.id,
          contactId: contact.id,
          title: `${cal.name} — ${contact.firstName} ${contact.lastName ?? ""}`.trim(),
          startTime: start,
          endTime: end,
          status: offsetDays < 0 ? pick(apptStatuses) : pick(["BOOKED", "CONFIRMED"] as const),
          assignedUserId: cal.ownerUserId,
        },
      });
    }

    // Workflows
    const published = await db.workflow.create({
      data: {
        locationId: location.id,
        name: "New Lead Follow-up",
        status: "PUBLISHED",
        triggerType: "CONTACT_CREATED",
        triggerConfig: {},
        steps: {
          create: [
            {
              order: 0,
              actionType: "SEND_SMS",
              config: { body: "Hi {{contact.firstName}}, thanks for reaching out! How can we help?" },
            },
            { order: 1, actionType: "WAIT", config: { minutes: 60 } },
            {
              order: 2,
              actionType: "SEND_EMAIL",
              config: {
                subject: "Great to connect",
                body: "We'd love to schedule a quick call.",
              },
            },
            { order: 3, actionType: "ADD_TAG", config: { tag: "follow-up" } },
          ],
        },
      },
    });

    await db.workflow.create({
      data: {
        locationId: location.id,
        name: "Appointment Reminder",
        status: "DRAFT",
        triggerType: "APPOINTMENT_BOOKED",
        triggerConfig: {},
        steps: {
          create: [
            { order: 0, actionType: "WAIT", config: { minutes: 1440 } },
            {
              order: 1,
              actionType: "SEND_SMS",
              config: { body: "Reminder: your appointment is tomorrow." },
            },
          ],
        },
      },
    });

    // One active enrollment so the engine has work to show.
    await db.workflowEnrollment.create({
      data: {
        workflowId: published.id,
        contactId: contacts[0].id,
        currentOrder: 1,
        status: "ACTIVE",
        nextRunAt: new Date(Date.now() + 30 * 60_000),
      },
    });

    console.log(`  ✓ Seeded ${location.name}`);
  }

  console.log("\nDone. Log in with:");
  console.log(`  Email:    demo@clima.test`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
