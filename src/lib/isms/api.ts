import type {
  IsmsWorkspaceView,
  IsmsRisk,
  IsmsAsset,
  IsmsIncident,
  IsmsTask,
  IsmsTeamMember,
  IsmsKpi,
  IsmsSupplier,
  IsmsAwareness,
  IsmsAudit,
  IsmsNca,
} from "@/types/isms";

const BASE = "/api/isms";

export interface IsmsExportPayload {
  exportedAt: string;
  workspace: IsmsWorkspaceView;
  risks: IsmsRisk[];
  assets: IsmsAsset[];
  incidents: IsmsIncident[];
  tasks: IsmsTask[];
  team: IsmsTeamMember[];
  kpis: IsmsKpi[];
  suppliers: IsmsSupplier[];
  awareness: IsmsAwareness[];
  audits: IsmsAudit[];
  ncas: IsmsNca[];
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error || "Request failed");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

async function getList<T>(resource: string): Promise<T[]> {
  return request<T[]>(`${BASE}/${resource}`);
}

async function createItem<T>(resource: string, data: Partial<T>): Promise<T> {
  return request<T>(`${BASE}/${resource}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function updateItem<T>(resource: string, id: string, data: Partial<T>): Promise<T> {
  return request<T>(`${BASE}/${resource}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function deleteItem(resource: string, id: string): Promise<void> {
  await request<{ success: boolean }>(`${BASE}/${resource}/${id}`, { method: "DELETE" });
}

export async function getWorkspace(): Promise<IsmsWorkspaceView> {
  return request<IsmsWorkspaceView>(`${BASE}/workspace`);
}

export async function updateWorkspace(data: Partial<IsmsWorkspaceView>): Promise<IsmsWorkspaceView> {
  return request<IsmsWorkspaceView>(`${BASE}/workspace`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function exportIsmsData(): Promise<IsmsExportPayload> {
  return request<IsmsExportPayload>(`${BASE}/export`);
}

export async function importIsmsData(data: Partial<IsmsExportPayload>): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${BASE}/import`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getRisks(): Promise<IsmsRisk[]> {
  return getList<IsmsRisk>("risks");
}

export async function createRisk(data: Partial<IsmsRisk>): Promise<IsmsRisk> {
  return createItem<IsmsRisk>("risks", data);
}

export async function updateRisk(id: string, data: Partial<IsmsRisk>): Promise<IsmsRisk> {
  return updateItem<IsmsRisk>("risks", id, data);
}

export async function deleteRisk(id: string): Promise<void> {
  return deleteItem("risks", id);
}

export async function getAssets(): Promise<IsmsAsset[]> {
  return getList<IsmsAsset>("assets");
}

export async function createAsset(data: Partial<IsmsAsset>): Promise<IsmsAsset> {
  return createItem<IsmsAsset>("assets", data);
}

export async function updateAsset(id: string, data: Partial<IsmsAsset>): Promise<IsmsAsset> {
  return updateItem<IsmsAsset>("assets", id, data);
}

export async function deleteAsset(id: string): Promise<void> {
  return deleteItem("assets", id);
}

export async function getIncidents(): Promise<IsmsIncident[]> {
  return getList<IsmsIncident>("incidents");
}

export async function createIncident(data: Partial<IsmsIncident>): Promise<IsmsIncident> {
  return createItem<IsmsIncident>("incidents", data);
}

export async function updateIncident(id: string, data: Partial<IsmsIncident>): Promise<IsmsIncident> {
  return updateItem<IsmsIncident>("incidents", id, data);
}

export async function deleteIncident(id: string): Promise<void> {
  return deleteItem("incidents", id);
}

export async function getTasks(): Promise<IsmsTask[]> {
  return getList<IsmsTask>("tasks");
}

export async function createTask(data: Partial<IsmsTask>): Promise<IsmsTask> {
  return createItem<IsmsTask>("tasks", data);
}

export async function updateTask(id: string, data: Partial<IsmsTask>): Promise<IsmsTask> {
  return updateItem<IsmsTask>("tasks", id, data);
}

export async function deleteTask(id: string): Promise<void> {
  return deleteItem("tasks", id);
}

export async function getTeam(): Promise<IsmsTeamMember[]> {
  return getList<IsmsTeamMember>("team");
}

export async function createTeamMember(data: Partial<IsmsTeamMember>): Promise<IsmsTeamMember> {
  return createItem<IsmsTeamMember>("team", data);
}

export async function updateTeamMember(id: string, data: Partial<IsmsTeamMember>): Promise<IsmsTeamMember> {
  return updateItem<IsmsTeamMember>("team", id, data);
}

export async function deleteTeamMember(id: string): Promise<void> {
  return deleteItem("team", id);
}

export async function getKpis(): Promise<IsmsKpi[]> {
  return getList<IsmsKpi>("kpis");
}

export async function createKpi(data: Partial<IsmsKpi>): Promise<IsmsKpi> {
  return createItem<IsmsKpi>("kpis", data);
}

export async function updateKpi(id: string, data: Partial<IsmsKpi>): Promise<IsmsKpi> {
  return updateItem<IsmsKpi>("kpis", id, data);
}

export async function deleteKpi(id: string): Promise<void> {
  return deleteItem("kpis", id);
}

export async function getSuppliers(): Promise<IsmsSupplier[]> {
  return getList<IsmsSupplier>("suppliers");
}

export async function createSupplier(data: Partial<IsmsSupplier>): Promise<IsmsSupplier> {
  return createItem<IsmsSupplier>("suppliers", data);
}

export async function updateSupplier(id: string, data: Partial<IsmsSupplier>): Promise<IsmsSupplier> {
  return updateItem<IsmsSupplier>("suppliers", id, data);
}

export async function deleteSupplier(id: string): Promise<void> {
  return deleteItem("suppliers", id);
}

export async function getAwareness(): Promise<IsmsAwareness[]> {
  return getList<IsmsAwareness>("awareness");
}

export async function createAwareness(data: Partial<IsmsAwareness>): Promise<IsmsAwareness> {
  return createItem<IsmsAwareness>("awareness", data);
}

export async function updateAwareness(id: string, data: Partial<IsmsAwareness>): Promise<IsmsAwareness> {
  return updateItem<IsmsAwareness>("awareness", id, data);
}

export async function deleteAwareness(id: string): Promise<void> {
  return deleteItem("awareness", id);
}

export async function getAudits(): Promise<IsmsAudit[]> {
  return getList<IsmsAudit>("audits");
}

export async function createAudit(data: Partial<IsmsAudit>): Promise<IsmsAudit> {
  return createItem<IsmsAudit>("audits", data);
}

export async function updateAudit(id: string, data: Partial<IsmsAudit>): Promise<IsmsAudit> {
  return updateItem<IsmsAudit>("audits", id, data);
}

export async function deleteAudit(id: string): Promise<void> {
  return deleteItem("audits", id);
}

export async function getNcas(): Promise<IsmsNca[]> {
  return getList<IsmsNca>("ncas");
}

export async function createNca(data: Partial<IsmsNca>): Promise<IsmsNca> {
  return createItem<IsmsNca>("ncas", data);
}

export async function updateNca(id: string, data: Partial<IsmsNca>): Promise<IsmsNca> {
  return updateItem<IsmsNca>("ncas", id, data);
}

export async function deleteNca(id: string): Promise<void> {
  return deleteItem("ncas", id);
}
