export enum CitationStyle {
  MLA = 'MLA',
  APA = 'APA',
}

export enum FormattingTask {
  General = 'General Formatting',
  Abstract = 'Abstract Analysis',
  GenerateAbstract = 'Generate Abstract & Keywords',
  ReferenceAnalysis = 'Reference Analysis',
}

export interface HistoryItem {
  id: number;
  input: string;
  output: string;
  task: FormattingTask;
  timestamp: string;
}
