export default {
    async fetch(request, env) {
      const url = new URL(request.url);
  
      // GET  /statuses
      if (request.method === 'GET' && url.pathname === '/statuses') {
        const { results } = await env.STATUS_DB
          .prepare('SELECT id, name, status, ts FROM statuses ORDER BY ts DESC')
          .all();
        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      // POST /statuses
      if (request.method === 'POST' && url.pathname === '/statuses') {
        let data;
        try {
          data = await request.json();
        } catch {
          return new Response('Invalid JSON', { status: 400 });
        }
        const { name, status } = data;
        if (!name || !status) {
          return new Response('Missing name or status', { status: 400 });
        }
        // Insert new status
        const insert = await env.STATUS_DB
          .prepare('INSERT INTO statuses (name, status) VALUES (?, ?)')
          .run(name, status);
        // Fetch and return the inserted row
        const { results } = await env.STATUS_DB
          .prepare('SELECT id, name, status, ts FROM statuses WHERE id = ?')
          .all(insert.lastInsertRowid);
        return new Response(JSON.stringify(results[0]), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      // Fallback
      return new Response('Not Found', { status: 404 });
    },
  };  