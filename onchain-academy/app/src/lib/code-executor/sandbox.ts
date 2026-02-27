import { SANDBOX_SHIMS } from "./sandbox-shims";

export interface LogEntry {
  type: "log" | "error" | "warn" | "info";
  args: string[];
}

export interface ExecutionResult {
  logs: LogEntry[];
  error: string | null;
  timedOut: boolean;
}

export function executeJS(
  jsCode: string,
  timeoutMs = 5000,
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const logs: LogEntry[] = [];
    let error: string | null = null;
    let settled = false;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };

    const finish = (timedOut: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ logs, error, timedOut });
    };

    const onMessage = (ev: MessageEvent) => {
      if (ev.source !== iframe.contentWindow) return;
      const data = ev.data;
      if (!data || typeof data !== "object" || data.__sandbox !== true) return;

      if (data.type === "done") {
        finish(false);
      } else if (data.type === "error") {
        error = data.message ?? "Unknown error";
        finish(false);
      } else if (data.type === "log") {
        logs.push({
          type: data.level ?? "log",
          args: Array.isArray(data.args)
            ? data.args.map((a: unknown) =>
                typeof a === "string" ? a : JSON.stringify(a),
              )
            : [String(data.args)],
        });
      }
    };

    window.addEventListener("message", onMessage);

    const timer = setTimeout(() => {
      error = "Execution timed out";
      finish(true);
    }, timeoutMs);

    const escapedCode = JSON.stringify("" + jsCode + "");

    const html = `<!DOCTYPE html><html><head><script>
${SANDBOX_SHIMS}
(function(){
  var P = window.parent;
  function send(obj) { obj.__sandbox = true; P.postMessage(obj, "*"); }
  ["log","error","warn","info"].forEach(function(m){
    console[m] = function(){
      var a = [];
      for(var i=0;i<arguments.length;i++){
        try { a.push(typeof arguments[i]==="string"?arguments[i]:JSON.stringify(arguments[i])); }
        catch(e){ a.push(String(arguments[i])); }
      }
      send({type:"log",level:m,args:a});
    };
  });
  window.onerror = function(msg){ send({type:"error",message:String(msg)}); };
  window.onunhandledrejection = function(e){ send({type:"error",message:e.reason?String(e.reason):"Unhandled promise rejection"}); };
  try {
    var fn = new Function(${escapedCode});
    var result = fn();
    if(result && typeof result.then === "function"){
      result.then(function(){ send({type:"done"}); }).catch(function(e){ send({type:"error",message:String(e)}); });
    } else {
      send({type:"done"});
    }
  } catch(e) {
    send({type:"error",message:String(e)});
  }
})();
<\/script></head><body></body></html>`;

    iframe.srcdoc = html;
  });
}

export function formatLogs(result: ExecutionResult): string {
  const lines: string[] = [];
  for (const entry of result.logs) {
    const prefix = entry.type === "error" ? "[ERROR] " : entry.type === "warn" ? "[WARN] " : "";
    lines.push(prefix + entry.args.join(" "));
  }
  if (result.error) {
    lines.push(`Error: ${result.error}`);
  }
  if (result.timedOut) {
    lines.push("Execution timed out (5s limit)");
  }
  return lines.join("\n") || "(no output)";
}
