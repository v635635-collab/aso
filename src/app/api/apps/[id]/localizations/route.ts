import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { id: appId } = await params;

    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { id: true },
    });

    if (!app) {
      return apiError("NOT_FOUND", "App not found", 404);
    }

    const localizations = await prisma.appLocalization.findMany({
      where: { appId },
      orderBy: { locale: "asc" },
    });

    return apiSuccess(localizations);
  } catch (err) {
    console.error("Localizations GET error:", err);
    return apiError("INTERNAL_ERROR", "Failed to load localizations", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { id: appId } = await params;

    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { id: true },
    });

    if (!app) {
      return apiError("NOT_FOUND", "App not found", 404);
    }

    const body = await request.json();
    const { locale, title, subtitle, keywordField, description, isApplied } =
      body as {
        locale: string;
        title?: string;
        subtitle?: string;
        keywordField?: string;
        description?: string;
        isApplied?: boolean;
      };

    if (!locale) {
      return apiError(
        "VALIDATION_ERROR",
        "locale is required",
        400
      );
    }

    const localization = await prisma.appLocalization.upsert({
      where: {
        appId_locale: { appId, locale },
      },
      create: {
        appId,
        locale,
        title: title ?? null,
        subtitle: subtitle ?? null,
        keywordField: keywordField ?? null,
        description: description ?? null,
        generatedBy: "manual",
        isApplied: isApplied ?? false,
      },
      update: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(keywordField !== undefined && { keywordField }),
        ...(description !== undefined && { description }),
        ...(isApplied !== undefined && { isApplied }),
      },
    });

    return apiSuccess(localization);
  } catch (err) {
    console.error("Localizations POST error:", err);
    return apiError("INTERNAL_ERROR", "Failed to save localization", 500);
  }
}
