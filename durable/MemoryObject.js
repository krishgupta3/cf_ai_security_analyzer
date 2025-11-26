export class MemoryObject {
  constructor(state, env) {
    this.state = state;
  }

  async fetch(request) {
    const { pathname } = new URL(request.url);

    if (pathname === "/save") {
      const body = await request.json();
      await this.state.storage.put("history", body);
      return Response.json({ ok: true });
    }

    if (pathname === "/history") {
      const history = await this.state.storage.get("history") || [];
      return Response.json(history);
    }

    return new Response("Not found", { status: 404 });
  }
}
