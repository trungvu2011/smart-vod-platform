const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const prisma = require("../config/prisma");
const redisClient = require("../config/redis");
const videoQueue = require("../config/queue");
const minioClient = require("../config/minio");
const {
  getElasticsearchClient,
  isElasticsearchEnabled,
} = require("../config/elasticsearch");
const { roomService } = require("../config/livekit");

const WORKER_HEARTBEAT_KEY = "worker:video:heartbeat";
const CHECK_TIMEOUT_MS = 2000;
const HOST_PROC_PATH = process.env.HOST_PROC_PATH || "/host/proc";
const HOST_ROOT_PATH = process.env.HOST_ROOT_PATH || "/host/root";
const STATUS = {
  OPERATIONAL: "OPERATIONAL",
  DEGRADED: "DEGRADED",
  DOWN: "DOWN",
  UNKNOWN: "UNKNOWN",
  DISABLED: "DISABLED",
};

let previousCpuSample = null;

const bytesToMb = (bytes) => Math.round((bytes || 0) / 1024 / 1024);

const nowIso = () => new Date().toISOString();

const withTimeout = (promise, timeoutMs = CHECK_TIMEOUT_MS) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Health check timed out")), timeoutMs),
    ),
  ]);

const timedCheck = async (name, check) => {
  const startedAt = Date.now();
  try {
    const result = await withTimeout(Promise.resolve().then(check));
    return {
      name,
      status: result.status || STATUS.OPERATIONAL,
      latencyMs: Date.now() - startedAt,
      checkedAt: nowIso(),
      details: result.details || {},
      message: result.message || null,
    };
  } catch (error) {
    return {
      name,
      status: STATUS.DOWN,
      latencyMs: Date.now() - startedAt,
      checkedAt: nowIso(),
      details: {},
      message: error.message,
    };
  }
};

const parseMeminfo = (content) => {
  const values = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_()]+):\s+(\d+)\s+kB$/);
    if (match) values[match[1]] = Number(match[2]) * 1024;
  }

  const totalBytes = values.MemTotal || 0;
  const availableBytes = values.MemAvailable || 0;
  const usedBytes = Math.max(totalBytes - availableBytes, 0);
  const usedPercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : null;

  return {
    totalMb: bytesToMb(totalBytes),
    usedMb: bytesToMb(usedBytes),
    availableMb: bytesToMb(availableBytes),
    usedPercent,
  };
};

const readProcCpuSample = () => {
  const statPath = `${HOST_PROC_PATH}/stat`;
  const firstLine = fs.readFileSync(statPath, "utf8").split(/\r?\n/)[0];
  const parts = firstLine.trim().split(/\s+/).slice(1).map(Number);
  const idle = (parts[3] || 0) + (parts[4] || 0);
  const total = parts.reduce((sum, value) => sum + value, 0);
  return { source: "proc", idle, total };
};

const readOsCpuSample = () => {
  const cpus = os.cpus();
  const totals = cpus.reduce(
    (acc, cpu) => {
      const times = cpu.times;
      acc.idle += times.idle;
      acc.total += Object.values(times).reduce((sum, value) => sum + value, 0);
      return acc;
    },
    { idle: 0, total: 0 },
  );
  return { source: "os", ...totals };
};

const calculateCpuPercent = (readSample) => {
  const current = readSample();
  if (!previousCpuSample || previousCpuSample.source !== current.source) {
    previousCpuSample = current;
    return null;
  }

  const idleDelta = current.idle - previousCpuSample.idle;
  const totalDelta = current.total - previousCpuSample.total;
  previousCpuSample = current;

  if (totalDelta <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((1 - idleDelta / totalDelta) * 100)));
};

