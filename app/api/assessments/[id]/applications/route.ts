import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseApplicationPayload } from "@/lib/application-input";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({ where: { id } });
  if (!assessment) {
    return NextResponse.json({ error: "Sessie niet gevonden." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseApplicationPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data } = parsed;
  const application = await prisma.application.create({
    data: {
      assessmentId: id,
      name: data.name,
      dataTypes: JSON.stringify(data.dataTypes),
      regulations: JSON.stringify(data.regulations),
      impactLevel: data.impactLevel,
      criticalInfra: data.criticalInfra,
      suppliers: JSON.stringify(data.suppliers),
      supplierOther: data.supplierOther,
      recommendedLevel: data.recommendedLevel,
    },
  });

  return NextResponse.json(application, { status: 201 });
}
