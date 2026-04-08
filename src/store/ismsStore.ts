import { create } from "zustand";
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
import {
  getWorkspace,
  updateWorkspace as updateWorkspaceApi,
  importIsmsData,
  getRisks,
  createRisk,
  updateRisk as updateRiskApi,
  deleteRisk as deleteRiskApi,
  getAssets,
  createAsset,
  updateAsset as updateAssetApi,
  deleteAsset as deleteAssetApi,
  getIncidents,
  createIncident,
  updateIncident as updateIncidentApi,
  deleteIncident as deleteIncidentApi,
  getTasks,
  createTask,
  updateTask as updateTaskApi,
  deleteTask as deleteTaskApi,
  getTeam,
  createTeamMember,
  updateTeamMember as updateTeamMemberApi,
  deleteTeamMember as deleteTeamMemberApi,
  getKpis,
  createKpi,
  updateKpi as updateKpiApi,
  deleteKpi as deleteKpiApi,
  getSuppliers,
  createSupplier,
  updateSupplier as updateSupplierApi,
  deleteSupplier as deleteSupplierApi,
  getAwareness,
  createAwareness,
  updateAwareness as updateAwarenessApi,
  deleteAwareness as deleteAwarenessApi,
  getAudits,
  createAudit,
  updateAudit as updateAuditApi,
  deleteAudit as deleteAuditApi,
  getNcas,
  createNca,
  updateNca as updateNcaApi,
  deleteNca as deleteNcaApi,
} from "@/lib/isms/api";

function asIsoDate(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Workspace synchronization failed";
}

type FlushWorkspaceOptions = {
  keepalive?: boolean;
};

function hasWorkspacePatch(patch: Partial<IsmsWorkspaceView>): boolean {
  return Object.keys(patch).length > 0;
}

function mergeWorkspacePatch(
  base: Partial<IsmsWorkspaceView>,
  patch: Partial<IsmsWorkspaceView>,
): Partial<IsmsWorkspaceView> {
  return { ...base, ...patch };
}

interface IsmsStore {
  workspace: IsmsWorkspaceView | null;
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
  isLoading: boolean;
  isSavingWorkspace: boolean;
  isDirty: boolean;
  lastSavedAt: string | null;
  lastWorkspaceError: string | null;
  _pendingWorkspacePatch: Partial<IsmsWorkspaceView>;
  _inFlightWorkspacePatch: Partial<IsmsWorkspaceView> | null;

  loadAll: () => Promise<void>;
  updateWorkspace: (patch: Partial<IsmsWorkspaceView>) => Promise<void>;
  flushWorkspace: (options?: FlushWorkspaceOptions) => Promise<void>;
  importSnapshot: (payload: unknown) => Promise<void>;

  addRisk: (data: Partial<IsmsRisk>) => Promise<void>;
  updateRisk: (id: string, data: Partial<IsmsRisk>) => Promise<void>;
  deleteRisk: (id: string) => Promise<void>;

