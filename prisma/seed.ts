import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding BelaBlaze database...");

  // Clients
  const clients = await Promise.all([
    db.client.upsert({
      where: { slug: "exito-retail" },
      update: {},
      create: {
        name: "Éxito Retail S.A.S", slug: "exito-retail",
        industry: "Retail", email: "marketing@exito.com.co",
        city: "Medellín", country: "Colombia",
        creditLimit: 50000000, balance: 12500000,
      },
    }),
    db.client.upsert({
      where: { slug: "bavaria" },
      update: {},
      create: {
        name: "Bavaria S.A.", slug: "bavaria",
        industry: "Bebidas", email: "publicidad@bavaria.com.co",
        city: "Bogotá", country: "Colombia",
        creditLimit: 100000000, balance: 45000000,
      },
    }),
    db.client.upsert({
      where: { slug: "nutresa" },
      update: {},
      create: {
        name: "Grupo Nutresa", slug: "nutresa",
        industry: "Alimentos", email: "mkt@nutresa.com",
        city: "Medellín", country: "Colombia",
        creditLimit: 80000000, balance: 30000000,
      },
    }),
    db.client.upsert({
      where: { slug: "bancolombia" },
      update: {},
      create: {
        name: "Bancolombia", slug: "bancolombia",
        industry: "Fintech", email: "ads@bancolombia.com.co",
        city: "Medellín", country: "Colombia",
        creditLimit: 200000000, balance: 87000000,
      },
    }),
    db.client.upsert({
      where: { slug: "tigo" },
      update: {},
      create: {
        name: "Tigo Colombia", slug: "tigo",
        industry: "Telecomunicaciones", email: "brand@tigo.com.co",
        city: "Bogotá", country: "Colombia",
        isActive: false, creditLimit: 60000000, balance: 5000000,
      },
    }),
  ]);
  console.log(`✓ ${clients.length} clients`);

  // Admin user (will be linked to Clerk on first login)
  const adminUser = await db.user.upsert({
    where: { email: "admin@bannerblaze.co" },
    update: {},
    create: {
      email: "admin@bannerblaze.co",
      name: "Alejandro Reyes",
      role: "ADMIN",
      position: "CTO & Co-founder",
    },
  });
  console.log("✓ Admin user");

  // Screens
  const screens = await Promise.all([
    db.screen.upsert({
      where: { code: "MED-001" },
      update: { lastPingAt: new Date() },
      create: {
        name: "El Tesoro — Acceso Principal", code: "MED-001",
        type: "LED_OUTDOOR", status: "ONLINE",
        city: "Medellín", address: "Cra 25A #1A Sur-45, El Poblado",
        latitude: 6.2068, longitude: -75.5728,
        width: 6, height: 4, resolutionWidth: 3840, resolutionHeight: 2160,
        dailyTraffic: 48000, pricePerSecond: 12000, lastPingAt: new Date(),
      },
    }),
    db.screen.upsert({
      where: { code: "MED-002" },
      update: { lastPingAt: new Date() },
      create: {
        name: "Unicentro Medellín — Fachada", code: "MED-002",
        type: "LED_OUTDOOR", status: "ONLINE",
        city: "Medellín", address: "Circular 1 #70-01, Laureles",
        latitude: 6.2484, longitude: -75.5847,
        width: 8, height: 5, resolutionWidth: 5120, resolutionHeight: 2880,
        dailyTraffic: 62000, pricePerSecond: 18000, lastPingAt: new Date(),
      },
    }),
    db.screen.upsert({
      where: { code: "BOG-001" },
      update: { lastPingAt: new Date() },
      create: {
        name: "Andino — Zona Rosa", code: "BOG-001",
        type: "LED_INDOOR", status: "ONLINE",
        city: "Bogotá", address: "Cra 11 #82-01, Zona Rosa",
        latitude: 4.6668, longitude: -74.0519,
        width: 4, height: 3, resolutionWidth: 1920, resolutionHeight: 1080,
        dailyTraffic: 35000, pricePerSecond: 9000, lastPingAt: new Date(),
      },
    }),
    db.screen.upsert({
      where: { code: "MED-003" },
      update: {},
      create: {
        name: "Terminal Norte — Hall Principal", code: "MED-003",
        type: "LCD", status: "MAINTENANCE",
        city: "Medellín", address: "Cra 64C #78-580, Castilla",
        latitude: 6.2876, longitude: -75.5694,
        width: 3, height: 2, resolutionWidth: 1920, resolutionHeight: 1080,
        dailyTraffic: 28000, pricePerSecond: 6000,
        lastPingAt: new Date(Date.now() - 3600000),
      },
    }),
    db.screen.upsert({
      where: { code: "MED-004" },
      update: {},
      create: {
        name: "Gran Plaza Bello — Entrada", code: "MED-004",
        type: "LED_OUTDOOR", status: "OFFLINE",
        city: "Bello", address: "Cra 50 #33-80, Bello",
        latitude: 6.3355, longitude: -75.5563,
        width: 5, height: 3, resolutionWidth: 2560, resolutionHeight: 1440,
        dailyTraffic: 22000, pricePerSecond: 8000,
        lastPingAt: new Date(Date.now() - 86400000),
      },
    }),
    db.screen.upsert({
      where: { code: "BOG-002" },
      update: { lastPingAt: new Date() },
      create: {
        name: "Santafé Bogotá — Atrio", code: "BOG-002",
        type: "LED_INDOOR", status: "ONLINE",
        city: "Bogotá", address: "Cra 43A #7-50, Bogotá",
        latitude: 4.6322, longitude: -74.0641,
        width: 6, height: 3, resolutionWidth: 3840, resolutionHeight: 1920,
        dailyTraffic: 55000, pricePerSecond: 15000, lastPingAt: new Date(),
      },
    }),
    db.screen.upsert({
      where: { code: "MED-005" },
      update: { lastPingAt: new Date() },
      create: {
        name: "Parque Lleras — Fachada", code: "MED-005",
        type: "INTERACTIVE", status: "ONLINE",
        city: "Medellín", address: "Cra 37A #8A-19, El Poblado",
        latitude: 6.2094, longitude: -75.5673,
        width: 3, height: 4, resolutionWidth: 1080, resolutionHeight: 1920,
        dailyTraffic: 18000, pricePerSecond: 10000, orientation: "portrait",
        lastPingAt: new Date(),
      },
    }),
    db.screen.upsert({
      where: { code: "MAN-001" },
      update: { lastPingAt: new Date() },
      create: {
        name: "Viva El Cable — Entrada", code: "MAN-001",
        type: "LED_OUTDOOR", status: "ONLINE",
        city: "Manizales", address: "Cra 23 #74-50, Manizales",
        latitude: 5.0707, longitude: -75.5131,
        width: 4, height: 3, resolutionWidth: 2560, resolutionHeight: 1440,
        dailyTraffic: 14000, pricePerSecond: 7000, lastPingAt: new Date(),
      },
    }),
  ]);
  console.log(`✓ ${screens.length} screens`);

  // Campaigns
  const [exito, bavaria, bancolombia, nutresa] = [clients[0], clients[1], clients[3], clients[2]];

  const campaigns = await Promise.all([
    db.campaign.upsert({
      where: { id: "cmp_1" },
      update: {},
      create: {
        id: "cmp_1",
        name: "Éxito — Temporada Escolar 2025",
        description: "Campaña regreso a clases en pantallas premium del Valle de Aburrá",
        status: "ACTIVE", clientId: exito.id, userId: adminUser.id,
        budget: 25000000, spent: 18500000,
        startDate: new Date("2025-01-15"), endDate: new Date("2025-06-30"),
        targetCities: ["Medellín", "Bello", "Itagüí"],
        impressionsGoal: 2000000, impressions: 1450000, conversions: 3200, engagements: 48000,
      },
    }),
    db.campaign.upsert({
      where: { id: "cmp_2" },
      update: {},
      create: {
        id: "cmp_2",
        name: "Bavaria — Copa América BTL",
        description: "Activación experiencial alrededor de centros comerciales durante el torneo",
        status: "ACTIVE", clientId: bavaria.id, userId: adminUser.id,
        budget: 80000000, spent: 42000000,
        startDate: new Date("2025-03-01"), endDate: new Date("2025-07-31"),
        targetCities: ["Bogotá", "Medellín", "Cali"],
        impressionsGoal: 5000000, impressions: 2800000, conversions: 7800, engagements: 125000,
      },
    }),
    db.campaign.upsert({
      where: { id: "cmp_3" },
      update: {},
      create: {
        id: "cmp_3",
        name: "Bancolombia — YoSoyDigital",
        description: "Campaña de adopción digital en zonas de alta concentración juvenil",
        status: "PENDING_APPROVAL", clientId: bancolombia.id, userId: adminUser.id,
        budget: 120000000, spent: 0,
        startDate: new Date("2025-06-01"), endDate: new Date("2025-12-31"),
        targetCities: ["Medellín", "Bogotá", "Barranquilla", "Cartagena"],
        impressionsGoal: 10000000,
      },
    }),
    db.campaign.upsert({
      where: { id: "cmp_4" },
      update: {},
      create: {
        id: "cmp_4",
        name: "Nutresa — Navidad en Familia",
        description: "Campaña emocional para el segmento familiar en centros comerciales",
        status: "DRAFT", clientId: nutresa.id, userId: adminUser.id,
        budget: 45000000, spent: 0,
        startDate: new Date("2025-11-15"), endDate: new Date("2026-01-15"),
        targetCities: ["Medellín", "Bogotá"], impressionsGoal: 3500000,
      },
    }),
    db.campaign.upsert({
      where: { id: "cmp_5" },
      update: {},
      create: {
        id: "cmp_5",
        name: "Bavaria — Águila Sin Alcohol",
        description: "Lanzamiento nueva variedad en mercados fitness y wellness",
        status: "PAUSED", clientId: bavaria.id, userId: adminUser.id,
        budget: 30000000, spent: 12000000,
        startDate: new Date("2025-02-01"), endDate: new Date("2025-05-31"),
        targetCities: ["Bogotá", "Medellín"],
        impressionsGoal: 1500000, impressions: 620000, conversions: 1200, engagements: 22000,
      },
    }),
  ]);
  console.log(`✓ ${campaigns.length} campaigns`);

  // Ads
  const ads = await Promise.all([
    db.ad.upsert({
      where: { id: "ad_4" },
      update: {},
      create: {
        id: "ad_4",
        title: "Bancolombia — Tu banco digital",
        description: "Campaña imagen 10s para terminales de transporte",
        status: "PENDING_REVIEW", format: "IMAGE", campaignId: campaigns[2].id,
        duration: 10, ctaText: "Descarga la app",
        qrEnabled: true, qrUrl: "https://qr.belablaze.co/ad_4",
        startDate: new Date("2025-06-01"), endDate: new Date("2025-12-31"),
      },
    }),
    db.ad.upsert({
      where: { id: "ad_5" },
      update: {},
      create: {
        id: "ad_5",
        title: "Bancolombia — QR Cashback",
        description: "Anuncio interactivo con código QR para cashback",
        status: "PENDING_REVIEW", format: "INTERACTIVE", campaignId: campaigns[2].id,
        duration: 15, ctaText: "Escanear QR",
        qrEnabled: true, qrUrl: "https://qr.belablaze.co/ad_5",
      },
    }),
    db.ad.upsert({
      where: { id: "ad_1" },
      update: {},
      create: {
        id: "ad_1",
        title: "Éxito Escolar — Mochilas & Útiles",
        description: "Spot 15s mostrando colección escolar 2025",
        status: "ACTIVE", format: "VIDEO", campaignId: campaigns[0].id,
        duration: 15, ctaText: "Ver catálogo", ctaUrl: "https://exito.com/escolar",
        qrEnabled: true, qrUrl: "https://qr.belablaze.co/ad_1",
        impressions: 485000, clicks: 12400, qrScans: 3200, engagements: 18000, ctr: 2.56,
        startDate: new Date("2025-01-15"), endDate: new Date("2025-06-30"),
      },
    }),
    db.ad.upsert({
      where: { id: "ad_6" },
      update: {},
      create: {
        id: "ad_6",
        title: "Bavaria — Sin Alcohol, todo el sabor",
        status: "REJECTED", format: "VIDEO", campaignId: campaigns[4].id,
        duration: 20, qrEnabled: false,
        rejectionNote: "El spot no cumple con las resoluciones mínimas requeridas para pantallas LED exterior. Por favor reenvía en formato 4K.",
      },
    }),
    db.ad.upsert({
      where: { id: "ad_2" },
      update: {},
      create: {
        id: "ad_2",
        title: "Bavaria — Gana con la Copa",
        status: "ACTIVE", format: "INTERACTIVE", campaignId: campaigns[1].id,
        duration: 20, ctaText: "Escanea y gana", ctaUrl: "https://bavaria.com/copa",
        qrEnabled: true, qrUrl: "https://qr.belablaze.co/ad_2",
        impressions: 820000, clicks: 28000, qrScans: 12400, engagements: 65000, ctr: 3.41,
        startDate: new Date("2025-03-01"), endDate: new Date("2025-07-31"),
      },
    }),
  ]);
  console.log(`✓ ${ads.length} ads`);

  // Seed 30 days of metrics for chart
  const metricAd = ads[2]; // ACTIVE ad
  const metricBatch: Prisma.MetricCreateManyInput[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const base = Math.floor(Math.random() * 30000) + 100000;
    metricBatch.push({
      adId: metricAd.id,
      impressions: base,
      clicks: Math.floor(base * 0.025),
      qrScans: Math.floor(base * 0.008),
      engagements: Math.floor(base * 0.04),
      dwellTime: Math.random() * 8 + 2,
      date,
    });
  }

  await db.metric.deleteMany({ where: { adId: metricAd.id } });
  await db.metric.createMany({ data: metricBatch });
  console.log("✓ 30 days of metrics");

  // Seed recent activity logs
  const logEntries = [
    { action: "APPROVE" as const, entity: "Ad", entityId: ads[4].id, newData: { name: "Bavaria — Gana con la Copa" } },
    { action: "CREATE" as const, entity: "Campaign", entityId: campaigns[2].id, newData: { name: "Bancolombia — YoSoyDigital" } },
    { action: "REJECT" as const, entity: "Ad", entityId: ads[3].id, newData: { name: "Bavaria — Sin Alcohol" } },
    { action: "PAUSE" as const, entity: "Campaign", entityId: campaigns[4].id, newData: { name: "Bavaria — Águila Sin Alcohol" } },
    { action: "CREATE" as const, entity: "Client", entityId: clients[4].id, newData: { name: "Tigo Colombia" } },
  ];

  await db.log.deleteMany({ where: { userId: adminUser.id } });
  for (const entry of logEntries) {
    await db.log.create({ data: { userId: adminUser.id, ...entry } });
  }
  console.log("✓ Activity logs");

  console.log("\n✅ Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
