export enum SessionEventType {
  OpenCard = "open_card",
  CloseCard = "close_card",
  CorrectAnswer = "correct_answer",
  WrongAnswer = "wrong_answer",
  Skip = "skip",
  Replay = "replay",
  VoiceRecording = "voice_recording",
  ImageZoom = "image_zoom",
  Hint = "hint",
  Exit = "exit",
  Resume = "resume",
  Pause = "pause",
}

export enum SessionEventOutcome {
  Success = "success",
  Failure = "failure",
  Skipped = "skipped",
  Neutral = "neutral",
}
