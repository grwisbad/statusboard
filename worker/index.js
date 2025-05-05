export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle status requests
    if (url.pathname === "/statuses") {
      return handleStatuses(request, env);
    }
    
    return new Response("Not found", { status: 404 });
  }
};

async function handleStatuses(request, env) {
  try {
    // Handle GET requests
    if (request.method === "GET") {
      // Get all statuses from D1 database
      const { results } = await env.STATUS_DB.prepare(
        "SELECT * FROM statuses ORDER BY ts DESC"
      ).all();
      
      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Handle POST requests
    if (request.method === "POST") {
      const data = await request.json();
      
      // Validate required fields
      if (!data.name || !data.status) {
        return new Response(JSON.stringify({ error: "Name and status are required" }), { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Insert the status into the D1 database
      await env.STATUS_DB.prepare(
        "INSERT INTO statuses (name, status) VALUES (?, ?)"
      )
      .bind(data.name, data.status)
      .run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error handling statuses:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
