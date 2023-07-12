
const corsHeaders = {
	"Access-Control-Allow-Headers": '*',
	"Access-Control-Allow-Methods": 'POST, GET, OPTIONS',
	"Access-Control-Allow-Origin": '*',
}

export default {
	// The fetch handler is invoked when this worker receives a HTTP(S) request
	// and should return a Response (optionally wrapped in a Promise)
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// You'll find it helpful to parse the request.url string into a URL object. Learn more at https://developer.mozilla.org/en-US/docs/Web/API/URL
		const url = new URL(request.url);
		const params = url.pathname.split('/');

		switch(request.method) {
			case 'OPTIONS'	:
				return new Response("OK", {
					headers: corsHeaders
				});
			case 'GET' 	:
				switch (params[1]) {
					case 'parameters' :
						if(params.length != 5) return new Response(`Error trying to get parameter - expected path of form: "/parameters/{model}/{parameter}/{shape|data}" but got: ${url.pathname}`, { status: 500, headers: corsHeaders });
						let value: any;
						switch (params[4]) {
							case 'shape':
								value = await env.PARAMETERS.get(`${params[2]}-${params[3]}-shape`);
								if(value === null) return new Response("Parameter not found", { status: 404, headers: corsHeaders });
								return new Response(value, { status: 200, headers: corsHeaders });
							case 'data'	:
								value = await env.PARAMETERS.get(`${params[2]}-${params[3]}-data`, { type: "arrayBuffer" });
								if(value === null) return new Response("Parameter not found", { status: 404, headers: corsHeaders });
								return new Response(value, { status: 200, headers: corsHeaders });
						}
				}
			case 'PUT'	:
			case 'POST'	:
				if(request.headers.get("WRITE-PASSCODE") == env.WRITE_PASSCODE) {
					switch (params[1]) {
						case 'parameters' :
							if(params.length != 5) return new Response(`Error trying to write parameter - "/parameters/{model}/{parameter}/{shape|data}" but got: ${url.pathname}`, { status: 500, headers: corsHeaders });
							let body: any;
							switch (params[4]) {
								case 'shape':
									body = await request.text();
									if(typeof(body) == 'undefined') return new Response(`Error trying to write parameter - missing body`, { status: 500, headers: corsHeaders });
									await env.PARAMETERS.put(`${params[2]}-${params[3]}-shape`, body, { type: "string" });
									return new Response(`Successfully saved parameter shape to path: "${params[2]}-${params[3]}"`, { status: 200, headers: corsHeaders });
								case 'data':
									body = await request.arrayBuffer();
									if(typeof(body) == 'undefined') return new Response(`Error trying to write parameter - missing body}`, { status: 500, headers: corsHeaders });
									await env.PARAMETERS.put(`${params[2]}-${params[3]}-data`, body, { type: "arrayBuffer" });
									return new Response(`Successfully saved parameter data to path: "${params[2]}-${params[3]}"`, { status: 200, headers: corsHeaders });
							}	

							
					}
				} else {
					return new Response(`INVALID PASSCODE: ${JSON.stringify(request.headers.keys())}`, { status: 401, headers: corsHeaders });
				}
		}

		return new Response(
			`<h2>WebDiffusion</h2> 
			<p><i>an image diffuser that runs entirely in your browser</i></p>
			<ul>
				<li>built by: <a href="https://github.com/0xtimmy">timmy</a> 👋</li>
				<li>source code: <a href="https://github.com/0xtimmy/web-diffusion">https://github.com/0xtimmy/web-diffusion</a></li>
				<li>pls <a href="mailto:timothyfhein@gmail.com">hire me</a> i have too much spare time</li>
			</ul>
			<p><strong>MADE IN THE USA</strong></p>`,
			{ headers: { 'Content-Type': 'text/html' } }
		);
	},
};
