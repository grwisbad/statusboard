export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Allow CORS for all origins (adjust if needed for security)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Handle status requests
    if (url.pathname === "/statuses") {
      // Pass CORS headers to the handler
      return handleStatuses(request, env, corsHeaders);
    }

    // Default response for other paths
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }
};

// Modified handler to include DELETE and CORS headers
async function handleStatuses(request, env, corsHeaders) {
  try {
    // Handle GET requests
    if (request.method === "GET") {
      const { results } = await env.STATUS_DB.prepare(
        "SELECT * FROM statuses ORDER BY ts DESC"
      ).all();

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Handle POST requests
    if (request.method === "POST") {
      const data = await request.json();

      if (!data.name || !data.status) {
        return new Response(JSON.stringify({ error: "Name and status are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      await env.STATUS_DB.prepare(
        "INSERT INTO statuses (name, status) VALUES (?, ?)"
      )
      .bind(data.name, data.status)
      .run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // --- NEW: Handle DELETE requests ---
    if (request.method === "DELETE") {
      // Execute the delete query
      const info = await env.STATUS_DB.prepare(
        "DELETE FROM statuses" // Deletes ALL rows
      ).run();

      console.log('Delete operation result:', info); // Log result for debugging

      // Check if deletion was successful (optional, depends on D1 response details)
      if (info.success) {
         return new Response(JSON.stringify({ success: true, message: "All statuses deleted." }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" }
         });
      } else {
         // If D1 provides error info, use it
         const errorMsg = info.error || "Failed to execute delete operation";
         console.error("D1 Delete Error:", errorMsg);
         return new Response(JSON.stringify({ error: errorMsg }), {
           status: 500, // Internal Server Error
           headers: { ...corsHeaders, "Content-Type": "application/json" }
         });
      }
    }
    // --- End of DELETE handler ---

    // If method is not GET, POST, or DELETE
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  } catch (error) {
    console.error("Error handling /statuses request:", error);
    // Ensure CORS headers are included even on errors
    return new Response(JSON.stringify({ error: error.message || "An internal server error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
