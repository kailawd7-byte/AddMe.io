import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const PRESERVED_EMAILS = [
  "admin@addme.io",
  "kmwmatthieu@gmail.com",
  "kailawd7@gmail.com",
];

async function cleanTestData() {
  console.log("Démarrage du nettoyage des données de test...");

  // 1. Trouver les utilisateurs de test à supprimer
  const testUsers = await prisma.user.findMany({
    where: {
      email: {
        notIn: PRESERVED_EMAILS,
      },
    },
    select: { id: true, email: true },
  });

  const testUserIds = testUsers.map((u) => u.id);
  console.log(`Nombre d'utilisateurs de test identifiés : ${testUserIds.length}`);

  if (testUserIds.length > 0) {
    // 2. Nettoyage des tables dépendantes
    console.log("Suppression des rapports liés aux comptes tests...");
    await prisma.report.deleteMany({
      where: {
        OR: [
          { reporterUserId: { in: testUserIds } },
          { reportedUserId: { in: testUserIds } },
        ],
      },
    });

    console.log("Suppression des taskCompletions liées aux comptes tests...");
    await prisma.taskCompletion.deleteMany({
      where: {
        workerUserId: { in: testUserIds },
      },
    });

    console.log("Suppression des tâches orphelines de campagnes tests...");
    const testCampaigns = await prisma.campaign.findMany({
      where: { userId: { in: testUserIds } },
      select: { id: true },
    });
    const testCampaignIds = testCampaigns.map((c) => c.id);

    if (testCampaignIds.length > 0) {
      await prisma.taskCompletion.deleteMany({
        where: {
          task: { campaignId: { in: testCampaignIds } },
        },
      });
      await prisma.task.deleteMany({
        where: { campaignId: { in: testCampaignIds } },
      });
      await prisma.campaign.deleteMany({
        where: { id: { in: testCampaignIds } },
      });
    }

    console.log("Suppression des écritures de grand livre (Ledger) des comptes tests...");
    await prisma.ledgerEntry.deleteMany({
      where: { userId: { in: testUserIds } },
    });

    console.log("Suppression des logs d'audit liés aux comptes tests...");
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { actorId: { in: testUserIds } },
          { targetId: { in: testUserIds } },
        ],
      },
    });

    console.log("Suppression des paiements liés aux comptes tests...");
    await prisma.payment.deleteMany({
      where: { userId: { in: testUserIds } },
    });

    console.log("Suppression des comptes sociaux liés aux comptes tests...");
    await prisma.socialAccount.deleteMany({
      where: { userId: { in: testUserIds } },
    });

    console.log("Suppression définitive des utilisateurs de test...");
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: testUserIds } },
    });
    console.log(`✓ ${deletedUsers.count} utilisateurs de test supprimés avec succès.`);
  }

  // 3. Afficher les statistiques finales
  const [totalUsers, activeCampaigns, pendingReports, totalLedger] = await Promise.all([
    prisma.user.count(),
    prisma.campaign.count(),
    prisma.report.count(),
    prisma.ledgerEntry.count(),
  ]);

  const remainingUsers = await prisma.user.findMany({
    select: { email: true, role: true },
  });

  console.log("\n--- STATISTIQUES FINALES DE LA BASE DE DONNÉES ---");
  console.log(`Membres totaux : ${totalUsers}`);
  console.log(`Campagnes totales : ${activeCampaigns}`);
  console.log(`Litiges/Rapports en attente : ${pendingReports}`);
  console.log(`Écritures Ledger : ${totalLedger}`);
  console.log("Comptes conservés :", remainingUsers);
}

cleanTestData()
  .catch((err) => {
    console.error("Erreur nettoyage :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
