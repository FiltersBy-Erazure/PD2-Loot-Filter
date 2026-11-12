/* A line diff (Myers' O((N+M)D) algorithm), for the Changes area's readable diff of Erazure's version and the
   player's: [{kind: "same" | "del" | "add", a (line in the first), b (line in the second)}] in order, and hunks of
   them with a few lines of context. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.diff = (function () {
  "use strict";

  /* The shortest edit script from a to b (arrays of strings): [{kind, a, b}]. Lines equal at both ends are taken
     off first (most edits change a few places of a long file). maxD: give up past that many differences (null). */
  function lines(a, b, maxD) {
    let s = 0;
    while (s < a.length && s < b.length && a[s] === b[s]) s++;
    let ea = a.length, eb = b.length;
    while (ea > s && eb > s && a[ea - 1] === b[eb - 1]) { ea--; eb--; }
    const A = a.slice(s, ea), B = b.slice(s, eb), N = A.length, M = B.length, MAX = N + M;
    const limit = Math.min(MAX, maxD || 20000);
    const v = new Int32Array(2 * limit + 4), trace = [];
    const off = limit + 1;
    let found = -1;
    v[off + 1] = 0;
    outer:
    for (let d = 0; d <= limit; d++) {
      trace.push(v.slice(off - d - 1, off + d + 2));  // k from -d-1 to d+1, at k + d + 1
      for (let k = -d; k <= d; k += 2) {
        let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
        let y = x - k;
        while (x < N && y < M && A[x] === B[y]) { x++; y++; }
        v[off + k] = x;
        if (x >= N && y >= M) { found = d; break outer; }
      }
    }
    if (found < 0) return null;
    // walk back through the trace
    const edits = [];
    let x = N, y = M;
    for (let d = found; d > 0; d--) {
      const vp = trace[d], k = x - y, at = (kk) => vp[kk + d + 1];
      const down = k === -d || (k !== d && at(k - 1) < at(k + 1));
      const pk = down ? k + 1 : k - 1, px = at(pk), py = px - pk;
      while (x > px && y > py) { edits.push({kind: "same", a: s + x - 1, b: s + y - 1}); x--; y--; }
      if (down) edits.push({kind: "add", a: s + x, b: s + py}); else edits.push({kind: "del", a: s + px, b: s + y});
      x = px; y = py;
    }
    while (x > 0 && y > 0) { edits.push({kind: "same", a: s + x - 1, b: s + y - 1}); x--; y--; }
    edits.reverse();
    const head = [], tail = [];
    for (let i = 0; i < s; i++) head.push({kind: "same", a: i, b: i});
    for (let i = 0; i < a.length - ea; i++) tail.push({kind: "same", a: ea + i, b: eb + i});
    return head.concat(edits, tail);
  }

  /* The edits in hunks: [{a, b (first lines), rows: [{kind, a, b}]}], each change with `context` same lines around
     it. */
  function hunks(edits, context) {
    context = context === undefined ? 2 : context;
    const out = [];
    let cur = null, lastChange = -1e9;
    edits.forEach((e, n) => {
      if (e.kind === "same") return;
      const from = Math.max(0, n - context);
      if (!cur || from > lastChange + context + 1) {
        cur = {rows: []};
        out.push(cur);
        for (let k = from; k < n; k++) cur.rows.push(edits[k]);
      } else {
        for (let k = lastChange + 1; k < n; k++) cur.rows.push(edits[k]);
      }
      cur.rows.push(e);
      lastChange = n;
      cur.end = n;
    });
    for (const hk of out) {
      for (let k = hk.end + 1; k <= Math.min(edits.length - 1, hk.end + context); k++) {
        if (edits[k].kind !== "same") break;
        hk.rows.push(edits[k]);
      }
      hk.a = hk.rows[0].a;
      hk.b = hk.rows[0].b;
    }
    return out;
  }

  /* Where each line of b came from in a: Int32Array (a's line, or -1 for a line of b's own). In a changed place, a
     line taken out and a line put in are paired when both are rules starting with the same 24 characters of
     condition, so a rule the player's changes narrowed (an exception added at its end) still points at Erazure's.
     Cached per b. */
  const origins = new WeakMap();
  const head = (s) => { const m = /^ItemDisplay\[([^\]]{0,24})/.exec(s || ""); return m ? m[1] : null; };
  function origin(a, b) {
    const hit = origins.get(b);
    if (hit && hit.a === a) return hit.map;
    const map = new Int32Array(b.length).fill(-1);
    const edits = lines(a, b, 60000);
    if (edits) {
      let run = [];
      const flush = () => {
        const dels = run.filter((e) => e.kind === "del").map((e) => e.a);
        for (const e of run) {
          if (e.kind !== "add") continue;
          const hb = head(b[e.b]);
          if (hb === null) continue;
          const k = dels.findIndex((d) => head(a[d]) === hb);
          if (k >= 0) { map[e.b] = dels[k]; dels.splice(k, 1); }
        }
        run = [];
      };
      for (const e of edits) {
        if (e.kind === "same") { flush(); map[e.b] = e.a; } else run.push(e);
      }
      flush();
    }
    origins.set(b, {a, map});
    return map;
  }

  return {lines, hunks, origin};
})();
