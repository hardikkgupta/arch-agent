import { emitMermaid } from "./mermaidEmitter.js";
import { upsertReadmeSection } from "./readmePublisher.js";

// This is the test file
// lets you test two things:
// 1. The 
const graph = {}; // trivial for mvp
const block = emitMermaid(graph);

upsertReadmeSection("README.md", block);
console.log("README.md updated with hello diagram.");