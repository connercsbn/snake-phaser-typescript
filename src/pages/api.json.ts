export const post: APIRoute = async ({ request }) => {
  console.log('hi')
  if (request.headers.get("Content-Type") === "application/json") {
    const body = await request.json();
    const name = 'whatever'
    return new Response(JSON.stringify({
      message: "Your name was: " + name
    }), {
      status: 200
    })
  }
  return new Response(null, { status: 400 });
}
