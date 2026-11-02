import { Client } from "./node_modules/@langchain/react/node_modules/@langchain/langgraph-sdk/dist/client.js";

const client = new Client({ apiUrl: "http://localhost:4000" });
const thread = await client.threads.create();

const stream = client.runs.stream(thread.thread_id, "ai_elements", {
  input: { messages: [{ type: "human", content: "What is 6*7? Use the calculator tool." }] },
  streamMode: ["values"],
});

let lastValues = null;
for await (const chunk of stream) {
  if (chunk.event === "values" && chunk.data?.messages) lastValues = chunk.data;
}

console.log("--- values event messages ---");
for (const m of lastValues?.messages ?? []) {
  console.log(
    JSON.stringify({
      type: m.type,
      content: typeof m.content === "string" ? m.content.slice(0, 40) : m.content,
      additional_kwargs: m.additional_kwargs,
      response_metadata: m.response_metadata,
      tool_calls: m.tool_calls?.length ?? 0,
    }).slice(0, 700)
  );
}
