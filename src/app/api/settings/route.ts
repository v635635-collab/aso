import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const settings = await prisma.systemSettings.findMany({
      orderBy: [{ category: "asc" }, { label: "asc" }],
    });

    const sanitized = settings.map((s) => ({
      ...s,
      value: s.isSecret ? maskSecret(s.value) : s.value,
    }));

    return apiSuccess(sanitized);
  } catch (err) {
    console.error("Settings GET error:", err);
    return apiError("INTERNAL_ERROR", "Failed to load settings", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }
    if (user.role !== "ADMIN") {
      return apiError("FORBIDDEN", "Admin access required", 403);
    }

    const body = await request.json();
    let updates: Array<{ key: string; value: unknown }>;

    if (Array.isArray(body.settings)) {
      updates = body.settings;
    } else {
      updates = Object.entries(body).map(([key, value]) => ({ key, value }));
    }

    if (updates.length === 0) {
      return apiError("VALIDATION_ERROR", "No settings to update", 400);
    }

    const results = await Promise.all(
      updates.map((u) =>
        prisma.systemSettings.update({
          where: { key: u.key },
          data: { value: u.value as never, updatedBy: user.id },
        })
      )
    );

    return apiSuccess(results);
  } catch (err) {
    console.error("Settings PATCH error:", err);
    return apiError("INTERNAL_ERROR", "Failed to update settings", 500);
  }
}

function maskSecret(value: unknown): string {
  const str = String(value ?? "");
  if (str.length <= 4) return "••••";
  return "••••" + str.slice(-4);
}
