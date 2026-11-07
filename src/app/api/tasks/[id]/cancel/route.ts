import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cancelTaskCompletion } from "@/lib/tasks";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { completionId } = body;

    if (!completionId) {
      return NextResponse.json(
        { error: "Identifiant de session manquant." },
        { status: 400 }
      );
    }

    const result = await cancelTaskCompletion(completionId, user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Impossible d'annuler cette tâche." },
      { status: 400 }
    );
  }
}

