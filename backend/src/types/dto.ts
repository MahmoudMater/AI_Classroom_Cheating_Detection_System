export interface StartSessionRequest {
  session_id: string;
  exam_id?: string;
  student_id?: string;
  video_source?: string;
}

export interface EndSessionRequest {
  session_id: string;
}

export interface AiAlertRequest {
  session_id: string;
  timestamp: string;
  detections?: {
    phone_detected?: boolean;
    head_direction?: string;
    movement_level?: string;
  };
  suspicious_events: Array<{
    type: string;
    confidence: number;
    severity?: "low" | "medium" | "high";
  }>;
  snapshot_url?: string;
  meta?: Record<string, unknown>;
}
