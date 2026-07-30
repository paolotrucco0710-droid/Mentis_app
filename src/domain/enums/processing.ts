export enum UploadStatus {
  Pending = "pending",
  Uploading = "uploading",
  Completed = "completed",
  Failed = "failed",
}

export enum AIJobStatus {
  Queued = "queued",
  Running = "running",
  Retry = "retry",
  Completed = "completed",
  Failed = "failed",
}

export enum AIJobStep {
  Ocr = "ocr",
  TextCleaning = "text_cleaning",
  StructureRecognition = "structure_recognition",
  ImageExtraction = "image_extraction",
  LlmExtraction = "llm_extraction",
  JsonValidation = "json_validation",
  Normalization = "normalization",
  Persistence = "persistence",
}
