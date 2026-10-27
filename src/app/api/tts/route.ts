import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy to the local Kokoro neural-TTS micro-service (scripts/serve_tts.py).
 * GET  → service health + voice count
 * POST {text, voice, speed, pitch} → audio/wav
 */

export const runtime = "nodejs";

const TTS_URL = process.env.TTS_SERVICE_URL || "http://127.0.0.1:8777";

export async function GET() {
  try {
    const res = await fetch(`${TTS_URL}/health`, {
      signal: AbortSignal.timeout(4000),
    });
    const json = (await res.json()) as { ok?: boolean; voices?: number };
    return NextResponse.json({
      ok: !!json.ok,
      voices: json.voices ?? 0,
      engine: "kokoro-82m",
    });
  } catch {
    return NextResponse.json({ ok: false, voices: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${TTS_URL}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: String(body.text ?? "").slice(0, 800),
        voice: String(body.voice ?? "af_heart"),
        speed: Number(body.speed ?? 1),
        pitch: Number(body.pitch ?? 1),
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `TTS service error ${res.status}` },
        { status: 502 }
      );
    }
    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Neural voice service unreachable" },
      { status: 503 }
    );
  }
}
