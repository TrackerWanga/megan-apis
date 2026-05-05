import os from "os";
import { allEndpoints, apiCategories } from "../../shared/schema";

// ─── Server Status ────────────────────────────────────────────────────────

const startTime = Date.now();

export function getServerStatus() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;

  const mem = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  return {
    status: "online",
    uptime_seconds: uptime,
    uptime_formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    started_at: new Date(startTime).toISOString(),
    platform: os.platform(),
    arch: os.arch(),
    node_version: process.version,
    memory: {
      process_mb: Math.round(mem.rss / 1024 / 1024),
      heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
      system_total_mb: Math.round(totalMem / 1024 / 1024),
      system_free_mb: Math.round(freeMem / 1024 / 1024),
      system_used_percent: Math.round(((totalMem - freeMem) / totalMem) * 100),
    },
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || "Unknown",
      load_avg: os.loadavg().map(l => Math.round(l * 100) / 100),
    },
  };
}

// ─── Endpoints Catalog ─────────────────────────────────────────────────────

export function getAllEndpoints() {
  return {
    total: allEndpoints.length,
    categories: apiCategories.map(cat => ({
      name: cat.name,
      id: cat.id,
      description: cat.description,
      count: allEndpoints.filter(e => e.category === cat.id).length,
    })),
    endpoints: allEndpoints.map(ep => ({
      path: ep.path,
      method: ep.method,
      description: ep.description,
      category: ep.category,
      provider: ep.provider || null,
      params: ep.params.map(p => ({
        name: p.name,
        type: p.type,
        required: p.required,
        description: p.description,
      })),
    })),
  };
}

export function searchEndpoints(query: string) {
  const q = query.toLowerCase();
  const results = allEndpoints.filter(ep =>
    ep.path.toLowerCase().includes(q) ||
    ep.description.toLowerCase().includes(q) ||
    ep.category.toLowerCase().includes(q) ||
    (ep.provider || "").toLowerCase().includes(q)
  );

  return {
    query,
    totalResults: results.length,
    results: results.map(ep => ({
      path: ep.path,
      method: ep.method,
      description: ep.description,
      category: ep.category,
      provider: ep.provider || null,
    })),
  };
}

export function getEndpointsByCategory(categoryName: string) {
  const cat = apiCategories.find(c => c.id === categoryName || c.name.toLowerCase() === categoryName.toLowerCase());
  if (!cat) return null;

  const eps = allEndpoints.filter(e => e.category === cat.id);
  return {
    category: cat.name,
    description: cat.description,
    totalEndpoints: eps.length,
    endpoints: eps.map(ep => ({
      path: ep.path,
      method: ep.method,
      description: ep.description,
      provider: ep.provider || null,
      params: ep.params.map(p => ({
        name: p.name,
        type: p.type,
        required: p.required,
        description: p.description,
      })),
    })),
  };
}

export function getCategories() {
  return {
    total: apiCategories.length,
    categories: apiCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      endpointCount: allEndpoints.filter(e => e.category === cat.id).length,
    })),
  };
}

export function getMethodStats() {
  const methods: Record<string, number> = {};
  allEndpoints.forEach(ep => {
    methods[ep.method] = (methods[ep.method] || 0) + 1;
  });

  return {
    total: allEndpoints.length,
    byMethod: Object.entries(methods).map(([method, count]) => ({ method, count })),
    byCategory: apiCategories.map(cat => ({
      name: cat.name,
      count: allEndpoints.filter(e => e.category === cat.id).length,
    })),
  };
}
