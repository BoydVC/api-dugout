// Minimal Chrome DevTools Protocol driver (Node 20 + --experimental-websocket). Throwaway Chrome profile per run.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function launch(port = 9473) {
  const prof = mkdtempSync(join(tmpdir(), "htcdp-"));
  const proc = spawn("/usr/bin/google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--mute-audio",
    "--allow-file-access-from-files", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 120 && !target; i++) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {} }
  if (!target) { proc.kill(); throw new Error("chrome did not start"); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener("open", r); ws.addEventListener("error", j); });
  let id = 0; const pending = new Map(); const errors = [], requests = [];
  ws.addEventListener("message", (m) => { const j = JSON.parse(m.data);
    if (j.id && pending.has(j.id)) { pending.get(j.id)(j); pending.delete(j.id); }
    if (j.method === "Runtime.exceptionThrown") errors.push(j.params.exceptionDetails.exception?.description || j.params.exceptionDetails.text);
    if (j.method === "Runtime.consoleAPICalled" && j.params.type === "error") errors.push("console.error: " + j.params.args.map((a) => a.value ?? a.description).join(" "));
    if (j.method === "Log.entryAdded" && j.params.entry.level === "error") errors.push("log: " + j.params.entry.text);
    if (j.method === "Network.requestWillBeSent") requests.push(j.params.request.url); });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, (j) => r(j.result || { error: j.error })); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Runtime.enable"); await send("Page.enable"); await send("Log.enable"); await send("Network.enable");
  const ev = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("eval failed: " + expr.slice(0, 90) + " :: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result?.value; };
  const viewport = (w, h, mobile = false, scale = 1) => { vp = { width: w, height: h, deviceScaleFactor: scale, mobile }; return send("Emulation.setDeviceMetricsOverride", vp); };
  // navigate, then wait (up to 15 s) until the app hook exists, and the viewport override took effect
  let vp = null;
  const goto = async (url, wait = 600) => { await send("Page.navigate", { url });
    for (let i = 0; i < 75; i++) { await sleep(200);
      let ok = false; try { const r = await send("Runtime.evaluate", { expression: "[typeof window.AD, document.readyState, innerWidth]", returnByValue: true });
        const [t, rs, iw] = r.result?.value || []; ok = t === "object" && rs === "complete";
        if (ok && vp && iw !== vp.width) { await send("Emulation.setDeviceMetricsOverride", vp); ok = false; } } catch {}
      if (ok) break; }
    await sleep(wait); };
  const shot = async (path) => { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(path, Buffer.from(r.data, "base64")); };
  const close = async () => { try { ws.close(); } catch {} proc.kill(); await sleep(300); rmSync(prof, { recursive: true, force: true }); };
  return { send, ev, viewport, goto, shot, close, errors, requests };
}
