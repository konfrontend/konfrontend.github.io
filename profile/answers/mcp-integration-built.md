---
question: Describe an MCP integration you've built.
---
I built the MCP server for Loadster, https://loadster.com: 23 tools, each covered by tests, that let AI agents use the private Loadster API under role-based access control, tested on the Claude Platform before release. A harness runs scripted prompts with a real agent and records every tool call, and I rerun it before any tool description change ships.