const parseDfOutput = (stdout) => {
  const lines = stdout.trim().split(/\r?\n/);
  const columns = lines[1]?.trim().split(/\s+/);
  if (!columns || columns.length < 6) {
    return { unavailableReason: "Unable to parse disk usage." };
  }

  const totalKb = Number(columns[1]);
  const usedKb = Number(columns[2]);
  const availableKb = Number(columns[3]);
  const usedPercent = Number(String(columns[4]).replace("%", ""));
  return {
    totalGb: Math.round(totalKb / 1024 / 1024),
    usedGb: Math.round(usedKb / 1024 / 1024),
    availableGb: Math.round(availableKb / 1024 / 1024),
    usedPercent,
    mount: columns[5],
  };
};

const readDfDiskUsage = (targetPath) =>
  new Promise((resolve) => {
    execFile("df", ["-Pk", targetPath], { timeout: 1500 }, (error, stdout) => {
      if (error) {
        resolve({ unavailableReason: error.message });
        return;
      }

      resolve(parseDfOutput(stdout));
    });
  });

const readWindowsDiskUsage = () =>
  new Promise((resolve) => {
    const drive = path.parse(process.cwd()).root.replace(/\\$/, "") || "C:";
    const command = [
      `$disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${drive}'";`,
      "if ($null -eq $disk) { throw 'Disk not found' }",
      "[pscustomobject]@{DeviceID=$disk.DeviceID;Size=$disk.Size;FreeSpace=$disk.FreeSpace} | ConvertTo-Json -Compress",
    ].join(" ");

    execFile("powershell.exe", ["-NoProfile", "-Command", command], { timeout: 1500 }, (error, stdout) => {
      if (error) {
        resolve({ unavailableReason: error.message });
        return;
      }

      try {
        const disk = JSON.parse(stdout);
        const totalBytes = Number(disk.Size || 0);
        const freeBytes = Number(disk.FreeSpace || 0);
        const usedBytes = Math.max(totalBytes - freeBytes, 0);
        resolve({
          totalGb: Math.round(totalBytes / 1024 / 1024 / 1024),
          usedGb: Math.round(usedBytes / 1024 / 1024 / 1024),
          availableGb: Math.round(freeBytes / 1024 / 1024 / 1024),
          usedPercent: totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : null,
          mount: disk.DeviceID || drive,
        });
      } catch (parseError) {
        resolve({ unavailableReason: parseError.message });
      }
    });
  });

const getHostMetrics = async () => {
  if (!fs.existsSync(HOST_PROC_PATH)) {
    const totalBytes = os.totalmem();
    const availableBytes = os.freemem();
    const usedBytes = Math.max(totalBytes - availableBytes, 0);
    const memory = {
      totalMb: bytesToMb(totalBytes),
      usedMb: bytesToMb(usedBytes),
      availableMb: bytesToMb(availableBytes),
      usedPercent: totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : null,
    };
    const disk = process.platform === "win32"
      ? await readWindowsDiskUsage()
      : await readDfDiskUsage("/");
    const cpuUsedPercent = calculateCpuPercent(readOsCpuSample);
    const hasDiskUsage = typeof disk.usedPercent === "number";
    const degraded =
      (typeof cpuUsedPercent === "number" && cpuUsedPercent >= 85) ||
      (typeof memory.usedPercent === "number" && memory.usedPercent >= 85) ||
      (hasDiskUsage && disk.usedPercent >= 85);

    return {
      status: degraded ? STATUS.DEGRADED : STATUS.OPERATIONAL,
      source: "local-os",
      cpu: { usedPercent: cpuUsedPercent },
      memory,
      disk,
      uptimeSeconds: Math.floor(os.uptime()),
      loadAverage: os.loadavg(),
    };
  }

  try {
    const [meminfo, uptimeContent, loadavgContent, disk] = await Promise.all([
      fs.promises.readFile(`${HOST_PROC_PATH}/meminfo`, "utf8"),
      fs.promises.readFile(`${HOST_PROC_PATH}/uptime`, "utf8"),
      fs.promises.readFile(`${HOST_PROC_PATH}/loadavg`, "utf8"),
      readDfDiskUsage(HOST_ROOT_PATH),
    ]);

    const cpuUsedPercent = calculateCpuPercent(readProcCpuSample);
    const memory = parseMeminfo(meminfo);
    const uptimeSeconds = Math.floor(Number(uptimeContent.split(/\s+/)[0]) || 0);
    const loadAverage = loadavgContent.trim().split(/\s+/).slice(0, 3).map(Number);
    const hasDiskUsage = typeof disk.usedPercent === "number";
    const degraded =
      (typeof cpuUsedPercent === "number" && cpuUsedPercent >= 85) ||
      (typeof memory.usedPercent === "number" && memory.usedPercent >= 85) ||
      (hasDiskUsage && disk.usedPercent >= 85);

    return {
      status: degraded ? STATUS.DEGRADED : STATUS.OPERATIONAL,
      source: "host-proc",
      cpu: { usedPercent: cpuUsedPercent },
      memory,
      disk,
      uptimeSeconds,
      loadAverage,
    };
  } catch (error) {
    return {
      status: STATUS.UNKNOWN,
      unavailableReason: error.message,
    };
  }
};

