export type TranscriptSegment = {
  end_seconds: number;
  start_seconds: number;
  text: string;
};

export type TranscriptOutput = {
  language: string | null;
  schema_version: "1.0";
  segments: TranscriptSegment[];
  text: string;
};

export type Observation = {
  confidence: number;
  kind: "OBSERVED" | "INFERRED";
  statement: string;
};

export type CreativeDNA = {
  assessment: {
    brand_specificity: number;
    evidence_limitations: string[];
    structural_reusability: number;
    why_it_may_work: string[];
  };
  identity: {
    advertiser_or_creator?: string | null;
    duration_seconds: number | null;
    format: string;
    industry?: string | null;
    platform: string;
    product_category?: string | null;
  };
  observations: Observation[];
  offer: Record<string, string | null>;
  opening: {
    confidence: number;
    curiosity_mechanism: string | null;
    first_spoken_line: string | null;
    first_visual: string | null;
    hook_type: string;
    pattern_interrupt: string | null;
    promise: string | null;
  };
  production: {
    audio_style: string | null;
    b_roll_usage: string | null;
    camera_style: string | null;
    creator_archetype: string | null;
    editing_speed: string | null;
    product_visibility: string | null;
    setting: string | null;
    shot_frequency: string | null;
    text_overlays: string[];
  };
  proof: { confidence: number; details: string[]; types: string[] };
  psychology: {
    awareness_stage: string | null;
    confidence: number;
    emotional_triggers: string[];
    identity_signals: string[];
    objections: string[];
    primary_desire: string | null;
    primary_problem: string | null;
  };
  schema_version: "1.0";
  story: {
    beat_map: Array<{ description: string; order: number; role: string }>;
    conflict: string | null;
    cta: string | null;
    resolution: string | null;
    reveal: string | null;
  };
};

export type Skeleton = {
  avoid_copying: string[];
  beats: Array<{
    constraints: string[];
    function: string;
    order: number;
    role: string;
  }>;
  canonical_text: string;
  name: string;
  one_sentence_structure: string;
  persuasion_mechanisms: string[];
  schema_version: "1.0";
  transfer_rules: string[];
};

export type RestrictedElement = {
  element_type:
    | "PHRASE"
    | "UNIQUE_FACT"
    | "METAPHOR"
    | "SCENE"
    | "CLAIM"
    | "NAME"
    | "OTHER";
  severity: number;
  value: string;
};

export type SkeletonExtraction = {
  restricted_elements: RestrictedElement[];
  schema_version: "1.0";
  skeleton: Skeleton;
};
