import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; locale: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { id: appId, locale } = await params;

    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { id: true },
    });

    if (!app) {
      return apiError("NOT_FOUND", "App not found", 404);
    }

    const existing = await prisma.appLocalization.findUnique({
      where: {
        appId_locale: { appId, locale },
      },
    });

    if (!existing) {
      return apiError("NOT_FOUND", "Localization not found", 404);
    }

    await prisma.appLocalization.delete({
      where: {
        appId_locale: { appId, locale },
      },
    });

    return apiSuccess({ deleted: true, locale });
  } catch (err) {
    console.error("Localization DELETE error:", err);
    return apiError("INTERNAL_ERROR", "Failed to delete localization", 500);
  }
}