const getApiDetails = () => {
  const memoryUsage = process.memoryUsage();
  return {
    status: STATUS.OPERATIONAL,
    details: {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      memoryMb: {
        rss: bytesToMb(memoryUsage.rss),
        heapUsed: bytesToMb(memoryUsage.heapUsed),
        heapTotal: bytesToMb(memoryUsage.heapTotal),
      },
    },
  };
};

const getWorkerDetails = async () => {
  const heartbeatRaw = await redisClient.get(WORKER_HEARTBEAT_KEY);
  if (!heartbeatRaw) {
    return {
      status: STATUS.DOWN,
      message: "No recent worker heartbeat.",
      details: { heartbeatKey: WORKER_HEARTBEAT_KEY },
    };
  }

  let heartbeat = {};
  try {
    heartbeat = JSON.parse(heartbeatRaw);
  } catch {
    heartbeat = { raw: heartbeatRaw };
  }

  return {
    status: STATUS.OPERATIONAL,
    details: heartbeat,
  };
};

const getDatabaseDetails = async () => {
  await prisma.$queryRaw`SELECT 1`;
  return { status: STATUS.OPERATIONAL };
};

const getRedisDetails = async () => {
  await redisClient.ping();
  let memory = {};
  try {
    const info = await redisClient.info("memory");
    const usedMemoryMatch = info.match(/^used_memory:(\d+)/m);
    const peakMemoryMatch = info.match(/^used_memory_peak:(\d+)/m);
    memory = {
      usedMemoryMb: bytesToMb(Number(usedMemoryMatch?.[1] || 0)),
      peakMemoryMb: bytesToMb(Number(peakMemoryMatch?.[1] || 0)),
    };
  } catch {
    memory = {};
  }
  return { status: STATUS.OPERATIONAL, details: memory };
};

const getQueueDetails = async () => {
  const queueCounts = await videoQueue.getJobCounts();
  const failed = queueCounts.failed || 0;
  const waiting = queueCounts.waiting || 0;
  const status = failed > 0 || waiting > 25 ? STATUS.DEGRADED : STATUS.OPERATIONAL;
  return {
    status,
    details: { queueCounts },
  };
};

const getMinioDetails = async () => {
  const bucketName = process.env.MINIO_BUCKET_NAME;
  const bucketReady = bucketName ? await minioClient.bucketExists(bucketName) : false;
  return {
    status: bucketReady ? STATUS.OPERATIONAL : STATUS.DOWN,
    details: { bucketName, bucketReady },
    message: bucketReady ? null : "MinIO bucket is not available.",
  };
};

