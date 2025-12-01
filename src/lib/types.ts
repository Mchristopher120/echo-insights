export interface JournalEntry {
  id: string;
  audioUrl: string;
  duration: number;
  date: Date;
  insights?: string;
  transcript?: string;
}

export interface InsightResponse {
  summary: string;
  insights: string[];
  mood?: string;
  tags?: string[];
}
