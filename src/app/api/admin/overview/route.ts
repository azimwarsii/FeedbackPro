import { adminBackendGet } from "@/app/api/admin/_backendFetch";

export async function GET() {
  return adminBackendGet("/admin/overview");
}

