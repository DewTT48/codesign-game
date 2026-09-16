const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
}

Deno.serve(() => new Response(
  JSON.stringify({
    error: {
      code: 'AI_NOT_CONFIGURED',
      message: 'CODESIGN AI is disabled until allowance and retention policies are configured.',
    },
  }),
  { status: 503, headers: jsonHeaders },
))
