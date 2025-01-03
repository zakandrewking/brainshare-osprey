/**
 * NOTE react server actions don't have abort signals, but supabase might adopt
 * these for edge functions at some
 * point https://github.com/orgs/supabase/discussions/17715
 *
 * That would be really nice for long-running LLM requests.
 */

"use server";

import OpenAI from "openai";

import { Identification } from "@/stores/table-store";
import { generateTypePrompt } from "@/utils/column-types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function identifyColumn(
  columnName: string,
  sampleValues: string[]
): Promise<Identification> {
  try {
    const prompt = `Analyze this column of data:
Column Name: ${columnName}
Sample Values: ${sampleValues.join(", ")}

${generateTypePrompt()}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(response) as Identification;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    console.error("Error identifying column:", error);
    return {
      type: "unknown",
      description: "Failed to identify column type",
      suggestedActions: [],
    };
  }
}
