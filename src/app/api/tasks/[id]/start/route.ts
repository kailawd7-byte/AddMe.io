import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { startTask } from "@/lib/tasks";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const result = await startTask(id, user.id, {
      ip: clientIp,
      userAgent,
    });

    return NextResponse.json({
      ...result,
      session: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Impossible de démarrer la tâche." },
      { status: 400 }
    );
  }
}

