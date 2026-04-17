import { NextRequest, NextResponse } from "next/server";
import { graph } from "@/lib/graph";

export async function POST(req: NextRequest) {
  try {
    // Removed API_KEY check — running locally on Ollama

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
    
    // Friendly error specifically tailored to a dead Ollama server
    if (msg.includes("fetch") || msg.includes("ECONNREFUSED") || msg.includes("EADDRNOTAVAIL") || msg.includes("failed to fetch")) {
      return NextResponse.json(
        { error: "Local Ollama server is unreachable. Please make sure the Ollama app is running locally (http://localhost:11434)." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: msg || "An unexpected error occurred connecting to the local AI." }, { status: 500 });
  }
}
