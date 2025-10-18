/* eslint-disable @typescript-eslint/no-explicit-any */
import { languageConfigs } from "@/utils/language-config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Payload = {
  language: "python" | "javascript";
  code: string;
  tests?: string; // optional: simple harness per language
};

const PISTON_URL = process.env.PISTON_URL ?? "http://localhost:2000";

export async function POST(req: NextRequest) {
  try {
    const { language, code, tests } = (await req.json()) as Payload;
    const cfg = languageConfigs[language];
    if (!cfg)
      return NextResponse.json(
        { ok: false, error: "Unsupported language" },
        { status: 400 }
      );

    const files = cfg.files(code, tests);

    // Piston execute
    const r = await fetch(`${PISTON_URL}/api/v2/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: cfg.pistonLang,
        version: cfg.version,
        files,
        run_timeout: 3000, // ms
        compile_timeout: 6000, // for languages that compile
        // run_memory_limit: 128000000, // if supported by your Piston build
      }),
    });

    const data = await r.json();

    // Our harnesses print JSON to stdout
    const out = String(data?.run?.stdout || data?.run?.stderr || "").trim();
    let results: any[] = [];
    try {
      results = JSON.parse(out).results ?? [];
    } catch {
      /* fallthrough */
    }

    const summary = {
      passed: results.filter((x) => x.pass).length,
      total: results.length,
    };
    return NextResponse.json({ ok: true, summary, results, raw: data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
