import { z } from "zod";

export const AgentTraceSchema = z.object({
  agentName: z.string(),
  thought: z.string(),
  action: z.string().optional(),
  output: z.string().optional(),
});

export type AgentTrace = z.infer<typeof AgentTraceSchema>;

export type RiskLevel = "Low" | "Medium" | "High";

export interface MediFusionState {
  userInput: string;
  language: "en" | "hi";
  imageDescription?: string;
  symptoms: string[];
  context: string;
  riskLevel?: RiskLevel;
  homeCareTips: string[];
  urgentActions: string[];
  reasoningTrace: AgentTrace[];
  verifierNotes?: string;
  isSafe: boolean;
  confidenceScore: number;
}
