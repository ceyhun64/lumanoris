"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Landing'in hareketli arka planı.
 *
 * Kaynak (`landing/buildai-landing.html`) bu arka planı UnicornStudio'nun
 * CDN'inden çekilen bir WebGL sahnesiyle çiziyordu ("Gray Hero Waves"):
 * siyah zemin + ipeksi dalgalar + köşeden gelen ışık huzmesi. (Kaynaktaki
 * parıldayan toz katmanı bilerek alınmadı.)
 * O yol burada iki nedenle kapalı: next.config.mjs'teki CSP `script-src 'self'`
 * üçüncü taraf script'i engelliyor ve sahnenin renkleri sağlayıcının
 * projesinde sabit — gri/mavi paletini bizim fuchsia+violet'e çeviremiyorduk.
 *
 * Bu yüzden aynı görsel dil kendi shader'ımızda yeniden üretildi. Sahnenin
 * matematiği kaynak shader'lardan birebir taşındı (liquify warp, spiral
 * huzme); yalnızca renkler global.css'teki
 * --accent-primary / --accent-secondary token'larının RGB karşılığı.
 *
 * CSS gradient'leri `.landing-backdrop` üzerinde duruyor ve zemin katman
 * olarak kalıyor: WebGL yoksa, context kaybolursa veya kullanıcı hareketi
 * kapattıysa sayfa yine de doğru görünüyor.
 */

const VERTEX_SHADER = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;

const float TWO_PI = 6.28318530718;

/* global.css: --accent-primary #D946EF, --accent-secondary #8B5CF6,
   --accent-secondary-light #A78BFA. */
const vec3 C_FUCHSIA = vec3(0.851, 0.275, 0.937);
const vec3 C_VIOLET  = vec3(0.545, 0.361, 0.965);
const vec3 C_LILAC   = vec3(0.655, 0.545, 0.980);

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

/* İmleç etkisi: kürsörün çevresindeki dalgalar dışarı doğru itiliyor ve
   yerinde hafifçe nefes alıyor. Kaynaktaki liquify katmanının mouseMomentum
   değerinin karşılığı; yumuşama (lerp) JS tarafında, burada yalnızca
   deformasyon var. */
float cursorInfluence(vec2 uv, float aspect){
  vec2 d = (uv - uMouse) * vec2(aspect, 1.0);
  return exp(-dot(d, d) * 7.0);
}

vec2 pushFromCursor(vec2 uv, float aspect, float influence){
  vec2 toCursor = (uv - uMouse) * vec2(aspect, 1.0);
  float dist = length(toCursor);
  vec2 dir = toCursor / max(dist, 0.0015);
  float pulse = 0.72 + 0.28 * sin(uTime * 1.1);
  return uv + dir * vec2(1.0 / aspect, 1.0) * influence * 0.13 * pulse;
}

/* Kaynaktaki "liquify" efekti: koordinatı iç içe beş sinüs katmanıyla
   büküyor. Dalgaların akıyormuş gibi görünmesini sağlayan şey bu. */
vec2 liquify(vec2 st, float aspect){
  vec2 pos = vec2(0.5, 0.5 - 0.18 * uTime * 0.0125);
  st -= pos;
  st.x *= aspect;
  float freq = 5.0 * 0.44;
  float t = uTime * 0.025;
  float amp = 0.11 * mix(0.2, 0.2 / 0.39, 0.25);
  for(int i = 1; i <= 5; i++){
    float fi = float(i);
    st = st * rot(fi / 5.0 * TWO_PI);
    float ff = fi * freq;
    st.x += amp * cos(ff * st.y + t);
    st.y += amp * sin(ff * st.x + t);
  }
  st.x /= aspect;
  st += pos;
  return st;
}

/* Kaynakta ipeksi dalgalar hazır bir PNG'ydi; burada prosedürel: her şerit
   ince parlak bir tepe çizgisi (crest) ve altına doğru sönen bir gövde
   (fill) üretiyor. */
vec2 ribbon(vec2 p, float base, float amp, float freq, float ph, float sp){
  float y = base
          + amp * sin(p.x * freq + ph + uTime * sp)
          + amp * 0.42 * sin(p.x * freq * 1.87 - uTime * sp * 0.73 + ph * 1.7);
  float d = p.y - y;
  float crest = exp(-d * d * 1400.0);
  float fill  = exp(-max(0.0, -d) * 4.2) * smoothstep(0.004, -0.004, d);
  return vec2(crest, fill);
}

vec2 waves(vec2 p){
  vec2 a = vec2(0.0);
  a += ribbon(p, 0.42, 0.085, 2.10, 0.0, 0.070);
  a += ribbon(p, 0.30, 0.100, 1.60, 2.1, 0.055);
  a += ribbon(p, 0.16, 0.075, 2.60, 4.2, 0.090);
  a += ribbon(p, 0.05, 0.060, 1.90, 1.1, 0.045) * 0.8;
  a += ribbon(p, 0.56, 0.070, 1.35, 3.4, 0.050) * 0.55;
  return a;
}

/* Kaynaktaki "beam" katmanı: sol üstten gelen, çok yavaş dönen spiral ışık.
   Merkez ekran dışında tutuldu, aksi hâlde 1/dist tekilliği nokta gibi
   parlıyor. */
