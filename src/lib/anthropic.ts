import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/**
 * Lazily constructs the Anthropic client so a missing ANTHROPIC_API_KEY
 * surfaces as a clean, catchable error at call time (inside the tender
 * summary route) rather than crashing whichever route first imports this
 * module.
 */
export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it as an environment variable to enable AI tender summaries and cost estimates."
    );
  }
  if (!client) client = new Anthropic();
  return client;
}
