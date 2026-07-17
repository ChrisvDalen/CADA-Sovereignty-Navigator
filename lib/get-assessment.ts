import { prisma } from "@/lib/prisma";
import { toAssessmentDto, type AssessmentDto } from "@/lib/types";

export async function getAssessment(id: string): Promise<AssessmentDto | null> {
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: { applications: { orderBy: { createdAt: "asc" } } },
  });
  return assessment ? toAssessmentDto(assessment) : null;
}
