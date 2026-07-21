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

    const user = await getSessionUser();
    const viewer = {
      signedIn: Boolean(user),
      allAccess: user?.plan === "all-access",
    };

    if (!meta.gated || viewer.allAccess) {
      return { meta, blocks, locked: false as const, lockedReason: null, viewer };
    }

    return {
      meta,
      blocks: blocks.slice(0, PREVIEW_BLOCKS),
      locked: true as const,
      lockedReason: user ? ("upgrade" as const) : ("signin" as const),
      viewer,
    };
  });
