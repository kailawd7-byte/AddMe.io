import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { submitTaskCompletion } from "@/lib/tasks";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { completionId, screenshotUrl } = body;

    if (!completionId) {
      return NextResponse.json(
        { error: "Identifiant de complétion de tâche manquant." },
        { status: 400 }
      );
    }

    const result = await submitTaskCompletion(completionId, user.id, {
      screenshotUrl,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erreur validation tâche:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la validation de la tâche." },
      { status: 400 }
    );
  }
}

