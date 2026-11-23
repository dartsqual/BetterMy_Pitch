import { errorResponse, readJson } from "@/lib/api";
import { frameworkLabel } from "@/lib/catalog";
import { db } from "@/lib/db";
import { CreateSessionInput } from "@/lib/schemas";

// POST /api/sessions — create a practice session from the configurator.
export async function POST(req: Request) {
  try {
    const input = CreateSessionInput.parse(await readJson(req));
    if (input.saveAsTemplate) {
      await db.personaTemplate.create({
        data: { name: input.personaName, title: input.personaTitle, brief: input.personaBrief },
      });
    }
    const session = await db.session.create({
      data: {
        title: `${input.personaTitle} · ${frameworkLabel(input.framework)}`,
        product: input.product,
        personaId: input.personaId,
        personaName: input.personaName,
        personaBrief: `${input.personaTitle}. ${input.personaBrief}`,
        difficulty: input.difficulty,
        framework: input.framework,
        customFlow: input.framework === "custom" ? input.customFlow : null,
        language: input.language,
      },
    });
    return Response.json({ id: session.id }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
