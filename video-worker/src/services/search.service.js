const { PrismaClient } = require("@prisma/client");
const { getElasticsearchClient } = require("../config/elasticsearch");

const prisma = new PrismaClient();
const VIDEO_INDEX = process.env.ELASTICSEARCH_INDEX_VIDEOS || "videos";

const videoIndexMapping = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
  },
  mappings: {
    properties: {
      id: { type: "keyword" },
      title: {
        type: "text",
        fields: { keyword: { type: "keyword" } },
      },
      description: { type: "text" },
      category: { type: "keyword" },
      status: { type: "keyword" },
      visibility: { type: "keyword" },
      thumbnailUrl: { type: "keyword", index: false },
      viewCount: { type: "integer" },
      createdAt: { type: "date" },
      creator: {
        properties: {
          id: { type: "keyword" },
          fullName: {
            type: "text",
            fields: { keyword: { type: "keyword" } },
          },
          email: { type: "keyword" },
          avatarUrl: { type: "keyword", index: false },
        },
      },
      metadata: {
        properties: {
          duration: { type: "integer" },
          aiSummaryText: { type: "text" },
        },
      },
    },
  },
};

const flattenAiSummary = (summary) => {
  if (!summary) return "";

  let parsed = summary;
  if (typeof summary === "string") {
    try {
      parsed = JSON.parse(summary);
    } catch {
      return summary;
    }
  }

  const parts = [];
  const collect = (value) => {
    if (!value) return;
    if (typeof value === "string" || typeof value === "number") {
      parts.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (typeof value === "object") {
      Object.values(value).forEach(collect);
    }
  };

  collect(parsed);
  return parts.join(" ").trim();
};

const ensureVideoIndex = async () => {
  const client = getElasticsearchClient();
  if (!client) return false;

  const exists = await client.indices.exists({ index: VIDEO_INDEX });
  if (!exists) {
    await client.indices.create({
      index: VIDEO_INDEX,
      ...videoIndexMapping,
    });
  } else {
    await client.indices.putSettings({
      index: VIDEO_INDEX,
      settings: { number_of_replicas: 0 },
    });
  }
  return true;
};

const toVideoDocument = (video) => ({
  id: video.id,
  title: video.title,
  description: video.description || "",
  category: video.category || null,
  status: video.status,
  visibility: video.visibility,
  thumbnailUrl: video.thumbnailUrl || null,
  viewCount: video.viewCount || 0,
  createdAt: video.createdAt,
  creator: {
    id: video.creator.id,
    fullName: video.creator.fullName,
    email: video.creator.email,
    avatarUrl: video.creator.avatarUrl || null,
  },
  metadata: {
    duration: video.metadata?.duration || 0,
    aiSummaryText: flattenAiSummary(video.metadata?.aiSummary),
  },
});

const deleteVideoFromIndex = async (videoId) => {
  const client = getElasticsearchClient();
  if (!client) return;

  try {
    await client.delete({ index: VIDEO_INDEX, id: videoId });
  } catch (error) {
    if (error?.meta?.statusCode !== 404) throw error;
  }
};

const indexVideoById = async (videoId) => {
  const client = getElasticsearchClient();
  if (!client) return;

  await ensureVideoIndex();
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      creator: {
        select: { id: true, fullName: true, email: true, avatarUrl: true },
      },
      metadata: {
        select: { duration: true, aiSummary: true },
      },
    },
  });

  if (!video || video.status !== "READY") {
    await deleteVideoFromIndex(videoId);
    return;
  }

  await client.index({
    index: VIDEO_INDEX,
    id: video.id,
    document: toVideoDocument(video),
    refresh: false,
  });
};

module.exports = {
  indexVideoById,
  deleteVideoFromIndex,
};