const getElasticsearchDetails = async () => {
  if (!isElasticsearchEnabled()) {
    return {
      status: STATUS.DISABLED,
      details: { enabled: false },
      message: "Elasticsearch is disabled by configuration.",
    };
  }

  const client = getElasticsearchClient();
  if (!client) {
    return {
      status: STATUS.UNKNOWN,
      details: { enabled: true },
      message: "Elasticsearch client is not configured.",
    };
  }

  const info = await client.info();
  return {
    status: STATUS.OPERATIONAL,
    details: {
      clusterName: info.cluster_name,
      version: info.version?.number,
      enabled: true,
    },
  };
};

const getLivekitDetails = async () => {
  const rooms = await roomService.listRooms([]);
  return {
    status: STATUS.OPERATIONAL,
    details: { activeRooms: Array.isArray(rooms) ? rooms.length : 0 },
  };
};

const buildAlerts = (host, services) => {
  const alerts = [];
  const criticalServices = ["api", "database", "redis", "queue", "minio"];

  for (const serviceName of criticalServices) {
    const service = services[serviceName];
    if (service?.status === STATUS.DOWN) {
      alerts.push({
        level: "critical",
        message: `${service.name} is down.`,
      });
    }
  }

  if (host?.cpu?.usedPercent >= 85) {
    alerts.push({ level: "warning", message: `CPU usage is high (${host.cpu.usedPercent}%).` });
  }
  if (host?.memory?.usedPercent >= 85) {
    alerts.push({ level: "warning", message: `Memory usage is high (${host.memory.usedPercent}%).` });
  }
  if (host?.disk?.usedPercent >= 85) {
    alerts.push({ level: "warning", message: `Disk usage is high (${host.disk.usedPercent}%).` });
  }

  const failedJobs = services.queue?.details?.queueCounts?.failed || 0;
  if (failedJobs > 0) {
    alerts.push({ level: "warning", message: `${failedJobs} failed transcoding job(s).` });
  }

  return alerts;
};

const getOverallStatus = (host, services) => {
  const criticalServices = ["api", "database", "redis", "queue", "minio"];
  if (criticalServices.some((name) => services[name]?.status === STATUS.DOWN)) {
    return STATUS.DOWN;
  }

  if (
    host?.status === STATUS.DEGRADED ||
    Object.values(services).some((service) =>
      [STATUS.DEGRADED, STATUS.DOWN].includes(service.status),
    )
  ) {
    return STATUS.DEGRADED;
  }

  return STATUS.OPERATIONAL;
};

const getSystemHealth = async () => {
  const checkedAt = nowIso();
  const [host, serviceResults] = await Promise.all([
    getHostMetrics(),
    Promise.allSettled([
      timedCheck("API Gateway", getApiDetails),
      timedCheck("Video Worker", getWorkerDetails),
      timedCheck("PostgreSQL", getDatabaseDetails),
      timedCheck("Redis", getRedisDetails),
      timedCheck("BullMQ", getQueueDetails),
      timedCheck("MinIO", getMinioDetails),
      timedCheck("Elasticsearch", getElasticsearchDetails),
      timedCheck("LiveKit", getLivekitDetails),
    ]),
  ]);

  const serviceKeys = [
    "api",
    "worker",
    "database",
    "redis",
    "queue",
    "minio",
    "elasticsearch",
    "livekit",
  ];
  const services = serviceResults.reduce((acc, result, index) => {
    acc[serviceKeys[index]] =
      result.status === "fulfilled"
        ? result.value
        : {
          name: serviceKeys[index],
          status: STATUS.DOWN,
          latencyMs: null,
          checkedAt,
          details: {},
          message: result.reason?.message || "Health check failed.",
        };
    return acc;
  }, {});

  return {
    overallStatus: getOverallStatus(host, services),
    checkedAt,
    host,
    services,
    alerts: buildAlerts(host, services),
    database: services.database?.status || STATUS.UNKNOWN,
    redis: services.redis?.status || STATUS.UNKNOWN,
    queue: services.queue?.status || STATUS.UNKNOWN,
    queueCounts: services.queue?.details?.queueCounts,
  };
};

module.exports = {
  getSystemHealth,
  WORKER_HEARTBEAT_KEY,
};
