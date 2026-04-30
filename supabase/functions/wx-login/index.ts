import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const APPID = Deno.env.get('WX_APPID') ?? ''
const SECRET = Deno.env.get('WX_SECRET') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()
    if (!code) {
      return Response.json({ error: 'missing code' }, { status: 400, headers: corsHeaders })
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`
    const res = await fetch(url)
    const data = await res.json()

    if (data.errcode) {
      return Response.json({ error: data.errmsg }, { status: 400, headers: corsHeaders })
    }

    return Response.json({ openid: data.openid }, { headers: corsHeaders })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500, headers: corsHeaders })
  }
})
