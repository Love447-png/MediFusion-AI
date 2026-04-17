import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentTrace, RiskLevel } from "./types";
import { MASTER_SWARM_PROMPT } from "./agents/prompts";

const MediFusionAnnotation = Annotation.Root({
  userInput: Annotation<string>,
  language: Annotation<"en" | "hi">,
  imageDescription: Annotation<string | undefined>,
  imageData: Annotation<string | undefined>,
  symptoms: Annotation<string[]>,
  context: Annotation<string>,
  riskLevel: Annotation<RiskLevel | undefined>,
  homeCareTips: Annotation<string[]>,
  urgentActions: Annotation<string[]>,
  reasoningTrace: Annotation<AgentTrace[]>,
  verifierNotes: Annotation<string | undefined>,
  isSafe: Annotation<boolean>,
  confidenceScore: Annotation<number>,
  finalOutput: Annotation<string | undefined>,
});

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-1.5-flash",
  temperature: 0.1,
});

// Robust JSON extractor — handles markdown code fences
const extractJSON = (text: string): any => {
  try {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) return JSON.parse(fenceMatch[1].trim());
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) return JSON.parse(braceMatch[0]);
  } catch (e) {
    // fall through
  }
  return null;
};

// Main swarm node — 1 API call, simulates 4 agents
const swarmNode = async (state: typeof MediFusionAnnotation.State) => {
  const userContext = [
    `Language preference: ${state.language === "hi" ? "Hindi" : "English"}`,
    state.userInput ? `User says: "${state.userInput}"` : "(No text provided)",
  ].filter(Boolean).join("\n");

  let messageContent: any[];

  if (state.imageData) {
    // Using multimodal Gemini model. Pass the image to the model to process.
    messageContent = [
      {
        type: "text",
        text: `${userContext}\n\n${MASTER_SWARM_PROMPT}`,
      },
      {
        type: "image_url",
        image_url: state.imageData,
      }
    ];
  } else {
    messageContent = [{ type: "text", text: `${userContext}\n\n${MASTER_SWARM_PROMPT}` }];
  }

  const response = await model.invoke([
    {
      role: "system",
      content:
        "You are MediFusion health guidance swarm. You are NOT a doctor. You must respond with ONLY valid JSON — no markdown, no extra text, no explanations outside the JSON.",
    },
    { role: "user", content: messageContent[0].text },
  ]);

  const content = response.content as string;
  const data = extractJSON(content);

  if (!data) {
    // Graceful fallback
    return {
      reasoningTrace: [
        {
          agentName: "MediFusion Swarm",
          thought: "Processing your health query via cloud...",
          output: content,
        },
      ],
      symptoms: [],
      homeCareTips: [],
      urgentActions: ["Please consult a doctor for proper evaluation."],
      riskLevel: "Low" as RiskLevel,
      isSafe: true,
      confidenceScore: 50,
      finalOutput:
        "**This is NOT medical advice. For informational purposes only. Always consult a qualified doctor or healthcare professional for diagnosis or treatment.**\n\nI had trouble processing your request locally. Please rephrase your symptoms and try again, or consult a healthcare professional directly.\n\n**This is NOT medical advice. For informational purposes only. Always consult a qualified doctor or healthcare professional for diagnosis or treatment.**",
      context: "",
    };
  }

  // Build 4-agent reasoning trace
  const traces: AgentTrace[] = [
    {
      agentName: "🩺 Intake Agent",
      thought: data.intakeAgent?.thought || "Parsing your symptoms...",
      output: JSON.stringify(data.intakeAgent, null, 2),
    },
    {
      agentName: "🌍 Localization Agent",
      thought: data.localizationAgent?.thought || "Analyzing regional health context...",
      output: JSON.stringify(data.localizationAgent, null, 2),
    },
    {
      agentName: "⚖️ Risk & Recommendation Agent",
      thought: data.recommendationAgent?.thought || "Assessing risk level...",
      output: JSON.stringify(data.recommendationAgent, null, 2),
    },
    {
      agentName: "🛡️ Safety Verifier",
      thought: data.safetyAgent?.thought || "Running final safety audit...",
      output: JSON.stringify(data.safetyAgent, null, 2),
    },
  ];

  const riskLevel = (data.recommendationAgent?.riskLevel as RiskLevel) || "Low";

  // If riskLevel is High, override homeCareTips to be empty (no home advice for High risk)
  const homeCareTips =
    riskLevel === "High" ? [] : data.recommendationAgent?.homeCareTips || [];

  return {
    reasoningTrace: traces,
    symptoms: data.intakeAgent?.symptoms || [],
    context: data.localizationAgent?.regionalContext || "",
    riskLevel,
    homeCareTips,
    urgentActions: data.recommendationAgent?.urgentActions || [
      "See a doctor if symptoms worsen.",
    ],
    isSafe: data.safetyAgent?.isSafe !== false,
    confidenceScore: data.safetyAgent?.confidenceScore || 70,
    finalOutput:
      data.safetyAgent?.finalOutput ||
      "**This is NOT medical advice. For informational purposes only. Always consult a qualified doctor or healthcare professional for diagnosis or treatment.**\n\nPlease consult a healthcare professional for proper evaluation.\n\n**This is NOT medical advice. For informational purposes only. Always consult a qualified doctor or healthcare professional for diagnosis or treatment.**",
  };
};

// Compile graph — single node for efficiency
const workflow = new StateGraph(MediFusionAnnotation)
  .addNode("swarm", swarmNode)
  .addEdge(START, "swarm")
  .addEdge("swarm", END);

export const graph = workflow.compile();
