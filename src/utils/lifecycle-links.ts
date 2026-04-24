import { Comment } from "@/types";

const LIFECYCLE_LINK_PREFIX = "[VINCULO_CICLO]";

export interface LifecycleLinks {
  onboardingId?: string;
  offboardingIds: string[];
}

function parseLink(text: string): { kind: "onboarding" | "offboarding"; id: string } | null {
  if (!text.startsWith(LIFECYCLE_LINK_PREFIX)) return null;

  const raw = text.replace(LIFECYCLE_LINK_PREFIX, "").trim();
  const [kindRaw, idRaw] = raw.split(":");
  const kind = (kindRaw || "").trim();
  const id = (idRaw || "").trim();

  if (!id) return null;
  if (kind === "onboarding") return { kind: "onboarding", id };
  if (kind === "offboarding") return { kind: "offboarding", id };

  return null;
}

export function buildLifecycleLinkComment(
  kind: "onboarding" | "offboarding",
  id: string,
  actorName = "SISTEMA"
): Comment {
  return {
    id: crypto.randomUUID(),
    userId: "system",
    userName: actorName,
    text: `${LIFECYCLE_LINK_PREFIX} ${kind}:${id}`,
    createdAt: new Date().toISOString(),
  };
}

export function extractLifecycleLinks(comments: unknown): LifecycleLinks {
  const list = Array.isArray(comments) ? comments : [];
  let onboardingId: string | undefined;
  const offboardingIds: string[] = [];

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const text = (item as { text?: unknown }).text;
    if (typeof text !== "string") continue;

    const parsed = parseLink(text);
    if (!parsed) continue;

    if (parsed.kind === "onboarding" && !onboardingId) onboardingId = parsed.id;
    if (parsed.kind === "offboarding") offboardingIds.push(parsed.id);
  }

  return { onboardingId, offboardingIds };
}
