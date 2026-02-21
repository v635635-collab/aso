import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { generateLocalizations } from "@/lib/localization/generator";

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
      select: { id: true, locale: true },
    });

    if (!app) {
      return apiError("NOT_FOUND", "App not found", 404);
    }

    const body = await request.json();
    const { targetLocales, sourceLocale } = body as {
      targetLocales: string[];
      sourceLocale?: string;
    };

    if (!targetLocales || !Array.isArray(targetLocales) || targetLocales.length === 0) {
      return apiError(
        "VALIDATION_ERROR",
        "targetLocales must be a non-empty array of locale codes",
        400
      );
    }

    if (targetLocales.length > 10) {
      return apiError(
        "VALIDATION_ERROR",
        "Maximum 10 target locales per request",
        400
      );
    }

    const results = await generateLocalizations({
      appId,
      sourceLocale: sourceLocale ?? app.locale,
      targetLocales,
    });

    return apiSuccess({
      generated: results.length,
      localizations: results,
    });
  } catch (err) {
    console.error("Localization generation error:", err);
    return apiError(
      "INTERNAL_ERROR",
      "Failed to generate localizations",
      500
    );
  }
}
