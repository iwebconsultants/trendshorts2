
export enum AppStage {
  BRAINSTORM = 'BRAINSTORM',
  TECH_STACK = 'TECH_STACK',
  CONTENT_GENERATION = 'CONTENT_GENERATION'
}

export interface StrategyOption {
  id?: string; // Optional ID for tracking
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  estimatedCost: string;
  automationLevel: 'High' | 'Medium' | 'Low';
  trendMetrics: {
    score: number; // 0-100 relevance score
    dataPoints: number[]; // Array of 12 numbers for sparkline
    searchVolume: string; // e.g., "High", "Medium"
  };
  searchQuery: string; // For linking to ViewStats/Trends
  trendingReason?: string; // Explanation of why this is trending
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ShortConcept {
  topic: string;
  script: string;
  visualStyle: string;
  imagePrompts: string[];
  sources?: string[];
}

export enum IntegrationType {
  CONTENT = 'CONTENT',
  VIDEO = 'VIDEO',
  VOICE = 'VOICE',
  PUBLISHING = 'PUBLISHING'
}

export interface ToolOption {
  id: string;
  name: string;
  type: IntegrationType;
  description: string;
  required: boolean;
  selected: boolean;
}

// Interface for the injected AIStudio object
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}