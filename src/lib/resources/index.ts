import manifestData from "./ufli-resources.v1.json";

import type { UfliResourceManifestV1 } from "./types";

export type { UfliLessonResource, UfliResourceLinks, UfliResourceManifestV1 } from "./types";

export const ufliResourceManifest = manifestData as UfliResourceManifestV1;
