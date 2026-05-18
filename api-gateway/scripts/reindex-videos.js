require("dotenv").config();

const prisma = require("../src/config/prisma");
const searchService = require("../src/services/search.service");

const run = async () => {
  const total = await searchService.reindexAllReadyVideos();
  console.log(`[Search] Reindexed ${total} READY video(s).`);
};

run()
  .catch((error) => {
    console.error("[Search] Reindex failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
