import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getTutorial } from "../tutorials";
import { tutorialBlocks } from "../tutorials-content.server";
import { getSessionUser } from "../auth.server";

const PREVIEW_BLOCKS = 4;

// Serves tutorial content with the membership gate enforced server-side:
// gated tutorials return only a preview unless the session user has
// All-Access.
export const getTutorialContent = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string().min(1).max(100) }))
  .handler(async ({ data }) => {
    const meta = getTutorial(data.slug);
    const blocks = tutorialBlocks[data.slug];
    if (!meta || !blocks) return null;

    if (!meta.gated) {
      return { meta, blocks, locked: false as const, lockedReason: null };
    }

    const user = await getSessionUser();
    if (user?.plan === "all-access") {
      return { meta, blocks, locked: false as const, lockedReason: null };
    }

    return {
      meta,
      blocks: blocks.slice(0, PREVIEW_BLOCKS),
      locked: true as const,
      lockedReason: user ? ("upgrade" as const) : ("signin" as const),
    };
  });
