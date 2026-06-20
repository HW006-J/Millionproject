import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.campaign.upsert({
    where: { slug: "one-million" },
    update: {},
    create: {
      name: "ONE MILLION",
      slug: "one-million",
      currency: "usd",
      targetAmountCents: 100_000_000,
      confirmedAmountCents: 0,
      confirmedContributionCount: 0,
      isActive: true,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
