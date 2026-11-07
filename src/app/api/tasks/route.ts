import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAvailableTasks } from "@/lib/tasks";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") as
    | "TIKTOK"
    | "YOUTUBE"
    | "INSTAGRAM"
    | null;
  const actionType = searchParams.get("actionType") as "LIKE" | "COMMENT" | "SUBSCRIBE" | null;

  try {
    const result = await getAvailableTasks(user.id, {
      platform: platform || undefined,
      actionType: actionType || undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération des tâches." },
      { status: 400 }
    );
  }
}

