import { NextResponse } from "next/server";
import { getShareData } from "@/lib/share";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ contributionId: string }> },
) {
  const { contributionId } = await params;
  const shareData = await getShareData(contributionId);

  if (!shareData) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json(shareData);
}