  addAsset: (data: Partial<IsmsAsset>) => Promise<void>;
  updateAsset: (id: string, data: Partial<IsmsAsset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;

  addIncident: (data: Partial<IsmsIncident>) => Promise<void>;
  updateIncident: (id: string, data: Partial<IsmsIncident>) => Promise<void>;
  deleteIncident: (id: string) => Promise<void>;

  addTask: (data: Partial<IsmsTask>) => Promise<void>;
  updateTask: (id: string, data: Partial<IsmsTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  addTeamMember: (data: Partial<IsmsTeamMember>) => Promise<void>;
  updateTeamMember: (id: string, data: Partial<IsmsTeamMember>) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;

  addKpi: (data: Partial<IsmsKpi>) => Promise<void>;
  updateKpi: (id: string, data: Partial<IsmsKpi>) => Promise<void>;
  deleteKpi: (id: string) => Promise<void>;

  addSupplier: (data: Partial<IsmsSupplier>) => Promise<void>;
  updateSupplier: (id: string, data: Partial<IsmsSupplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  addAwareness: (data: Partial<IsmsAwareness>) => Promise<void>;
  updateAwareness: (id: string, data: Partial<IsmsAwareness>) => Promise<void>;
  deleteAwareness: (id: string) => Promise<void>;

  addAudit: (data: Partial<IsmsAudit>) => Promise<void>;
  updateAudit: (id: string, data: Partial<IsmsAudit>) => Promise<void>;
  deleteAudit: (id: string) => Promise<void>;

  addNca: (data: Partial<IsmsNca>) => Promise<void>;
  updateNca: (id: string, data: Partial<IsmsNca>) => Promise<void>;
  deleteNca: (id: string) => Promise<void>;
}

export const useIsmsStore = create<IsmsStore>((set, get) => ({
  workspace: null,
  risks: [],
  assets: [],
  incidents: [],
  tasks: [],
  team: [],
  kpis: [],
  suppliers: [],
  awareness: [],
  audits: [],
  ncas: [],
  isLoading: false,
  isSavingWorkspace: false,
  isDirty: false,
  lastSavedAt: null,
  lastWorkspaceError: null,
  _pendingWorkspacePatch: {},
  _inFlightWorkspacePatch: null,

  loadAll: async () => {
    set({ isLoading: true });
    try {
      const [
        workspace,
        risks,
        assets,
        incidents,
        tasks,
        team,
        kpis,
        suppliers,
        awareness,
        audits,
        ncas,
      ] = await Promise.all([
        getWorkspace(),
        getRisks(),
        getAssets(),
        getIncidents(),
        getTasks(),
        getTeam(),
        getKpis(),
        getSuppliers(),
        getAwareness(),
        getAudits(),
        getNcas(),
      ]);

      set({
        workspace,
        risks,
        assets,
        incidents,
        tasks,
        team,
        kpis,
        suppliers,
        awareness,
        audits,
        ncas,
        isDirty: false,
        isSavingWorkspace: false,
        lastWorkspaceError: null,
        lastSavedAt: asIsoDate(workspace.updatedAt),
        _pendingWorkspacePatch: {},
        _inFlightWorkspacePatch: null,
      });
    } catch (error) {
      console.error("Failed to load ISMS workspace:", error);
      set({ lastWorkspaceError: getErrorMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  updateWorkspace: async (patch) => {
    if (!hasWorkspacePatch(patch)) {
      return;
    }

    set((state) => ({
      workspace: state.workspace ? { ...state.workspace, ...patch } : state.workspace,
      _pendingWorkspacePatch: mergeWorkspacePatch(state._pendingWorkspacePatch, patch),
      isDirty: true,
      lastWorkspaceError: null,
    }));

    void get().flushWorkspace();
  },

  flushWorkspace: async (options = {}) => {
    if (get().isSavingWorkspace) {
      return;
    }

    if (!hasWorkspacePatch(get()._pendingWorkspacePatch)) {
      return;
    }

    set({ isSavingWorkspace: true, lastWorkspaceError: null });

    try {
      while (hasWorkspacePatch(get()._pendingWorkspacePatch)) {
        const flush = get()._pendingWorkspacePatch;
        set({ _pendingWorkspacePatch: {}, _inFlightWorkspacePatch: flush });

        const updated = await updateWorkspaceApi(flush, {
          keepalive: options.keepalive,
        });

        set((state) => {
          const hasPending = hasWorkspacePatch(state._pendingWorkspacePatch);
          const mergedWorkspace = hasPending
            ? ({ ...updated, ...state._pendingWorkspacePatch } as IsmsWorkspaceView)
            : updated;

          return {
            workspace: mergedWorkspace,
            _inFlightWorkspacePatch: null,
            isDirty: hasPending,
            lastWorkspaceError: null,
            lastSavedAt: asIsoDate(updated.updatedAt) ?? new Date().toISOString(),
          };
        });
      }

      set((state) => ({
        isSavingWorkspace: false,
        isDirty: hasWorkspacePatch(state._pendingWorkspacePatch),
      }));
    } catch (error) {
      set((state) => ({
        _pendingWorkspacePatch: mergeWorkspacePatch(
          state._inFlightWorkspacePatch ?? {},
          state._pendingWorkspacePatch,
        ),
        _inFlightWorkspacePatch: null,
        isSavingWorkspace: false,
        isDirty: true,
        lastWorkspaceError: getErrorMessage(error),
      }));
      throw error;
    }
  },

  importSnapshot: async (payload) => {
    await importIsmsData(payload as Record<string, unknown>);
    await get().loadAll();
  },

  addRisk: async (data) => {
    const item = await createRisk(data);
    set((state) => ({ risks: [...state.risks, item] }));
  },
  updateRisk: async (id, data) => {
    const item = await updateRiskApi(id, data);
    set((state) => ({ risks: state.risks.map((risk) => (risk.id === id ? item : risk)) }));
  },
  deleteRisk: async (id) => {
    await deleteRiskApi(id);
    set((state) => ({ risks: state.risks.filter((risk) => risk.id !== id) }));
  },

  addAsset: async (data) => {
    const item = await createAsset(data);
    set((state) => ({ assets: [...state.assets, item] }));
  },
  updateAsset: async (id, data) => {
    const item = await updateAssetApi(id, data);
    set((state) => ({ assets: state.assets.map((asset) => (asset.id === id ? item : asset)) }));
  },
  deleteAsset: async (id) => {
    await deleteAssetApi(id);
    set((state) => ({ assets: state.assets.filter((asset) => asset.id !== id) }));
  },

  addIncident: async (data) => {
    const item = await createIncident(data);
    set((state) => ({ incidents: [...state.incidents, item] }));
  },
  updateIncident: async (id, data) => {
    const item = await updateIncidentApi(id, data);
    set((state) => ({ incidents: state.incidents.map((incident) => (incident.id === id ? item : incident)) }));
  },
  deleteIncident: async (id) => {
    await deleteIncidentApi(id);
    set((state) => ({ incidents: state.incidents.filter((incident) => incident.id !== id) }));
  },

  addTask: async (data) => {
    const item = await createTask(data);
    set((state) => ({ tasks: [...state.tasks, item] }));
  },
  updateTask: async (id, data) => {
    const item = await updateTaskApi(id, data);
    set((state) => ({ tasks: state.tasks.map((task) => (task.id === id ? item : task)) }));
  },
  deleteTask: async (id) => {
    await deleteTaskApi(id);
    set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
  },

  addTeamMember: async (data) => {
    const item = await createTeamMember(data);
    set((state) => ({ team: [...state.team, item] }));
  },
  updateTeamMember: async (id, data) => {
    const item = await updateTeamMemberApi(id, data);
    set((state) => ({ team: state.team.map((member) => (member.id === id ? item : member)) }));
  },
  deleteTeamMember: async (id) => {
    await deleteTeamMemberApi(id);
    set((state) => ({ team: state.team.filter((member) => member.id !== id) }));
  },

  addKpi: async (data) => {
    const item = await createKpi(data);
    set((state) => ({ kpis: [...state.kpis, item] }));
  },
  updateKpi: async (id, data) => {
    const item = await updateKpiApi(id, data);
    set((state) => ({ kpis: state.kpis.map((kpi) => (kpi.id === id ? item : kpi)) }));
  },
  deleteKpi: async (id) => {
    await deleteKpiApi(id);
    set((state) => ({ kpis: state.kpis.filter((kpi) => kpi.id !== id) }));
  },

  addSupplier: async (data) => {
    const item = await createSupplier(data);
    set((state) => ({ suppliers: [...state.suppliers, item] }));
  },
  updateSupplier: async (id, data) => {
    const item = await updateSupplierApi(id, data);
    set((state) => ({ suppliers: state.suppliers.map((supplier) => (supplier.id === id ? item : supplier)) }));
  },
  deleteSupplier: async (id) => {
    await deleteSupplierApi(id);
    set((state) => ({ suppliers: state.suppliers.filter((supplier) => supplier.id !== id) }));
  },

  addAwareness: async (data) => {
    const item = await createAwareness(data);
    set((state) => ({ awareness: [...state.awareness, item] }));
  },
  updateAwareness: async (id, data) => {
    const item = await updateAwarenessApi(id, data);
    set((state) => ({ awareness: state.awareness.map((entry) => (entry.id === id ? item : entry)) }));
  },
  deleteAwareness: async (id) => {
    await deleteAwarenessApi(id);
    set((state) => ({ awareness: state.awareness.filter((entry) => entry.id !== id) }));
  },

  addAudit: async (data) => {
    const item = await createAudit(data);
    set((state) => ({ audits: [...state.audits, item] }));
  },
  updateAudit: async (id, data) => {
    const item = await updateAuditApi(id, data);
    set((state) => ({ audits: state.audits.map((audit) => (audit.id === id ? item : audit)) }));
  },
  deleteAudit: async (id) => {
    await deleteAuditApi(id);
    set((state) => ({ audits: state.audits.filter((audit) => audit.id !== id) }));
  },

  addNca: async (data) => {
    const item = await createNca(data);
    set((state) => ({ ncas: [...state.ncas, item] }));
  },
  updateNca: async (id, data) => {
    const item = await updateNcaApi(id, data);
    set((state) => ({ ncas: state.ncas.map((nca) => (nca.id === id ? item : nca)) }));
  },
  deleteNca: async (id) => {
    await deleteNcaApi(id);
    set((state) => ({ ncas: state.ncas.filter((nca) => nca.id !== id) }));
  },
}));
