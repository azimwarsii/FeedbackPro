export type AdminUser = {
  _id?: string;
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCampaign = {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  responses?: number;
  user?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminSurvey = {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  responses?: number;
  user?: string;
  createdAt?: string;
  updatedAt?: string;
};

type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; status?: number; error: string };

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function adminGet<T>(path: string): Promise<FetchResult<T>> {
  try {
    const res = await fetch(path, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      const body = await safeJson(res);
      return {
        ok: false,
        status: res.status,
        error: body?.error || body?.message || `Request failed (${res.status})`,
      };
    }
    const body = await safeJson(res);
    return { ok: true, data: (body?.data ?? body) as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

export function fetchAdminUsers() {
  return adminGet<{ users: AdminUser[] } | AdminUser[]>("/api/admin/users");
}

export function fetchAdminCampaigns() {
  return adminGet<{ campaigns: AdminCampaign[] } | AdminCampaign[]>("/api/admin/campaigns");
}

export function fetchAdminSurveys() {
  return adminGet<{ surveys: AdminSurvey[] } | AdminSurvey[]>("/api/admin/surveys");
}

export function fetchAdminOverview() {
  return adminGet<{
    users?: number;
    campaigns?: number;
    surveys?: number;
    responses?: number;
  }>("/api/admin/overview");
}

