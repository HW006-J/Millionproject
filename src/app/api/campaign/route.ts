import { NextResponse } from "next/server";
import { getCampaignStats } from "@/lib/campaign";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await getCampaignStats();

  if (!stats) {
    return NextResponse.json(
      { error: "Campaign data temporarily unavailable" },
      { status: 503 },
    );
  }

  return NextResponse.json(stats);
}
