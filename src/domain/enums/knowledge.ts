export enum KnowledgeSourceType {
  Pdf = "pdf",
  Photograph = "photograph",
  Scan = "scan",
  Book = "book",
  Handout = "handout",
}

export enum KnowledgeSourceProcessingStatus {
  Uploaded = "uploaded",
  Queued = "queued",
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
}

export enum AtomRelationshipType {
  Prerequisite = "prerequisite",
  PartOf = "part_of",
  Contains = "contains",
  Cause = "cause",
  Consequence = "consequence",
  Analogy = "analogy",
  Contrast = "contrast",
  Dependency = "dependency",
  Equivalence = "equivalence",
  Generalization = "generalization",
  Specialization = "specialization",
}

export enum CognitiveDependencyStrength {
  Strong = "strong",
  Weak = "weak",
}

export enum LearningObjective {
  Know = "know",
  Understand = "understand",
  Connect = "connect",
  Distinguish = "distinguish",
  Apply = "apply",
  Recall = "recall",
  Transfer = "transfer",
}
