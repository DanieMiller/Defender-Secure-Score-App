export default async function handler(request, context) {
  return new Response(
    JSON.stringify({ ok: true, ts: new Date().toISOString(), runtime: 'azure-functions' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
