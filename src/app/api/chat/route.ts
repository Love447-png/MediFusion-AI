import { NextRequest, NextResponse } from "next/server";
import { graph } from "@/lib/graph";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API Key is not configured." }, { status: 500 });
    }

    const { message, language, imageData } = await req.json();

    const initialState = {
      userInput: message || "",
      language: language || "en",
      imageDescription: undefined,
      imageData: imageData,
      symptoms: [],
      context: "",
      homeCareTips: [],
      urgentActions: [],
      reasoningTrace: [],
      isSafe: true,
      confidenceScore: 0,
      finalOutput: "",
    };

    const result = await graph.invoke(initialState);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Agent Swarm Error:", error);

    const msg: string = error?.message || "";
    
    return NextResponse.json({ error: msg || "An unexpected error occurred connecting to the Gemini AI." }, { status: 500 });
  }
}
