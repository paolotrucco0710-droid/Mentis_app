import { z } from "zod";
import type { Image } from "@/domain/entities/image";
import type { KnowledgeJsonAtom } from "@/domain/knowledge/knowledge-json";
import { env } from "@/lib/env";
import {
  buildSemanticImageLinkCacheKey,
  estimateModelCost,
  hashText,
  readCacheResult,
  runChatCompletion,
  writeCacheResult,
  type UsageTracker,
} from "./optimization";

const semanticLinkSchema = z.object({
  links: z
    .array(
      z.object({
        atomIndex: z.number().int().nonnegative(),
        imageIndex: z.number().int().nonnegative(),
        confidence: z.number().min(0).max(1),
      })
    )
    .max(80),
});

export interface SemanticImageLink {
  atomIndex: number;
  imageIndex: number;
  confidence: number;
}

export interface SemanticImageLinkCandidate {
  atom: KnowledgeJsonAtom;
  atomIndex: number;
}

export interface SemanticImageLinkTarget {
  image: Image;
  imageIndex: number;
}

const ITALIAN_STOP_WORDS = new Set([
  "a",
  "ad",
  "al",
  "alla",
  "alle",
  "altro",
  "anche",
  "che",
  "con",
  "da",
  "dei",
  "del",
  "della",
  "delle",
  "di",
  "e",
  "ed",
  "era",
  "essere",
  "fra",
  "gli",
  "ha",
  "il",
  "in",
  "la",
  "le",
  "lo",
  "ma",
  "nel",
  "nella",
  "non",
  "o",
  "per",
  "piu",
  "quale",
  "quando",
  "quella",
  "quello",
  "sono",
  "su",
  "sua",
  "suo",
  "tra",
  "un",
  "una",
  "uno",
]);

export const SEMANTIC_IMAGE_LINK_MIN_CONFIDENCE = 0.58;

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .split(/[^a-z0-9]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !ITALIAN_STOP_WORDS.has(token))
  );
}

function imageSemanticText(image: Image): string {
  return image.caption?.trim() ?? "";
}

const STEM_PREFIX_LENGTH = 5;

function termOverlapWeight(atomTerm: string, imageTerm: string): number {
  if (atomTerm === imageTerm) {
    return 1;
  }

  if (
    atomTerm.length >= STEM_PREFIX_LENGTH &&
    imageTerm.length >= STEM_PREFIX_LENGTH
  ) {
    const atomStem = atomTerm.slice(0, STEM_PREFIX_LENGTH);
    const imageStem = imageTerm.slice(0, STEM_PREFIX_LENGTH);
    if (atomStem === imageStem) {
      return 0.65;
    }
  }

  return 0;
}

function scoreTermOverlap(atomTerms: Set<string>, imageTerms: Set<string>): number {
  let overlap = 0;

  for (const atomTerm of atomTerms) {
    let bestMatch = 0;
    for (const imageTerm of imageTerms) {
      bestMatch = Math.max(bestMatch, termOverlapWeight(atomTerm, imageTerm));
    }
    overlap += bestMatch;
  }

  return overlap;
}

export function scoreSemanticImageMatch(
  atom: KnowledgeJsonAtom,
  image: Image
): number {
  const atomTerms = tokenize(
    `${atom.title} ${atom.summary} ${atom.keywords.join(" ")} ${atom.aliases.join(" ")}`
  );
  const imageTerms = tokenize(imageSemanticText(image));

  if (atomTerms.size === 0 || imageTerms.size === 0) {
    return 0;
  }

  const overlap = scoreTermOverlap(atomTerms, imageTerms);
  const titleTerms = tokenize(atom.title);
  const titleOverlap = scoreTermOverlap(titleTerms, imageTerms);
  const union = new Set([...atomTerms, ...imageTerms]).size;
  const jaccard = union > 0 ? overlap / union : 0;
  const titleBoost =
    titleTerms.size > 0 ? (titleOverlap / titleTerms.size) * 0.35 : 0;

  return Math.min(1, jaccard + titleBoost);
}

export function parseSemanticImageLinks(content: string): SemanticImageLink[] {
  try {
    const payload = JSON.parse(content) as unknown;
    const parsed = semanticLinkSchema.parse(payload);

    return parsed.links.map((link) => ({
      atomIndex: link.atomIndex,
      imageIndex: link.imageIndex,
      confidence: link.confidence,
    }));
  } catch {
    return [];
  }
}

export function findHeuristicSemanticImageLinks(
  atoms: SemanticImageLinkCandidate[],
  images: SemanticImageLinkTarget[],
  minConfidence = SEMANTIC_IMAGE_LINK_MIN_CONFIDENCE
): SemanticImageLink[] {
  const scored: SemanticImageLink[] = [];

  for (const { atom, atomIndex } of atoms) {
    for (const { image, imageIndex } of images) {
      const confidence = scoreSemanticImageMatch(atom, image);
      if (confidence >= minConfidence) {
        scored.push({ atomIndex, imageIndex, confidence });
      }
    }
  }

  return selectGreedySemanticLinks(scored);
}

