import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseApplicationPayload } from "@/lib/application-input";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = parseApplicationPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data } = parsed;
  const application = await prisma.application
    .update({
      where: { id },
      data: {
        name: data.name,
        dataTypes: JSON.stringify(data.dataTypes),
        regulations: JSON.stringify(data.regulations),
        impactLevel: data.impactLevel,
        criticalInfra: data.criticalInfra,
        suppliers: JSON.stringify(data.suppliers),
        supplierOther: data.supplierOther,
        recommendedLevel: data.recommendedLevel,
      },
    })
    .catch(() => null);

  if (!application) {
    return NextResponse.json(
      { error: "Toepassing niet gevonden." },
      { status: 404 }
    );
  }
  return NextResponse.json(application);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await prisma.application
    .delete({ where: { id } })
    .catch(() => null);

  if (!deleted) {
    return NextResponse.json(
      { error: "Toepassing niet gevonden." },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
