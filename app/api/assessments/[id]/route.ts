import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: { applications: { orderBy: { createdAt: "asc" } } },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Sessie niet gevonden." }, { status: 404 });
  }
  return NextResponse.json(assessment);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const orgName = typeof body?.orgName === "string" ? body.orgName.trim() : "";

  if (!orgName) {
    return NextResponse.json(
      { error: "Organisatienaam is verplicht." },
      { status: 400 }
    );
  }

  const assessment = await prisma.assessment
    .update({ where: { id }, data: { orgName } })
    .catch(() => null);

  if (!assessment) {
    return NextResponse.json({ error: "Sessie niet gevonden." }, { status: 404 });
  }
  return NextResponse.json(assessment);
}
