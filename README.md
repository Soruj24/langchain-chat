# Client

Next.js 16 chat UI for the LangGraph agent in `../server`.

The interface is Claude-inspired: warm palette, serif assistant prose, a
thread sidebar, dark mode, streaming reasoning/tool cards, and a docked
composer.

## Run

```bash
npm install
npm run dev
```

The app expects the LangGraph server at `http://localhost:4000`. Override it
with `NEXT_PUBLIC_LANGGRAPH_URL` in `.env.local`.

## Quality checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

See the [root README](../README.md) for full setup and project structure.
