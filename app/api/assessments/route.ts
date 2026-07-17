import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const orgName = typeof body?.orgName === "string" ? body.orgName.trim() : "";

  if (!orgName) {
    return NextResponse.json(
      { error: "Organisatienaam is verplicht." },
      { status: 400 }
    );
  }

  const assessment = await prisma.assessment.create({ data: { orgName } });
  return NextResponse.json(assessment, { status: 201 });
}
