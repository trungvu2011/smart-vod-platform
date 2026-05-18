const prisma = require("../config/prisma");
const { getElasticsearchClient } = require("../config/elasticsearch");

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

const totalFromHits = (total) => {
  if (typeof total === "number") return total;
  return total?.value || 0;
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

const toApiVideo = (source) => ({
  id: source.id,
  title: source.title,
  description: source.description || null,
  thumbnailUrl: source.thumbnailUrl || null,
  category: source.category || null,
  visibility: source.visibility,
  status: source.status,
  viewCount: source.viewCount || 0,
  createdAt: source.createdAt,
  creator: {
    id: source.creator?.id,
    fullName: source.creator?.fullName,
    avatarUrl: source.creator?.avatarUrl || null,
  },
  metadata: {
    duration: source.metadata?.duration || 0,
  },
});

const findVideoForIndex = (videoId) =>
  prisma.video.findUnique({
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
  const video = await findVideoForIndex(videoId);
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

const searchVideos = async ({ q, page = 1, limit = 12, status = null, category = null }) => {
  const client = getElasticsearchClient();
  if (!client) return null;

  await ensureVideoIndex();

  const filters = [{ term: { status: status || "READY" } }];
  if (category) filters.push({ term: { category } });

  const result = await client.search({
    index: VIDEO_INDEX,
    from: (page - 1) * limit,
    size: limit,
    query: {
      bool: {
        filter: filters,
        must: [
          {
            multi_match: {
              query: q,
              fields: [
                "title^4",
                "creator.fullName^3",
                "description^2",
                "metadata.aiSummaryText^2",
                "creator.email",
              ],
              fuzziness: "AUTO",
            },
          },
        ],
      },
    },
    sort: [{ _score: "desc" }, { createdAt: "desc" }],
  });

  const total = totalFromHits(result.hits?.total);
  return {
    videos: (result.hits?.hits || []).map((hit) => toApiVideo(hit._source)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const reindexAllReadyVideos = async ({ batchSize = 200 } = {}) => {
  const client = getElasticsearchClient();
  if (!client) {
    throw new Error("Elasticsearch is disabled.");
  }

  await ensureVideoIndex();

  let cursor = null;
  let total = 0;

  while (true) {
    const videos = await prisma.video.findMany({
      where: { status: "READY" },
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: "asc" },
      include: {
        creator: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        metadata: {
          select: { duration: true, aiSummary: true },
        },
      },
    });

    if (!videos.length) break;

    const operations = videos.flatMap((video) => [
      { index: { _index: VIDEO_INDEX, _id: video.id } },
      toVideoDocument(video),
    ]);

    const response = await client.bulk({ refresh: false, operations });
    if (response.errors) {
      throw new Error("Bulk reindex completed with Elasticsearch item errors.");
    }

    total += videos.length;
    cursor = videos[videos.length - 1].id;
  }

  await client.indices.refresh({ index: VIDEO_INDEX });
  return total;
};

const reindexReadyVideosByCreatorId = async (creatorId) => {
  const videos = await prisma.video.findMany({
    where: { creatorId, status: "READY" },
    select: { id: true },
  });

  for (const video of videos) {
    await indexVideoById(video.id);
  }

  return videos.length;
};

module.exports = {
  ensureVideoIndex,
  flattenAiSummary,
  indexVideoById,
  deleteVideoFromIndex,
  searchVideos,
  reindexAllReadyVideos,
  reindexReadyVideosByCreatorId,
};
