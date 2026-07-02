export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/leaderboard") {
      if (request.method === "GET") {
        let data = await env.LEADERBOARD_KV.get("scores", { type: "json" });
        if (!data) data = [];
        
        // Sort by accuracy (descending), then date (newest)
        data.sort((a, b) => {
          if (b.acc !== a.acc) return b.acc - a.acc;
          return new Date(b.date) - new Date(a.date);
        });
        
        return new Response(JSON.stringify(data.slice(0, 100)), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      
      if (request.method === "POST") {
        try {
          const body = await request.json();
          let data = await env.LEADERBOARD_KV.get("scores", { type: "json" });
          if (!data) data = [];
          
          data.push({
            name: (body.name || "Anonymous").substring(0, 20),
            mode: body.mode || "Unknown",
            acc: typeof body.acc === 'number' ? body.acc : 0,
            date: new Date().toISOString()
          });
          
          await env.LEADERBOARD_KV.put("scores", JSON.stringify(data));
          
          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};
