const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

async function main() {
  console.log("Démarrage du seeding...");

  // 1. Initialisation des paramètres système
  const defaultSettings = [
    { key: "welcome_bonus", value: "50.0", description: "Points offerts à l'inscription" },
    { key: "cost_like", value: "1.3", description: "Coût d'un like prélevé au créateur" },
    { key: "reward_like", value: "1.0", description: "Récompense d'un like créditée au travailleur" },
    { key: "cost_comment", value: "1.8", description: "Coût d'un commentaire prélevé au créateur" },
    { key: "reward_comment", value: "1.4", description: "Récompense d'un commentaire créditée au travailleur" },
    { key: "cost_subscribe", value: "2.5", description: "Coût d'un abonnement prélevé au créateur" },
    { key: "reward_subscribe", value: "2.0", description: "Récompense d'un abonnement créditée au travailleur" },
    { key: "retention_hours", value: "24", description: "Durée du séquestre avant déblocage des points" },
    { key: "audit_sample_rate", value: "0.1", description: "Pourcentage de contrôles avec capture (10%)" },
    { key: "base_daily_task_limit", value: "20", description: "Plafond quotidien initial de tâches par utilisateur" },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }
  console.log("Paramètres système configurés.");

  // 2. Création du compte administrateur initial
  const adminEmail = "admin@addme.io";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await hashPassword("AdminPassword123!");
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        isEmailVerified: true,
        reputationScore: 100.0,
      },
    });

    // Crédit de 500 points au compte admin via le Ledger
    await prisma.ledgerEntry.create({
      data: {
        userId: adminUser.id,
        amount: 500.0,
        type: "ADMIN_ADJUSTMENT",
        referenceType: "SYSTEM",
        referenceId: adminUser.id,
        idempotencyKey: `initial-admin-seed-${adminUser.id}`,
        description: "Solde initial du compte administrateur (+500 points)",
      },
    });

    console.log(`Compte admin créé : ${adminEmail} (Mot de passe: AdminPassword123!)`);
  } else {
    console.log(`Compte admin déjà existant : ${adminEmail}`);
  }

  console.log("Seeding terminé avec succès.");
}

main()
  .catch((e) => {
    console.error("Erreur de seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
