import { jsx as r, jsxs as u, Fragment as ee } from "react/jsx-runtime";
import { forwardRef as qi, createElement as ko, createContext as Mn, useState as O, useEffect as J, useContext as Ln, useRef as Q, useCallback as xo, useMemo as le, useId as Ri } from "react";
function q(e) {
  if (typeof e == "number") return Number.isFinite(e) ? e : null;
  if (typeof e == "string" && e.trim() !== "") {
    const t = Number(e);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}
const me = (e) => e === !0 || e === 1 || e === "1" || e === "true" || e === "t", V = (e) => typeof e == "string" ? e : null;
function oe(e, t) {
  const o = (i) => i == null || i === "";
  return o(e) || o(t) ? o(e) && o(t) : String(e) === String(t);
}
const ze = (e) => typeof e == "object" && e !== null && !Array.isArray(e);
function et(e) {
  if (typeof e != "string") return e;
  try {
    return JSON.parse(e);
  } catch {
    return;
  }
}
function Ye(e) {
  return Array.isArray(e) && e.every((t) => typeof t == "string") ? [...e] : null;
}
function An(e) {
  return Array.isArray(e) && e.every((t) => typeof t == "number" && Number.isFinite(t)) ? [...e] : null;
}
function Se(e) {
  return [...e].sort((t, o) => (q(t.position) ?? 0) - (q(o.position) ?? 0) || Dn(t.id, o.id));
}
function Dn(e, t) {
  const [o, i] = [q(e), q(t)];
  if (o !== null && i !== null) return o - i;
  const [n, d] = [String(e ?? ""), String(t ?? "")];
  return n < d ? -1 : n > d ? 1 : 0;
}
const Tn = 1, Kt = 25.4 / 72, Ui = 30, ft = 100, Wi = 400, Fn = 15, Ki = ["png", "jpeg", "pdf", "svg"], Zi = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "image/svg+xml": "svg"
}, jn = ["pdf", "svg"], En = 60, Bn = 32, In = 80, On = 4, Gn = 200, _n = 20, Vn = ["text", "image", "rect", "ellipse", "line"], $n = ["id", "side", "kind", "name", "text", "font", "align", "colour", "file", "fit"], qn = ["x", "y", "w", "h", "size", "weight"];
function Rn(e) {
  if (!Array.isArray(e) || e.length > En) return null;
  const t = [], o = /* @__PURE__ */ new Set();
  for (const i of e) {
    if (!ze(i)) return null;
    for (const [h, p] of Object.entries(i))
      if ($n.includes(h)) {
        if (typeof p != "string") return null;
      } else if (qn.includes(h)) {
        if (typeof p != "number" || !Number.isFinite(p)) return null;
      } else return null;
    const { id: n, side: d, kind: s, align: l, fit: c, name: a } = i;
    if (typeof n != "string" || n === "" || n.length > Bn || o.has(n) || d !== "front" && d !== "back" || !Vn.includes(s) || ["x", "y", "w", "h"].some((h) => typeof i[h] != "number") || l !== void 0 && l !== "start" && l !== "center" && l !== "end" || c !== void 0 && c !== "inside" && c !== "fill" || typeof a == "string" && a.length > In) return null;
    o.add(n), t.push(i);
  }
  return t;
}
const Un = ["text", "font", "colour", "finish", "choice", "mode", "file", "fit"], Wn = ["size", "scale", "nx", "ny", "threshold"];
function Yi(e) {
  const t = e == null ? {} : et(e);
  if (!ze(t)) return { ok: !1, bad: null };
  for (const d of Object.keys(t)) if (!["layout", "palette", "finish", "sides", "parts", "placed"].includes(d)) return { ok: !1, bad: null };
  const o = t.placed === void 0 ? void 0 : Rn(t.placed);
  if (o === null) return { ok: !1, bad: null };
  for (const d of ["layout", "palette", "finish"]) if (t[d] !== void 0 && typeof t[d] != "string") return { ok: !1, bad: null };
  if (t.sides !== void 0 && (typeof t.sides != "number" || !Number.isInteger(t.sides))) return { ok: !1, bad: null };
  const i = t.parts ?? {};
  if (!ze(i)) return { ok: !1, bad: null };
  const n = /* @__PURE__ */ Object.create(null);
  for (const [d, s] of Object.entries(i)) {
    if (!ze(s)) return { ok: !1, bad: d };
    for (const [l, c] of Object.entries(s))
      if (Un.includes(l)) {
        if (typeof c != "string") return { ok: !1, bad: d };
      } else if (Wn.includes(l)) {
        if (typeof c != "number" || !Number.isFinite(c)) return { ok: !1, bad: d };
      } else return { ok: !1, bad: d };
    if (s.mode !== void 0 && s.mode !== "words" && s.mode !== "logo") return { ok: !1, bad: d };
    n[d] = s;
  }
  return {
    ok: !0,
    values: {
      ...t.layout === void 0 ? {} : { layout: t.layout },
      ...t.palette === void 0 ? {} : { palette: t.palette },
      ...t.finish === void 0 ? {} : { finish: t.finish },
      ...t.sides === void 0 ? {} : { sides: t.sides },
      parts: n,
      ...o === void 0 ? {} : { placed: o }
    }
  };
}
const vt = (e) => {
  const t = et(e);
  return ze(t) ? t : {};
};
function Be(e, t = "logo") {
  const o = ze(e) ? e : vt(e), i = o.picture === "photo" ? "photo" : o.picture === "logo" ? "logo" : t;
  return {
    picture: i,
    fit: o.fit === "fill" ? "fill" : o.fit === "inside" ? "inside" : i === "photo" ? "fill" : "inside",
    file: V(o.file) ?? (i === "photo" ? "photo_file" : "logo_file"),
    colour: o.colour === "one" ? "one" : o.colour === "full" ? "full" : null,
    accept: Ye(o.accept) ?? Ki,
    smallestMm: q(o.smallestMm),
    finishes: Ye(o.finishes),
    finish: V(o.finish)
  };
}
function Zt(e) {
  const t = vt(e), o = q(t.size) ?? 0, i = t.align;
  return {
    chars: Math.max(0, Math.floor(q(t.chars) ?? Wi)),
    grows: me(t.grows),
    unit: t.unit === "pt" ? "pt" : "mm",
    size: o,
    min: q(t.min),
    max: q(t.max),
    sizes: An(t.sizes),
    fonts: Ye(t.fonts),
    font: V(t.font),
    colours: Ye(t.colours),
    colour: V(t.colour),
    finishes: Ye(t.finishes),
    finish: V(t.finish),
    lines: Math.max(1, Math.floor(q(t.lines) ?? 1)),
    align: i === "center" || i === "end" ? i : "start",
    weight: q(t.weight) ?? 400,
    alsoLogo: ze(t.alsoLogo) ? Be(t.alsoLogo) : null
  };
}
function Hi(e) {
  const t = vt(e);
  return { choices: Ye(t.choices), palette: V(t.palette) };
}
function Ji(e) {
  const t = vt(e);
  return { shape: V(t.shape), fill: V(t.fill) };
}
const Kn = (e) => e === null ? null : q(vt(e.rules).smallestLetterMm);
function Xi(e) {
  const t = et(e);
  if (!ze(t)) return null;
  const o = Yi({ parts: { start: t } });
  return o.ok ? o.values.parts.start ?? null : null;
}
const Ie = (e) => (e ?? "").trim(), bt = (e) => [...Ie(e).replace(/\r?\n/g, "")].length, No = (e) => {
  const t = Ie(e);
  return t === "" ? 0 : t.split(/\r?\n/).length;
};
function Yt(e, t = e.size) {
  return !e.grows || !(t > 0) || !(e.size > 0) ? e.chars : Math.max(1, Math.floor(e.chars * e.size / t + 1e-6));
}
const It = (e, t) => Math.abs(e - t) < 1e-6;
function He(e, t) {
  return t > 0 ? e.sizes !== null ? It(t, e.size) || e.sizes.some((o) => It(o, t)) : e.min !== null || e.max !== null ? (e.min === null || t >= e.min - 1e-6) && (e.max === null || t <= e.max + 1e-6) : It(t, e.size) : !1;
}
const So = (e, t) => e.unit === "pt" ? t * Kt : t;
function Qi(e, t, o = e.size, i = (n) => bt(t) <= Yt(e, n)) {
  const n = e.sizes !== null ? [...e.sizes].sort((d, s) => s - d) : e.min !== null ? Zn(o, e.min) : [];
  for (const d of n) if (d < o - 1e-6 && He(e, d) && i(d)) return d;
  return null;
}
function Zn(e, t) {
  const o = [];
  for (let i = Math.round((e - 0.5) * 10) / 10; i > t - 1e-6; i = Math.round((i - 0.5) * 10) / 10) o.push(i);
  return (o.length === 0 || !It(o[o.length - 1], t)) && o.push(t), o;
}
function pi(e) {
  if (!/^#[0-9a-fA-F]{6}$/.test(e)) return null;
  const t = parseInt(e.slice(1), 16), [o, i, n] = [t >> 16 & 255, t >> 8 & 255, t & 255].map((d) => {
    const s = d / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * o + 0.7152 * i + 0.0722 * n;
}
function mi(e, t) {
  const [o, i] = [pi(e), pi(t)];
  return o === null || i === null ? null : (Math.max(o, i) + 0.05) / (Math.min(o, i) + 0.05);
}
const ki = 3, Yn = ["too-long", "required-empty", "font-not-allowed", "size-out-of-range", "colour-not-allowed", "choice-not-allowed", "part-locked", "file-missing", "file-kind", "design-unknown", "format-unknown"], Hn = 150, Jn = 0.2, Xn = (e) => e.length >= 1 && e.length <= 64 ? e : void 0, ct = (e, t) => Math.round(e * 10 ** t) / 10 ** t;
function er(e) {
  const [t, o, i, n] = [q(e.x_mm), q(e.y_mm), q(e.w_mm), q(e.h_mm)];
  return i === null || n === null ? null : { x: t ?? 0, y: o ?? 0, w: i, h: n };
}
function Qn(e, t) {
  const o = ["text", "picture", "colour", "choice", "shape"].find((i) => i === e.kind) ?? "shape";
  return {
    code: String(e.code ?? ""),
    kind: o,
    // A shape is always the shop's.
    locked: me(e.locked) || o === "shape",
    required: me(e.required),
    side: V(e.side),
    layout: V(e.layout),
    box: er(e),
    text: o === "text" ? Zt(e.rules) : null,
    picture: o === "picture" ? Be(e.rules) : null,
    choice: o === "colour" || o === "choice" ? Hi(e.rules) : null,
    shape: o === "shape" ? Ji(e.rules) : null,
    start: Xi(e.value),
    feature: e.feature_id,
    area: t.find((i) => e.area_id !== null && e.area_id !== void 0 && oe(i.id, e.area_id)) ?? null
  };
}
function el(e) {
  const t = e.takes, o = t === "logo" ? null : Zt(e.rules);
  return o !== null && t === "both" && o.alsoLogo === null && (o.alsoLogo = Be({})), {
    code: String(e.code ?? ""),
    kind: t === "logo" ? "picture" : "text",
    locked: !1,
    required: me(e.required),
    side: V(e.side),
    layout: null,
    box: er(e),
    text: o,
    picture: t === "logo" ? Be(e.rules) : null,
    choice: null,
    shape: null,
    start: null,
    feature: e.feature_id,
    area: e
  };
}
function tl(e) {
  const t = e === null ? null : e.layouts, o = typeof t == "string" ? (() => {
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  })() : t;
  return Array.isArray(o) ? o.map((i) => typeof i == "object" && i !== null ? V(i.key) : null).filter((i) => i !== null) : [];
}
const K = (e, t, o) => {
  const i = o === void 0 ? void 0 : Xn(o);
  e.refusals.some((n) => n.reason === t && n.part === i) || e.refusals.push(i === void 0 ? { reason: t } : { part: i, reason: t });
}, Ge = (e, t) => {
  const o = { ok: !1, refusals: [], advice: [], used: [] };
  return K(o, e, t), o;
};
function ol(e) {
  const { design: t, ready: o, base: i } = e;
  if (q(t.format) !== Tn) return Ge("format-unknown");
  const n = Yi(t.values);
  if (!n.ok) return Ge("format-unknown", n.bad ?? void 0);
  const d = n.values, s = (k) => t[k] !== null && t[k] !== void 0 && t[k] !== "";
  if (i === null || !s("base_id") || !oe(i.id, t.base_id) || !oe(i.app, t.app)) return Ge("design-unknown");
  if (s("ready_design_id")) {
    if (o === null || !oe(o.id, t.ready_design_id) || !oe(o.app, t.app) || !oe(o.base_id, i.id)) return Ge("design-unknown");
  } else if (o !== null) return Ge("design-unknown");
  const l = {
    facts: e,
    values: d,
    parts: [],
    live: [],
    palette: null,
    minDpi: q(e.settings.min_dpi) ?? Hn,
    smallestLine: q(e.settings.smallest_line_mm) ?? Jn,
    refusals: [],
    advice: [],
    used: /* @__PURE__ */ new Set()
  }, c = e.areas.filter((k) => oe(k.base_id, i.id));
  l.parts = o === null ? Se(c).map(el) : Se(e.parts.filter((k) => oe(k.ready_design_id, o.id))).map((k) => Qn(k, c));
  const a = tl(o), h = d.layout ?? a[0] ?? null;
  d.layout !== void 0 && !a.includes(d.layout) && K(l, "choice-not-allowed");
  const p = d.sides ?? 1, f = q(i.sides) ?? 1;
  (p < 1 || p > Math.max(1, f)) && K(l, "choice-not-allowed");
  const v = Se(e.palettes.filter((k) => o !== null && oe(k.ready_design_id, o.id)));
  if (l.palette = (d.palette === void 0 ? v[0] : v.find((k) => k.code === d.palette)) ?? null, d.palette !== void 0 && l.palette === null && K(l, "colour-not-allowed"), l.live = l.parts.filter((k) => (k.side !== "back" || p >= 2) && (k.layout === null || h === null || k.layout === h)), d.placed !== void 0) ul(l, d.placed, i);
  else {
    for (const k of Object.keys(d.parts))
      l.parts.filter((z) => z.code === k).every((z) => z.locked) && K(l, "part-locked", k);
    for (const k of l.live) {
      if (k.locked) continue;
      const z = d.parts[k.code] ?? k.start;
      k.kind === "text" ? il(l, k, z) : k.kind === "picture" ? or(l, k, k.picture, z) : (k.kind === "colour" || k.kind === "choice") && nl(l, k, z);
    }
  }
  p >= 2 && Ht(l, i.back_feature_id, void 0);
  const y = [...l.used].sort();
  return { ok: l.refusals.length === 0, refusals: l.refusals, advice: l.advice, used: y };
}
function Ht(e, t, o) {
  if (t == null || t === "") return;
  const i = e.facts.features.find((d) => oe(d.id, t)), n = i === void 0 || i.active !== void 0 && i.active !== null && !me(i.active) ? null : V(i.code);
  n === null || n === "" ? K(e, "design-unknown", o) : e.used.add(n);
}
function il(e, t, o) {
  const i = t.text;
  if ((o?.mode ?? (o?.file !== void 0 ? "logo" : "words")) === "logo") {
    i.alsoLogo === null ? K(e, "choice-not-allowed", t.code) : or(e, t, i.alsoLogo, o);
    return;
  }
  const d = o?.text, s = bt(d);
  s === 0 ? t.required && K(e, "required-empty", t.code) : i.alsoLogo === null && Ht(e, t.feature, t.code);
  const l = o?.size ?? i.size, c = Kn(t.area);
  (o?.size !== void 0 && !He(i, l) || s > 0 && c !== null && So(i, l) < c - 1e-6) && K(e, "size-out-of-range", t.code), (s > Yt(i, He(i, l) ? l : i.size) || No(d) > i.lines) && K(e, "too-long", t.code);
  const a = i.fonts ?? (i.font === null ? [] : [i.font]);
  o?.font !== void 0 && !a.includes(o.font) && K(e, "font-not-allowed", t.code);
  const h = i.colours ?? (i.colour === null ? [] : [i.colour]);
  o?.colour !== void 0 && !h.includes(o.colour) && K(e, "colour-not-allowed", t.code), tr(e, t, i, o), s > 0 && (dl(e, t, i, o), sl(e, t, i, o, l));
}
function tr(e, t, o, i) {
  const n = i?.finish ?? e.values.finish ?? o.finish;
  if (n == null) return null;
  const d = o.finishes ?? (o.finish === null ? null : [o.finish]);
  return (d === null ? i?.finish !== void 0 : !d.includes(n)) && K(e, "colour-not-allowed", t.code), n;
}
function or(e, t, o, i) {
  if (i?.file === void 0) {
    t.required && K(e, "required-empty", t.code);
    return;
  }
  const n = i.file === o.file ? e.facts.files.find((a) => a.column === o.file) : void 0;
  if (n === void 0 || n.size <= 0 || n.kind === "") {
    K(e, "file-missing", t.code);
    return;
  }
  const d = Zi[n.kind.toLowerCase()];
  (d === void 0 || !o.accept.includes(d) || rl(e) && d !== "svg") && K(e, "file-kind", t.code);
  const s = i.fit ?? o.fit;
  s !== "inside" && s !== "fill" && K(e, "choice-not-allowed", t.code);
  const l = i.scale ?? ft;
  (l < Ui || l > ft) && K(e, "size-out-of-range", t.code), i.threshold !== void 0 && (i.threshold < 1 || i.threshold > 99) && K(e, "choice-not-allowed", t.code);
  const c = tr(e, t, o, i);
  Ht(e, t.feature, t.code), t.box !== null && d !== void 0 && ir(e, t, o, n, d, s === "fill" ? "fill" : "inside", l / 100, c);
}
function rl(e) {
  return e.facts.base?.kind === "printed";
}
function ir(e, t, o, i, n, d, s, l) {
  const [c, a] = [t.box.w * s, t.box.h * s], h = o.colour === "one" && (l === null || l === "engraved"), p = o.smallestMm ?? (o.colour === "one" ? Fn : null);
  if (o.picture === "logo" && p !== null && Math.min(c, a) < p - 1e-6 && e.advice.push({ part: t.code, kind: "logo-small", acrossMm: ct(Math.min(c, a), 1), smallestMm: p }), i.px === void 0 || !(i.px[0] > 0) || !(i.px[1] > 0)) return;
  const f = (d === "fill" ? Math.max : Math.min)(c / i.px[0], a / i.px[1]);
  if (!jn.includes(n)) {
    const v = Math.round(25.4 / f);
    v < e.minDpi && e.advice.push({ part: t.code, kind: "blurry", px: [i.px[0], i.px[1]], dpi: v, boxMm: [ct(c, 1), ct(a, 1)], needs: e.minDpi });
  }
  if (h && i.thinnest !== void 0 && i.thinnest > 0) {
    const v = i.thinnest * i.px[0] * f;
    v < e.smallestLine - 1e-9 && e.advice.push({ part: t.code, kind: "fine-detail", lineMm: ct(v, 2), smallestMm: e.smallestLine });
  }
}
function nl(e, t, o) {
  const i = t.choice, n = o?.choice, d = t.kind === "colour" ? "colour-not-allowed" : "choice-not-allowed";
  if (n === void 0 || n === "") {
    t.required && K(e, "required-empty", t.code);
    return;
  }
  (i.choices ?? (t.start?.choice === void 0 ? [] : [t.start.choice])).includes(n) || K(e, d, t.code), Ht(e, t.feature, t.code);
}
function _t(e, t) {
  if (t === null) return null;
  if (/^#[0-9a-fA-F]{6}$/.test(t)) return t;
  const o = e.palette;
  if (o === null || e.facts.colours === void 0) return null;
  const i = e.facts.colours.find((n) => oe(n.palette_id, o.id) && n.code === t);
  return i === void 0 ? null : V(i.hex);
}
function ll(e, t) {
  const o = t.box, [i, n] = [o.x + o.w / 2, o.y + o.h / 2], d = e.live.slice(0, e.live.indexOf(t)).filter((s) => s.side === t.side).reverse();
  for (const s of d) {
    const l = s.box;
    if (!(l === null || i < l.x || i > l.x + l.w || n < l.y || n > l.y + l.h)) {
      if (s.kind === "shape") {
        if (s.shape.shape === "ellipse") {
          const [c, a] = [(i - (l.x + l.w / 2)) / (l.w / 2), (n - (l.y + l.h / 2)) / (l.h / 2)];
          if (c * c + a * a > 1) continue;
        }
        return _t(e, s.shape.fill);
      }
      if (s.kind === "picture") {
        if (e.values.parts[s.code]?.file !== void 0) return null;
        continue;
      }
    }
  }
  return _t(e, "paper") ?? "#ffffff";
}
function dl(e, t, o, i) {
  if (t.box === null || e.facts.colours === void 0) return;
  const n = i?.colour ?? o.colour ?? "ink", [d, s] = [_t(e, n), ll(e, t)];
  if (d === null || s === null) return;
  const l = mi(d, s);
  if (l === null || l >= ki) return;
  const c = (o.colours ?? []).map((a) => ({ one: a, ratio: (() => {
    const h = _t(e, a);
    return h === null ? 0 : mi(h, s) ?? 0;
  })() })).filter((a) => a.ratio >= ki).sort((a, h) => h.ratio - a.ratio)[0];
  e.advice.push({ part: t.code, kind: "hard-to-read", ratio: ct(l, 2), better: c?.one ?? null });
}
function sl(e, t, o, i, n) {
  const d = e.facts.measure, s = e.facts.base, l = q(s.safe_mm), c = q(s.width_mm);
  if (d === void 0 || l === null || c === null || t.box === null) return;
  const a = i?.font ?? o.font ?? "", h = Ie(i?.text).split(/\r?\n/), p = t.box, f = (v) => {
    const y = Math.max(...h.map((z) => d(z, a, So(o, v), o.weight))), k = o.align === "center" ? p.x + (p.w - y) / 2 : o.align === "end" ? p.x + p.w - y : p.x;
    return k >= l - 0.01 && k + y <= c - l + 0.01;
  };
  f(n) || e.advice.push({ part: t.code, kind: "past-safe-line", smaller: Qi(o, Ie(i?.text), n, f) });
}
const al = ["paper", "ink", "accent"], cl = /^#[0-9a-fA-F]{6}$/;
function ul(e, t, o) {
  if (o.kind !== "page") {
    K(e, "choice-not-allowed");
    return;
  }
  for (const a of Object.keys(e.values.parts)) K(e, "part-locked", a);
  const i = e.values.sides ?? 1, [n, d, s] = [q(o.width_mm) ?? 0, q(o.height_mm) ?? 0, q(o.bleed_mm) ?? 0], l = e.palette, c = [...al, ...l === null || e.facts.colours === void 0 ? [] : e.facts.colours.filter((a) => oe(a.palette_id, l.id)).map((a) => String(a.code ?? ""))];
  for (const a of t)
    if (a.side === "back" && i < 2 && K(e, "choice-not-allowed", a.id), a.w > 0 && a.h > 0 && a.w <= (n + 2 * s) * 2 && a.h <= (d + 2 * s) * 2 && a.x < n + s && a.y < d + s && a.x + a.w > -s && a.y + a.h > -s || K(e, "size-out-of-range", a.id), a.colour !== void 0 && !cl.test(a.colour) && !c.includes(a.colour) && K(e, "colour-not-allowed", a.id), a.kind === "text")
      (bt(a.text) > Wi || No(a.text) > _n) && K(e, "too-long", a.id), a.size !== void 0 && (a.size < On || a.size > Gn) && K(e, "size-out-of-range", a.id);
    else if (a.kind === "image") {
      const p = a.file === void 0 ? void 0 : e.facts.files.find((y) => y.column === a.file);
      if (p === void 0 || p.size <= 0 || p.kind === "") {
        K(e, "file-missing", a.id);
        continue;
      }
      const f = Zi[p.kind.toLowerCase()];
      if (f === void 0 || !Ki.includes(f)) {
        K(e, "file-kind", a.id);
        continue;
      }
      const v = { code: a.id, side: a.side, box: { x: a.x, y: a.y, w: a.w, h: a.h } };
      ir(e, v, Be({ fit: a.fit ?? "inside" }), p, f, a.fit === "fill" ? "fill" : "inside", 1, null);
    }
}
const Y = {
  bases: "customiser_bases",
  pieces: "customiser_base_pieces",
  areas: "customiser_base_areas",
  ready: "customiser_ready_designs",
  parts: "customiser_ready_parts",
  fonts: "customiser_fonts",
  palettes: "customiser_palettes",
  colours: "customiser_palette_colours",
  features: "customiser_features",
  settings: "customiser_settings",
  designs: "customiser_designs",
  own: "customiser_designs_claimed",
  byCode: "customiser_designs_unlocked"
}, _e = ["logo_file", "photo_file"], Te = (e) => typeof e == "number" ? e : String(e ?? ""), hl = (e) => e == null || e === "" ? null : Te(e);
function fl(e) {
  const t = typeof e == "string" ? (() => {
    try {
      return JSON.parse(e);
    } catch {
      return null;
    }
  })() : e;
  if (typeof t != "object" || t === null || Array.isArray(t)) return { parts: {} };
  const o = t.parts;
  return { ...t, parts: typeof o == "object" && o !== null ? o : {} };
}
function jt(e, t) {
  return {
    id: Te(e.id),
    code: typeof e.code == "string" ? e.code : null,
    base_id: Te(e.base_id),
    ready_design_id: hl(e.ready_design_id),
    values: fl(e.values),
    state: e.state === "ordered" ? "ordered" : "draft",
    updatedAt: typeof e.updated_at == "string" ? e.updated_at : null,
    session: t,
    files: Object.fromEntries(_e.filter((o) => typeof e[o] == "string" && e[o] !== "").map((o) => [o, String(e[o])]))
  };
}
const gl = /^(?:file_[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}$|.*\/api\/v1\/files\/(file_[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26})\/content\/?(?:\?.*)?$)/;
function ut(e, t, o, i, n, d, s) {
  if (t === void 0 || !o.includes(d) || typeof s != "string") return null;
  const l = gl.exec(s.trim());
  return l === null ? null : `${e.replace(/\/+$/, "")}${t}/${encodeURIComponent(i)}/${encodeURIComponent(String(n))}/${encodeURIComponent(d)}/${l[1] ?? s.trim()}`;
}
const pl = ut, yi = (e, t = {}) => ({
  format: 1,
  base_id: e.base_id,
  ready_design_id: e.ready_design_id,
  values: e.values,
  ...t
});
function Ta(e) {
  const { shop: t, link: o } = e, i = async (s, l, c) => {
    const a = (await t.config()).refs[s], h = Math.max(1, Math.min(a?.limit ?? 50, 500)), p = l !== void 0 && (a?.filterable ?? []).includes(l.column) ? l : void 0, f = [];
    for (let y = 0; y < 5e3; y += h) {
      const k = (await t.list(s, { ...p === void 0 ? {} : { where: p }, limit: h, ...y === 0 ? {} : { offset: y }, ...c === void 0 ? {} : { signal: c } })).data;
      if (f.push(...k), k.length < h) break;
    }
    if (l === void 0 || p !== void 0) return f;
    const v = l.op === "in" && Array.isArray(l.value) ? l.value.map(String) : [String(l.value)];
    return f.filter((y) => v.includes(String(y[l.column])));
  }, n = (s) => {
    const l = o();
    return l.adoptSession(s), l;
  }, d = async (s) => {
    const l = (await s.list(Y.own, { limit: 1 })).data;
    return l[0] === void 0 ? null : jt(l[0], s.session());
  };
  return {
    async catalogue(s, l) {
      const c = { column: "base_id", op: "eq", value: s }, [a, h, p, f, v, y, k, z, A] = await Promise.all([
        i(Y.bases, { column: "id", op: "eq", value: s }, l),
        i(Y.pieces, c, l),
        i(Y.areas, c, l),
        i(Y.ready, c, l),
        i(Y.fonts, void 0, l),
        i(Y.palettes, void 0, l),
        i(Y.colours, void 0, l),
        i(Y.features, void 0, l),
        // An Adminium that serves no settings to a visitor: the checks take the shop's defaults.
        i(Y.settings, void 0, l).catch(() => [])
      ]), g = f.length === 0 ? [] : await i(Y.parts, { column: "ready_design_id", op: "in", value: f.map((x) => x.id) }, l), m = await t.config(), P = f.map((x) => ({ ...x, preview_url: pl(e.baseUrl, m.pictures, m.refs[Y.ready]?.pictures ?? [], Y.ready, Te(x.id), "preview_file", x.preview_file) }));
      return { bases: a, pieces: h, areas: p, ready: P, parts: g, fonts: v, palettes: y, colours: k, features: z, settings: A };
    },
    async fontUrl(s) {
      const l = await t.config();
      return ut(e.baseUrl, l.assets, l.refs[Y.fonts]?.assets ?? [], Y.fonts, Te(s.id), "file", s.file);
    },
    async outlineUrl(s) {
      const l = await t.config();
      return ut(e.baseUrl, l.assets, l.refs[Y.bases]?.assets ?? [], Y.bases, Te(s.id), "outline_file", s.outline_file);
    },
    async modelUrl(s) {
      const l = await t.config();
      return ut(e.baseUrl, l.assets, l.refs[Y.bases]?.assets ?? [], Y.bases, Te(s.id), "model_file", s.model_file);
    },
    async pieceUrl(s) {
      const l = await t.config();
      return ut(e.baseUrl, l.assets, l.refs[Y.pieces]?.assets ?? [], Y.pieces, Te(s.id), "file", s.file);
    },
    async create(s, l, c) {
      const a = await t.createWithRank(Y.designs, { ...yi(s, c), ...l === null ? {} : { email: l } }), h = a.link?.session === null || a.link?.session === void 0 ? null : { token: a.link.session, level: "verified", expiresAt: a.link.expiresAt ?? Date.now() + 864e5 };
      return { ...jt({ ...a.data, base_id: s.base_id, ready_design_id: s.ready_design_id, values: s.values }, h), updatedAt: (/* @__PURE__ */ new Date()).toISOString(), files: { ...c ?? {} }, link: a.link?.token ?? null };
    },
    async change(s, l, c) {
      if (s.session === null) throw new Error("This design is not open on this device.");
      const a = n(s.session), h = await a.update(Y.own, String(s.id), { ...yi({ ...s, values: l }, c) });
      return { ...jt({ ...h, values: h.values ?? l }, a.session() ?? s.session), code: s.code, link: s.link ?? null };
    },
    async remove(s) {
      if (s.session === null) throw new Error("This design is not open on this device.");
      const l = n(s.session);
      if (l.remove === void 0) throw new Error("This shop cannot delete a design yet.");
      await l.remove(Y.own, String(s.id));
    },
    async openLink(s) {
      const l = o(), c = await l.openShared(s);
      if (c !== "opened") return c;
      const a = await d(l);
      return a === null ? "unknown" : { ...a, link: s };
    },
    async reopen(s) {
      if (s.expiresAt <= Date.now()) return null;
      try {
        return await d(n(s));
      } catch {
        return null;
      }
    },
    async byCodes(s) {
      const l = [];
      for (const c of s) {
        const a = (await t.list(Y.byCode, { code: c, limit: 1 })).data;
        a[0] !== void 0 && l.push({ ...jt(a[0], null), code: c });
      }
      return l;
    },
    async file(s, l) {
      if (s.session === null || s.files[l] === void 0) return null;
      const c = n(s.session);
      if (c.file === void 0) return null;
      try {
        return (await c.file(Y.own, s.id, l)).blob;
      } catch {
        return null;
      }
    },
    upload: t.upload === void 0 ? null : async (s, l, c, a) => (a === null ? t : n(a)).upload(a === null ? Y.designs : Y.own, s, l, c)
  };
}
const ml = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), rr = (...e) => e.filter((t, o, i) => !!t && t.trim() !== "" && i.indexOf(t) === o).join(" ").trim();
var kl = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
const yl = qi(
  ({
    color: e = "currentColor",
    size: t = 24,
    strokeWidth: o = 2,
    absoluteStrokeWidth: i,
    className: n = "",
    children: d,
    iconNode: s,
    ...l
  }, c) => ko(
    "svg",
    {
      ref: c,
      ...kl,
      width: t,
      height: t,
      stroke: e,
      strokeWidth: i ? Number(o) * 24 / Number(t) : o,
      className: rr("lucide", n),
      ...l
    },
    [
      ...s.map(([a, h]) => ko(a, h)),
      ...Array.isArray(d) ? d : [d]
    ]
  )
);
const j = (e, t) => {
  const o = qi(
    ({ className: i, ...n }, d) => ko(yl, {
      ref: d,
      iconNode: t,
      className: rr(`lucide-${ml(e)}`, i),
      ...n
    })
  );
  return o.displayName = `${e}`, o;
};
const vl = j("AlignCenterHorizontal", [
  ["path", { d: "M2 12h20", key: "9i4pu4" }],
  ["path", { d: "M10 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4", key: "11f1s0" }],
  ["path", { d: "M10 8V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4", key: "t14dx9" }],
  ["path", { d: "M20 16v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-1", key: "1w07xs" }],
  ["path", { d: "M14 8V7c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2v1", key: "1apec2" }]
]);
const bl = j("AlignCenterVertical", [
  ["path", { d: "M12 2v20", key: "t6zp3m" }],
  ["path", { d: "M8 10H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h4", key: "14d6g8" }],
  ["path", { d: "M16 10h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4", key: "1e2lrw" }],
  ["path", { d: "M8 20H7a2 2 0 0 1-2-2v-2c0-1.1.9-2 2-2h1", key: "1fkdwx" }],
  ["path", { d: "M16 14h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1", key: "1euafb" }]
]);
const zl = j("AlignCenter", [
  ["path", { d: "M17 12H7", key: "16if0g" }],
  ["path", { d: "M19 18H5", key: "18s9l3" }],
  ["path", { d: "M21 6H3", key: "1jwq7v" }]
]);
const wl = j("AlignEndHorizontal", [
  ["rect", { width: "6", height: "16", x: "4", y: "2", rx: "2", key: "z5wdxg" }],
  ["rect", { width: "6", height: "9", x: "14", y: "9", rx: "2", key: "um7a8w" }],
  ["path", { d: "M22 22H2", key: "19qnx5" }]
]);
const xl = j("AlignEndVertical", [
  ["rect", { width: "16", height: "6", x: "2", y: "4", rx: "2", key: "10wcwx" }],
  ["rect", { width: "9", height: "6", x: "9", y: "14", rx: "2", key: "4p5bwg" }],
  ["path", { d: "M22 22V2", key: "12ipfv" }]
]);
const Nl = j("AlignLeft", [
  ["path", { d: "M15 12H3", key: "6jk70r" }],
  ["path", { d: "M17 18H3", key: "1amg6g" }],
  ["path", { d: "M21 6H3", key: "1jwq7v" }]
]);
const Sl = j("AlignRight", [
  ["path", { d: "M21 12H9", key: "dn1m92" }],
  ["path", { d: "M21 18H7", key: "1ygte8" }],
  ["path", { d: "M21 6H3", key: "1jwq7v" }]
]);
const Pl = j("AlignStartHorizontal", [
  ["rect", { width: "6", height: "16", x: "4", y: "6", rx: "2", key: "1n4dg1" }],
  ["rect", { width: "6", height: "9", x: "14", y: "6", rx: "2", key: "17khns" }],
  ["path", { d: "M22 2H2", key: "fhrpnj" }]
]);
const Cl = j("AlignStartVertical", [
  ["rect", { width: "9", height: "6", x: "6", y: "14", rx: "2", key: "lpm2y7" }],
  ["rect", { width: "16", height: "6", x: "6", y: "4", rx: "2", key: "rdj6ps" }],
  ["path", { d: "M2 2v20", key: "1ivd8o" }]
]);
const nr = j("ArrowDown", [
  ["path", { d: "M12 5v14", key: "s699le" }],
  ["path", { d: "m19 12-7 7-7-7", key: "1idqje" }]
]);
const zt = j("ArrowLeft", [
  ["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
  ["path", { d: "M19 12H5", key: "x3x0zl" }]
]);
const lr = j("ArrowRight", [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "m12 5 7 7-7 7", key: "xquz4c" }]
]);
const dr = j("ArrowUp", [
  ["path", { d: "m5 12 7-7 7 7", key: "hav0vg" }],
  ["path", { d: "M12 19V5", key: "x0mq9r" }]
]);
const Ml = j("BookmarkCheck", [
  ["path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z", key: "169p4p" }],
  ["path", { d: "m9 10 2 2 4-4", key: "1gnqz4" }]
]);
const wt = j("Bookmark", [
  ["path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z", key: "1fy3hk" }]
]);
const Ll = j("Box", [
  [
    "path",
    {
      d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",
      key: "hh9hay"
    }
  ],
  ["path", { d: "m3.3 7 8.7 5 8.7-5", key: "g66t2b" }],
  ["path", { d: "M12 22V12", key: "d0xqtd" }]
]);
const Al = j("CalendarCheck", [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }],
  ["path", { d: "m9 16 2 2 4-4", key: "19s6y9" }]
]);
const sr = j("Calendar", [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }]
]);
const Dl = j("Check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
const ar = j("ChevronDown", [
  ["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]
]);
const Tl = j("ChevronRight", [
  ["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]
]);
const cr = j("ChevronUp", [["path", { d: "m18 15-6-6-6 6", key: "153udz" }]]);
const Jt = j("CircleAlert", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
  ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }]
]);
const Fl = j("CircleCheck", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
]);
const ur = j("Circle", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]
]);
const Po = j("Contrast", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 18a6 6 0 0 0 0-12v12z", key: "j4l70d" }]
]);
const jl = j("Crosshair", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["line", { x1: "22", x2: "18", y1: "12", y2: "12", key: "l9bcsi" }],
  ["line", { x1: "6", x2: "2", y1: "12", y2: "12", key: "13hhkx" }],
  ["line", { x1: "12", x2: "12", y1: "6", y2: "2", key: "10w3f3" }],
  ["line", { x1: "12", x2: "12", y1: "22", y2: "18", key: "15g9kq" }]
]);
const El = j("FileImage", [
  ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", key: "1rqfz7" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["circle", { cx: "10", cy: "12", r: "2", key: "737tya" }],
  ["path", { d: "m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22", key: "wt3hpn" }]
]);
const Bl = j("FlipHorizontal2", [
  ["path", { d: "m3 7 5 5-5 5V7", key: "couhi7" }],
  ["path", { d: "m21 7-5 5 5 5V7", key: "6ouia7" }],
  ["path", { d: "M12 20v2", key: "1lh1kg" }],
  ["path", { d: "M12 14v2", key: "8jcxud" }],
  ["path", { d: "M12 8v2", key: "1woqiv" }],
  ["path", { d: "M12 2v2", key: "tus03m" }]
]);
const Il = j("FolderHeart", [
  [
    "path",
    {
      d: "M11 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v1.5",
      key: "6hud8k"
    }
  ],
  [
    "path",
    {
      d: "M13.9 17.45c-1.2-1.2-1.14-2.8-.2-3.73a2.43 2.43 0 0 1 3.44 0l.36.34.34-.34a2.43 2.43 0 0 1 3.45-.01c.95.95 1 2.53-.2 3.74L17.5 21Z",
      key: "wpff58"
    }
  ]
]);
const hr = j("ImageOff", [
  ["line", { x1: "2", x2: "22", y1: "2", y2: "22", key: "a6p6uj" }],
  ["path", { d: "M10.41 10.41a2 2 0 1 1-2.83-2.83", key: "1bzlo9" }],
  ["line", { x1: "13.5", x2: "6", y1: "13.5", y2: "21", key: "1q0aeu" }],
  ["line", { x1: "18", x2: "21", y1: "12", y2: "15", key: "5mozeu" }],
  [
    "path",
    {
      d: "M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59",
      key: "mmje98"
    }
  ],
  ["path", { d: "M21 15V5a2 2 0 0 0-2-2H9", key: "43el77" }]
]);
const Co = j("ImageUp", [
  [
    "path",
    {
      d: "M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21",
      key: "9csbqa"
    }
  ],
  ["path", { d: "m14 19.5 3-3 3 3", key: "9vmjn0" }],
  ["path", { d: "M17 22v-5.5", key: "1aa6fl" }],
  ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }]
]);
const Mo = j("Image", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2", key: "1m3agn" }],
  ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }],
  ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }]
]);
const Ol = j("Info", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 16v-4", key: "1dtifu" }],
  ["path", { d: "M12 8h.01", key: "e9boi3" }]
]);
const Gl = j("Layers", [
  [
    "path",
    {
      d: "m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",
      key: "8b97xw"
    }
  ],
  ["path", { d: "m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65", key: "dd6zsq" }],
  ["path", { d: "m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65", key: "ep9fru" }]
]);
const _l = j("LayoutPanelLeft", [
  ["rect", { width: "7", height: "18", x: "3", y: "3", rx: "1", key: "2obqm" }],
  ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1", key: "6d4xhi" }],
  ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1", key: "nxv5o0" }]
]);
const Vl = j("LayoutTemplate", [
  ["rect", { width: "18", height: "7", x: "3", y: "3", rx: "1", key: "f1a2em" }],
  ["rect", { width: "9", height: "7", x: "3", y: "14", rx: "1", key: "jqznyg" }],
  ["rect", { width: "5", height: "7", x: "16", y: "14", rx: "1", key: "q5h2i8" }]
]);
const $l = j("ListChecks", [
  ["path", { d: "m3 17 2 2 4-4", key: "1jhpwq" }],
  ["path", { d: "m3 7 2 2 4-4", key: "1obspn" }],
  ["path", { d: "M13 6h8", key: "15sg57" }],
  ["path", { d: "M13 12h8", key: "h98zly" }],
  ["path", { d: "M13 18h8", key: "oe0vm4" }]
]);
const ql = j("LockKeyhole", [
  ["circle", { cx: "12", cy: "16", r: "1", key: "1au0dj" }],
  ["rect", { x: "3", y: "10", width: "18", height: "12", rx: "2", key: "6s8ecr" }],
  ["path", { d: "M7 10V7a5 5 0 0 1 10 0v3", key: "1pqi11" }]
]);
const xt = j("Lock", [
  ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2", key: "1w4ew1" }],
  ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4", key: "fwvmzm" }]
]);
const Rl = j("MailCheck", [
  ["path", { d: "M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8", key: "12jkf8" }],
  ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7", key: "1ocrg3" }],
  ["path", { d: "m16 19 2 2 4-4", key: "1b14m6" }]
]);
const Ul = j("Maximize2", [
  ["polyline", { points: "15 3 21 3 21 9", key: "mznyad" }],
  ["polyline", { points: "9 21 3 21 3 15", key: "1avn1i" }],
  ["line", { x1: "21", x2: "14", y1: "3", y2: "10", key: "ota7mn" }],
  ["line", { x1: "3", x2: "10", y1: "21", y2: "14", key: "1atl0r" }]
]);
const Xt = j("Minus", [["path", { d: "M5 12h14", key: "1ays0h" }]]);
const Wl = j("Move3d", [
  ["path", { d: "M5 3v16h16", key: "1mqmf9" }],
  ["path", { d: "m5 19 6-6", key: "jh6hbb" }],
  ["path", { d: "m2 6 3-3 3 3", key: "tkyvxa" }],
  ["path", { d: "m18 16 3 3-3 3", key: "1d4glt" }]
]);
const Kl = j("Move", [
  ["path", { d: "M12 2v20", key: "t6zp3m" }],
  ["path", { d: "m15 19-3 3-3-3", key: "11eu04" }],
  ["path", { d: "m19 9 3 3-3 3", key: "1mg7y2" }],
  ["path", { d: "M2 12h20", key: "9i4pu4" }],
  ["path", { d: "m5 9-3 3 3 3", key: "j64kie" }],
  ["path", { d: "m9 5 3-3 3 3", key: "l8vdw6" }]
]);
const Zl = j("Palette", [
  ["circle", { cx: "13.5", cy: "6.5", r: ".5", fill: "currentColor", key: "1okk4w" }],
  ["circle", { cx: "17.5", cy: "10.5", r: ".5", fill: "currentColor", key: "f64h9f" }],
  ["circle", { cx: "8.5", cy: "7.5", r: ".5", fill: "currentColor", key: "fotxhn" }],
  ["circle", { cx: "6.5", cy: "12.5", r: ".5", fill: "currentColor", key: "qy21gx" }],
  [
    "path",
    {
      d: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z",
      key: "12rzf8"
    }
  ]
]);
const Yl = j("PenLine", [
  ["path", { d: "M12 20h9", key: "t2du7b" }],
  [
    "path",
    {
      d: "M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z",
      key: "1ykcvy"
    }
  ]
]);
const Hl = j("PenTool", [
  [
    "path",
    {
      d: "M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z",
      key: "nt11vn"
    }
  ],
  [
    "path",
    {
      d: "m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18",
      key: "15qc1e"
    }
  ],
  ["path", { d: "m2.3 2.3 7.286 7.286", key: "1wuzzi" }],
  ["circle", { cx: "11", cy: "11", r: "2", key: "xmgehs" }]
]);
const vi = j("PencilRuler", [
  [
    "path",
    { d: "M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13", key: "orapub" }
  ],
  ["path", { d: "m8 6 2-2", key: "115y1s" }],
  ["path", { d: "m18 16 2-2", key: "ee94s4" }],
  [
    "path",
    {
      d: "m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17",
      key: "cfq27r"
    }
  ],
  [
    "path",
    {
      d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      key: "1a8usu"
    }
  ],
  ["path", { d: "m15 5 4 4", key: "1mk7zo" }]
]);
const fr = j("Plus", [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
]);
const Jl = j("RectangleHorizontal", [
  ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "2", key: "9lu3g6" }]
]);
const gr = j("Redo2", [
  ["path", { d: "m15 14 5-5-5-5", key: "12vg1m" }],
  ["path", { d: "M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13", key: "6uklza" }]
]);
const Xl = j("RotateCcw", [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }]
]);
const Lo = j("Ruler", [
  [
    "path",
    {
      d: "M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z",
      key: "icamh8"
    }
  ],
  ["path", { d: "m14.5 12.5 2-2", key: "inckbg" }],
  ["path", { d: "m11.5 9.5 2-2", key: "fmmyf7" }],
  ["path", { d: "m8.5 6.5 2-2", key: "vc6u1g" }],
  ["path", { d: "m17.5 15.5 2-2", key: "wo5hmg" }]
]);
const Ao = j("ScanLine", [
  ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2", key: "aa7l1z" }],
  ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2", key: "4qcy5o" }],
  ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2", key: "6vwrx8" }],
  ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2", key: "ioqczr" }],
  ["path", { d: "M7 12h10", key: "b7w52i" }]
]);
const Ql = j("SearchX", [
  ["path", { d: "m13.5 8.5-5 5", key: "1cs55j" }],
  ["path", { d: "m8.5 8.5 5 5", key: "a8mexj" }],
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ["path", { d: "m21 21-4.3-4.3", key: "1qie3q" }]
]);
const pr = j("Search", [
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ["path", { d: "m21 21-4.3-4.3", key: "1qie3q" }]
]);
const mr = j("ShoppingBasket", [
  ["path", { d: "m15 11-1 9", key: "5wnq3a" }],
  ["path", { d: "m19 11-4-7", key: "cnml18" }],
  ["path", { d: "M2 11h20", key: "3eubbj" }],
  ["path", { d: "m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4", key: "yiazzp" }],
  ["path", { d: "M4.5 15.5h15", key: "13mye1" }],
  ["path", { d: "m5 11 4-7", key: "116ra9" }],
  ["path", { d: "m9 11 1 9", key: "1ojof7" }]
]);
const ed = j("SlidersHorizontal", [
  ["line", { x1: "21", x2: "14", y1: "4", y2: "4", key: "obuewd" }],
  ["line", { x1: "10", x2: "3", y1: "4", y2: "4", key: "1q6298" }],
  ["line", { x1: "21", x2: "12", y1: "12", y2: "12", key: "1iu8h1" }],
  ["line", { x1: "8", x2: "3", y1: "12", y2: "12", key: "ntss68" }],
  ["line", { x1: "21", x2: "16", y1: "20", y2: "20", key: "14d8ph" }],
  ["line", { x1: "12", x2: "3", y1: "20", y2: "20", key: "m0wm8r" }],
  ["line", { x1: "14", x2: "14", y1: "2", y2: "6", key: "14e1ph" }],
  ["line", { x1: "8", x2: "8", y1: "10", y2: "14", key: "1i6ji0" }],
  ["line", { x1: "16", x2: "16", y1: "18", y2: "22", key: "1lctlv" }]
]);
const td = j("Sprout", [
  ["path", { d: "M7 20h10", key: "e6iznv" }],
  ["path", { d: "M10 20c5.5-2.5.8-6.4 3-10", key: "161w41" }],
  [
    "path",
    {
      d: "M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z",
      key: "9gtqwd"
    }
  ],
  [
    "path",
    {
      d: "M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z",
      key: "bkxnd2"
    }
  ]
]);
const gt = j("SquareDashed", [
  ["path", { d: "M5 3a2 2 0 0 0-2 2", key: "y57alp" }],
  ["path", { d: "M19 3a2 2 0 0 1 2 2", key: "18rm91" }],
  ["path", { d: "M21 19a2 2 0 0 1-2 2", key: "1j7049" }],
  ["path", { d: "M5 21a2 2 0 0 1-2-2", key: "sbafld" }],
  ["path", { d: "M9 3h1", key: "1yesri" }],
  ["path", { d: "M9 21h1", key: "15o7lz" }],
  ["path", { d: "M14 3h1", key: "1ec4yj" }],
  ["path", { d: "M14 21h1", key: "v9vybs" }],
  ["path", { d: "M3 9v1", key: "1r0deq" }],
  ["path", { d: "M21 9v1", key: "mxsmne" }],
  ["path", { d: "M3 14v1", key: "vnatye" }],
  ["path", { d: "M21 14v1", key: "169vum" }]
]);
const kr = j("SquarePen", [
  ["path", { d: "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", key: "1m0v6g" }],
  [
    "path",
    {
      d: "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",
      key: "ohrbg2"
    }
  ]
]);
const yr = j("Square", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }]
]);
const pt = j("Trash2", [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
]);
const Do = j("TriangleAlert", [
  [
    "path",
    {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      key: "wmoenq"
    }
  ],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
]);
const Nt = j("Type", [
  ["polyline", { points: "4 7 4 4 20 4 20 7", key: "1nosan" }],
  ["line", { x1: "9", x2: "15", y1: "20", y2: "20", key: "swin9y" }],
  ["line", { x1: "12", x2: "12", y1: "4", y2: "20", key: "1tx1rr" }]
]);
const vr = j("Undo2", [
  ["path", { d: "M9 14 4 9l5-5", key: "102s5s" }],
  ["path", { d: "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11", key: "f3b9sd" }]
]);
const St = j("Upload", [
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["polyline", { points: "17 8 12 3 7 8", key: "t8dd8p" }],
  ["line", { x1: "12", x2: "12", y1: "3", y2: "15", key: "widbto" }]
]);
const od = j("UserCheck", [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["polyline", { points: "16 11 18 13 22 9", key: "1pwet4" }]
]);
const id = j("WandSparkles", [
  [
    "path",
    {
      d: "m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72",
      key: "ul74o6"
    }
  ],
  ["path", { d: "m14 7 3 3", key: "1r5n42" }],
  ["path", { d: "M5 6v4", key: "ilb8ba" }],
  ["path", { d: "M19 14v4", key: "blhpug" }],
  ["path", { d: "M10 2v2", key: "7u0qdc" }],
  ["path", { d: "M7 8H3", key: "zfb6yr" }],
  ["path", { d: "M21 16h-4", key: "1cnmox" }],
  ["path", { d: "M11 3H9", key: "1obp7u" }]
]);
const Vt = j("X", [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
]);
const To = j("ZoomIn", [
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ["line", { x1: "21", x2: "16.65", y1: "21", y2: "16.65", key: "13gj7c" }],
  ["line", { x1: "11", x2: "11", y1: "8", y2: "14", key: "1vmskp" }],
  ["line", { x1: "8", x2: "14", y1: "11", y2: "11", key: "durymu" }]
]);
const Fo = j("ZoomOut", [
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ["line", { x1: "21", x2: "16.65", y1: "21", y2: "16.65", key: "13gj7c" }],
  ["line", { x1: "8", x2: "14", y1: "11", y2: "11", key: "durymu" }]
]), rd = {
  "editor.add": "أضف إلى السلة",
  "editor.bar.fewer": "أنقص واحدًا",
  "editor.bar.fix": "أصلح {n, plural, zero {# مشكلة} one {مشكلة واحدة} two {مشكلتين} few {# مشكلات} many {# مشكلةً} other {# مشكلة}} في الفحوصات قبل أن يمكن إضافته إلى السلة.",
  "editor.bar.howMany": "الكمية",
  "editor.bar.more": "زِد واحدًا",
  "editor.bar.working": "جارٍ حساب السعر…",
  "editor.cancel": "إلغاء",
  "editor.check.blurry": "قد يُطبع شعارك ضبابيًا بهذا المقاس — ملف أكبر أو SVG سيكون أوضح",
  "editor.check.blurryDetail": "{px} px تعطي {dpi} dpi عند {w} × {h} mm — نحتاج {needs}.",
  "editor.check.blurryPhoto": "قد تُطبع صورتك ضبابية بهذا المقاس — ملف أكبر سيكون أوضح",
  "editor.check.fileKind": "لا يمكن استخدام هذا النوع من الملفات هنا.",
  "editor.check.fileKindListed": "{part}: لا يمكن استخدام هذا النوع من الملفات هنا",
  "editor.check.fileKindPrinted": "يجب أن يكون الشعار البارز رسمًا: أرسله بصيغة SVG. الصورة ليست لها حواف يمكن إبرازها.",
  "editor.check.fileKindPrintedListed": "{part}: أرسل شعارك كرسم SVG",
  "editor.check.fileMissing": "لم يصل ملف هذا الجزء. ارفعه مرة أخرى.",
  "editor.check.fileMissingListed": "{part}: ارفع الملف مرة أخرى",
  "editor.check.fine": "بعض الخطوط في شعارك أدق من أن تُحفر — قد تختفي",
  "editor.check.hard": "صعب القراءة — النص قريب جدًا من اللون خلفه.",
  "editor.check.lines": "{n, plural, zero {لا يتسع هنا أي سطر.} one {يتسع هنا سطر واحد فقط.} two {يتسع هنا سطران فقط.} few {يتسع هنا # أسطر فقط.} many {يتسع هنا # سطرًا فقط.} other {يتسع هنا # سطر فقط.}}",
  "editor.check.linesListed": "في {part} أسطر أكثر من اللازم.",
  "editor.check.logoSmall": "سيكون عرض شعارك {size} — أصغر من أن يُقرأ",
  "editor.check.needLogo": "أضف شعارًا — يحتاجه هذا التصميم.",
  "editor.check.needLogoShort": "أضف شعارًا.",
  "editor.check.needPhoto": "أضف صورة — يحتاجها هذا التصميم.",
  "editor.check.needPhotoShort": "أضف صورة.",
  "editor.check.needWords": "أضف {part} — يحتاجه هذا التصميم.",
  "editor.check.needWordsShort": "أضف {part}.",
  "editor.check.needed": "{part} مطلوب — لا يمكن تركه فارغًا",
  "editor.check.neededField": "أضف نصك — هذا الجزء مطلوب",
  "editor.check.notOffered": "هذا الاختيار لا يقدّمه المتجر هنا. اختر غيره.",
  "editor.check.over": "{n, plural, zero {# حرف زائد.} one {حرف واحد زائد.} two {حرفان زائدان.} few {# أحرف زائدة.} many {# حرفًا زائدًا.} other {# حرف زائد.}} بحجم {size} يتسع هذا الجزء لعدد أحرف يصل إلى {limit}.",
  "editor.check.overGrows": "{n, plural, zero {# حرف زائد.} one {حرف واحد زائد.} two {حرفان زائدان.} few {# أحرف زائدة.} many {# حرفًا زائدًا.} other {# حرف زائد.}} بحجم {size} يتسع هذا الجزء لعدد أحرف يصل إلى {limit}. الأحرف الأصغر تتسع لنص أطول.",
  "editor.check.overListed": "{part}: {n, plural, zero {# حرف زائد} one {حرف واحد زائد} two {حرفان زائدان} few {# أحرف زائدة} many {# حرفًا زائدًا} other {# حرف زائد}}",
  "editor.check.overPrint": "يتجاوز الحد بمقدار {n}. اختصره.",
  "editor.check.overPrintListed": "{part} يتجاوز الحد بمقدار {n, plural, zero {# حرف} one {حرف واحد} two {حرفين} few {# أحرف} many {# حرفًا} other {# حرف}}.",
  "editor.check.safe": "يتجاوز خط الأمان.",
  "editor.check.safeListed": "{part} يتجاوز خط الأمان.",
  "editor.check.safeShorten": "يتجاوز خط الأمان. اختصره.",
  "editor.check.size": "هذا الجزء لا يقبل هذا الحجم.",
  "editor.check.sizeFloor": "الأحرف الأصغر من {size} لن تُطبع بوضوح",
  "editor.check.unknown": "لا يمكن صنع هذا التصميم كما هو. ابدأ من جديد من تصاميم المتجر.",
  "editor.checks.clear": "كل شيء سليم",
  "editor.checks.count": "{n} للمراجعة",
  "editor.checks.go": "انتقل إليه",
  "editor.checks.nothing": "لا شيء يحتاج إلى إصلاح. أما إن كان يبدو كما تريد، فلهذا نرسل البروفة.",
  "editor.checks.title": "الفحوصات",
  "editor.chip.logo": "شعارك",
  "editor.chip.motif": "زخارف",
  "editor.chip.photo": "صورة",
  "editor.chip.words": "نصوصك",
  "editor.choose.changeSides": "غيّر المقاس أو الأوجه",
  "editor.choose.chip": "اجعله خاصًا بك",
  "editor.choose.colourways": "{n, plural, zero {# تشكيلة لونية} one {تشكيلة لونية واحدة} two {تشكيلتان لونيتان} few {# تشكيلات لونية} many {# تشكيلةً لونيةً} other {# تشكيلة لونية}}",
  "editor.choose.count": "{n, plural, zero {# تصميم} one {تصميم واحد} two {تصميمان} few {# تصاميم} many {# تصميمًا} other {# تصميم}}",
  "editor.choose.layouts": "{n, plural, zero {# تخطيط} one {تخطيط واحد} two {تخطيطان} few {# تخطيطات} many {# تخطيطًا} other {# تخطيط}}",
  "editor.choose.noMatch": "لا توجد تصاميم مطابقة",
  "editor.choose.noMatchQuery": "لا توجد تصاميم تطابق «{query}»",
  "editor.choose.none": "لا توجد تصاميم جاهزة لـ {product} بعد",
  "editor.choose.noneSub": "ابدأ من صفحة فارغة بالمقاس الصحيح، أو أرسل ملفًا صنعته.",
  "editor.choose.plain": "ابدأ بقطعة سادة",
  "editor.choose.plainNone": "القطعة كما هي، دون أي إضافة.",
  "editor.choose.plainSub": "نصوصك أو شعارك حيث تسمح الورشة.",
  "editor.choose.search": "ابحث في التصاميم",
  "editor.choose.show": "اعرض التصاميم",
  "editor.choose.showAll": "اعرض كل التصاميم",
  "editor.choose.subMaker": "{n, plural, zero {# تصميم جاهز} one {تصميم جاهز واحد} two {تصميمان جاهزان} few {# تصاميم جاهزة} many {# تصميمًا جاهزًا} other {# تصميم جاهز}} لـ {product}. اختر واحدًا، ثم غيّر ما يسمح لك بتغييره.",
  "editor.choose.subPrint": "معروضة على {product} بمقاس {trim}، {sides}. لكل تصميم أجزاء تملؤها، ويبقى الباقي كما صنعه المتجر.",
  "editor.choose.title": "اختر تصميمًا",
  "editor.choose.use": "خصّص تصميم {name}. {chips}.",
  "editor.close": "إغلاق",
  "editor.designs.byCode": "فُتحت بعد أن وجدت طلبك. لا يراها أحد سواك.",
  "editor.designs.byLink": "لا يراها أحد سواك. فتحتها بالرابط الذي أرسلناه إلى {email}.",
  "editor.designs.changed": "آخر تغيير {when}",
  "editor.designs.deleteAria": "احذف {name}",
  "editor.designs.deleteBody": "سيُحذف نهائيًا، مع أي شعار رفعته له. تحتفظ الطلبات التي قدّمتها بالفعل بنسختها.",
  "editor.designs.deleteBodyPrint": "سيختفي من تصاميمك ويتوقف رابطه عن العمل. تحتفظ الطلبات التي قدّمتها بنسختها الخاصة.",
  "editor.designs.deleteFailed": "تعذّر الحذف. حاول مرة أخرى.",
  "editor.designs.deleteGone": "هذا التصميم أصبح ضمن طلب الآن، لذا سيبقى.",
  "editor.designs.deleteTitle": "حذف «{name}»؟",
  "editor.designs.deleteYes": "احذفه",
  "editor.designs.deleteYesPrint": "حذف",
  "editor.designs.deleted": "حُذف التصميم.",
  "editor.designs.deletedPrint": "حُذف {name}.",
  "editor.designs.here": "التصاميم التي حفظتها على هذا الجهاز. لا يراها أحد سواك.",
  "editor.designs.keep": "احتفظ به",
  "editor.designs.noWords": "لا نصوص بعد",
  "editor.designs.none": "لا توجد تصاميم محفوظة",
  "editor.designs.noneBody": "عندما تضغط «احفظ وعد لاحقًا» أثناء التخصيص، ينتظرك التصميم هنا.",
  "editor.designs.noneBodyPrint": "عندما تختار «احفظ وعد لاحقًا» ينتظرك التصميم هنا ونرسل إليك الرابط بالبريد.",
  "editor.designs.open": "افتح",
  "editor.designs.openAria": "افتح {name}",
  "editor.designs.order": "اطلبه",
  "editor.designs.orderAria": "اطلب {name}",
  "editor.designs.title": "تصاميمك",
  "editor.drawing.edit": "عدّل {name}",
  "editor.drawing.locked": "{name} — جزء من المتجر. يبقى كما هو.",
  "editor.drawing.logo": "شعارك",
  "editor.drawing.photo": "صورتك",
  "editor.error.other": "تعذّر الحفظ. حاول مرة أخرى.",
  "editor.error.rate": "محاولات كثيرة جدًا. انتظر دقيقة ثم حاول مرة أخرى.",
  "editor.error.refused": "لم يتمكن المتجر من قبول هذا التصميم كما هو. راجعه وحاول مرة أخرى.",
  "editor.failed": "تعذّر تحميل التصاميم.",
  "editor.fields.addLogo": "أضف شعارك",
  "editor.fields.addWords": "أضف نصًا",
  "editor.fields.bigger": "أحرف أكبر",
  "editor.fields.colour": "اللون",
  "editor.fields.colours": "الألوان",
  "editor.fields.coloursSub": "يغيّر كل جزء يستخدمها، على الوجهين.",
  "editor.fields.counter": "{count} / {limit}",
  "editor.fields.counterAria": "الأحرف: {count} من {limit}",
  "editor.fields.dropLogo": "أفلت شعارك هنا",
  "editor.fields.dropPhoto": "أفلت صورتك هنا",
  "editor.fields.either": "اتركه سادة، أو ضع هنا نصوصك أو شعارك.",
  "editor.fields.finishFor": "تشطيب {part}",
  "editor.fields.fitPhotoAria": "كيف تستقر الصورة في إطارها",
  "editor.fields.font": "الخط",
  "editor.fields.fontFor": "خط {part}",
  "editor.fields.kept": "محفوظ مع تصميمك",
  "editor.fields.layout": "التخطيط",
  "editor.fields.leaveEmpty": "اتركه فارغًا",
  "editor.fields.lockedAria": "{part}، تحدده الورشة: {value}",
  "editor.fields.logoKinds": "SVG أو PDF أو PNG أو JPEG، حتى {size}",
  "editor.fields.needed": "مطلوب",
  "editor.fields.neededLower": "مطلوب",
  "editor.fields.nothing": "لا شيء في هذا التصميم يمكنك تغييره.",
  "editor.fields.optional": "اختياري",
  "editor.fields.person": "يفحص شخص كل تصميم قبل أن نرسل إليك البروفة.",
  "editor.fields.photoKinds": "PNG أو JPEG، حتى {size}",
  "editor.fields.privateLogo": "لا يرى شعارك سواك و{shop}.",
  "editor.fields.privateMaker": "شعارك خاص. لا يراه سواك والورشة.",
  "editor.fields.privateMakerPhoto": "صورتك خاصة. لا يراها سواك والورشة.",
  "editor.fields.privatePhoto": "لا يرى صورتك سواك و{shop}.",
  "editor.fields.removeLogo": "أزل شعارك",
  "editor.fields.removeLogoPrint": "أزل الشعار",
  "editor.fields.removePhoto": "أزل صورتك",
  "editor.fields.removePhotoPrint": "أزل الصورة",
  "editor.fields.replace": "استبدال",
  "editor.fields.setByStudio": "تحدده الورشة",
  "editor.fields.size": "الحجم",
  "editor.fields.sizeFor": "حجم الأحرف في {part}",
  "editor.fields.smaller": "أحرف أصغر",
  "editor.fields.uploadLogo": "ارفع شعارك",
  "editor.fields.uploadPhoto": "ارفع صورتك",
  "editor.fields.yourLogo": "{part} — شعارك",
  "editor.fields.yourWords": "{part} — نصك",
  "editor.fill.allDesigns": "كل التصاميم",
  "editor.fill.change": "غيّر التصميم",
  "editor.fill.design": "التصميم: {name}",
  "editor.fill.fullEditor": "انتقل إلى المحرر الكامل",
  "editor.fill.makeItYours": "اجعله خاصًا بك",
  "editor.fill.noneBody": "ستبدأ بالقطعة السادة. أضف نصوصك حيث تسمح الورشة.",
  "editor.fill.noneTitle": "لا توجد تصاميم جاهزة لهذا المنتج",
  "editor.fill.ordered": "هذا التصميم مرتبط بطلب بالفعل، لذا يبقى كما كان. ما تغيّره هنا يُحفظ كتصميم جديد.",
  "editor.fill.plain": "قطعة سادة",
  "editor.fill.proof": "سنرسل إليك بروفة قبل أن نقص أي شيء.",
  "editor.fill.toChange": "{n} للتغيير",
  "editor.fill.yourDesign": "تصميمك",
  "editor.filter.all": "الكل",
  "editor.filter.bold": "جريء",
  "editor.filter.logo": "بشعار",
  "editor.filter.motif": "زخارف",
  "editor.filter.one": "لون واحد",
  "editor.filter.photo": "بصورة",
  "editor.filter.simple": "بسيط",
  "editor.filter.words": "نص فقط",
  "editor.fix.shorten": "اختصره",
  "editor.fix.smaller": "صغّره",
  "editor.fix.use": "استخدم {colour}",
  "editor.full.accent": "لون مميز",
  "editor.full.across": "أفقيًا بالمليمتر",
  "editor.full.addImage": "أضف صورة",
  "editor.full.addWords": "أضف كلمات",
  "editor.full.alignBottom": "محاذاة إلى الأسفل",
  "editor.full.alignCentre": "توسيط أفقي",
  "editor.full.alignLeft": "محاذاة إلى الحافة اليسرى",
  "editor.full.alignMiddle": "توسيط عمودي",
  "editor.full.alignPage": "محاذاة إلى الصفحة",
  "editor.full.alignRight": "محاذاة إلى الحافة اليمنى",
  "editor.full.alignTop": "محاذاة إلى الأعلى",
  "editor.full.alignment": "المحاذاة",
  "editor.full.back": "رجوع",
  "editor.full.backToForm": "الرجوع إلى النموذج",
  "editor.full.backward": "إرسال {name} إلى الخلف",
  "editor.full.banner": "يمكنك الآن تحريك أي شيء، وتبقى كلماتك.",
  "editor.full.blank": "ابدأ من صفحة فارغة",
  "editor.full.blurry": "قد تُطبع هذه الصورة غير واضحة بهذا الحجم — {dpi} نقطة/بوصة، ونحتاج {needs}. الملف الأكبر أوضح.",
  "editor.full.bold": "عريض",
  "editor.full.card": "تصميمك، {side}",
  "editor.full.centre": "الوسط",
  "editor.full.delete": "حذف",
  "editor.full.down": "عموديًا بالمليمتر",
  "editor.full.ellipse": "شكل بيضاوي",
  "editor.full.empty": "أضف شيئًا إلى البطاقة أولًا.",
  "editor.full.end": "النهاية",
  "editor.full.extrabold": "عريض جدًا",
  "editor.full.fill": "التعبئة",
  "editor.full.fitAria": "كيف تستقر في إطارها",
  "editor.full.forward": "إحضار {name} إلى الأمام",
  "editor.full.height": "الارتفاع بالمليمتر",
  "editor.full.hideNote": "إخفاء هذه الملاحظة",
  "editor.full.image": "صورة",
  "editor.full.inFull": "هذا التصميم في المحرر الكامل",
  "editor.full.inFullBody": "حرّكت بعض العناصر، لذلك لم يعد النموذج يناسبه. تابع في المحرر، أو ارجع إلى النموذج وتفقد التحريكات. تبقى كلماتك في الحالتين.",
  "editor.full.ink": "الحبر",
  "editor.full.layers": "الطبقات",
  "editor.full.line": "خط",
  "editor.full.madeYours": "{design}، بلمستك",
  "editor.full.medium": "متوسط",
  "editor.full.noLayers": "لا شيء على هذا الوجه بعد.",
  "editor.full.note": "اسحب للتحريك، أو استخدم مفاتيح الأسهم. قد يُقص أي شيء خارج خط الأمان.",
  "editor.full.nothing": "لم يُحدد شيء. اضغط على شيء في البطاقة، أو أضف كلمات أو صورة أو شكلًا من الأدوات.",
  "editor.full.open": "افتح المحرر الكامل",
  "editor.full.paper": "الورق",
  "editor.full.partText": "نص",
  "editor.full.position": "الموضع والحجم",
  "editor.full.properties": "الخصائص",
  "editor.full.rect": "مستطيل",
  "editor.full.regular": "عادي",
  "editor.full.replaceImage": "استبدال الصورة",
  "editor.full.safe": "يتجاوز هذا خط الأمان. صغّره أو حرّكه إلى الداخل.",
  "editor.full.sample": "كلماتك هنا",
  "editor.full.select": "تحديد {name}",
  "editor.full.semibold": "شبه عريض",
  "editor.full.sending": "جارٍ رفع صورتك",
  "editor.full.size": "{w} × {h} مم · هامش القص {bleed} مم · خط الأمان {safe} مم",
  "editor.full.sizeNoSafe": "{w} × {h} مم · هامش القص {bleed} مم",
  "editor.full.sizePt": "الحجم بالنقاط",
  "editor.full.start": "البداية",
  "editor.full.toForm": "ارجع إلى النموذج",
  "editor.full.tools": "الأدوات",
  "editor.full.twoPictures": "يقبل التصميم صورتين على الأكثر: استبدل إحداهما أو احذفها أولًا.",
  "editor.full.uploadImage": "ارفع صورة",
  "editor.full.use": "استخدم هذا التصميم",
  "editor.full.weight": "السُمك",
  "editor.full.width": "العرض بالمليمتر",
  "editor.full.words": "الكلمات",
  "editor.full.zoom": "التكبير",
  "editor.full.zoomIn": "تكبير",
  "editor.full.zoomOut": "تصغير",
  "editor.loading": "جارٍ تحميل التصاميم",
  "editor.logo.across": "بعرض {size}",
  "editor.logo.centre": "توسيطه",
  "editor.logo.down": "تحريك لأسفل",
  "editor.logo.fill": "ملء",
  "editor.logo.fitAria": "كيف يستقر الشعار في إطاره",
  "editor.logo.fitInside": "ملاءمة داخلية",
  "editor.logo.inBox": "داخل إطاره",
  "editor.logo.left": "تحريك لليسار",
  "editor.logo.nudge": "تحريك",
  "editor.logo.nudgeAria": "تحريك الشعار",
  "editor.logo.right": "تحريك لليمين",
  "editor.logo.size": "الحجم داخل إطاره",
  "editor.logo.up": "تحريك لأعلى",
  "editor.missing": "لا يمكن تخصيص هذا المنتج الآن.",
  "editor.oneColour.fine": "بعض الخطوط أدق من أن تُحفر — قد تختفي",
  "editor.oneColour.fineHow": "حرّك المؤشر نحو «حفر أقل» لإسقاط التظليل الدقيق، أو ارفع نسخة أعرض من شعارك.",
  "editor.oneColour.in": "وصل شعارك. تحقّق من شكله بعد الحفر.",
  "editor.oneColour.laser": "كما سيقطعه الليزر",
  "editor.oneColour.laserAria": "شعارك محفورًا في {material}",
  "editor.oneColour.laserAriaPlain": "شعارك كما يحفره الليزر",
  "editor.oneColour.later": "نتحقق من التفاصيل الدقيقة مرة أخرى عندما نُعدّ بروفتك.",
  "editor.oneColour.lead": "يقطع الليزر لونًا واحدًا. كل ما هو أغمق من الحد الذي تضعه يُحفر، وكل ما هو أفتح يبقى {material}.",
  "editor.oneColour.leadPlain": "يقطع الليزر لونًا واحدًا. كل ما هو أغمق من الحد الذي تضعه يُحفر، وكل ما هو أفتح يبقى كما هو.",
  "editor.oneColour.less": "حفر أقل",
  "editor.oneColour.line": "حيث يصبح الفاتح داكنًا",
  "editor.oneColour.mayBeFine": "قد تكون بعض الخطوط دقيقة جدًا",
  "editor.oneColour.more": "حفر أكثر",
  "editor.oneColour.open": "اجعله بلون واحد",
  "editor.oneColour.set": "تم الضبط للحفر بلون واحد.",
  "editor.oneColour.use": "استخدم هذا",
  "editor.oneColour.yours": "ملفك",
  "editor.oneColour.yoursAria": "شعارك كما رفعته",
  "editor.preview.noBasket": "معاينة — لا يُضاف شيء إلى سلة حقيقية.",
  "editor.preview.noBasketPrint": "أنت تعاين كعميل — لا يُضاف شيء إلى سلة.",
  "editor.preview.noSave": "معاينة — الحفظ متوقف هنا.",
  "editor.preview.noSavePrint": "أنت تعاين كعميل — لا يُحفظ شيء.",
  "editor.quote.each": "{price} للواحدة",
  "editor.quote.more": "و{n} غيرها.",
  "editor.quote.nothingAdded": "التخصيص لا يضيف شيئًا إلى السعر.",
  "editor.quote.ready": "جاهز في {date}",
  "editor.quote.show": "أرني",
  "editor.quote.title": "عرض السعر",
  "editor.redo": "إعادة",
  "editor.retry": "حاول مرة أخرى",
  "editor.save": "احفظ وعد لاحقًا",
  "editor.save.body": "سنحتفظ بالتصميم ونرسل إليك بالبريد رابطًا خاصًا به. لا يمكن لأحد غيرك فتحه.",
  "editor.save.bodyPrint": "نحفظ التصميم ونرسل إليك بالبريد رابطًا خاصًا به. لا يفتحه سواك و{shop}.",
  "editor.save.email": "بريدك الإلكتروني",
  "editor.save.emailBad": "لا يبدو هذا عنوان بريد إلكتروني. جرّب name@example.com",
  "editor.save.emailNone": "أدخل بريدك الإلكتروني لنرسل إليك الرابط",
  "editor.save.emailPrint": "البريد الإلكتروني",
  "editor.save.submit": "احفظه",
  "editor.save.submitPrint": "احفظ وأرسل الرابط",
  "editor.saved.backToShop": "العودة إلى المتجر",
  "editor.saved.keepGoing": "تابع",
  "editor.saved.sentTo": "أُرسل إلى {email}. يفتح الرابط تصاميمك أنت فقط.",
  "editor.saved.title": "تم الحفظ. أرسلنا إليك رابطًا للعودة إليه.",
  "editor.side.back": "الوجه الخلفي",
  "editor.side.front": "الوجه الأمامي",
  "editor.sides.both": "على الوجهين",
  "editor.sides.one": "على وجه واحد",
  "editor.stage.assembled": "مجمّعة",
  "editor.stage.bleed": "هامش القص الزائد",
  "editor.stage.close": "أغلق المعاينة",
  "editor.stage.full": "معاينة بملء الشاشة",
  "editor.stage.guides": "الخطوط الإرشادية",
  "editor.stage.hint": "اسحب للتدوير · مرّر للتكبير",
  "editor.stage.hintPhone": "اسحب للتدوير · باعد بإصبعين للتكبير",
  "editor.stage.kitModes": "طريقة عرض المجموعة",
  "editor.stage.label": "{product}، {design}. معروض مسطحًا.",
  "editor.stage.label3d": "{product}، {design}. استخدم مفاتيح الأسهم لتدويرها، وزائد وناقص للتكبير والتصغير، و0 للعودة.",
  "editor.stage.locked": "{name} جزء من المتجر — يبقى كما هو.",
  "editor.stage.mode": "طريقة عرض البطاقة",
  "editor.stage.no3d": "لا يستطيع هذا الجهاز عرض المعاينة ثلاثية الأبعاد، لذا ترى كل قطعة مسطحة. إنه التصميم نفسه الذي سنقصه.",
  "editor.stage.pieces": "{n, plural, zero {# قطعة} one {قطعة واحدة} two {قطعتان} few {# قطع} many {# قطعةً} other {# قطعة}}",
  "editor.stage.pieces3d": "القطع",
  "editor.stage.printed": "كما سيُطبع",
  "editor.stage.reset": "أعد ضبط العرض",
  "editor.stage.roledescription": "معاينة ثلاثية الأبعاد",
  "editor.stage.safe": "خط الأمان",
  "editor.stage.seeFlat": "اعرضها مسطحة",
  "editor.stage.side": "الوجه",
  "editor.stage.trim": "خط القص",
  "editor.stage.turn": "دوّر القطعة",
  "editor.stage.turnDown": "دوّر للأسفل",
  "editor.stage.turnLeft": "دوّر لليسار",
  "editor.stage.turnRight": "دوّر لليمين",
  "editor.stage.turnUp": "دوّر للأعلى",
  "editor.stage.turned": "مُدار ليملأ الشاشة.",
  "editor.stage.withGuides": "مع الخطوط الإرشادية",
  "editor.stage.zoom": "التكبير",
  "editor.stage.zoomIn": "تكبير",
  "editor.stage.zoomOut": "تصغير",
  "editor.undo": "تراجع",
  "editor.upload.big": "هذا الملف أكبر من {size}",
  "editor.upload.cap": "أرسلت أكبر عدد من الملفات نقبله في اليوم. حاول مرة أخرى غدًا.",
  "editor.upload.failed": "تعذّر إرسال هذا الملف. حاول مرة أخرى.",
  "editor.upload.heic": "هذه الصورة بصيغة HEIC التي لا نستطيع الطباعة منها. احفظها بصيغة JPEG أو PNG وارفعها مرة أخرى.",
  "editor.upload.kindLogo": "هذا ليس SVG أو PDF أو PNG أو JPEG",
  "editor.upload.kindOther": "لا يمكن استخدام هذا النوع من الملفات هنا.",
  "editor.upload.kindPhoto": "هذا ليس PNG أو JPEG",
  "editor.upload.off": "هذا المتجر لا يقبل الملفات هنا بعد.",
  "editor.upload.quota": "لا يمكننا استقبال الملفات الآن. حاول لاحقًا.",
  "editor.upload.sending": "جارٍ الإرسال",
  "editor.upload.sendingLogo": "جارٍ رفع شعارك",
  "editor.upload.sendingPhoto": "جارٍ رفع صورتك",
  "editor.upload.svgCleaned": "يحتوي ملف SVG هذا على شيء لا نستطيع الطباعة منه. احفظه كملف SVG عادي وارفعه مرة أخرى.",
  "editor.ways.blank": "ابدأ من صفحة فارغة",
  "editor.ways.blankBody": "المحرر الكامل، على صفحة بالمقاس النهائي مع رسم هامش القص الزائد وخط الأمان.",
  "editor.ways.blankMeta": "{w} × {h} mm + {bleed} mm هامش قص زائد",
  "editor.ways.blankNone": "الصفحة بمقاسها النهائي مع رسم هامش القص الزائد وخط الأمان.",
  "editor.ways.chooseBody": "تصميم جاهز من المتجر. املأ نصوصك وأضف شعارك واختر الألوان.",
  "editor.ways.noDesigns": "لا توجد تصاميم جاهزة لـ {product} بعد.",
  "editor.ways.own": "أرسل ملفك الخاص",
  "editor.ways.ownBody": "لديك ملف جاهز للطباعة؟ ارفعه وسيفحصه شخص.",
  "editor.ways.ownMeta": "PDF · TIFF · JPEG · حتى 100 MB",
  "editor.ways.ownNone": "ملف PDF أو TIFF أو JPEG حتى 100 MB.",
  "editor.ways.title": "كيف تريد أن تصنعه؟"
}, nd = {
  "editor.add": "Přidat do košíku",
  "editor.bar.fewer": "O jeden méně",
  "editor.bar.fix": "Než to půjde do košíku, opravte v kontrolách {n, plural, one {# věc} few {# věci} other {# věcí}}.",
  "editor.bar.howMany": "Počet",
  "editor.bar.more": "O jeden víc",
  "editor.bar.working": "Počítáme cenu…",
  "editor.cancel": "Zrušit",
  "editor.check.blurry": "Vaše logo může v této velikosti vyjít rozmazané — větší soubor nebo SVG bude ostřejší",
  "editor.check.blurryDetail": "{px} px při {w} × {h} mm odpovídá {dpi} dpi — potřebujeme {needs}.",
  "editor.check.blurryPhoto": "Vaše fotka může v této velikosti vyjít rozmazaná — větší soubor bude ostřejší",
  "editor.check.fileKind": "Tento typ souboru tu nelze použít.",
  "editor.check.fileKindListed": "{part}: tento typ souboru tu nelze použít",
  "editor.check.fileKindPrinted": "Vystouplé logo musí být kresba: pošlete ho jako SVG. Obrázek nemá okraje, které by mohly vystoupit.",
  "editor.check.fileKindPrintedListed": "{part}: pošlete logo jako kresbu SVG",
  "editor.check.fileMissing": "Soubor k této části nedorazil. Nahrajte ho znovu.",
  "editor.check.fileMissingListed": "{part}: nahrajte soubor znovu",
  "editor.check.fine": "Některé čáry ve vašem logu jsou na gravírování příliš jemné — mohou zmizet",
  "editor.check.hard": "Špatně čitelné — text je příliš podobný barvě za ním.",
  "editor.check.lines": "{n, plural, one {Vejde se sem jen # řádek.} few {Vejdou se sem jen # řádky.} other {Vejde se sem jen # řádků.}}",
  "editor.check.linesListed": "{part}: příliš mnoho řádků.",
  "editor.check.logoSmall": "Vaše logo bude široké jen {size} — příliš malé na to, aby bylo čitelné",
  "editor.check.needLogo": "Přidejte logo — tento návrh ho potřebuje.",
  "editor.check.needLogoShort": "Přidejte logo.",
  "editor.check.needPhoto": "Přidejte fotku — tento návrh ji potřebuje.",
  "editor.check.needPhotoShort": "Přidejte fotku.",
  "editor.check.needWords": "Vyplňte „{part}“ — tento návrh to potřebuje.",
  "editor.check.needWordsShort": "Vyplňte „{part}“.",
  "editor.check.needed": "{part}: povinné — nesmí zůstat prázdné",
  "editor.check.neededField": "Doplňte svůj text — tato část je povinná",
  "editor.check.notOffered": "Tuto možnost tu obchod nenabízí. Vyberte jinou.",
  "editor.check.over": "{n, plural, one {# znak navíc.} few {# znaky navíc.} other {# znaků navíc.}} Při velikosti {size} je limit této části {limit}.",
  "editor.check.overGrows": "{n, plural, one {# znak navíc.} few {# znaky navíc.} other {# znaků navíc.}} Při velikosti {size} je limit této části {limit}. Menší písmo pojme víc.",
  "editor.check.overListed": "{part}: {n, plural, one {# znak navíc} few {# znaky navíc} other {# znaků navíc}}",
  "editor.check.overPrint": "Přes limit o {n}. Zkraťte text.",
  "editor.check.overPrintListed": "{part}: přes limit o {n, plural, one {# znak} few {# znaky} other {# znaků}}.",
  "editor.check.safe": "Zasahuje do bezpečného okraje.",
  "editor.check.safeListed": "{part} zasahuje do bezpečného okraje.",
  "editor.check.safeShorten": "Zasahuje do bezpečného okraje. Zkraťte text.",
  "editor.check.size": "Tuto velikost tato část nepodporuje.",
  "editor.check.sizeFloor": "Písmo menší než {size} nevyjde čistě",
  "editor.check.unknown": "Tento návrh nelze v této podobě vyrobit. Začněte znovu z návrhů obchodu.",
  "editor.checks.clear": "Vše v pořádku",
  "editor.checks.count": "{n} ke kontrole",
  "editor.checks.go": "Přejít tam",
  "editor.checks.nothing": "Není co opravovat. Jestli vše vypadá, jak má, uvidíte v náhledu ke schválení.",
  "editor.checks.title": "Kontroly",
  "editor.chip.logo": "Vaše logo",
  "editor.chip.motif": "Motivy",
  "editor.chip.photo": "Fotka",
  "editor.chip.words": "Vaše texty",
  "editor.choose.changeSides": "Změnit formát nebo strany",
  "editor.choose.chip": "Přizpůsobte si ho",
  "editor.choose.colourways": "{n, plural, one {# barevná varianta} few {# barevné varianty} other {# barevných variant}}",
  "editor.choose.count": "{n, plural, one {# návrh} few {# návrhy} other {# návrhů}}",
  "editor.choose.layouts": "{n, plural, one {# rozvržení} few {# rozvržení} other {# rozvržení}}",
  "editor.choose.noMatch": "Žádný návrh neodpovídá",
  "editor.choose.noMatchQuery": "Hledání „{query}“ neodpovídá žádný návrh",
  "editor.choose.none": "K produktu {product} zatím nejsou hotové návrhy",
  "editor.choose.noneSub": "Začněte prázdnou stránkou ve správném formátu, nebo pošlete vlastní soubor.",
  "editor.choose.plain": "Začít s čistým dílem",
  "editor.choose.plainNone": "Díl tak, jak je, bez úprav.",
  "editor.choose.plainSub": "Váš text nebo logo tam, kde to dílna dovolí.",
  "editor.choose.search": "Hledat návrhy",
  "editor.choose.show": "Zobrazit návrhy",
  "editor.choose.showAll": "Zobrazit všechny návrhy",
  "editor.choose.subMaker": "K produktu {product}: {n, plural, one {# hotový návrh.} few {# hotové návrhy.} other {# hotových návrhů.}} Vyberte si jeden a pak změňte, co dovoluje.",
  "editor.choose.subPrint": "Zobrazeno na produktu {product} ve formátu {trim}, {sides}. Každý má části, které vyplníte; zbytek zůstane tak, jak ho obchod připravil.",
  "editor.choose.title": "Vyberte návrh",
  "editor.choose.use": "Upravit návrh {name}. {chips}.",
  "editor.close": "Zavřít",
  "editor.designs.byCode": "Otevřeno poté, co jste našli svou objednávku. Vidíte je jen vy.",
  "editor.designs.byLink": "Vidíte je jen vy. Otevřeli jste je odkazem, který jsme poslali e-mailem na {email}.",
  "editor.designs.changed": "Naposledy změněno {when}",
  "editor.designs.deleteAria": "Smazat {name}",
  "editor.designs.deleteBody": "Zmizí natrvalo, i s logem, které jste k němu nahráli. Objednávky, které jste už odeslali, si svou kopii ponechají.",
  "editor.designs.deleteBodyPrint": "Zmizí z vašich návrhů a jeho odkaz přestane fungovat. Odeslané objednávky si ponechají vlastní kopii.",
  "editor.designs.deleteFailed": "Smazání se nepovedlo. Zkuste to znovu.",
  "editor.designs.deleteGone": "Tento návrh už patří k objednávce, a proto zůstává.",
  "editor.designs.deleteTitle": "Smazat „{name}“?",
  "editor.designs.deleteYes": "Smazat",
  "editor.designs.deleteYesPrint": "Smazat",
  "editor.designs.deleted": "Návrh smazán.",
  "editor.designs.deletedPrint": "{name} je smazán.",
  "editor.designs.here": "Návrhy, které jste uložili na tomto zařízení. Vidíte je jen vy.",
  "editor.designs.keep": "Ponechat",
  "editor.designs.noWords": "Zatím bez textu",
  "editor.designs.none": "Žádné uložené návrhy",
  "editor.designs.noneBody": "Když při úpravách stisknete „Uložit a vrátit se později“, návrh tu na vás počká.",
  "editor.designs.noneBodyPrint": "Když zvolíte „Uložit a vrátit se později“, návrh tu počká a odkaz vám pošleme e-mailem.",
  "editor.designs.open": "Otevřít",
  "editor.designs.openAria": "Otevřít {name}",
  "editor.designs.order": "Objednat",
  "editor.designs.orderAria": "Objednat {name}",
  "editor.designs.title": "Vaše návrhy",
  "editor.drawing.edit": "Upravit {name}",
  "editor.drawing.locked": "{name} — část od obchodu. Zůstává beze změny.",
  "editor.drawing.logo": "Vaše logo",
  "editor.drawing.photo": "Vaše fotka",
  "editor.error.other": "Nepodařilo se uložit. Zkuste to znovu.",
  "editor.error.rate": "Příliš mnoho pokusů. Počkejte minutu a zkuste to znovu.",
  "editor.error.refused": "Obchod nemohl tento návrh v této podobě přijmout. Zkontrolujte ho a zkuste to znovu.",
  "editor.failed": "Návrhy se nepodařilo načíst.",
  "editor.fields.addLogo": "Přidat logo",
  "editor.fields.addWords": "Přidat text",
  "editor.fields.bigger": "Větší písmo",
  "editor.fields.colour": "Barva",
  "editor.fields.colours": "Barvy",
  "editor.fields.coloursSub": "Změní všechny části, které je používají, na obou stranách.",
  "editor.fields.counter": "{count} / {limit}",
  "editor.fields.counterAria": "{count} z {limit} znaků",
  "editor.fields.dropLogo": "Sem přetáhněte logo",
  "editor.fields.dropPhoto": "Sem přetáhněte fotku",
  "editor.fields.either": "Nechte to čisté, nebo sem dejte vlastní text či logo.",
  "editor.fields.finishFor": "Povrchová úprava – {part}",
  "editor.fields.fitPhotoAria": "Jak fotografie sedí ve svém rámečku",
  "editor.fields.font": "Písmo",
  "editor.fields.fontFor": "Písmo – {part}",
  "editor.fields.kept": "Uloženo s vaším návrhem",
  "editor.fields.layout": "Rozvržení",
  "editor.fields.leaveEmpty": "Nechat prázdné",
  "editor.fields.lockedAria": "{part}, nastaveno dílnou: {value}",
  "editor.fields.logoKinds": "SVG, PDF, PNG nebo JPEG, do {size}",
  "editor.fields.needed": "Povinné",
  "editor.fields.neededLower": "povinné",
  "editor.fields.nothing": "Na tomto návrhu nemůžete nic měnit.",
  "editor.fields.optional": "Nepovinné",
  "editor.fields.person": "Každý návrh zkontroluje člověk, než vám pošleme náhled ke schválení.",
  "editor.fields.photoKinds": "PNG nebo JPEG, do {size}",
  "editor.fields.privateLogo": "Vaše logo vidíte jen vy a {shop}.",
  "editor.fields.privateMaker": "Vaše logo je soukromé. Vidíte ho jen vy a dílna.",
  "editor.fields.privateMakerPhoto": "Vaše fotografie je soukromá. Vidíte ji jen vy a dílna.",
  "editor.fields.privatePhoto": "Vaši fotku vidíte jen vy a {shop}.",
  "editor.fields.removeLogo": "Odebrat vaše logo",
  "editor.fields.removeLogoPrint": "Odebrat logo",
  "editor.fields.removePhoto": "Odebrat vaši fotku",
  "editor.fields.removePhotoPrint": "Odebrat fotku",
  "editor.fields.replace": "Nahradit",
  "editor.fields.setByStudio": "Nastaveno dílnou",
  "editor.fields.size": "Velikost",
  "editor.fields.sizeFor": "Velikost písma – {part}",
  "editor.fields.smaller": "Menší písmo",
  "editor.fields.uploadLogo": "Nahrát logo",
  "editor.fields.uploadPhoto": "Nahrát fotku",
  "editor.fields.yourLogo": "{part} — vaše logo",
  "editor.fields.yourWords": "{part} — váš text",
  "editor.fill.allDesigns": "Všechny návrhy",
  "editor.fill.change": "Změnit návrh",
  "editor.fill.design": "Návrh: {name}",
  "editor.fill.fullEditor": "Přepnout do plného editoru",
  "editor.fill.makeItYours": "Přizpůsobte si ho",
  "editor.fill.noneBody": "Začínáte s čistým dílem. Přidejte svůj text tam, kde to dílna dovolí.",
  "editor.fill.noneTitle": "K tomuto produktu nejsou hotové návrhy",
  "editor.fill.ordered": "Tento návrh už patří k objednávce, a proto zůstává beze změny. Co tu změníte, uloží se jako nový návrh.",
  "editor.fill.plain": "Čistý díl",
  "editor.fill.proof": "Než cokoli vyřízneme, pošleme vám náhled ke schválení.",
  "editor.fill.toChange": "{n} K ÚPRAVĚ",
  "editor.fill.yourDesign": "Váš návrh",
  "editor.filter.all": "Vše",
  "editor.filter.bold": "Výrazné",
  "editor.filter.logo": "S logem",
  "editor.filter.motif": "Motivy",
  "editor.filter.one": "Jedna barva",
  "editor.filter.photo": "S fotkou",
  "editor.filter.simple": "Jednoduché",
  "editor.filter.words": "Jen text",
  "editor.fix.shorten": "Zkrátit",
  "editor.fix.smaller": "Zmenšit",
  "editor.fix.use": "Použít {colour}",
  "editor.full.accent": "Akcent",
  "editor.full.across": "Vodorovně v milimetrech",
  "editor.full.addImage": "Přidat obrázek",
  "editor.full.addWords": "Přidat text",
  "editor.full.alignBottom": "Zarovnat dolů",
  "editor.full.alignCentre": "Vycentrovat vodorovně",
  "editor.full.alignLeft": "Zarovnat k levému okraji",
  "editor.full.alignMiddle": "Vycentrovat svisle",
  "editor.full.alignPage": "Zarovnat ke stránce",
  "editor.full.alignRight": "Zarovnat k pravému okraji",
  "editor.full.alignTop": "Zarovnat nahoru",
  "editor.full.alignment": "Zarovnání",
  "editor.full.back": "Zpět",
  "editor.full.backToForm": "Zpět k formuláři",
  "editor.full.backward": "Posunout {name} dozadu",
  "editor.full.banner": "Teď můžete posouvat cokoli; váš text zůstane.",
  "editor.full.blank": "Začít s prázdnou stránkou",
  "editor.full.blurry": "Obrázek se v této velikosti může vytisknout rozmazaně — {dpi} dpi, potřebujeme {needs}. Větší soubor bude ostřejší.",
  "editor.full.bold": "Tučné",
  "editor.full.card": "Váš návrh, {side}",
  "editor.full.centre": "Na střed",
  "editor.full.delete": "Smazat",
  "editor.full.down": "Svisle v milimetrech",
  "editor.full.ellipse": "Elipsa",
  "editor.full.empty": "Nejdřív na kartu něco přidejte.",
  "editor.full.end": "Na konec",
  "editor.full.extrabold": "Extra tučné",
  "editor.full.fill": "Výplň",
  "editor.full.fitAria": "Jak sedí ve svém rámečku",
  "editor.full.forward": "Posunout {name} dopředu",
  "editor.full.height": "Výška v milimetrech",
  "editor.full.hideNote": "Skrýt tuto poznámku",
  "editor.full.image": "Obrázek",
  "editor.full.inFull": "Tento návrh je v plném editoru",
  "editor.full.inFullBody": "Věci jste posunuli, takže formulář už neodpovídá. Pokračujte v editoru, nebo se vraťte k formuláři a o posunutí přijdete. Váš text zůstane v obou případech.",
  "editor.full.ink": "Barva tisku",
  "editor.full.layers": "Vrstvy",
  "editor.full.line": "Čára",
  "editor.full.madeYours": "{design}, po vašem",
  "editor.full.medium": "Středně silné",
  "editor.full.noLayers": "Na této straně zatím nic není.",
  "editor.full.note": "Přetažením posunete, nebo použijte šipky. Vše za bezpečným okrajem může být oříznuto.",
  "editor.full.nothing": "Nic není vybráno. Klepněte na něco na kartě, nebo pomocí nástrojů přidejte text, obrázek či tvar.",
  "editor.full.open": "Otevřít plný editor",
  "editor.full.paper": "Papír",
  "editor.full.partText": "Text",
  "editor.full.position": "Poloha a velikost",
  "editor.full.properties": "Vlastnosti",
  "editor.full.rect": "Obdélník",
  "editor.full.regular": "Normální",
  "editor.full.replaceImage": "Nahradit obrázek",
  "editor.full.safe": "Přesahuje bezpečný okraj. Zmenšete to nebo posuňte dovnitř.",
  "editor.full.sample": "Sem váš text",
  "editor.full.select": "Vybrat {name}",
  "editor.full.semibold": "Polotučné",
  "editor.full.sending": "Nahrává se váš obrázek",
  "editor.full.size": "{w} × {h} mm · spadávka {bleed} mm · bezpečný okraj {safe} mm",
  "editor.full.sizeNoSafe": "{w} × {h} mm · spadávka {bleed} mm",
  "editor.full.sizePt": "Velikost v bodech",
  "editor.full.start": "Na začátek",
  "editor.full.toForm": "Vrátit se k formuláři",
  "editor.full.tools": "Nástroje",
  "editor.full.twoPictures": "Návrh pojme nejvýš dva obrázky: jeden nahraďte, nebo ho nejdřív odstraňte.",
  "editor.full.uploadImage": "Nahrát obrázek",
  "editor.full.use": "Použít tento návrh",
  "editor.full.weight": "Řez",
  "editor.full.width": "Šířka v milimetrech",
  "editor.full.words": "Text",
  "editor.full.zoom": "Přiblížení",
  "editor.full.zoomIn": "Přiblížit",
  "editor.full.zoomOut": "Oddálit",
  "editor.loading": "Načítáme návrhy",
  "editor.logo.across": "{size} na šířku",
  "editor.logo.centre": "Vycentrovat",
  "editor.logo.down": "Posunout dolů",
  "editor.logo.fill": "Vyplnit",
  "editor.logo.fitAria": "Jak logo sedí ve svém rámečku",
  "editor.logo.fitInside": "Vejít dovnitř",
  "editor.logo.inBox": "Ve svém rámečku",
  "editor.logo.left": "Posunout doleva",
  "editor.logo.nudge": "Posunout",
  "editor.logo.nudgeAria": "Posunout logo",
  "editor.logo.right": "Posunout doprava",
  "editor.logo.size": "Velikost v rámečku",
  "editor.logo.up": "Posunout nahoru",
  "editor.missing": "Tento produkt teď nelze upravit.",
  "editor.oneColour.fine": "Některé čáry jsou na gravírování příliš jemné — mohou zmizet",
  "editor.oneColour.fineHow": "Posuňte jezdec k „Méně gravírovat“, abyste jemné stínování vypustili, nebo nahrajte výraznější verzi loga.",
  "editor.oneColour.in": "Logo je nahrané. Podívejte se, jak se vygravíruje.",
  "editor.oneColour.laser": "Jak ho vyřízne laser",
  "editor.oneColour.laserAria": "Vaše logo vygravírované do materiálu {material}",
  "editor.oneColour.laserAriaPlain": "Vaše logo, jak ho laser vygravíruje",
  "editor.oneColour.later": "Jemné detaily znovu zkontrolujeme, až připravíme váš náhled k odsouhlasení.",
  "editor.oneColour.lead": "Laser řeže jednu barvu. Vše tmavší než nastavená hranice se vygravíruje; vše světlejší zůstane jako {material}.",
  "editor.oneColour.leadPlain": "Laser řeže jednu barvu. Vše tmavší než nastavená hranice se vygravíruje; vše světlejší zůstane, jak je.",
  "editor.oneColour.less": "Méně gravírovat",
  "editor.oneColour.line": "Kde světlá přechází v tmavou",
  "editor.oneColour.mayBeFine": "Některé čáry mohou být příliš jemné",
  "editor.oneColour.more": "Více gravírovat",
  "editor.oneColour.open": "Převést na jednu barvu",
  "editor.oneColour.set": "Nastaveno na gravírování jednou barvou.",
  "editor.oneColour.use": "Použít",
  "editor.oneColour.yours": "Váš soubor",
  "editor.oneColour.yoursAria": "Vaše logo, jak bylo nahráno",
  "editor.preview.noBasket": "Náhled — nic se nevloží do skutečného košíku.",
  "editor.preview.noBasketPrint": "Prohlížíte si to jako zákazník — nic se nevloží do košíku.",
  "editor.preview.noSave": "Náhled — ukládání je tu vypnuté.",
  "editor.preview.noSavePrint": "Prohlížíte si to jako zákazník — nic se neuloží.",
  "editor.quote.each": "{price} za kus",
  "editor.quote.more": "A ještě {n}.",
  "editor.quote.nothingAdded": "Úpravy cenu nezvyšují.",
  "editor.quote.ready": "Hotovo {date}",
  "editor.quote.show": "Ukázat",
  "editor.quote.title": "Vaše cenová nabídka",
  "editor.redo": "Znovu",
  "editor.retry": "Zkusit znovu",
  "editor.save": "Uložit a vrátit se později",
  "editor.save.body": "Návrh uložíme a pošleme vám na něj e-mailem soukromý odkaz. Nikdo jiný ho neotevře.",
  "editor.save.bodyPrint": "Návrh uložíme a pošleme vám na něj e-mailem soukromý odkaz. Otevřít ho můžete jen vy a {shop}.",
  "editor.save.email": "Váš e-mail",
  "editor.save.emailBad": "To nevypadá jako e-mailová adresa. Zkuste jmeno@example.com",
  "editor.save.emailNone": "Zadejte svůj e-mail, abychom vám mohli poslat odkaz",
  "editor.save.emailPrint": "E-mailová adresa",
  "editor.save.submit": "Uložit",
  "editor.save.submitPrint": "Uložit a poslat odkaz",
  "editor.saved.backToShop": "Zpět do obchodu",
  "editor.saved.keepGoing": "Pokračovat",
  "editor.saved.sentTo": "Odesláno na {email}. Odkaz otevře vaše návrhy a ničí jiné.",
  "editor.saved.title": "Uloženo. Poslali jsme vám e-mailem odkaz, abyste se k návrhu mohli vrátit.",
  "editor.side.back": "Zadní strana",
  "editor.side.front": "Přední strana",
  "editor.sides.both": "oboustranně",
  "editor.sides.one": "jednostranně",
  "editor.stage.assembled": "Sestaveno",
  "editor.stage.bleed": "Spadávka",
  "editor.stage.close": "Zavřít náhled",
  "editor.stage.full": "Náhled na celou obrazovku",
  "editor.stage.guides": "Vodítka",
  "editor.stage.hint": "Tažením otočíte · kolečkem přiblížíte",
  "editor.stage.hintPhone": "Tažením otočíte · roztažením prstů přiblížíte",
  "editor.stage.kitModes": "Jak stavebnici zobrazit",
  "editor.stage.label": "{product}, {design}. Zobrazeno naplocho.",
  "editor.stage.label3d": "{product}, {design}. Šipkami ho otočíte, plusem a mínusem přiblížíte, nulou vrátíte pohled.",
  "editor.stage.locked": "{name} je část od obchodu — zůstává beze změny.",
  "editor.stage.mode": "Jak se karta zobrazí",
  "editor.stage.no3d": "Toto zařízení neumí zobrazit 3D náhled, proto vidíte každý díl naplocho. Je to stejný návrh, jaký vyřežeme.",
  "editor.stage.pieces": "{n, plural, one {# díl} few {# díly} other {# dílů}}",
  "editor.stage.pieces3d": "Díly",
  "editor.stage.printed": "Jak se vytiskne",
  "editor.stage.reset": "Obnovit pohled",
  "editor.stage.roledescription": "3D náhled",
  "editor.stage.safe": "Bezpečný okraj",
  "editor.stage.seeFlat": "Zobrazit naplocho",
  "editor.stage.side": "Strana",
  "editor.stage.trim": "Ořez",
  "editor.stage.turn": "Otočit díl",
  "editor.stage.turnDown": "Otočit dolů",
  "editor.stage.turnLeft": "Otočit doleva",
  "editor.stage.turnRight": "Otočit doprava",
  "editor.stage.turnUp": "Otočit nahoru",
  "editor.stage.turned": "Otočeno přes celou obrazovku.",
  "editor.stage.withGuides": "S vodítky",
  "editor.stage.zoom": "Přiblížení",
  "editor.stage.zoomIn": "Přiblížit",
  "editor.stage.zoomOut": "Oddálit",
  "editor.undo": "Zpět",
  "editor.upload.big": "Soubor je větší než {size}",
  "editor.upload.cap": "Poslali jste tolik souborů, kolik denně přijímáme. Zkuste to zítra.",
  "editor.upload.failed": "Soubor se nepodařilo odeslat. Zkuste to znovu.",
  "editor.upload.heic": "Fotografie je ve formátu HEIC, ze kterého tisknout nemůžeme. Uložte ji jako JPEG nebo PNG a nahrajte znovu.",
  "editor.upload.kindLogo": "Tohle není SVG, PDF, PNG ani JPEG",
  "editor.upload.kindOther": "Tento druh souboru tu nelze použít.",
  "editor.upload.kindPhoto": "Tohle není PNG ani JPEG",
  "editor.upload.off": "Tento obchod tu zatím soubory nepřijímá.",
  "editor.upload.quota": "Teď nemůžeme soubory přijmout. Zkuste to později.",
  "editor.upload.sending": "Odesílá se",
  "editor.upload.sendingLogo": "Nahrává se vaše logo",
  "editor.upload.sendingPhoto": "Nahrává se vaše fotografie",
  "editor.upload.svgCleaned": "Tento SVG obsahuje něco, z čeho tisknout nemůžeme. Uložte ho jako obyčejný SVG a nahrajte znovu.",
  "editor.ways.blank": "Začít s prázdnou stránkou",
  "editor.ways.blankBody": "Plný editor na stránce v konečném formátu se zakreslenou spadávkou a bezpečným okrajem.",
  "editor.ways.blankMeta": "{w} × {h} mm + {bleed} mm spadávka",
  "editor.ways.blankNone": "Stránka v konečném formátu se zakreslenou spadávkou a bezpečným okrajem.",
  "editor.ways.chooseBody": "Hotový návrh od tiskárny. Doplňte texty, přidejte logo, vyberte barvy.",
  "editor.ways.noDesigns": "K produktu {product} zatím nejsou žádné hotové návrhy.",
  "editor.ways.own": "Poslat vlastní soubor",
  "editor.ways.ownBody": "Máte už tiskový soubor? Nahrajte ho a člověk ho zkontroluje.",
  "editor.ways.ownMeta": "PDF · TIFF · JPEG · do 100 MB",
  "editor.ways.ownNone": "PDF, TIFF nebo JPEG do 100 MB.",
  "editor.ways.title": "Jak ho chcete vytvořit?"
}, ld = {
  "editor.add": "Læg i kurven",
  "editor.bar.fewer": "Én mindre",
  "editor.bar.fix": "Ret {n, plural, one {# ting} other {# ting}} under tjek, før det kan lægges i kurven.",
  "editor.bar.howMany": "Antal",
  "editor.bar.more": "Én mere",
  "editor.bar.working": "Beregner prisen …",
  "editor.cancel": "Annuller",
  "editor.check.blurry": "Dit logo kan blive uskarpt i denne størrelse — en større fil eller en SVG bliver skarpere",
  "editor.check.blurryDetail": "{px} px giver {dpi} dpi ved {w} × {h} mm — vi skal bruge {needs}.",
  "editor.check.blurryPhoto": "Dit foto kan blive uskarpt i denne størrelse — en større fil bliver skarpere",
  "editor.check.fileKind": "Den slags fil kan ikke bruges her.",
  "editor.check.fileKindListed": "{part}: den slags fil kan ikke bruges her",
  "editor.check.fileKindPrinted": "Et hævet logo skal være en tegning: send det som SVG. Et billede har ingen kanter, der kan hæves.",
  "editor.check.fileKindPrintedListed": "{part}: send dit logo som en SVG-tegning",
  "editor.check.fileMissing": "Filen til denne del kom ikke frem. Upload den igen.",
  "editor.check.fileMissingListed": "{part}: upload filen igen",
  "editor.check.fine": "Nogle streger i dit logo er for fine til at gravere — de kan forsvinde",
  "editor.check.hard": "Svært at læse — teksten ligger for tæt på farven bagved.",
  "editor.check.lines": "{n, plural, one {Der er kun plads til # linje her.} other {Der er kun plads til # linjer her.}}",
  "editor.check.linesListed": "{part} har for mange linjer.",
  "editor.check.logoSmall": "Dit logo bliver kun {size} bredt — for lille til at kunne ses tydeligt",
  "editor.check.needLogo": "Tilføj et logo — designet skal bruge et.",
  "editor.check.needLogoShort": "Tilføj et logo.",
  "editor.check.needPhoto": "Tilføj et foto — designet skal bruge et.",
  "editor.check.needPhotoShort": "Tilføj et foto.",
  "editor.check.needWords": "Udfyld “{part}” — designet skal bruge det.",
  "editor.check.needWordsShort": "Udfyld “{part}”.",
  "editor.check.needed": "{part} skal udfyldes — feltet må ikke stå tomt",
  "editor.check.neededField": "Skriv din tekst — denne del skal udfyldes",
  "editor.check.notOffered": "Det valg tilbyder butikken ikke her. Vælg et andet.",
  "editor.check.over": "{n, plural, one {# tegn for meget.} other {# tegn for meget.}} Ved {size} er der plads til {limit} tegn i denne del.",
  "editor.check.overGrows": "{n, plural, one {# tegn for meget.} other {# tegn for meget.}} Ved {size} er der plads til {limit} tegn i denne del. Mindre bogstaver giver plads til flere.",
  "editor.check.overListed": "{part}: {n, plural, one {# tegn for langt} other {# tegn for langt}}",
  "editor.check.overPrint": "{n} over grænsen. Gør teksten kortere.",
  "editor.check.overPrintListed": "{part} er {n, plural, one {# tegn} other {# tegn}} over grænsen.",
  "editor.check.safe": "Det går ud over sikkerhedsmargenen.",
  "editor.check.safeListed": "{part} går ud over sikkerhedsmargenen.",
  "editor.check.safeShorten": "Det går ud over sikkerhedsmargenen. Gør teksten kortere.",
  "editor.check.size": "Den størrelse kan ikke bruges til denne del.",
  "editor.check.sizeFloor": "Bogstaver under {size} bliver ikke skarpe",
  "editor.check.unknown": "Designet kan ikke laves, som det er. Start forfra med et af butikkens designs.",
  "editor.checks.clear": "Alt er i orden",
  "editor.checks.count": "{n} at se på",
  "editor.checks.go": "Gå dertil",
  "editor.checks.nothing": "Intet at rette. Om det ser rigtigt ud, er det korrekturen til.",
  "editor.checks.title": "Tjek",
  "editor.chip.logo": "Dit logo",
  "editor.chip.motif": "Motiver",
  "editor.chip.photo": "Foto",
  "editor.chip.words": "Dine tekster",
  "editor.choose.changeSides": "Skift format eller sider",
  "editor.choose.chip": "Gør det til dit eget",
  "editor.choose.colourways": "{n, plural, one {# farvevariant} other {# farvevarianter}}",
  "editor.choose.count": "{n, plural, one {# design} other {# designs}}",
  "editor.choose.layouts": "{n, plural, one {# layout} other {# layouts}}",
  "editor.choose.noMatch": "Ingen designs passer",
  "editor.choose.noMatchQuery": "Ingen designs passer til “{query}”",
  "editor.choose.none": "Ingen færdige designs til {product} endnu",
  "editor.choose.noneSub": "Start med en tom side i den rigtige størrelse, eller send en fil, du selv har lavet.",
  "editor.choose.plain": "Start med det rene emne",
  "editor.choose.plainNone": "Emnet, som det er, uden noget tilføjet.",
  "editor.choose.plainSub": "Din tekst eller dit logo, hvor værkstedet tillader det.",
  "editor.choose.search": "Søg i designs",
  "editor.choose.show": "Vis designs",
  "editor.choose.showAll": "Vis alle designs",
  "editor.choose.subMaker": "{n, plural, one {# færdigt design} other {# færdige designs}} til {product}. Vælg et, og ret så det, designet lader dig ændre.",
  "editor.choose.subPrint": "Vist på {product} i {trim}, {sides}. Hvert design har dele, du udfylder; resten forbliver, som butikken har lavet det.",
  "editor.choose.title": "Vælg et design",
  "editor.choose.use": "Tilpas designet {name}. {chips}.",
  "editor.close": "Luk",
  "editor.designs.byCode": "Åbnet, efter du fandt din ordre. Kun du kan se dem.",
  "editor.designs.byLink": "Kun du kan se dem. Du åbnede dem med linket, vi mailede til {email}.",
  "editor.designs.changed": "Sidst ændret {when}",
  "editor.designs.deleteAria": "Slet {name}",
  "editor.designs.deleteBody": "Det forsvinder for altid, sammen med et logo, du har uploadet til det. Ordrer, du allerede har afgivet, beholder deres kopi.",
  "editor.designs.deleteBodyPrint": "Det forsvinder fra dine designs, og linket virker ikke længere. Afgivne ordrer beholder deres egen kopi.",
  "editor.designs.deleteFailed": "Det kunne ikke slettes. Prøv igen.",
  "editor.designs.deleteGone": "Dette design hører nu til en ordre, så det bliver.",
  "editor.designs.deleteTitle": "Slet “{name}”?",
  "editor.designs.deleteYes": "Slet det",
  "editor.designs.deleteYesPrint": "Slet",
  "editor.designs.deleted": "Design slettet.",
  "editor.designs.deletedPrint": "{name} er slettet.",
  "editor.designs.here": "De designs, du har gemt på denne enhed. Kun du kan se dem.",
  "editor.designs.keep": "Behold det",
  "editor.designs.noWords": "Ingen tekst endnu",
  "editor.designs.none": "Ingen gemte designs",
  "editor.designs.noneBody": "Når du trykker på “Gem og kom tilbage”, mens du tilpasser, venter designet her.",
  "editor.designs.noneBodyPrint": "Når du vælger “Gem og kom tilbage”, venter designet her, og vi mailer dig linket.",
  "editor.designs.open": "Åbn",
  "editor.designs.openAria": "Åbn {name}",
  "editor.designs.order": "Bestil det",
  "editor.designs.orderAria": "Bestil {name}",
  "editor.designs.title": "Dine designs",
  "editor.drawing.edit": "Rediger {name}",
  "editor.drawing.locked": "{name} — butikkens del. Den forbliver, som den er.",
  "editor.drawing.logo": "Dit logo",
  "editor.drawing.photo": "Dit foto",
  "editor.error.other": "Det kunne ikke gemmes. Prøv igen.",
  "editor.error.rate": "For mange forsøg. Vent et minut, og prøv igen.",
  "editor.error.refused": "Butikken kunne ikke tage imod designet, som det er. Tjek det, og prøv igen.",
  "editor.failed": "Designene kunne ikke indlæses.",
  "editor.fields.addLogo": "Tilføj dit logo",
  "editor.fields.addWords": "Tilføj tekst",
  "editor.fields.bigger": "Større bogstaver",
  "editor.fields.colour": "Farve",
  "editor.fields.colours": "Farver",
  "editor.fields.coloursSub": "Ændrer alle dele, der bruger dem, på begge sider.",
  "editor.fields.counter": "{count} / {limit}",
  "editor.fields.counterAria": "{count} af {limit} tegn",
  "editor.fields.dropLogo": "Slip dit logo her",
  "editor.fields.dropPhoto": "Slip dit foto her",
  "editor.fields.either": "Lad det være rent, eller sæt din egen tekst eller dit logo her.",
  "editor.fields.finishFor": "Overflade til {part}",
  "editor.fields.fitPhotoAria": "Hvordan fotoet sidder i sin boks",
  "editor.fields.font": "Skrift",
  "editor.fields.fontFor": "Skrift til {part}",
  "editor.fields.kept": "Gemt med dit design",
  "editor.fields.layout": "Opsætning",
  "editor.fields.leaveEmpty": "Lad det stå tomt",
  "editor.fields.lockedAria": "{part}, fastlagt af værkstedet: {value}",
  "editor.fields.logoKinds": "SVG, PDF, PNG eller JPEG, op til {size}",
  "editor.fields.needed": "Påkrævet",
  "editor.fields.neededLower": "påkrævet",
  "editor.fields.nothing": "Der er intet på dette design, du kan ændre.",
  "editor.fields.optional": "Valgfrit",
  "editor.fields.person": "Et menneske tjekker hvert design, før vi sender dig korrekturen.",
  "editor.fields.photoKinds": "PNG eller JPEG, op til {size}",
  "editor.fields.privateLogo": "Kun du og {shop} kan se dit logo.",
  "editor.fields.privateMaker": "Dit logo er privat. Kun du og værkstedet kan se det.",
  "editor.fields.privateMakerPhoto": "Dit foto er privat. Kun du og værkstedet kan se det.",
  "editor.fields.privatePhoto": "Kun du og {shop} kan se dit foto.",
  "editor.fields.removeLogo": "Fjern dit logo",
  "editor.fields.removeLogoPrint": "Fjern logoet",
  "editor.fields.removePhoto": "Fjern dit foto",
  "editor.fields.removePhotoPrint": "Fjern fotoet",
  "editor.fields.replace": "Erstat",
  "editor.fields.setByStudio": "Fastlagt af værkstedet",
  "editor.fields.size": "Størrelse",
  "editor.fields.sizeFor": "Bogstavstørrelse til {part}",
  "editor.fields.smaller": "Mindre bogstaver",
  "editor.fields.uploadLogo": "Upload dit logo",
  "editor.fields.uploadPhoto": "Upload dit foto",
  "editor.fields.yourLogo": "{part} — dit logo",
  "editor.fields.yourWords": "{part} — din tekst",
  "editor.fill.allDesigns": "Alle designs",
  "editor.fill.change": "Skift design",
  "editor.fill.design": "Valgt design: {name}",
  "editor.fill.fullEditor": "Skift til den fulde editor",
  "editor.fill.makeItYours": "Gør det til dit eget",
  "editor.fill.noneBody": "Du starter med det rene emne. Tilføj din tekst, hvor værkstedet tillader det.",
  "editor.fill.noneTitle": "Ingen færdige designs til dette produkt",
  "editor.fill.ordered": "Designet hører allerede til en ordre, så det forbliver, som det var. Det, du ændrer her, gemmes som et nyt design.",
  "editor.fill.plain": "Rent emne",
  "editor.fill.proof": "Vi sender dig en korrektur, før vi skærer noget.",
  "editor.fill.toChange": "{n} AT ÆNDRE",
  "editor.fill.yourDesign": "Dit design",
  "editor.filter.all": "Alle",
  "editor.filter.bold": "Markante",
  "editor.filter.logo": "Med logo",
  "editor.filter.motif": "Motiver",
  "editor.filter.one": "Én farve",
  "editor.filter.photo": "Med foto",
  "editor.filter.simple": "Enkle",
  "editor.filter.words": "Kun tekst",
  "editor.fix.shorten": "Gør det kortere",
  "editor.fix.smaller": "Gør det mindre",
  "editor.fix.use": "Brug {colour}",
  "editor.full.accent": "Accent",
  "editor.full.across": "Vandret i millimeter",
  "editor.full.addImage": "Tilføj et billede",
  "editor.full.addWords": "Tilføj tekst",
  "editor.full.alignBottom": "Justér til bunden",
  "editor.full.alignCentre": "Centrér vandret",
  "editor.full.alignLeft": "Justér til venstre kant",
  "editor.full.alignMiddle": "Centrér lodret",
  "editor.full.alignPage": "Justér efter siden",
  "editor.full.alignRight": "Justér til højre kant",
  "editor.full.alignTop": "Justér til toppen",
  "editor.full.alignment": "Justering",
  "editor.full.back": "Tilbage",
  "editor.full.backToForm": "Tilbage til formularen",
  "editor.full.backward": "Send {name} bagud",
  "editor.full.banner": "Du kan flytte alt nu; dine ord bliver.",
  "editor.full.blank": "Start med en tom side",
  "editor.full.blurry": "Billedet kan blive sløret i denne størrelse — {dpi} dpi, vi skal bruge {needs}. En større fil bliver skarpere.",
  "editor.full.bold": "Fed",
  "editor.full.card": "Dit design, {side}",
  "editor.full.centre": "Midte",
  "editor.full.delete": "Slet",
  "editor.full.down": "Lodret i millimeter",
  "editor.full.ellipse": "Ellipse",
  "editor.full.empty": "Læg først noget på kortet.",
  "editor.full.end": "Slut",
  "editor.full.extrabold": "Ekstra fed",
  "editor.full.fill": "Fyld",
  "editor.full.fitAria": "Hvordan det sidder i sin boks",
  "editor.full.forward": "Bring {name} frem",
  "editor.full.height": "Højde i millimeter",
  "editor.full.hideNote": "Skjul denne note",
  "editor.full.image": "Billede",
  "editor.full.inFull": "Dette design er i den fulde editor",
  "editor.full.inFullBody": "Du har flyttet rundt på ting, så formularen passer ikke længere. Fortsæt i editoren, eller gå tilbage til formularen og mist flytningerne. Dine ord bliver uanset hvad.",
  "editor.full.ink": "Blæk",
  "editor.full.layers": "Lag",
  "editor.full.line": "Streg",
  "editor.full.madeYours": "{design}, gjort til dit eget",
  "editor.full.medium": "Medium",
  "editor.full.noLayers": "Intet på denne side endnu.",
  "editor.full.note": "Træk for at flytte, eller brug piletasterne. Alt uden for sikkerhedsmargenen kan blive skåret af.",
  "editor.full.nothing": "Intet valgt. Tryk på noget på kortet, eller tilføj tekst, et billede eller en form med værktøjerne.",
  "editor.full.open": "Åbn den fulde editor",
  "editor.full.paper": "Papir",
  "editor.full.partText": "Tekst",
  "editor.full.position": "Placering og størrelse",
  "editor.full.properties": "Egenskaber",
  "editor.full.rect": "Rektangel",
  "editor.full.regular": "Normal",
  "editor.full.replaceImage": "Erstat billedet",
  "editor.full.safe": "Det går ud over sikkerhedsmargenen. Gør det mindre, eller ryk det ind.",
  "editor.full.sample": "Dine ord her",
  "editor.full.select": "Vælg {name}",
  "editor.full.semibold": "Halvfed",
  "editor.full.sending": "Dit billede uploades",
  "editor.full.size": "{w} × {h} mm · beskæring {bleed} mm · sikkerhedsmargen {safe} mm",
  "editor.full.sizeNoSafe": "{w} × {h} mm · beskæring {bleed} mm",
  "editor.full.sizePt": "Størrelse i punkter",
  "editor.full.start": "Start",
  "editor.full.toForm": "Gå tilbage til formularen",
  "editor.full.tools": "Værktøjer",
  "editor.full.twoPictures": "Et design kan højst have to billeder: erstat et, eller fjern det først.",
  "editor.full.uploadImage": "Upload et billede",
  "editor.full.use": "Brug dette design",
  "editor.full.weight": "Vægt",
  "editor.full.width": "Bredde i millimeter",
  "editor.full.words": "Ord",
  "editor.full.zoom": "Zoom",
  "editor.full.zoomIn": "Zoom ind",
  "editor.full.zoomOut": "Zoom ud",
  "editor.loading": "Indlæser designs",
  "editor.logo.across": "{size} på tværs",
  "editor.logo.centre": "Centrér det",
  "editor.logo.down": "Skub ned",
  "editor.logo.fill": "Udfyld",
  "editor.logo.fitAria": "Hvordan logoet sidder i sin boks",
  "editor.logo.fitInside": "Tilpas indeni",
  "editor.logo.inBox": "I sin boks",
  "editor.logo.left": "Skub til venstre",
  "editor.logo.nudge": "Skub",
  "editor.logo.nudgeAria": "Skub logoet",
  "editor.logo.right": "Skub til højre",
  "editor.logo.size": "Størrelse i boksen",
  "editor.logo.up": "Skub op",
  "editor.missing": "Dette produkt kan ikke tilpasses lige nu.",
  "editor.oneColour.fine": "Nogle streger er for fine til at gravere — de kan forsvinde",
  "editor.oneColour.fineHow": "Flyt skyderen mod „Mindre graveret“ for at fjerne den fine skygge, eller upload en kraftigere udgave af dit logo.",
  "editor.oneColour.in": "Dit logo er med. Se, hvordan det graveres.",
  "editor.oneColour.laser": "Sådan skærer laseren det",
  "editor.oneColour.laserAria": "Dit logo graveret i {material}",
  "editor.oneColour.laserAriaPlain": "Dit logo, som laseren graverer det",
  "editor.oneColour.later": "Vi tjekker fine detaljer igen, når vi laver din korrektur.",
  "editor.oneColour.lead": "Laseren skærer én farve. Alt, der er mørkere end den streg, du sætter, graveres; alt lysere forbliver {material}.",
  "editor.oneColour.leadPlain": "Laseren skærer én farve. Alt, der er mørkere end den streg, du sætter, graveres; alt lysere forbliver, som det er.",
  "editor.oneColour.less": "Mindre graveret",
  "editor.oneColour.line": "Hvor lyst bliver mørkt",
  "editor.oneColour.mayBeFine": "Nogle streger er måske for fine",
  "editor.oneColour.more": "Mere graveret",
  "editor.oneColour.open": "Gør det ensfarvet",
  "editor.oneColour.set": "Sat til at blive graveret i én farve.",
  "editor.oneColour.use": "Brug dette",
  "editor.oneColour.yours": "Din fil",
  "editor.oneColour.yoursAria": "Dit logo, som det blev uploadet",
  "editor.preview.noBasket": "Forhåndsvisning — intet havner i en rigtig kurv.",
  "editor.preview.noBasketPrint": "Du ser det som kunde — intet havner i en kurv.",
  "editor.preview.noSave": "Forhåndsvisning — gem er slået fra her.",
  "editor.preview.noSavePrint": "Du ser det som kunde — intet bliver gemt.",
  "editor.quote.each": "{price} pr. stk.",
  "editor.quote.more": "Og {n} mere.",
  "editor.quote.nothingAdded": "Det koster ikke ekstra at tilpasse.",
  "editor.quote.ready": "Klar {date}",
  "editor.quote.show": "Vis mig",
  "editor.quote.title": "Dit tilbud",
  "editor.redo": "Gentag",
  "editor.retry": "Prøv igen",
  "editor.save": "Gem og kom tilbage",
  "editor.save.body": "Vi gemmer designet og mailer dig et privat link til det. Ingen andre kan åbne det.",
  "editor.save.bodyPrint": "Vi gemmer designet og mailer dig et privat link til det. Kun du og {shop} kan åbne det.",
  "editor.save.email": "Din e-mail",
  "editor.save.emailBad": "Det ligner ikke en e-mailadresse. Prøv navn@example.com",
  "editor.save.emailNone": "Skriv din e-mail, så vi kan sende dig linket",
  "editor.save.emailPrint": "E-mailadresse",
  "editor.save.submit": "Gem det",
  "editor.save.submitPrint": "Gem og send linket",
  "editor.saved.backToShop": "Tilbage til butikken",
  "editor.saved.keepGoing": "Fortsæt",
  "editor.saved.sentTo": "Sendt til {email}. Linket åbner dine designs og ingen andres.",
  "editor.saved.title": "Gemt. Vi har mailet dig et link, så du kan vende tilbage til det.",
  "editor.side.back": "Bagside",
  "editor.side.front": "Forside",
  "editor.sides.both": "tosidet",
  "editor.sides.one": "enkeltsidet",
  "editor.stage.assembled": "Samlet",
  "editor.stage.bleed": "Beskæring",
  "editor.stage.close": "Luk forhåndsvisningen",
  "editor.stage.full": "Fuldskærmsvisning",
  "editor.stage.guides": "Hjælpelinjer",
  "editor.stage.hint": "Træk for at dreje · rul for at zoome",
  "editor.stage.hintPhone": "Træk for at dreje · knib for at zoome",
  "editor.stage.kitModes": "Sådan vises sættet",
  "editor.stage.label": "{product}, {design}. Vist fladt.",
  "editor.stage.label3d": "{product}, {design}. Brug piletasterne til at dreje den, plus og minus til at zoome og 0 til at nulstille.",
  "editor.stage.locked": "{name} er butikkens del — den forbliver, som den er.",
  "editor.stage.mode": "Sådan vises kortet",
  "editor.stage.no3d": "Denne enhed kan ikke vise 3D-visningen, så du ser hver del fladt. Det er det samme design, vi skærer.",
  "editor.stage.pieces": "{n, plural, one {# del} other {# dele}}",
  "editor.stage.pieces3d": "Dele",
  "editor.stage.printed": "Som trykt",
  "editor.stage.reset": "Nulstil visningen",
  "editor.stage.roledescription": "3D-forhåndsvisning",
  "editor.stage.safe": "Sikkerhedsmargen",
  "editor.stage.seeFlat": "Se den fladt",
  "editor.stage.side": "Side",
  "editor.stage.trim": "Skæring",
  "editor.stage.turn": "Drej delen",
  "editor.stage.turnDown": "Drej nedad",
  "editor.stage.turnLeft": "Drej til venstre",
  "editor.stage.turnRight": "Drej til højre",
  "editor.stage.turnUp": "Drej opad",
  "editor.stage.turned": "Drejet, så det fylder skærmen.",
  "editor.stage.withGuides": "Med hjælpelinjer",
  "editor.stage.zoom": "Zoom",
  "editor.stage.zoomIn": "Zoom ind",
  "editor.stage.zoomOut": "Zoom ud",
  "editor.undo": "Fortryd",
  "editor.upload.big": "Filen er større end {size}",
  "editor.upload.cap": "Du har sendt så mange filer, som vi tager imod på en dag. Prøv igen i morgen.",
  "editor.upload.failed": "Filen kunne ikke sendes. Prøv igen.",
  "editor.upload.heic": "Fotoet er i HEIC, som vi ikke kan trykke fra. Gem det som JPEG eller PNG, og upload det igen.",
  "editor.upload.kindLogo": "Det er ikke en SVG, PDF, PNG eller JPEG",
  "editor.upload.kindOther": "Den slags fil kan ikke bruges her.",
  "editor.upload.kindPhoto": "Det er ikke en PNG eller JPEG",
  "editor.upload.off": "Butikken tager ikke imod filer her endnu.",
  "editor.upload.quota": "Vi kan ikke tage imod filer lige nu. Prøv igen senere.",
  "editor.upload.sending": "Sender",
  "editor.upload.sendingLogo": "Dit logo uploades",
  "editor.upload.sendingPhoto": "Dit foto uploades",
  "editor.upload.svgCleaned": "Denne SVG indeholder noget, vi ikke kan trykke fra. Gem den som en almindelig SVG, og upload den igen.",
  "editor.ways.blank": "Start med en tom side",
  "editor.ways.blankBody": "Den fulde editor på en side i færdigt format med beskæring og sikkerhedsmargen tegnet ind.",
  "editor.ways.blankMeta": "{w} × {h} mm + {bleed} mm beskæring",
  "editor.ways.blankNone": "Siden i færdigt format med beskæring og sikkerhedsmargen tegnet ind.",
  "editor.ways.chooseBody": "Et færdigt design fra trykkeriet. Udfyld dine tekster, tilføj dit logo, vælg farverne.",
  "editor.ways.noDesigns": "Der er endnu ingen færdige designs til {product}.",
  "editor.ways.own": "Send din egen fil",
  "editor.ways.ownBody": "Har du allerede trykklar grafik? Upload den, så tjekker et menneske den.",
  "editor.ways.ownMeta": "PDF · TIFF · JPEG · op til 100 MB",
  "editor.ways.ownNone": "En PDF, TIFF eller JPEG op til 100 MB.",
  "editor.ways.title": "Hvordan vil du lave det?"
}, dd = {
  "editor.add": "In den Warenkorb",
  "editor.bar.fewer": "Eins weniger",
  "editor.bar.fix": "Beheben Sie {n, plural, one {# Punkt} other {# Punkte}} in den Prüfungen, bevor es in den Warenkorb kann.",
  "editor.bar.howMany": "Anzahl",
  "editor.bar.more": "Eins mehr",
  "editor.bar.working": "Preis wird berechnet …",
  "editor.cancel": "Abbrechen",
  "editor.check.blurry": "Ihr Logo könnte in dieser Größe unscharf drucken – eine größere Datei oder ein SVG wird schärfer",
  "editor.check.blurryDetail": "{px} px ergeben bei {w} × {h} mm nur {dpi} dpi – wir brauchen {needs}.",
  "editor.check.blurryPhoto": "Ihr Foto könnte in dieser Größe unscharf drucken – eine größere Datei wird schärfer",
  "editor.check.fileKind": "Diese Dateiart kann hier nicht verwendet werden.",
  "editor.check.fileKindListed": "{part}: Diese Dateiart kann hier nicht verwendet werden",
  "editor.check.fileKindPrinted": "Ein erhabenes Logo muss eine Zeichnung sein: Senden Sie es als SVG. Ein Bild hat keine Kanten, die sich erheben lassen.",
  "editor.check.fileKindPrintedListed": "{part}: Senden Sie Ihr Logo als SVG-Zeichnung",
  "editor.check.fileMissing": "Die Datei für diesen Teil ist nicht angekommen. Laden Sie sie bitte noch einmal hoch.",
  "editor.check.fileMissingListed": "{part}: Datei bitte noch einmal hochladen",
  "editor.check.fine": "Manche Linien in Ihrem Logo sind zu fein zum Gravieren – sie könnten verschwinden",
  "editor.check.hard": "Schwer lesbar – der Text ist der Farbe dahinter zu ähnlich.",
  "editor.check.lines": "{n, plural, one {Hier passt nur # Zeile hin.} other {Hier passen nur # Zeilen hin.}}",
  "editor.check.linesListed": "{part} hat zu viele Zeilen.",
  "editor.check.logoSmall": "Ihr Logo wird nur {size} breit – zu klein, um es zu erkennen",
  "editor.check.needLogo": "Fügen Sie ein Logo hinzu – dieses Design braucht eins.",
  "editor.check.needLogoShort": "Fügen Sie ein Logo hinzu.",
  "editor.check.needPhoto": "Fügen Sie ein Foto hinzu – dieses Design braucht eins.",
  "editor.check.needPhotoShort": "Fügen Sie ein Foto hinzu.",
  "editor.check.needWords": "Füllen Sie „{part}“ aus – dieses Design braucht es.",
  "editor.check.needWordsShort": "Füllen Sie „{part}“ aus.",
  "editor.check.needed": "{part} wird benötigt – das Feld darf nicht leer bleiben",
  "editor.check.neededField": "Geben Sie Ihren Text ein – dieser Teil wird benötigt",
  "editor.check.notOffered": "Diese Auswahl bietet der Shop hier nicht an. Wählen Sie bitte etwas anderes.",
  "editor.check.over": "{n, plural, one {# Zeichen zu viel.} other {# Zeichen zu viel.}} Bei {size} passen in diesen Teil {limit} Zeichen.",
  "editor.check.overGrows": "{n, plural, one {# Zeichen zu viel.} other {# Zeichen zu viel.}} Bei {size} passen in diesen Teil {limit} Zeichen. Mit kleinerer Schrift passt mehr hinein.",
  "editor.check.overListed": "{part}: {n, plural, one {# Zeichen zu lang} other {# Zeichen zu lang}}",
  "editor.check.overPrint": "{n} Zeichen zu viel. Bitte kürzen Sie den Text.",
  "editor.check.overPrintListed": "{part} ist {n, plural, one {# Zeichen} other {# Zeichen}} über dem Limit.",
  "editor.check.safe": "Das ragt in den Sicherheitsabstand hinein.",
  "editor.check.safeListed": "{part} ragt in den Sicherheitsabstand hinein.",
  "editor.check.safeShorten": "Das ragt in den Sicherheitsabstand hinein. Bitte kürzen Sie den Text.",
  "editor.check.size": "Diese Größe ist für diesen Teil nicht möglich.",
  "editor.check.sizeFloor": "Buchstaben unter {size} werden nicht sauber wiedergegeben",
  "editor.check.unknown": "Dieses Design lässt sich so nicht herstellen. Beginnen Sie bitte neu mit einem der Designs des Shops.",
  "editor.checks.clear": "Alles in Ordnung",
  "editor.checks.count": "{n} zu prüfen",
  "editor.checks.go": "Dorthin",
  "editor.checks.nothing": "Nichts zu beheben. Ob alles richtig aussieht, zeigt Ihnen der Probedruck.",
  "editor.checks.title": "Prüfungen",
  "editor.chip.logo": "Ihr Logo",
  "editor.chip.motif": "Motive",
  "editor.chip.photo": "Foto",
  "editor.chip.words": "Ihre Texte",
  "editor.choose.changeSides": "Format oder Seiten ändern",
  "editor.choose.chip": "Persönlich gestalten",
  "editor.choose.colourways": "{n, plural, one {# Farbvariante} other {# Farbvarianten}}",
  "editor.choose.count": "{n, plural, one {# Design} other {# Designs}}",
  "editor.choose.layouts": "{n, plural, one {# Layout} other {# Layouts}}",
  "editor.choose.noMatch": "Keine passenden Designs",
  "editor.choose.noMatchQuery": "Keine Designs zu „{query}“",
  "editor.choose.none": "Noch keine fertigen Designs für {product}",
  "editor.choose.noneSub": "Beginnen Sie mit einer leeren Seite im richtigen Format oder senden Sie eine eigene Datei.",
  "editor.choose.plain": "Mit dem schlichten Teil beginnen",
  "editor.choose.plainNone": "Das Teil, wie es ist – ohne Zusätze.",
  "editor.choose.plainSub": "Ihr Text oder Logo, wo die Werkstatt es erlaubt.",
  "editor.choose.search": "Designs suchen",
  "editor.choose.show": "Designs zeigen",
  "editor.choose.showAll": "Alle Designs zeigen",
  "editor.choose.subMaker": "{n, plural, one {# fertiges Design} other {# fertige Designs}} für {product}. Wählen Sie eins und ändern Sie dann, was es zulässt.",
  "editor.choose.subPrint": "Gezeigt auf {product} im Format {trim}, {sides}. Jedes hat Teile zum Ausfüllen; der Rest bleibt, wie der Shop ihn gestaltet hat.",
  "editor.choose.title": "Design wählen",
  "editor.choose.use": "Design „{name}“ anpassen. {chips}.",
  "editor.close": "Schließen",
  "editor.designs.byCode": "Geöffnet, nachdem Sie Ihre Bestellung gefunden haben. Nur Sie sehen diese Designs.",
  "editor.designs.byLink": "Nur Sie sehen diese Designs. Sie haben sie über den Link geöffnet, den wir an {email} gemailt haben.",
  "editor.designs.changed": "Zuletzt geändert: {when}",
  "editor.designs.deleteAria": "{name} löschen",
  "editor.designs.deleteBody": "Es ist dann endgültig weg, zusammen mit einem dafür hochgeladenen Logo. Bereits aufgegebene Bestellungen behalten ihre Kopie.",
  "editor.designs.deleteBodyPrint": "Es verschwindet aus Ihren Designs, und sein Link funktioniert nicht mehr. Aufgegebene Bestellungen behalten ihre eigene Kopie.",
  "editor.designs.deleteFailed": "Das ließ sich nicht löschen. Versuchen Sie es noch einmal.",
  "editor.designs.deleteGone": "Dieses Design gehört jetzt zu einer Bestellung und bleibt deshalb erhalten.",
  "editor.designs.deleteTitle": "„{name}“ löschen?",
  "editor.designs.deleteYes": "Löschen",
  "editor.designs.deleteYesPrint": "Löschen",
  "editor.designs.deleted": "Design gelöscht.",
  "editor.designs.deletedPrint": "{name} ist gelöscht.",
  "editor.designs.here": "Die Designs, die Sie auf diesem Gerät gespeichert haben. Nur Sie sehen sie.",
  "editor.designs.keep": "Behalten",
  "editor.designs.noWords": "Noch kein Text",
  "editor.designs.none": "Keine gespeicherten Designs",
  "editor.designs.noneBody": "Wenn Sie beim Gestalten „Speichern und später weitermachen“ wählen, wartet das Design hier auf Sie.",
  "editor.designs.noneBodyPrint": "Wenn Sie „Speichern und später weitermachen“ wählen, wartet das Design hier und wir mailen Ihnen den Link.",
  "editor.designs.open": "Öffnen",
  "editor.designs.openAria": "{name} öffnen",
  "editor.designs.order": "Bestellen",
  "editor.designs.orderAria": "{name} bestellen",
  "editor.designs.title": "Ihre Designs",
  "editor.drawing.edit": "{name} bearbeiten",
  "editor.drawing.locked": "{name} – vom Shop vorgegeben. Das bleibt, wie es ist.",
  "editor.drawing.logo": "Ihr Logo",
  "editor.drawing.photo": "Ihr Foto",
  "editor.error.other": "Das konnte nicht gespeichert werden. Versuchen Sie es noch einmal.",
  "editor.error.rate": "Zu viele Versuche. Warten Sie eine Minute und versuchen Sie es dann noch einmal.",
  "editor.error.refused": "Der Shop kann dieses Design so nicht annehmen. Prüfen Sie es und versuchen Sie es noch einmal.",
  "editor.failed": "Die Designs konnten nicht geladen werden.",
  "editor.fields.addLogo": "Logo hinzufügen",
  "editor.fields.addWords": "Text hinzufügen",
  "editor.fields.bigger": "Größere Buchstaben",
  "editor.fields.colour": "Farbe",
  "editor.fields.colours": "Farben",
  "editor.fields.coloursSub": "Ändert jeden Teil, der sie nutzt, auf beiden Seiten.",
  "editor.fields.counter": "{count} / {limit}",
  "editor.fields.counterAria": "{count} von {limit} Zeichen",
  "editor.fields.dropLogo": "Logo hier ablegen",
  "editor.fields.dropPhoto": "Foto hier ablegen",
  "editor.fields.either": "Lassen Sie es schlicht oder setzen Sie hier Ihren eigenen Text oder Ihr Logo ein.",
  "editor.fields.finishFor": "Ausführung für {part}",
  "editor.fields.fitPhotoAria": "Wie das Foto in seinem Feld sitzt",
  "editor.fields.font": "Schrift",
  "editor.fields.fontFor": "Schrift für {part}",
  "editor.fields.kept": "Mit Ihrem Design gespeichert",
  "editor.fields.layout": "Layout",
  "editor.fields.leaveEmpty": "Leer lassen",
  "editor.fields.lockedAria": "{part}, von der Werkstatt festgelegt: {value}",
  "editor.fields.logoKinds": "SVG, PDF, PNG oder JPEG, bis {size}",
  "editor.fields.needed": "Erforderlich",
  "editor.fields.neededLower": "erforderlich",
  "editor.fields.nothing": "An diesem Design können Sie nichts ändern.",
  "editor.fields.optional": "Optional",
  "editor.fields.person": "Ein Mensch prüft jedes Design, bevor wir Ihnen den Probedruck senden.",
  "editor.fields.photoKinds": "PNG oder JPEG, bis {size}",
  "editor.fields.privateLogo": "Nur Sie und {shop} sehen Ihr Logo.",
  "editor.fields.privateMaker": "Ihr Logo ist privat. Nur Sie und die Werkstatt sehen es.",
  "editor.fields.privateMakerPhoto": "Ihr Foto ist privat. Nur Sie und die Werkstatt sehen es.",
  "editor.fields.privatePhoto": "Nur Sie und {shop} sehen Ihr Foto.",
  "editor.fields.removeLogo": "Ihr Logo entfernen",
  "editor.fields.removeLogoPrint": "Logo entfernen",
  "editor.fields.removePhoto": "Ihr Foto entfernen",
  "editor.fields.removePhotoPrint": "Foto entfernen",
  "editor.fields.replace": "Ersetzen",
  "editor.fields.setByStudio": "Von der Werkstatt festgelegt",
  "editor.fields.size": "Größe",
  "editor.fields.sizeFor": "Schriftgröße für {part}",
  "editor.fields.smaller": "Kleinere Buchstaben",
  "editor.fields.uploadLogo": "Ihr Logo hochladen",
  "editor.fields.uploadPhoto": "Ihr Foto hochladen",
  "editor.fields.yourLogo": "{part} – Ihr Logo",
  "editor.fields.yourWords": "{part} – Ihr Text",
  "editor.fill.allDesigns": "Alle Designs",
  "editor.fill.change": "Design wechseln",
  "editor.fill.design": "Design: {name}",
  "editor.fill.fullEditor": "Zum vollständigen Editor wechseln",
  "editor.fill.makeItYours": "Persönlich gestalten",
  "editor.fill.noneBody": "Sie beginnen mit dem schlichten Teil. Fügen Sie Ihren Text dort hinzu, wo die Werkstatt es erlaubt.",
  "editor.fill.noneTitle": "Hierfür gibt es keine fertigen Designs",
  "editor.fill.ordered": "Dieses Design gehört schon zu einer Bestellung und bleibt deshalb unverändert. Was Sie hier ändern, wird als neues Design gespeichert.",
  "editor.fill.plain": "Schlichtes Teil",
  "editor.fill.proof": "Wir schicken Ihnen einen Probedruck zur Freigabe, bevor wir etwas zuschneiden.",
  "editor.fill.toChange": "{n} ZU ÄNDERN",
  "editor.fill.yourDesign": "Ihr Design",
  "editor.filter.all": "Alle",
  "editor.filter.bold": "Kräftig",
  "editor.filter.logo": "Mit Logo",
  "editor.filter.motif": "Motive",
  "editor.filter.one": "Einfarbig",
  "editor.filter.photo": "Mit Foto",
  "editor.filter.simple": "Schlicht",
  "editor.filter.words": "Nur Text",
  "editor.fix.shorten": "Kürzen",
  "editor.fix.smaller": "Kleiner machen",
  "editor.fix.use": "{colour} verwenden",
  "editor.full.accent": "Akzent",
  "editor.full.across": "Waagerecht in Millimetern",
  "editor.full.addImage": "Bild hinzufügen",
  "editor.full.addWords": "Text hinzufügen",
  "editor.full.alignBottom": "Unten ausrichten",
  "editor.full.alignCentre": "Waagerecht zentrieren",
  "editor.full.alignLeft": "Am linken Rand ausrichten",
  "editor.full.alignMiddle": "Senkrecht zentrieren",
  "editor.full.alignPage": "An der Seite ausrichten",
  "editor.full.alignRight": "Am rechten Rand ausrichten",
  "editor.full.alignTop": "Oben ausrichten",
  "editor.full.alignment": "Ausrichtung",
  "editor.full.back": "Zurück",
  "editor.full.backToForm": "Zurück zum Formular",
  "editor.full.backward": "{name} nach hinten",
  "editor.full.banner": "Sie können jetzt alles verschieben; Ihre Texte bleiben.",
  "editor.full.blank": "Mit leerer Seite beginnen",
  "editor.full.blurry": "Dieses Bild könnte in dieser Größe unscharf drucken – {dpi} dpi, wir brauchen {needs}. Eine größere Datei wird schärfer.",
  "editor.full.bold": "Fett",
  "editor.full.card": "Ihr Entwurf, {side}",
  "editor.full.centre": "Mitte",
  "editor.full.delete": "Löschen",
  "editor.full.down": "Senkrecht in Millimetern",
  "editor.full.ellipse": "Ellipse",
  "editor.full.empty": "Legen Sie zuerst etwas auf die Karte.",
  "editor.full.end": "Ende",
  "editor.full.extrabold": "Extrafett",
  "editor.full.fill": "Füllung",
  "editor.full.fitAria": "Wie es in seinem Feld sitzt",
  "editor.full.forward": "{name} nach vorn",
  "editor.full.height": "Höhe in Millimetern",
  "editor.full.hideNote": "Diesen Hinweis ausblenden",
  "editor.full.image": "Bild",
  "editor.full.inFull": "Dieser Entwurf ist im vollständigen Editor",
  "editor.full.inFullBody": "Sie haben Dinge verschoben, deshalb passt das Formular nicht mehr dazu. Machen Sie im Editor weiter, oder gehen Sie zurück zum Formular und verlieren die Verschiebungen. Ihre Texte bleiben in beiden Fällen.",
  "editor.full.ink": "Druckfarbe",
  "editor.full.layers": "Ebenen",
  "editor.full.line": "Linie",
  "editor.full.madeYours": "{design}, nach Ihrer Art",
  "editor.full.medium": "Mittel",
  "editor.full.noLayers": "Auf dieser Seite ist noch nichts.",
  "editor.full.note": "Ziehen Sie, um zu verschieben, oder nutzen Sie die Pfeiltasten. Alles außerhalb des Sicherheitsabstands kann abgeschnitten werden.",
  "editor.full.nothing": "Nichts ausgewählt. Tippen Sie auf etwas auf der Karte, oder fügen Sie mit den Werkzeugen Text, ein Bild oder eine Form hinzu.",
  "editor.full.open": "Vollständigen Editor öffnen",
  "editor.full.paper": "Papier",
  "editor.full.partText": "Text",
  "editor.full.position": "Position und Größe",
  "editor.full.properties": "Eigenschaften",
  "editor.full.rect": "Rechteck",
  "editor.full.regular": "Normal",
  "editor.full.replaceImage": "Bild ersetzen",
  "editor.full.safe": "Das reicht über den Sicherheitsabstand. Machen Sie es kleiner oder rücken Sie es nach innen.",
  "editor.full.sample": "Ihr Text hier",
  "editor.full.select": "{name} auswählen",
  "editor.full.semibold": "Halbfett",
  "editor.full.sending": "Ihr Bild wird hochgeladen",
  "editor.full.size": "{w} × {h} mm · Beschnitt {bleed} mm · Sicherheitsabstand {safe} mm",
  "editor.full.sizeNoSafe": "{w} × {h} mm · Beschnitt {bleed} mm",
  "editor.full.sizePt": "Größe in Punkt",
  "editor.full.start": "Anfang",
  "editor.full.toForm": "Zurück zum Formular",
  "editor.full.tools": "Werkzeuge",
  "editor.full.twoPictures": "Ein Entwurf nimmt höchstens zwei Bilder: Ersetzen Sie eines, oder entfernen Sie es zuerst.",
  "editor.full.uploadImage": "Bild hochladen",
  "editor.full.use": "Diesen Entwurf nehmen",
  "editor.full.weight": "Stärke",
  "editor.full.width": "Breite in Millimetern",
  "editor.full.words": "Text",
  "editor.full.zoom": "Zoom",
  "editor.full.zoomIn": "Vergrößern",
  "editor.full.zoomOut": "Verkleinern",
  "editor.loading": "Designs werden geladen",
  "editor.logo.across": "{size} breit",
  "editor.logo.centre": "Mittig setzen",
  "editor.logo.down": "Nach unten schieben",
  "editor.logo.fill": "Füllen",
  "editor.logo.fitAria": "Wie das Logo in seinem Feld sitzt",
  "editor.logo.fitInside": "Einpassen",
  "editor.logo.inBox": "In seinem Feld",
  "editor.logo.left": "Nach links schieben",
  "editor.logo.nudge": "Verschieben",
  "editor.logo.nudgeAria": "Das Logo verschieben",
  "editor.logo.right": "Nach rechts schieben",
  "editor.logo.size": "Größe im Feld",
  "editor.logo.up": "Nach oben schieben",
  "editor.missing": "Dieses Produkt lässt sich gerade nicht anpassen.",
  "editor.oneColour.fine": "Manche Linien sind zu fein zum Gravieren – sie könnten verschwinden",
  "editor.oneColour.fineHow": "Schieben Sie den Regler Richtung „Weniger graviert“, um die feine Schattierung wegzulassen, oder laden Sie eine kräftigere Fassung Ihres Logos hoch.",
  "editor.oneColour.in": "Ihr Logo ist da. Sehen Sie nach, wie es graviert wird.",
  "editor.oneColour.laser": "So schneidet es der Laser",
  "editor.oneColour.laserAria": "Ihr Logo, graviert in {material}",
  "editor.oneColour.laserAriaPlain": "Ihr Logo, wie der Laser es graviert",
  "editor.oneColour.later": "Feine Details prüfen wir noch einmal, wenn wir Ihren Korrekturabzug machen.",
  "editor.oneColour.lead": "Der Laser schneidet eine Farbe. Alles, was dunkler ist als die eingestellte Linie, wird graviert; alles Hellere bleibt {material}.",
  "editor.oneColour.leadPlain": "Der Laser schneidet eine Farbe. Alles, was dunkler ist als die eingestellte Linie, wird graviert; alles Hellere bleibt, wie es ist.",
  "editor.oneColour.less": "Weniger graviert",
  "editor.oneColour.line": "Ab wann Hell zu Dunkel wird",
  "editor.oneColour.mayBeFine": "Manche Linien sind vielleicht zu fein",
  "editor.oneColour.more": "Mehr graviert",
  "editor.oneColour.open": "Einfarbig machen",
  "editor.oneColour.set": "Einfarbig zum Gravieren eingestellt.",
  "editor.oneColour.use": "So übernehmen",
  "editor.oneColour.yours": "Ihre Datei",
  "editor.oneColour.yoursAria": "Ihr Logo, wie Sie es hochgeladen haben",
  "editor.preview.noBasket": "Vorschau – nichts landet in einem echten Warenkorb.",
  "editor.preview.noBasketPrint": "Sie sehen eine Vorschau als Kunde – nichts landet in einem Warenkorb.",
  "editor.preview.noSave": "Vorschau – Speichern ist hier ausgeschaltet.",
  "editor.preview.noSavePrint": "Sie sehen eine Vorschau als Kunde – nichts wird gespeichert.",
  "editor.quote.each": "{price} je Stück",
  "editor.quote.more": "Und {n} weitere.",
  "editor.quote.nothingAdded": "Das Gestalten kostet nichts extra.",
  "editor.quote.ready": "Fertig: {date}",
  "editor.quote.show": "Zeigen",
  "editor.quote.title": "Ihr Angebot",
  "editor.redo": "Wiederholen",
  "editor.retry": "Erneut versuchen",
  "editor.save": "Speichern und später weitermachen",
  "editor.save.body": "Wir bewahren das Design auf und mailen Ihnen einen privaten Link dazu. Niemand sonst kann es öffnen.",
  "editor.save.bodyPrint": "Wir speichern das Design und mailen Ihnen einen privaten Link dazu. Nur Sie und {shop} können es öffnen.",
  "editor.save.email": "Ihre E-Mail-Adresse",
  "editor.save.emailBad": "Das sieht nicht nach einer E-Mail-Adresse aus. Zum Beispiel: name@example.com",
  "editor.save.emailNone": "Geben Sie Ihre E-Mail-Adresse ein, damit wir Ihnen den Link schicken können",
  "editor.save.emailPrint": "E-Mail-Adresse",
  "editor.save.submit": "Speichern",
  "editor.save.submitPrint": "Speichern und Link senden",
  "editor.saved.backToShop": "Zurück zum Shop",
  "editor.saved.keepGoing": "Weitermachen",
  "editor.saved.sentTo": "An {email} gesendet. Der Link öffnet Ihre Designs und keine fremden.",
  "editor.saved.title": "Gespeichert. Wir haben Ihnen einen Link gemailt, mit dem Sie zurückkommen können.",
  "editor.side.back": "Rückseite",
  "editor.side.front": "Vorderseite",
  "editor.sides.both": "beidseitig",
  "editor.sides.one": "einseitig",
  "editor.stage.assembled": "Zusammengebaut",
  "editor.stage.bleed": "Beschnitt",
  "editor.stage.close": "Vorschau schließen",
  "editor.stage.full": "Vollbildvorschau",
  "editor.stage.guides": "Hilfslinien",
  "editor.stage.hint": "Ziehen zum Drehen · Scrollen zum Zoomen",
  "editor.stage.hintPhone": "Ziehen zum Drehen · Finger spreizen zum Zoomen",
  "editor.stage.kitModes": "Wie der Bausatz gezeigt wird",
  "editor.stage.label": "{product}, {design}. Flach dargestellt.",
  "editor.stage.label3d": "{product}, {design}. Mit den Pfeiltasten drehen, mit Plus und Minus zoomen, mit 0 zurücksetzen.",
  "editor.stage.locked": "{name} ist vom Shop vorgegeben – das bleibt, wie es ist.",
  "editor.stage.mode": "Wie die Karte gezeigt wird",
  "editor.stage.no3d": "Dieses Gerät kann die 3D-Ansicht nicht zeigen, deshalb sehen Sie jedes Teil flach. Es ist dasselbe Design, das wir schneiden.",
  "editor.stage.pieces": "{n, plural, one {# Teil} other {# Teile}}",
  "editor.stage.pieces3d": "Teile",
  "editor.stage.printed": "Wie gedruckt",
  "editor.stage.reset": "Ansicht zurücksetzen",
  "editor.stage.roledescription": "3D-Vorschau",
  "editor.stage.safe": "Sicherheitsabstand",
  "editor.stage.seeFlat": "Flach ansehen",
  "editor.stage.side": "Seite",
  "editor.stage.trim": "Endformat",
  "editor.stage.turn": "Das Teil drehen",
  "editor.stage.turnDown": "Nach unten drehen",
  "editor.stage.turnLeft": "Nach links drehen",
  "editor.stage.turnRight": "Nach rechts drehen",
  "editor.stage.turnUp": "Nach oben drehen",
  "editor.stage.turned": "Gedreht, um den Bildschirm zu füllen.",
  "editor.stage.withGuides": "Mit Hilfslinien",
  "editor.stage.zoom": "Zoom",
  "editor.stage.zoomIn": "Vergrößern",
  "editor.stage.zoomOut": "Verkleinern",
  "editor.undo": "Rückgängig",
  "editor.upload.big": "Diese Datei ist größer als {size}",
  "editor.upload.cap": "Sie haben heute so viele Dateien gesendet, wie wir an einem Tag annehmen. Versuchen Sie es morgen wieder.",
  "editor.upload.failed": "Diese Datei konnte nicht gesendet werden. Versuchen Sie es noch einmal.",
  "editor.upload.heic": "Dieses Foto ist im HEIC-Format, aus dem wir nicht drucken können. Speichern Sie es als JPEG oder PNG und laden Sie es noch einmal hoch.",
  "editor.upload.kindLogo": "Das ist kein SVG, PDF, PNG oder JPEG",
  "editor.upload.kindOther": "Diese Art Datei kann hier nicht verwendet werden.",
  "editor.upload.kindPhoto": "Das ist kein PNG oder JPEG",
  "editor.upload.off": "Dieser Shop nimmt hier noch keine Dateien an.",
  "editor.upload.quota": "Wir können gerade keine Dateien annehmen. Versuchen Sie es später noch einmal.",
  "editor.upload.sending": "Wird gesendet",
  "editor.upload.sendingLogo": "Ihr Logo wird hochgeladen",
  "editor.upload.sendingPhoto": "Ihr Foto wird hochgeladen",
  "editor.upload.svgCleaned": "Dieses SVG enthält etwas, aus dem wir nicht drucken können. Speichern Sie es als einfaches SVG und laden Sie es noch einmal hoch.",
  "editor.ways.blank": "Mit leerer Seite beginnen",
  "editor.ways.blankBody": "Der vollständige Editor, auf einer Seite im Endformat mit eingezeichnetem Beschnitt und Sicherheitsabstand.",
  "editor.ways.blankMeta": "{w} × {h} mm + {bleed} mm Beschnitt",
  "editor.ways.blankNone": "Die Seite im Endformat, mit eingezeichnetem Beschnitt und Sicherheitsabstand.",
  "editor.ways.chooseBody": "Ein fertiges Design der Druckerei. Texte eintragen, Logo hinzufügen, Farben wählen.",
  "editor.ways.noDesigns": "Für {product} gibt es noch keine fertigen Designs.",
  "editor.ways.own": "Eigene Datei senden",
  "editor.ways.ownBody": "Haben Sie schon druckfertige Daten? Laden Sie sie hoch – ein Mensch prüft sie.",
  "editor.ways.ownMeta": "PDF · TIFF · JPEG · bis 100 MB",
  "editor.ways.ownNone": "Ein PDF, TIFF oder JPEG bis 100 MB.",
  "editor.ways.title": "Wie möchten Sie es gestalten?"
}, sd = {
  "editor.add": "Add to basket",
  "editor.bar.fewer": "One fewer",
  "editor.bar.fix": "Fix {n, plural, one {# thing} other {# things}} in the checks before it can go in the basket.",
  "editor.bar.howMany": "How many",
  "editor.bar.more": "One more",
  "editor.bar.working": "Working out the price…",
  "editor.cancel": "Cancel",
  "editor.check.blurry": "Your logo may print blurry at this size — a bigger file or an SVG will be sharper",
  "editor.check.blurryDetail": "{px} px is {dpi} dpi at {w} × {h} mm — we need {needs}.",
  "editor.check.blurryPhoto": "Your photo may print blurry at this size — a bigger file will be sharper",
  "editor.check.fileKind": "That kind of file can’t be used here.",
  "editor.check.fileKindListed": "{part}: that kind of file can’t be used here",
  "editor.check.fileKindPrinted": "A raised logo has to be a drawing: send it as an SVG. A picture has no edges to raise.",
  "editor.check.fileKindPrintedListed": "{part}: send your logo as an SVG drawing",
  "editor.check.fileMissing": "The file for this part didn’t arrive. Upload it again.",
  "editor.check.fileMissingListed": "{part}: upload the file again",
  "editor.check.fine": "Some lines in your logo are too fine to engrave — they may disappear",
  "editor.check.hard": "Hard to read — the words are too close to the colour behind them.",
  "editor.check.lines": "{n, plural, one {Only # line fits here.} other {Only # lines fit here.}}",
  "editor.check.linesListed": "{part} has too many lines.",
  "editor.check.logoSmall": "Your logo will be {size} across — too small to read",
  "editor.check.needLogo": "Add a logo — this design needs one.",
  "editor.check.needLogoShort": "Add a logo.",
  "editor.check.needPhoto": "Add a photo — this design needs one.",
  "editor.check.needPhotoShort": "Add a photo.",
  "editor.check.needWords": "Add your {part} — this design needs it.",
  "editor.check.needWordsShort": "Add your {part}.",
  "editor.check.needed": "{part} is needed — it can’t be left empty",
  "editor.check.neededField": "Add your words — this part is needed",
  "editor.check.notOffered": "This choice isn’t one the shop offers here. Pick another.",
  "editor.check.over": "{n, plural, one {# character over.} other {# characters over.}} At {size} this part fits {limit}.",
  "editor.check.overGrows": "{n, plural, one {# character over.} other {# characters over.}} At {size} this part fits {limit}. Smaller letters fit more.",
  "editor.check.overListed": "{part}: {n, plural, one {# character too long} other {# characters too long}}",
  "editor.check.overPrint": "{n} over the limit. Shorten it.",
  "editor.check.overPrintListed": "{part} is {n, plural, one {# character} other {# characters}} over the limit.",
  "editor.check.safe": "This runs past the safe line.",
  "editor.check.safeListed": "{part} runs past the safe line.",
  "editor.check.safeShorten": "This runs past the safe line. Shorten it.",
  "editor.check.size": "That size isn’t one this part takes.",
  "editor.check.sizeFloor": "Letters under {size} won’t print cleanly",
  "editor.check.unknown": "This design can’t be made as it is. Start again from the shop’s designs.",
  "editor.checks.clear": "All clear",
  "editor.checks.count": "{n} to look at",
  "editor.checks.go": "Go to it",
  "editor.checks.nothing": "Nothing to fix. Whether it looks right is what the proof is for.",
  "editor.checks.title": "Checks",
  "editor.chip.logo": "Your logo",
  "editor.chip.motif": "Motifs",
  "editor.chip.photo": "Photo",
  "editor.chip.words": "Your words",
  "editor.choose.changeSides": "Change the size or sides",
  "editor.choose.chip": "Make it yours",
  "editor.choose.colourways": "{n, plural, one {# colourway} other {# colourways}}",
  "editor.choose.count": "{n, plural, one {# design} other {# designs}}",
  "editor.choose.layouts": "{n, plural, one {# layout} other {# layouts}}",
  "editor.choose.noMatch": "No designs match that",
  "editor.choose.noMatchQuery": "No designs match “{query}”",
  "editor.choose.none": "No ready-made designs for {product} yet",
  "editor.choose.noneSub": "Start from a blank page at the right size, or send a file you’ve made.",
  "editor.choose.plain": "Start with a plain piece",
  "editor.choose.plainNone": "The piece as it comes, with nothing added.",
  "editor.choose.plainSub": "Your words or logo where the studio allows them.",
  "editor.choose.search": "Search designs",
  "editor.choose.show": "Show designs",
  "editor.choose.showAll": "Show all designs",
  "editor.choose.subMaker": "{n, plural, one {# ready-made design} other {# ready-made designs}} for the {product}. Pick one, then change what it lets you change.",
  "editor.choose.subPrint": "Shown on your {trim} {product}, {sides}. Each one has parts you fill in; the rest stays as the shop made it.",
  "editor.choose.title": "Choose a design",
  "editor.choose.use": "Customise the {name} design. {chips}.",
  "editor.close": "Close",
  "editor.designs.byCode": "Opened after you found your order. Only you can see these.",
  "editor.designs.byLink": "Only you can see these. You opened them with the link we e-mailed to {email}.",
  "editor.designs.changed": "Last changed {when}",
  "editor.designs.deleteAria": "Delete {name}",
  "editor.designs.deleteBody": "It goes for good, along with any logo you uploaded for it. Orders you’ve already placed keep their copy.",
  "editor.designs.deleteBodyPrint": "It goes from your designs and its link stops working. Orders you’ve placed keep their own copy.",
  "editor.designs.deleteFailed": "That couldn’t be deleted. Try again.",
  "editor.designs.deleteGone": "This design is with an order now, so it stays.",
  "editor.designs.deleteTitle": "Delete “{name}”?",
  "editor.designs.deleteYes": "Delete it",
  "editor.designs.deleteYesPrint": "Delete",
  "editor.designs.deleted": "Design deleted.",
  "editor.designs.deletedPrint": "{name} is deleted.",
  "editor.designs.here": "The designs you saved on this device. Only you can see these.",
  "editor.designs.keep": "Keep it",
  "editor.designs.noWords": "No words yet",
  "editor.designs.none": "No saved designs",
  "editor.designs.noneBody": "When you press “Save and come back” while customising, the design waits here.",
  "editor.designs.noneBodyPrint": "When you choose “Save and come back”, the design waits here and we e-mail you the link.",
  "editor.designs.open": "Open",
  "editor.designs.openAria": "Open {name}",
  "editor.designs.order": "Order it",
  "editor.designs.orderAria": "Order {name}",
  "editor.designs.title": "Your designs",
  "editor.drawing.edit": "Edit {name}",
  "editor.drawing.locked": "{name} — the shop’s part. It stays as it is.",
  "editor.drawing.logo": "Your logo",
  "editor.drawing.photo": "Your photo",
  "editor.error.other": "That couldn’t be saved. Try again.",
  "editor.error.rate": "Too many tries. Wait a minute and try again.",
  "editor.error.refused": "The shop couldn’t take this design as it is. Check it and try again.",
  "editor.failed": "The designs couldn’t be loaded.",
  "editor.fields.addLogo": "Add your logo",
  "editor.fields.addWords": "Add words",
  "editor.fields.bigger": "Bigger letters",
  "editor.fields.colour": "Colour",
  "editor.fields.colours": "Colours",
  "editor.fields.coloursSub": "Changes every part that uses them, on both sides.",
  "editor.fields.counter": "{count} / {limit}",
  "editor.fields.counterAria": "{count} of {limit} characters",
  "editor.fields.dropLogo": "Drop your logo here",
  "editor.fields.dropPhoto": "Drop your photo here",
  "editor.fields.either": "Leave it plain, or put your own words or logo here.",
  "editor.fields.finishFor": "Finish for {part}",
  "editor.fields.fitPhotoAria": "How the photo sits in its box",
  "editor.fields.font": "Font",
  "editor.fields.fontFor": "Font for {part}",
  "editor.fields.kept": "Kept with your design",
  "editor.fields.layout": "Layout",
  "editor.fields.leaveEmpty": "Leave it empty",
  "editor.fields.lockedAria": "{part}, set by the studio: {value}",
  "editor.fields.logoKinds": "SVG, PDF, PNG or JPEG, up to {size}",
  "editor.fields.needed": "Needed",
  "editor.fields.neededLower": "needed",
  "editor.fields.nothing": "Nothing on this design is yours to change.",
  "editor.fields.optional": "Optional",
  "editor.fields.person": "A person checks every design before we send your proof.",
  "editor.fields.photoKinds": "PNG or JPEG, up to {size}",
  "editor.fields.privateLogo": "Only you and {shop} can see your logo.",
  "editor.fields.privateMaker": "Your logo is private. Only you and the studio can see it.",
  "editor.fields.privateMakerPhoto": "Your photo is private. Only you and the studio can see it.",
  "editor.fields.privatePhoto": "Only you and {shop} can see your photo.",
  "editor.fields.removeLogo": "Remove your logo",
  "editor.fields.removeLogoPrint": "Remove the logo",
  "editor.fields.removePhoto": "Remove your photo",
  "editor.fields.removePhotoPrint": "Remove the photo",
  "editor.fields.replace": "Replace",
  "editor.fields.setByStudio": "Set by the studio",
  "editor.fields.size": "Size",
  "editor.fields.sizeFor": "Letter size for {part}",
  "editor.fields.smaller": "Smaller letters",
  "editor.fields.uploadLogo": "Upload your logo",
  "editor.fields.uploadPhoto": "Upload your photo",
  "editor.fields.yourLogo": "{part} — your logo",
  "editor.fields.yourWords": "{part} — your words",
  "editor.fill.allDesigns": "All designs",
  "editor.fill.change": "Change the design",
  "editor.fill.design": "Design: {name}",
  "editor.fill.fullEditor": "Switch to the full editor",
  "editor.fill.makeItYours": "Make it yours",
  "editor.fill.noneBody": "You’re starting with the plain piece. Add your words where the studio allows them.",
  "editor.fill.noneTitle": "No ready-made designs for this one",
  "editor.fill.ordered": "This design is with an order already, so it stays as it was. What you change here is saved as a new design.",
  "editor.fill.plain": "Plain piece",
  "editor.fill.proof": "We’ll send you a proof before we cut anything.",
  "editor.fill.toChange": "{n} TO CHANGE",
  "editor.fill.yourDesign": "Your design",
  "editor.filter.all": "All",
  "editor.filter.bold": "Bold",
  "editor.filter.logo": "With a logo",
  "editor.filter.motif": "Motifs",
  "editor.filter.one": "One colour",
  "editor.filter.photo": "With a photo",
  "editor.filter.simple": "Simple",
  "editor.filter.words": "Words only",
  "editor.fix.shorten": "Shorten it",
  "editor.fix.smaller": "Make it smaller",
  "editor.fix.use": "Use {colour}",
  "editor.full.accent": "Accent",
  "editor.full.across": "Across in millimetres",
  "editor.full.addImage": "Add an image",
  "editor.full.addWords": "Add words",
  "editor.full.alignBottom": "Align to the bottom",
  "editor.full.alignCentre": "Centre across",
  "editor.full.alignLeft": "Align to the left edge",
  "editor.full.alignMiddle": "Centre down",
  "editor.full.alignPage": "Align to the page",
  "editor.full.alignRight": "Align to the right edge",
  "editor.full.alignTop": "Align to the top",
  "editor.full.alignment": "Alignment",
  "editor.full.back": "Back",
  "editor.full.backToForm": "Back to the form",
  "editor.full.backward": "Send {name} back",
  "editor.full.banner": "You can move anything now; your words stay.",
  "editor.full.blank": "Start from blank",
  "editor.full.blurry": "This picture may print blurry at this size — {dpi} dpi, we need {needs}. A bigger file will be sharper.",
  "editor.full.bold": "Bold",
  "editor.full.card": "Your design, {side}",
  "editor.full.centre": "Centre",
  "editor.full.delete": "Delete",
  "editor.full.down": "Down in millimetres",
  "editor.full.ellipse": "Ellipse",
  "editor.full.empty": "Add something to the card first.",
  "editor.full.end": "End",
  "editor.full.extrabold": "Extrabold",
  "editor.full.fill": "Fill",
  "editor.full.fitAria": "How it sits in its box",
  "editor.full.forward": "Bring {name} forward",
  "editor.full.height": "Height in millimetres",
  "editor.full.hideNote": "Hide this note",
  "editor.full.image": "Image",
  "editor.full.inFull": "This design is in the full editor",
  "editor.full.inFullBody": "You’ve moved things around, so the form no longer fits it. Carry on in the editor, or go back to the form and lose the moves. Your words stay either way.",
  "editor.full.ink": "Ink",
  "editor.full.layers": "Layers",
  "editor.full.line": "Line",
  "editor.full.madeYours": "{design}, made your own",
  "editor.full.medium": "Medium",
  "editor.full.noLayers": "Nothing on this side yet.",
  "editor.full.note": "Drag to move, or use the arrow keys. Anything outside the safe line may be trimmed off.",
  "editor.full.nothing": "Nothing selected. Tap something on the card, or add words, an image or a shape from the tools.",
  "editor.full.open": "Open the full editor",
  "editor.full.paper": "Paper",
  "editor.full.partText": "Text",
  "editor.full.position": "Position and size",
  "editor.full.properties": "Properties",
  "editor.full.rect": "Rectangle",
  "editor.full.regular": "Regular",
  "editor.full.replaceImage": "Replace the image",
  "editor.full.safe": "This runs past the safe line. Make it smaller or move it in.",
  "editor.full.sample": "Your words here",
  "editor.full.select": "Select {name}",
  "editor.full.semibold": "Semibold",
  "editor.full.sending": "Uploading your image",
  "editor.full.size": "{w} × {h} mm · bleed {bleed} mm · safe line {safe} mm",
  "editor.full.sizeNoSafe": "{w} × {h} mm · bleed {bleed} mm",
  "editor.full.sizePt": "Size in points",
  "editor.full.start": "Start",
  "editor.full.toForm": "Go back to the form",
  "editor.full.tools": "Tools",
  "editor.full.twoPictures": "A design takes two pictures at most: replace one, or remove it first.",
  "editor.full.uploadImage": "Upload an image",
  "editor.full.use": "Use this design",
  "editor.full.weight": "Weight",
  "editor.full.width": "Width in millimetres",
  "editor.full.words": "Words",
  "editor.full.zoom": "Zoom",
  "editor.full.zoomIn": "Zoom in",
  "editor.full.zoomOut": "Zoom out",
  "editor.loading": "Loading the designs",
  "editor.logo.across": "{size} across",
  "editor.logo.centre": "Centre it",
  "editor.logo.down": "Nudge down",
  "editor.logo.fill": "Fill",
  "editor.logo.fitAria": "How the logo sits in its box",
  "editor.logo.fitInside": "Fit inside",
  "editor.logo.inBox": "In its box",
  "editor.logo.left": "Nudge left",
  "editor.logo.nudge": "Nudge",
  "editor.logo.nudgeAria": "Nudge the logo",
  "editor.logo.right": "Nudge right",
  "editor.logo.size": "Size in its box",
  "editor.logo.up": "Nudge up",
  "editor.missing": "This product can’t be customised just now.",
  "editor.oneColour.fine": "Some lines are too fine to engrave — they may disappear",
  "editor.oneColour.fineHow": "Move the slider towards “Less engraved” to drop the fine shading, or upload a bolder version of your logo.",
  "editor.oneColour.in": "Your logo is in. Check how it engraves.",
  "editor.oneColour.laser": "As the laser will cut it",
  "editor.oneColour.laserAria": "Your logo engraved in {material}",
  "editor.oneColour.laserAriaPlain": "Your logo as the laser engraves it",
  "editor.oneColour.later": "We check fine detail again when we make your proof.",
  "editor.oneColour.lead": "The laser cuts one colour. Everything darker than the line you set is engraved; everything lighter is left as {material}.",
  "editor.oneColour.leadPlain": "The laser cuts one colour. Everything darker than the line you set is engraved; everything lighter is left as it is.",
  "editor.oneColour.less": "Less engraved",
  "editor.oneColour.line": "Where light becomes dark",
  "editor.oneColour.mayBeFine": "Some lines may be too fine",
  "editor.oneColour.more": "More engraved",
  "editor.oneColour.open": "Make it one colour",
  "editor.oneColour.set": "Set to engrave in one colour.",
  "editor.oneColour.use": "Use this",
  "editor.oneColour.yours": "Your file",
  "editor.oneColour.yoursAria": "Your logo as uploaded",
  "editor.preview.noBasket": "Previewing — nothing goes in a real basket.",
  "editor.preview.noBasketPrint": "You’re previewing as a customer — nothing goes in a basket.",
  "editor.preview.noSave": "Previewing — saving is switched off here.",
  "editor.preview.noSavePrint": "You’re previewing as a customer — nothing is saved.",
  "editor.quote.each": "{price} each",
  "editor.quote.more": "And {n} more.",
  "editor.quote.nothingAdded": "Customising adds nothing to the price.",
  "editor.quote.ready": "Ready {date}",
  "editor.quote.show": "Show me",
  "editor.quote.title": "Your quote",
  "editor.redo": "Redo",
  "editor.retry": "Try again",
  "editor.save": "Save and come back",
  "editor.save.body": "We’ll keep the design and e-mail you a private link to it. Nobody else can open it.",
  "editor.save.bodyPrint": "We save the design and e-mail you a private link to it. Only you and {shop} can open it.",
  "editor.save.email": "Your e-mail",
  "editor.save.emailBad": "That doesn’t look like an e-mail address. Try name@example.com",
  "editor.save.emailNone": "Enter your e-mail so we can send you the link",
  "editor.save.emailPrint": "E-mail",
  "editor.save.submit": "Save it",
  "editor.save.submitPrint": "Save and send the link",
  "editor.saved.backToShop": "Back to the shop",
  "editor.saved.keepGoing": "Keep going",
  "editor.saved.sentTo": "Sent to {email}. The link opens your designs and nobody else’s.",
  "editor.saved.title": "Saved. We’ve e-mailed you a link to come back to it.",
  "editor.side.back": "Back",
  "editor.side.front": "Front",
  "editor.sides.both": "both sides",
  "editor.sides.one": "one side",
  "editor.stage.assembled": "Assembled",
  "editor.stage.bleed": "Bleed",
  "editor.stage.close": "Close the preview",
  "editor.stage.full": "Full-screen preview",
  "editor.stage.guides": "Guides",
  "editor.stage.hint": "Drag to turn · scroll to zoom",
  "editor.stage.hintPhone": "Drag to turn · pinch to zoom",
  "editor.stage.kitModes": "How to show the kit",
  "editor.stage.label": "{product}, {design}. Shown flat.",
  "editor.stage.label3d": "{product}, {design}. Use the arrow keys to turn it, plus and minus to zoom, 0 to reset.",
  "editor.stage.locked": "{name} is the shop’s part — it stays as it is.",
  "editor.stage.mode": "How the card is shown",
  "editor.stage.no3d": "This device can’t show the 3D view, so you’re seeing each piece flat. It’s the same design we’ll cut.",
  "editor.stage.pieces": "{n, plural, one {# piece} other {# pieces}}",
  "editor.stage.pieces3d": "Pieces",
  "editor.stage.printed": "As printed",
  "editor.stage.reset": "Reset the view",
  "editor.stage.roledescription": "3D preview",
  "editor.stage.safe": "Safe line",
  "editor.stage.seeFlat": "See it flat",
  "editor.stage.side": "Side",
  "editor.stage.trim": "Trim",
  "editor.stage.turn": "Turn the piece",
  "editor.stage.turnDown": "Turn down",
  "editor.stage.turnLeft": "Turn left",
  "editor.stage.turnRight": "Turn right",
  "editor.stage.turnUp": "Turn up",
  "editor.stage.turned": "Turned to fill the screen.",
  "editor.stage.withGuides": "With guides",
  "editor.stage.zoom": "Zoom",
  "editor.stage.zoomIn": "Zoom in",
  "editor.stage.zoomOut": "Zoom out",
  "editor.undo": "Undo",
  "editor.upload.big": "That file is over {size}",
  "editor.upload.cap": "You’ve sent as many files as we take in a day. Try again tomorrow.",
  "editor.upload.failed": "That file couldn’t be sent. Try again.",
  "editor.upload.heic": "That photo is in HEIC, which we can’t print from. Save it as JPEG or PNG and upload it again.",
  "editor.upload.kindLogo": "That isn’t an SVG, PDF, PNG or JPEG",
  "editor.upload.kindOther": "That kind of file can’t be used here.",
  "editor.upload.kindPhoto": "That isn’t a PNG or JPEG",
  "editor.upload.off": "This shop doesn’t take files here yet.",
  "editor.upload.quota": "We can’t take files just now. Try again later.",
  "editor.upload.sending": "Sending",
  "editor.upload.sendingLogo": "Uploading your logo",
  "editor.upload.sendingPhoto": "Uploading your photo",
  "editor.upload.svgCleaned": "This SVG holds something we can’t print from. Save it as a plain SVG and upload it again.",
  "editor.ways.blank": "Start from blank",
  "editor.ways.blankBody": "The full editor, on a page at the finished size with the bleed and safe line drawn.",
  "editor.ways.blankMeta": "{w} × {h} mm + {bleed} mm bleed",
  "editor.ways.blankNone": "The page at its finished size, with the bleed and safe line drawn.",
  "editor.ways.chooseBody": "A ready-made design by the shop. Fill in your words, add your logo, pick the colours.",
  "editor.ways.noDesigns": "There are no ready-made designs for {product} yet.",
  "editor.ways.own": "Send your own file",
  "editor.ways.ownBody": "Already have print-ready artwork? Upload it and a person checks it.",
  "editor.ways.ownMeta": "PDF · TIFF · JPEG · up to 100 MB",
  "editor.ways.ownNone": "A PDF, TIFF or JPEG up to 100 MB.",
  "editor.ways.title": "How would you like to make it?"
}, ad = {
  "editor.add": "Ajouter au panier",
  "editor.bar.fewer": "Un de moins",
  "editor.bar.fix": "Corrigez {n, plural, one {# point} other {# points}} dans les vérifications avant de l’ajouter au panier.",
  "editor.bar.howMany": "Quantité",
  "editor.bar.more": "Un de plus",
  "editor.bar.working": "Calcul du prix…",
  "editor.cancel": "Annuler",
  "editor.check.blurry": "Votre logo risque d’être flou à cette taille — un fichier plus grand ou un SVG sera plus net",
  "editor.check.blurryDetail": "{px} px, c’est {dpi} dpi à {w} × {h} mm — il nous faut {needs}.",
  "editor.check.blurryPhoto": "Votre photo risque d’être floue à cette taille — un fichier plus grand sera plus net",
  "editor.check.fileKind": "Ce type de fichier ne peut pas être utilisé ici.",
  "editor.check.fileKindListed": "{part} : ce type de fichier ne peut pas être utilisé ici",
  "editor.check.fileKindPrinted": "Un logo en relief doit être un dessin : envoyez-le en SVG. Une image n’a pas de contours à mettre en relief.",
  "editor.check.fileKindPrintedListed": "{part} : envoyez votre logo sous forme de dessin SVG",
  "editor.check.fileMissing": "Le fichier de cette partie n’est pas arrivé. Envoyez-le à nouveau.",
  "editor.check.fileMissingListed": "{part} : envoyez à nouveau le fichier",
  "editor.check.fine": "Certains traits de votre logo sont trop fins pour être gravés — ils risquent de disparaître",
  "editor.check.hard": "Difficile à lire — le texte est trop proche de la couleur du fond.",
  "editor.check.lines": "{n, plural, one {Seule # ligne tient ici.} other {Seules # lignes tiennent ici.}}",
  "editor.check.linesListed": "{part} : trop de lignes.",
  "editor.check.logoSmall": "Votre logo fera {size} de large — trop petit pour être lisible",
  "editor.check.needLogo": "Ajoutez un logo — ce modèle en a besoin.",
  "editor.check.needLogoShort": "Ajoutez un logo.",
  "editor.check.needPhoto": "Ajoutez une photo — ce modèle en a besoin.",
  "editor.check.needPhotoShort": "Ajoutez une photo.",
  "editor.check.needWords": "Remplissez « {part} » — ce modèle en a besoin.",
  "editor.check.needWordsShort": "Remplissez « {part} ».",
  "editor.check.needed": "{part} : obligatoire — ne peut pas rester vide",
  "editor.check.neededField": "Ajoutez votre texte — cette partie est obligatoire",
  "editor.check.notOffered": "La boutique ne propose pas ce choix ici. Choisissez-en un autre.",
  "editor.check.over": "{n, plural, one {# caractère de trop.} other {# caractères de trop.}} En {size}, cette partie accepte {limit} caractères.",
  "editor.check.overGrows": "{n, plural, one {# caractère de trop.} other {# caractères de trop.}} En {size}, cette partie accepte {limit} caractères. Avec des lettres plus petites, il en tient davantage.",
  "editor.check.overListed": "{part} : {n, plural, one {# caractère de trop} other {# caractères de trop}}",
  "editor.check.overPrint": "{n} au-delà de la limite. Raccourcissez le texte.",
  "editor.check.overPrintListed": "{part} dépasse la limite de {n, plural, one {# caractère} other {# caractères}}.",
  "editor.check.safe": "Cela dépasse la marge de sécurité.",
  "editor.check.safeListed": "{part} dépasse la marge de sécurité.",
  "editor.check.safeShorten": "Cela dépasse la marge de sécurité. Raccourcissez le texte.",
  "editor.check.size": "Cette partie n’accepte pas cette taille.",
  "editor.check.sizeFloor": "Les lettres de moins de {size} ne sortiront pas nettes",
  "editor.check.unknown": "Ce modèle ne peut pas être réalisé tel quel. Recommencez à partir des modèles de la boutique.",
  "editor.checks.clear": "Tout est bon",
  "editor.checks.count": "{n} à vérifier",
  "editor.checks.go": "Y aller",
  "editor.checks.nothing": "Rien à corriger. Pour juger du rendu, il y a l’épreuve.",
  "editor.checks.title": "Vérifications",
  "editor.chip.logo": "Votre logo",
  "editor.chip.motif": "Motifs",
  "editor.chip.photo": "Photo",
  "editor.chip.words": "Vos textes",
  "editor.choose.changeSides": "Changer le format ou les faces",
  "editor.choose.chip": "Personnalisable",
  "editor.choose.colourways": "{n, plural, one {# coloris} other {# coloris}}",
  "editor.choose.count": "{n, plural, one {# modèle} other {# modèles}}",
  "editor.choose.layouts": "{n, plural, one {# mise en page} other {# mises en page}}",
  "editor.choose.noMatch": "Aucun modèle ne correspond",
  "editor.choose.noMatchQuery": "Aucun modèle ne correspond à « {query} »",
  "editor.choose.none": "Pas encore de modèle prêt à l’emploi pour {product}",
  "editor.choose.noneSub": "Partez d’une page vierge au bon format, ou envoyez un fichier que vous avez créé.",
  "editor.choose.plain": "Commencer avec la pièce nue",
  "editor.choose.plainNone": "La pièce telle quelle, sans rien d’ajouté.",
  "editor.choose.plainSub": "Vos textes ou votre logo, là où l’atelier le permet.",
  "editor.choose.search": "Chercher un modèle",
  "editor.choose.show": "Voir les modèles",
  "editor.choose.showAll": "Voir tous les modèles",
  "editor.choose.subMaker": "{n, plural, one {# modèle prêt à l’emploi} other {# modèles prêts à l’emploi}} pour {product}. Choisissez-en un, puis modifiez ce qu’il vous permet de modifier.",
  "editor.choose.subPrint": "Présentés sur {product} au format {trim}, {sides}. Chacun a des parties à remplir ; tout le reste est conservé tel que la boutique l’a conçu.",
  "editor.choose.title": "Choisir un modèle",
  "editor.choose.use": "Personnaliser le modèle {name}. {chips}.",
  "editor.close": "Fermer",
  "editor.designs.byCode": "Ouverts après avoir retrouvé votre commande. Ils ne sont visibles que par vous.",
  "editor.designs.byLink": "Ils ne sont visibles que par vous. Vous les avez ouverts avec le lien envoyé par e-mail à {email}.",
  "editor.designs.changed": "Dernière modification : {when}",
  "editor.designs.deleteAria": "Supprimer {name}",
  "editor.designs.deleteBody": "Elle disparaît définitivement, avec le logo que vous avez envoyé pour elle. Les commandes déjà passées gardent leur copie.",
  "editor.designs.deleteBodyPrint": "Elle disparaît de vos créations et son lien ne fonctionne plus. Les commandes passées gardent leur propre copie.",
  "editor.designs.deleteFailed": "La suppression n’a pas abouti. Réessayez.",
  "editor.designs.deleteGone": "Cette création fait maintenant partie d’une commande, elle est donc conservée.",
  "editor.designs.deleteTitle": "Supprimer « {name} » ?",
  "editor.designs.deleteYes": "Le supprimer",
  "editor.designs.deleteYesPrint": "Supprimer",
  "editor.designs.deleted": "Création supprimée.",
  "editor.designs.deletedPrint": "{name} est supprimée.",
  "editor.designs.here": "Les modèles enregistrés sur cet appareil. Ils ne sont visibles que par vous.",
  "editor.designs.keep": "Le garder",
  "editor.designs.noWords": "Pas encore de texte",
  "editor.designs.none": "Aucun modèle enregistré",
  "editor.designs.noneBody": "Quand vous appuyez sur « Enregistrer et revenir plus tard » pendant la personnalisation, le modèle vous attend ici.",
  "editor.designs.noneBodyPrint": "Quand vous choisissez « Enregistrer et revenir plus tard », le modèle vous attend ici et nous vous envoyons le lien par e-mail.",
  "editor.designs.open": "Ouvrir",
  "editor.designs.openAria": "Ouvrir {name}",
  "editor.designs.order": "Commander",
  "editor.designs.orderAria": "Commander {name}",
  "editor.designs.title": "Vos modèles",
  "editor.drawing.edit": "Modifier {name}",
  "editor.drawing.locked": "{name} — partie fixée par la boutique. Elle reste telle quelle.",
  "editor.drawing.logo": "Votre logo",
  "editor.drawing.photo": "Votre photo",
  "editor.error.other": "L’enregistrement a échoué. Réessayez.",
  "editor.error.rate": "Trop de tentatives. Patientez une minute, puis réessayez.",
  "editor.error.refused": "La boutique ne peut pas accepter ce modèle tel quel. Vérifiez-le et réessayez.",
  "editor.failed": "Les modèles n’ont pas pu être chargés.",
  "editor.fields.addLogo": "Ajouter votre logo",
  "editor.fields.addWords": "Ajouter du texte",
  "editor.fields.bigger": "Lettres plus grandes",
  "editor.fields.colour": "Couleur",
  "editor.fields.colours": "Couleurs",
  "editor.fields.coloursSub": "Change chaque partie qui les utilise, sur les deux faces.",
  "editor.fields.counter": "{count} / {limit}",
  "editor.fields.counterAria": "{count} caractères sur {limit}",
  "editor.fields.dropLogo": "Déposez votre logo ici",
  "editor.fields.dropPhoto": "Déposez votre photo ici",
  "editor.fields.either": "Laissez cette partie nue, ou ajoutez-y vos propres mots ou votre logo.",
  "editor.fields.finishFor": "Finition pour {part}",
  "editor.fields.fitPhotoAria": "Comment la photo tient dans son cadre",
  "editor.fields.font": "Police",
  "editor.fields.fontFor": "Police pour {part}",
  "editor.fields.kept": "Conservé avec votre modèle",
  "editor.fields.layout": "Mise en page",
  "editor.fields.leaveEmpty": "Laisser vide",
  "editor.fields.lockedAria": "{part}, fixé par l’atelier : {value}",
  "editor.fields.logoKinds": "SVG, PDF, PNG ou JPEG, jusqu’à {size}",
  "editor.fields.needed": "Obligatoire",
  "editor.fields.neededLower": "obligatoire",
  "editor.fields.nothing": "Ce modèle ne comporte rien que vous puissiez modifier.",
  "editor.fields.optional": "Facultatif",
  "editor.fields.person": "Une personne vérifie chaque modèle avant de vous envoyer l’épreuve.",
  "editor.fields.photoKinds": "PNG ou JPEG, jusqu’à {size}",
  "editor.fields.privateLogo": "Seuls vous et {shop} pouvez voir votre logo.",
  "editor.fields.privateMaker": "Votre logo est privé. Seuls vous et l’atelier pouvez le voir.",
  "editor.fields.privateMakerPhoto": "Votre photo est privée. Seuls vous et l’atelier pouvez la voir.",
  "editor.fields.privatePhoto": "Seuls vous et {shop} pouvez voir votre photo.",
  "editor.fields.removeLogo": "Retirer votre logo",
  "editor.fields.removeLogoPrint": "Retirer le logo",
  "editor.fields.removePhoto": "Retirer votre photo",
  "editor.fields.removePhotoPrint": "Retirer la photo",
  "editor.fields.replace": "Remplacer",
  "editor.fields.setByStudio": "Fixé par l’atelier",
  "editor.fields.size": "Taille",
  "editor.fields.sizeFor": "Taille des lettres pour {part}",
  "editor.fields.smaller": "Lettres plus petites",
  "editor.fields.uploadLogo": "Envoyer votre logo",
  "editor.fields.uploadPhoto": "Envoyer votre photo",
  "editor.fields.yourLogo": "{part} — votre logo",
  "editor.fields.yourWords": "{part} — vos textes",
  "editor.fill.allDesigns": "Tous les modèles",
  "editor.fill.change": "Changer de modèle",
  "editor.fill.design": "Modèle : {name}",
  "editor.fill.fullEditor": "Passer à l’éditeur complet",
  "editor.fill.makeItYours": "Personnalisez-le",
  "editor.fill.noneBody": "Vous partez de la pièce nue. Ajoutez vos textes là où l’atelier le permet.",
  "editor.fill.noneTitle": "Aucun modèle prêt à l’emploi pour ce produit",
  "editor.fill.ordered": "Ce modèle fait déjà partie d’une commande, il reste donc tel quel. Vos modifications ici sont enregistrées comme un nouveau modèle.",
  "editor.fill.plain": "Pièce nue",
  "editor.fill.proof": "Nous vous enverrons une épreuve avant toute découpe.",
  "editor.fill.toChange": "{n} À MODIFIER",
  "editor.fill.yourDesign": "Votre modèle",
  "editor.filter.all": "Tous",
  "editor.filter.bold": "Affirmé",
  "editor.filter.logo": "Avec logo",
  "editor.filter.motif": "Motifs",
  "editor.filter.one": "Une couleur",
  "editor.filter.photo": "Avec photo",
  "editor.filter.simple": "Sobre",
  "editor.filter.words": "Texte seul",
  "editor.fix.shorten": "Raccourcir",
  "editor.fix.smaller": "Le réduire",
  "editor.fix.use": "Utiliser {colour}",
  "editor.full.accent": "Accent",
  "editor.full.across": "Horizontal en millimètres",
  "editor.full.addImage": "Ajouter une image",
  "editor.full.addWords": "Ajouter du texte",
  "editor.full.alignBottom": "Aligner en bas",
  "editor.full.alignCentre": "Centrer horizontalement",
  "editor.full.alignLeft": "Aligner sur le bord gauche",
  "editor.full.alignMiddle": "Centrer verticalement",
  "editor.full.alignPage": "Aligner sur la page",
  "editor.full.alignRight": "Aligner sur le bord droit",
  "editor.full.alignTop": "Aligner en haut",
  "editor.full.alignment": "Alignement",
  "editor.full.back": "Retour",
  "editor.full.backToForm": "Retour au formulaire",
  "editor.full.backward": "Envoyer {name} vers l’arrière",
  "editor.full.banner": "Vous pouvez tout déplacer maintenant ; vos textes restent.",
  "editor.full.blank": "Partir d’une page vierge",
  "editor.full.blurry": "Cette image risque d’être floue à cette taille — {dpi} dpi, il nous en faut {needs}. Un fichier plus grand sera plus net.",
  "editor.full.bold": "Gras",
  "editor.full.card": "Votre création, {side}",
  "editor.full.centre": "Centré",
  "editor.full.delete": "Supprimer",
  "editor.full.down": "Vertical en millimètres",
  "editor.full.ellipse": "Ellipse",
  "editor.full.empty": "Ajoutez d’abord quelque chose sur la carte.",
  "editor.full.end": "Fin",
  "editor.full.extrabold": "Extra-gras",
  "editor.full.fill": "Remplissage",
  "editor.full.fitAria": "Comment elle tient dans son cadre",
  "editor.full.forward": "Amener {name} vers l’avant",
  "editor.full.height": "Hauteur en millimètres",
  "editor.full.hideNote": "Masquer cette note",
  "editor.full.image": "Image",
  "editor.full.inFull": "Cette création est dans l’éditeur complet",
  "editor.full.inFullBody": "Vous avez déplacé des éléments, le formulaire ne correspond donc plus. Continuez dans l’éditeur, ou revenez au formulaire en perdant les déplacements. Vos textes restent dans les deux cas.",
  "editor.full.ink": "Encre",
  "editor.full.layers": "Calques",
  "editor.full.line": "Ligne",
  "editor.full.madeYours": "{design}, à votre façon",
  "editor.full.medium": "Moyen",
  "editor.full.noLayers": "Rien sur cette face pour l’instant.",
  "editor.full.note": "Faites glisser pour déplacer, ou utilisez les flèches. Tout ce qui dépasse la marge de sécurité risque d’être coupé.",
  "editor.full.nothing": "Rien de sélectionné. Touchez un élément de la carte, ou ajoutez du texte, une image ou une forme avec les outils.",
  "editor.full.open": "Ouvrir l’éditeur complet",
  "editor.full.paper": "Papier",
  "editor.full.partText": "Texte",
  "editor.full.position": "Position et taille",
  "editor.full.properties": "Propriétés",
  "editor.full.rect": "Un rectangle",
  "editor.full.regular": "Normal",
  "editor.full.replaceImage": "Remplacer l’image",
  "editor.full.safe": "Cela dépasse la marge de sécurité. Réduisez-le ou rentrez-le.",
  "editor.full.sample": "Votre texte ici",
  "editor.full.select": "Sélectionner {name}",
  "editor.full.semibold": "Demi-gras",
  "editor.full.sending": "Envoi de votre image",
  "editor.full.size": "{w} × {h} mm · fond perdu {bleed} mm · marge de sécurité {safe} mm",
  "editor.full.sizeNoSafe": "{w} × {h} mm · fond perdu {bleed} mm",
  "editor.full.sizePt": "Taille en points",
  "editor.full.start": "Début",
  "editor.full.toForm": "Revenir au formulaire",
  "editor.full.tools": "Outils",
  "editor.full.twoPictures": "Une création prend deux images au plus : remplacez-en une, ou retirez-la d’abord.",
  "editor.full.uploadImage": "Envoyer une image",
  "editor.full.use": "Utiliser cette création",
  "editor.full.weight": "Graisse",
  "editor.full.width": "Largeur en millimètres",
  "editor.full.words": "Texte",
  "editor.full.zoom": "Zoom",
  "editor.full.zoomIn": "Zoom avant",
  "editor.full.zoomOut": "Zoom arrière",
  "editor.loading": "Chargement des modèles",
  "editor.logo.across": "{size} de large",
  "editor.logo.centre": "Centrer",
  "editor.logo.down": "Décaler vers le bas",
  "editor.logo.fill": "Remplir",
  "editor.logo.fitAria": "Comment le logo tient dans son cadre",
  "editor.logo.fitInside": "Ajuster dedans",
  "editor.logo.inBox": "Dans son cadre",
  "editor.logo.left": "Décaler vers la gauche",
  "editor.logo.nudge": "Décaler",
  "editor.logo.nudgeAria": "Décaler le logo",
  "editor.logo.right": "Décaler vers la droite",
  "editor.logo.size": "Taille dans son cadre",
  "editor.logo.up": "Décaler vers le haut",
  "editor.missing": "Ce produit ne peut pas être personnalisé pour le moment.",
  "editor.oneColour.fine": "Certains traits sont trop fins pour être gravés — ils risquent de disparaître",
  "editor.oneColour.fineHow": "Déplacez le curseur vers « Moins gravé » pour retirer les ombrages fins, ou envoyez une version plus épaisse de votre logo.",
  "editor.oneColour.in": "Votre logo est arrivé. Vérifiez comment il se grave.",
  "editor.oneColour.laser": "Tel que le laser le découpera",
  "editor.oneColour.laserAria": "Votre logo gravé dans {material}",
  "editor.oneColour.laserAriaPlain": "Votre logo tel que le laser le grave",
  "editor.oneColour.later": "Nous vérifions encore les détails fins en préparant votre épreuve.",
  "editor.oneColour.lead": "Le laser grave une seule couleur. Tout ce qui est plus foncé que la limite choisie est gravé ; tout ce qui est plus clair reste {material}.",
  "editor.oneColour.leadPlain": "Le laser grave une seule couleur. Tout ce qui est plus foncé que la limite choisie est gravé ; tout ce qui est plus clair reste tel quel.",
  "editor.oneColour.less": "Moins gravé",
  "editor.oneColour.line": "Seuil entre clair et foncé",
  "editor.oneColour.mayBeFine": "Certains traits sont peut-être trop fins",
  "editor.oneColour.more": "Plus gravé",
  "editor.oneColour.open": "Passer en une couleur",
  "editor.oneColour.set": "Réglé pour une gravure en une couleur.",
  "editor.oneColour.use": "Utiliser ceci",
  "editor.oneColour.yours": "Votre fichier",
  "editor.oneColour.yoursAria": "Votre logo tel qu’envoyé",
  "editor.preview.noBasket": "Aperçu — rien ne va dans un vrai panier.",
  "editor.preview.noBasketPrint": "Vous êtes en aperçu client — rien ne va dans un panier.",
  "editor.preview.noSave": "Aperçu — l’enregistrement est désactivé ici.",
  "editor.preview.noSavePrint": "Vous êtes en aperçu client — rien n’est enregistré.",
  "editor.quote.each": "{price} l’unité",
  "editor.quote.more": "Et {n} de plus.",
  "editor.quote.nothingAdded": "La personnalisation n’ajoute rien au prix.",
  "editor.quote.ready": "Prêt le {date}",
  "editor.quote.show": "Me montrer",
  "editor.quote.title": "Votre devis",
  "editor.redo": "Rétablir",
  "editor.retry": "Réessayer",
  "editor.save": "Enregistrer et revenir plus tard",
  "editor.save.body": "Nous conservons le modèle et vous envoyons par e-mail un lien privé pour y accéder. Personne d’autre ne peut l’ouvrir.",
  "editor.save.bodyPrint": "Nous enregistrons le modèle et vous envoyons par e-mail un lien privé pour y accéder. Seuls vous et {shop} pouvez l’ouvrir.",
  "editor.save.email": "Votre adresse e-mail",
  "editor.save.emailBad": "Cela ne ressemble pas à une adresse e-mail. Essayez nom@example.com",
  "editor.save.emailNone": "Saisissez votre adresse e-mail pour que nous puissions vous envoyer le lien",
  "editor.save.emailPrint": "Adresse e-mail",
  "editor.save.submit": "Enregistrer",
  "editor.save.submitPrint": "Enregistrer et envoyer le lien",
  "editor.saved.backToShop": "Retour à la boutique",
  "editor.saved.keepGoing": "Continuer",
  "editor.saved.sentTo": "Envoyé à {email}. Le lien ouvre vos modèles, et seulement les vôtres.",
  "editor.saved.title": "Enregistré. Nous vous avons envoyé par e-mail un lien pour y revenir.",
  "editor.side.back": "Verso",
  "editor.side.front": "Recto",
  "editor.sides.both": "recto verso",
  "editor.sides.one": "recto seul",
  "editor.stage.assembled": "Assemblé",
  "editor.stage.bleed": "Fond perdu",
  "editor.stage.close": "Fermer l’aperçu",
  "editor.stage.full": "Aperçu plein écran",
  "editor.stage.guides": "Repères",
  "editor.stage.hint": "Faites glisser pour tourner · faites défiler pour zoomer",
  "editor.stage.hintPhone": "Faites glisser pour tourner · pincez pour zoomer",
  "editor.stage.kitModes": "Comment montrer le kit",
  "editor.stage.label": "{product}, {design}. Vue à plat.",
  "editor.stage.label3d": "{product}, {design}. Utilisez les flèches pour le tourner, plus et moins pour zoomer, 0 pour revenir.",
  "editor.stage.locked": "{name} est une partie fixée par la boutique — elle reste telle quelle.",
  "editor.stage.mode": "Affichage de la carte",
  "editor.stage.no3d": "Cet appareil ne peut pas afficher la vue 3D : vous voyez donc chaque pièce à plat. C’est le même motif que nous découperons.",
  "editor.stage.pieces": "{n, plural, one {# pièce} other {# pièces}}",
  "editor.stage.pieces3d": "Pièces",
  "editor.stage.printed": "Tel qu’imprimé",
  "editor.stage.reset": "Réinitialiser la vue",
  "editor.stage.roledescription": "Aperçu 3D",
  "editor.stage.safe": "Marge de sécurité",
  "editor.stage.seeFlat": "Voir à plat",
  "editor.stage.side": "Face",
  "editor.stage.trim": "Coupe",
  "editor.stage.turn": "Tourner la pièce",
  "editor.stage.turnDown": "Tourner vers le bas",
  "editor.stage.turnLeft": "Tourner à gauche",
  "editor.stage.turnRight": "Tourner à droite",
  "editor.stage.turnUp": "Tourner vers le haut",
  "editor.stage.turned": "Tourné pour remplir l’écran.",
  "editor.stage.withGuides": "Avec repères",
  "editor.stage.zoom": "Zoom",
  "editor.stage.zoomIn": "Zoom avant",
  "editor.stage.zoomOut": "Zoom arrière",
  "editor.undo": "Annuler",
  "editor.upload.big": "Ce fichier dépasse {size}",
  "editor.upload.cap": "Vous avez envoyé autant de fichiers que nous en acceptons par jour. Réessayez demain.",
  "editor.upload.failed": "Ce fichier n’a pas pu être envoyé. Réessayez.",
  "editor.upload.heic": "Cette photo est au format HEIC, que nous ne pouvons pas imprimer. Enregistrez-la en JPEG ou PNG et envoyez-la de nouveau.",
  "editor.upload.kindLogo": "Ce n’est pas un SVG, PDF, PNG ou JPEG",
  "editor.upload.kindOther": "Ce type de fichier ne peut pas être utilisé ici.",
  "editor.upload.kindPhoto": "Ce n’est pas un PNG ou JPEG",
  "editor.upload.off": "Cette boutique n’accepte pas encore de fichiers ici.",
  "editor.upload.quota": "Nous ne pouvons pas accepter de fichiers pour le moment. Réessayez plus tard.",
  "editor.upload.sending": "Envoi en cours",
  "editor.upload.sendingLogo": "Envoi de votre logo",
  "editor.upload.sendingPhoto": "Envoi de votre photo",
  "editor.upload.svgCleaned": "Ce SVG contient quelque chose que nous ne pouvons pas imprimer. Enregistrez-le en SVG simple et envoyez-le de nouveau.",
  "editor.ways.blank": "Partir d’une page vierge",
  "editor.ways.blankBody": "L’éditeur complet, sur une page au format fini avec le fond perdu et la marge de sécurité tracés.",
  "editor.ways.blankMeta": "{w} × {h} mm + {bleed} mm de fond perdu",
  "editor.ways.blankNone": "La page au format fini, avec le fond perdu et la marge de sécurité tracés.",
  "editor.ways.chooseBody": "Un modèle prêt à l’emploi de la boutique. Saisissez vos textes, ajoutez votre logo, choisissez les couleurs.",
  "editor.ways.noDesigns": "Il n’y a pas encore de modèle prêt à l’emploi pour {product}.",
  "editor.ways.own": "Envoyer votre propre fichier",
  "editor.ways.ownBody": "Vous avez déjà un fichier prêt à imprimer ? Envoyez-le, une personne le vérifie.",
  "editor.ways.ownMeta": "PDF · TIFF · JPEG · jusqu’à 100 Mo",
  "editor.ways.ownNone": "Un PDF, TIFF ou JPEG jusqu’à 100 Mo.",
  "editor.ways.title": "Comment voulez-vous le créer ?"
}, cd = {
  "editor.add": "加入购物篮",
  "editor.bar.fewer": "减一",
  "editor.bar.fix": "请先修正检查中的 {n, plural, other {# 个问题}}，才能加入购物篮。",
  "editor.bar.howMany": "数量",
  "editor.bar.more": "加一",
  "editor.bar.working": "正在计算价格……",
  "editor.cancel": "取消",
  "editor.check.blurry": "此尺寸下标志可能印得模糊——更大的文件或 SVG 会更清晰",
  "editor.check.blurryDetail": "{px} px 在 {w} × {h} mm 下只有 {dpi} dpi——需要 {needs}。",
  "editor.check.blurryPhoto": "此尺寸下照片可能印得模糊——更大的文件会更清晰",
  "editor.check.fileKind": "这里不能使用这种文件。",
  "editor.check.fileKindListed": "{part}：这里不能使用这种文件",
  "editor.check.fileKindPrinted": "凸起的标志必须是矢量图：请以 SVG 格式发送。图片没有可以凸起的轮廓。",
  "editor.check.fileKindPrintedListed": "{part}：请以 SVG 矢量图发送你的标志",
  "editor.check.fileMissing": "这部分的文件没有上传成功。请重新上传。",
  "editor.check.fileMissingListed": "{part}：请重新上传文件",
  "editor.check.fine": "你的标志中有些线条太细，无法雕刻——可能会消失",
  "editor.check.hard": "难以阅读——文字与背后的颜色太接近。",
  "editor.check.lines": "{n, plural, other {这里只能放 # 行。}}",
  "editor.check.linesListed": "{part}的行数过多。",
  "editor.check.logoSmall": "你的标志宽度只有 {size}——太小，看不清",
  "editor.check.needLogo": "请添加标志——此设计需要。",
  "editor.check.needLogoShort": "请添加标志。",
  "editor.check.needPhoto": "请添加照片——此设计需要。",
  "editor.check.needPhotoShort": "请添加照片。",
  "editor.check.needWords": "请填写{part}——此设计需要。",
  "editor.check.needWordsShort": "请填写{part}。",
  "editor.check.needed": "{part}为必填——不能留空",
  "editor.check.neededField": "请填写文字——这部分为必填",
  "editor.check.notOffered": "店铺在这里不提供这个选项。请另选一个。",
  "editor.check.over": "{n, plural, other {超出 # 个字符。}}在 {size} 下，这部分最多可放 {limit} 个字符。",
  "editor.check.overGrows": "{n, plural, other {超出 # 个字符。}}在 {size} 下，这部分最多可放 {limit} 个字符。字号越小，能放的字越多。",
  "editor.check.overListed": "{part}：{n, plural, other {超出 # 个字符}}",
  "editor.check.overPrint": "超出 {n} 个字符，请缩短。",
  "editor.check.overPrintListed": "{part}超出上限 {n, plural, other {# 个字符}}。",
  "editor.check.safe": "超出了安全线。",
  "editor.check.safeListed": "{part}超出了安全线。",
  "editor.check.safeShorten": "超出了安全线。请缩短。",
  "editor.check.size": "这部分不能使用这个字号。",
  "editor.check.sizeFloor": "小于 {size} 的字印出来会不清晰",
  "editor.check.unknown": "这个设计目前无法制作。请从店铺的设计重新开始。",
  "editor.checks.clear": "一切正常",
  "editor.checks.count": "{n} 项待查看",
  "editor.checks.go": "前往",
  "editor.checks.nothing": "没有需要修正的地方。看起来是否合适，就交给校样确认。",
  "editor.checks.title": "检查",
  "editor.chip.logo": "你的标志",
  "editor.chip.motif": "图案",
  "editor.chip.photo": "照片",
  "editor.chip.words": "你的文字",
  "editor.choose.changeSides": "更改尺寸或面数",
  "editor.choose.chip": "打造专属款",
  "editor.choose.colourways": "{n, plural, other {# 种配色}}",
  "editor.choose.count": "{n, plural, other {# 个设计}}",
  "editor.choose.layouts": "{n, plural, other {# 种版式}}",
  "editor.choose.noMatch": "没有符合条件的设计",
  "editor.choose.noMatchQuery": "没有与“{query}”相符的设计",
  "editor.choose.none": "{product}暂时还没有现成设计",
  "editor.choose.noneSub": "从正确尺寸的空白页开始，或发送你自己做的文件。",
  "editor.choose.plain": "从素面款开始",
  "editor.choose.plainNone": "保持原样，不添加任何内容。",
  "editor.choose.plainSub": "在工作室允许的位置加上你的文字或标志。",
  "editor.choose.search": "搜索设计",
  "editor.choose.show": "显示设计",
  "editor.choose.showAll": "显示全部设计",
  "editor.choose.subMaker": "{product}有 {n, plural, other {# 个现成设计}}。选一个，再修改其中可以改的部分。",
  "editor.choose.subPrint": "展示在你的 {trim} {product}上，{sides}。每个设计都有你可填写的部分，其余保持店铺原样。",
  "editor.choose.title": "选择设计",
  "editor.choose.use": "定制“{name}”设计。{chips}。",
  "editor.close": "关闭",
  "editor.designs.byCode": "在找到你的订单后打开。只有你能看到这些设计。",
  "editor.designs.byLink": "只有你能看到这些设计。你是通过我们发到 {email} 的链接打开的。",
  "editor.designs.changed": "最后修改：{when}",
  "editor.designs.deleteAria": "删除{name}",
  "editor.designs.deleteBody": "它会被永久删除，连同你为它上传的标志。已下的订单会保留各自的副本。",
  "editor.designs.deleteBodyPrint": "它会从你的设计中移除，链接也将失效。已下的订单会保留各自的副本。",
  "editor.designs.deleteFailed": "无法删除。请重试。",
  "editor.designs.deleteGone": "这个设计已属于一个订单，因此会保留。",
  "editor.designs.deleteTitle": "删除“{name}”？",
  "editor.designs.deleteYes": "确认删除",
  "editor.designs.deleteYesPrint": "删除",
  "editor.designs.deleted": "设计已删除。",
  "editor.designs.deletedPrint": "{name}已删除。",
  "editor.designs.here": "你在这台设备上保存的设计。只有你能看到。",
  "editor.designs.keep": "保留",
  "editor.designs.noWords": "还没有文字",
  "editor.designs.none": "没有已保存的设计",
  "editor.designs.noneBody": "定制时按下“保存，稍后再来”，设计就会留在这里。",
  "editor.designs.noneBodyPrint": "选择“保存，稍后再来”后，设计会留在这里，我们会把链接发到你的邮箱。",
  "editor.designs.open": "打开",
  "editor.designs.openAria": "打开{name}",
  "editor.designs.order": "下单",
  "editor.designs.orderAria": "订购{name}",
  "editor.designs.title": "你的设计",
  "editor.drawing.edit": "编辑{name}",
  "editor.drawing.locked": "{name}——店铺设定的部分，保持不变。",
  "editor.drawing.logo": "你的标志",
  "editor.drawing.photo": "你的照片",
  "editor.error.other": "无法保存。请重试。",
  "editor.error.rate": "尝试次数过多。请等一分钟再试。",
  "editor.error.refused": "店铺无法按现状接受这个设计。请检查后重试。",
  "editor.failed": "无法加载设计。",
  "editor.fields.addLogo": "添加你的标志",
  "editor.fields.addWords": "添加文字",
  "editor.fields.bigger": "放大文字",
  "editor.fields.colour": "颜色",
  "editor.fields.colours": "配色",
  "editor.fields.coloursSub": "会改变两面所有使用这些颜色的部分。",
  "editor.fields.counter": "{count} / {limit}",
  "editor.fields.counterAria": "{count}/{limit} 个字符",
  "editor.fields.dropLogo": "将标志拖到这里",
  "editor.fields.dropPhoto": "将照片拖到这里",
  "editor.fields.either": "可以保持空白，也可以在这里放上你的文字或标志。",
  "editor.fields.finishFor": "{part}的表面处理",
  "editor.fields.fitPhotoAria": "照片在框中的摆放方式",
  "editor.fields.font": "字体",
  "editor.fields.fontFor": "{part}的字体",
  "editor.fields.kept": "随设计一起保存",
  "editor.fields.layout": "版式",
  "editor.fields.leaveEmpty": "留空",
  "editor.fields.lockedAria": "{part}，由工作室设定：{value}",
  "editor.fields.logoKinds": "SVG、PDF、PNG 或 JPEG，最大 {size}",
  "editor.fields.needed": "必填",
  "editor.fields.neededLower": "必填",
  "editor.fields.nothing": "这个设计没有可以由你修改的部分。",
  "editor.fields.optional": "选填",
  "editor.fields.person": "发送校样前，专人会检查每个设计。",
  "editor.fields.photoKinds": "PNG 或 JPEG，最大 {size}",
  "editor.fields.privateLogo": "只有你和 {shop} 能看到你的标志。",
  "editor.fields.privateMaker": "你的标志是私密的。只有你和工作室能看到。",
  "editor.fields.privateMakerPhoto": "你的照片是私密的。只有你和工作室能看到。",
  "editor.fields.privatePhoto": "只有你和 {shop} 能看到你的照片。",
  "editor.fields.removeLogo": "移除你的标志",
  "editor.fields.removeLogoPrint": "移除标志",
  "editor.fields.removePhoto": "移除你的照片",
  "editor.fields.removePhotoPrint": "移除照片",
  "editor.fields.replace": "替换",
  "editor.fields.setByStudio": "由工作室设定",
  "editor.fields.size": "字号",
  "editor.fields.sizeFor": "{part}的字号",
  "editor.fields.smaller": "缩小文字",
  "editor.fields.uploadLogo": "上传标志",
  "editor.fields.uploadPhoto": "上传照片",
  "editor.fields.yourLogo": "{part}——你的标志",
  "editor.fields.yourWords": "{part}——你的文字",
  "editor.fill.allDesigns": "全部设计",
  "editor.fill.change": "更换设计",
  "editor.fill.design": "设计：{name}",
  "editor.fill.fullEditor": "切换到完整编辑器",
  "editor.fill.makeItYours": "打造专属款",
  "editor.fill.noneBody": "你将从素面款开始。在工作室允许的位置加上你的文字。",
  "editor.fill.noneTitle": "这款还没有现成设计",
  "editor.fill.ordered": "这个设计已经在一个订单中，所以会保持原样。你在这里做的修改会另存为新设计。",
  "editor.fill.plain": "素面款",
  "editor.fill.proof": "在切割之前，我们会先发校样给你。",
  "editor.fill.toChange": "{n} 处可修改",
  "editor.fill.yourDesign": "你的设计",
  "editor.filter.all": "全部",
  "editor.filter.bold": "醒目",
  "editor.filter.logo": "含标志",
  "editor.filter.motif": "图案",
  "editor.filter.one": "单色",
  "editor.filter.photo": "含照片",
  "editor.filter.simple": "简洁",
  "editor.filter.words": "仅文字",
  "editor.fix.shorten": "缩短",
  "editor.fix.smaller": "缩小",
  "editor.fix.use": "改用{colour}",
  "editor.full.accent": "强调色",
  "editor.full.across": "水平位置（毫米）",
  "editor.full.addImage": "添加图片",
  "editor.full.addWords": "添加文字",
  "editor.full.alignBottom": "底部对齐",
  "editor.full.alignCentre": "水平居中",
  "editor.full.alignLeft": "左边缘对齐",
  "editor.full.alignMiddle": "垂直居中",
  "editor.full.alignPage": "对齐页面",
  "editor.full.alignRight": "右边缘对齐",
  "editor.full.alignTop": "顶部对齐",
  "editor.full.alignment": "对齐方式",
  "editor.full.back": "返回",
  "editor.full.backToForm": "回到表单",
  "editor.full.backward": "将{name}下移一层",
  "editor.full.banner": "现在你可以移动任何内容，文字会保留。",
  "editor.full.blank": "从空白开始",
  "editor.full.blurry": "这张图片按此尺寸印刷可能会模糊——{dpi} dpi，我们需要 {needs}。更大的文件会更清晰。",
  "editor.full.bold": "粗体",
  "editor.full.card": "你的设计，{side}",
  "editor.full.centre": "居中",
  "editor.full.delete": "删除",
  "editor.full.down": "垂直位置（毫米）",
  "editor.full.ellipse": "椭圆",
  "editor.full.empty": "请先在卡片上添加内容。",
  "editor.full.end": "末端",
  "editor.full.extrabold": "特粗",
  "editor.full.fill": "填充",
  "editor.full.fitAria": "在框中的摆放方式",
  "editor.full.forward": "将{name}上移一层",
  "editor.full.height": "高度（毫米）",
  "editor.full.hideNote": "隐藏此提示",
  "editor.full.image": "图片",
  "editor.full.inFull": "这个设计在完整编辑器中",
  "editor.full.inFullBody": "你移动过内容，表单已不再适用。继续在编辑器中修改，或回到表单并放弃移动。文字都会保留。",
  "editor.full.ink": "墨色",
  "editor.full.layers": "图层",
  "editor.full.line": "线条",
  "editor.full.madeYours": "{design}，你的版本",
  "editor.full.medium": "中等",
  "editor.full.noLayers": "这一面还没有内容。",
  "editor.full.note": "拖动即可移动，或使用方向键。安全线以外的内容可能会被裁掉。",
  "editor.full.nothing": "未选中任何内容。点卡片上的内容，或用工具添加文字、图片或形状。",
  "editor.full.open": "打开完整编辑器",
  "editor.full.paper": "纸色",
  "editor.full.partText": "文字",
  "editor.full.position": "位置和大小",
  "editor.full.properties": "属性",
  "editor.full.rect": "矩形",
  "editor.full.regular": "常规",
  "editor.full.replaceImage": "替换图片",
  "editor.full.safe": "这超出了安全线。请缩小或往里移。",
  "editor.full.sample": "在此输入文字",
  "editor.full.select": "选中{name}",
  "editor.full.semibold": "半粗",
  "editor.full.sending": "正在上传图片",
  "editor.full.size": "{w} × {h} 毫米 · 出血 {bleed} 毫米 · 安全线 {safe} 毫米",
  "editor.full.sizeNoSafe": "{w} × {h} 毫米 · 出血 {bleed} 毫米",
  "editor.full.sizePt": "字号（磅）",
  "editor.full.start": "起始端",
  "editor.full.toForm": "回到表单",
  "editor.full.tools": "工具",
  "editor.full.twoPictures": "一个设计最多放两张图片：请替换一张，或先删除一张。",
  "editor.full.uploadImage": "上传图片",
  "editor.full.use": "使用这个设计",
  "editor.full.weight": "字重",
  "editor.full.width": "宽度（毫米）",
  "editor.full.words": "文字",
  "editor.full.zoom": "缩放",
  "editor.full.zoomIn": "放大",
  "editor.full.zoomOut": "缩小",
  "editor.loading": "正在加载设计",
  "editor.logo.across": "宽 {size}",
  "editor.logo.centre": "居中",
  "editor.logo.down": "向下微移",
  "editor.logo.fill": "填满",
  "editor.logo.fitAria": "标志在框中的摆放方式",
  "editor.logo.fitInside": "适应框内",
  "editor.logo.inBox": "在框中",
  "editor.logo.left": "向左微移",
  "editor.logo.nudge": "微移",
  "editor.logo.nudgeAria": "微移标志",
  "editor.logo.right": "向右微移",
  "editor.logo.size": "在框中的大小",
  "editor.logo.up": "向上微移",
  "editor.missing": "这个商品暂时无法定制。",
  "editor.oneColour.fine": "有些线条太细，无法雕刻——可能会消失",
  "editor.oneColour.fineHow": "把滑块移向“少雕一些”可去掉细密的阴影，或上传线条更粗的标志。",
  "editor.oneColour.in": "标志已上传。看看它雕刻出来的样子。",
  "editor.oneColour.laser": "激光切出的样子",
  "editor.oneColour.laserAria": "雕刻在 {material} 上的标志",
  "editor.oneColour.laserAriaPlain": "激光雕刻出的标志",
  "editor.oneColour.later": "制作校样时我们会再次检查细节。",
  "editor.oneColour.lead": "激光只雕一种颜色。比你设定的界线更深的部分会被雕刻，更浅的部分保持为{material}。",
  "editor.oneColour.leadPlain": "激光只雕一种颜色。比你设定的界线更深的部分会被雕刻，更浅的部分保持原样。",
  "editor.oneColour.less": "少雕一些",
  "editor.oneColour.line": "明暗分界",
  "editor.oneColour.mayBeFine": "有些线条可能太细",
  "editor.oneColour.more": "多雕一些",
  "editor.oneColour.open": "改为单色",
  "editor.oneColour.set": "已设为单色雕刻。",
  "editor.oneColour.use": "就用这个",
  "editor.oneColour.yours": "你的文件",
  "editor.oneColour.yoursAria": "你上传的标志",
  "editor.preview.noBasket": "预览中——不会加入真实的购物篮。",
  "editor.preview.noBasketPrint": "你正以顾客身份预览——不会加入购物篮。",
  "editor.preview.noSave": "预览中——此处已关闭保存。",
  "editor.preview.noSavePrint": "你正以顾客身份预览——不会保存任何内容。",
  "editor.quote.each": "每件 {price}",
  "editor.quote.more": "还有 {n} 项。",
  "editor.quote.nothingAdded": "定制不额外收费。",
  "editor.quote.ready": "预计 {date} 完成",
  "editor.quote.show": "带我去看",
  "editor.quote.title": "你的报价",
  "editor.redo": "重做",
  "editor.retry": "重试",
  "editor.save": "保存，稍后再来",
  "editor.save.body": "我们会保存设计，并把私人链接发到你的邮箱。其他人都无法打开。",
  "editor.save.bodyPrint": "我们会保存设计并把私人链接发到你的邮箱。只有你和 {shop} 能打开。",
  "editor.save.email": "你的邮箱",
  "editor.save.emailBad": "这看起来不像邮箱地址。请试试 name@example.com 这样的格式",
  "editor.save.emailNone": "请输入邮箱，以便我们发送链接",
  "editor.save.emailPrint": "邮箱",
  "editor.save.submit": "保存",
  "editor.save.submitPrint": "保存并发送链接",
  "editor.saved.backToShop": "返回店铺",
  "editor.saved.keepGoing": "继续",
  "editor.saved.sentTo": "已发送到 {email}。这个链接只会打开你的设计，不会打开其他人的。",
  "editor.saved.title": "已保存。我们已把返回链接发到你的邮箱。",
  "editor.side.back": "背面",
  "editor.side.front": "正面",
  "editor.sides.both": "双面",
  "editor.sides.one": "单面",
  "editor.stage.assembled": "组装后",
  "editor.stage.bleed": "出血",
  "editor.stage.close": "关闭预览",
  "editor.stage.full": "全屏预览",
  "editor.stage.guides": "参考线",
  "editor.stage.hint": "拖动旋转 · 滚动缩放",
  "editor.stage.hintPhone": "拖动旋转 · 双指缩放",
  "editor.stage.kitModes": "成套部件的显示方式",
  "editor.stage.label": "{product}，{design}。平面展示。",
  "editor.stage.label3d": "{product}，{design}。用方向键旋转，用加号和减号缩放，按 0 复原。",
  "editor.stage.locked": "{name}是店铺设定的部分——保持不变。",
  "editor.stage.mode": "卡片显示方式",
  "editor.stage.no3d": "此设备无法显示 3D 视图，因此你看到的是每个部件的平面图。这正是我们要切割的同一个设计。",
  "editor.stage.pieces": "{n, plural, other {# 个部件}}",
  "editor.stage.pieces3d": "部件",
  "editor.stage.printed": "印刷效果",
  "editor.stage.reset": "复原视图",
  "editor.stage.roledescription": "3D 预览",
  "editor.stage.safe": "安全线",
  "editor.stage.seeFlat": "平面查看",
  "editor.stage.side": "面",
  "editor.stage.trim": "裁切线",
  "editor.stage.turn": "旋转部件",
  "editor.stage.turnDown": "向下转",
  "editor.stage.turnLeft": "向左转",
  "editor.stage.turnRight": "向右转",
  "editor.stage.turnUp": "向上转",
  "editor.stage.turned": "已旋转以铺满屏幕。",
  "editor.stage.withGuides": "显示参考线",
  "editor.stage.zoom": "缩放",
  "editor.stage.zoomIn": "放大",
  "editor.stage.zoomOut": "缩小",
  "editor.undo": "撤销",
  "editor.upload.big": "文件超过 {size}",
  "editor.upload.cap": "你今天发送的文件已达每日上限。请明天再试。",
  "editor.upload.failed": "文件发送失败。请重试。",
  "editor.upload.heic": "这张照片是 HEIC 格式，我们无法用它印刷。请另存为 JPEG 或 PNG 后重新上传。",
  "editor.upload.kindLogo": "这不是 SVG、PDF、PNG 或 JPEG 文件",
  "editor.upload.kindOther": "这里不能使用这种文件。",
  "editor.upload.kindPhoto": "这不是 PNG 或 JPEG 文件",
  "editor.upload.off": "这家店暂时不在这里接收文件。",
  "editor.upload.quota": "我们现在无法接收文件。请稍后再试。",
  "editor.upload.sending": "正在发送",
  "editor.upload.sendingLogo": "正在上传标志",
  "editor.upload.sendingPhoto": "正在上传照片",
  "editor.upload.svgCleaned": "这个 SVG 含有我们无法用来印刷的内容。请另存为普通 SVG 后重新上传。",
  "editor.ways.blank": "从空白开始",
  "editor.ways.blankBody": "完整编辑器，页面为成品尺寸，已画出出血和安全线。",
  "editor.ways.blankMeta": "{w} × {h} mm + {bleed} mm 出血",
  "editor.ways.blankNone": "成品尺寸的页面，已画出出血和安全线。",
  "editor.ways.chooseBody": "店铺现成的设计。填写文字，添加标志，选择颜色。",
  "editor.ways.noDesigns": "{product}暂时还没有现成设计。",
  "editor.ways.own": "发送你自己的文件",
  "editor.ways.ownBody": "已有可印刷的文件？上传后由专人检查。",
  "editor.ways.ownMeta": "PDF · TIFF · JPEG · 最大 100 MB",
  "editor.ways.ownNone": "PDF、TIFF 或 JPEG，最大 100 MB。",
  "editor.ways.title": "你想怎样制作？"
}, ud = {
  "editor.add": "加入購物籃",
  "editor.bar.fewer": "減一",
  "editor.bar.fix": "請先修正檢查中的 {n, plural, other {# 個問題}}，才能加入購物籃。",
  "editor.bar.howMany": "數量",
  "editor.bar.more": "加一",
  "editor.bar.working": "正在計算價格……",
  "editor.cancel": "取消",
  "editor.check.blurry": "此尺寸下標誌可能印得模糊——更大的檔案或 SVG 會更清晰",
  "editor.check.blurryDetail": "{px} px 在 {w} × {h} mm 時只有 {dpi} dpi——需要 {needs}。",
  "editor.check.blurryPhoto": "此尺寸下照片可能印得模糊——更大的檔案會更清晰",
  "editor.check.fileKind": "這裡不能使用這種檔案。",
  "editor.check.fileKindListed": "{part}：這裡不能使用這種檔案",
  "editor.check.fileKindPrinted": "凸起的標誌必須是向量圖：請以 SVG 格式傳送。圖片沒有可以凸起的輪廓。",
  "editor.check.fileKindPrintedListed": "{part}：請以 SVG 向量圖傳送你的標誌",
  "editor.check.fileMissing": "這個部分的檔案沒有上傳成功。請重新上傳。",
  "editor.check.fileMissingListed": "{part}：請重新上傳檔案",
  "editor.check.fine": "你的標誌中有些線條太細，無法雕刻——可能會消失",
  "editor.check.hard": "難以閱讀——文字與背後的顏色太接近。",
  "editor.check.lines": "{n, plural, other {這裡只能放 # 行。}}",
  "editor.check.linesListed": "{part}的行數太多。",
  "editor.check.logoSmall": "你的標誌寬度只有 {size}——太小，看不清楚",
  "editor.check.needLogo": "請加入標誌——此設計需要。",
  "editor.check.needLogoShort": "請加入標誌。",
  "editor.check.needPhoto": "請加入照片——此設計需要。",
  "editor.check.needPhotoShort": "請加入照片。",
  "editor.check.needWords": "請填寫{part}——此設計需要。",
  "editor.check.needWordsShort": "請填寫{part}。",
  "editor.check.needed": "{part}為必填——不能留白",
  "editor.check.neededField": "請填寫文字——這個部分為必填",
  "editor.check.notOffered": "店家在這裡不提供這個選項。請另選一個。",
  "editor.check.over": "{n, plural, other {超出 # 個字元。}}在 {size} 時，這個部分最多可放 {limit} 個字元。",
  "editor.check.overGrows": "{n, plural, other {超出 # 個字元。}}在 {size} 時，這個部分最多可放 {limit} 個字元。字級越小，能放的字越多。",
  "editor.check.overListed": "{part}：{n, plural, other {超出 # 個字元}}",
  "editor.check.overPrint": "超出 {n} 個字元，請縮短。",
  "editor.check.overPrintListed": "{part}超出上限 {n, plural, other {# 個字元}}。",
  "editor.check.safe": "超出了安全線。",
  "editor.check.safeListed": "{part}超出了安全線。",
  "editor.check.safeShorten": "超出了安全線。請縮短。",
  "editor.check.size": "這個部分不能使用這個字級。",
  "editor.check.sizeFloor": "小於 {size} 的字印出來會不清楚",
  "editor.check.unknown": "這個設計目前無法製作。請從店家的設計重新開始。",
  "editor.checks.clear": "一切正常",
  "editor.checks.count": "{n} 項待確認",
  "editor.checks.go": "前往",
  "editor.checks.nothing": "沒有需要修正的地方。看起來是否合適，就交給校樣確認。",
  "editor.checks.title": "檢查",
  "editor.chip.logo": "你的標誌",
  "editor.chip.motif": "圖案",
  "editor.chip.photo": "照片",
  "editor.chip.words": "你的文字",
  "editor.choose.changeSides": "更改尺寸或面數",
  "editor.choose.chip": "打造專屬款",
  "editor.choose.colourways": "{n, plural, other {# 種配色}}",
  "editor.choose.count": "{n, plural, other {# 個設計}}",
  "editor.choose.layouts": "{n, plural, other {# 種版式}}",
  "editor.choose.noMatch": "沒有符合條件的設計",
  "editor.choose.noMatchQuery": "沒有與「{query}」相符的設計",
  "editor.choose.none": "{product}目前還沒有現成設計",
  "editor.choose.noneSub": "從正確尺寸的空白頁開始，或傳送你自己做的檔案。",
  "editor.choose.plain": "從素面款開始",
  "editor.choose.plainNone": "保持原樣，不加任何東西。",
  "editor.choose.plainSub": "在工作室允許的位置放上你的文字或標誌。",
  "editor.choose.search": "搜尋設計",
  "editor.choose.show": "顯示設計",
  "editor.choose.showAll": "顯示全部設計",
  "editor.choose.subMaker": "{product}有 {n, plural, other {# 個現成設計}}。挑一個，再修改其中可以改的部分。",
  "editor.choose.subPrint": "展示在你的 {trim} {product}上，{sides}。每個設計都有你可填寫的部分，其餘保持店家原樣。",
  "editor.choose.title": "選擇設計",
  "editor.choose.use": "訂製「{name}」設計。{chips}。",
  "editor.close": "關閉",
  "editor.designs.byCode": "在找到你的訂單後開啟。只有你看得到這些設計。",
  "editor.designs.byLink": "只有你看得到這些設計。你是透過我們寄到 {email} 的連結開啟的。",
  "editor.designs.changed": "最後修改：{when}",
  "editor.designs.deleteAria": "刪除{name}",
  "editor.designs.deleteBody": "它會被永久刪除，連同你為它上傳的標誌。已下的訂單會保留各自的副本。",
  "editor.designs.deleteBodyPrint": "它會從你的設計中移除，連結也將失效。已下的訂單會保留各自的副本。",
  "editor.designs.deleteFailed": "無法刪除。請再試一次。",
  "editor.designs.deleteGone": "這個設計已屬於一筆訂單，因此會保留。",
  "editor.designs.deleteTitle": "刪除「{name}」？",
  "editor.designs.deleteYes": "確定刪除",
  "editor.designs.deleteYesPrint": "刪除",
  "editor.designs.deleted": "設計已刪除。",
  "editor.designs.deletedPrint": "{name}已刪除。",
  "editor.designs.here": "你在這台裝置上儲存的設計。只有你看得到。",
  "editor.designs.keep": "保留",
  "editor.designs.noWords": "還沒有文字",
  "editor.designs.none": "沒有已儲存的設計",
  "editor.designs.noneBody": "訂製時按下「儲存，稍後再來」，設計就會留在這裡。",
  "editor.designs.noneBodyPrint": "選擇「儲存，稍後再來」後，設計會留在這裡，我們會把連結寄到你的信箱。",
  "editor.designs.open": "開啟",
  "editor.designs.openAria": "開啟{name}",
  "editor.designs.order": "下單",
  "editor.designs.orderAria": "訂購{name}",
  "editor.designs.title": "你的設計",
  "editor.drawing.edit": "編輯{name}",
  "editor.drawing.locked": "{name}——店家設定的部分，保持不變。",
  "editor.drawing.logo": "你的標誌",
  "editor.drawing.photo": "你的照片",
  "editor.error.other": "無法儲存。請再試一次。",
  "editor.error.rate": "嘗試次數太多。請等一分鐘再試。",
  "editor.error.refused": "店家無法照目前的樣子接受這個設計。請檢查後再試一次。",
  "editor.failed": "無法載入設計。",
  "editor.fields.addLogo": "加入你的標誌",
  "editor.fields.addWords": "加入文字",
  "editor.fields.bigger": "放大文字",
  "editor.fields.colour": "顏色",
  "editor.fields.colours": "配色",
  "editor.fields.coloursSub": "會改變兩面所有使用這些顏色的部分。",
  "editor.fields.counter": "{count} / {limit}",
  "editor.fields.counterAria": "{count}/{limit} 個字元",
  "editor.fields.dropLogo": "將標誌拖曳到這裡",
  "editor.fields.dropPhoto": "將照片拖曳到這裡",
  "editor.fields.either": "可以保持空白，也可以在這裡放上你的文字或標誌。",
  "editor.fields.finishFor": "{part}的表面處理",
  "editor.fields.fitPhotoAria": "照片在框中的擺放方式",
  "editor.fields.font": "字型",
  "editor.fields.fontFor": "{part}的字型",
  "editor.fields.kept": "隨設計一起儲存",
  "editor.fields.layout": "版式",
  "editor.fields.leaveEmpty": "留白",
  "editor.fields.lockedAria": "{part}，由工作室設定：{value}",
  "editor.fields.logoKinds": "SVG、PDF、PNG 或 JPEG，最大 {size}",
  "editor.fields.needed": "必填",
  "editor.fields.neededLower": "必填",
  "editor.fields.nothing": "這個設計沒有可以由你修改的部分。",
  "editor.fields.optional": "選填",
  "editor.fields.person": "寄送校樣前，專人會檢查每個設計。",
  "editor.fields.photoKinds": "PNG 或 JPEG，最大 {size}",
  "editor.fields.privateLogo": "只有你和 {shop} 看得到你的標誌。",
  "editor.fields.privateMaker": "你的標誌不會公開。只有你和工作室看得到。",
  "editor.fields.privateMakerPhoto": "你的照片不會公開。只有你和工作室看得到。",
  "editor.fields.privatePhoto": "只有你和 {shop} 看得到你的照片。",
  "editor.fields.removeLogo": "移除你的標誌",
  "editor.fields.removeLogoPrint": "移除標誌",
  "editor.fields.removePhoto": "移除你的照片",
  "editor.fields.removePhotoPrint": "移除照片",
  "editor.fields.replace": "替換",
  "editor.fields.setByStudio": "由工作室設定",
  "editor.fields.size": "字級",
  "editor.fields.sizeFor": "{part}的字級",
  "editor.fields.smaller": "縮小文字",
  "editor.fields.uploadLogo": "上傳標誌",
  "editor.fields.uploadPhoto": "上傳照片",
  "editor.fields.yourLogo": "{part}——你的標誌",
  "editor.fields.yourWords": "{part}——你的文字",
  "editor.fill.allDesigns": "全部設計",
  "editor.fill.change": "更換設計",
  "editor.fill.design": "設計：{name}",
  "editor.fill.fullEditor": "切換到完整編輯器",
  "editor.fill.makeItYours": "打造專屬款",
  "editor.fill.noneBody": "你會從素面款開始。在工作室允許的位置放上你的文字。",
  "editor.fill.noneTitle": "這款還沒有現成設計",
  "editor.fill.ordered": "這個設計已經在一筆訂單中，所以會保持原樣。你在這裡做的修改會另存為新設計。",
  "editor.fill.plain": "素面款",
  "editor.fill.proof": "在切割之前，我們會先寄校樣給你。",
  "editor.fill.toChange": "{n} 處可修改",
  "editor.fill.yourDesign": "你的設計",
  "editor.filter.all": "全部",
  "editor.filter.bold": "醒目",
  "editor.filter.logo": "含標誌",
  "editor.filter.motif": "圖案",
  "editor.filter.one": "單色",
  "editor.filter.photo": "含照片",
  "editor.filter.simple": "簡潔",
  "editor.filter.words": "僅文字",
  "editor.fix.shorten": "縮短",
  "editor.fix.smaller": "縮小",
  "editor.fix.use": "改用{colour}",
  "editor.full.accent": "強調色",
  "editor.full.across": "水平位置（公釐）",
  "editor.full.addImage": "新增圖片",
  "editor.full.addWords": "新增文字",
  "editor.full.alignBottom": "底部對齊",
  "editor.full.alignCentre": "水平置中",
  "editor.full.alignLeft": "左邊緣對齊",
  "editor.full.alignMiddle": "垂直置中",
  "editor.full.alignPage": "對齊頁面",
  "editor.full.alignRight": "右邊緣對齊",
  "editor.full.alignTop": "頂部對齊",
  "editor.full.alignment": "對齊方式",
  "editor.full.back": "返回",
  "editor.full.backToForm": "回到表單",
  "editor.full.backward": "將{name}下移一層",
  "editor.full.banner": "現在你可以移動任何內容，文字會保留。",
  "editor.full.blank": "從空白開始",
  "editor.full.blurry": "這張圖片按此尺寸印刷可能會模糊——{dpi} dpi，我們需要 {needs}。更大的檔案會更清晰。",
  "editor.full.bold": "粗體",
  "editor.full.card": "你的設計，{side}",
  "editor.full.centre": "置中",
  "editor.full.delete": "刪除",
  "editor.full.down": "垂直位置（公釐）",
  "editor.full.ellipse": "橢圓",
  "editor.full.empty": "請先在卡片上新增內容。",
  "editor.full.end": "末端",
  "editor.full.extrabold": "特粗",
  "editor.full.fill": "填色",
  "editor.full.fitAria": "在框中的擺放方式",
  "editor.full.forward": "將{name}上移一層",
  "editor.full.height": "高度（公釐）",
  "editor.full.hideNote": "隱藏此提示",
  "editor.full.image": "圖片",
  "editor.full.inFull": "這個設計在完整編輯器中",
  "editor.full.inFullBody": "你移動過內容，表單已不再適用。繼續在編輯器中修改，或回到表單並放棄移動。文字都會保留。",
  "editor.full.ink": "墨色",
  "editor.full.layers": "圖層",
  "editor.full.line": "線條",
  "editor.full.madeYours": "{design}，你的版本",
  "editor.full.medium": "中等",
  "editor.full.noLayers": "這一面還沒有內容。",
  "editor.full.note": "拖曳即可移動，或使用方向鍵。安全線以外的內容可能會被裁掉。",
  "editor.full.nothing": "未選取任何內容。點卡片上的內容，或用工具新增文字、圖片或形狀。",
  "editor.full.open": "開啟完整編輯器",
  "editor.full.paper": "紙色",
  "editor.full.partText": "文字",
  "editor.full.position": "位置和大小",
  "editor.full.properties": "屬性",
  "editor.full.rect": "矩形",
  "editor.full.regular": "標準",
  "editor.full.replaceImage": "替換圖片",
  "editor.full.safe": "這超出了安全線。請縮小或往內移。",
  "editor.full.sample": "在此輸入文字",
  "editor.full.select": "選取{name}",
  "editor.full.semibold": "半粗",
  "editor.full.sending": "正在上傳圖片",
  "editor.full.size": "{w} × {h} 公釐 · 出血 {bleed} 公釐 · 安全線 {safe} 公釐",
  "editor.full.sizeNoSafe": "{w} × {h} 公釐 · 出血 {bleed} 公釐",
  "editor.full.sizePt": "字級（點）",
  "editor.full.start": "起始端",
  "editor.full.toForm": "回到表單",
  "editor.full.tools": "工具",
  "editor.full.twoPictures": "一個設計最多放兩張圖片：請替換一張，或先刪除一張。",
  "editor.full.uploadImage": "上傳圖片",
  "editor.full.use": "使用這個設計",
  "editor.full.weight": "字重",
  "editor.full.width": "寬度（公釐）",
  "editor.full.words": "文字",
  "editor.full.zoom": "縮放",
  "editor.full.zoomIn": "放大",
  "editor.full.zoomOut": "縮小",
  "editor.loading": "正在載入設計",
  "editor.logo.across": "寬 {size}",
  "editor.logo.centre": "置中",
  "editor.logo.down": "向下微移",
  "editor.logo.fill": "填滿",
  "editor.logo.fitAria": "標誌在框中的擺放方式",
  "editor.logo.fitInside": "適應框內",
  "editor.logo.inBox": "在框中",
  "editor.logo.left": "向左微移",
  "editor.logo.nudge": "微移",
  "editor.logo.nudgeAria": "微移標誌",
  "editor.logo.right": "向右微移",
  "editor.logo.size": "在框中的大小",
  "editor.logo.up": "向上微移",
  "editor.missing": "這個商品暫時無法訂製。",
  "editor.oneColour.fine": "有些線條太細，無法雕刻——可能會消失",
  "editor.oneColour.fineHow": "把滑桿移向「少雕一些」可去掉細密的陰影，或上傳線條更粗的標誌。",
  "editor.oneColour.in": "標誌已上傳。看看它雕刻出來的樣子。",
  "editor.oneColour.laser": "雷射切出的樣子",
  "editor.oneColour.laserAria": "雕刻在 {material} 上的標誌",
  "editor.oneColour.laserAriaPlain": "雷射雕刻出的標誌",
  "editor.oneColour.later": "製作校樣時我們會再次檢查細節。",
  "editor.oneColour.lead": "雷射只雕一種顏色。比你設定的界線更深的部分會被雕刻，更淺的部分保持為{material}。",
  "editor.oneColour.leadPlain": "雷射只雕一種顏色。比你設定的界線更深的部分會被雕刻，更淺的部分保持原樣。",
  "editor.oneColour.less": "少雕一些",
  "editor.oneColour.line": "明暗分界",
  "editor.oneColour.mayBeFine": "有些線條可能太細",
  "editor.oneColour.more": "多雕一些",
  "editor.oneColour.open": "改為單色",
  "editor.oneColour.set": "已設為單色雕刻。",
  "editor.oneColour.use": "就用這個",
  "editor.oneColour.yours": "你的檔案",
  "editor.oneColour.yoursAria": "你上傳的標誌",
  "editor.preview.noBasket": "預覽中——不會加入真正的購物籃。",
  "editor.preview.noBasketPrint": "你正以顧客身分預覽——不會加入購物籃。",
  "editor.preview.noSave": "預覽中——這裡已關閉儲存功能。",
  "editor.preview.noSavePrint": "你正以顧客身分預覽——不會儲存任何內容。",
  "editor.quote.each": "每件 {price}",
  "editor.quote.more": "還有 {n} 項。",
  "editor.quote.nothingAdded": "訂製不額外收費。",
  "editor.quote.ready": "預計 {date} 完成",
  "editor.quote.show": "帶我去看",
  "editor.quote.title": "你的報價",
  "editor.redo": "重做",
  "editor.retry": "再試一次",
  "editor.save": "儲存，稍後再來",
  "editor.save.body": "我們會儲存設計，並把私人連結寄到你的信箱。其他人都無法開啟。",
  "editor.save.bodyPrint": "我們會儲存設計並把私人連結寄到你的信箱。只有你和 {shop} 能開啟。",
  "editor.save.email": "你的電子郵件",
  "editor.save.emailBad": "這看起來不像電子郵件地址。請試試 name@example.com 這樣的格式",
  "editor.save.emailNone": "請輸入電子郵件，以便我們寄送連結",
  "editor.save.emailPrint": "電子郵件",
  "editor.save.submit": "儲存",
  "editor.save.submitPrint": "儲存並寄送連結",
  "editor.saved.backToShop": "返回店家",
  "editor.saved.keepGoing": "繼續",
  "editor.saved.sentTo": "已寄到 {email}。這個連結只會開啟你的設計，不會開啟其他人的。",
  "editor.saved.title": "已儲存。我們已把返回連結寄到你的信箱。",
  "editor.side.back": "背面",
  "editor.side.front": "正面",
  "editor.sides.both": "雙面",
  "editor.sides.one": "單面",
  "editor.stage.assembled": "組裝後",
  "editor.stage.bleed": "出血",
  "editor.stage.close": "關閉預覽",
  "editor.stage.full": "全螢幕預覽",
  "editor.stage.guides": "參考線",
  "editor.stage.hint": "拖曳旋轉 · 捲動縮放",
  "editor.stage.hintPhone": "拖曳旋轉 · 雙指縮放",
  "editor.stage.kitModes": "成套部件的顯示方式",
  "editor.stage.label": "{product}，{design}。平面顯示。",
  "editor.stage.label3d": "{product}，{design}。用方向鍵旋轉，用加號和減號縮放，按 0 復原。",
  "editor.stage.locked": "{name}是店家設定的部分——保持不變。",
  "editor.stage.mode": "卡片顯示方式",
  "editor.stage.no3d": "此裝置無法顯示 3D 檢視，因此你看到的是每個部件的平面圖。這正是我們要切割的同一個設計。",
  "editor.stage.pieces": "{n, plural, other {# 個部件}}",
  "editor.stage.pieces3d": "部件",
  "editor.stage.printed": "印刷效果",
  "editor.stage.reset": "復原檢視",
  "editor.stage.roledescription": "3D 預覽",
  "editor.stage.safe": "安全線",
  "editor.stage.seeFlat": "平面檢視",
  "editor.stage.side": "面",
  "editor.stage.trim": "裁切線",
  "editor.stage.turn": "旋轉部件",
  "editor.stage.turnDown": "向下轉",
  "editor.stage.turnLeft": "向左轉",
  "editor.stage.turnRight": "向右轉",
  "editor.stage.turnUp": "向上轉",
  "editor.stage.turned": "已旋轉以填滿螢幕。",
  "editor.stage.withGuides": "顯示參考線",
  "editor.stage.zoom": "縮放",
  "editor.stage.zoomIn": "放大",
  "editor.stage.zoomOut": "縮小",
  "editor.undo": "復原",
  "editor.upload.big": "檔案超過 {size}",
  "editor.upload.cap": "你今天傳送的檔案已達每日上限。請明天再試。",
  "editor.upload.failed": "檔案傳送失敗。請再試一次。",
  "editor.upload.heic": "這張照片是 HEIC 格式，我們無法用它印刷。請另存為 JPEG 或 PNG 後重新上傳。",
  "editor.upload.kindLogo": "這不是 SVG、PDF、PNG 或 JPEG 檔案",
  "editor.upload.kindOther": "這裡不能使用這種檔案。",
  "editor.upload.kindPhoto": "這不是 PNG 或 JPEG 檔案",
  "editor.upload.off": "這家店暫時不在這裡接收檔案。",
  "editor.upload.quota": "我們現在無法接收檔案。請稍後再試。",
  "editor.upload.sending": "正在傳送",
  "editor.upload.sendingLogo": "正在上傳標誌",
  "editor.upload.sendingPhoto": "正在上傳照片",
  "editor.upload.svgCleaned": "這個 SVG 含有我們無法用來印刷的內容。請另存為一般 SVG 後重新上傳。",
  "editor.ways.blank": "從空白開始",
  "editor.ways.blankBody": "完整編輯器，頁面為成品尺寸，已畫出出血和安全線。",
  "editor.ways.blankMeta": "{w} × {h} mm + {bleed} mm 出血",
  "editor.ways.blankNone": "成品尺寸的頁面，已畫出出血和安全線。",
  "editor.ways.chooseBody": "店家現成的設計。填寫文字，加入標誌，選擇顏色。",
  "editor.ways.noDesigns": "{product}目前還沒有現成設計。",
  "editor.ways.own": "傳送你自己的檔案",
  "editor.ways.ownBody": "已有可印刷的檔案？上傳後由專人檢查。",
  "editor.ways.ownMeta": "PDF · TIFF · JPEG · 最大 100 MB",
  "editor.ways.ownNone": "PDF、TIFF 或 JPEG，最大 100 MB。",
  "editor.ways.title": "你想怎麼製作？"
}, bi = ["en-US", "de-DE", "fr-FR", "da-DK", "cs-CZ", "ar-EG", "zh-CN", "zh-TW"], hd = {
  "en-US": sd,
  "de-DE": dd,
  "fr-FR": ad,
  "da-DK": ld,
  "cs-CZ": nd,
  "ar-EG": rd,
  "zh-CN": cd,
  "zh-TW": ud
};
function fd(e) {
  if (e === void 0) return "en-US";
  const t = bi.find((i) => i.toLowerCase() === e.toLowerCase());
  if (t !== void 0) return t;
  const o = e.toLowerCase();
  return o.startsWith("zh") ? o.includes("tw") || o.includes("hk") || o.includes("hant") ? "zh-TW" : "zh-CN" : bi.find((i) => i.slice(0, 2) === o.slice(0, 2)) ?? "en-US";
}
const jo = (e) => e === "ar-EG";
function br(e, t, o) {
  let i = "", n = 0;
  for (; n < e.length; ) {
    const d = e.indexOf("{", n);
    if (d < 0) {
      i += e.slice(n);
      break;
    }
    i += e.slice(n, d);
    let s = 0, l = d;
    for (; l < e.length; l += 1)
      if (e[l] === "{") s += 1;
      else if (e[l] === "}" && (s -= 1) === 0) break;
    const c = e.slice(d + 1, l), [a = "", h, ...p] = c.split(","), f = t[a.trim()];
    if (h !== void 0 && h.trim() === "plural") {
      const v = typeof f == "number" ? f : Number(f ?? 0), y = p.join(","), k = /* @__PURE__ */ new Map();
      for (const A of y.matchAll(/(=\d+|\w+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g)) k.set(A[1], A[2]);
      const z = k.get(`=${String(v)}`) ?? k.get(new Intl.PluralRules(o).select(v)) ?? k.get("other") ?? "";
      i += br(z.replaceAll("#", new Intl.NumberFormat(o).format(v)), t, o);
    } else i += f === void 0 ? `{${c}}` : String(f);
    n = l + 1;
  }
  return i;
}
function zr(e) {
  const t = hd[e];
  return (o, i, n = {}) => br(t[o] ?? i, n, e);
}
function gd(e, t) {
  if (e === null) return "";
  const o = new Date(e.includes("T") || e.endsWith("Z") ? e : e.replace(" ", "T") + "Z");
  if (Number.isNaN(o.getTime())) return e;
  const i = t === "en-US" ? "en-GB" : t, n = new Intl.DateTimeFormat(i, { weekday: "short", day: "numeric", month: "short" }).format(o).replace(",", ""), d = new Intl.DateTimeFormat(i, { hour: "2-digit", minute: "2-digit", hour12: !1 }).format(o);
  return `${n} · ${d}`;
}
const Je = (e, t) => `${new Intl.NumberFormat(t, { maximumFractionDigits: 1 }).format(e)} mm`, yo = (e, t) => `${new Intl.NumberFormat(t, { maximumFractionDigits: 1 }).format(e)} pt`, Fe = (e) => Array.isArray(e) && e.length === 3 && e.every((t) => typeof t == "number" && Number.isFinite(t)), ce = (e) => typeof e == "number" && Number.isFinite(e);
function pd(e) {
  if (typeof e != "object" || e === null) return null;
  const t = e, o = t.bounds;
  return typeof t.mesh != "string" || !Fe(t.normal) || !Fe(t.point) || !Fe(t.u) || !Fe(t.v) || o === void 0 || !ce(o.u0) || !ce(o.u1) || !ce(o.v0) || !ce(o.v1) ? null : {
    mesh: t.mesh,
    ...typeof t.meshName == "string" && t.meshName !== "" ? { meshName: t.meshName } : {},
    normal: t.normal,
    point: t.point,
    u: t.u,
    v: t.v,
    bounds: { u0: o.u0, u1: o.u1, v0: o.v0, v1: o.v1 }
  };
}
const co = { least: 0.5, most: 3, start: 1 }, uo = { least: 2, most: 12, start: 4 };
function wr(e) {
  if (typeof e != "object" || e === null) return null;
  const t = e, o = t.mode === "cut" ? "cut" : t.mode === "raised" ? "raised" : null;
  if (o === null) return null;
  const i = ce(t.depth) ? Math.min(co.most, Math.max(co.least, t.depth)) : co.start, n = ce(t.smallest) ? Math.min(uo.most, Math.max(uo.least, t.smallest)) : uo.start;
  return { mode: o, depth: i, smallest: n };
}
function md(e) {
  if (typeof e != "object" || e === null) return null;
  const t = e, o = t.bounds, i = t.size;
  if (typeof t.code != "string" || t.code === "" || typeof t.mesh != "string" || !Fe(t.normal) || !Fe(t.point) || !Fe(t.u) || !Fe(t.v) || o === void 0 || !ce(o.u0) || !ce(o.u1) || !ce(o.v0) || !ce(o.v1)) return null;
  const n = wr(t.relief), d = pd(t.preview);
  return {
    ...n === null ? {} : { relief: n },
    ...d === null ? {} : { preview: d },
    code: t.code,
    name: typeof t.name == "string" ? t.name : t.code,
    piece: t.piece === null || t.piece === void 0 || t.piece === "" ? null : String(t.piece),
    mesh: t.mesh,
    ...typeof t.meshName == "string" && t.meshName !== "" ? { meshName: t.meshName } : {},
    normal: t.normal,
    point: t.point,
    u: t.u,
    v: t.v,
    bounds: { u0: o.u0, u1: o.u1, v0: o.v0, v1: o.v1 },
    size: { w: ce(i?.w) ? i.w : 0, h: ce(i?.h) ? i.h : 0 }
  };
}
function kd(e) {
  let t = e;
  if (typeof e == "string")
    try {
      t = JSON.parse(e);
    } catch {
      return [];
    }
  return (Array.isArray(t) ? t : typeof t == "object" && t !== null && Array.isArray(t.faces) ? t.faces : []).map(md).filter((i) => i !== null);
}
const Ot = (e) => typeof e == "number" ? e : String(e ?? ""), xr = (e) => e == null || e === "" ? null : String(e);
function Nr(e) {
  const t = et(e);
  return ze(t) ? t : {};
}
function Sr(e) {
  const [t, o, i, n] = [q(e.x_mm), q(e.y_mm), q(e.w_mm), q(e.h_mm)];
  return i === null || n === null ? null : { x: t ?? 0, y: o ?? 0, w: i, h: n };
}
function yd(e) {
  const t = ["page", "piece", "kit", "printed"].find((o) => o === e.kind) ?? "piece";
  return {
    id: Ot(e.id),
    app: V(e.app),
    row: e,
    name: V(e.name) ?? "",
    kind: t,
    width: q(e.width_mm) ?? 0,
    height: q(e.height_mm) ?? 0,
    depth: q(e.depth_mm),
    corner: q(e.corner_mm) ?? 0,
    bleed: q(e.bleed_mm) ?? 0,
    safe: q(e.safe_mm),
    sides: Math.max(1, q(e.sides) ?? 1),
    material: V(e.material),
    thickness: q(e.thickness_mm),
    faces: kd(e.faces)
  };
}
function Pr(e, t) {
  return e == null || e === "" ? null : t[String(e)]?.code ?? null;
}
function vd(e, t, o) {
  const i = ["text", "picture", "colour", "choice", "shape"].find((l) => l === e.kind) ?? "shape", n = Nr(e.rules), d = Xi(e.value), s = i === "colour" || i === "choice" ? Hi(e.rules) : null;
  return {
    code: V(e.code) ?? "",
    name: V(e.name) ?? V(e.code) ?? "",
    kind: i,
    locked: me(e.locked) || i === "shape",
    required: me(e.required),
    side: e.side === "back" ? "back" : "front",
    layout: V(e.layout),
    box: Sr(e),
    text: i === "text" ? Zt(e.rules) : null,
    picture: i === "picture" ? Be(e.rules) : null,
    choices: s?.choices ?? (d?.choice === void 0 ? [] : [d.choice]),
    palette: s?.palette ?? null,
    shape: i === "shape" ? { ...Ji(e.rules), background: me(n.background) } : null,
    start: d,
    feature: Pr(e.feature_id, t),
    placeholder: V(n.placeholder) ?? "",
    upper: me(n.upper),
    fixed: d?.text ?? "",
    fromArea: !1,
    piece: xr(e.piece_id),
    face: o(e.area_id)
  };
}
function bd(e, t) {
  const o = e.takes, i = Nr(e.rules), n = o === "logo" ? null : Zt(e.rules);
  return n !== null && o === "both" && n.alsoLogo === null && (n.alsoLogo = Be({})), {
    code: V(e.code) ?? "",
    name: V(e.name) ?? V(e.code) ?? "",
    kind: o === "logo" ? "picture" : "text",
    locked: !1,
    required: me(e.required),
    side: e.side === "back" ? "back" : "front",
    layout: null,
    box: Sr(e),
    text: n,
    picture: o === "logo" ? Be(e.rules) : null,
    choices: [],
    palette: null,
    shape: null,
    start: null,
    feature: Pr(e.feature_id, t),
    placeholder: V(i.placeholder) ?? "",
    upper: me(i.upper),
    fixed: "",
    fromArea: !0,
    piece: xr(e.piece_id),
    face: V(e.face)
  };
}
function zi(e, t) {
  return Se(t.filter((o) => oe(o.palette_id, e.id))).map((o) => ({ code: V(o.code) ?? "", role: V(o.role), name: V(o.name) ?? V(o.code) ?? "", hex: V(o.hex) ?? "#000000" }));
}
function zd(e) {
  const t = et(e);
  return Array.isArray(t) ? t.filter(ze).map((o) => ({ key: V(o.key) ?? "", name: V(o.name) ?? V(o.key) ?? "" })).filter((o) => o.key !== "") : [];
}
function wd(e) {
  const t = et(e);
  return Array.isArray(t) ? t.filter((o) => typeof o == "string") : [];
}
function Eo(e, t, o) {
  const i = e.bases.find((f) => oe(f.id, t));
  if (i === void 0) return null;
  const n = yd(i), d = Object.fromEntries(e.features.map((f) => [String(f.id), { code: V(f.code) ?? "", name: V(f.name) ?? "" }])), s = {};
  for (const f of Se(e.palettes.filter((v) => v.ready_design_id === null || v.ready_design_id === void 0))) s[V(f.code) ?? ""] = zi(f, e.colours);
  const l = Object.fromEntries((s.finishes ?? []).map((f) => [f.code, f])), c = (f) => f == null ? null : V(e.areas.find((v) => oe(v.id, f))?.face), a = Se(e.ready.filter((f) => oe(f.base_id, n.id) && (o === void 0 || o.some((v) => oe(v, f.id))))).map((f) => {
    const v = Se(e.parts.filter((y) => oe(y.ready_design_id, f.id)));
    return {
      id: Ot(f.id),
      row: f,
      name: V(f.name) ?? "",
      picture: V(f.preview_url),
      tags: wd(f.tags),
      layouts: zd(f.layouts),
      palettes: Se(e.palettes.filter((y) => oe(y.ready_design_id, f.id))).map((y) => ({ id: Ot(y.id), code: V(y.code) ?? "", name: V(y.name) ?? "", colours: zi(y, e.colours) })),
      parts: v.map((y) => vd(y, d, c)),
      rows: v
    };
  }), h = Se(e.areas.filter((f) => oe(f.base_id, n.id))).map((f) => bd(f, d)), p = e.fonts.map((f) => ({ id: Ot(f.id), row: f, family: V(f.family) ?? "", name: V(f.name) ?? V(f.family) ?? "", smallest: q(f.smallest_mm) }));
  return { base: n, rows: e, ready: a, plain: h, fonts: p, shared: s, finishes: l, features: d };
}
const qe = (e, t) => t === null ? null : e.ready.find((o) => oe(o.id, t)) ?? null, Qt = (e, t) => t === null ? e.plain : t.parts, xd = (e, t) => t.layout ?? e?.layouts[0]?.key ?? null, Nd = (e, t) => Math.min(Math.max(1, t.sides ?? 1), e.base.sides);
function Pt(e, t, o) {
  const i = xd(t, o), n = Nd(e, o);
  return Qt(e, t).filter((d) => (d.side !== "back" || n >= 2) && (d.layout === null || i === null || d.layout === i));
}
function Cr(e, t) {
  return e === null || e.palettes.length === 0 ? null : e.palettes.find((o) => o.code === t.palette) ?? e.palettes[0];
}
function je(e, t) {
  return t == null ? null : /^#[0-9a-fA-F]{6}$/.test(t) ? t : e?.colours.find((o) => o.role === t || o.code === t)?.hex ?? null;
}
function ht(e, t, o) {
  const i = { parts: {} };
  return o !== void 0 && o >= 2 && e.base.sides >= 2 && (i.sides = 2), t !== null && t.layouts.length > 1 && (i.layout = t.layouts[0].key), t !== null && t.palettes.length > 1 && (i.palette = t.palettes[0].code), i;
}
const ue = (e, t) => e.parts[t.code] ?? t.start ?? {};
function Mr(e, t) {
  const o = e.parts[t.code];
  return o === void 0 ? null : o.mode ?? (o.file !== void 0 ? "logo" : "words");
}
function Sd(e, t, o, i) {
  const n = qe(e, t.ready_design_id);
  return {
    design: { format: 1, app: e.base.app, base_id: t.base_id, ready_design_id: t.ready_design_id, values: t.values },
    ready: n?.row ?? null,
    parts: n?.rows ?? [],
    base: e.base.row,
    areas: e.rows.areas,
    palettes: e.rows.palettes,
    features: e.rows.features,
    colours: e.rows.colours,
    files: o,
    settings: e.rows.settings?.[0] ?? {},
    ...i === void 0 ? {} : { measure: i }
  };
}
const Pd = (e, t, o, i) => ol(Sd(e, t, o, i));
function wi(e, t) {
  if (t.values.placed !== void 0) return t.values.placed.map((n) => n.kind === "text" ? (n.text ?? "").trim() : "").filter((n) => n !== "").join(" · ");
  const o = e === null ? [] : Pt(e, qe(e, t.ready_design_id), t.values);
  return (o.length === 0 ? Object.values(t.values.parts) : o.filter((n) => !n.locked && n.kind === "text").map((n) => t.values.parts[n.code] ?? {})).map((n) => (n.text ?? "").trim()).filter((n) => n !== "").join(" · ");
}
const vo = { paper: "#ffffff", ink: "#191920", accent: "#c0562f" }, Cd = ["#191920", "#4a4a54", "#8b8b96", "#ffffff", "#f2e9dc", "#c8a35a", "#0b7d59", "#1c59e0", "#4f46e5", "#9f1239", "#cf273c", "#b25e09"], Md = [400, 500, 600, 700, 800], mt = (e, t) => Math.round(e * Kt * 1.25 * Math.max(1, t) * 100) / 100;
function Ve(e, t, o) {
  const i = t ?? o;
  return /^#[0-9a-fA-F]{6}$/.test(i) ? i : e?.colours.find((n) => n.role === i || n.code === i)?.hex ?? vo[i] ?? vo.ink;
}
const Lr = (e, t) => (e.placed ?? []).filter((o) => o.side === t);
function kt(e) {
  if (e.kind !== "text") return { x: e.x, y: e.y, w: e.w, h: e.h };
  const t = Math.max(1, Ie(e.text).split(/\r?\n/).length);
  return { x: e.x, y: e.y, w: e.w, h: mt(e.size ?? 9, t) };
}
const pe = (e) => Math.round(e * 10) / 10 + 0;
function Ar(e, t) {
  const o = new Set((e.placed ?? []).map((i) => i.id));
  for (let i = 1; ; i += 1) if (!o.has(`${t}${String(i)}`)) return `${t}${String(i)}`;
}
function Ld(e, t, o, i, n, d, s) {
  const l = i.width / 85, c = Ar(t, e === "text" ? "t" : "s");
  if (e === "text") {
    const p = pe(45 * l), f = mt(9, 1);
    return { id: c, side: o, kind: e, name: d.text, x: pe((i.width - p) / 2), y: pe((i.height - f) / 2), w: p, h: f, text: s, font: n, size: 9, weight: 700, align: "start", colour: "ink" };
  }
  const [a, h] = e === "rect" ? [30 * l, 20 * l] : e === "ellipse" ? [22 * l, 22 * l] : [40 * l, 0.6];
  return { id: c, side: o, kind: e, name: d[e], x: pe((i.width - a) / 2), y: pe((i.height - h) / 2), w: pe(a), h: e === "line" ? 0.6 : pe(h), colour: e === "line" ? "ink" : "accent" };
}
function Ad(e, t, o, i, n, d) {
  const s = pe(Math.min(40 * (o.width / 85), o.width - 8)), l = pe(d === void 0 || !(d[0] > 0) ? s : s * d[1] / d[0]);
  return { id: Ar(e, "i"), side: t, kind: "image", name: n, x: pe((o.width - s) / 2), y: pe((o.height - l) / 2), w: s, h: l, file: i, fit: "inside" };
}
function Dd(e, t, o) {
  const i = [], n = /* @__PURE__ */ new Set(), d = (c) => {
    const a = n.has(c.code) ? `${c.code}-${c.side}` : c.code;
    return n.add(a), a.slice(0, 32);
  };
  for (const c of Pt(e, t, o)) {
    const a = c.box;
    if (a === null) continue;
    const h = ue(o, c), p = c.name.slice(0, 80);
    if (c.kind === "shape" && c.shape !== null) {
      i.push({ id: d(c), side: c.side, kind: c.shape.shape === "ellipse" || c.shape.shape === "ring" ? "ellipse" : "rect", name: p, ...a, ...c.shape.fill === null ? {} : { colour: c.shape.fill } });
      continue;
    }
    if (c.kind === "text" && c.text !== null && (h.mode ?? "words") === "words") {
      const v = Ie(h.text), y = c.locked ? c.fixed : v !== "" ? h.text ?? "" : c.required ? c.placeholder : "";
      if (Ie(y) === "") continue;
      const k = c.text, z = h.size ?? k.size, A = Math.max(1, y.split(/\r?\n/).length);
      i.push({ id: d(c), side: c.side, kind: "text", name: p, x: a.x, y: a.y, w: a.w, h: mt(z, A), text: c.upper ? y.toLocaleUpperCase() : y, font: h.font ?? k.font ?? k.fonts?.[0] ?? "Manrope", size: z, weight: k.weight, align: k.align, colour: h.colour ?? k.colour ?? "ink" });
      continue;
    }
    const f = c.picture ?? c.text?.alsoLogo ?? null;
    f !== null && h.file !== void 0 && i.push({ id: d(c), side: c.side, kind: "image", name: p, ...a, file: h.file, fit: h.fit === "fill" ? "fill" : h.fit === "inside" ? "inside" : f.fit });
  }
  const { layout: s, ...l } = o;
  return { ...l, parts: {}, placed: i };
}
function Td(e, t, o) {
  const i = o.placed ?? [], n = {};
  for (const l of Pt(e, t, { ...o })) {
    if (l.locked) continue;
    const c = i.find((a) => a.id === l.code || a.id === `${l.code}-${l.side}`);
    c !== void 0 && (l.kind === "text" && c.kind === "text" && c.text !== void 0 && Ie(c.text) !== l.placeholder ? n[l.code] = { text: c.text } : c.kind === "image" && c.file !== void 0 && (l.picture ?? l.text?.alsoLogo) !== null && (n[l.code] = { file: c.file, ...c.fit === void 0 ? {} : { fit: c.fit }, ...l.kind === "text" ? { mode: "logo" } : {} }));
  }
  const { placed: d, ...s } = o;
  return { ...s, parts: n };
}
function Fd(e, t, o, i) {
  return e.map((n) => {
    const d = kt(n);
    if (n.kind === "text") return { kind: "text", key: n.id, box: d, lines: (n.text ?? "").split(/\r?\n/), font: n.font ?? "Manrope", sizeMm: (n.size ?? 9) * Kt, weight: n.weight ?? 400, align: n.align ?? "start", colour: Ve(t, n.colour, "ink") };
    if (n.kind === "image") {
      const s = n.file === void 0 ? void 0 : o[n.file];
      return s?.url !== void 0 ? { kind: "image", key: n.id, box: d, href: s.url, fill: n.fit === "fill" } : { kind: "slot", key: n.id, box: d, slot: "logo", label: s === void 0 || s.name === "" ? i.image : s.name };
    }
    return { kind: "shape", key: n.id, box: d, shape: n.kind === "ellipse" ? "ellipse" : "rect", fill: Ve(t, n.colour, n.kind === "line" ? "ink" : "accent"), stroke: null, background: !1 };
  });
}
const bo = (e, t) => t.startsWith("en") ? e.charAt(0).toLocaleLowerCase(t) + e.slice(1) : e;
function xi(e, t) {
  const { t: o, look: i, locale: n } = e, d = e.parts.find((h) => h.code === t.part) ?? null, s = d?.name ?? "", l = d === null ? {} : ue(e.values, d), c = { part: d?.code ?? null, block: !0, fixes: [], kind: t.reason };
  switch (t.reason) {
    case "too-long": {
      const h = d?.text;
      if (h == null) break;
      const p = l.size ?? h.size, f = Yt(h, He(h, p) ? p : h.size), v = bt(l.text);
      if (No(l.text) > h.lines && v <= f)
        return { ...c, icon: "ruler", inline: o("editor.check.lines", "{n, plural, one {Only # line fits here.} other {Only # lines fit here.}}", { n: h.lines }), listed: o("editor.check.linesListed", "{part} has too many lines.", { part: s }) };
      const y = v - f, k = { label: o("editor.fix.shorten", "Shorten it"), value: { ...l, text: [...(l.text ?? "").trim()].slice(0, f).join("") } }, z = h.grows ? Qi(h, (l.text ?? "").trim(), p) : null, A = [k, ...z === null ? [] : [{ label: o("editor.fix.smaller", "Make it smaller"), value: { ...l, size: z } }]];
      if (i === "print") return { ...c, icon: "ruler", fixes: A, inline: o("editor.check.overPrint", "{n} over the limit. Shorten it.", { n: y }), listed: o("editor.check.overPrintListed", "{part} is {n, plural, one {# character} other {# characters}} over the limit.", { part: s, n: y }) };
      const g = h.unit === "pt" ? `${String(p)} pt` : Je(p, n), m = z === null ? o("editor.check.over", "{n, plural, one {# character over.} other {# characters over.}} At {size} this part fits {limit}.", { n: y, size: g, limit: f }) : o("editor.check.overGrows", "{n, plural, one {# character over.} other {# characters over.}} At {size} this part fits {limit}. Smaller letters fit more.", { n: y, size: g, limit: f });
      return { ...c, icon: "ruler", fixes: A, inline: m, listed: o("editor.check.overListed", "{part}: {n, plural, one {# character too long} other {# characters too long}}", { part: s, n: y }) };
    }
    case "required-empty": {
      if (d?.kind === "picture" || d?.kind === "text" && l.mode === "logo") {
        const h = d.picture?.picture === "photo", p = h ? o("editor.check.needPhoto", "Add a photo — this design needs one.") : o("editor.check.needLogo", "Add a logo — this design needs one.");
        return { ...c, icon: "alert", inline: p, listed: i === "print" ? h ? o("editor.check.needPhotoShort", "Add a photo.") : o("editor.check.needLogoShort", "Add a logo.") : o("editor.check.needed", "{part} is needed — it can’t be left empty", { part: s }) };
      }
      return i === "print" ? { ...c, icon: "alert", inline: o("editor.check.needWords", "Add your {part} — this design needs it.", { part: bo(s, n) }), listed: o("editor.check.needWordsShort", "Add your {part}.", { part: bo(s, n) }) } : { ...c, icon: "alert", inline: o("editor.check.neededField", "Add your words — this part is needed"), listed: o("editor.check.needed", "{part} is needed — it can’t be left empty", { part: s }) };
    }
    case "size-out-of-range": {
      const h = d?.text === null || d?.text === void 0 ? null : d.text.min, p = h === null ? o("editor.check.size", "That size isn’t one this part takes.") : o("editor.check.sizeFloor", "Letters under {size} won’t print cleanly", { size: Je(h, n) });
      return { ...c, icon: "ruler", inline: p, listed: d === null ? p : `${s}: ${p}` };
    }
    case "font-not-allowed":
    case "colour-not-allowed":
    case "choice-not-allowed":
    case "part-locked": {
      const h = o("editor.check.notOffered", "This choice isn’t one the shop offers here. Pick another.");
      return { ...c, icon: "alert", inline: h, listed: d === null ? h : `${s}: ${h}` };
    }
    case "file-missing":
      return { ...c, icon: "alert", inline: o("editor.check.fileMissing", "The file for this part didn’t arrive. Upload it again."), listed: o("editor.check.fileMissingListed", "{part}: upload the file again", { part: s }) };
    case "file-kind":
      return e.printed === !0 ? { ...c, icon: "alert", inline: o("editor.check.fileKindPrinted", "A raised logo has to be a drawing: send it as an SVG. A picture has no edges to raise."), listed: o("editor.check.fileKindPrintedListed", "{part}: send your logo as an SVG drawing", { part: s }) } : { ...c, icon: "alert", inline: o("editor.check.fileKind", "That kind of file can’t be used here."), listed: o("editor.check.fileKindListed", "{part}: that kind of file can’t be used here", { part: s }) };
  }
  const a = o("editor.check.unknown", "This design can’t be made as it is. Start again from the shop’s designs.");
  return { ...c, icon: "alert", inline: a, listed: a };
}
function jd(e, t) {
  const { t: o, locale: i, look: n } = e, d = e.parts.find((a) => a.code === t.part) ?? null, s = d?.name ?? "", l = d === null ? {} : ue(e.values, d), c = { part: d?.code ?? null, block: !1, fixes: [], kind: t.kind };
  switch (t.kind) {
    case "logo-small": {
      const a = o("editor.check.logoSmall", "Your logo will be {size} across — too small to read", { size: Je(t.acrossMm, i) });
      return { ...c, icon: "search", inline: a, listed: a };
    }
    case "blurry": {
      const h = d?.picture?.picture === "photo" ? o("editor.check.blurryPhoto", "Your photo may print blurry at this size — a bigger file will be sharper") : o("editor.check.blurry", "Your logo may print blurry at this size — a bigger file or an SVG will be sharper"), p = o("editor.check.blurryDetail", "{px} px is {dpi} dpi at {w} × {h} mm — we need {needs}.", { px: `${String(t.px[0])} × ${String(t.px[1])}`, dpi: t.dpi, w: t.boxMm[0], h: t.boxMm[1], needs: t.needs });
      return { ...c, icon: "image-off", inline: h, listed: h, detail: p };
    }
    case "fine-detail": {
      const a = o("editor.check.fine", "Some lines in your logo are too fine to engrave — they may disappear");
      return { ...c, icon: "scan", inline: a, listed: a };
    }
    case "hard-to-read": {
      const a = t.better, h = a === null ? null : e.palette?.colours.find((v) => v.role === a || v.code === a) ?? null, p = h === null || je(e.palette, a) === null ? [] : [{ label: o("editor.fix.use", "Use {colour}", { colour: bo(h.name, i) }), value: { ...l, colour: a } }], f = o("editor.check.hard", "Hard to read — the words are too close to the colour behind them.");
      return { ...c, icon: "contrast", fixes: p, inline: f, listed: `${s}: ${f}` };
    }
    case "past-safe-line": {
      const a = t.smaller === null ? [] : [{ label: o("editor.fix.smaller", "Make it smaller"), value: { ...l, size: t.smaller } }], h = t.smaller === null ? o("editor.check.safeShorten", "This runs past the safe line. Shorten it.") : o("editor.check.safe", "This runs past the safe line.");
      return { ...c, block: n === "print", icon: "ruler", fixes: a, inline: h, listed: o("editor.check.safeListed", "{part} runs past the safe line.", { part: s }) };
    }
  }
}
function Ed(e, t, o = null) {
  const i = (d) => {
    const s = t.parts.findIndex((l) => l.code === d.part);
    return s < 0 ? t.parts.length : s;
  }, n = [...e.refusals.map((d) => xi(t, d)), ...e.advice.map((d) => jd(t, d))];
  return o !== null && !e.refusals.some((d) => d.reason === o.reason && d.part === o.part) && n.unshift({ ...xi(t, o), kind: "refused" }), n.sort((d, s) => Number(s.block) - Number(d.block) || i(d) - i(s));
}
const Dr = Mn({ t: zr("en-US"), locale: "en-US", look: "maker", shop: "" }), Bo = Dr, R = () => Ln(Dr);
function Io(e, t, o) {
  const i = fd(e);
  return { t: zr(i), locale: i, look: t, shop: o };
}
function Oo() {
  const e = "(max-width: 899px)", t = () => typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia(e).matches, [o, i] = O(t);
  return J(() => {
    if (typeof window.matchMedia != "function") return;
    const n = window.matchMedia(e), d = () => i(n.matches);
    return n.addEventListener("change", d), () => n.removeEventListener("change", d);
  }, []), o;
}
const Bd = [
  { test: /walnut/i, face: "#6b4428", edge: "#3b2413", engraved: "#24130a" },
  { test: /ply|birch/i, face: "#d9b98a", edge: "#a8845a", engraved: "#6a4321" },
  { test: /slate/i, face: "#3b4248", edge: "#272c30", engraved: "#c3cacf" },
  { test: /oak/i, face: "#c9a26b", edge: "#9a7444", engraved: "#4a2f16" }
], Id = { face: "#e9e4da", edge: "#b9b2a5", engraved: "#3a3530" }, Od = { "paint-white": "#f3f1ea", "paint-black": "#15120e" };
function Gd(e) {
  return Bd.find((t) => t.test.test(e ?? "")) ?? Id;
}
const _d = "#191920", Vd = "#d0d0d6", $d = 0.82, qd = 1.25;
function Ni(e, t, o) {
  const i = (s) => [1, 3, 5].map((l) => parseInt(s.slice(l, l + 2), 16)), [n, d] = [i(e), i(t)];
  return `#${n.map((s, l) => Math.round(s + ((d[l] ?? 0) - s) * o).toString(16).padStart(2, "0")).join("")}`;
}
function Tr(e, t, o, i, n) {
  const d = n ? i === "center" ? "middle" : i === "end" ? "end" : "start" : "middle", s = d === "middle" ? t.x + t.w / 2 : d === "end" ? t.x + t.w : t.x, l = o * qd, c = n ? t.y : t.y + t.h / 2 - ((e.length - 1) * l + o) / 2;
  return { anchor: d, lines: e.map((a, h) => ({ text: a, x: s, y: c + o * $d + h * l })) };
}
function Me(e, t, o) {
  const i = o.side ?? "front", n = o.empty ?? "sample", d = o.holds ?? (() => !1), { base: s } = e, l = s.kind === "page", c = qe(e, t.ready_design_id), a = Cr(c, t.values), h = Pt(e, c, t.values), p = Gd(s.material), f = h.find((m) => m.kind === "colour"), v = f === void 0 ? void 0 : ue(t.values, f).choice ?? f.start?.choice, y = f === void 0 ? null : Object.values(e.shared).flat().find((m) => m.code === v) ?? null, k = o.on, z = {
    kind: l ? "page" : "piece",
    width: Math.max(k?.width ?? s.width, 1),
    height: Math.max(k?.height ?? s.height, 1),
    corner: l || k !== void 0 ? 0 : s.corner,
    bleed: l ? s.bleed : 0,
    safe: l ? s.safe : null,
    colour: l ? je(a, "paper") ?? "#ffffff" : y?.hex ?? p.face,
    edge: l ? Vd : y === null ? p.edge : Ni(y.hex, "#000000", 0.3)
  }, A = (m) => {
    const P = ue(t.values, m);
    if (l) return je(a, P.colour ?? m.text?.colour ?? "ink") ?? _d;
    if (y !== null) return Ni(y.hex, "#000000", 0.42);
    const x = P.finish ?? t.values.finish ?? m.text?.finish ?? m.picture?.finish ?? "engraved";
    return Od[x] ?? p.engraved;
  };
  if (l && t.values.placed !== void 0) return { side: i, face: z, items: Rd(Lr(t.values, i), a, o.labels, d) };
  const g = [];
  for (const m of h) {
    if (m.side !== i || m.box === null || m.kind === "colour" || k !== void 0 && !(k.face !== null && m.face === k.face || k.piece !== null && m.piece === k.piece)) continue;
    const P = m.box, x = ue(t.values, m), M = { key: `${m.code}-${m.side}`, code: m.code, box: P, live: !m.locked, locked: m.locked && !(m.shape?.background ?? !1) };
    if (m.kind === "shape" && m.shape !== null) {
      const D = m.shape.shape === "ellipse" || m.shape.shape === "ring" || m.shape.shape === "oval" ? "ellipse" : m.shape.shape === "door" ? "door" : "rect";
      g.push({ ...M, kind: "shape", shape: D, fill: l ? je(a, m.shape.fill) : null, stroke: l ? null : A(m), line: l ? 0 : D === "door" ? 0.8 : 1 });
      continue;
    }
    if (m.kind === "picture" && m.picture !== null) {
      const D = m.picture, b = D.picture === "photo" ? o.labels.photo : o.labels.logo;
      x.file !== void 0 && d(D.file) ? g.push(Si(M, x, D, l, A(m))) : g.push({ ...M, kind: "slot", label: x.file === void 0 ? b : `${b} ✓`, filled: x.file !== void 0, page: l });
      continue;
    }
    if (m.kind === "choice") {
      g.push({ ...M, kind: "choice", label: x.choice ?? m.start?.choice ?? "", colour: A(m) });
      continue;
    }
    if (m.kind !== "text" || m.text === null) continue;
    const L = m.text, B = Mr(t.values, m);
    if (B === "logo") {
      const D = L.alsoLogo;
      D !== null && x.file !== void 0 && d(D.file) ? g.push(Si(M, x, D, l, A(m))) : g.push({ ...M, kind: "slot", label: x.file === void 0 ? o.labels.logo : `${o.labels.logo} ✓`, filled: x.file !== void 0, page: l });
      continue;
    }
    const S = (x.text ?? "").trim(), F = S !== "" ? S : n === "hide" || m.fromArea && B === null && n !== "sample" ? "" : m.placeholder;
    if (F === "") {
      m.fromArea && n !== "hide" && g.push({ ...M, kind: "slot", label: m.name, filled: !1, page: l });
      continue;
    }
    const G = So(L, x.size ?? L.size) || P.h * 0.7, _ = Tr((m.upper ? F.toLocaleUpperCase() : F).split(/\r?\n/), P, G, L.align, l);
    g.push({ ...M, kind: "text", ..._, font: x.font ?? L.font ?? "Manrope", sizeMm: G, weight: L.weight, colour: A(m), dim: S === "" && n === "dim" });
  }
  return { side: i, face: z, items: g };
}
function Rd(e, t, o, i) {
  return e.map((n) => {
    const d = kt(n), s = { key: `${n.id}-${n.side}`, code: n.id, box: d, live: !1, locked: !1 };
    if (n.kind === "text") {
      const l = (n.size ?? 9) * Kt;
      return { ...s, kind: "text", ...Tr((n.text ?? "").split(/\r?\n/), d, l, n.align ?? "start", !0), font: n.font ?? "Manrope", sizeMm: l, weight: n.weight ?? 400, colour: Ve(t, n.colour, "ink"), dim: !1 };
    }
    return n.kind === "image" ? n.file !== void 0 && i(n.file) ? { ...s, kind: "picture", column: n.file, drawn: d, fill: n.fit === "fill", oneColour: !1, colour: "#000000", picture: "logo" } : { ...s, kind: "slot", label: o.image ?? o.logo, filled: n.file !== void 0, page: !0 } : { ...s, kind: "shape", shape: n.kind === "ellipse" ? "ellipse" : "rect", fill: Ve(t, n.colour, n.kind === "line" ? "ink" : "accent"), stroke: null, line: 0 };
  });
}
function Si(e, t, o, i, n) {
  const d = e.box, s = (t.scale ?? ft) / 100, [l, c] = [d.w * s, d.h * s], a = { x: d.x + (d.w - l) / 2 + (t.nx ?? 0), y: d.y + (d.h - c) / 2 + (t.ny ?? 0), w: l, h: c };
  return { ...e, kind: "picture", column: o.file, drawn: a, fill: (t.fit ?? o.fit) === "fill", oneColour: !i && o.colour === "one", colour: n, picture: o.picture, ...t.threshold === void 0 ? {} : { threshold: t.threshold } };
}
function Ud(e, t) {
  const o = e.kind === "page" && t ? e.bleed : 0;
  return { x: 0 - o, y: 0 - o, w: e.width + 2 * o, h: e.height + 2 * o };
}
const Wd = 10 * 1024 * 1024, Pi = 1024, Kd = 0.05, ho = { png: "image/png", jpeg: "image/jpeg", jpg: "image/jpeg", svg: "image/svg+xml", pdf: "application/pdf" }, Et = (e, t, o) => String.fromCharCode(...e.slice(t, t + o));
function Ci(e) {
  if (e.length >= 4 && e[0] === 137 && Et(e, 1, 3) === "PNG") return "png";
  if (e.length >= 3 && e[0] === 255 && e[1] === 216 && e[2] === 255) return "jpeg";
  if (Et(e, 0, 5) === "%PDF-") return "pdf";
  if (Et(e, 4, 4) === "ftyp" && ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"].includes(Et(e, 8, 4))) return "heic";
  const t = new TextDecoder("utf-8", { fatal: !1 }).decode(e).replace(/^﻿/, "");
  return /^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*(?:<!DOCTYPE[^>]*>\s*)?<svg[\s>/]/i.test(t) ? "svg" : "other";
}
function Go(e) {
  return typeof e.arrayBuffer == "function" ? e.arrayBuffer() : new Promise((t, o) => {
    const i = new FileReader();
    i.onload = () => t(i.result), i.onerror = () => o(i.error ?? new Error("unreadable")), i.readAsArrayBuffer(e);
  });
}
async function Mi(e) {
  return new Uint8Array(await Go(e.slice(0, 1024)));
}
function Zd(e, t) {
  return typeof FileReader > "u" ? Go(e) : new Promise((o, i) => {
    const n = new FileReader();
    n.onprogress = (d) => {
      d.lengthComputable && d.total > 0 && t(d.loaded / d.total);
    }, n.onload = () => {
      t(1), o(n.result);
    }, n.onerror = () => i(n.error ?? new Error("unreadable")), n.readAsArrayBuffer(e);
  });
}
function Yd(e) {
  const t = /\/MediaBox\s*\[\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\]/.exec(e);
  if (t === null) return null;
  const [o, i, n, d] = t.slice(1, 5).map(Number), [s, l] = [Math.abs(n - o), Math.abs(d - i)];
  return s > 0 && l > 0 ? [Math.round(s), Math.round(l)] : null;
}
function Hd(e, t, o) {
  const i = new Uint8Array(t * o);
  for (let n = 0; n < t * o; n += 1) {
    const [d, s, l, c] = [e[n * 4], e[n * 4 + 1], e[n * 4 + 2], e[n * 4 + 3] / 255], a = 0.2126 * d + 0.7152 * s + 0.0722 * l;
    i[n] = Math.round(a * c + 255 * (1 - c));
  }
  return { data: i, width: t, height: o };
}
const Fr = (e, t) => e / 255 * 100 < t;
function Jd(e, t) {
  const { data: o, width: i, height: n } = e, d = new Uint8Array(i * n);
  let s = 0;
  for (let p = 0; p < d.length; p += 1)
    Fr(o[p], t) && (d[p] = 1, s += 1);
  if (s === 0) return;
  const l = new Float32Array(i * n).fill(Number.POSITIVE_INFINITY), c = (p, f) => {
    const v = new Uint8Array(i * n);
    for (let y = 0; y < n; y += 1)
      for (let k = 0; k < i; k += 1) {
        const z = y * i + k;
        if (d[z] === 0 || v[z] === 1) continue;
        let [A, g] = [k, y];
        for (; A - p >= 0 && A - p < i && g - f >= 0 && g - f < n && d[(g - f) * i + (A - p)] === 1; ) [A, g] = [A - p, g - f];
        const m = [];
        for (let [x, M] = [A, g]; x >= 0 && x < i && M >= 0 && M < n && d[M * i + x] === 1; x += p, M += f) m.push(M * i + x);
        const P = m.length;
        for (const x of m)
          v[x] = 1, P < l[x] && (l[x] = P);
      }
  };
  c(1, 0), c(0, 1);
  const a = new Float32Array(s);
  for (let p = 0, f = 0; p < l.length; p += 1) d[p] === 1 && (a[f++] = l[p]);
  return a.sort(), a[Math.min(a.length - 1, Math.floor(a.length * Kd))] / i;
}
function Xd(e) {
  return typeof Image > "u" || typeof URL.createObjectURL != "function" ? Promise.resolve(null) : new Promise((t) => {
    const o = URL.createObjectURL(e), i = new Image(), n = (s) => {
      clearTimeout(d), URL.revokeObjectURL(o), t(s);
    }, d = setTimeout(() => n(null), 4e3);
    i.onload = () => n(i), i.onerror = () => n(null), i.src = o;
  });
}
function jr(e, t) {
  if (typeof document > "u") return null;
  const o = document.createElement("canvas");
  o.width = e, o.height = t;
  let i = null;
  try {
    i = o.getContext("2d", { willReadFrequently: !0 });
  } catch {
    i = null;
  }
  return i === null ? null : { canvas: o, context: i };
}
async function Li(e, t) {
  if (t === "pdf") {
    const h = Yd(new TextDecoder("latin1").decode(new Uint8Array(await Go(e.slice(0, 262144)))));
    return h === null ? {} : { px: h };
  }
  const o = await Xd(e);
  if (o === null) return {};
  const [i, n] = [o.naturalWidth || o.width, o.naturalHeight || o.height];
  if (!(i > 0) || !(n > 0)) return {};
  const d = [i, n], s = t === "svg" ? Pi / Math.max(i, n) : Math.min(1, Pi / Math.max(i, n)), [l, c] = [Math.max(1, Math.round(i * s)), Math.max(1, Math.round(n * s))], a = jr(l, c);
  if (a === null) return { px: d };
  try {
    return a.context.drawImage(o, 0, 0, l, c), { px: d, light: Hd(a.context.getImageData(0, 0, l, c).data, l, c) };
  } catch {
    return { px: d };
  }
}
async function Qd(e, t, o) {
  const i = jr(e.width, e.height);
  if (i === null || typeof URL.createObjectURL != "function") return null;
  const [n, d, s] = [1, 3, 5].map((c) => parseInt(o.slice(c, c + 2), 16)), l = i.context.createImageData(e.width, e.height);
  for (let c = 0; c < e.data.length; c += 1)
    Fr(e.data[c], t) && l.data.set([n, d, s, 255], c * 4);
  return i.context.putImageData(l, 0, 0), new Promise((c) => {
    try {
      i.canvas.toBlob((a) => c(a === null ? null : URL.createObjectURL(a)), "image/png");
    } catch {
      c(null);
    }
  });
}
const _o = ["svg", "pdf", "png", "jpeg"], Er = ["png", "jpeg"], $t = { logo_file: _o, photo_file: Er }, es = (e, t) => e.map((o) => o === "jpg" ? "jpeg" : o).filter((o, i, n) => n.indexOf(o) === i && ($t[t] ?? _o).includes(o)), Ai = (e, t) => e.length === t.length && e.every((o) => t.includes(o === "jpg" ? "jpeg" : o)), Xe = "10 MB";
function Br(e, t) {
  return Ai(t, _o) ? e("editor.upload.kindLogo", "That isn’t an SVG, PDF, PNG or JPEG") : Ai(t, Er) ? e("editor.upload.kindPhoto", "That isn’t a PNG or JPEG") : e("editor.upload.kindOther", "That kind of file can’t be used here.");
}
function ts(e, t, o, i) {
  const { code: n, params: d, message: s } = typeof t == "object" && t !== null ? t : {}, l = d?.reason;
  if (n === "PUBLIC_UPLOAD_REFUSED") {
    if (l === "too-big") return { text: e("editor.upload.big", "That file is over {size}", { size: Xe }) };
    if (l === "kind" && i === "svg" && typeof s == "string" && s.includes("SVG"))
      return { text: e("editor.upload.svgCleaned", "This SVG holds something we can’t print from. Save it as a plain SVG and upload it again."), detail: s.replace(/\s*Save it as a plain SVG( and upload it again)?\.?\s*$/, "") };
    if (l === "kind") return { text: Br(e, o) };
    if (l === "cap") return { text: e("editor.upload.cap", "You’ve sent as many files as we take in a day. Try again tomorrow.") };
    if (l === "quota") return { text: e("editor.upload.quota", "We can’t take files just now. Try again later.") };
  }
  return n === "PUBLIC_RATE_LIMITED" ? { text: e("editor.error.rate", "Too many tries. Wait a minute and try again.") } : { text: e("editor.upload.failed", "That file couldn’t be sent. Try again.") };
}
const yt = (e, t) => e?.threshold ?? t;
function os(e, t, o) {
  const [i, n] = O({}), [d, s] = O({}), [l, c] = O({}), a = Q(/* @__PURE__ */ new Set()), h = Q(/* @__PURE__ */ new Map()), p = Q(/* @__PURE__ */ new Set()), f = (g) => {
    if (typeof URL.createObjectURL != "function") return;
    const m = URL.createObjectURL(g);
    return a.current.add(m), m;
  }, v = (g) => {
    g === void 0 || !a.current.has(g) || (a.current.delete(g), URL.revokeObjectURL?.(g));
  };
  J(() => () => a.current.forEach((g) => URL.revokeObjectURL?.(g)), []);
  const y = xo((g, m) => {
    n((P) => {
      v(P[g]?.url);
      const x = { ...P };
      return m === null ? delete x[g] : x[g] = m, x;
    });
    for (const P of h.current.keys()) P.startsWith(`${g}:`) && h.current.delete(P);
  }, []), k = (g, m) => c((P) => {
    const x = { ...P };
    return m === null ? delete x[g] : x[g] = m, x;
  }), z = (g, m) => s((P) => {
    const x = { ...P };
    return m === null ? delete x[g] : x[g] = m, x;
  }), A = async (g, m, P) => {
    k(g, null);
    const x = Ci(await Mi(m)), M = P.map((L) => L === "jpg" ? "jpeg" : L);
    if (x === "heic")
      return k(g, { text: o("editor.upload.heic", "That photo is in HEIC, which we can’t print from. Save it as JPEG or PNG and upload it again.") }), null;
    if (x === "other" || !M.includes(x))
      return k(g, { text: Br(o, P) }), null;
    if (m.size > Wd)
      return k(g, { text: o("editor.upload.big", "That file is over {size}", { size: Xe }) }), null;
    if (e.upload === null)
      return k(g, { text: o("editor.upload.off", "This shop doesn’t take files here yet.") }), null;
    z(g, { name: m.name, share: 0 });
    try {
      const L = await Zd(m, (_) => z(g, { name: m.name, share: _ }));
      z(g, { name: m.name, share: null });
      const B = await e.upload(g, m, m.name, t?.session ?? null), S = new Blob([L], { type: ho[x] ?? "" }), F = await Li(S, x), G = { id: B.id, name: B.name, size: B.size, kind: x, fresh: !0, ...x === "pdf" ? {} : { url: f(S) }, ...F };
      return y(g, G), G;
    } catch (L) {
      return k(g, ts(o, L, P, x)), null;
    } finally {
      z(g, null);
    }
  };
  return J(() => {
    if (!(t === null || t.session === null))
      for (const g of _e) {
        const m = t.files[g], P = i[g];
        m === void 0 || P !== void 0 && (P.fresh || P.kind !== "svg") && P.id === m || p.current.has(`${String(t.id)}:${m}`) || (p.current.add(`${String(t.id)}:${m}`), e.file(t, g).then(async (x) => {
          if (x === null) return;
          const M = Ci(await Mi(x));
          if (M === "other" || M === "heic") return;
          const L = await Li(x, M);
          n((B) => {
            const S = B[g];
            return S !== void 0 && S.fresh ? B : (v(S?.url), { ...B, [g]: { id: m, name: S?.name ?? "", size: x.size, kind: M, fresh: !1, ...M === "pdf" ? {} : { url: f(x) }, ...L } });
          });
          for (const B of h.current.keys()) B.startsWith(`${g}:`) && h.current.delete(B);
        }));
      }
  }, [e, t]), {
    pictures: i,
    transfers: d,
    problems: l,
    send: A,
    fresh: () => Object.fromEntries(Object.entries(i).filter(([, g]) => g.fresh).map(([g, m]) => [g, m.id])),
    saved: (g) => {
      n((m) => Object.fromEntries(Object.entries(m).map(([P, x]) => [P, { ...x, fresh: !1, id: g.files[P] ?? x.id }])));
      for (const m of _e) i[m]?.kind === "svg" && p.current.delete(`${String(g.id)}:${g.files[m] ?? ""}`);
    },
    facts: (g, m, P) => _e.flatMap((x) => {
      const M = i[x];
      if (M === void 0)
        return g[x] === void 0 ? [] : [{ column: x, kind: ho[P[x]?.[0] ?? "png"] ?? "image/png", size: 1 }];
      const L = { column: x, kind: ho[M.kind] ?? M.kind, size: M.size, ...M.px === void 0 ? {} : { px: M.px } }, B = m[x];
      if (M.light === void 0 || B === void 0) return [L];
      const S = `${x}:${String(B)}`;
      h.current.has(S) || h.current.set(S, Jd(M.light, B));
      const F = h.current.get(S);
      return [F === void 0 ? L : { ...L, thinnest: F }];
    })
  };
}
function qt(e, t, o) {
  const [i, n] = O(null), d = e?.light;
  return J(() => {
    if (d === void 0) {
      n(null);
      return;
    }
    let s = null, l = !0;
    const c = setTimeout(() => {
      Qd(d, t, o).then((a) => {
        if (!l) {
          a !== null && URL.revokeObjectURL?.(a);
          return;
        }
        s = a, n(a);
      });
    }, 60);
    return () => {
      l = !1, clearTimeout(c), s !== null && URL.revokeObjectURL?.(s);
    };
  }, [d, t, o]), i;
}
const fo = /* @__PURE__ */ new Map();
let be = { text: "", node: null };
function Ee(e) {
  const t = `"${e.replace(/["\\]/g, "")}"`, o = e.toLowerCase(), i = o.includes("mono") ? "ui-monospace, monospace" : /caveat|script|hand/.test(o) ? "cursive" : /garamond|baskerville|serif|slab/.test(o) && !/sans/.test(o) ? "ui-serif, serif" : "ui-sans-serif, system-ui, sans-serif";
  return `${t}, ${i}`;
}
function is() {
  typeof document > "u" || ((be.node === null || !document.head.contains(be.node)) && (be.node = document.createElement("style"), be.node.setAttribute("data-customiser-fonts", ""), document.head.append(be.node)), be.node.textContent = be.text);
}
function rs(e) {
  let t = fo.get(e);
  return t === void 0 && (t = fo.size, fo.set(e, t), be = { ...be, text: `${be.text}.cz .cz-font-${String(t)}{font-family:${Ee(e)}}
` }, is()), `cz-font-${String(t)}`;
}
const Di = /* @__PURE__ */ new Set();
async function ns(e, t) {
  if (!(typeof FontFace > "u" || typeof document > "u" || !("fonts" in document)))
    for (const o of t) {
      if (Di.has(o.family)) continue;
      Di.add(o.family);
      const i = await e.fontUrl(o.row).catch(() => null);
      if (i !== null)
        try {
          const n = new FontFace(o.family, `url(${JSON.stringify(i)}) format("woff2")`);
          document.fonts.add(await n.load());
        } catch {
        }
    }
}
function Ir() {
  if (typeof document > "u") return;
  let e = null;
  try {
    e = document.createElement("canvas").getContext("2d");
  } catch {
    e = null;
  }
  if (e === null || typeof e.measureText != "function") return;
  const t = e;
  return (o, i, n, d) => (t.font = `${String(d)} ${String(n * 100)}px ${Ee(i)}`, t.measureText(o).width / 100);
}
const Ti = "#cf273c", ls = "#1c59e0";
function ae({ catalogue: e, design: t, side: o = "front", guides: i = !1, empty: n = "sample", onPart: d, selected: s = null, lockShown: l = null, onLock: c, label: a, className: h, pictures: p, startThreshold: f = 50, on: v, place: y, outlineUrl: k }) {
  const { t: z, look: A } = R(), g = Me(e, t, {
    side: o,
    empty: n,
    ...v === void 0 ? {} : { on: v },
    labels: { logo: z("editor.drawing.logo", "Your logo"), photo: z("editor.drawing.photo", "Your photo"), image: z("editor.full.image", "Image") },
    holds: (S) => p?.[S] !== void 0
  }), { face: m } = g, P = m.kind === "page", x = Ud(m, i), M = `${String(x.x - 0.6)} ${String(x.y - 0.6)} ${String(x.w + 1.2)} ${String(x.h + 1.2)}`, L = `cz-clip-${String(e.base.id)}-${o}-${i ? "g" : "p"}${v === void 0 ? "" : `-${v.face ?? ""}-${v.piece ?? ""}`}`, B = g.items.map((S) => {
    const F = ds(S, P, p, `${L}-${S.code}`, f), G = s === S.code, _ = (b) => {
      (b.key === "Enter" || b.key === " ") && (b.preventDefault(), d?.(S.code));
    }, { box: D } = S;
    return d === void 0 ? /* @__PURE__ */ r("g", { children: F }, S.key) : S.live ? /* @__PURE__ */ u("g", { role: "button", tabIndex: 0, "aria-label": z("editor.drawing.edit", "Edit {name}", { name: Fi(e, t, S.code) }), className: "cz-part", onClick: () => d(S.code), onKeyDown: _, onFocus: () => c?.(null), children: [
      /* @__PURE__ */ r("rect", { x: D.x - 0.6, y: D.y - 0.6, width: D.w + 1.2, height: D.h + 1.2, fill: "transparent", className: G ? "cz-part-on" : "cz-part-ring" }),
      F
    ] }, S.key) : S.locked ? /* @__PURE__ */ u(
      "g",
      {
        className: "cz-part-locked",
        ...A === "print" ? { role: "img", tabIndex: 0, "aria-label": z("editor.drawing.locked", "{name} — the shop’s part. It stays as it is.", { name: Fi(e, t, S.code) }), onFocus: () => c?.(S.code), onBlur: () => c?.(null) } : { "aria-hidden": !0 },
        onMouseEnter: () => c?.(S.code),
        onMouseLeave: () => c?.(null),
        children: [
          /* @__PURE__ */ r("rect", { x: D.x - 0.6, y: D.y - 0.6, width: D.w + 1.2, height: D.h + 1.2, fill: "transparent", className: l === S.code ? "cz-part-lock-on" : "" }),
          F,
          l === S.code ? /* @__PURE__ */ r("foreignObject", { x: D.x + D.w - 5, y: D.y - 2.5, width: 5, height: 5, children: /* @__PURE__ */ r("span", { className: "cz-lock-badge", children: /* @__PURE__ */ r(xt, { "aria-hidden": "true" }) }) }) : null
        ]
      },
      S.key
    ) : /* @__PURE__ */ r("g", { children: F }, S.key);
  });
  return /* @__PURE__ */ u("svg", { direction: "ltr", className: h ?? "cz-drawing", viewBox: M, role: d === void 0 ? "img" : "group", "aria-label": a, ...a === void 0 ? { "aria-hidden": !0 } : {}, ...y === void 0 ? {} : { x: y.x, y: y.y, width: y.w, height: y.h }, preserveAspectRatio: "xMidYMid meet", children: [
    /* @__PURE__ */ r("defs", { children: /* @__PURE__ */ r("clipPath", { id: L, children: /* @__PURE__ */ r("rect", { x: x.x, y: x.y, width: x.w, height: x.h, rx: P ? 0 : m.corner }) }) }),
    P && i ? /* @__PURE__ */ r("rect", { x: x.x, y: x.y, width: x.w, height: x.h, fill: Ti, fillOpacity: 0.16 }) : null,
    /* @__PURE__ */ r("rect", { x: 0, y: 0, width: m.width, height: m.height, rx: m.corner, fill: m.colour, stroke: m.edge, strokeWidth: P ? 0.2 : 0.6 }),
    k == null ? null : /* @__PURE__ */ r("image", { href: k, x: 0, y: 0, width: m.width, height: m.height, preserveAspectRatio: "none", opacity: 0.7 }),
    /* @__PURE__ */ r("g", { clipPath: `url(#${L})`, children: B }),
    P && i ? /* @__PURE__ */ u("g", { fill: "none", pointerEvents: "none", children: [
      /* @__PURE__ */ r("rect", { x: 0, y: 0, width: m.width, height: m.height, stroke: Ti, strokeWidth: 0.3 }),
      m.safe !== null ? /* @__PURE__ */ r("rect", { x: m.safe, y: m.safe, width: m.width - 2 * m.safe, height: m.height - 2 * m.safe, stroke: ls, strokeWidth: 0.3, strokeDasharray: "1 0.8" }) : null
    ] }) : null
  ] });
}
function Fi(e, t, o) {
  return Qt(e, qe(e, t.ready_design_id)).find((i) => i.code === o)?.name ?? o;
}
function ds(e, t, o, i, n) {
  const { box: d } = e;
  if (e.kind === "text")
    return /* @__PURE__ */ r("text", { fontFamily: Ee(e.font), fontSize: e.sizeMm, fontWeight: e.weight, fill: e.colour, textAnchor: e.anchor, opacity: e.dim ? 0.4 : 1, children: e.lines.map((c, a) => /* @__PURE__ */ r("tspan", { x: c.x, y: c.y, children: c.text }, String(a))) });
  if (e.kind === "slot") return /* @__PURE__ */ r(zo, { box: d, text: e.label, page: e.page, filled: e.filled });
  if (e.kind === "picture") {
    const c = o?.[e.column];
    return c === void 0 ? /* @__PURE__ */ r(zo, { box: e.drawn, text: "", page: t, filled: !0 }) : /* @__PURE__ */ r(ss, { item: e, picture: c, clip: i, startThreshold: n, page: t });
  }
  if (e.kind === "choice")
    return /* @__PURE__ */ u("g", { children: [
      /* @__PURE__ */ r("rect", { x: d.x + d.w * 0.2, y: d.y + d.h * 0.2, width: d.w * 0.6, height: d.h * 0.6, rx: Math.min(d.w, d.h) * 0.12, fill: "none", stroke: e.colour, strokeWidth: 0.8 }),
      /* @__PURE__ */ r("text", { x: d.x + d.w / 2, y: d.y + d.h / 2, fontSize: Math.min(d.h * 0.14, 4), fill: e.colour, textAnchor: "middle", dominantBaseline: "middle", fontFamily: Ee("Manrope"), children: e.label })
    ] });
  const s = e.fill ?? "none", l = e.stroke ?? "none";
  return e.shape === "ellipse" ? /* @__PURE__ */ r("ellipse", { cx: d.x + d.w / 2, cy: d.y + d.h / 2, rx: d.w / 2 - e.line / 2, ry: d.h / 2 - e.line / 2, fill: s, stroke: l, strokeWidth: e.line }) : e.shape === "door" ? /* @__PURE__ */ u("g", { fill: "none", stroke: l, strokeWidth: e.line, children: [
    /* @__PURE__ */ r("rect", { x: d.x, y: d.y, width: d.w, height: d.h }),
    /* @__PURE__ */ r("rect", { x: d.x + d.w * 0.15, y: d.y + d.h * 0.1, width: d.w * 0.7, height: d.h * 0.35 }),
    /* @__PURE__ */ r("rect", { x: d.x + d.w * 0.15, y: d.y + d.h * 0.52, width: d.w * 0.7, height: d.h * 0.38 })
  ] }) : /* @__PURE__ */ r("rect", { x: d.x, y: d.y, width: d.w, height: d.h, fill: s, stroke: l, strokeWidth: e.line });
}
function zo({ box: e, text: t, page: o, filled: i = !1 }) {
  const n = o ? "#3a3a44" : "#2a2018";
  return /* @__PURE__ */ u("g", { children: [
    /* @__PURE__ */ r("rect", { x: e.x, y: e.y, width: e.w, height: e.h, fill: i ? "#ffffff" : "none", fillOpacity: i ? 0.35 : 0, stroke: n, strokeOpacity: 0.5, strokeWidth: 0.35, strokeDasharray: "1.2 0.9" }),
    /* @__PURE__ */ r("text", { x: e.x + e.w / 2, y: e.y + e.h / 2, fontSize: Math.max(1.6, Math.min(e.h * 0.16, 3.4)), fill: n, fillOpacity: 0.75, textAnchor: "middle", dominantBaseline: "middle", fontFamily: Ee("Manrope"), children: t })
  ] });
}
function ss({ item: e, picture: t, clip: o, startThreshold: i, page: n }) {
  const d = qt(e.oneColour ? t : void 0, yt(e, i), e.colour), { box: s, drawn: l } = e;
  return t.url === void 0 ? /* @__PURE__ */ r(zo, { box: l, text: t.name === "" ? t.kind.toUpperCase() : t.name, page: n, filled: !0 }) : /* @__PURE__ */ u("g", { children: [
    e.fill ? /* @__PURE__ */ r("defs", { children: /* @__PURE__ */ r("clipPath", { id: o, children: /* @__PURE__ */ r("rect", { x: s.x, y: s.y, width: s.w, height: s.h }) }) }) : null,
    /* @__PURE__ */ r("image", { href: e.oneColour ? d ?? t.url : t.url, x: l.x, y: l.y, width: l.w, height: l.h, preserveAspectRatio: e.fill ? "xMidYMid slice" : "xMidYMid meet", ...e.fill ? { clipPath: `url(#${o})` } : {}, opacity: e.oneColour && d === null ? 0.85 : 1 })
  ] });
}
const Pe = (e) => `cz-f-${e}`;
function Or(e, t) {
  const o = e.text, i = t.size ?? o.size, n = Yt(o, He(o, i) ? i : o.size), d = bt(t.text);
  return { count: d, limit: n, state: d > n ? "over" : n - d <= 3 ? "near" : "ok" };
}
function Ce({ icon: e }) {
  return e === "ruler" ? /* @__PURE__ */ r(Lo, { "aria-hidden": "true" }) : e === "search" ? /* @__PURE__ */ r(pr, { "aria-hidden": "true" }) : e === "scan" ? /* @__PURE__ */ r(Ao, { "aria-hidden": "true" }) : e === "image-off" ? /* @__PURE__ */ r(hr, { "aria-hidden": "true" }) : e === "contrast" ? /* @__PURE__ */ r(Po, { "aria-hidden": "true" }) : /* @__PURE__ */ r(Jt, { "aria-hidden": "true" });
}
const as = Do;
function Vo({ hex: e, size: t = 20 }) {
  return /* @__PURE__ */ r("svg", { className: "cz-swatch", width: t, height: t, viewBox: "0 0 20 20", "aria-hidden": "true", children: /* @__PURE__ */ r("circle", { cx: "10", cy: "10", r: "9.25", fill: e, stroke: "rgba(0,0,0,.15)", strokeWidth: "1" }) });
}
function $o(e) {
  const t = e.picture ?? e.text?.alsoLogo;
  return es(t?.accept ?? ["svg", "pdf", "png", "jpeg"], t?.file ?? "logo_file");
}
function Gr(e, t, o) {
  const i = Q(null), [n, d] = O(!1), s = { svg: ".svg,image/svg+xml", pdf: ".pdf,application/pdf", png: ".png,image/png", jpeg: ".jpg,.jpeg,image/jpeg", jpg: ".jpg,.jpeg,image/jpeg" };
  return { element: /* @__PURE__ */ r(
    "input",
    {
      ref: i,
      type: "file",
      className: "cz-hidden-file",
      tabIndex: -1,
      "aria-hidden": "true",
      accept: $o(e).map((a) => s[a] ?? `.${a}`).join(","),
      onChange: (a) => {
        const h = a.target.files?.[0];
        a.target.value = "", h !== void 0 && o(e, t, h);
      }
    }
  ), pick: () => i.current?.click(), drop: {
    onDragOver: (a) => {
      a.preventDefault(), d(!0);
    },
    onDragLeave: () => d(!1),
    onDrop: (a) => {
      a.preventDefault(), d(!1);
      const h = a.dataTransfer?.files?.[0];
      h !== void 0 && o(e, t, h);
    }
  }, over: n };
}
function qo(e, t) {
  const o = e.size >= 1048576 ? `${(e.size / 1048576).toFixed(1)} MB` : `${String(Math.max(1, Math.round(e.size / 1024)))} KB`, i = e.kind === "jpeg" ? "JPEG" : e.kind.toUpperCase();
  if (!t) return `${i} · ${o}`;
  const n = e.kind === "svg" || e.kind === "pdf" || e.px === void 0 ? null : `${String(e.px[0])} × ${String(e.px[1])} px`;
  return [i, n, o].filter((d) => d !== null).join(" · ");
}
function Ro({ transfer: e, label: t }) {
  const { t: o } = R(), i = e.share === null ? null : Math.round(e.share * 100);
  return /* @__PURE__ */ u("div", { role: "progressbar", "aria-label": t, "aria-valuemin": 0, "aria-valuemax": 100, ...i === null ? { "aria-valuetext": o("editor.upload.sending", "Sending") } : { "aria-valuenow": i }, className: "cz-transfer", children: [
    /* @__PURE__ */ u("span", { className: "cz-transfer-line", children: [
      /* @__PURE__ */ r("span", { className: "cz-mono cz-strong cz-transfer-name", children: e.name }),
      /* @__PURE__ */ r("span", { className: "cz-mono cz-transfer-pct", children: i === null ? o("editor.upload.sending", "Sending") : `${String(i)}%` })
    ] }),
    /* @__PURE__ */ r("span", { className: i === null ? "cz-transfer-track cz-transfer-waiting" : "cz-transfer-track", children: /* @__PURE__ */ r("svg", { className: "cz-transfer-fill", viewBox: "0 0 100 6", preserveAspectRatio: "none", "aria-hidden": "true", children: /* @__PURE__ */ r("rect", { x: "0", y: "0", width: i === null ? 100 : i, height: "6" }) }) })
  ] });
}
function Uo(e) {
  return e.rows.pieces.filter((t) => t.base_id === void 0 || String(t.base_id) === String(e.base.id)).map((t) => ({ id: String(t.id), code: V(t.code) ?? "", name: V(t.name) ?? "", width: Math.max(q(t.width_mm) ?? 0, 1), height: Math.max(q(t.height_mm) ?? 0, 1), file: t.file, position: q(t.position) ?? 0 })).sort((t, o) => t.position - o.position || t.code.localeCompare(o.code)).map(({ position: t, ...o }) => o);
}
const cs = (e) => ({ piece: e.id, face: null, width: e.width, height: e.height });
function _r(e, t) {
  const o = e.piece === null ? void 0 : t.find((i) => i.id === e.piece);
  return { piece: e.piece, face: e.code, width: o?.width ?? Math.max(e.size.w, 1), height: o?.height ?? Math.max(e.size.h, 1) };
}
function Vr(e, t) {
  const o = /* @__PURE__ */ new Set();
  for (const i of t) {
    i.piece !== null && o.add(i.piece);
    const n = i.face === null ? void 0 : e.base.faces.find((d) => d.code === i.face);
    n?.piece !== null && n?.piece !== void 0 && o.add(n.piece);
  }
  return o;
}
function us(e, t = 470, o = 10) {
  let [i, n, d, s] = [0, 0, 0, 0];
  const l = [];
  for (const c of e)
    i > 0 && i + c.width > t && (i = 0, n += d + o, d = 0), l.push({ ...c, x: i, y: n }), i += c.width + o, s = Math.max(s, i - o), d = Math.max(d, c.height);
  return { placed: l, width: Math.max(s, 1), height: Math.max(n + d, 1) };
}
const hs = (e, t) => Math.min(12, t / Math.max(e.face.width, e.face.height)), fs = { start: "left", middle: "center", end: "right" };
function gs(e, t, o) {
  const i = e.width > 0 && e.height > 0 ? e.width / e.height : 1, n = t.w / t.h < i, d = o === n ? t.h * i : t.w, s = o === n ? t.h : t.w / i;
  return { x: t.x + (t.w - d) / 2, y: t.y + (t.h - s) / 2, w: d, h: s };
}
function ps(e, t, o, i = {}) {
  const { face: n } = t, [d, s] = [n.width * o, n.height * o];
  e.save(), e.beginPath(), n.kind === "page" ? e.rect(0, 0, d, s) : e.roundRect(0, 0, d, s, n.corner * o), e.fillStyle = n.colour, e.fill(), e.clip();
  for (const l of t.items) ms(e, l, o, i);
  e.restore(), n.kind === "piece" && (e.beginPath(), e.roundRect(0, 0, d, s, n.corner * o), e.strokeStyle = n.edge, e.lineWidth = Math.max(1, 0.6 * o), e.stroke());
}
function ms(e, t, o, i) {
  const n = { x: t.box.x * o, y: t.box.y * o, w: t.box.w * o, h: t.box.h * o };
  if (e.save(), t.kind === "text") {
    e.globalAlpha = t.dim ? 0.4 : 1, e.font = `${String(t.weight)} ${String(t.sizeMm * o)}px ${Ee(t.font)}`, e.fillStyle = t.colour, e.textAlign = fs[t.anchor], e.textBaseline = "alphabetic";
    for (const d of t.lines) e.fillText(d.text, d.x * o, d.y * o);
  } else if (t.kind === "slot") {
    const d = t.page ? "#3a3a44" : "#2a2018";
    e.setLineDash([1.2 * o, 0.9 * o]), e.strokeStyle = d, e.globalAlpha = 0.5, e.lineWidth = 0.35 * o, e.beginPath(), e.rect(n.x, n.y, n.w, n.h), e.stroke(), e.setLineDash([]), e.globalAlpha = 0.75, e.fillStyle = d, e.font = `600 ${String(Math.max(1.6, Math.min(t.box.h * 0.16, 3.4)) * o)}px ${Ee("Manrope")}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(t.label, n.x + n.w / 2, n.y + n.h / 2);
  } else if (t.kind === "picture") {
    const d = i[t.column];
    if (d !== void 0) {
      const s = { x: t.drawn.x * o, y: t.drawn.y * o, w: t.drawn.w * o, h: t.drawn.h * o };
      t.fill && (e.beginPath(), e.rect(n.x, n.y, n.w, n.h), e.clip());
      const l = gs(d, s, t.fill);
      e.drawImage(d.image, l.x, l.y, l.w, l.h);
    }
  } else if (t.kind === "choice")
    e.strokeStyle = t.colour, e.lineWidth = 0.8 * o, e.beginPath(), e.roundRect(n.x + n.w * 0.2, n.y + n.h * 0.2, n.w * 0.6, n.h * 0.6, Math.min(n.w, n.h) * 0.12), e.stroke(), e.fillStyle = t.colour, e.font = `400 ${String(Math.min(t.box.h * 0.14, 4) * o)}px ${Ee("Manrope")}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(t.label, n.x + n.w / 2, n.y + n.h / 2);
  else {
    e.lineWidth = t.line * o;
    const d = (s, l, c, a) => {
      e.beginPath(), t.shape === "ellipse" ? e.ellipse(s + c / 2, l + a / 2, Math.max(0, c / 2 - t.line * o / 2), Math.max(0, a / 2 - t.line * o / 2), 0, 0, Math.PI * 2) : e.rect(s, l, c, a), t.fill !== null && (e.fillStyle = t.fill, e.fill()), t.stroke !== null && (e.strokeStyle = t.stroke, e.stroke());
    };
    d(n.x, n.y, n.w, n.h), t.shape === "door" && (d(n.x + n.w * 0.15, n.y + n.h * 0.1, n.w * 0.7, n.h * 0.35), d(n.x + n.w * 0.15, n.y + n.h * 0.52, n.w * 0.7, n.h * 0.38));
  }
  e.restore();
}
let go = null;
function Wo() {
  return go ??= import("./stage3d.js").catch((e) => {
    throw go = null, e;
  }), go;
}
let dt = null;
function Qe() {
  if (dt !== null) return dt;
  if (typeof document > "u") return !1;
  try {
    const e = document.createElement("canvas"), t = e.getContext("webgl2") ?? e.getContext("webgl");
    dt = t !== null && typeof t.getParameter == "function";
  } catch {
    dt = !1;
  }
  return dt;
}
const ks = () => typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, ji = /* @__PURE__ */ new Map();
function ys(e, t) {
  let o = ji.get(e);
  return o === void 0 && (o = Promise.all([t(), Wo()]).then(([i, n]) => i === null ? null : n.readSvg(i)).catch(() => null), ji.set(e, o)), o;
}
const Ei = /* @__PURE__ */ new Map();
function vs(e) {
  let t = Ei.get(e);
  return t === void 0 && (t = new Promise((o) => {
    if (typeof Image > "u") return o(null);
    const i = new Image();
    i.onload = () => o({ image: i, width: i.naturalWidth || i.width, height: i.naturalHeight || i.height }), i.onerror = () => o(null), i.src = e;
  }), Ei.set(e, t)), t;
}
const bs = 1024;
function Ko(e, t) {
  if (typeof document > "u") return null;
  const o = hs(e, bs), i = document.createElement("canvas");
  i.width = Math.max(1, Math.round(e.face.width * o)), i.height = Math.max(1, Math.round(e.face.height * o));
  let n = null;
  try {
    n = i.getContext("2d");
  } catch {
    n = null;
  }
  return n === null || typeof n.fillText != "function" ? null : (ps(n, { ...e, face: { ...e.face, kind: "page" } }, o, t), i);
}
const zs = (e) => ({ ...e, items: e.items.filter((t) => (t.kind !== "text" || t.dim) && t.kind !== "picture") });
function $r(e, t) {
  const o = e.items.flatMap((i) => i.kind === "text" && !i.dim ? [{ ...i, colour: "#ffffff" }] : i.kind === "picture" ? [i] : []);
  return Ko({ ...e, items: o, face: { ...e.face, colour: "transparent" } }, t);
}
function ws(e, t, o, i, n) {
  return {
    width: e.face.width,
    height: e.face.height,
    corner: e.face.corner,
    thickness: o ?? 4,
    outline: t,
    face: e.face.colour,
    edge: e.face.edge,
    top: Ko(n === void 0 ? e : zs(e), i),
    ...n === void 0 ? {} : { relief: { ...n, mask: $r(e, i) } }
  };
}
const po = /* @__PURE__ */ new Map();
function xs(e, t) {
  let o = po.get(e);
  return o === void 0 && (o = t().catch(() => null), po.set(e, o), o.then((i) => {
    i === null && po.delete(e);
  })), o;
}
function Ns(e, t) {
  return Ko({ ...e, face: { ...e.face, colour: "transparent" } }, t);
}
function qr(e, t, o, i = {}, n) {
  const [d, s] = O(null), { painted: l, fontsIn: c } = Zo(i);
  J(() => {
    if (o === null) return;
    let v = !0;
    return ys(o.key, o.text).then((y) => {
      v && s({ key: o.key, svg: y });
    }), () => {
      v = !1;
    };
  }, [o?.key]);
  const a = e === null ? "" : JSON.stringify(e), h = o === null || d?.key === o.key, p = o === null ? null : d?.svg ?? null, f = n === void 0 ? "" : `${n.mode}:${String(n.depth)}`;
  return le(() => e === null || !h ? null : ws(e, p, t, l, n), [a, h, p, t, l, c, f]);
}
function Zo(e) {
  const [t, o] = O({}), [i, n] = O(0), d = JSON.stringify(e);
  return J(() => {
    let s = !0;
    const l = Object.entries(e);
    return Promise.all(l.map(async ([c, a]) => [c, await vs(a)])).then((c) => {
      s && o(Object.fromEntries(c.filter((a) => a[1] !== null)));
    }), () => {
      s = !1;
    };
  }, [d]), J(() => {
    const s = typeof document > "u" ? void 0 : document.fonts;
    let l = !0;
    return s?.ready?.then(() => {
      l && n((c) => c + 1);
    }), () => {
      l = !1;
    };
  }, []), { painted: t, fontsIn: i };
}
const Rr = 0.6, Ur = 2.2, Ze = 80, Ss = 4, Ps = {
  piece: { rx: 36, ry: -20 },
  kit: { rx: 12, ry: -30 },
  printed: { rx: 30, ry: -18 }
}, $e = (e) => ({ ...Ps[e], zoom: 1 }), Wr = (e, t, o) => Math.max(t, Math.min(o, e)), Cs = (e, t, o) => ({ ...e, ry: e.ry + t, rx: Wr(e.rx + o, -Ze, Ze) }), Gt = (e, t) => ({ ...e, zoom: Wr(Math.round(e.zoom * t * 100) / 100, Rr, Ur) }), Ms = (e) => `${String(Math.round(e.zoom * 100))}%`, Kr = [
  { name: "left", dx: -15, dy: 0 },
  { name: "right", dx: 15, dy: 0 },
  { name: "up", dx: 0, dy: 12 },
  { name: "down", dx: 0, dy: -12 }
], Zr = 1.12, Yr = 0.89, Ls = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
function As(e, t) {
  const o = Ls[e];
  if (o !== void 0) {
    if (t) return null;
    const i = Kr.find((n) => n.name === o);
    return { kind: "turn", dx: i.dx, dy: i.dy };
  }
  return e === "+" || e === "=" ? { kind: "zoom", factor: Zr } : e === "-" ? { kind: "zoom", factor: Yr } : e === "0" ? { kind: "reset" } : null;
}
function Bi(e, t, o) {
  return t.kind === "turn" ? Cs(e, t.dx, t.dy) : t.kind === "zoom" ? Gt(e, t.factor) : $e(o);
}
const Ds = (e) => e < 0 ? 1.08 : 0.93;
class Ts {
  pointers = /* @__PURE__ */ new Map();
  drag = null;
  pinch = null;
  /** Whether two pointers were down at once since the last time none was: no tap then. */
  multi = !1;
  /** Whether a one-pointer drag is turning the piece. */
  dragging = !1;
  down(t, o, i, n, d) {
    this.pointers.set(t, { x: o, y: i, touch: n }), this.pointers.size === 1 ? this.drag = { x: o, y: i, view: d } : (this.multi = !0, this.drag = null, this.dragging = !1, this.pinch = null);
  }
  move(t, o, i, n, d) {
    const s = this.pointers.get(t);
    if (s === void 0) return {};
    if (this.pointers.set(t, { ...s, x: o, y: i }), this.pointers.size === 2) {
      const [v, y] = [...this.pointers.values()], k = Math.hypot(v.x - y.x, v.y - y.y), z = (v.y + y.y) / 2;
      if (this.pinch === null || this.pinch.distance <= 0)
        return this.pinch = { distance: k, middleY: z, view: n }, {};
      const A = Math.max(Rr, Math.min(Ur, this.pinch.view.zoom * k / this.pinch.distance)), g = d ? this.pinch.view.rx : Math.max(-Ze, Math.min(Ze, this.pinch.view.rx - (z - this.pinch.middleY) * 0.4));
      return { view: { ...n, zoom: A, rx: g } };
    }
    const l = this.drag;
    if (l === null || this.pointers.size !== 1 || d) return {};
    const [c, a] = [o - l.x, i - l.y];
    let h = !1;
    if (!this.dragging) {
      if (Math.hypot(c, a) <= Ss) return {};
      this.dragging = !0, h = !0;
    }
    const p = l.view.ry + c * 0.5, f = s.touch ? l.view.rx : Math.max(-Ze, Math.min(Ze, l.view.rx - a * 0.4));
    return { view: { ...n, rx: f, ry: p }, capture: h };
  }
  /** A pointer lifted: whether it was a tap (one pointer that never dragged). */
  up(t) {
    const i = this.pointers.has(t) && this.pointers.size === 1 && !this.dragging && !this.multi;
    return this.pointers.delete(t), this.pointers.size < 2 && (this.pinch = null), this.pointers.size === 0 && (this.drag = null, this.dragging = !1, this.multi = !1), { tap: i };
  }
}
function Fs({ model: e, view: t, className: o, stageRef: i, onFail: n, onDrawn: d, load: s = Wo }) {
  const l = Q(null), c = Q(null), [a, h] = O(null), p = Q(n);
  p.current = n;
  const f = Q(d);
  return f.current = d, J(() => {
    let v = !0, y = null, k = null;
    return s().then((z) => {
      if (!v || c.current === null) return;
      y = z.makeStage(void 0, c.current);
      const A = () => {
        const g = l.current?.getBoundingClientRect();
        g !== void 0 && g.width > 0 && g.height > 0 && y?.resize(Math.round(g.width), Math.round(g.height));
      };
      A(), typeof ResizeObserver < "u" && l.current !== null && (k = new ResizeObserver(A), k.observe(l.current)), i !== void 0 && (i.current = y), h(y);
    }).catch(() => {
      v && p.current?.();
    }), () => {
      v = !1, k?.disconnect(), y?.dispose(), i !== void 0 && (i.current = null);
    };
  }, []), J(() => {
    if (!(a === null || e === null))
      try {
        a.setModel(e).then(
          () => f.current?.(a),
          () => p.current?.()
        );
      } catch {
        p.current?.();
      }
  }, [a, e]), J(() => {
    a?.setView(t);
  }, [a, t]), /* @__PURE__ */ r("div", { ref: l, className: o, "data-model-view": "", children: /* @__PURE__ */ r("canvas", { ref: c, "aria-hidden": "true" }) });
}
const Bt = /* @__PURE__ */ new Map();
function Yo({ model: e, view: t, width: o, height: i, cacheKey: n, alt: d, className: s, fallback: l, load: c = Wo }) {
  const [a, h] = O(() => Qe() ? Bt.get(n) ?? null : null);
  return J(() => {
    if (e === null || !Qe()) return;
    const p = Bt.get(n);
    if (p !== void 0) {
      h(p);
      return;
    }
    let f = !0;
    return c().then(async (v) => {
      const y = await v.still(e, t, o, i);
      Bt.set(n, y), f && h(y);
    }).catch(() => Bt.set(n, null)), () => {
      f = !1;
    };
  }, [e, t, o, i, n, c]), a === null ? l : /* @__PURE__ */ r("img", { src: a, alt: d, className: s, width: o, height: i });
}
function Hr({ sheet: e, thickness: t, outline: o, pictures: i, relief: n, kind: d = "piece", width: s, height: l, alt: c, className: a, fallback: h }) {
  const p = Qe(), f = qr(p ? e : null, t, p ? o : null, i, n), v = `${o?.key ?? "plain"}|${String(t)}|${String(s)}x${String(l)}|${JSON.stringify(e)}|${JSON.stringify(i ?? {})}|${JSON.stringify(n ?? null)}`;
  return /* @__PURE__ */ r(Yo, { model: f, view: d === "printed" ? Es : js, width: s, height: l, cacheKey: v, alt: c, ...a === void 0 ? {} : { className: a }, fallback: h });
}
const js = $e("piece"), Es = $e("printed");
function Bs(e) {
  const [t, o] = O(null);
  return J(() => {
    if (e === null) return;
    let i = !0;
    return xs(e.key, e.read).then((n) => {
      i && o({ key: e.key, bytes: n });
    }), () => {
      i = !1;
    };
  }, [e?.key]), e === null || t === null || t.key !== e.key ? null : t.bytes ?? !1;
}
function Jr(e, t, o, i) {
  const n = Bs(e);
  return { model: le(() => e === null || n === null || n === !1 ? null : { kind: "model", file: e.kind, key: e.key, bytes: n, decals: t }, [e?.key, e?.kind, n, t, o, i]), unreadable: n === !1 };
}
function Xr(e, t, o, i) {
  const { painted: n, fontsIn: d } = Zo(i.pictures), s = t === null ? "" : JSON.stringify(t.values) + String(t.ready_design_id), l = le(() => {
    if (t === null) return [];
    const c = Uo(e);
    return e.base.faces.map((a) => {
      const h = _r(a, c), p = Me(e, t, { on: h, empty: i.empty, labels: i.labels, holds: i.holds });
      return { code: a.code, plane: a, canvas: Ns(p, n), width: h.width, height: h.height };
    });
  }, [e, s, n, d, i.empty]);
  return Jr(o, l);
}
const mo = 9;
function Qr({ catalogue: e, design: t, pieces: o, outlines: i = {}, only: n, highlight: d = null, label: s, className: l, ...c }) {
  const a = n === void 0 ? o : o.filter((f) => n.has(f.id)), h = us(a, 470, 10 + mo), p = `-4 ${String(-mo - 2)} ${String(h.width + 8)} ${String(h.height + mo + 6)}`;
  return /* @__PURE__ */ r("svg", { direction: "ltr", className: l ?? "cz-drawing", viewBox: p, role: "group", "aria-label": s, preserveAspectRatio: "xMidYMid meet", "data-kit-pieces": "", children: h.placed.map((f) => {
    const v = f.id === d, y = `${f.code} · ${f.name}`;
    return /* @__PURE__ */ u("g", { children: [
      /* @__PURE__ */ r("text", { x: f.x, y: f.y - 2.4, fontSize: 5.6, fontWeight: v ? 800 : 700, className: v ? "cz-piece-tag cz-on" : "cz-piece-tag", fill: v ? "#1c59e0" : "#3b2a18", children: v ? y : f.code }),
      /* @__PURE__ */ r(ae, { ...c, catalogue: e, design: t, on: cs(f), place: { x: f.x, y: f.y, w: f.width, h: f.height }, outlineUrl: i[f.id] ?? null, label: y }),
      v ? /* @__PURE__ */ r("rect", { x: f.x - 1.2, y: f.y - 1.2, width: f.width + 2.4, height: f.height + 2.4, rx: 1.5, fill: "none", strokeWidth: 1.4, stroke: "#1c59e0", className: "cz-piece-ring", pointerEvents: "none" }) : null
    ] }, f.id);
  }) });
}
const Is = { left: zt, right: lr, up: dr, down: nr };
function Ho(e, t) {
  const o = t.base.row.outline_file;
  if (typeof o != "string" || o === "" || e.outlineUrl === void 0) return null;
  const i = e.outlineUrl;
  return {
    key: `${String(t.base.id)}:${o}`,
    text: async () => {
      const n = await i(t.base.row);
      if (n === null) return null;
      const d = await fetch(n);
      return d.ok ? await d.text() : null;
    }
  };
}
function Jo(e, t, o, i) {
  const n = Me(e, t, { empty: "hide", labels: { logo: "", photo: "" }, holds: (p) => o[p] !== void 0 }), d = (p) => n.items.find((f) => f.kind === "picture" && f.column === p), s = d("logo_file"), l = d("photo_file"), c = qt(s?.oneColour === !0 ? o.logo_file : void 0, yt(s, i), s?.colour ?? "#000000"), a = qt(l?.oneColour === !0 ? o.photo_file : void 0, yt(l, i), l?.colour ?? "#000000"), h = {};
  for (const [p, f, v] of [
    ["logo_file", s, c],
    ["photo_file", l, a]
  ]) {
    const y = f?.oneColour === !0 ? v : o[p]?.url;
    f !== void 0 && y !== void 0 && y !== null && (h[p] = y);
  }
  return h;
}
function Rt(e) {
  const { t } = R(), { catalogue: o, design: i, pictures: n, startThreshold: d, narrow: s } = e, [l, c] = O(() => !Qe()), a = e.kind ?? "piece", [h, p] = O(() => ks()), [f, v] = O(() => $e(a)), [y, k] = O(!1), z = h || l || e.forceFlat === !0, A = Q(null), g = Q(null), m = Q(null), P = Q(new Ts()), x = Q(f);
  x.current = f;
  const M = le(
    () => Me(o, i, { empty: "dim", labels: { logo: t("editor.drawing.logo", "Your logo"), photo: t("editor.drawing.photo", "Your photo") }, holds: (I) => n[I] !== void 0 }),
    [o, i, n, t]
  ), L = Jo(o, i, n, d), B = le(() => Ho(e.api, o), [e.api, o]), S = qr(z || e.model !== void 0 ? null : M, o.base.thickness, B, L, e.relief), F = e.model !== void 0 ? e.model : S;
  J(() => {
    const I = A.current;
    if (I === null) return;
    const W = (ie) => {
      ie.preventDefault(), v((ne) => Gt(ne, Ds(ie.deltaY)));
    };
    return I.addEventListener("wheel", W, { passive: !1 }), () => I.removeEventListener("wheel", W);
  }, []), J(() => {
    g.current !== null && (g.current.style.transform = f.zoom === 1 ? "" : `scale(${String(f.zoom)})`);
  }, [f.zoom, z]);
  const G = (I) => {
    P.current.down(I.pointerId, I.clientX, I.clientY, I.pointerType === "touch", x.current);
  }, _ = (I) => {
    const W = P.current.move(I.pointerId, I.clientX, I.clientY, x.current, z);
    if (W.capture === !0) {
      try {
        I.currentTarget.setPointerCapture(I.pointerId);
      } catch {
      }
      k(!0);
    }
    W.view !== void 0 && v(W.view);
  }, D = (I, W) => {
    const { tap: ie } = P.current.up(I.pointerId);
    if (P.current.dragging || k(!1), !ie || W || z || m.current === null) return;
    const ne = A.current?.getBoundingClientRect();
    if (ne === void 0 || ne.width <= 0 || ne.height <= 0) return;
    const [Le, Re] = [(I.clientX - ne.left) / ne.width, (I.clientY - ne.top) / ne.height];
    if (e.pickPart !== void 0) {
      const re = e.pickPart(m.current, Le, Re);
      re !== null && e.onPart(re);
      return;
    }
    const he = m.current.pick(Le, Re);
    if (he === null) return;
    const Oe = [...M.items].reverse().find((re) => re.live && he.x >= re.box.x && he.x <= re.box.x + re.box.w && he.y >= re.box.y && he.y <= re.box.y + re.box.h);
    Oe !== void 0 && e.onPart(Oe.code);
  }, b = (I) => {
    if (I.target !== I.currentTarget) return;
    const W = As(I.key, z);
    W !== null && (I.preventDefault(), v((ie) => Bi(ie, W, a)));
  }, N = xo(() => c(!0), []), $ = z ? t("editor.stage.label", "{product}, {design}. Shown flat.", { product: e.product, design: e.designName }) : t("editor.stage.label3d", "{product}, {design}. Use the arrow keys to turn it, plus and minus to zoom, 0 to reset.", { product: e.product, design: e.designName });
  return /* @__PURE__ */ u(ee, { children: [
    /* @__PURE__ */ u(
      "div",
      {
        ref: A,
        className: `cz-stage cz-stage-3d${z ? " cz-stage-flat" : y ? " cz-grabbing" : ""}`,
        tabIndex: 0,
        role: "group",
        "aria-roledescription": t("editor.stage.roledescription", "3D preview"),
        "aria-label": $,
        onPointerDown: G,
        onPointerMove: _,
        onPointerUp: (I) => D(I, !1),
        onPointerCancel: (I) => D(I, !0),
        onKeyDown: b,
        children: [
          z ? /* @__PURE__ */ r("div", { ref: g, className: "cz-flat-box", children: e.flat }) : /* @__PURE__ */ r(Fs, { model: F, view: f, className: "cz-model", stageRef: m, onFail: N }),
          /* @__PURE__ */ u("span", { className: "cz-stage-labels", children: [
            /* @__PURE__ */ r("span", { className: "cz-mono cz-stage-label", children: e.size }),
            e.material === null ? null : /* @__PURE__ */ r("span", { className: "cz-stage-label", children: e.material })
          ] }),
          z || F === null ? null : /* @__PURE__ */ u("span", { className: "cz-stage-hint", children: [
            /* @__PURE__ */ r(Wl, { "aria-hidden": "true" }),
            s ? t("editor.stage.hintPhone", "Drag to turn · pinch to zoom") : t("editor.stage.hint", "Drag to turn · scroll to zoom")
          ] })
        ]
      }
    ),
    /* @__PURE__ */ u("div", { className: "cz-stage-bar", children: [
      /* @__PURE__ */ u(
        "button",
        {
          type: "button",
          role: "switch",
          "aria-checked": h || l,
          "aria-disabled": l,
          className: l ? "cz-flat-switch cz-locked" : "cz-flat-switch",
          onClick: () => {
            l || p((I) => !I);
          },
          children: [
            /* @__PURE__ */ r("span", { className: h || l ? "cz-switch-track cz-on" : "cz-switch-track", "aria-hidden": "true", children: /* @__PURE__ */ r("span", { className: "cz-switch-knob" }) }),
            t("editor.stage.seeFlat", "See it flat")
          ]
        }
      ),
      e.modes,
      /* @__PURE__ */ u("div", { className: "cz-stage-tools", children: [
        z ? null : /* @__PURE__ */ r("div", { role: "group", "aria-label": t("editor.stage.turn", "Turn the piece"), className: "cz-tool-group", children: Kr.map((I) => {
          const W = Is[I.name], ie = Os(t, I.name);
          return /* @__PURE__ */ r("button", { type: "button", className: "cz-tool-button", "aria-label": ie, title: ie, onClick: () => v((ne) => Bi(ne, { kind: "turn", dx: I.dx, dy: I.dy }, a)), children: /* @__PURE__ */ r(W, { "aria-hidden": "true" }) }, I.name);
        }) }),
        /* @__PURE__ */ u("div", { role: "group", "aria-label": t("editor.stage.zoom", "Zoom"), className: "cz-tool-group", children: [
          /* @__PURE__ */ r("button", { type: "button", className: "cz-tool-button", "aria-label": t("editor.stage.zoomOut", "Zoom out"), onClick: () => v((I) => Gt(I, Yr)), children: /* @__PURE__ */ r(Fo, { "aria-hidden": "true" }) }),
          /* @__PURE__ */ r("span", { className: "cz-mono cz-tool-label", children: Ms(f) }),
          /* @__PURE__ */ r("button", { type: "button", className: "cz-tool-button", "aria-label": t("editor.stage.zoomIn", "Zoom in"), onClick: () => v((I) => Gt(I, Zr)), children: /* @__PURE__ */ r(To, { "aria-hidden": "true" }) })
        ] }),
        /* @__PURE__ */ u("button", { type: "button", className: "cz-reset", onClick: () => v($e(a)), children: [
          /* @__PURE__ */ r(Xl, { "aria-hidden": "true" }),
          t("editor.stage.reset", "Reset the view")
        ] })
      ] })
    ] }),
    l ? /* @__PURE__ */ u("div", { role: "status", className: "cz-note", children: [
      /* @__PURE__ */ r(Ll, { "aria-hidden": "true" }),
      /* @__PURE__ */ r("span", { children: t("editor.stage.no3d", "This device can’t show the 3D view, so you’re seeing each piece flat. It’s the same design we’ll cut.") })
    ] }) : null
  ] });
}
function Os(e, t) {
  return t === "left" ? e("editor.stage.turnLeft", "Turn left") : t === "right" ? e("editor.stage.turnRight", "Turn right") : t === "up" ? e("editor.stage.turnUp", "Turn up") : e("editor.stage.turnDown", "Turn down");
}
function eo(e, t) {
  const o = t.base.row.model_file;
  if (typeof o != "string" || o === "" || e.modelUrl === void 0) return null;
  const i = e.modelUrl;
  return {
    key: `${String(t.base.id)}:${o}`,
    kind: "glb",
    read: async () => {
      const n = await i(t.base.row);
      if (n === null) return null;
      const d = await fetch(n);
      return d.ok ? await d.arrayBuffer() : null;
    }
  };
}
function Gs(e, t) {
  const [o, i] = O({}), n = t.rows.pieces;
  return J(() => {
    const d = e?.pieceUrl;
    if (d === void 0) return;
    let s = !0;
    return Promise.all(n.map(async (l) => [String(l.id), await d(l).catch(() => null)])).then((l) => {
      s && i(Object.fromEntries(l.filter((c) => c[1] !== null)));
    }), () => {
      s = !1;
    };
  }, [e, n]), o;
}
function _s(e, t) {
  return t === void 0 ? null : t.piece ?? e.base.faces.find((o) => o.code === t.face)?.piece ?? null;
}
function Vs(e) {
  const { t } = R(), { api: o, catalogue: i, design: n, pictures: d, startThreshold: s } = e, [l, c] = O("assembled"), a = le(() => Uo(i), [i]), h = Gs(o, i), p = le(() => eo(o, i), [o, i]), f = Jo(i, n, d, s), v = { logo: t("editor.drawing.logo", "Your logo"), photo: t("editor.drawing.photo", "Your photo") }, y = (M) => d[M] !== void 0, { model: k, unreadable: z } = Xr(i, l === "assembled" && p !== null ? n : null, l === "assembled" ? p : null, { empty: "dim", labels: v, pictures: f, holds: y }), A = Qt(i, qe(i, n.ready_design_id)), g = Vr(i, A), m = _s(i, A.find((M) => M.code === e.selected)) ?? a.find((M) => g.has(M.id))?.id ?? null, P = (M, L, B) => {
    const S = M.pickDecal(L, B), F = S === null ? void 0 : i.base.faces.find((b) => b.code === S.code);
    if (S === null || F === void 0) return null;
    const G = Me(i, n, { on: _r(F, a), empty: "dim", labels: v, holds: y }), { x: _, y: D } = S.point;
    return [...G.items].reverse().find((b) => b.live && _ >= b.box.x && _ <= b.box.x + b.box.w && D >= b.box.y && D <= b.box.y + b.box.h)?.code ?? null;
  }, x = (M) => /* @__PURE__ */ r(
    Qr,
    {
      catalogue: i,
      design: n,
      pieces: a,
      outlines: h,
      ...M === void 0 ? {} : { only: M },
      highlight: m,
      pictures: d,
      startThreshold: s,
      empty: "dim",
      onPart: e.onPart,
      selected: e.selected,
      lockShown: e.lockShown,
      onLock: e.onLock,
      label: e.product
    }
  );
  return /* @__PURE__ */ r(
    Rt,
    {
      ...e,
      kind: "kit",
      model: p === null || z ? null : k,
      forceFlat: l === "pieces" || p === null || z,
      pickPart: P,
      flat: x(l === "pieces" ? void 0 : g),
      modes: /* @__PURE__ */ r("div", { role: "radiogroup", "aria-label": t("editor.stage.kitModes", "How to show the kit"), className: "cz-seg", children: ["assembled", "pieces"].map((M) => /* @__PURE__ */ r("button", { type: "button", role: "radio", "aria-checked": l === M, className: l === M ? "cz-on" : "", onClick: () => c(M), children: M === "assembled" ? t("editor.stage.assembled", "Assembled") : t("editor.stage.pieces3d", "Pieces") }, M)) })
    }
  );
}
function $s({ api: e, catalogue: t, design: o, width: i, height: n, className: d, fallback: s }) {
  const { t: l } = R(), c = Qe(), a = le(() => c ? eo(e, t) : null, [e, t, c]), h = { logo: l("editor.drawing.logo", "Your logo"), photo: l("editor.drawing.photo", "Your photo") }, { model: p } = Xr(t, a === null ? null : o, a, { empty: "sample", labels: h, pictures: qs, holds: () => !1 });
  return a === null ? s : /* @__PURE__ */ r(Yo, { model: p, view: Rs, width: i, height: n, cacheKey: `kit|${a.key}|${JSON.stringify(o.values)}|${String(o.ready_design_id)}`, alt: "", ...d === void 0 ? {} : { className: d }, fallback: s });
}
const qs = {}, Rs = $e("kit");
function Xo(e, t) {
  if (t?.relief !== void 0) return { mode: t.relief.mode, depth: t.relief.depth };
  for (const o of e.rows.areas) {
    if (t !== void 0 && o.face !== t.code) continue;
    const i = typeof o.rules == "string" ? (() => {
      try {
        return JSON.parse(o.rules);
      } catch {
        return null;
      }
    })() : o.rules, n = typeof i == "object" && i !== null ? i : {}, d = wr({ mode: n.mode, depth: n.depthMm, smallest: n.smallestLetterMm });
    if (d !== null) return { mode: d.mode, depth: d.depth };
  }
  return { mode: "raised", depth: 1 };
}
const Qo = (e) => e.base.faces.filter((t) => t.preview !== void 0);
function en(e, t, o, i) {
  const { painted: n, fontsIn: d } = Zo(i.pictures), s = t === null ? "" : JSON.stringify(t.values) + String(t.ready_design_id), l = le(() => t === null ? [] : Qo(e).map((c) => {
    const a = { piece: null, face: c.code, width: Math.max(c.size.w, 1), height: Math.max(c.size.h, 1) }, h = Me(e, t, { on: a, empty: i.empty, labels: i.labels, holds: i.holds }), p = Xo(e, c), f = c.preview, v = (f.bounds.u1 - f.bounds.u0) / a.width;
    return { code: c.code, plane: f, canvas: $r(h, n), width: a.width, height: a.height, relief: { mode: p.mode, depth: p.depth * v, depthMm: p.depth, colour: h.face.colour } };
  }), [e, s, n, d, i.empty]);
  return Jr(o, l);
}
function Us(e) {
  const { t } = R(), { api: o, catalogue: i, design: n, pictures: d, startThreshold: s } = e, l = Qo(i), c = le(() => l.length > 0 ? eo(o, i) : null, [o, i, l.length]), a = Jo(i, n, d, s), h = { logo: t("editor.drawing.logo", "Your logo"), photo: t("editor.drawing.photo", "Your photo") }, p = (k) => d[k] !== void 0, { model: f, unreadable: v } = en(i, c === null ? null : n, c, { empty: "dim", labels: h, pictures: a, holds: p }), y = (k, z, A) => {
    const g = k.pickDecal(z, A), m = g === null ? void 0 : l.find((L) => L.code === g.code);
    if (g === null || m === void 0) return null;
    const P = Me(i, n, { on: { piece: null, face: m.code, width: Math.max(m.size.w, 1), height: Math.max(m.size.h, 1) }, empty: "dim", labels: h, holds: p }), { x, y: M } = g.point;
    return [...P.items].reverse().find((L) => L.live && x >= L.box.x && x <= L.box.x + L.box.w && M >= L.box.y && M <= L.box.y + L.box.h)?.code ?? null;
  };
  return c === null || v ? /* @__PURE__ */ r(Rt, { ...e, kind: "printed", relief: Xo(i, i.base.faces[0]) }) : /* @__PURE__ */ r(Rt, { ...e, kind: "printed", model: f, pickPart: y });
}
function Ws({ api: e, catalogue: t, design: o, width: i, height: n, className: d, fallback: s }) {
  const { t: l } = R(), c = Qe(), a = Qo(t), h = le(() => c && e !== void 0 && a.length > 0 ? eo(e, t) : null, [e, t, c, a.length]), p = { logo: l("editor.drawing.logo", "Your logo"), photo: l("editor.drawing.photo", "Your photo") }, { model: f } = en(t, h === null ? null : o, h, { empty: "sample", labels: p, pictures: Ks, holds: () => !1 }), v = d === void 0 ? {} : { className: d };
  return h !== null ? /* @__PURE__ */ r(Yo, { model: f, view: Zs, width: i, height: n, cacheKey: `printed|${h.key}|${JSON.stringify(o.values)}|${String(o.ready_design_id)}`, alt: "", ...v, fallback: s }) : /* @__PURE__ */ r(
    Hr,
    {
      sheet: Me(t, o, { labels: p }),
      thickness: t.base.thickness,
      outline: e === void 0 ? null : Ho(e, t),
      relief: Xo(t, t.base.faces[0]),
      kind: "printed",
      width: i,
      height: n,
      alt: "",
      ...v,
      fallback: s
    }
  );
}
const Ks = {}, Zs = $e("printed");
function Ii(e) {
  const t = /* @__PURE__ */ new Set();
  for (const o of e.parts)
    o.locked || (o.kind === "text" && t.add("words"), o.kind === "picture" && t.add(o.picture?.picture === "photo" ? "photo" : "logo"), o.kind === "text" && o.text?.alsoLogo !== null && o.text?.alsoLogo !== void 0 && t.add("logo"), o.kind === "choice" && t.add("motif"));
  return ["words", "logo", "photo", "motif"].filter((o) => t.has(o));
}
function Ys({ api: e, catalogue: t, product: o, sides: i, onPick: n, onBack: d, onStartBlank: s, onSendOwnFile: l, onChangeSides: c }) {
  const { t: a, look: h, locale: p } = R(), f = Oo(), [v, y] = O("all"), [k, z] = O(""), A = Ri(), { base: g } = t, m = { logo: a("editor.drawing.logo", "Your logo"), photo: a("editor.drawing.photo", "Your photo") }, P = { words: a("editor.chip.words", "Your words"), logo: a("editor.chip.logo", "Your logo"), photo: a("editor.chip.photo", "Photo"), motif: a("editor.chip.motif", "Motifs") }, x = {
    words: a("editor.filter.words", "Words only"),
    logo: a("editor.filter.logo", "With a logo"),
    motif: a("editor.filter.motif", "Motifs"),
    simple: a("editor.filter.simple", "Simple"),
    bold: a("editor.filter.bold", "Bold"),
    photo: a("editor.filter.photo", "With a photo"),
    one: a("editor.filter.one", "One colour")
  }, M = (N, $) => $ === "all" || ($ === "words" ? N.tags.length === 1 && N.tags[0] === "words" : N.tags.includes($)), L = ["words", "logo", "motif", "simple", "bold", "photo", "one"], B = (N) => L.includes(N) ? L.indexOf(N) : L.length, S = [...new Set(t.ready.flatMap((N) => N.tags))].sort((N, $) => B(N) - B($)), F = k.trim().toLocaleLowerCase(p), G = t.ready.filter((N) => M(N, v)).filter((N) => F === "" || `${N.name} ${Ii(N).map(($) => P[$]).join(" ")}`.toLocaleLowerCase(p).includes(F)), _ = t.ready.length > 0, D = h === "print" && i >= 2, b = `${String(g.width)} × ${String(g.height)} mm`;
  return /* @__PURE__ */ u("section", { className: "cz-choose", "data-screen": "choose", children: [
    d === void 0 ? null : /* @__PURE__ */ u("button", { type: "button", className: "cz-back", onClick: d, children: [
      /* @__PURE__ */ r(zt, { "aria-hidden": "true" }),
      o
    ] }),
    /* @__PURE__ */ u("div", { className: "cz-choose-head", children: [
      h === "maker" ? /* @__PURE__ */ u("span", { className: "cz-pill", children: [
        /* @__PURE__ */ r(id, { "aria-hidden": "true" }),
        a("editor.choose.chip", "Make it yours")
      ] }) : null,
      /* @__PURE__ */ r("h1", { className: "cz-h1", children: a("editor.choose.title", "Choose a design") }),
      h === "maker" ? /* @__PURE__ */ r("p", { className: "cz-sub", children: a("editor.choose.subMaker", "{n, plural, one {# ready-made design} other {# ready-made designs}} for the {product}. Pick one, then change what it lets you change.", { n: t.ready.length, product: o }) }) : /* @__PURE__ */ u("p", { className: "cz-sub", children: [
        a("editor.choose.subPrint", "Shown on your {trim} {product}, {sides}. Each one has parts you fill in; the rest stays as the shop made it.", { trim: b, product: p.startsWith("en") ? o.toLocaleLowerCase(p) : o, sides: i >= 2 ? a("editor.sides.both", "both sides") : a("editor.sides.one", "one side") }),
        " ",
        c === void 0 ? null : /* @__PURE__ */ r("button", { type: "button", className: "cz-link", onClick: c, children: a("editor.choose.changeSides", "Change the size or sides") })
      ] })
    ] }),
    _ ? /* @__PURE__ */ u(ee, { children: [
      /* @__PURE__ */ u("div", { className: "cz-choose-tools", children: [
        /* @__PURE__ */ r("div", { role: "radiogroup", "aria-label": a("editor.choose.show", "Show designs"), className: "cz-chips", children: ["all", ...S].map((N) => /* @__PURE__ */ u("button", { type: "button", role: "radio", "aria-checked": v === N, className: v === N ? "cz-filter cz-on" : "cz-filter", onClick: () => y(N), children: [
          N === "all" ? a("editor.filter.all", "All") : x[N] ?? N,
          /* @__PURE__ */ r("span", { className: "cz-mono cz-count", children: t.ready.filter(($) => M($, N)).length })
        ] }, N)) }),
        /* @__PURE__ */ u("div", { className: "cz-search", children: [
          /* @__PURE__ */ r("label", { htmlFor: A, className: "cz-hidden", children: a("editor.choose.search", "Search designs") }),
          /* @__PURE__ */ r(pr, { "aria-hidden": "true" }),
          /* @__PURE__ */ r("input", { id: A, type: "search", value: k, placeholder: a("editor.choose.search", "Search designs"), onChange: (N) => z(N.target.value) })
        ] })
      ] }),
      /* @__PURE__ */ r("p", { "aria-live": "polite", className: "cz-mono cz-tally", children: a("editor.choose.count", "{n, plural, one {# design} other {# designs}}", { n: G.length }) }),
      /* @__PURE__ */ u("div", { className: f ? "cz-cards cz-cards-narrow" : "cz-cards", children: [
        G.map((N) => {
          const $ = Ii(N), I = { base_id: g.id, ready_design_id: N.id, values: ht(t, N, i) };
          return /* @__PURE__ */ u("button", { type: "button", className: "cz-card", "aria-label": a("editor.choose.use", "Customise the {name} design. {chips}.", { name: N.name, chips: $.map((W) => P[W]).join(", ") }), onClick: () => n(N), children: [
            /* @__PURE__ */ u("span", { className: D ? "cz-card-art cz-card-art-two" : "cz-card-art", children: [
              g.kind === "kit" && e !== void 0 ? (
                // A kit's card is its model with the design on it, the pieces that carry it until then.
                /* @__PURE__ */ r(
                  $s,
                  {
                    api: e,
                    catalogue: t,
                    design: I,
                    width: 400,
                    height: 300,
                    className: "cz-drawing cz-card-picture",
                    fallback: N.picture === null ? /* @__PURE__ */ r(Qr, { catalogue: t, design: I, pieces: Uo(t), only: Vr(t, N.parts), label: N.name }) : /* @__PURE__ */ r("img", { src: N.picture, alt: "", className: "cz-drawing cz-card-picture" })
                  }
                )
              ) : g.kind === "printed" ? (
                // A printed item's card: its words stood up on it, drawn once for the page.
                /* @__PURE__ */ r(
                  Ws,
                  {
                    api: e,
                    catalogue: t,
                    design: I,
                    width: 400,
                    height: 300,
                    className: "cz-drawing cz-card-picture",
                    fallback: N.picture === null ? /* @__PURE__ */ r(ae, { catalogue: t, design: I }) : /* @__PURE__ */ r("img", { src: N.picture, alt: "", className: "cz-drawing cz-card-picture" })
                  }
                )
              ) : g.kind === "piece" ? (
                // A flat piece's card is its 3D still (drawn once for the page), its picture or drawing until then.
                /* @__PURE__ */ r(
                  Hr,
                  {
                    sheet: Me(t, I, { labels: m }),
                    thickness: g.thickness,
                    outline: e === void 0 ? null : Ho(e, t),
                    width: 400,
                    height: 300,
                    alt: "",
                    className: "cz-drawing cz-card-picture",
                    fallback: N.picture === null ? /* @__PURE__ */ r(ae, { catalogue: t, design: I }) : /* @__PURE__ */ r("img", { src: N.picture, alt: "", className: "cz-drawing cz-card-picture" })
                  }
                )
              ) : N.picture === null ? /* @__PURE__ */ r(ae, { catalogue: t, design: I }) : /* @__PURE__ */ r("img", { src: N.picture, alt: "", className: "cz-drawing cz-card-picture" }),
              D ? /* @__PURE__ */ r(ae, { catalogue: t, design: I, side: "back" }) : null
            ] }),
            /* @__PURE__ */ u("span", { className: "cz-card-body", children: [
              /* @__PURE__ */ u("span", { className: "cz-card-name", children: [
                N.name,
                h === "print" ? /* @__PURE__ */ u("span", { className: "cz-card-meta", children: [
                  a("editor.choose.colourways", "{n, plural, one {# colourway} other {# colourways}}", { n: Math.max(1, N.palettes.length) }),
                  N.layouts.length > 1 ? ` · ${a("editor.choose.layouts", "{n, plural, one {# layout} other {# layouts}}", { n: N.layouts.length })}` : ""
                ] }) : null
              ] }),
              /* @__PURE__ */ r("span", { className: "cz-tags", children: $.map((W) => /* @__PURE__ */ u("span", { className: "cz-tag", children: [
                h === "maker" ? W === "words" ? /* @__PURE__ */ r(Nt, { "aria-hidden": "true" }) : W === "motif" ? /* @__PURE__ */ r(td, { "aria-hidden": "true" }) : /* @__PURE__ */ r(Mo, { "aria-hidden": "true" }) : null,
                P[W]
              ] }, W)) })
            ] })
          ] }, String(N.id));
        }),
        h === "maker" ? /* @__PURE__ */ u("button", { type: "button", className: "cz-card cz-card-plain", onClick: () => n(null), children: [
          /* @__PURE__ */ r("span", { className: "cz-tile", children: /* @__PURE__ */ r(gt, { "aria-hidden": "true" }) }),
          /* @__PURE__ */ r("span", { className: "cz-card-name", children: a("editor.choose.plain", "Start with a plain piece") }),
          /* @__PURE__ */ r("span", { className: "cz-small", children: t.plain.length > 0 ? a("editor.choose.plainSub", "Your words or logo where the studio allows them.") : a("editor.choose.plainNone", "The piece as it comes, with nothing added.") })
        ] }) : null
      ] }),
      G.length === 0 ? /* @__PURE__ */ u("div", { className: "cz-empty", children: [
        /* @__PURE__ */ r("span", { className: "cz-tile", children: /* @__PURE__ */ r(Ql, { "aria-hidden": "true" }) }),
        /* @__PURE__ */ r("p", { className: "cz-empty-title", children: F === "" ? a("editor.choose.noMatch", "No designs match that") : a("editor.choose.noMatchQuery", "No designs match “{query}”", { query: k.trim() }) }),
        /* @__PURE__ */ r(
          "button",
          {
            type: "button",
            className: "cz-button",
            onClick: () => {
              z(""), y("all");
            },
            children: a("editor.choose.showAll", "Show all designs")
          }
        )
      ] }) : null
    ] }) : /* @__PURE__ */ u("div", { className: "cz-none", children: [
      /* @__PURE__ */ r("span", { className: "cz-tile cz-tile-big", children: /* @__PURE__ */ r(gt, { "aria-hidden": "true" }) }),
      /* @__PURE__ */ r("h2", { className: "cz-h2", children: a("editor.choose.none", "No ready-made designs for {product} yet", { product: o }) }),
      /* @__PURE__ */ r("p", { className: "cz-sub", children: a("editor.choose.noneSub", "Start from a blank page at the right size, or send a file you’ve made.") }),
      /* @__PURE__ */ u("div", { className: "cz-doors", children: [
        s === void 0 ? null : /* @__PURE__ */ u("button", { type: "button", className: "cz-door", onClick: s, children: [
          /* @__PURE__ */ r("span", { className: "cz-door-icon", children: /* @__PURE__ */ r(kr, { "aria-hidden": "true" }) }),
          /* @__PURE__ */ u("span", { className: "cz-door-text", children: [
            /* @__PURE__ */ r("span", { className: "cz-door-title", children: a("editor.ways.blank", "Start from blank") }),
            /* @__PURE__ */ r("span", { className: "cz-small", children: a("editor.ways.blankNone", "The page at its finished size, with the bleed and safe line drawn.") })
          ] })
        ] }),
        l === void 0 ? null : /* @__PURE__ */ u("button", { type: "button", className: "cz-door", onClick: l, children: [
          /* @__PURE__ */ r("span", { className: "cz-door-icon", children: /* @__PURE__ */ r(St, { "aria-hidden": "true" }) }),
          /* @__PURE__ */ u("span", { className: "cz-door-text", children: [
            /* @__PURE__ */ r("span", { className: "cz-door-title", children: a("editor.ways.own", "Send your own file") }),
            /* @__PURE__ */ r("span", { className: "cz-small", children: a("editor.ways.ownNone", "A PDF, TIFF or JPEG up to 100 MB.") })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function Oi(e, t, o) {
  const i = e.text;
  if (i.sizes !== null) {
    const l = [.../* @__PURE__ */ new Set([i.size, ...i.sizes])].sort((a, h) => a - h);
    return (o ? l.find((a) => a > t + 1e-6) : [...l].reverse().find((a) => a < t - 1e-6)) ?? null;
  }
  if (i.min === null && i.max === null) return null;
  const n = t <= 10 ? 0.5 : 1, d = Math.round((o ? t + n : t - n) * 10) / 10, s = o ? Math.min(i.max ?? d, d) : Math.max(i.min ?? d, d);
  return Math.abs(s - t) < 1e-6 || !He(i, s) ? null : s;
}
function Hs(e) {
  const { t } = R(), o = e.parts.filter((i) => !i.locked && i.kind !== "shape");
  return /* @__PURE__ */ u(ee, { children: [
    e.parts.filter((i) => i.kind !== "shape" || i.fixed !== "").map((i) => /* @__PURE__ */ r("div", { className: e.selected === i.code ? "cz-row cz-row-on" : "cz-row", onFocus: () => e.onSelect(i.code), children: /* @__PURE__ */ r(Js, { ...e, part: i }) }, i.code)),
    o.length === 0 ? /* @__PURE__ */ r("p", { className: "cz-row cz-small", children: t("editor.fields.nothing", "Nothing on this design is yours to change.") }) : null
  ] });
}
function Js(e) {
  const { part: t, values: o } = e;
  if (t.locked) return /* @__PURE__ */ r(ta, { part: t });
  if (t.kind === "text") {
    const i = Mr(o, t), n = t.text?.alsoLogo !== null && t.text?.alsoLogo !== void 0;
    return n && i === null && !t.required ? /* @__PURE__ */ r(Qs, { ...e }) : i === "logo" ? /* @__PURE__ */ r(Gi, { ...e, either: !0 }) : /* @__PURE__ */ r(Xs, { ...e, either: n });
  }
  return t.kind === "picture" ? /* @__PURE__ */ r(Gi, { ...e, either: !1 }) : t.kind === "colour" || t.kind === "choice" ? /* @__PURE__ */ r(ea, { ...e }) : null;
}
function Xs({ part: e, values: t, checks: o, tried: i, setPart: n, onTyping: d, catalogue: s, either: l }) {
  const { t: c, locale: a } = R(), h = e.text, p = ue(t, e), f = Pe(e.code), v = o.filter((b) => b.part === e.code), y = v.find((b) => b.kind === "too-long"), k = i ? v.find((b) => b.kind === "required-empty") : void 0, z = v.filter((b) => b !== y && b.kind !== "required-empty"), { count: A, limit: g, state: m } = Or(e, p), P = p.size ?? h.size, x = (b) => h.unit === "pt" ? yo(b, a) : Je(b, a), M = h.fonts ?? (h.font === null ? [] : [h.font]), L = h.finishes ?? [], B = Oi(e, P, !1), S = Oi(e, P, !0), F = (b) => n(e.code, { ...p, ...b, ...l ? { mode: "words" } : {} }), G = h.sizes !== null ? [.../* @__PURE__ */ new Set([h.size, ...h.sizes])].sort((b, N) => b - N) : null, _ = G !== null ? G.map(x).join(" · ") : h.min !== null && h.max !== null ? `${String(h.min)}–${x(h.max)}` : null, D = [`${f}-count`, y === void 0 ? "" : `${f}-fix`, k === void 0 ? "" : `${f}-err`, ...z.map((b, N) => `${f}-m${String(N)}`)].filter((b) => b !== "").join(" ");
  return /* @__PURE__ */ u(ee, { children: [
    /* @__PURE__ */ u("div", { className: "cz-row-head", children: [
      /* @__PURE__ */ r("label", { htmlFor: f, className: "cz-label", children: l ? c("editor.fields.yourWords", "{part} — your words", { part: e.name }) : e.name }),
      /* @__PURE__ */ r("span", { className: "cz-req", children: e.required ? c("editor.fields.needed", "Needed") : c("editor.fields.optional", "Optional") }),
      /* @__PURE__ */ r("span", { id: `${f}-count`, "aria-live": "polite", className: `cz-mono cz-counter cz-counter-${m}`, children: c("editor.fields.counter", "{count} / {limit}", { count: A, limit: g }) })
    ] }),
    /* @__PURE__ */ r(
      "input",
      {
        id: f,
        className: y !== void 0 || k !== void 0 ? "cz-input cz-input-bad" : "cz-input",
        value: p.text ?? "",
        placeholder: e.placeholder,
        autoComplete: "off",
        "aria-invalid": y !== void 0 || k !== void 0,
        "aria-describedby": D,
        onChange: (b) => F({ text: b.target.value }),
        onFocus: () => d(!0),
        onBlur: () => d(!1)
      }
    ),
    k === void 0 ? null : /* @__PURE__ */ u("span", { id: `${f}-err`, className: "cz-error", children: [
      /* @__PURE__ */ r(Ce, { icon: "alert" }),
      k.inline
    ] }),
    y === void 0 ? null : /* @__PURE__ */ u("div", { id: `${f}-fix`, role: "alert", className: "cz-fixbox", children: [
      /* @__PURE__ */ u("span", { className: "cz-fixbox-text", children: [
        /* @__PURE__ */ r(Lo, { "aria-hidden": "true" }),
        y.inline
      ] }),
      /* @__PURE__ */ r("div", { className: "cz-fixbox-actions", children: y.fixes.map((b) => /* @__PURE__ */ r("button", { type: "button", className: "cz-fix", onClick: () => n(e.code, b.value), children: b.label }, b.label)) })
    ] }),
    z.map((b, N) => /* @__PURE__ */ u("span", { id: `${f}-m${String(N)}`, className: b.block ? "cz-error" : "cz-advice", children: [
      /* @__PURE__ */ r(Ce, { icon: b.icon }),
      b.inline,
      b.fixes.map(($) => /* @__PURE__ */ r("button", { type: "button", className: "cz-link", onClick: () => n(e.code, $.value), children: $.label }, $.label))
    ] }, N)),
    M.length > 1 ? /* @__PURE__ */ r("div", { role: "radiogroup", "aria-label": c("editor.fields.fontFor", "Font for {part}", { part: e.name }), className: "cz-chips", children: M.map((b) => {
      const N = (p.font ?? h.font) === b, $ = s.fonts.find((I) => I.family === b);
      return /* @__PURE__ */ r("button", { type: "button", role: "radio", "aria-checked": N, className: `cz-chip cz-font-chip ${rs(b)}${N ? " cz-on" : ""}`, onClick: () => F({ font: b }), children: $?.name ?? b }, b);
    }) }) : null,
    B !== null || S !== null ? /* @__PURE__ */ u("div", { className: "cz-size-line", children: [
      /* @__PURE__ */ u("div", { role: "group", "aria-label": c("editor.fields.sizeFor", "Letter size for {part}", { part: e.name }), className: "cz-stepper", children: [
        /* @__PURE__ */ r("button", { type: "button", "aria-label": c("editor.fields.smaller", "Smaller letters"), "aria-disabled": B === null, onClick: () => B !== null && F({ size: B }), children: /* @__PURE__ */ r(Xt, { "aria-hidden": "true" }) }),
        /* @__PURE__ */ r("span", { "aria-live": "polite", className: "cz-mono cz-stepper-value", children: x(P) }),
        /* @__PURE__ */ r("button", { type: "button", "aria-label": c("editor.fields.bigger", "Bigger letters"), "aria-disabled": S === null, onClick: () => S !== null && F({ size: S }), children: /* @__PURE__ */ r(fr, { "aria-hidden": "true" }) })
      ] }),
      _ === null ? null : /* @__PURE__ */ r("span", { className: "cz-mono cz-hint", children: _ }),
      l && !e.required ? /* @__PURE__ */ r("button", { type: "button", className: "cz-quiet cz-push", onClick: () => n(e.code, null), children: c("editor.fields.leaveEmpty", "Leave it empty") }) : null
    ] }) : l && !e.required ? /* @__PURE__ */ r("button", { type: "button", className: "cz-quiet cz-push", onClick: () => n(e.code, null), children: c("editor.fields.leaveEmpty", "Leave it empty") }) : null,
    L.length > 0 ? /* @__PURE__ */ r("div", { role: "radiogroup", "aria-label": c("editor.fields.finishFor", "Finish for {part}", { part: e.name }), className: "cz-chips", children: L.map((b) => {
      const N = s.finishes[b], $ = (p.finish ?? t.finish ?? h.finish ?? L[0]) === b;
      return /* @__PURE__ */ u("button", { type: "button", role: "radio", "aria-checked": $, className: $ ? "cz-chip cz-chip-round cz-on" : "cz-chip cz-chip-round", onClick: () => F({ finish: b }), children: [
        /* @__PURE__ */ r(Vo, { hex: N?.hex ?? "#888888" }),
        N?.name ?? b
      ] }, b);
    }) }) : null
  ] });
}
function Gi({ part: e, values: t, featurePrices: o, pictures: i, transfers: n, problems: d, upload: s, setPart: l, checks: c, either: a, onOneColour: h }) {
  const { t: p, locale: f } = R(), v = e.picture ?? e.text?.alsoLogo ?? null, y = v?.file ?? "logo_file", k = ue(t, e), z = Pe(e.code), A = k.file !== void 0 ? i[y] : void 0, g = n[y], m = d[y], P = Gr(e, y, s), x = e.feature === null ? void 0 : o[e.feature], M = c.filter((N) => N.part === e.code), L = M.some((N) => N.kind === "fine-detail"), B = v?.picture === "photo", S = (N) => l(e.code, { ...k, ...N, ...a ? { mode: "logo" } : {} }), F = e.box, G = k.scale ?? ft, _ = F === null ? null : Math.min(F.w, F.h) * G / 100, D = (N, $, I = !1) => () => {
    if (I) return S({ nx: 0, ny: 0 });
    const [W, ie] = F === null ? [12, 12] : [F.w / 2, F.h / 2];
    S({ nx: Math.max(-W, Math.min(W, (k.nx ?? 0) + N)), ny: Math.max(-ie, Math.min(ie, (k.ny ?? 0) + $)) });
  }, b = `${z}-err`;
  return /* @__PURE__ */ u(ee, { children: [
    /* @__PURE__ */ u("div", { className: "cz-row-head", children: [
      /* @__PURE__ */ r("span", { className: "cz-label", children: a ? p("editor.fields.yourLogo", "{part} — your logo", { part: e.name }) : e.name }),
      x === void 0 ? null : /* @__PURE__ */ r("span", { className: "cz-mono cz-price", children: x }),
      a && !e.required ? /* @__PURE__ */ r("button", { type: "button", className: "cz-quiet cz-push", onClick: () => l(e.code, null), children: p("editor.fields.leaveEmpty", "Leave it empty") }) : null
    ] }),
    P.element,
    g !== void 0 ? /* @__PURE__ */ r(Ro, { transfer: g, label: B ? p("editor.upload.sendingPhoto", "Uploading your photo") : p("editor.upload.sendingLogo", "Uploading your logo") }) : k.file === void 0 ? /* @__PURE__ */ u("div", { className: P.over ? "cz-drop cz-drop-over" : "cz-drop", ...P.drop, children: [
      /* @__PURE__ */ r("span", { className: "cz-tile", children: /* @__PURE__ */ r(Co, { "aria-hidden": "true" }) }),
      /* @__PURE__ */ u("span", { className: "cz-drop-text", children: [
        /* @__PURE__ */ r("span", { className: "cz-strong", children: B ? p("editor.fields.dropPhoto", "Drop your photo here") : p("editor.fields.dropLogo", "Drop your logo here") }),
        /* @__PURE__ */ r("span", { className: "cz-small", children: B ? p("editor.fields.photoKinds", "PNG or JPEG, up to {size}", { size: Xe }) : p("editor.fields.logoKinds", "SVG, PDF, PNG or JPEG, up to {size}", { size: Xe }) })
      ] }),
      /* @__PURE__ */ u("button", { id: z, type: "button", className: "cz-primary", "aria-describedby": m === void 0 ? void 0 : b, onClick: P.pick, children: [
        /* @__PURE__ */ r(St, { "aria-hidden": "true" }),
        B ? p("editor.fields.uploadPhoto", "Upload your photo") : p("editor.fields.uploadLogo", "Upload your logo")
      ] })
    ] }) : null,
    m === void 0 ? null : /* @__PURE__ */ u("span", { id: b, role: "alert", className: "cz-error", children: [
      /* @__PURE__ */ r(Ce, { icon: "alert" }),
      /* @__PURE__ */ u("span", { children: [
        m.text,
        m.detail === void 0 ? null : /* @__PURE__ */ r("span", { lang: "en", className: "cz-detail", children: m.detail })
      ] })
    ] }),
    k.file === void 0 || g !== void 0 ? null : /* @__PURE__ */ u(ee, { children: [
      /* @__PURE__ */ u("div", { className: "cz-file", children: [
        /* @__PURE__ */ r("span", { className: "cz-tile cz-tile-small", children: /* @__PURE__ */ r(El, { "aria-hidden": "true" }) }),
        /* @__PURE__ */ u("span", { className: "cz-file-text", children: [
          /* @__PURE__ */ r("span", { className: "cz-mono cz-strong cz-ellipsis", children: A === void 0 || A.name === "" ? p("editor.fields.kept", "Kept with your design") : A.name }),
          A === void 0 ? null : /* @__PURE__ */ r("span", { className: "cz-mono cz-small", children: qo(A, !1) })
        ] }),
        /* @__PURE__ */ r("button", { id: z, type: "button", className: "cz-button cz-button-small", "aria-describedby": m === void 0 ? void 0 : b, onClick: P.pick, children: p("editor.fields.replace", "Replace") }),
        /* @__PURE__ */ r(
          "button",
          {
            type: "button",
            className: "cz-icon-button",
            "aria-label": B ? p("editor.fields.removePhoto", "Remove your photo") : p("editor.fields.removeLogo", "Remove your logo"),
            onClick: () => {
              const { file: N, ...$ } = k;
              l(e.code, a ? { ...$, mode: "logo" } : Object.keys($).length === 0 ? null : $);
            },
            children: /* @__PURE__ */ r(pt, { "aria-hidden": "true" })
          }
        )
      ] }),
      /* @__PURE__ */ u("div", { className: "cz-logo-tools", children: [
        /* @__PURE__ */ u("div", { className: "cz-logo-tool", children: [
          /* @__PURE__ */ r("span", { id: `${z}-fit`, className: "cz-tool-label", children: p("editor.logo.inBox", "In its box") }),
          /* @__PURE__ */ r("div", { role: "radiogroup", "aria-label": p("editor.logo.fitAria", "How the logo sits in its box"), className: "cz-seg", children: ["inside", "fill"].map((N) => /* @__PURE__ */ r("button", { type: "button", role: "radio", "aria-checked": (k.fit ?? v?.fit ?? "inside") === N, className: (k.fit ?? v?.fit ?? "inside") === N ? "cz-on" : "", onClick: () => S({ fit: N }), children: N === "inside" ? p("editor.logo.fitInside", "Fit inside") : p("editor.logo.fill", "Fill") }, N)) })
        ] }),
        /* @__PURE__ */ u("div", { className: "cz-logo-tool", children: [
          /* @__PURE__ */ r("span", { className: "cz-tool-label", children: p("editor.logo.nudge", "Nudge") }),
          /* @__PURE__ */ r("div", { role: "group", "aria-label": p("editor.logo.nudgeAria", "Nudge the logo"), className: "cz-nudge", children: [
            [p("editor.logo.left", "Nudge left"), zt, D(-1, 0)],
            [p("editor.logo.up", "Nudge up"), dr, D(0, -1)],
            [p("editor.logo.centre", "Centre it"), jl, D(0, 0, !0)],
            [p("editor.logo.down", "Nudge down"), nr, D(0, 1)],
            [p("editor.logo.right", "Nudge right"), lr, D(1, 0)]
          ].map(([N, $, I]) => /* @__PURE__ */ r("button", { type: "button", "aria-label": N, title: N, onClick: I, children: /* @__PURE__ */ r($, { "aria-hidden": "true" }) }, N)) })
        ] })
      ] }),
      /* @__PURE__ */ u("label", { className: "cz-scale", children: [
        /* @__PURE__ */ u("span", { className: "cz-scale-head", children: [
          /* @__PURE__ */ r("span", { className: "cz-tool-label", children: p("editor.logo.size", "Size in its box") }),
          _ === null ? null : /* @__PURE__ */ r("span", { className: "cz-mono cz-strong cz-push", children: p("editor.logo.across", "{size} across", { size: Je(_, f) }) })
        ] }),
        /* @__PURE__ */ r(
          "input",
          {
            type: "range",
            className: "cz-range",
            min: Ui,
            max: ft,
            step: 5,
            value: G,
            ..._ === null ? {} : { "aria-valuetext": p("editor.logo.across", "{size} across", { size: Je(_, f) }) },
            onChange: (N) => S({ scale: Number(N.target.value) })
          }
        )
      ] }),
      v?.colour === "one" ? /* @__PURE__ */ u("div", { className: "cz-chips", children: [
        /* @__PURE__ */ u("button", { type: "button", className: "cz-button", onClick: () => h(e), children: [
          /* @__PURE__ */ r(Po, { "aria-hidden": "true" }),
          p("editor.oneColour.open", "Make it one colour")
        ] }),
        L ? /* @__PURE__ */ u("span", { className: "cz-advice", children: [
          /* @__PURE__ */ r(Ao, { "aria-hidden": "true" }),
          p("editor.oneColour.mayBeFine", "Some lines may be too fine")
        ] }) : null
      ] }) : null
    ] }),
    M.filter((N) => N.kind !== "fine-detail" || v?.colour !== "one").map((N, $) => /* @__PURE__ */ u("span", { className: N.block ? "cz-error" : "cz-advice", children: [
      /* @__PURE__ */ r(Ce, { icon: N.icon }),
      /* @__PURE__ */ u("span", { children: [
        N.inline,
        N.detail === void 0 ? null : /* @__PURE__ */ r("span", { className: "cz-mono cz-detail", children: N.detail })
      ] })
    ] }, $)),
    /* @__PURE__ */ u("span", { className: "cz-private", children: [
      /* @__PURE__ */ r(ql, { "aria-hidden": "true" }),
      B ? p("editor.fields.privateMakerPhoto", "Your photo is private. Only you and the studio can see it.") : p("editor.fields.privateMaker", "Your logo is private. Only you and the studio can see it.")
    ] })
  ] });
}
function Qs({ part: e, setPart: t, featurePrices: o }) {
  const { t: i } = R(), n = e.feature === null ? void 0 : o[e.feature];
  return /* @__PURE__ */ u(ee, { children: [
    /* @__PURE__ */ u("div", { className: "cz-row-head", children: [
      /* @__PURE__ */ r("span", { className: "cz-label", children: e.name }),
      /* @__PURE__ */ r("span", { className: "cz-req", children: i("editor.fields.optional", "Optional") })
    ] }),
    /* @__PURE__ */ r("p", { className: "cz-small", children: i("editor.fields.either", "Leave it plain, or put your own words or logo here.") }),
    /* @__PURE__ */ u("div", { className: "cz-chips", children: [
      /* @__PURE__ */ u("button", { id: Pe(e.code), type: "button", className: "cz-button", onClick: () => t(e.code, { mode: "words", text: "" }), children: [
        /* @__PURE__ */ r(Nt, { "aria-hidden": "true" }),
        i("editor.fields.addWords", "Add words")
      ] }),
      /* @__PURE__ */ u("button", { type: "button", className: "cz-button", onClick: () => t(e.code, { mode: "logo" }), children: [
        /* @__PURE__ */ r(Co, { "aria-hidden": "true" }),
        i("editor.fields.addLogo", "Add your logo"),
        n === void 0 ? null : /* @__PURE__ */ r("span", { className: "cz-mono cz-price", children: n })
      ] })
    ] })
  ] });
}
function ea({ part: e, values: t, setPart: o, catalogue: i }) {
  const n = ue(t, e), d = `${Pe(e.code)}-label`, s = e.kind === "colour" ? e.palette === null ? Object.values(i.shared).flat() : i.shared[e.palette] ?? [] : [], l = n.choice ?? e.start?.choice;
  return /* @__PURE__ */ u(ee, { children: [
    /* @__PURE__ */ r("span", { id: d, className: "cz-label", children: e.name }),
    /* @__PURE__ */ r("div", { role: "radiogroup", "aria-labelledby": d, className: "cz-chips", children: e.choices.map((c) => {
      const a = s.find((p) => p.code === c), h = l === c;
      return /* @__PURE__ */ u("button", { id: h ? Pe(e.code) : void 0, type: "button", role: "radio", "aria-checked": h, className: h ? "cz-chip cz-chip-tall cz-on" : "cz-chip cz-chip-tall", onClick: () => o(e.code, { ...n, choice: c }), children: [
        a === void 0 ? null : /* @__PURE__ */ r(Vo, { hex: a.hex }),
        a?.name ?? tn(c)
      ] }, c);
    }) })
  ] });
}
const tn = (e) => {
  const t = e.replace(/[-_]+/g, " ").trim();
  return t.charAt(0).toLocaleUpperCase() + t.slice(1);
};
function ta({ part: e }) {
  const { t } = R(), [o, i] = O(!1), n = e.kind === "text" ? `“${e.fixed}”` : e.fixed !== "" ? e.fixed : tn(e.start?.choice ?? "");
  return /* @__PURE__ */ u(
    "div",
    {
      id: Pe(e.code),
      tabIndex: 0,
      className: "cz-locked",
      "aria-label": t("editor.fields.lockedAria", "{part}, set by the studio: {value}", { part: e.name, value: n }),
      onMouseEnter: () => i(!0),
      onMouseLeave: () => i(!1),
      onFocus: () => i(!0),
      onBlur: () => i(!1),
      children: [
        /* @__PURE__ */ u("span", { className: "cz-locked-text", children: [
          /* @__PURE__ */ r("span", { className: "cz-label cz-muted", children: e.name }),
          /* @__PURE__ */ r("span", { className: "cz-small", children: n })
        ] }),
        /* @__PURE__ */ u("span", { className: o ? "cz-locked-tag cz-shown" : "cz-locked-tag", children: [
          /* @__PURE__ */ r(xt, { "aria-hidden": "true" }),
          t("editor.fields.setByStudio", "Set by the studio")
        ] })
      ]
    }
  );
}
const oa = 'button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea, select, a[href], [tabindex="0"]';
function Ct({ labelledBy: e, describedBy: t, alert: o = !1, onClose: i, children: n, className: d, scrimClass: s }) {
  const l = Q(null), c = Q(i);
  return c.current = i, J(() => {
    const a = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    l.current?.querySelector('input:not([type="hidden"]), textarea, button')?.focus();
    const p = (f) => {
      if (f.key === "Escape") {
        f.preventDefault(), c.current();
        return;
      }
      if (f.key !== "Tab" || l.current === null) return;
      const v = [...l.current.querySelectorAll(oa)];
      if (v.length === 0) return;
      const [y, k] = [v[0], v[v.length - 1]];
      l.current.contains(document.activeElement) ? f.shiftKey && document.activeElement === y ? (f.preventDefault(), k.focus()) : !f.shiftKey && document.activeElement === k && (f.preventDefault(), y.focus()) : (f.preventDefault(), y.focus());
    };
    return document.addEventListener("keydown", p), () => {
      document.removeEventListener("keydown", p), a !== null && document.body.contains(a) && a.focus();
    };
  }, []), /* @__PURE__ */ r("div", { className: s ?? "cz-scrim", onClick: i, children: /* @__PURE__ */ r("div", { ref: l, role: o ? "alertdialog" : "dialog", "aria-modal": "true", "aria-labelledby": e, ...t === void 0 ? {} : { "aria-describedby": t }, className: d ?? "cz-dialog", onClick: (a) => a.stopPropagation(), children: n }) });
}
function wo({ toasts: e, onUndo: t, raised: o = !1 }) {
  const { t: i } = R();
  return /* @__PURE__ */ r("div", { "aria-live": "polite", className: o ? "cz-toasts cz-toasts-raised" : "cz-toasts", children: e.map((n) => /* @__PURE__ */ u("div", { role: "status", className: `cz-toast cz-toast-${n.kind}`, children: [
    n.kind === "warn" ? /* @__PURE__ */ r(Do, { "aria-hidden": "true" }) : n.kind === "info" ? /* @__PURE__ */ r(Ol, { "aria-hidden": "true" }) : /* @__PURE__ */ r(Dl, { "aria-hidden": "true" }),
    /* @__PURE__ */ r("span", { children: n.text }),
    n.undo === void 0 ? null : /* @__PURE__ */ r("button", { type: "button", className: "cz-toast-undo", onClick: () => t(n), children: i("editor.undo", "Undo") })
  ] }, n.id)) });
}
const ia = [
  { test: /walnut/i, face: "#6b4428", ink: "#24130a" },
  { test: /ply|birch/i, face: "#d9b98a", ink: "#6a4321" },
  { test: /slate/i, face: "#3b4248", ink: "#c3cacf" },
  { test: /oak/i, face: "#c9a26b", ink: "#4a2f16" }
];
function ra({ catalogue: e, part: t, value: o, picture: i, startThreshold: n, fine: d, narrow: s, onThreshold: l, onUse: c, onCancel: a }) {
  const { t: h } = R(), p = e.base.material, f = ia.find((z) => z.test.test(p ?? "")) ?? { face: "#e9e4da", ink: "#3a3530" }, v = yt(o, n), y = qt(i, v, f.ink), k = i?.kind === "pdf";
  return /* @__PURE__ */ u(Ct, { labelledBy: "cz-oc-title", onClose: a, className: s ? "cz-oc cz-oc-foot" : "cz-oc cz-oc-side", scrimClass: "cz-scrim cz-scrim-sheet", children: [
    /* @__PURE__ */ u("div", { className: "cz-oc-head", children: [
      /* @__PURE__ */ r("span", { className: "cz-tile cz-tile-accent cz-tile-small", children: /* @__PURE__ */ r(Po, { "aria-hidden": "true" }) }),
      /* @__PURE__ */ r("h2", { id: "cz-oc-title", className: "cz-oc-title", children: h("editor.oneColour.open", "Make it one colour") }),
      /* @__PURE__ */ r("button", { type: "button", className: "cz-icon-button cz-push", "aria-label": h("editor.close", "Close"), onClick: a, children: /* @__PURE__ */ r(Vt, { "aria-hidden": "true" }) })
    ] }),
    /* @__PURE__ */ u("div", { className: "cz-oc-body", children: [
      /* @__PURE__ */ r("p", { className: "cz-oc-lead", children: p === null ? h("editor.oneColour.leadPlain", "The laser cuts one colour. Everything darker than the line you set is engraved; everything lighter is left as it is.") : h("editor.oneColour.lead", "The laser cuts one colour. Everything darker than the line you set is engraved; everything lighter is left as {material}.", { material: p.toLocaleLowerCase() }) }),
      /* @__PURE__ */ u("div", { className: "cz-oc-pair", children: [
        /* @__PURE__ */ u("div", { className: "cz-oc-one", children: [
          /* @__PURE__ */ r("span", { className: "cz-tool-label", children: h("editor.oneColour.yours", "Your file") }),
          /* @__PURE__ */ r("div", { role: "img", "aria-label": h("editor.oneColour.yoursAria", "Your logo as uploaded"), className: "cz-oc-frame cz-oc-paper", children: i?.url === void 0 ? /* @__PURE__ */ r("span", { className: "cz-mono cz-small", children: i === void 0 ? t.name : i.name || i.kind.toUpperCase() }) : /* @__PURE__ */ r("img", { src: i.url, alt: "", className: "cz-oc-img" }) })
        ] }),
        /* @__PURE__ */ u("div", { className: "cz-oc-one", children: [
          /* @__PURE__ */ r("span", { className: "cz-tool-label", children: h("editor.oneColour.laser", "As the laser will cut it") }),
          /* @__PURE__ */ r("div", { role: "img", "aria-label": p === null ? h("editor.oneColour.laserAriaPlain", "Your logo as the laser engraves it") : h("editor.oneColour.laserAria", "Your logo engraved in {material}", { material: p.toLocaleLowerCase() }), className: "cz-oc-frame", children: /* @__PURE__ */ u("svg", { viewBox: "0 0 100 100", className: "cz-oc-svg", "aria-hidden": "true", children: [
            /* @__PURE__ */ r("rect", { x: "0", y: "0", width: "100", height: "100", fill: f.face }),
            y === null ? null : /* @__PURE__ */ r("image", { href: y, x: "6", y: "6", width: "88", height: "88", preserveAspectRatio: "xMidYMid meet" })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ u("label", { className: "cz-oc-line", children: [
        /* @__PURE__ */ u("span", { className: "cz-scale-head", children: [
          /* @__PURE__ */ r("span", { className: "cz-strong", children: h("editor.oneColour.line", "Where light becomes dark") }),
          /* @__PURE__ */ r("span", { className: "cz-mono cz-strong cz-push", children: `${String(v)}%` })
        ] }),
        /* @__PURE__ */ r("input", { type: "range", className: "cz-range", min: 1, max: 99, step: 1, value: v, "aria-describedby": d ? "cz-oc-warn" : void 0, onChange: (z) => l(Number(z.target.value)) }),
        /* @__PURE__ */ u("span", { className: "cz-oc-ends", children: [
          /* @__PURE__ */ r("span", { children: h("editor.oneColour.less", "Less engraved") }),
          /* @__PURE__ */ r("span", { children: h("editor.oneColour.more", "More engraved") })
        ] })
      ] }),
      d ? /* @__PURE__ */ u("div", { id: "cz-oc-warn", role: "alert", className: "cz-oc-warn", children: [
        /* @__PURE__ */ r(Ao, { "aria-hidden": "true" }),
        /* @__PURE__ */ u("span", { className: "cz-oc-warn-text", children: [
          /* @__PURE__ */ r("span", { className: "cz-strong", children: h("editor.oneColour.fine", "Some lines are too fine to engrave — they may disappear") }),
          /* @__PURE__ */ r("span", { children: h("editor.oneColour.fineHow", "Move the slider towards “Less engraved” to drop the fine shading, or upload a bolder version of your logo.") })
        ] })
      ] }) : null,
      k ? /* @__PURE__ */ r("span", { className: "cz-small", children: h("editor.oneColour.later", "We check fine detail again when we make your proof.") }) : null
    ] }),
    /* @__PURE__ */ u("div", { className: "cz-oc-foot-bar", children: [
      /* @__PURE__ */ r("button", { type: "button", className: "cz-primary cz-grow", onClick: c, children: h("editor.oneColour.use", "Use this") }),
      /* @__PURE__ */ r("button", { type: "button", className: "cz-button", onClick: a, children: h("editor.cancel", "Cancel") })
    ] })
  ] });
}
const Ut = (e, t, o) => Math.max(t, Math.min(o, e)), Wt = (e) => Math.round(e * 10) / 10 + 0;
function on(e) {
  const t = e.kind === "page" ? e.bleed : 0;
  return { x: -t, y: -t, w: e.width + t * 2, h: e.height + t * 2 };
}
const na = (e) => ({ w: Math.max(0.5, e.width * 0.02), h: Math.max(0.5, e.height * 0.02) });
function rn(e, t, o, i) {
  const n = on(i);
  return { ...e, x: Wt(Ut(e.x + t, n.x, Math.max(n.x, n.x + n.w - e.w))), y: Wt(Ut(e.y + o, n.y, Math.max(n.y, n.y + n.h - e.h))) };
}
function nn(e, t, o, i) {
  const n = on(i), d = na(i);
  return { ...e, w: Wt(Ut(e.w + t, d.w, Math.max(d.w, n.x + n.w - e.x))), h: Wt(Ut(e.h + o, d.h, Math.max(d.h, n.y + n.h - e.y))) };
}
function la(e, t, o, i) {
  const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[t];
  if (d === void 0) return null;
  const s = o.shift ? 5 : 1, l = d[0] * s * 0.5, c = d[1] * s * 0.5;
  return o.alt ? nn(e, l, c, i) : rn(e, l, c, i);
}
function ln(e) {
  const t = Math.max(e.width, 1), o = Math.max(e.height, 1), i = Math.max(e.kind === "page" ? e.bleed : 0, Math.min(t, o) * 0.06);
  return { x: -i, y: -i, w: t + i * 2, h: o + i * 2 };
}
function _i(e, t, o, i) {
  const n = e.getBoundingClientRect();
  if (n.width <= 0 || n.height <= 0) return null;
  const d = Math.min(n.width / i.w, n.height / i.h), s = n.left + (n.width - i.w * d) / 2, l = n.top + (n.height - i.h * d) / 2;
  return { x: i.x + (t - s) / d, y: i.y + (o - l) / d };
}
const da = (e) => Math.max(1.2, Math.min(e.width, e.height) / 22);
function sa(e, t) {
  const { box: o } = e;
  if (e.kind === "text") {
    const n = e.align === "center" ? "middle" : e.align === "end" ? "end" : "start", d = e.align === "center" ? o.x + o.w / 2 : e.align === "end" ? o.x + o.w : o.x;
    return /* @__PURE__ */ r("text", { x: d, y: o.y + e.sizeMm * 0.82, fontFamily: e.font, fontSize: e.sizeMm, fontWeight: e.weight, textAnchor: n, fill: e.colour, children: e.lines.map((s, l) => /* @__PURE__ */ r("tspan", { x: d, dy: l === 0 ? 0 : e.sizeMm * 1.25, children: s }, String(l))) });
  }
  if (e.kind === "slot") {
    const n = Math.max(1.6, Math.min(o.h * 0.22, o.w / Math.max(6, e.label.length * 0.62)));
    return /* @__PURE__ */ u(ee, { children: [
      /* @__PURE__ */ r("rect", { x: o.x, y: o.y, width: o.w, height: o.h, rx: Math.min(o.w, o.h) / 14, fill: "var(--surface-3)", fillOpacity: 0.55, stroke: "var(--fg-subtle)", strokeWidth: t, strokeDasharray: `${String(t * 4)} ${String(t * 3)}` }),
      /* @__PURE__ */ r("text", { x: o.x + o.w / 2, y: o.y + o.h / 2 + n * 0.35, fontSize: n, textAnchor: "middle", fill: "var(--fg-muted)", children: e.label })
    ] });
  }
  if (e.kind === "image") {
    const n = `cz-scene-clip-${e.key.replace(/[^A-Za-z0-9_-]/g, "")}`;
    return /* @__PURE__ */ u(ee, { children: [
      e.fill ? /* @__PURE__ */ r("defs", { children: /* @__PURE__ */ r("clipPath", { id: n, children: /* @__PURE__ */ r("rect", { x: o.x, y: o.y, width: o.w, height: o.h }) }) }) : null,
      /* @__PURE__ */ r("image", { href: e.href, x: o.x, y: o.y, width: o.w, height: o.h, preserveAspectRatio: e.fill ? "xMidYMid slice" : "xMidYMid meet", ...e.fill ? { clipPath: `url(#${n})` } : {} })
    ] });
  }
  const i = { fill: e.fill ?? "none", stroke: e.stroke ?? "none", strokeWidth: e.stroke === null ? 0 : t * 1.6 };
  return e.shape === "rect" ? /* @__PURE__ */ r("rect", { x: o.x, y: o.y, width: o.w, height: o.h, ...i }) : /* @__PURE__ */ r("ellipse", { cx: o.x + o.w / 2, cy: o.y + o.h / 2, rx: o.w / 2, ry: o.h / 2, ...i });
}
function aa({ face: e, drawn: t, guides: o = !0, label: i, width: n, selected: d = null, fixed: s, interactive: l, svgRef: c }) {
  const a = ln(e), h = Math.max(e.width, 1), p = Math.max(e.height, 1), f = Math.min(h, p) / 180, v = da(e), y = e.kind === "page", k = t.find((z) => z.key === d) ?? null;
  return /* @__PURE__ */ u(
    "svg",
    {
      ref: c,
      viewBox: `${String(a.x)} ${String(a.y)} ${String(a.w)} ${String(a.h)}`,
      width: n === void 0 ? "100%" : String(n),
      preserveAspectRatio: "xMidYMid meet",
      direction: "ltr",
      ...l === void 0 ? { role: "img", "aria-label": i } : {
        role: "application",
        tabIndex: 0,
        "aria-label": i,
        "aria-describedby": l.describedBy,
        onPointerDown: l.onPointerDown,
        onPointerMove: l.onPointerMove,
        onPointerUp: l.onPointerUp,
        onPointerCancel: l.onPointerUp,
        onKeyDown: l.onKeyDown
      },
      "data-face": "",
      children: [
        y ? /* @__PURE__ */ r("rect", { x: -e.bleed, y: -e.bleed, width: h + e.bleed * 2, height: p + e.bleed * 2, fill: e.paper ?? "#ffffff" }) : null,
        y ? null : /* @__PURE__ */ r("rect", { x: 0, y: 0, width: h, height: p, rx: e.corner, fill: "var(--surface)", stroke: "var(--fg-muted)", strokeWidth: f * 1.5 }),
        t.map((z) => {
          const A = sa(z, f);
          return l === void 0 ? /* @__PURE__ */ r("g", { children: A }, z.key) : /* @__PURE__ */ u(
            "g",
            {
              role: "button",
              tabIndex: -1,
              "aria-label": l.selectLabel(z.key),
              "aria-pressed": z.key === d,
              "data-part": z.key,
              onKeyDown: (g) => {
                (g.key === "Enter" || g.key === " ") && (g.preventDefault(), g.stopPropagation(), l.onSelect(z.key));
              },
              children: [
                /* @__PURE__ */ r("rect", { x: z.box.x, y: z.box.y, width: Math.max(z.box.w, 0.5), height: Math.max(z.box.h, 0.5), fill: "transparent" }),
                A
              ]
            },
            z.key
          );
        }),
        y && o ? /* @__PURE__ */ u(ee, { children: [
          e.bleed > 0 ? /* @__PURE__ */ r("path", { d: `M${String(-e.bleed)} ${String(-e.bleed)}H${String(h + e.bleed)}V${String(p + e.bleed)}H${String(-e.bleed)}Z M0 0V${String(p)}H${String(h)}V0Z`, fill: "var(--danger)", fillOpacity: 0.16, fillRule: "evenodd" }) : null,
          /* @__PURE__ */ r("rect", { x: 0, y: 0, width: h, height: p, rx: e.corner, fill: "none", stroke: "var(--danger)", strokeWidth: f * 1.5 }),
          e.safe > 0 ? /* @__PURE__ */ r("rect", { x: e.safe, y: e.safe, width: Math.max(0, h - e.safe * 2), height: Math.max(0, p - e.safe * 2), fill: "none", stroke: "var(--info)", strokeWidth: f * 1.5, strokeDasharray: `${String(f * 6)} ${String(f * 4)}` }) : null
        ] }) : null,
        k === null ? null : /* @__PURE__ */ u("g", { "aria-hidden": "true", children: [
          /* @__PURE__ */ r("rect", { x: k.box.x, y: k.box.y, width: k.box.w, height: k.box.h, fill: "none", stroke: "var(--accent)", strokeWidth: f * 2.5 }),
          l === void 0 || s?.has(k.key) === !0 ? null : /* @__PURE__ */ r("rect", { "data-handle": "", x: k.box.x + k.box.w - v / 2, y: k.box.y + k.box.h - v / 2, width: v, height: v, fill: "var(--accent)" })
        ] })
      ]
    }
  );
}
const st = [0.5, 0.75, 1, 1.5, 2, 3], ca = 460;
function ua(e) {
  const { catalogue: t, values: o, palette: i, answer: n, pictures: d, narrow: s } = e, { t: l } = R(), { base: c } = t, a = e.sides >= 2 && c.sides >= 2, [h, p] = O("front"), [f, v] = O(null), [y, k] = O(1), [z, A] = O(!0), [g, m] = O(e.banner), [P, x] = O(!1), M = Q(null), L = Q(null), B = Q(null), S = Ri(), F = Ir(), G = { kind: "page", width: c.width, height: c.height, bleed: c.bleed, safe: c.safe ?? 0 }, _ = Lr(o, h), D = _.find((C) => C.id === f) ?? null, b = t.fonts.length > 0 ? t.fonts.map((C) => ({ family: C.family, name: C.name })) : [{ family: "Manrope", name: "Manrope" }], N = (C, T) => e.change({ ...o, placed: C }, T), $ = (C, T, U) => N((o.placed ?? []).map((H) => H.id === C ? { ...H, ...T } : H), U), I = (C) => {
    N((o.placed ?? []).filter((T) => T.id !== C)), v(null);
  }, W = { text: l("editor.full.partText", "Text"), rect: l("editor.full.rect", "Rectangle"), ellipse: l("editor.full.ellipse", "Ellipse"), line: l("editor.full.line", "Line") }, ie = (C) => {
    const T = Ld(C, o, h, c, b[0].family, W, l("editor.full.sample", "Your words here"));
    N([...o.placed ?? [], T]), v(T.id);
  }, ne = () => _e.find((C) => !(o.placed ?? []).some((T) => T.kind === "image" && T.file === C)) ?? null, Le = (C) => {
    M.current = C;
    const T = C === null ? ne() : (o.placed ?? []).find((H) => H.id === C)?.file ?? null;
    if (T === null) {
      e.toast(l("editor.full.twoPictures", "A design takes two pictures at most: replace one, or remove it first."), "warn");
      return;
    }
    const U = L.current;
    U !== null && (U.dataset.column = T, U.accept = ($t[T] ?? []).map((H) => H === "jpeg" ? ".jpg,.jpeg,image/jpeg" : H === "svg" ? ".svg,image/svg+xml" : H === "pdf" ? ".pdf,application/pdf" : ".png,image/png").join(","), U.click());
  }, Re = (C, T) => {
    const U = M.current;
    d.send(C, T, $t[C] ?? []).then((H) => {
      if (H === null) return;
      if (U !== null) {
        $(U, { file: C });
        return;
      }
      const de = Ad(o, h, c, C, T.name.slice(0, 80) || l("editor.full.image", "Image"), H.px);
      N([...o.placed ?? [], de]), v(de.id);
    });
  }, he = ln({ kind: "page", width: c.width, height: c.height, bleed: c.bleed, safe: c.safe ?? 0 }), Oe = (C) => {
    const T = _i(C.currentTarget, C.clientX, C.clientY, he);
    if (T === null) return;
    const U = C.target, H = U.closest("[data-handle]") !== null, de = H ? f : U.closest("[data-part]")?.getAttribute("data-part"), ke = _.find((X) => X.id === de);
    if (ke === void 0) {
      v(null);
      return;
    }
    v(ke.id), B.current = { id: ke.id, mode: H ? "resize" : "move", from: T, box: kt(ke), moved: !1 };
  }, re = (C) => {
    const T = B.current;
    if (T === null) return;
    const U = _i(C.currentTarget, C.clientX, C.clientY, he);
    if (U === null) return;
    const [H, de] = [U.x - T.from.x, U.y - T.from.y];
    if (!T.moved && Math.hypot(H, de) < Math.min(c.width, c.height) / 100) return;
    T.moved || C.currentTarget.setPointerCapture?.(C.pointerId), T.moved = !0;
    const ke = T.mode === "move" ? rn(T.box, H, de, G) : nn(T.box, H, de, G);
    $(T.id, ke, `drag:${T.id}`);
  }, Ue = () => {
    B.current = null, e.endGesture();
  }, Mt = (C) => {
    if (C.key === "Escape") {
      C.preventDefault(), v(null);
      return;
    }
    if (D === null) return;
    if (C.key === "Delete" || C.key === "Backspace") {
      C.preventDefault(), I(D.id);
      return;
    }
    if (C.key === "Enter" && s) {
      C.preventDefault(), x(!0);
      return;
    }
    const T = la(kt(D), C.key, { shift: C.shiftKey, alt: C.altKey }, G);
    T !== null && (C.preventDefault(), $(D.id, D.kind === "text" ? { x: T.x, y: T.y, w: T.w } : T, `nudge:${D.id}:${C.altKey ? "size" : "place"}`));
  }, tt = { kind: "page", width: c.width, height: c.height, bleed: c.bleed, safe: c.safe ?? 0, corner: c.corner, paper: Ve(i, "paper", "paper") }, oo = { image: l("editor.full.image", "Image") }, Ae = Math.max(0, st.indexOf(y)), io = e.from === null ? l("editor.full.blank", "Start from blank") : l("editor.full.madeYours", "{design}, made your own", { design: e.from }), Lt = c.safe === null ? l("editor.full.sizeNoSafe", "{w} × {h} mm · bleed {bleed} mm", { w: c.width, h: c.height, bleed: c.bleed }) : l("editor.full.size", "{w} × {h} mm · bleed {bleed} mm · safe line {safe} mm", { w: c.width, h: c.height, bleed: c.bleed, safe: c.safe }), we = [
    { key: "text", icon: /* @__PURE__ */ r(Nt, { "aria-hidden": "true" }), label: l("editor.full.addWords", "Add words") },
    { key: "image", icon: /* @__PURE__ */ r(Mo, { "aria-hidden": "true" }), label: l("editor.full.addImage", "Add an image") },
    { key: "rect", icon: /* @__PURE__ */ r(yr, { "aria-hidden": "true" }), label: l("editor.full.rect", "Rectangle") },
    { key: "ellipse", icon: /* @__PURE__ */ r(ur, { "aria-hidden": "true" }), label: l("editor.full.ellipse", "Ellipse") },
    { key: "line", icon: /* @__PURE__ */ r(Xt, { "aria-hidden": "true" }), label: l("editor.full.line", "Line") }
  ], We = (C) => C.key === "image" ? Le(null) : ie(C.key), At = /* @__PURE__ */ r("button", { type: "button", className: z ? "cz-ed-tool cz-on" : "cz-ed-tool", "aria-label": l("editor.stage.guides", "Guides"), title: l("editor.stage.guides", "Guides"), "aria-pressed": z, onClick: () => A(!z), children: /* @__PURE__ */ r(Lo, { "aria-hidden": "true" }) }), ot = /* @__PURE__ */ r(ha, { ...e, part: D, shown: _, fonts: b, onSelect: v, onRemove: I, patch: $, onPick: (C) => Le(C), answer: n, measure: F });
  return /* @__PURE__ */ u(
    "section",
    {
      className: "cz-ed",
      "data-screen": "full",
      onKeyDown: (C) => {
        if (!(C.ctrlKey || C.metaKey) || C.altKey) return;
        const T = C.key.toLowerCase();
        T === "z" && !C.shiftKey ? (C.preventDefault(), e.undo()) : (T === "z" && C.shiftKey || T === "y") && (C.preventDefault(), e.redo());
      },
      children: [
        /* @__PURE__ */ u("header", { className: "cz-ed-head", children: [
          /* @__PURE__ */ r("button", { type: "button", className: "cz-icon-button", "aria-label": e.from === null ? l("editor.full.back", "Back") : l("editor.full.backToForm", "Back to the form"), title: e.from === null ? l("editor.full.back", "Back") : l("editor.full.backToForm", "Back to the form"), onClick: e.onBack, children: /* @__PURE__ */ r(zt, { "aria-hidden": "true", className: "cz-flip" }) }),
          /* @__PURE__ */ u("div", { className: "cz-ed-name", children: [
            /* @__PURE__ */ r("h1", { className: "cz-ed-title", children: io }),
            /* @__PURE__ */ r("span", { className: "cz-mono cz-ed-size", children: Lt })
          ] }),
          a ? /* @__PURE__ */ r("div", { role: "radiogroup", "aria-label": l("editor.stage.side", "Side"), className: "cz-seg", children: ["front", "back"].map((C) => /* @__PURE__ */ r(
            "button",
            {
              type: "button",
              role: "radio",
              "aria-checked": h === C,
              className: h === C ? "cz-on" : "",
              onClick: () => {
                p(C), v(null);
              },
              children: C === "front" ? l("editor.side.front", "Front") : l("editor.side.back", "Back")
            },
            C
          )) }) : null,
          /* @__PURE__ */ u("span", { className: "cz-undo", children: [
            /* @__PURE__ */ r("button", { type: "button", className: "cz-icon-button", "aria-label": l("editor.undo", "Undo"), title: l("editor.undo", "Undo"), "aria-disabled": !e.canUndo, onClick: e.undo, children: /* @__PURE__ */ r(vr, { "aria-hidden": "true", className: "cz-flip" }) }),
            /* @__PURE__ */ r("button", { type: "button", className: "cz-icon-button", "aria-label": l("editor.redo", "Redo"), title: l("editor.redo", "Redo"), "aria-disabled": !e.canRedo, onClick: e.redo, children: /* @__PURE__ */ r(gr, { "aria-hidden": "true", className: "cz-flip" }) })
          ] }),
          s ? null : /* @__PURE__ */ u("div", { role: "group", "aria-label": l("editor.full.zoom", "Zoom"), className: "cz-ed-zoom", children: [
            /* @__PURE__ */ r("button", { type: "button", "aria-label": l("editor.full.zoomOut", "Zoom out"), "aria-disabled": Ae === 0, onClick: () => k(st[Math.max(0, Ae - 1)]), children: /* @__PURE__ */ r(Fo, { "aria-hidden": "true" }) }),
            /* @__PURE__ */ r("span", { className: "cz-mono", children: `${String(Math.round(y * 100))}%` }),
            /* @__PURE__ */ r("button", { type: "button", "aria-label": l("editor.full.zoomIn", "Zoom in"), "aria-disabled": Ae === st.length - 1, onClick: () => k(st[Math.min(st.length - 1, Ae + 1)]), children: /* @__PURE__ */ r(To, { "aria-hidden": "true" }) })
          ] }),
          /* @__PURE__ */ u("div", { className: "cz-ed-actions", children: [
            /* @__PURE__ */ r("button", { type: "button", className: "cz-button cz-button-small", disabled: e.busy, onClick: e.onSave, children: l("editor.save", "Save and come back") }),
            /* @__PURE__ */ r("button", { type: "button", className: "cz-primary cz-button-small", "aria-busy": e.busy, onClick: e.onUse, children: l("editor.full.use", "Use this design") })
          ] })
        ] }),
        g ? /* @__PURE__ */ u("div", { role: "status", className: "cz-ed-banner", children: [
          /* @__PURE__ */ r(Kl, { "aria-hidden": "true" }),
          /* @__PURE__ */ r("span", { className: "cz-grow", children: l("editor.full.banner", "You can move anything now; your words stay.") }),
          /* @__PURE__ */ r("button", { type: "button", className: "cz-icon-button cz-ed-banner-close", "aria-label": l("editor.full.hideNote", "Hide this note"), onClick: () => m(!1), children: /* @__PURE__ */ r(Vt, { "aria-hidden": "true" }) })
        ] }) : null,
        /* @__PURE__ */ r(
          "input",
          {
            ref: L,
            type: "file",
            className: "cz-hidden-file",
            tabIndex: -1,
            "aria-hidden": "true",
            onChange: (C) => {
              const T = C.target.files?.[0], U = C.target.dataset.column;
              C.target.value = "", T !== void 0 && U !== void 0 && Re(U, T);
            }
          }
        ),
        /* @__PURE__ */ u("div", { className: "cz-ed-body", children: [
          s ? null : /* @__PURE__ */ u("nav", { "aria-label": l("editor.full.tools", "Tools"), className: "cz-ed-rail", children: [
            we.map((C) => /* @__PURE__ */ r("button", { type: "button", className: "cz-ed-tool", "aria-label": C.label, title: C.label, onClick: () => We(C), children: C.icon }, C.key)),
            /* @__PURE__ */ r("span", { className: "cz-ed-rule" }),
            At
          ] }),
          /* @__PURE__ */ r("div", { className: "cz-ed-canvas", children: /* @__PURE__ */ u("div", { className: "cz-ed-card", children: [
            _e.map((C) => d.transfers[C] === void 0 ? null : /* @__PURE__ */ r(Ro, { transfer: d.transfers[C], label: l("editor.full.sending", "Uploading your image") }, C)),
            _e.map((C) => {
              const T = d.problems[C];
              return T === void 0 ? null : /* @__PURE__ */ u("p", { role: "alert", className: "cz-error", children: [
                /* @__PURE__ */ r(Jt, { "aria-hidden": "true" }),
                /* @__PURE__ */ u("span", { children: [
                  T.text,
                  T.detail === void 0 ? null : /* @__PURE__ */ r("span", { lang: "en", className: "cz-detail", children: T.detail })
                ] })
              ] }, C);
            }),
            /* @__PURE__ */ r(
              aa,
              {
                face: tt,
                drawn: Fd(_, i, d.pictures, oo),
                guides: z,
                selected: D?.id ?? null,
                label: l("editor.full.card", "Your design, {side}", { side: h === "front" ? l("editor.side.front", "Front") : l("editor.side.back", "Back") }),
                ...s ? {} : { width: Math.round(ca * y) },
                interactive: { describedBy: S, onPointerDown: Oe, onPointerMove: re, onPointerUp: Ue, onKeyDown: Mt, onSelect: v, selectLabel: (C) => l("editor.full.select", "Select {name}", { name: _.find((T) => T.id === C)?.name ?? "" }) }
              }
            ),
            z ? /* @__PURE__ */ u("div", { className: "cz-legend", children: [
              /* @__PURE__ */ u("span", { className: "cz-legend-item", children: [
                /* @__PURE__ */ r("span", { className: "cz-legend-trim" }),
                l("editor.stage.trim", "Trim")
              ] }),
              /* @__PURE__ */ u("span", { className: "cz-legend-item", children: [
                /* @__PURE__ */ r("span", { className: "cz-legend-bleed" }),
                l("editor.stage.bleed", "Bleed"),
                " ",
                /* @__PURE__ */ r("span", { className: "cz-mono", children: `${String(c.bleed)} mm` })
              ] }),
              c.safe === null ? null : /* @__PURE__ */ u("span", { className: "cz-legend-item", children: [
                /* @__PURE__ */ r("span", { className: "cz-legend-safe" }),
                l("editor.stage.safe", "Safe line"),
                " ",
                /* @__PURE__ */ r("span", { className: "cz-mono", children: `${String(c.safe)} mm` })
              ] })
            ] }) : null,
            /* @__PURE__ */ r("p", { id: S, className: "cz-small cz-ed-note", children: l("editor.full.note", "Drag to move, or use the arrow keys. Anything outside the safe line may be trimmed off.") })
          ] }) }),
          s ? null : /* @__PURE__ */ r("aside", { "aria-label": l("editor.full.properties", "Properties"), className: "cz-ed-panel", children: ot })
        ] }),
        s ? /* @__PURE__ */ u("nav", { "aria-label": l("editor.full.tools", "Tools"), className: "cz-ed-foot", children: [
          we.map((C) => /* @__PURE__ */ r("button", { type: "button", className: "cz-ed-tool", "aria-label": C.label, title: C.label, onClick: () => We(C), children: C.icon }, C.key)),
          At,
          /* @__PURE__ */ u("button", { type: "button", className: "cz-button cz-button-small cz-push", onClick: () => x(!0), children: [
            /* @__PURE__ */ r(ed, { "aria-hidden": "true" }),
            l("editor.full.properties", "Properties")
          ] })
        ] }) : null,
        s && P ? /* @__PURE__ */ u(Ct, { labelledBy: "cz-ed-sheet-title", onClose: () => x(!1), className: "cz-oc cz-oc-foot cz-ed-sheet", scrimClass: "cz-scrim cz-scrim-sheet", children: [
          /* @__PURE__ */ u("div", { className: "cz-oc-head", children: [
            /* @__PURE__ */ r("h2", { id: "cz-ed-sheet-title", className: "cz-oc-title", children: l("editor.full.properties", "Properties") }),
            /* @__PURE__ */ r("button", { type: "button", className: "cz-icon-button cz-push", "aria-label": l("editor.close", "Close"), onClick: () => x(!1), children: /* @__PURE__ */ r(Vt, { "aria-hidden": "true" }) })
          ] }),
          /* @__PURE__ */ r("div", { className: "cz-oc-body", children: ot })
        ] }) : null
      ]
    }
  );
}
function ha(e) {
  const { part: t, shown: o, palette: i, catalogue: n, patch: d } = e, { t: s } = R(), l = n.base, c = (g) => Math.round(g * 10) / 10 + 0, a = { paper: s("editor.full.paper", "Paper"), ink: s("editor.full.ink", "Ink"), accent: s("editor.full.accent", "Accent") }, h = [...Object.keys(vo).map((g) => ({ value: g, hex: Ve(i, g, g), name: `${a[g] ?? g} (${Ve(i, g, g)})` })), ...Cd.map((g) => ({ value: g, hex: g, name: g }))], p = [...o].reverse(), f = t === null ? null : kt(t), v = (() => {
    if (t === null || t.kind !== "text" || e.measure === void 0 || l.safe === null || f === null) return !1;
    const g = Math.max(0, ...(t.text ?? "").split(/\r?\n/).map((P) => e.measure(P, t.font ?? "Manrope", (t.size ?? 9) * (25.4 / 72), t.weight ?? 400))), m = t.align === "center" ? f.x + (f.w - g) / 2 : t.align === "end" ? f.x + f.w - g : f.x;
    return m < l.safe - 0.01 || m + g > l.width - l.safe + 0.01 || f.y < l.safe - 0.01 || f.y + f.h > l.height - l.safe + 0.01;
  })(), y = t === null ? void 0 : e.answer.advice.find((g) => g.part === t.id && g.kind === "blurry"), k = (g) => {
    if (t === null || f === null) return;
    const m = g === "left" ? { x: 0 } : g === "centre" ? { x: c((l.width - f.w) / 2) } : g === "right" ? { x: c(l.width - f.w) } : g === "top" ? { y: 0 } : g === "middle" ? { y: c((l.height - f.h) / 2) } : { y: c(l.height - f.h) };
    d(t.id, m);
  }, z = (g, m, P) => /* @__PURE__ */ u("label", { className: "cz-ed-geom", children: [
    /* @__PURE__ */ r("span", { className: "cz-mono cz-ed-geom-key", children: m }),
    /* @__PURE__ */ r(
      "input",
      {
        type: "number",
        step: 0.5,
        className: "cz-mono",
        value: String(g === "h" && f !== null ? f.h : t?.[g] ?? 0),
        "aria-label": P,
        onChange: (x) => {
          const M = parseFloat(x.target.value);
          t !== null && !Number.isNaN(M) && d(t.id, { [g]: c(M) }, `${g}:${t.id}`);
        },
        onBlur: e.endGesture
      }
    )
  ] }, g), A = t?.kind === "image" && t.file !== void 0 ? e.pictures.pictures[t.file] : void 0;
  return /* @__PURE__ */ u("div", { className: "cz-ed-inspector", children: [
    t === null ? /* @__PURE__ */ r("p", { className: "cz-small", children: s("editor.full.nothing", "Nothing selected. Tap something on the card, or add words, an image or a shape from the tools.") }) : /* @__PURE__ */ u(ee, { children: [
      /* @__PURE__ */ u("div", { className: "cz-ed-selected", children: [
        /* @__PURE__ */ r("span", { className: "cz-strong cz-ellipsis cz-grow", children: t.name ?? t.kind }),
        /* @__PURE__ */ r("button", { type: "button", className: "cz-icon-button", "aria-label": s("editor.full.delete", "Delete"), title: s("editor.full.delete", "Delete"), onClick: () => e.onRemove(t.id), children: /* @__PURE__ */ r(pt, { "aria-hidden": "true" }) })
      ] }),
      /* @__PURE__ */ u("div", { className: "cz-ed-group", children: [
        /* @__PURE__ */ u("span", { className: "cz-ed-kicker", children: [
          s("editor.full.position", "Position and size"),
          " ",
          /* @__PURE__ */ r("span", { className: "cz-mono", children: "mm" })
        ] }),
        /* @__PURE__ */ u("div", { className: "cz-ed-grid", children: [
          z("x", "X", s("editor.full.across", "Across in millimetres")),
          z("y", "Y", s("editor.full.down", "Down in millimetres")),
          z("w", "W", s("editor.full.width", "Width in millimetres")),
          t.kind === "text" ? null : z("h", "H", s("editor.full.height", "Height in millimetres"))
        ] })
      ] }),
      /* @__PURE__ */ u("div", { className: "cz-ed-group", children: [
        /* @__PURE__ */ r("span", { className: "cz-ed-kicker", children: s("editor.full.alignPage", "Align to the page") }),
        /* @__PURE__ */ r("div", { role: "group", "aria-label": s("editor.full.alignPage", "Align to the page"), className: "cz-ed-aligns", children: [
          ["left", Cl, s("editor.full.alignLeft", "Align to the left edge")],
          ["centre", bl, s("editor.full.alignCentre", "Centre across")],
          ["right", xl, s("editor.full.alignRight", "Align to the right edge")],
          ["top", Pl, s("editor.full.alignTop", "Align to the top")],
          ["middle", vl, s("editor.full.alignMiddle", "Centre down")],
          ["bottom", wl, s("editor.full.alignBottom", "Align to the bottom")]
        ].map(([g, m, P]) => /* @__PURE__ */ r("button", { type: "button", className: "cz-ed-tool cz-ed-tool-small", "aria-label": P, title: P, onClick: () => k(g), children: /* @__PURE__ */ r(m, { "aria-hidden": "true" }) }, g)) })
      ] }),
      t.kind === "text" ? /* @__PURE__ */ u("div", { className: "cz-ed-group", children: [
        /* @__PURE__ */ u("label", { className: "cz-ed-field", children: [
          /* @__PURE__ */ r("span", { className: "cz-ed-kicker", children: s("editor.full.words", "Words") }),
          /* @__PURE__ */ r("textarea", { className: "cz-input cz-ed-words", rows: 2, value: t.text ?? "", onChange: (g) => d(t.id, { text: g.target.value, h: mt(t.size ?? 9, g.target.value.split(/\r?\n/).length) }, `text:${t.id}`), onBlur: e.endGesture })
        ] }),
        /* @__PURE__ */ u("div", { className: "cz-ed-pair", children: [
          /* @__PURE__ */ u("label", { className: "cz-ed-field", children: [
            /* @__PURE__ */ r("span", { className: "cz-tool-label", children: s("editor.fields.font", "Font") }),
            /* @__PURE__ */ r("select", { className: "cz-select", value: t.font ?? "", onChange: (g) => d(t.id, { font: g.target.value }), children: e.fonts.map((g) => /* @__PURE__ */ r("option", { value: g.family, children: g.name }, g.family)) })
          ] }),
          /* @__PURE__ */ u("label", { className: "cz-ed-field", children: [
            /* @__PURE__ */ r("span", { className: "cz-tool-label", children: s("editor.fields.size", "Size") }),
            /* @__PURE__ */ u("span", { className: "cz-ed-unit", children: [
              /* @__PURE__ */ r(
                "input",
                {
                  type: "number",
                  step: 0.5,
                  min: 4,
                  max: 200,
                  "aria-label": s("editor.full.sizePt", "Size in points"),
                  className: "cz-mono",
                  value: String(t.size ?? 9),
                  onChange: (g) => {
                    const m = parseFloat(g.target.value);
                    m >= 4 && m <= 200 && d(t.id, { size: m, h: mt(m, (t.text ?? "").split(/\r?\n/).length) }, `size:${t.id}`);
                  },
                  onBlur: e.endGesture
                }
              ),
              /* @__PURE__ */ r("span", { className: "cz-mono", children: "pt" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ u("div", { className: "cz-ed-pair cz-ed-pair-end", children: [
          /* @__PURE__ */ u("label", { className: "cz-ed-field", children: [
            /* @__PURE__ */ r("span", { className: "cz-tool-label", children: s("editor.full.weight", "Weight") }),
            /* @__PURE__ */ r("select", { className: "cz-select", value: String(t.weight ?? 400), onChange: (g) => d(t.id, { weight: Number(g.target.value) }), children: Md.map((g) => /* @__PURE__ */ r("option", { value: String(g), children: g === 400 ? s("editor.full.regular", "Regular") : g === 500 ? s("editor.full.medium", "Medium") : g === 600 ? s("editor.full.semibold", "Semibold") : g === 700 ? s("editor.full.bold", "Bold") : s("editor.full.extrabold", "Extrabold") }, g)) })
          ] }),
          /* @__PURE__ */ r("div", { role: "radiogroup", "aria-label": s("editor.full.alignment", "Alignment"), className: "cz-ed-aligns", children: [
            ["start", Nl, s("editor.full.start", "Start")],
            ["center", zl, s("editor.full.centre", "Centre")],
            ["end", Sl, s("editor.full.end", "End")]
          ].map(([g, m, P]) => /* @__PURE__ */ r("button", { type: "button", role: "radio", "aria-checked": (t.align ?? "start") === g, className: (t.align ?? "start") === g ? "cz-ed-tool cz-ed-tool-small cz-on" : "cz-ed-tool cz-ed-tool-small", "aria-label": P, title: P, onClick: () => d(t.id, { align: g }), children: /* @__PURE__ */ r(m, { "aria-hidden": "true" }) }, g)) })
        ] }),
        v ? /* @__PURE__ */ u("p", { role: "status", className: "cz-advice", children: [
          /* @__PURE__ */ r(Do, { "aria-hidden": "true" }),
          s("editor.full.safe", "This runs past the safe line. Make it smaller or move it in.")
        ] }) : null
      ] }) : null,
      t.kind === "image" ? /* @__PURE__ */ u("div", { className: "cz-ed-group", children: [
        A === void 0 ? null : /* @__PURE__ */ u("div", { className: "cz-file cz-file-print", children: [
          /* @__PURE__ */ r("span", { className: "cz-thumb", children: A.url === void 0 ? /* @__PURE__ */ r("span", { className: "cz-mono cz-thumb-kind", children: A.kind.toUpperCase() }) : /* @__PURE__ */ r("img", { src: A.url, alt: "", className: "cz-thumb-img" }) }),
          /* @__PURE__ */ u("span", { className: "cz-file-text", children: [
            /* @__PURE__ */ r("span", { className: "cz-mono cz-strong cz-ellipsis", children: A.name === "" ? s("editor.fields.kept", "Kept with your design") : A.name }),
            /* @__PURE__ */ r("span", { className: "cz-mono cz-small", children: qo(A, !0) })
          ] })
        ] }),
        /* @__PURE__ */ r("div", { role: "radiogroup", "aria-label": s("editor.full.fitAria", "How it sits in its box"), className: "cz-seg cz-seg-start", children: ["inside", "fill"].map((g) => /* @__PURE__ */ r("button", { type: "button", role: "radio", "aria-checked": (t.fit ?? "inside") === g, className: (t.fit ?? "inside") === g ? "cz-on" : "", onClick: () => d(t.id, { fit: g }), children: g === "inside" ? s("editor.logo.fitInside", "Fit inside") : s("editor.logo.fill", "Fill") }, g)) }),
        y === void 0 || y.kind !== "blurry" ? null : /* @__PURE__ */ u("p", { role: "status", className: "cz-advice", children: [
          /* @__PURE__ */ r(hr, { "aria-hidden": "true" }),
          s("editor.full.blurry", "This picture may print blurry at this size — {dpi} dpi, we need {needs}. A bigger file will be sharper.", { dpi: y.dpi, needs: y.needs })
        ] }),
        /* @__PURE__ */ u("button", { type: "button", className: "cz-button cz-button-small cz-seg-start", onClick: () => e.onPick(t.id), children: [
          /* @__PURE__ */ r(St, { "aria-hidden": "true" }),
          A === void 0 ? s("editor.full.uploadImage", "Upload an image") : s("editor.full.replaceImage", "Replace the image")
        ] }),
        /* @__PURE__ */ r("span", { className: "cz-mono cz-hint", children: `${($t[t.file ?? "logo_file"] ?? []).map((g) => g.toUpperCase()).join(" · ")} · ${Xe}` })
      ] }) : null,
      t.kind === "image" ? null : /* @__PURE__ */ u("div", { className: "cz-ed-group", children: [
        /* @__PURE__ */ r("span", { id: "cz-ed-colour", className: "cz-ed-kicker", children: t.kind === "text" ? s("editor.fields.colour", "Colour") : s("editor.full.fill", "Fill") }),
        /* @__PURE__ */ r("div", { role: "radiogroup", "aria-labelledby": "cz-ed-colour", className: "cz-ed-swatches", children: h.map((g) => {
          const m = (t.colour ?? (t.kind === "text" || t.kind === "line" ? "ink" : "accent")) === g.value;
          return /* @__PURE__ */ r("button", { type: "button", role: "radio", "aria-checked": m, "aria-label": g.name, title: g.name, className: m ? "cz-swatch-button cz-on" : "cz-swatch-button", onClick: () => d(t.id, { colour: g.value }), children: /* @__PURE__ */ r("svg", { width: "22", height: "22", viewBox: "0 0 22 22", "aria-hidden": "true", children: /* @__PURE__ */ r("rect", { x: "1", y: "1", width: "20", height: "20", rx: "5", fill: g.hex, stroke: "rgba(0,0,0,.15)" }) }) }, g.value);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ u("div", { className: "cz-ed-group", children: [
      /* @__PURE__ */ r("span", { className: "cz-ed-kicker", children: s("editor.full.layers", "Layers") }),
      p.length === 0 ? /* @__PURE__ */ r("p", { className: "cz-small", children: s("editor.full.noLayers", "Nothing on this side yet.") }) : /* @__PURE__ */ r("ul", { className: "cz-ed-layers", children: p.map((g) => {
        const m = e.values.placed ?? [], P = m.indexOf(g), x = (B) => {
          const S = m.map((D, b) => ({ item: D, index: b })).filter(({ item: D }) => D.side === g.side), F = S.findIndex(({ index: D }) => D === P), G = S[F + B];
          if (G === void 0) return;
          const _ = [...m];
          [_[P], _[G.index]] = [_[G.index], _[P]], e.change({ ...e.values, placed: _ });
        }, M = g.kind === "text" ? Nt : g.kind === "image" ? Mo : g.kind === "ellipse" ? ur : g.kind === "line" ? Xt : yr, L = g.kind === "text" ? `${g.name ?? ""} — ${(g.text ?? "").split(/\r?\n/)[0] ?? ""}` : g.name ?? g.kind;
        return /* @__PURE__ */ u("li", { className: t?.id === g.id ? "cz-ed-layer cz-on" : "cz-ed-layer", children: [
          /* @__PURE__ */ r(M, { "aria-hidden": "true" }),
          /* @__PURE__ */ r("button", { type: "button", className: "cz-ed-layer-name", "aria-pressed": t?.id === g.id, onClick: () => e.onSelect(g.id), children: L }),
          /* @__PURE__ */ r("button", { type: "button", className: "cz-icon-button cz-icon-small", "aria-label": s("editor.full.forward", "Bring {name} forward", { name: g.name ?? g.kind }), onClick: () => x(1), children: /* @__PURE__ */ r(cr, { "aria-hidden": "true" }) }),
          /* @__PURE__ */ r("button", { type: "button", className: "cz-icon-button cz-icon-small", "aria-label": s("editor.full.backward", "Send {name} back", { name: g.name ?? g.kind }), onClick: () => x(-1), children: /* @__PURE__ */ r(ar, { "aria-hidden": "true" }) })
        ] }, g.id);
      }) })
    ] })
  ] });
}
const fa = { name: "name", title: "organization-title", phone: "tel", email: "email", web: "url", addr: "street-address" };
function ga(e) {
  const { t } = R(), { ready: o, values: i, setDesign: n, palette: d } = e, s = ["front", "back"].filter((l) => l === "front" || e.sides >= 2).map((l) => ({ side: l, parts: e.parts.filter((c) => c.side === l && !c.locked && c.kind !== "shape") })).filter((l) => l.parts.length > 0);
  return /* @__PURE__ */ u("div", { className: "cz-groups", children: [
    s.map((l) => /* @__PURE__ */ u("div", { role: "group", "aria-labelledby": `cz-g-${l.side}`, className: "cz-group", children: [
      /* @__PURE__ */ u("h2", { id: `cz-g-${l.side}`, className: "cz-group-title", children: [
        l.side === "front" ? /* @__PURE__ */ r(Jl, { "aria-hidden": "true" }) : /* @__PURE__ */ r(Bl, { "aria-hidden": "true" }),
        l.side === "front" ? t("editor.side.front", "Front") : t("editor.side.back", "Back")
      ] }),
      /* @__PURE__ */ r("div", { className: "cz-group-fields", children: l.parts.map((c) => c.kind === "picture" ? /* @__PURE__ */ r(ma, { ...e, part: c }, c.code) : c.kind === "text" ? /* @__PURE__ */ r(pa, { ...e, part: c }, c.code) : null) })
    ] }, l.side)),
    o !== null && o.layouts.length > 1 ? /* @__PURE__ */ u("div", { className: "cz-group", children: [
      /* @__PURE__ */ u("h2", { id: "cz-layouts", className: "cz-group-title", children: [
        /* @__PURE__ */ r(_l, { "aria-hidden": "true" }),
        t("editor.fields.layout", "Layout")
      ] }),
      /* @__PURE__ */ r("div", { role: "radiogroup", "aria-labelledby": "cz-layouts", className: "cz-chips", children: o.layouts.map((l) => {
        const c = (i.layout ?? o.layouts[0]?.key) === l.key;
        return /* @__PURE__ */ r("button", { type: "button", role: "radio", "aria-checked": c, className: c ? "cz-chip cz-chip-tall cz-on" : "cz-chip cz-chip-tall", onClick: () => n({ layout: l.key }), children: l.name }, l.key);
      }) })
    ] }) : null,
    o !== null && o.palettes.length > 0 ? /* @__PURE__ */ u("div", { className: "cz-group", children: [
      /* @__PURE__ */ u("h2", { id: "cz-palettes", className: "cz-group-title", children: [
        /* @__PURE__ */ r(Zl, { "aria-hidden": "true" }),
        t("editor.fields.colours", "Colours")
      ] }),
      /* @__PURE__ */ r("p", { className: "cz-small", children: t("editor.fields.coloursSub", "Changes every part that uses them, on both sides.") }),
      /* @__PURE__ */ r("div", { role: "radiogroup", "aria-labelledby": "cz-palettes", className: "cz-chips", children: o.palettes.map((l) => {
        const c = d?.code === l.code;
        return /* @__PURE__ */ u("button", { type: "button", role: "radio", "aria-checked": c, className: c ? "cz-chip cz-chip-tall cz-on" : "cz-chip cz-chip-tall", onClick: () => n({ palette: l.code }), children: [
          /* @__PURE__ */ u("svg", { className: "cz-palette-swatch", width: "32", height: "22", viewBox: "0 0 32 22", "aria-hidden": "true", children: [
            /* @__PURE__ */ r("rect", { x: "0", y: "0", width: "14", height: "22", fill: je(l, "paper") ?? "#ffffff" }),
            /* @__PURE__ */ r("rect", { x: "14", y: "0", width: "9", height: "22", fill: je(l, "ink") ?? "#000000" }),
            /* @__PURE__ */ r("rect", { x: "23", y: "0", width: "9", height: "22", fill: je(l, "accent") ?? "#888888" })
          ] }),
          l.name
        ] }, l.code);
      }) })
    ] }) : null,
    /* @__PURE__ */ u("p", { className: "cz-person", children: [
      /* @__PURE__ */ r(od, { "aria-hidden": "true" }),
      t("editor.fields.person", "A person checks every design before we send your proof.")
    ] })
  ] });
}
function pa({ part: e, values: t, checks: o, setPart: i, onSelect: n, onTyping: d, catalogue: s, palette: l }) {
  const { t: c, locale: a } = R(), [h, p] = O(!1), f = e.text, v = ue(t, e), y = Pe(e.code), k = o.filter((b) => b.part === e.code), z = k.some((b) => b.block), { count: A, limit: g, state: m } = Or(e, v), P = f.fonts ?? (f.font === null ? [] : [f.font]), x = f.sizes === null ? [] : [.../* @__PURE__ */ new Set([f.size, ...f.sizes])].sort((b, N) => b - N), M = f.colours ?? [], L = v.font ?? f.font ?? "", B = v.size ?? f.size, S = v.colour ?? f.colour ?? "ink", F = (b) => l?.colours.find((N) => N.role === b || N.code === b)?.name ?? b, G = (b) => i(e.code, { ...v, ...b }), _ = [`${y}-count`, ...k.map((b, N) => `${y}-m${String(N)}`)].join(" "), D = {
    id: y,
    className: z ? "cz-input cz-input-bad" : k.length > 0 ? "cz-input cz-input-warn" : "cz-input",
    value: v.text ?? "",
    placeholder: e.placeholder,
    "aria-invalid": z,
    "aria-describedby": _,
    onFocus: () => {
      n(e.code), d(!0);
    },
    onBlur: () => d(!1)
  };
  return /* @__PURE__ */ u("div", { className: "cz-field", children: [
    /* @__PURE__ */ u("div", { className: "cz-row-head", children: [
      /* @__PURE__ */ r("label", { htmlFor: y, className: "cz-label", children: e.name }),
      e.required ? /* @__PURE__ */ r("span", { className: "cz-req", children: c("editor.fields.neededLower", "needed") }) : null,
      /* @__PURE__ */ r("span", { id: `${y}-count`, className: `cz-mono cz-counter cz-counter-${m}`, "aria-label": c("editor.fields.counterAria", "{count} of {limit} characters", { count: A, limit: g }), children: c("editor.fields.counter", "{count} / {limit}", { count: A, limit: g }) })
    ] }),
    f.lines > 1 ? /* @__PURE__ */ r("textarea", { ...D, rows: f.lines, onChange: (b) => G({ text: b.target.value }) }) : /* @__PURE__ */ r("input", { ...D, autoComplete: fa[e.code] ?? "off", onChange: (b) => G({ text: b.target.value }) }),
    /* @__PURE__ */ r("div", { "aria-live": "polite", className: "cz-messages", children: k.map((b, N) => /* @__PURE__ */ u("div", { id: `${y}-m${String(N)}`, className: b.block ? "cz-error" : "cz-advice", children: [
      b.block ? /* @__PURE__ */ r(Ce, { icon: b.icon }) : b.icon === "contrast" ? /* @__PURE__ */ r(Ce, { icon: "contrast" }) : /* @__PURE__ */ r(as, { "aria-hidden": "true" }),
      /* @__PURE__ */ u("span", { children: [
        b.inline,
        " ",
        b.fixes.filter(($) => b.kind !== "too-long" || $.label !== c("editor.fix.shorten", "Shorten it")).map(($) => /* @__PURE__ */ r("button", { type: "button", className: "cz-link", onClick: () => i(e.code, $.value), children: $.label }, $.label))
      ] })
    ] }, N)) }),
    P.length > 1 || x.length > 1 || M.length > 1 ? /* @__PURE__ */ u(ee, { children: [
      /* @__PURE__ */ u("button", { type: "button", className: "cz-quiet cz-style-toggle", "aria-expanded": h, "aria-controls": `${y}-style`, onClick: () => p(!h), children: [
        /* @__PURE__ */ r(Nt, { "aria-hidden": "true" }),
        [s.fonts.find((b) => b.family === L)?.name ?? L, yo(B, a), F(S)].filter((b) => b !== "").join(" · "),
        h ? /* @__PURE__ */ r(cr, { "aria-hidden": "true" }) : /* @__PURE__ */ r(ar, { "aria-hidden": "true" })
      ] }),
      h ? /* @__PURE__ */ u("div", { id: `${y}-style`, className: "cz-style", children: [
        P.length > 1 ? /* @__PURE__ */ u("label", { className: "cz-style-item", children: [
          /* @__PURE__ */ r("span", { className: "cz-style-label", children: c("editor.fields.font", "Font") }),
          /* @__PURE__ */ r("select", { className: "cz-select", value: L, onChange: (b) => G({ font: b.target.value }), children: P.map((b) => /* @__PURE__ */ r("option", { value: b, children: s.fonts.find((N) => N.family === b)?.name ?? b }, b)) })
        ] }) : null,
        x.length > 1 ? /* @__PURE__ */ u("label", { className: "cz-style-item", children: [
          /* @__PURE__ */ r("span", { className: "cz-style-label", children: c("editor.fields.size", "Size") }),
          /* @__PURE__ */ r("select", { className: "cz-select cz-mono", value: String(B), onChange: (b) => G({ size: Number(b.target.value) }), children: x.map((b) => /* @__PURE__ */ r("option", { value: String(b), children: yo(b, a) }, b)) })
        ] }) : null,
        M.length > 1 ? /* @__PURE__ */ u("div", { className: "cz-style-item", children: [
          /* @__PURE__ */ r("span", { id: `${y}-colour`, className: "cz-style-label", children: c("editor.fields.colour", "Colour") }),
          /* @__PURE__ */ r("div", { role: "radiogroup", "aria-labelledby": `${y}-colour`, className: "cz-chips", children: M.map((b) => /* @__PURE__ */ r("button", { type: "button", role: "radio", "aria-checked": S === b, "aria-label": F(b), title: F(b), className: S === b ? "cz-swatch-button cz-on" : "cz-swatch-button", onClick: () => G({ colour: b }), children: /* @__PURE__ */ r(Vo, { hex: je(l, b) ?? "#000000", size: 24 }) }, b)) })
        ] }) : null
      ] }) : null
    ] }) : null
  ] });
}
function ma({ part: e, values: t, pictures: o, transfers: i, problems: n, upload: d, setPart: s, checks: l, onSelect: c }) {
  const { t: a, shop: h } = R(), p = e.picture, f = ue(t, e), v = Pe(e.code), y = f.file !== void 0 ? o[p.file] : void 0, k = i[p.file], z = n[p.file], A = Gr(e, p.file, d), g = p.picture === "photo", m = l.filter((L) => L.part === e.code), P = `${v}-err`, x = [...z === void 0 ? [] : [P], ...m.map((L, B) => `${v}-m${String(B)}`)].join(" "), M = f.fit ?? p.fit;
  return /* @__PURE__ */ u("div", { className: "cz-field", children: [
    /* @__PURE__ */ u("div", { className: "cz-row-head", children: [
      /* @__PURE__ */ r("span", { className: "cz-label", children: e.name }),
      e.required ? /* @__PURE__ */ r("span", { className: "cz-req", children: a("editor.fields.neededLower", "needed") }) : null,
      /* @__PURE__ */ r("span", { className: "cz-mono cz-hint cz-push", children: `${$o(e).map((L) => L.toUpperCase()).join(" · ")} · ${Xe}` })
    ] }),
    A.element,
    k !== void 0 ? /* @__PURE__ */ r(Ro, { transfer: k, label: g ? a("editor.upload.sendingPhoto", "Uploading your photo") : a("editor.upload.sendingLogo", "Uploading your logo") }) : f.file === void 0 ? /* @__PURE__ */ u("div", { className: A.over ? "cz-drop cz-drop-centre cz-drop-over" : "cz-drop cz-drop-centre", ...A.drop, children: [
      /* @__PURE__ */ r(Co, { "aria-hidden": "true" }),
      /* @__PURE__ */ r("span", { className: "cz-small", children: g ? a("editor.fields.dropPhoto", "Drop your photo here") : a("editor.fields.dropLogo", "Drop your logo here") }),
      /* @__PURE__ */ u("button", { id: v, type: "button", className: "cz-primary", "aria-describedby": x === "" ? void 0 : x, onFocus: () => c(e.code), onClick: A.pick, children: [
        /* @__PURE__ */ r(St, { "aria-hidden": "true" }),
        g ? a("editor.fields.uploadPhoto", "Upload your photo") : a("editor.fields.uploadLogo", "Upload your logo")
      ] })
    ] }) : /* @__PURE__ */ u(ee, { children: [
      /* @__PURE__ */ u("div", { className: "cz-file cz-file-print", children: [
        /* @__PURE__ */ r("span", { className: "cz-thumb", children: y?.url === void 0 ? /* @__PURE__ */ r("span", { className: "cz-mono cz-thumb-kind", children: y === void 0 ? "" : y.kind.toUpperCase() }) : /* @__PURE__ */ r("img", { src: y.url, alt: "", className: "cz-thumb-img" }) }),
        /* @__PURE__ */ u("span", { className: "cz-file-text", children: [
          /* @__PURE__ */ r("span", { className: "cz-mono cz-strong cz-ellipsis", children: y === void 0 || y.name === "" ? a("editor.fields.kept", "Kept with your design") : y.name }),
          y === void 0 ? null : /* @__PURE__ */ r("span", { className: "cz-mono cz-small", children: qo(y, !0) })
        ] }),
        /* @__PURE__ */ r("button", { id: v, type: "button", className: "cz-button cz-button-small", "aria-describedby": x === "" ? void 0 : x, onFocus: () => c(e.code), onClick: A.pick, children: a("editor.fields.replace", "Replace") }),
        /* @__PURE__ */ r(
          "button",
          {
            type: "button",
            className: "cz-icon-button",
            "aria-label": g ? a("editor.fields.removePhotoPrint", "Remove the photo") : a("editor.fields.removeLogoPrint", "Remove the logo"),
            title: g ? a("editor.fields.removePhotoPrint", "Remove the photo") : a("editor.fields.removeLogoPrint", "Remove the logo"),
            onClick: () => {
              const { file: L, ...B } = f;
              s(e.code, Object.keys(B).length === 0 ? null : B);
            },
            children: /* @__PURE__ */ r(pt, { "aria-hidden": "true" })
          }
        )
      ] }),
      /* @__PURE__ */ r("div", { role: "radiogroup", "aria-label": g ? a("editor.fields.fitPhotoAria", "How the photo sits in its box") : a("editor.logo.fitAria", "How the logo sits in its box"), className: "cz-seg cz-seg-start", children: ["inside", "fill"].map((L) => /* @__PURE__ */ r("button", { type: "button", role: "radio", "aria-checked": M === L, className: M === L ? "cz-on" : "", onClick: () => s(e.code, { ...f, fit: L }), children: L === "inside" ? a("editor.logo.fitInside", "Fit inside") : a("editor.logo.fill", "Fill") }, L)) })
    ] }),
    z === void 0 ? null : /* @__PURE__ */ u("div", { id: P, role: "alert", className: "cz-error", children: [
      /* @__PURE__ */ r(Ce, { icon: "alert" }),
      /* @__PURE__ */ u("span", { children: [
        z.text,
        z.detail === void 0 ? null : /* @__PURE__ */ r("span", { lang: "en", className: "cz-detail", children: z.detail })
      ] })
    ] }),
    m.map((L, B) => /* @__PURE__ */ u("div", { id: `${v}-m${String(B)}`, className: L.block ? "cz-error" : "cz-advice", children: [
      /* @__PURE__ */ r(Ce, { icon: L.icon }),
      /* @__PURE__ */ u("span", { children: [
        L.inline,
        L.detail === void 0 ? null : /* @__PURE__ */ r("span", { className: "cz-mono cz-detail", children: L.detail })
      ] })
    ] }, B)),
    /* @__PURE__ */ u("p", { className: "cz-private", children: [
      /* @__PURE__ */ r(xt, { "aria-hidden": "true" }),
      g ? a("editor.fields.privatePhoto", "Only you and {shop} can see your photo.", { shop: h }) : a("editor.fields.privateLogo", "Only you and {shop} can see your logo.", { shop: h })
    ] })
  ] });
}
const ka = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, Vi = "";
function ya({ email: e, sentTo: t, busy: o, failed: i, onSubmit: n, onClose: d, onBackToShop: s }) {
  const { t: l, look: c, shop: a } = R(), [h, p] = O(e), [f, v] = O(null), y = () => {
    const z = h.trim();
    if (!ka.test(z)) {
      v(z === "" ? l("editor.save.emailNone", "Enter your e-mail so we can send you the link") : l("editor.save.emailBad", "That doesn’t look like an e-mail address. Try name@example.com")), document.getElementById("cz-save-email")?.focus();
      return;
    }
    v(null), n(z);
  }, k = f ?? i;
  return /* @__PURE__ */ r(Ct, { labelledBy: "cz-save-title", onClose: d, children: t === null ? /* @__PURE__ */ u(
    "form",
    {
      className: "cz-dialog-body",
      noValidate: !0,
      onSubmit: (z) => {
        z.preventDefault(), y();
      },
      children: [
        c === "print" ? /* @__PURE__ */ r("span", { className: "cz-tile cz-tile-accent", children: /* @__PURE__ */ r(wt, { "aria-hidden": "true" }) }) : null,
        /* @__PURE__ */ r("h2", { id: "cz-save-title", className: "cz-h2", children: l("editor.save", "Save and come back") }),
        /* @__PURE__ */ r("p", { className: "cz-sub", children: c === "print" ? l("editor.save.bodyPrint", "We save the design and e-mail you a private link to it. Only you and {shop} can open it.", { shop: a }) : l("editor.save.body", "We’ll keep the design and e-mail you a private link to it. Nobody else can open it.") }),
        /* @__PURE__ */ r("label", { htmlFor: "cz-save-email", className: "cz-label", children: c === "print" ? l("editor.save.emailPrint", "E-mail") : l("editor.save.email", "Your e-mail") }),
        /* @__PURE__ */ r("input", { id: "cz-save-email", className: k === null ? "cz-input" : "cz-input cz-input-bad", type: "email", autoComplete: "email", placeholder: "name@example.com", value: h, "aria-invalid": k !== null, "aria-describedby": k === null ? void 0 : "cz-save-err", onChange: (z) => p(z.target.value) }),
        k === null ? null : /* @__PURE__ */ u("span", { id: "cz-save-err", role: "alert", className: "cz-error", children: [
          /* @__PURE__ */ r(Jt, { "aria-hidden": "true" }),
          k
        ] }),
        /* @__PURE__ */ u("div", { className: "cz-dialog-actions", children: [
          /* @__PURE__ */ r("button", { type: "submit", className: "cz-primary cz-grow", "aria-busy": o, "aria-disabled": o, children: c === "print" ? l("editor.save.submitPrint", "Save and send the link") : l("editor.save.submit", "Save it") }),
          /* @__PURE__ */ r("button", { type: "button", className: "cz-button", onClick: d, children: l("editor.cancel", "Cancel") })
        ] })
      ]
    }
  ) : /* @__PURE__ */ u("div", { className: "cz-dialog-body cz-centre", children: [
    /* @__PURE__ */ r("span", { className: "cz-tile cz-tile-good", children: /* @__PURE__ */ r(Ml, { "aria-hidden": "true" }) }),
    /* @__PURE__ */ r("h2", { id: "cz-save-title", className: "cz-h2", children: l("editor.saved.title", "Saved. We’ve e-mailed you a link to come back to it.") }),
    /* @__PURE__ */ r("p", { className: "cz-sub", children: l("editor.saved.sentTo", "Sent to {email}. The link opens your designs and nobody else’s.", { email: Vi }).split(Vi).flatMap((z, A) => A === 0 ? [z] : [/* @__PURE__ */ r("span", { className: "cz-mono", children: t }, A), z]) }),
    /* @__PURE__ */ u("div", { className: "cz-dialog-actions", children: [
      /* @__PURE__ */ r("button", { type: "button", className: "cz-primary cz-grow", autoFocus: !0, onClick: d, children: l("editor.saved.keepGoing", "Keep going") }),
      s === void 0 ? null : /* @__PURE__ */ r("button", { type: "button", className: "cz-button cz-grow", onClick: s, children: l("editor.saved.backToShop", "Back to the shop") })
    ] })
  ] }) });
}
function $i({ checks: e, onGo: t }) {
  const { t: o } = R(), i = e.filter((n) => n.block).length;
  return /* @__PURE__ */ u("div", { "aria-live": "polite", className: "cz-checks", children: [
    /* @__PURE__ */ u("div", { className: "cz-checks-head", children: [
      /* @__PURE__ */ r($l, { "aria-hidden": "true" }),
      /* @__PURE__ */ r("h2", { className: "cz-h3", children: o("editor.checks.title", "Checks") }),
      /* @__PURE__ */ r("span", { className: `cz-mono cz-checks-count ${i > 0 ? "cz-bad" : e.length > 0 ? "cz-warn" : "cz-good"}`, children: e.length > 0 ? o("editor.checks.count", "{n} to look at", { n: e.length }) : o("editor.checks.clear", "All clear") })
    ] }),
    e.length === 0 ? /* @__PURE__ */ u("div", { className: "cz-checks-clear", children: [
      /* @__PURE__ */ r(Fl, { "aria-hidden": "true" }),
      o("editor.checks.nothing", "Nothing to fix. Whether it looks right is what the proof is for.")
    ] }) : e.map((n, d) => /* @__PURE__ */ u("button", { type: "button", className: n.block ? "cz-check cz-bad" : "cz-check cz-warn", onClick: () => t(n.part), children: [
      /* @__PURE__ */ r(Ce, { icon: n.icon }),
      /* @__PURE__ */ r("span", { className: "cz-check-text", children: n.listed }),
      /* @__PURE__ */ r("span", { className: "cz-check-go", children: o("editor.checks.go", "Go to it") }),
      /* @__PURE__ */ r(Tl, { "aria-hidden": "true", className: "cz-flip" })
    ] }, d))
  ] });
}
function dn({ quantity: e }) {
  const { t } = R(), [o, i] = [e.min ?? 1, e.max ?? 999];
  return /* @__PURE__ */ u("div", { role: "group", "aria-label": t("editor.bar.howMany", "How many"), className: "cz-stepper", children: [
    /* @__PURE__ */ r("button", { type: "button", "aria-label": t("editor.bar.fewer", "One fewer"), "aria-disabled": e.value <= o, onClick: () => e.value > o && e.onChange(e.value - 1), children: /* @__PURE__ */ r(Xt, { "aria-hidden": "true" }) }),
    /* @__PURE__ */ r("span", { "aria-live": "polite", className: "cz-mono cz-stepper-value cz-qty", children: e.value }),
    /* @__PURE__ */ r("button", { type: "button", "aria-label": t("editor.bar.more", "One more"), "aria-disabled": e.value >= i, onClick: () => e.value < i && e.onChange(e.value + 1), children: /* @__PURE__ */ r(fr, { "aria-hidden": "true" }) })
  ] });
}
function sn({ quantity: e }) {
  return /* @__PURE__ */ r(ee, { children: (e.breaks ?? []).map((t) => /* @__PURE__ */ u("button", { type: "button", "aria-pressed": e.value === t.qty, className: e.value === t.qty ? "cz-break cz-on" : "cz-break", onClick: () => e.onChange(t.qty), children: [
    /* @__PURE__ */ r("span", { className: "cz-mono", children: t.qty }),
    /* @__PURE__ */ r("span", { className: "cz-mono cz-break-off", children: t.label })
  ] }, t.qty)) });
}
function an({ price: e, big: t = !0 }) {
  const { t: o } = R();
  return e === void 0 ? null : e.pending === !0 ? /* @__PURE__ */ r("span", { role: "status", className: "cz-pending", children: o("editor.bar.working", "Working out the price…") }) : /* @__PURE__ */ r("span", { className: t ? "cz-mono cz-total" : "cz-mono cz-total cz-total-small", children: e.total });
}
function to({ blocks: e, addLabel: t, onAdd: o, busy: i, describedBy: n, className: d = "cz-add" }) {
  const s = e.length > 0;
  return /* @__PURE__ */ u("button", { type: "button", className: s ? `${d} cz-add-off` : d, "aria-disabled": s || i, "aria-describedby": s ? n : void 0, onClick: o, children: [
    /* @__PURE__ */ r(mr, { "aria-hidden": "true" }),
    t
  ] });
}
function va(e) {
  const { t } = R(), { price: o, quantity: i, blocks: n } = e;
  return /* @__PURE__ */ u("div", { className: "cz-bar", children: [
    i === void 0 ? null : /* @__PURE__ */ u("div", { className: "cz-bar-line", children: [
      /* @__PURE__ */ r(dn, { quantity: i }),
      /* @__PURE__ */ r(sn, { quantity: i })
    ] }),
    /* @__PURE__ */ u("div", { className: "cz-bar-line", children: [
      /* @__PURE__ */ u("div", { className: "cz-bar-total", children: [
        /* @__PURE__ */ r(an, { price: o }),
        o?.detail === void 0 ? null : /* @__PURE__ */ r("span", { className: "cz-mono cz-small", children: o.detail })
      ] }),
      /* @__PURE__ */ u("button", { type: "button", className: "cz-save", onClick: e.onSave, children: [
        /* @__PURE__ */ r(wt, { "aria-hidden": "true" }),
        t("editor.save", "Save and come back")
      ] }),
      /* @__PURE__ */ r(to, { ...e, describedBy: "cz-add-why" })
    ] }),
    n.length > 0 ? /* @__PURE__ */ u("span", { id: "cz-add-why", className: "cz-why", children: [
      /* @__PURE__ */ r(xt, { "aria-hidden": "true" }),
      t("editor.bar.fix", "Fix {n, plural, one {# thing} other {# things}} in the checks before it can go in the basket.", { n: n.length })
    ] }) : null,
    o?.note === void 0 ? null : /* @__PURE__ */ u("span", { className: "cz-mono cz-post", children: [
      /* @__PURE__ */ r(sr, { "aria-hidden": "true" }),
      o.note
    ] })
  ] });
}
function ba(e) {
  const { t } = R(), { price: o, quantity: i, blocks: n } = e;
  return /* @__PURE__ */ u("div", { className: "cz-before-bar", children: [
    i !== void 0 && (i.breaks ?? []).length > 0 ? /* @__PURE__ */ r("div", { className: "cz-bar-line", children: /* @__PURE__ */ r(sn, { quantity: i }) }) : null,
    /* @__PURE__ */ u("button", { type: "button", className: "cz-save", onClick: e.onSave, children: [
      /* @__PURE__ */ r(wt, { "aria-hidden": "true" }),
      t("editor.save", "Save and come back")
    ] }),
    n.length > 0 ? /* @__PURE__ */ u("span", { id: "cz-add-why", className: "cz-why", children: [
      /* @__PURE__ */ r(xt, { "aria-hidden": "true" }),
      t("editor.bar.fix", "Fix {n, plural, one {# thing} other {# things}} in the checks before it can go in the basket.", { n: n.length })
    ] }) : null,
    o?.detail === void 0 ? null : /* @__PURE__ */ r("span", { className: "cz-mono cz-small", children: o.detail }),
    o?.note === void 0 ? null : /* @__PURE__ */ u("span", { className: "cz-mono cz-post", children: [
      /* @__PURE__ */ r(sr, { "aria-hidden": "true" }),
      o.note
    ] })
  ] });
}
function za(e) {
  return /* @__PURE__ */ u("div", { className: e.hidden ? "cz-phone-bar cz-gone" : "cz-phone-bar", children: [
    e.quantity === void 0 ? null : /* @__PURE__ */ r(dn, { quantity: e.quantity }),
    /* @__PURE__ */ r(an, { price: e.price, big: !1 }),
    /* @__PURE__ */ r(to, { ...e, describedBy: "cz-add-why" })
  ] });
}
function wa(e) {
  const { t } = R(), { price: o, blocks: i } = e;
  return /* @__PURE__ */ u("div", { role: "region", "aria-label": t("editor.quote.title", "Your quote"), className: "cz-quote", children: [
    /* @__PURE__ */ u("div", { className: "cz-quote-top", children: [
      /* @__PURE__ */ r("div", { "aria-live": "polite", className: "cz-quote-price", children: o === void 0 ? null : o.pending === !0 ? /* @__PURE__ */ r("span", { role: "status", className: "cz-pending", children: t("editor.bar.working", "Working out the price…") }) : /* @__PURE__ */ u(ee, { children: [
        /* @__PURE__ */ u("span", { className: "cz-quote-line", children: [
          /* @__PURE__ */ r("span", { className: "cz-mono cz-total", children: o.total }),
          o.each === void 0 ? null : /* @__PURE__ */ r("span", { className: "cz-mono cz-small", children: t("editor.quote.each", "{price} each", { price: o.each }) })
        ] }),
        o.detail === void 0 ? null : /* @__PURE__ */ r("span", { className: "cz-small", children: o.detail })
      ] }) }),
      o?.ready === void 0 ? null : /* @__PURE__ */ u("span", { className: "cz-ready", children: [
        /* @__PURE__ */ r(Al, { "aria-hidden": "true" }),
        t("editor.quote.ready", "Ready {date}", { date: o.ready })
      ] })
    ] }),
    /* @__PURE__ */ u("div", { className: "cz-quote-actions", children: [
      /* @__PURE__ */ r(to, { ...e, describedBy: "cz-block", className: "cz-add cz-grow" }),
      /* @__PURE__ */ u("button", { type: "button", className: "cz-save cz-grow", onClick: e.onSave, children: [
        /* @__PURE__ */ r(wt, { "aria-hidden": "true" }),
        t("editor.save", "Save and come back")
      ] })
    ] }),
    i.length > 0 ? /* @__PURE__ */ r(cn, { id: "cz-block", blocks: i, onShow: e.onShow }) : null,
    e.nothingAdded ? /* @__PURE__ */ r("p", { className: "cz-small", children: t("editor.quote.nothingAdded", "Customising adds nothing to the price.") }) : null
  ] });
}
function cn({ id: e, blocks: t, onShow: o }) {
  const { t: i } = R();
  return /* @__PURE__ */ u("p", { id: e, className: "cz-block", children: [
    /* @__PURE__ */ r(Jt, { "aria-hidden": "true" }),
    /* @__PURE__ */ u("span", { children: [
      t[0].listed,
      t.length > 1 ? ` ${i("editor.quote.more", "And {n} more.", { n: t.length - 1 })}` : "",
      " ",
      /* @__PURE__ */ r("button", { type: "button", className: "cz-link", onClick: o, children: i("editor.quote.show", "Show me") })
    ] })
  ] });
}
function xa(e) {
  const { t } = R(), { price: o } = e;
  return /* @__PURE__ */ u("div", { role: "region", "aria-label": t("editor.quote.title", "Your quote"), className: e.hidden ? "cz-quote-bar cz-gone" : "cz-quote-bar", children: [
    /* @__PURE__ */ r("div", { "aria-live": "polite", className: "cz-quote-bar-price", children: o === void 0 ? null : o.pending === !0 ? /* @__PURE__ */ r("span", { role: "status", className: "cz-pending", children: t("editor.bar.working", "Working out the price…") }) : /* @__PURE__ */ u(ee, { children: [
      /* @__PURE__ */ u("span", { className: "cz-quote-line", children: [
        /* @__PURE__ */ r("span", { className: "cz-mono cz-total cz-total-small", children: o.total }),
        o.each === void 0 ? null : /* @__PURE__ */ r("span", { className: "cz-mono cz-small", children: t("editor.quote.each", "{price} each", { price: o.each }) })
      ] }),
      o.ready === void 0 ? null : /* @__PURE__ */ r("span", { className: "cz-small", children: t("editor.quote.ready", "Ready {date}", { date: o.ready }) })
    ] }) }),
    /* @__PURE__ */ r("button", { type: "button", className: "cz-icon-button cz-icon-big", "aria-label": t("editor.save", "Save and come back"), title: t("editor.save", "Save and come back"), onClick: e.onSave, children: /* @__PURE__ */ r(wt, { "aria-hidden": "true" }) }),
    /* @__PURE__ */ r(to, { ...e, describedBy: "cz-block" })
  ] });
}
function Fa(e) {
  const [t, o] = O("loading"), [i, n] = O(0), d = e.readyDesigns;
  J(() => {
    const c = new AbortController();
    return o("loading"), e.api.catalogue(e.base, c.signal).then((a) => {
      const h = Eo(a, e.base, d);
      o(h ?? "missing"), h !== null && ns(e.api, h.fonts);
    }).catch(() => {
      c.signal.aborted || o("failed");
    }), () => c.abort();
  }, [e.api, e.base, i, (d ?? []).join(",")]);
  const s = e.look ?? (typeof t == "object" && t.base.kind === "page" ? "print" : "maker"), l = le(() => Io(e.locale, s, e.shop ?? ""), [e.locale, s, e.shop]);
  return /* @__PURE__ */ r(Bo.Provider, { value: l, children: /* @__PURE__ */ r("div", { className: `cz cz-look-${s}`, dir: jo(l.locale) ? "rtl" : "ltr", lang: l.locale, children: t === "loading" ? /* @__PURE__ */ r(Na, {}) : t === "missing" || t === "failed" ? /* @__PURE__ */ r(Sa, { failed: t === "failed", onRetry: () => n(i + 1), onBack: e.onBack }) : /* @__PURE__ */ r(Pa, { ...e, catalogue: t }) }) });
}
function Na() {
  const { t: e } = R();
  return /* @__PURE__ */ u("div", { className: "cz-loading", role: "status", children: [
    /* @__PURE__ */ r("span", { className: "cz-hidden", children: e("editor.loading", "Loading the designs") }),
    /* @__PURE__ */ r("div", { className: "cz-skel cz-skel-stage" }),
    /* @__PURE__ */ u("div", { className: "cz-skel-col", children: [
      /* @__PURE__ */ r("div", { className: "cz-skel cz-skel-line" }),
      /* @__PURE__ */ r("div", { className: "cz-skel cz-skel-block" }),
      /* @__PURE__ */ r("div", { className: "cz-skel cz-skel-small" })
    ] })
  ] });
}
function Sa({ failed: e, onRetry: t, onBack: o }) {
  const { t: i } = R();
  return /* @__PURE__ */ u("div", { className: "cz-empty", role: "status", children: [
    /* @__PURE__ */ r("span", { className: "cz-tile", children: /* @__PURE__ */ r(gt, { "aria-hidden": "true" }) }),
    /* @__PURE__ */ r("p", { className: "cz-empty-title", children: e ? i("editor.failed", "The designs couldn’t be loaded.") : i("editor.missing", "This product can’t be customised just now.") }),
    /* @__PURE__ */ u("div", { className: "cz-chips", children: [
      e ? /* @__PURE__ */ r("button", { type: "button", className: "cz-primary", onClick: t, children: i("editor.retry", "Try again") }) : null,
      o === void 0 ? null : /* @__PURE__ */ r("button", { type: "button", className: "cz-button", onClick: o, children: i("editor.saved.backToShop", "Back to the shop") })
    ] })
  ] });
}
function Pa(e) {
  const { catalogue: t, api: o } = e, { t: i, look: n, locale: d } = R(), s = Oo(), l = e.design, c = l !== void 0 && "id" in l ? l : null, a = e.sides ?? l?.values.sides ?? 1, [h, p] = O(() => l === void 0 ? null : qe(t, l.ready_design_id)), f = l === void 0 && e.start === "blank" && n === "print", [v, y] = O(() => f || l?.values.placed !== void 0 && l.ready_design_id === null ? "full" : l !== void 0 || t.ready.length === 0 && n === "maker" ? "fill" : "choose"), [k, z] = O(() => ({ past: [], now: f ? { ...ht(t, null, a), placed: [] } : l?.values ?? ht(t, null, a), future: [], typingIn: null })), [A, g] = O(!1), [m, P] = O(c), [x, M] = O(!1), [L, B] = O(null), [S, F] = O(null), [G, _] = O("front"), [D, b] = O(!1), [N, $] = O(1), [I, W] = O(null), [ie, ne] = O(null), [Le, Re] = O(!1), [he, Oe] = O([]), [re, Ue] = O(!1), [Mt, tt] = O({ sentTo: null, failed: null }), [oo, Ae] = O(e.refused ?? null), [io, Lt] = O(!1), we = Q(null), We = Q(null), At = le(() => Ir(), []), [ot, C] = O(e.email ?? null);
  J(() => Ae(e.refused ?? null), [e.refused]);
  const T = k.now, U = { base_id: t.base.id, ready_design_id: h?.id ?? null, values: T }, H = Qt(t, h), de = Pt(t, h, T), ke = Cr(h, T), X = os(o, m, i), fe = q(t.rows.settings?.[0]?.one_colour_threshold) ?? 50, ei = {}, ti = {};
  for (const w of H) {
    const E = w.picture ?? w.text?.alsoLogo;
    E != null && (ti[E.file] = E.accept, E.colour === "one" && (ei[E.file] = yt(T.parts[w.code], fe)));
  }
  const gn = X.facts(m?.files ?? {}, ei, ti), xe = Pd(t, U, gn, At), it = Ed(xe, { t: i, locale: d, look: n, parts: de, values: T, palette: ke, printed: t.base.kind === "printed" }, oo), Ne = it.filter((w) => w.block), rt = m?.state === "ordered", De = xo((w, E = "ok", Z) => {
    const te = Date.now() + Math.random();
    Oe((ye) => [...ye, { id: te, text: w, kind: E, ...Z === void 0 ? {} : { undo: Z } }]), setTimeout(() => Oe((ye) => ye.filter((ve) => ve.id !== te)), Z === void 0 ? 3400 : 6e3);
  }, []), oi = Q(e.onDesignChange);
  oi.current = e.onDesignChange;
  const pn = JSON.stringify([U.ready_design_id, T]);
  J(() => {
    oi.current?.({ design: U, used: xe.used, ok: xe.ok });
  }, [pn, xe.ok, xe.used.join(",")]), J(() => {
    const w = we.current;
    if (w === null) return;
    we.current = null;
    const E = document.getElementById(w);
    E?.focus(), E?.scrollIntoView?.({ block: "center" });
  }), J(() => {
    if (!s || n !== "print" || v !== "fill" || typeof IntersectionObserver > "u" || We.current === null) {
      Lt(!1);
      return;
    }
    const w = new IntersectionObserver(([E]) => Lt(E !== void 0 && !E.isIntersecting && E.boundingClientRect.top < 0));
    return w.observe(We.current), () => w.disconnect();
  }, [s, n, v]);
  const nt = (w, E = null) => {
    Ae(null), z((Z) => E !== null && Z.typingIn === E ? { ...Z, now: w, future: [] } : { past: [...Z.past, Z.now].slice(-100), now: w, future: [], typingIn: E });
  }, ii = (w, E) => {
    const Z = { ...T.parts };
    E === null ? delete Z[w] : Z[w] = E;
    const te = T.parts[w], ye = E !== null && te !== void 0 && Object.keys(E).every((ve) => ve === "text" || E[ve] === te[ve]);
    nt({ ...T, parts: Z }, ye || te === void 0 && E !== null && Object.keys(E).every((ve) => ve === "text") ? w : null), B(w);
  }, mn = (w) => nt({ ...T, ...w }), ro = () => z((w) => w.past.length === 0 ? w : { past: w.past.slice(0, -1), now: w.past[w.past.length - 1], future: [w.now, ...w.future], typingIn: null }), no = () => z((w) => w.future.length === 0 ? w : { past: [...w.past, w.now], now: w.future[0], future: w.future.slice(1), typingIn: null }), ri = (w) => {
    if (!(w.ctrlKey || w.metaKey) || w.altKey) return;
    const E = w.key.toLowerCase();
    E === "z" && !w.shiftKey ? (w.preventDefault(), ro()) : (E === "z" && w.shiftKey || E === "y") && (w.preventDefault(), no());
  }, kn = (w) => {
    B(w);
    const E = w === null ? void 0 : H.find((Z) => Z.code === w);
    E !== void 0 && E.side !== G && _(E.side);
  }, se = (w) => {
    if (w === null) return;
    const E = H.find((Z) => Z.code === w);
    E !== void 0 && E.side !== G && _(E.side), B(w), we.current = Pe(w), F((Z) => Z), setTimeout(() => {
      we.current !== null && (document.getElementById(we.current)?.focus(), we.current = null);
    }, 0);
  }, yn = (w) => {
    p(w), z({ past: [], now: { ...ht(t, w, a), ...vn(T) }, future: [], typingIn: null }), M(!1), B(null), _("front"), y("fill"), typeof window < "u" && window.scrollTo?.({ top: 0 });
  }, vn = (w) => ({ parts: Object.fromEntries(Object.entries(w.parts).filter(([, E]) => (E.text ?? "").trim() !== "").map(([E, Z]) => [E, { text: Z.text }])) }), Dt = () => X.fresh(), ni = Q(T);
  ni.current = T;
  const bn = (w, E, Z) => {
    X.send(E, Z, $o(w)).then((te) => {
      if (te === null) return;
      const ye = ni.current.parts[w.code] ?? {};
      ii(w.code, { ...ye, file: E, ...w.kind === "text" ? { mode: "logo" } : {} }), (w.picture ?? w.text?.alsoLogo)?.colour === "one" && n === "maker" ? (De(i("editor.oneColour.in", "Your logo is in. Check how it engraves.")), li(w.code)) : se(w.code);
    });
  }, li = (w) => {
    ne({ part: w }), W("onecolour");
  }, di = async (w) => {
    const E = m !== null && m.session !== null && m.state === "draft" && (w === null || ot === w), Z = E ? await o.change(m, T, Dt()) : await o.create(U, w, Dt()), te = { ...Z, link: Z.link ?? (E ? m.link : null) ?? null };
    return P(te), X.saved(te), w !== null && C(w), te;
  }, si = (w) => {
    const E = typeof w == "object" && w !== null ? w.code : void 0;
    return E === "PUBLIC_RATE_LIMITED" ? i("editor.error.rate", "Too many tries. Wait a minute and try again.") : E === "PUBLIC_WRITE_REFUSED" ? i("editor.error.refused", "The shop couldn’t take this design as it is. Check it and try again.") : i("editor.error.other", "That couldn’t be saved. Try again.");
  }, ai = async () => {
    if (!re) {
      if (Ne.length > 0) {
        M(!0), se(Ne[0].part);
        return;
      }
      if (e.preview === !0) {
        De(n === "print" ? i("editor.preview.noBasketPrint", "You’re previewing as a customer — nothing goes in a basket.") : i("editor.preview.noBasket", "Previewing — nothing goes in a real basket."), "info");
        return;
      }
      Ue(!0);
      try {
        const w = rt ? await o.create(U, null, Dt()) : await di(null);
        rt && (P(w), X.saved(w)), e.onAddToBasket({ ...w, used: xe.used });
      } catch (w) {
        De(si(w), "warn");
      } finally {
        Ue(!1);
      }
    }
  }, ci = () => {
    if (e.preview === !0) {
      De(n === "print" ? i("editor.preview.noSavePrint", "You’re previewing as a customer — nothing is saved.") : i("editor.preview.noSave", "Previewing — saving is switched off here."), "info");
      return;
    }
    tt({ sentTo: null, failed: null }), W("save");
  }, zn = async (w) => {
    Ue(!0);
    try {
      const E = rt ? await o.create(U, w, Dt()) : await di(w);
      rt && (P(E), X.saved(E), C(w)), tt({ sentTo: w, failed: null }), e.onSaved?.(E, w);
    } catch (E) {
      tt({ sentTo: null, failed: si(E) });
    } finally {
      Ue(!1);
    }
  }, wn = () => {
    p(null), z({ past: [], now: { ...ht(t, null, a), placed: [] }, future: [], typingIn: null }), g(!1), y("full");
  }, xn = () => {
    T.placed === void 0 && nt(Dd(t, h, T)), g(T.placed === void 0), y("full");
  }, Nn = () => {
    nt(Td(t, h, T)), y("fill");
  }, Sn = async () => {
    if ((T.placed ?? []).length === 0) {
      De(i("editor.full.empty", "Add something to the card first."), "warn");
      return;
    }
    if (Ne.length > 0) {
      De(Ne[0].listed, "warn");
      return;
    }
    await ai();
  };
  if (v === "choose")
    return /* @__PURE__ */ u(ee, { children: [
      /* @__PURE__ */ r(Ys, { api: e.api, catalogue: t, product: e.product.name, sides: a, onPick: yn, onBack: e.onBack, onStartBlank: e.onStartBlank ?? (n === "print" && e.preview !== !0 ? wn : void 0), onSendOwnFile: e.onSendOwnFile, onChangeSides: e.onChangeSides }),
      /* @__PURE__ */ r(wo, { toasts: he, onUndo: (w) => w.undo?.() })
    ] });
  const Pn = de.filter((w) => !w.locked && w.kind !== "shape").length, Ke = h === null ? n === "maker" ? i("editor.fill.plain", "Plain piece") : i("editor.fill.yourDesign", "Your design") : h.name, lt = { price: e.price, quantity: e.quantity, blocks: Ne, addLabel: e.addLabel ?? i("editor.add", "Add to basket"), onAdd: () => {
    ai();
  }, onSave: ci, busy: re, hidden: Le }, ui = { catalogue: t, parts: de, values: T, palette: ke, checks: it, selected: L, tried: x, setPart: ii, setDesign: mn, onSelect: kn, onTyping: Re, featurePrices: e.featurePrices ?? {}, pictures: X.pictures, transfers: X.transfers, problems: X.problems, upload: bn, onOneColour: (w) => li(w.code), startThreshold: fe, api: o, session: m?.session ?? null }, ge = ie === null ? null : H.find((w) => w.code === ie.part) ?? null, Tt = i("editor.stage.label", "{product}, {design}. Shown flat.", { product: e.product.name, design: Ke }), hi = /* @__PURE__ */ u("span", { className: "cz-undo", children: [
    /* @__PURE__ */ r("button", { type: "button", className: "cz-icon-button", "aria-label": i("editor.undo", "Undo"), title: i("editor.undo", "Undo"), "aria-disabled": k.past.length === 0, onClick: ro, children: /* @__PURE__ */ r(vr, { "aria-hidden": "true", className: "cz-flip" }) }),
    /* @__PURE__ */ r("button", { type: "button", className: "cz-icon-button", "aria-label": i("editor.redo", "Redo"), title: i("editor.redo", "Redo"), "aria-disabled": k.future.length === 0, onClick: no, children: /* @__PURE__ */ r(gr, { "aria-hidden": "true", className: "cz-flip" }) })
  ] }), fi = rt ? /* @__PURE__ */ r("div", { role: "status", className: "cz-note", children: i("editor.fill.ordered", "This design is with an order already, so it stays as it was. What you change here is saved as a new design.") }) : null, lo = /* @__PURE__ */ u(ee, { children: [
    I === "save" ? /* @__PURE__ */ r(
      ya,
      {
        email: ot ?? "",
        sentTo: Mt.sentTo,
        busy: re,
        failed: Mt.failed,
        onSubmit: (w) => {
          zn(w);
        },
        onClose: () => W(null),
        onBackToShop: e.onBack
      }
    ) : null,
    I === "full" ? /* @__PURE__ */ r(Ma, { catalogue: t, design: U, pictures: X.pictures, side: G, setSide: _, guides: D, setGuides: b, narrow: s, onClose: () => W(null) }) : null,
    I === "onecolour" && ge !== null ? /* @__PURE__ */ r(
      ra,
      {
        catalogue: t,
        part: ge,
        value: ue(T, ge),
        picture: X.pictures[(ge.picture ?? ge.text?.alsoLogo)?.file ?? "logo_file"],
        startThreshold: fe,
        fine: it.some((w) => w.part === ge.code && w.kind === "fine-detail"),
        narrow: s,
        onThreshold: (w) => {
          Ae(null), z((E) => {
            const Z = { ...E.now.parts, [ge.code]: { ...E.now.parts[ge.code] ?? {}, threshold: w } }, te = { ...E.now, parts: Z };
            return E.typingIn === `threshold:${ge.code}` ? { ...E, now: te, future: [] } : { past: [...E.past, E.now].slice(-100), now: te, future: [], typingIn: `threshold:${ge.code}` };
          });
        },
        onUse: () => {
          W(null), z((w) => ({ ...w, typingIn: null })), De(i("editor.oneColour.set", "Set to engrave in one colour."));
        },
        onCancel: () => {
          W(null), z((w) => w.typingIn === `threshold:${ge.code}` && w.past.length > 0 ? { past: w.past.slice(0, -1), now: w.past[w.past.length - 1], future: [], typingIn: null } : { ...w, typingIn: null });
        }
      }
    ) : null,
    /* @__PURE__ */ r(wo, { toasts: he, onUndo: (w) => w.undo?.(), raised: s })
  ] });
  if (v === "full")
    return /* @__PURE__ */ u(ee, { children: [
      /* @__PURE__ */ r(
        ua,
        {
          catalogue: t,
          values: T,
          palette: ke,
          sides: a,
          from: h?.name ?? null,
          answer: xe,
          pictures: X,
          narrow: s,
          canUndo: k.past.length > 0,
          canRedo: k.future.length > 0,
          change: (w, E) => nt(w, E ?? null),
          endGesture: () => z((w) => ({ ...w, typingIn: null })),
          undo: ro,
          redo: no,
          onBack: () => h !== null ? y("fill") : t.ready.length > 0 ? y("choose") : e.onBack?.(),
          onSave: ci,
          onUse: () => {
            Sn();
          },
          toast: De,
          busy: re,
          banner: A
        }
      ),
      lo
    ] });
  if (n === "maker") {
    const w = de.find((ao) => ao.kind === "colour"), E = w === void 0 ? void 0 : T.parts[w.code]?.choice ?? w.start?.choice, Z = w === void 0 ? void 0 : t.shared[w.palette ?? ""]?.find((ao) => ao.code === E)?.name ?? E, te = t.base.material === null ? null : t.base.kind === "printed" && Z !== void 0 ? `${t.base.material} · ${Z}` : t.base.thickness === null ? t.base.material : `${t.base.material} ${String(t.base.thickness)} mm`, ye = t.base.kind === "kit", ve = ye ? t.base.depth : t.base.thickness, Ft = [t.base.width, t.base.height, ...ve === null ? [] : [ve]].map(String).join(" × ") + " mm" + (ye && t.rows.pieces.length > 0 ? ` · ${i("editor.stage.pieces", "{n, plural, one {# piece} other {# pieces}}", { n: t.rows.pieces.length })}` : "");
    return /* @__PURE__ */ u("section", { className: "cz-fill cz-fill-maker", "data-screen": "fill", onKeyDown: ri, children: [
      /* @__PURE__ */ u("div", { className: "cz-stage-col", children: [
        t.base.kind === "kit" ? /* @__PURE__ */ r(
          Vs,
          {
            api: e.api,
            catalogue: t,
            design: U,
            pictures: X.pictures,
            startThreshold: fe,
            narrow: s,
            product: e.product.name,
            designName: Ke,
            size: Ft,
            material: te,
            onPart: se,
            selected: L,
            lockShown: S,
            onLock: F
          }
        ) : t.base.kind === "printed" ? /* @__PURE__ */ r(
          Us,
          {
            api: e.api,
            catalogue: t,
            design: U,
            pictures: X.pictures,
            startThreshold: fe,
            narrow: s,
            product: e.product.name,
            designName: Ke,
            size: Ft,
            material: te,
            onPart: se,
            flat: /* @__PURE__ */ r(ae, { catalogue: t, design: U, pictures: X.pictures, startThreshold: fe, empty: "dim", onPart: se, selected: L, lockShown: S, onLock: F, label: Tt })
          }
        ) : t.base.kind === "piece" ? /* @__PURE__ */ r(
          Rt,
          {
            api: e.api,
            catalogue: t,
            design: U,
            pictures: X.pictures,
            startThreshold: fe,
            narrow: s,
            product: e.product.name,
            designName: Ke,
            size: Ft,
            material: te,
            onPart: se,
            flat: /* @__PURE__ */ r(ae, { catalogue: t, design: U, pictures: X.pictures, startThreshold: fe, empty: "dim", onPart: se, selected: L, lockShown: S, onLock: F, label: Tt })
          }
        ) : /* @__PURE__ */ u("div", { className: "cz-stage", children: [
          /* @__PURE__ */ r(ae, { catalogue: t, design: U, pictures: X.pictures, startThreshold: fe, empty: "dim", onPart: se, selected: L, lockShown: S, onLock: F, label: Tt }),
          /* @__PURE__ */ u("span", { className: "cz-stage-labels", children: [
            /* @__PURE__ */ r("span", { className: "cz-mono cz-stage-label", children: Ft }),
            te === null ? null : /* @__PURE__ */ r("span", { className: "cz-stage-label", children: te })
          ] })
        ] }),
        t.ready.length === 0 ? /* @__PURE__ */ u("div", { role: "status", className: "cz-note cz-note-dashed", children: [
          /* @__PURE__ */ r(gt, { "aria-hidden": "true" }),
          /* @__PURE__ */ u("span", { children: [
            /* @__PURE__ */ r("span", { className: "cz-strong", children: i("editor.fill.noneTitle", "No ready-made designs for this one") }),
            /* @__PURE__ */ r("span", { className: "cz-small", children: i("editor.fill.noneBody", "You’re starting with the plain piece. Add your words where the studio allows them.") })
          ] })
        ] }) : null
      ] }),
      /* @__PURE__ */ u("div", { className: "cz-side-col", children: [
        /* @__PURE__ */ u("div", { className: "cz-title", children: [
          /* @__PURE__ */ r("h1", { className: "cz-h1", children: e.product.name }),
          /* @__PURE__ */ u("div", { className: "cz-title-line", children: [
            /* @__PURE__ */ u("span", { className: "cz-pill", children: [
              /* @__PURE__ */ r(Gl, { "aria-hidden": "true" }),
              h === null ? Ke : i("editor.fill.design", "Design: {name}", { name: h.name })
            ] }),
            t.ready.length > 0 && e.preview !== !0 ? /* @__PURE__ */ r("button", { type: "button", className: "cz-link", onClick: () => y("choose"), children: i("editor.fill.change", "Change the design") }) : null,
            e.product.price === void 0 ? null : /* @__PURE__ */ u("span", { className: "cz-push cz-base-price", children: [
              /* @__PURE__ */ r("span", { className: "cz-mono cz-strong", children: e.product.price }),
              e.product.unit === void 0 ? null : /* @__PURE__ */ r("span", { className: "cz-small", children: e.product.unit })
            ] })
          ] })
        ] }),
        fi,
        /* @__PURE__ */ u("div", { className: "cz-card-box", children: [
          /* @__PURE__ */ u("div", { className: "cz-card-head", children: [
            /* @__PURE__ */ r("span", { className: "cz-tile cz-tile-accent cz-tile-small", children: /* @__PURE__ */ r(Hl, { "aria-hidden": "true" }) }),
            /* @__PURE__ */ r("h2", { className: "cz-h3", children: i("editor.fill.makeItYours", "Make it yours") }),
            hi,
            /* @__PURE__ */ r("span", { className: "cz-mono cz-kicker", children: i("editor.fill.toChange", "{n} TO CHANGE", { n: Pn }) })
          ] }),
          /* @__PURE__ */ r(Hs, { ...ui }),
          /* @__PURE__ */ u("div", { className: "cz-card-foot", children: [
            /* @__PURE__ */ r(Rl, { "aria-hidden": "true" }),
            i("editor.fill.proof", "We’ll send you a proof before we cut anything.")
          ] })
        ] }),
        /* @__PURE__ */ r($i, { checks: it, onGo: se }),
        s ? /* @__PURE__ */ u(ee, { children: [
          /* @__PURE__ */ r(ba, { ...lt }),
          /* @__PURE__ */ r(za, { ...lt })
        ] }) : /* @__PURE__ */ r(va, { ...lt })
      ] }),
      lo
    ] });
  }
  const so = a >= 2 && t.base.sides >= 2, gi = S === null ? null : H.find((w) => w.code === S) ?? null, Cn = `${String(t.base.width)} × ${String(t.base.height)} mm`;
  return /* @__PURE__ */ u("section", { className: "cz-fill cz-fill-print", "data-screen": "fill", onKeyDown: ri, children: [
    s && io && !Le ? /* @__PURE__ */ r("button", { type: "button", className: "cz-strip", "aria-label": i("editor.stage.full", "Full-screen preview"), onClick: () => W("full"), children: /* @__PURE__ */ r(ae, { catalogue: t, design: U, pictures: X.pictures, startThreshold: fe, side: G, empty: "dim", className: "cz-strip-drawing" }) }) : null,
    /* @__PURE__ */ u("button", { type: "button", className: "cz-back", onClick: () => y("choose"), children: [
      /* @__PURE__ */ r(zt, { "aria-hidden": "true", className: "cz-flip" }),
      i("editor.fill.allDesigns", "All designs")
    ] }),
    /* @__PURE__ */ u("div", { className: "cz-title-row", children: [
      /* @__PURE__ */ u("div", { className: "cz-title", children: [
        /* @__PURE__ */ r("h1", { className: "cz-h1", children: Ke }),
        /* @__PURE__ */ u("p", { className: "cz-sub", children: [
          e.product.name,
          " · ",
          /* @__PURE__ */ r("span", { className: "cz-mono", children: Cn }),
          " · ",
          so ? i("editor.sides.both", "both sides") : i("editor.sides.one", "one side")
        ] })
      ] }),
      hi,
      e.preview === !0 || T.placed !== void 0 ? null : /* @__PURE__ */ u("button", { type: "button", className: "cz-button", onClick: xn, children: [
        /* @__PURE__ */ r(vi, { "aria-hidden": "true" }),
        i("editor.fill.fullEditor", "Switch to the full editor")
      ] })
    ] }),
    fi,
    T.placed !== void 0 ? /* @__PURE__ */ u("div", { className: "cz-in-full", children: [
      /* @__PURE__ */ r(vi, { "aria-hidden": "true", className: "cz-in-full-icon" }),
      /* @__PURE__ */ r("h2", { className: "cz-h3", children: i("editor.full.inFull", "This design is in the full editor") }),
      /* @__PURE__ */ r("p", { className: "cz-small", children: i("editor.full.inFullBody", "You’ve moved things around, so the form no longer fits it. Carry on in the editor, or go back to the form and lose the moves. Your words stay either way.") }),
      /* @__PURE__ */ u("div", { className: "cz-chips", children: [
        /* @__PURE__ */ r("button", { type: "button", className: "cz-primary", onClick: () => y("full"), children: i("editor.full.open", "Open the full editor") }),
        /* @__PURE__ */ r("button", { type: "button", className: "cz-button", onClick: Nn, children: i("editor.full.toForm", "Go back to the form") })
      ] })
    ] }) : /* @__PURE__ */ u("div", { className: "cz-fill-grid", children: [
      /* @__PURE__ */ u("div", { className: "cz-card-col", children: [
        /* @__PURE__ */ u("div", { ref: We, className: "cz-sheet", children: [
          /* @__PURE__ */ u("div", { className: "cz-sheet-tools", children: [
            so ? /* @__PURE__ */ r(un, { side: G, setSide: _ }) : null,
            s ? /* @__PURE__ */ r("button", { type: "button", "aria-pressed": D, className: D ? "cz-chip cz-on" : "cz-chip", onClick: () => b(!D), children: i("editor.stage.guides", "Guides") }) : /* @__PURE__ */ r(hn, { guides: D, setGuides: b }),
            /* @__PURE__ */ u("span", { className: "cz-push cz-sheet-end", children: [
              s ? null : /* @__PURE__ */ r(Ca, { zoom: N, setZoom: $ }),
              /* @__PURE__ */ r("button", { type: "button", className: "cz-icon-button", "aria-label": i("editor.stage.full", "Full-screen preview"), title: i("editor.stage.full", "Full-screen preview"), onClick: () => W("full"), children: /* @__PURE__ */ r(Ul, { "aria-hidden": "true" }) })
            ] })
          ] }),
          /* @__PURE__ */ r("div", { className: s || N === 1 ? "cz-stage cz-stage-page" : `cz-stage cz-stage-page cz-zoomed cz-zoom-${String(N * 100)}`, children: /* @__PURE__ */ r(ae, { catalogue: t, design: U, pictures: X.pictures, startThreshold: fe, side: G, guides: D, empty: "dim", onPart: se, selected: L, lockShown: S, onLock: F, label: Tt }) }),
          !s && D ? /* @__PURE__ */ u("div", { className: "cz-legend", children: [
            /* @__PURE__ */ u("span", { className: "cz-legend-item", children: [
              /* @__PURE__ */ r("span", { className: "cz-legend-trim" }),
              i("editor.stage.trim", "Trim")
            ] }),
            /* @__PURE__ */ u("span", { className: "cz-legend-item", children: [
              /* @__PURE__ */ r("span", { className: "cz-legend-bleed" }),
              i("editor.stage.bleed", "Bleed"),
              " ",
              /* @__PURE__ */ r("span", { className: "cz-mono", children: `${String(t.base.bleed)} mm` })
            ] }),
            t.base.safe === null ? null : /* @__PURE__ */ u("span", { className: "cz-legend-item", children: [
              /* @__PURE__ */ r("span", { className: "cz-legend-safe" }),
              i("editor.stage.safe", "Safe line"),
              " ",
              /* @__PURE__ */ r("span", { className: "cz-mono", children: `${String(t.base.safe)} mm` })
            ] })
          ] }) : null,
          /* @__PURE__ */ r("div", { "aria-live": "polite", className: "cz-lock-line", children: gi === null ? null : /* @__PURE__ */ r("p", { className: "cz-small", children: i("editor.stage.locked", "{name} is the shop’s part — it stays as it is.", { name: gi.name }) }) })
        ] }),
        s ? null : /* @__PURE__ */ r(wa, { ...lt, nothingAdded: xe.used.length === 0, onShow: () => se(Ne[0]?.part ?? null) })
      ] }),
      /* @__PURE__ */ u("div", { className: "cz-fields-col", children: [
        /* @__PURE__ */ r(ga, { ...ui, ready: h, sides: so ? 2 : 1 }),
        /* @__PURE__ */ r($i, { checks: it, onGo: se }),
        s ? /* @__PURE__ */ u("div", { className: "cz-before-bar", children: [
          Ne.length > 0 ? /* @__PURE__ */ r(cn, { id: "cz-block", blocks: Ne, onShow: () => se(Ne[0]?.part ?? null) }) : null,
          xe.used.length === 0 ? /* @__PURE__ */ r("p", { className: "cz-small", children: i("editor.quote.nothingAdded", "Customising adds nothing to the price.") }) : null
        ] }) : null
      ] })
    ] }),
    s && T.placed === void 0 ? /* @__PURE__ */ r(xa, { ...lt }) : null,
    lo
  ] });
}
const at = [1, 1.5, 2, 3];
function Ca({ zoom: e, setZoom: t }) {
  const { t: o } = R(), i = at.indexOf(e);
  return /* @__PURE__ */ u("span", { role: "group", "aria-label": o("editor.stage.zoom", "Zoom"), className: "cz-zoom", children: [
    /* @__PURE__ */ r("button", { type: "button", className: "cz-zoom-button", "aria-label": o("editor.stage.zoomOut", "Zoom out"), disabled: i <= 0, onClick: () => t(at[Math.max(0, i - 1)]), children: /* @__PURE__ */ r(Fo, { "aria-hidden": "true" }) }),
    /* @__PURE__ */ r("span", { "aria-live": "polite", className: "cz-mono cz-zoom-label", children: `${String(Math.round(e * 100))}%` }),
    /* @__PURE__ */ r("button", { type: "button", className: "cz-zoom-button", "aria-label": o("editor.stage.zoomIn", "Zoom in"), disabled: i >= at.length - 1, onClick: () => t(at[Math.min(at.length - 1, i + 1)]), children: /* @__PURE__ */ r(To, { "aria-hidden": "true" }) })
  ] });
}
function un({ side: e, setSide: t, dark: o = !1 }) {
  const { t: i } = R();
  return /* @__PURE__ */ r("div", { role: "radiogroup", "aria-label": i("editor.stage.side", "Side"), className: o ? "cz-seg cz-seg-dark" : "cz-seg", children: ["front", "back"].map((n) => /* @__PURE__ */ r("button", { type: "button", role: "radio", "aria-checked": e === n, className: e === n ? "cz-on" : "", onClick: () => t(n), children: n === "front" ? i("editor.side.front", "Front") : i("editor.side.back", "Back") }, n)) });
}
function hn({ guides: e, setGuides: t, dark: o = !1 }) {
  const { t: i } = R();
  return /* @__PURE__ */ u("div", { role: "radiogroup", "aria-label": i("editor.stage.mode", "How the card is shown"), className: o ? "cz-seg cz-seg-dark" : "cz-seg", children: [
    /* @__PURE__ */ r("button", { type: "button", role: "radio", "aria-checked": !e, className: e ? "" : "cz-on", onClick: () => t(!1), children: i("editor.stage.printed", "As printed") }),
    /* @__PURE__ */ r("button", { type: "button", role: "radio", "aria-checked": e, className: e ? "cz-on" : "", onClick: () => t(!0), children: i("editor.stage.withGuides", "With guides") })
  ] });
}
function Ma({ catalogue: e, design: t, pictures: o, side: i, setSide: n, guides: d, setGuides: s, narrow: l, onClose: c }) {
  const { t: a } = R(), h = l && e.base.width > e.base.height, p = (t.values.sides ?? 1) >= 2 && e.base.sides >= 2;
  return /* @__PURE__ */ u(Ct, { labelledBy: "cz-full-title", onClose: c, className: "cz-full", children: [
    /* @__PURE__ */ r("h2", { id: "cz-full-title", className: "cz-hidden", children: a("editor.stage.full", "Full-screen preview") }),
    /* @__PURE__ */ u("div", { className: "cz-full-tools", children: [
      p ? /* @__PURE__ */ r(un, { side: i, setSide: n, dark: !0 }) : null,
      /* @__PURE__ */ r(hn, { guides: d, setGuides: s, dark: !0 }),
      /* @__PURE__ */ r("button", { type: "button", className: "cz-icon-button cz-icon-big cz-push cz-full-close", "aria-label": a("editor.stage.close", "Close the preview"), onClick: c, children: /* @__PURE__ */ r(Vt, { "aria-hidden": "true" }) })
    ] }),
    /* @__PURE__ */ r("div", { className: h ? "cz-full-stage cz-turned" : "cz-full-stage", children: /* @__PURE__ */ r(ae, { catalogue: e, design: t, pictures: o, side: i, guides: d, empty: "hide" }) }),
    h ? /* @__PURE__ */ r("p", { className: "cz-full-note", children: a("editor.stage.turned", "Turned to fill the screen.") }) : null
  ] });
}
function ja(e, t = null) {
  return e.session === null ? null : { id: e.id, base: e.base_id, session: e.session, email: t, savedAt: (/* @__PURE__ */ new Date()).toISOString() };
}
const fn = (e, t = Date.now()) => e.filter((o) => o.session.expiresAt > t).sort((o, i) => o.savedAt < i.savedAt ? 1 : -1), Ea = (e, t = Date.now()) => fn(e, t).length > 0, Ba = (e, t) => e.openLink(t), Ia = (e, t) => e.byCodes(t);
function Oa(e) {
  const t = le(() => Io(e.locale, e.look ?? "maker", e.shop ?? ""), [e.locale, e.look, e.shop]);
  return /* @__PURE__ */ r(Bo.Provider, { value: t, children: /* @__PURE__ */ r("div", { className: `cz cz-look-${t.look}`, dir: jo(t.locale) ? "rtl" : "ltr", lang: t.locale, children: /* @__PURE__ */ r(La, { ...e }) }) });
}
function La({ api: e, held: t, codes: o, onOpen: i, onOrder: n, onChoose: d, onForget: s }) {
  const { t: l, locale: c, look: a } = R(), [h, p] = O(null), [f, v] = O({}), [y, k] = O(null), [z, A] = O(!1), [g, m] = O([]), P = (o ?? []).length > 0;
  J(() => {
    let S = !0;
    return (async () => {
      const F = [];
      for (const D of fn(t ?? [])) {
        const b = await e.reopen(D.session);
        b !== null && F.push({ design: b, remembered: D });
      }
      if (P)
        for (const D of await e.byCodes(o).catch(() => [])) F.some((b) => String(b.design.id) === String(D.id)) || F.push({ design: D, remembered: null });
      if (!S) return;
      p(F);
      const G = [...new Set(F.map((D) => String(D.design.base_id)))], _ = await Promise.all(G.map(async (D) => [D, await e.catalogue(D).then((b) => Eo(b, D)).catch(() => null)]));
      S && v(Object.fromEntries(_));
    })(), () => {
      S = !1;
    };
  }, [e, P, (o ?? []).join(","), (t ?? []).map((S) => String(S.id)).join(",")]);
  const x = (S, F = "info") => {
    const G = Date.now() + Math.random();
    m((_) => [..._, { id: G, text: S, kind: F }]), setTimeout(() => m((_) => _.filter((D) => D.id !== G)), 3400);
  }, M = (S) => wi(f[String(S.design.base_id)] ?? null, S.design) || l("editor.designs.noWords", "No words yet"), L = async (S) => {
    if (!z) {
      A(!0);
      try {
        await e.remove(S.design);
      } catch (F) {
        A(!1), k(null);
        const G = typeof F == "object" && F !== null ? F.code : void 0;
        if (G === "PUBLIC_REF_NOT_FOUND" || G === "PUBLIC_CLAIM_NOT_FOUND") {
          x(l("editor.designs.deleteGone", "This design is with an order now, so it stays."), "warn");
          return;
        }
        x(l("editor.designs.deleteFailed", "That couldn’t be deleted. Try again."), "warn");
        return;
      }
      A(!1), k(null), S.remembered !== null && s?.(S.remembered), p((F) => (F ?? []).filter((G) => G !== S)), x(a === "print" ? l("editor.designs.deletedPrint", "{name} is deleted.", { name: M(S) }) : l("editor.designs.deleted", "Design deleted."), a === "print" ? "ok" : "info"), setTimeout(() => document.getElementById("cz-designs-title")?.focus(), 30);
    }
  }, B = h?.find((S) => S.remembered?.email !== null && S.remembered?.email !== void 0)?.remembered?.email ?? null;
  return /* @__PURE__ */ u("section", { className: "cz-designs", "data-screen": "designs", children: [
    /* @__PURE__ */ u("div", { className: "cz-title", children: [
      /* @__PURE__ */ r("h1", { id: "cz-designs-title", tabIndex: -1, className: "cz-h1", children: l("editor.designs.title", "Your designs") }),
      /* @__PURE__ */ r("p", { className: "cz-sub", children: P ? l("editor.designs.byCode", "Opened after you found your order. Only you can see these.") : B === null ? l("editor.designs.here", "The designs you saved on this device. Only you can see these.") : l("editor.designs.byLink", "Only you can see these. You opened them with the link we e-mailed to {email}.", { email: B }) })
    ] }),
    h === null ? /* @__PURE__ */ u("div", { className: "cz-loading", role: "status", children: [
      /* @__PURE__ */ r("span", { className: "cz-hidden", children: l("editor.loading", "Loading the designs") }),
      /* @__PURE__ */ r("div", { className: "cz-skel cz-skel-row" })
    ] }) : h.length === 0 ? /* @__PURE__ */ u("div", { className: "cz-empty", children: [
      /* @__PURE__ */ r("span", { className: "cz-tile", children: /* @__PURE__ */ r(Il, { "aria-hidden": "true" }) }),
      /* @__PURE__ */ r("p", { className: "cz-empty-title", children: l("editor.designs.none", "No saved designs") }),
      /* @__PURE__ */ r("p", { className: "cz-sub", children: a === "print" ? l("editor.designs.noneBodyPrint", "When you choose “Save and come back”, the design waits here and we e-mail you the link.") : l("editor.designs.noneBody", "When you press “Save and come back” while customising, the design waits here.") }),
      d === void 0 ? null : /* @__PURE__ */ r("button", { type: "button", className: "cz-primary", onClick: d, children: a === "print" ? l("editor.choose.title", "Choose a design") : l("editor.saved.backToShop", "Back to the shop") })
    ] }) : /* @__PURE__ */ r("ul", { className: "cz-design-list", children: h.map((S) => {
      const F = f[String(S.design.base_id)] ?? null, G = F === null ? null : qe(F, S.design.ready_design_id), _ = wi(F, S.design) || l("editor.designs.noWords", "No words yet"), D = G?.name ?? (a === "maker" ? l("editor.fill.plain", "Plain piece") : l("editor.fill.yourDesign", "Your design")), b = (S.design.values.sides ?? 1) >= 2;
      return /* @__PURE__ */ u("li", { className: "cz-design-row", children: [
        /* @__PURE__ */ r("span", { className: b && a === "print" ? "cz-design-art cz-card-art-two" : "cz-design-art", children: F === null ? null : /* @__PURE__ */ u(ee, { children: [
          /* @__PURE__ */ r(ae, { catalogue: F, design: S.design }),
          b && a === "print" ? /* @__PURE__ */ r(ae, { catalogue: F, design: S.design, side: "back" }) : null
        ] }) }),
        /* @__PURE__ */ u("span", { className: "cz-design-text", children: [
          /* @__PURE__ */ r("span", { className: "cz-strong", children: a === "print" ? `${D} — ${_.split(" · ")[0] ?? ""}` : _ }),
          /* @__PURE__ */ r("span", { className: "cz-small", children: a === "print" ? `${F?.base.name ?? ""} · ${F === null ? "" : `${String(F.base.width)} × ${String(F.base.height)} mm`}` : `${F?.base.name ?? ""} · ${D}` }),
          S.design.updatedAt === null ? null : /* @__PURE__ */ r("span", { className: "cz-mono cz-small", children: l("editor.designs.changed", "Last changed {when}", { when: gd(S.design.updatedAt, c) }) })
        ] }),
        /* @__PURE__ */ u("span", { className: "cz-chips", children: [
          /* @__PURE__ */ u("button", { type: "button", className: "cz-button", "aria-label": l("editor.designs.openAria", "Open {name}", { name: _ }), onClick: () => i(S.design), children: [
            /* @__PURE__ */ r(Yl, { "aria-hidden": "true" }),
            l("editor.designs.open", "Open")
          ] }),
          /* @__PURE__ */ u("button", { type: "button", className: "cz-primary", "aria-label": l("editor.designs.orderAria", "Order {name}", { name: _ }), onClick: () => n(S.design), children: [
            /* @__PURE__ */ r(mr, { "aria-hidden": "true" }),
            l("editor.designs.order", "Order it")
          ] }),
          S.design.state !== "draft" || S.design.session === null ? null : /* @__PURE__ */ r("button", { type: "button", className: "cz-icon-button", "aria-label": l("editor.designs.deleteAria", "Delete {name}", { name: _ }), onClick: () => k(S), children: /* @__PURE__ */ r(pt, { "aria-hidden": "true" }) })
        ] })
      ] }, String(S.design.id));
    }) }),
    y === null ? null : /* @__PURE__ */ r(Ct, { labelledBy: "cz-del-title", describedBy: "cz-del-body", alert: !0, onClose: () => k(null), children: /* @__PURE__ */ u("div", { className: "cz-dialog-body", children: [
      a === "print" ? /* @__PURE__ */ r("span", { className: "cz-tile cz-tile-danger", children: /* @__PURE__ */ r(pt, { "aria-hidden": "true" }) }) : null,
      /* @__PURE__ */ r("h2", { id: "cz-del-title", className: "cz-h2", children: l("editor.designs.deleteTitle", "Delete “{name}”?", { name: M(y) }) }),
      /* @__PURE__ */ r("p", { id: "cz-del-body", className: "cz-sub", children: a === "print" ? l("editor.designs.deleteBodyPrint", "It goes from your designs and its link stops working. Orders you’ve placed keep their own copy.") : l("editor.designs.deleteBody", "It goes for good, along with any logo you uploaded for it. Orders you’ve already placed keep their copy.") }),
      a === "print" ? /* @__PURE__ */ u("div", { className: "cz-dialog-actions cz-dialog-actions-end", children: [
        /* @__PURE__ */ r("button", { type: "button", className: "cz-button", onClick: () => k(null), children: l("editor.designs.keep", "Keep it") }),
        /* @__PURE__ */ r("button", { type: "button", className: "cz-danger", "aria-busy": z, "aria-disabled": z, onClick: () => {
          L(y);
        }, children: l("editor.designs.deleteYesPrint", "Delete") })
      ] }) : /* @__PURE__ */ u("div", { className: "cz-dialog-actions", children: [
        /* @__PURE__ */ r("button", { type: "button", className: "cz-danger cz-grow", "aria-busy": z, "aria-disabled": z, onClick: () => {
          L(y);
        }, children: l("editor.designs.deleteYes", "Delete it") }),
        /* @__PURE__ */ r("button", { type: "button", className: "cz-button cz-grow", onClick: () => k(null), children: l("editor.designs.keep", "Keep it") })
      ] })
    ] }) }),
    /* @__PURE__ */ r(wo, { toasts: g, onUndo: (S) => S.undo?.() })
  ] });
}
function Ga(e) {
  const t = le(() => Io(e.locale, "print", ""), [e.locale]), { t: o } = t, i = Oo(), [n, d] = O(null);
  J(() => {
    const l = new AbortController();
    return e.api.catalogue(e.base, l.signal).then((c) => {
      const a = Eo(c, e.base, e.readyDesigns);
      a !== null && d({ designs: a.ready.length, w: a.base.width, h: a.base.height, bleed: a.base.bleed });
    }).catch(() => d(null)), () => l.abort();
  }, [e.api, e.base, e.readyDesigns]);
  const s = [
    ...n !== null && n.designs > 0 ? [{ key: "choose", icon: /* @__PURE__ */ r(Vl, { "aria-hidden": "true" }), title: o("editor.choose.title", "Choose a design"), body: o("editor.ways.chooseBody", "A ready-made design by the shop. Fill in your words, add your logo, pick the colours."), meta: o("editor.choose.count", "{n, plural, one {# design} other {# designs}}", { n: n.designs }), go: e.onChoose }] : [],
    { key: "blank", icon: /* @__PURE__ */ r(kr, { "aria-hidden": "true" }), title: o("editor.ways.blank", "Start from blank"), body: o("editor.ways.blankBody", "The full editor, on a page at the finished size with the bleed and safe line drawn."), meta: n === null ? "" : o("editor.ways.blankMeta", "{w} × {h} mm + {bleed} mm bleed", { w: n.w, h: n.h, bleed: n.bleed }), go: e.onStartBlank },
    { key: "own", icon: /* @__PURE__ */ r(St, { "aria-hidden": "true" }), title: o("editor.ways.own", "Send your own file"), body: o("editor.ways.ownBody", "Already have print-ready artwork? Upload it and a person checks it."), meta: o("editor.ways.ownMeta", "PDF · TIFF · JPEG · up to 100 MB"), go: e.onSendOwnFile }
  ];
  return /* @__PURE__ */ r(Bo.Provider, { value: t, children: /* @__PURE__ */ u("div", { className: "cz cz-look-print", dir: jo(t.locale) ? "rtl" : "ltr", lang: t.locale, children: [
    /* @__PURE__ */ r("h2", { id: "cz-ways", className: "cz-h3", children: o("editor.ways.title", "How would you like to make it?") }),
    /* @__PURE__ */ r("div", { role: "group", "aria-labelledby": "cz-ways", className: i ? "cz-ways cz-ways-narrow" : "cz-ways", children: s.map((l) => /* @__PURE__ */ u("button", { type: "button", className: e.open === l.key ? "cz-door cz-on" : "cz-door", "aria-expanded": l.key === "own" ? e.open === "own" : void 0, onClick: l.go, children: [
      /* @__PURE__ */ r("span", { className: "cz-door-icon", children: l.icon }),
      /* @__PURE__ */ u("span", { className: "cz-door-text", children: [
        /* @__PURE__ */ r("span", { className: "cz-door-title", children: l.title }),
        /* @__PURE__ */ r("span", { className: "cz-small", children: l.body }),
        /* @__PURE__ */ r("span", { className: "cz-mono cz-hint", children: l.meta })
      ] })
    ] }, l.key)) }),
    n !== null && n.designs === 0 ? /* @__PURE__ */ u("p", { className: "cz-small cz-note-line", children: [
      /* @__PURE__ */ r(gt, { "aria-hidden": "true" }),
      o("editor.ways.noDesigns", "There are no ready-made designs for {product} yet.", { product: e.product })
    ] }) : null
  ] }) });
}
function _a(e) {
  if (typeof e != "object" || e === null) return null;
  const { code: t, params: o } = e;
  if (t !== "PUBLIC_WRITE_REFUSED" || typeof o != "object" || o === null) return null;
  const { reason: i, part: n } = o;
  return typeof i != "string" || !Yn.includes(i) ? null : typeof n == "string" && n !== "" ? { reason: i, part: n } : { reason: i };
}
export {
  Fa as CustomiserEditor,
  Tn as DESIGN_FORMAT,
  bi as LOCALES,
  Y as REFS,
  Ga as WaysIn,
  Oa as YourDesigns,
  Ta as customiserApi,
  _a as designRefusal,
  Ea as hasSavedDesigns,
  ja as heldDesign,
  fn as liveDesigns,
  Ba as openSavedLink,
  Ia as readDesigns
};
