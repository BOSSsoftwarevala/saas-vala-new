import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, stream = false, model, diagnostic = false } = body as {
      messages: Message[];
      stream?: boolean;
      model?: string;
      diagnostic?: boolean;
    };

    // ============================================================
    // DIAGNOSTIC RUNTIME VALUES
    // ============================================================
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? '';

    const keyDetected = OPENAI_API_KEY.length > 0;
    const keyLast4 = keyDetected ? OPENAI_API_KEY.slice(-4) : 'N/A';
    const API_BASE_URL = 'https://api.openai.com/v1/chat/completions';

    const modelMap: Record<string, string> = {
      'openai/gpt-5': 'gpt-4o',
      'openai/gpt-5-mini': 'gpt-4o-mini',
      'google/gemini-3-flash-preview': 'gpt-4o-mini',
      'google/gemini-2.5-flash': 'gpt-4o-mini',
      'google/gemini-2.5-pro': 'gpt-4o',
    };
    const AI_MODEL = model ? (modelMap[model] ?? model) : 'gpt-4o-mini';

    // Print all diagnostic values
    console.log('=== RUNTIME DIAGNOSTIC START ===');
    console.log('[1] MODEL NAME:', AI_MODEL);
    console.log('[2] API BASE URL:', API_BASE_URL);
    console.log('[3] ORGANIZATION ID: Not applicable (Pay-as-you-go key, no Org ID)');
    console.log('[4] OPENAI API KEY DETECTED:', keyDetected);
    console.log('[5] API KEY LAST 4 CHARS:', keyLast4);
    console.log('[6] ENVIRONMENT MODE:', Deno.env.get('DENO_ENV') ?? 'production (edge runtime)');
    console.log('[7] REQUEST SIDE: server-side (Supabase Edge Function)');
    console.log('[8] LOVABLE_API_KEY detected:', LOVABLE_API_KEY.length > 0);
    // ============================================================

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!keyDetected) {
      console.error('[ERROR] OPENAI_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'AI service not configured. OPENAI_API_KEY missing.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemMessage: Message = {
      role: 'system',
      content: `You are SaaS VALA AI, an advanced internal assistant for the SaaS VALA platform by SoftwareVala™.

## Core Capabilities
- **Source Code Analysis**: Upload any size ZIP, PHP, JS, Python, or mixed projects
- **AI-Powered Code Fixing**: Auto-detect bugs, security issues, and performance problems
- **One-Click Deployment**: Deploy to servers without developer knowledge
- **Addon Integration**: Payment gateways, wallet systems, language packs
- **Security Scanning**: Real-time threat detection and auto-fix
- **License Management**: Generate, validate, and manage software licenses

## Response Guidelines
1. Be precise and accurate
2. Use proper code formatting with syntax highlighting
3. Provide step-by-step instructions for complex tasks
4. Include error handling in code examples
5. Use markdown tables for structured data

Powered by SoftwareVala™ Technology | Enterprise Grade AI`
    };

    const allMessages = [systemMessage, ...messages];

    // [8] Full request payload log (without API key)
    const requestPayload = {
      model: AI_MODEL,
      messages: allMessages,
      max_tokens: 8192,
      temperature: 0.3,
      stream: stream,
    };
    console.log('[8] REQUEST PAYLOAD (no key):', JSON.stringify({
      model: requestPayload.model,
      message_count: requestPayload.messages.length,
      max_tokens: requestPayload.max_tokens,
      temperature: requestPayload.temperature,
      stream: requestPayload.stream,
    }));

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    // [10] Log full error object if not OK
    if (!response.ok) {
      const errorText = await response.text();
      let errorObj: Record<string, unknown> = {};
      try { errorObj = JSON.parse(errorText); } catch { errorObj = { raw: errorText }; }

      console.error('[10] HTTP STATUS:', response.status);
      console.error('[10] RESPONSE HEADERS:', JSON.stringify(Object.fromEntries(response.headers.entries())));
      console.error('[10] ERROR BODY:', errorText);
      console.error('[10] error.message:', (errorObj as { error?: { message?: string } })?.error?.message ?? 'N/A');
      console.error('[10] error.code:', (errorObj as { error?: { code?: string } })?.error?.code ?? 'N/A');
      console.error('[10] error.type:', (errorObj as { error?: { type?: string } })?.error?.type ?? 'N/A');

      // [11] Explicit error detection
      if (response.status === 401) {
        console.error('[11] ERROR TYPE: 401 - INVALID API KEY');
        return new Response(
          JSON.stringify({ error: '401: Invalid API Key. Check OPENAI_API_KEY secret.', diagnostic: { status: 401, type: 'invalid_key', last4: keyLast4 } }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 403) {
        console.error('[11] ERROR TYPE: 403 - PERMISSION DENIED');
        return new Response(
          JSON.stringify({ error: '403: Permission denied. Key may not have access to this model.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 429) {
        console.error('[11] ERROR TYPE: 429 - RATE LIMIT / QUOTA EXCEEDED');
        return new Response(
          JSON.stringify({ error: '429: Rate limit or quota exceeded. Check billing at platform.openai.com.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status >= 500) {
        console.error('[11] ERROR TYPE: 500+ - OPENAI SERVER ERROR');
        // [17] Retry once with minimal payload
        console.log('[17] RETRYING with minimal payload...');
        const retryResp = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Hello' }], max_tokens: 10 }),
        });
        const retryText = await retryResp.text();
        console.log('[17] RETRY STATUS:', retryResp.status);
        console.log('[17] RETRY RESPONSE:', retryText);
        return new Response(
          JSON.stringify({ error: 'OpenAI server error. Retry result logged in console.', retry_status: retryResp.status }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: `HTTP ${response.status}: ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Streaming response
    if (stream) {
      console.log('[INFO] Streaming response started');
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Non-streaming response
    const data = await response.json();

    // [9] Full response object log
    console.log('[9] FULL OPENAI RESPONSE:', JSON.stringify({
      id: data.id,
      object: data.object,
      model: data.model,
      created: data.created,
      finish_reason: data.choices?.[0]?.finish_reason,
      usage: data.usage,
      choices_count: data.choices?.length,
    }));

    // [15] Token usage
    if (data.usage) {
      console.log('[15] TOKEN USAGE — input:', data.usage.prompt_tokens, '| output:', data.usage.completion_tokens, '| total:', data.usage.total_tokens);
    }

    // [14] Model confirmation
    console.log('[14] MODEL USED IN RESPONSE:', data.model);

    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      console.error('[ERROR] Empty response from OpenAI:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'AI returned empty response. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('=== RUNTIME DIAGNOSTIC END — STATUS: SUCCESS ===');

    return new Response(
      JSON.stringify({
        response: assistantMessage,
        model: AI_MODEL,
        usage: data.usage,
        ...(diagnostic ? {
          _diagnostic: {
            model_requested: AI_MODEL,
            model_used: data.model,
            api_url: API_BASE_URL,
            key_detected: keyDetected,
            key_last4: keyLast4,
            environment: 'production (edge runtime)',
            side: 'server-side',
            input_tokens: data.usage?.prompt_tokens,
            output_tokens: data.usage?.completion_tokens,
            total_tokens: data.usage?.total_tokens,
          }
        } : {})
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[10] CAUGHT EXCEPTION — message:', errorMessage);
    console.error('[10] CAUGHT EXCEPTION — stack:', errorStack);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