vec3 spiral(vec2 uv, vec2 center, float aspect){
  uv.x *= aspect; center.x *= aspect;
  vec3 total = vec3(0.0);
  float d0 = length(uv - center);
  for(int i = 0; i < 3; i++){
    float a = 0.5 * d0 + float(i) / 3.0 - uTime * 0.01;
    vec2 s = vec2(0.75, 0.25) * 2.0;
    vec2 st = uv * rot(a * TWO_PI) * s;
    vec2 c  = center * rot(a * TWO_PI) * s;
    total += (0.125 / max(distance(st, c), 0.001)) * C_LILAC * 0.3333;
  }
  return total;
}

vec3 tonemap(vec3 x){
  x = clamp(x, -40.0, 40.0);
  return (exp(x) - exp(-x)) / (exp(x) + exp(-x));
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 mPos = uMouse - 0.5;

  float influence = cursorInfluence(uv, aspect);
  vec2 cuv = pushFromCursor(uv + mPos * 0.02, aspect, influence);
  vec2 wuv = liquify(cuv, aspect);
  vec2 p = vec2((wuv.x - 0.5) * aspect, wuv.y);

  /* Dalgalar alt yarıda kalsın: üstte hero metni, en altta footer okunur
     kalmalı. */
  vec2 w = waves(p) * smoothstep(0.60, 0.06, uv.y) * smoothstep(-0.12, 0.14, uv.y);

  vec3 tint = mix(C_VIOLET, C_FUCHSIA, smoothstep(0.0, 1.0, uv.x));
  vec3 col = mix(tint, vec3(1.0), 0.45) * w.x * 0.22
           + tint * w.y * 0.085;

  /* İmlecin altındaki dalga hem bükülüyor hem de biraz parlıyor. */
  col *= 1.0 + 0.5 * influence;

  col += spiral(uv, vec2(-0.12, 1.14), aspect) * 0.30;

  gl_FragColor = vec4(tonemap(col), 1.0);
}
`;

/* Arka plan bulanık olduğu için tam çözünürlük israf; 0.62 ölçek hem GPU
   yükünü ~%60 düşürüyor hem de kaynaktaki zoomBlur'ün yumuşaklığını taklit
   ediyor. Üst sınır 4K ekranlarda fragment sayısını patlatmamak için. */
const RENDER_SCALE = 0.62;
const MAX_PIXELS = 1_400_000;

function createProgram(gl) {
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = vertex ? compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER) : null;
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export default function LandingBackdrop() {
  const canvasRef = useRef(null);
  const [isPainted, setIsPainted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let gl;
    try {
      gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
      });
    } catch {
      gl = null;
    }
    /* WebGL yoksa (eski tarayıcı, yazılım rasterizer) sessizce CSS
       gradient'leriyle kalıyoruz — canvas hiç görünür olmuyor. */
    if (!gl) return undefined;

    const program = createProgram(gl);
    if (!program) return undefined;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uMouse = gl.getUniformLocation(program, "uMouse");

    const mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    let frameId = 0;
    let contextLost = false;
    const startedAt = performance.now();

    const resize = () => {
      /* Telefonlarda hem GPU zayıf hem de ekran küçük; bir tık daha düşük
         çözünürlükte çiziyoruz. */
      const mobileFactor = window.innerWidth < 768 ? 0.8 : 1;
      let scale = Math.min(window.devicePixelRatio || 1, 2) * RENDER_SCALE * mobileFactor;
      let width = Math.max(1, Math.round(canvas.clientWidth * scale));
      let height = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (width * height > MAX_PIXELS) {
        const shrink = Math.sqrt(MAX_PIXELS / (width * height));
        width = Math.max(1, Math.round(width * shrink));
        height = Math.max(1, Math.round(height * shrink));
      }
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    const draw = (time) => {
      resize();
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = () => {
      if (contextLost) return;
      /* Sekme arkadayken rAF zaten durur; yine de tetiklenirse boş dönüyoruz. */
      if (!document.hidden) {
        mouse.x += (mouse.targetX - mouse.x) * 0.09;
        mouse.y += (mouse.targetY - mouse.y) * 0.09;
        draw((performance.now() - startedAt) / 1000);
      }
      frameId = requestAnimationFrame(loop);
    };

    const onPointerMove = (event) => {
      mouse.targetX = event.clientX / window.innerWidth;
      mouse.targetY = 1 - event.clientY / window.innerHeight;
    };

    const onResize = () => {
      if (reducedMotion && !contextLost) draw(18);
    };

    const onContextLost = (event) => {
      /* preventDefault olmadan context geri gelmez; biz restore etmiyoruz,
         sadece döngüyü durdurup CSS gradient'lerine düşüyoruz. */
      event.preventDefault();
      contextLost = true;
      cancelAnimationFrame(frameId);
      setIsPainted(false);
    };

    canvas.addEventListener("webglcontextlost", onContextLost);
    window.addEventListener("resize", onResize);

    if (reducedMotion) {
      /* Hareket istenmiyorsa tek kare: sahnenin durağan bir anı, rAF yok. */
      draw(18);
    } else {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      loop();
    }
    setIsPainted(true);

    return () => {
      cancelAnimationFrame(frameId);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div className="landing-backdrop" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className={`landing-backdrop-canvas${isPainted ? " is-visible" : ""}`}
      />
    </div>
  );
}
