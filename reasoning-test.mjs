import { Client } from "./node_modules/@langchain/react/node_modules/@langchain/langgraph-sdk/dist/client.js";
import { AIMessage, mergeMessageRuns } from "@langchain/core/messages";

const client = new Client({ apiUrl: "http://localhost:4000" });
const thread = await client.threads.create();

const stream = client.runs.stream(thread.thread_id, "ai_elements", {
  input: { messages: [{ type: "human", content: "What is 6*7? Use the calculator tool." }] },
  streamMode: ["messages-tuple"],
});

const deltas = [];
for await (const chunk of stream) {
  const data = chunk.data;
  if (!Array.isArray(data) || data.length === 0) continue;
  deltas.push(new AIMessage(data[0]));
}

const merged = mergeMessageRuns(deltas);
console.log("merged count:", merged.length);
const last = merged.at(-1);
console.log("merged last content:", JSON.stringify(last?.content)?.slice(0, 120));
console.log("merged last reasoning:", JSON.stringify(last?.additional_kwargs)?.slice(0, 200));
console.log("merged last contentBlocks:", JSON.stringify(last?.contentBlocks)?.slice(0, 300));

const state = await client.threads.getState(thread.thread_id);
console.log("--- state messages ---");
for (const m of state.values.messages) {
  console.log(
    m.type,
    "content=", JSON.stringify(typeof m.content === "string" ? m.content : m.content)?.slice(0, 60),
    "reasoning=", JSON.stringify(m.additional_kwargs?.reasoning_content)?.slice(0, 80),
    "tools=", m.tool_calls?.length ?? 0
  );
}
const lastStateAi = [...state.values.messages].reverse().find((m) => m.type === "ai");
const ai = new AIMessage(lastStateAi);
console.log("state ai contentBlocks:", JSON.stringify(ai.contentBlocks)?.slice(0, 400));
console.log("state ai reasoning:", JSON.stringify(ai.contentBlocks.find((b) => b.type === "reasoning")?.reasoning)?.slice(0, 200));