export function selectGreedySemanticLinks(
  links: SemanticImageLink[]
): SemanticImageLink[] {
  const selected: SemanticImageLink[] = [];
  const usedAtoms = new Set<number>();
  const usedImages = new Set<number>();

  for (const link of [...links].sort((left, right) => right.confidence - left.confidence)) {
    if (usedAtoms.has(link.atomIndex) || usedImages.has(link.imageIndex)) {
      continue;
    }

    usedAtoms.add(link.atomIndex);
    usedImages.add(link.imageIndex);
    selected.push(link);
  }

  return selected;
}

function buildSemanticLinkingPrompt(
  atoms: SemanticImageLinkCandidate[],
  images: SemanticImageLinkTarget[]
): string {
  const atomLines = atoms
    .map(
      ({ atom, atomIndex }) =>
        `[${atomIndex}] ${atom.title} — ${atom.summary} | keywords: ${atom.keywords.slice(0, 6).join(", ")}`
    )
    .join("\n");

  const imageLines = images
    .map(
      ({ image, imageIndex }) =>
        `[${imageIndex}] pagina ${image.pageNumber ?? "?"} — ${imageSemanticText(image) || "Figura senza didascalia"}`
    )
    .join("\n");

  return `Collega ogni illustrazione didattica al concetto più pertinente.

Regole:
- Usa solo abbinamenti davvero pertinenti.
- Ogni atomo può ricevere al massimo 1 immagine.
- Ogni immagine può essere usata al massimo 1 volta.
- Se un abbinamento è incerto, omettilo.
- confidence tra 0 e 1.

Concetti:
${atomLines}

Illustrazioni:
${imageLines}

Rispondi SOLO con JSON:
{
  "links": [
    { "atomIndex": 0, "imageIndex": 1, "confidence": 0.86 }
  ]
}`;
}

function buildSemanticLinkingCachePayload(
  atoms: SemanticImageLinkCandidate[],
  images: SemanticImageLinkTarget[]
): string {
  return JSON.stringify({
    atoms: atoms.map(({ atom, atomIndex }) => ({
      atomIndex,
      title: atom.title,
      summary: atom.summary,
      keywords: atom.keywords,
    })),
    images: images.map(({ image, imageIndex }) => ({
      imageIndex,
      imageId: image.id,
      caption: image.caption,
      pageNumber: image.pageNumber,
    })),
  });
}

async function fetchSemanticImageLinksViaLlm(
  atoms: SemanticImageLinkCandidate[],
  images: SemanticImageLinkTarget[],
  tracker: UsageTracker
): Promise<SemanticImageLink[]> {
  const cacheKey = buildSemanticImageLinkCacheKey({
    payloadHash: hashText(buildSemanticLinkingCachePayload(atoms, images)),
    promptVersion: env.aiPromptVersion,
    model: env.aiReasoningModel,
  });

  const cached = await readCacheResult<string>(cacheKey);
  if (cached) {
    tracker.recordCacheHit();
    return parseSemanticImageLinks(cached.value).filter(
      (link) => link.confidence >= SEMANTIC_IMAGE_LINK_MIN_CONFIDENCE
    );
  }

  tracker.recordCacheMiss();

  const response = await runChatCompletion(
    {
      model: env.aiReasoningModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Sei un curatore didattico di Mentis. Colleghi illustrazioni a concetti atomici con precisione e prudenza.",
        },
        {
          role: "user",
          content: buildSemanticLinkingPrompt(atoms, images),
        },
      ],
      temperature: 0,
      max_tokens: 2048,
    },
    tracker
  );

  const content = response.choices[0]?.message?.content ?? '{"links":[]}';
  const usage = response.usage;
  const inputTokens = usage?.prompt_tokens ?? 0;
  const outputTokens = usage?.completion_tokens ?? 0;
  const payloadHash = hashText(buildSemanticLinkingCachePayload(atoms, images));

  await writeCacheResult({
    cacheKey,
    kind: "extraction",
    contentHash: payloadHash,
    model: env.aiReasoningModel,
    promptVersion: env.aiPromptVersion,
    result: content,
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateModelCost(
      env.aiReasoningModel,
      inputTokens,
      outputTokens
    ),
  });

  return parseSemanticImageLinks(content).filter(
    (link) => link.confidence >= SEMANTIC_IMAGE_LINK_MIN_CONFIDENCE
  );
}

export async function resolveSemanticImageLinks(
  atoms: SemanticImageLinkCandidate[],
  images: SemanticImageLinkTarget[],
  tracker?: UsageTracker
): Promise<SemanticImageLink[]> {
  if (atoms.length === 0 || images.length === 0) {
    return [];
  }

  if (tracker && env.openaiApiKey) {
    try {
      const llmLinks = await fetchSemanticImageLinksViaLlm(atoms, images, tracker);
      if (llmLinks.length > 0) {
        return selectGreedySemanticLinks(llmLinks);
      }
    } catch {
      // Fall back to local semantic scoring when the model call fails.
    }
  }

  return findHeuristicSemanticImageLinks(atoms, images);
}
