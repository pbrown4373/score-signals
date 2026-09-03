import { z } from "zod";
import { type NextRequest } from "next/server";

import { getServerEnvironment } from "@/lib/env/server";
import { jsonError } from "@/lib/http/api";
import { MediaError } from "@/modules/media/errors";
import { requireMediaRequest } from "@/modules/media/http";
import { selectSourceAdapter } from "@/modules/media/source-adapters";
import { validatePublicSourceUrl } from "@/modules/media/ssrf";

const schema = z.object({ url: z.url() });

export async function POST(request: NextRequest) {
  try {
    await requireMediaRequest(true);
    const input = schema.parse(await request.json());
    const safeUrl = await validatePublicSourceUrl(input.url);
    const adapter = selectSourceAdapter(safeUrl.url, []);
    if (!adapter) {
      throw new MediaError(
        "CREATIVE_UNSUPPORTED_SOURCE",
        "No approved adapter supports this URL. Upload the video file instead.",
        400,
      );
    }
    const environment = getServerEnvironment();
    await adapter.importSource({
      policy: {
        maximumBytes: environment.MAX_UPLOAD_MB * 1_048_576,
        maximumRedirects: 3,
        timeoutMilliseconds: 15_000,
      },
      source: safeUrl,
    });
  } catch (cause) {
    return jsonError(cause);
  }
}
