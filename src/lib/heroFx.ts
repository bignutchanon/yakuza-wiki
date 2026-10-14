import {
  AdditiveBlending,
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  HalfFloatType,
  LinearFilter,
  Mesh,
  NoColorSpace,
  NoToneMapping,
  NormalBlending,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  SRGBColorSpace,
  ShaderMaterial,
  Texture,
  TextureLoader,
  Vector2,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

export type HeroQuality = 'auto' | 'low' | 'high'
export interface HeroSceneData {
  id: string
  image: string
  maps: string
  fill: string
  width: number
  height: number
  credit: string
  nearZ: number
  farZ: number
  duration: number
  endMove: [number, number, number]
  endTurn: [number, number]
  // Subject point (0-1, from the top-left) kept centred where the crop leaves room, like CSS object-position.
  focus?: [number, number]
}

interface PhotoSet {
  data: HeroSceneData
  color: Texture
  maps: Texture
  fill: Texture
  scene: Scene
  meshes: Mesh[]
  materials: ShaderMaterial[]
  rain: Mesh | null
}

const VERTEX = `
uniform sampler2D uMaps;
uniform float uNearZ;
uniform float uFarZ;
uniform float uForeground;
uniform vec2 uCover;
uniform vec2 uOffset;
uniform float uTanHalfY;
uniform float uImageAspect;
varying vec2 vUv;
varying float vFogDepth;
varying float vHole;
void main() {
  vec3 mask = textureLod(uMaps, uv, 0.0).rgb;
  float disparity = mix(mask.r, mask.g, uForeground);
  float z = 1.0 / mix(1.0 / uFarZ, 1.0 / uNearZ, disparity);
  vec3 imagePosition = vec3((uv.x * 2.0 - 1.0) * uTanHalfY * uImageAspect * z,
                             (uv.y * 2.0 - 1.0) * uTanHalfY * z, -z);
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(imagePosition, 1.0);
  clip.xy = clip.xy * uCover + uOffset * clip.w;
  gl_Position = clip;
  vUv = uv;
  vFogDepth = z;
  vHole = clamp(mask.b * 2.0, 0.0, 1.0);
}`

const FRAGMENT = `
uniform sampler2D uColor;
uniform sampler2D uFill;
uniform float uForeground;
uniform float uTime;
uniform float uOpacity;
uniform float uEffects;
uniform vec3 uFogColor;
varying vec2 vUv;
varying float vFogDepth;
varying float vHole;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 color = texture2D(uColor, vUv).rgb;
  float alpha = 1.0;
  if (uForeground > 0.5) {
    // The foreground layer also covers the dilated ring around objects, so that together with the
    // background layer the first frame is exactly the photo; the fill only shows once the camera moves.
    alpha = smoothstep(0.05, 0.5, vHole);
    if (alpha < 0.02) discard;
  } else {
    color = mix(color, texture2D(uFill, vUv).rgb, smoothstep(0.5, 0.95, vHole));
  }
  float hi = max(max(color.r, color.g), color.b);
  float lo = min(min(color.r, color.g), color.b);
  float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float sat = (hi - lo) / max(hi, 0.001);
  float neon = smoothstep(0.28, 0.8, lum) * smoothstep(0.3, 0.72, sat);
  vec2 cell = floor(vUv * vec2(13.0, 9.0));
  float slow = 0.985 + 0.015 * sin(uTime * 0.72 + hash(cell) * 6.2831);
  float blink = 1.0 - 0.08 * step(0.997, hash(cell + floor(uTime * 0.33)));
  color *= mix(1.0, min(1.6, 1.0 + neon * 0.6), uEffects);
  color *= mix(1.0, slow * blink, neon * uEffects);
  float fog = (1.0 - exp(-vFogDepth * 0.004)) * uEffects;
  color = mix(color, uFogColor, fog * 0.32);
  gl_FragColor = vec4(color, alpha * uOpacity);
}`

const RAIN_VERTEX = `
attribute vec4 aSeed;
uniform float uTime;
uniform float uStretch;
uniform vec2 uCover;
uniform vec2 uOffset;
uniform vec2 uResolution;
varying float vDepth;
varying float vTail;
varying vec2 vPhotoUv;
const float WIND = 0.16;
void main() {
  float depth = aSeed.z;
  float dist = mix(4.0, 36.0, depth);
  // The fall span grows with distance, so near and far drops spend the same share of their loop on screen.
  float span = dist * 1.25;
  float fall = mod(aSeed.y * span + uTime * mix(7.5, 2.6, depth) * mix(0.85, 1.15, aSeed.w), span);
  vec3 center = vec3(aSeed.x * dist * 0.9 - (fall - span * 0.5) * WIND, span * 0.5 - fall, -dist);
  vec4 clip = projectionMatrix * viewMatrix * vec4(cameraPosition + center, 1.0);
  // Same crop as the photo, so streaks keep their shape and slant on any screen.
  clip.xy = clip.xy * uCover + uOffset * clip.w;
  // Streak size in pixels: the projected world size, never thinner than one pixel
  // (thinner quads miss every pixel centre and are not drawn at all).
  vec2 pixels = vec2(projectionMatrix[0][0] * uCover.x, projectionMatrix[1][1] * uCover.y) * 0.5 * uResolution / clip.w;
  float lengthPx = mix(0.34, 0.06, depth) * (1.0 + uStretch * 0.65) * pixels.y;
  float widthPx = max(mix(0.014, 0.0035, depth) * pixels.x, 1.0);
  vec2 axis = normalize(vec2(WIND, 1.0));
  vec2 shift = axis * position.y * lengthPx + vec2(axis.y, -axis.x) * position.x * widthPx;
  clip.xy += shift * 2.0 / uResolution * clip.w;
  gl_Position = clip;
  vPhotoUv = ((clip.xy / clip.w - uOffset) / uCover) * 0.5 + 0.5;
  vDepth = depth;
  vTail = position.y + 0.5;
}`

const RAIN_FRAGMENT = `
uniform float uTime;
uniform sampler2D uPhoto;
varying float vDepth;
varying float vTail;
varying vec2 vPhotoUv;
void main() {
  float tail = smoothstep(0.0, 0.3, vTail) * (1.0 - 0.45 * smoothstep(0.75, 1.0, vTail));
  float twinkle = 0.85 + 0.15 * sin(uTime * 7.0 + vDepth * 91.0);
  vec3 photo = texture2D(uPhoto, clamp(vPhotoUv, 0.0, 1.0)).rgb;
  float luma = dot(photo, vec3(0.2126, 0.7152, 0.0722));
  // Drops catch the light behind them: brighter over neon, faint (not gone) over the dark.
  float lit = mix(0.3, 1.0, smoothstep(0.03, 0.45, luma));
  float alpha = tail * mix(0.34, 0.08, vDepth) * twinkle * lit;
  vec3 tint = mix(vec3(0.62, 0.7, 0.86), photo, 0.35);
  gl_FragColor = vec4(tint, alpha);
}`

const COMPOSITE_SHADER = {
  uniforms: {
    tCurrent: { value: null as Texture | null },
    tNext: { value: null as Texture | null },
    uMix: { value: 0 },
    uBlur: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`,
  fragmentShader: `
    uniform sampler2D tCurrent; uniform sampler2D tNext; uniform float uMix; uniform float uBlur; varying vec2 vUv;
    void main(){
      vec2 ray=vUv-0.5; vec2 stepUv=ray*uBlur;
      vec4 a=(texture2D(tCurrent,vUv)+texture2D(tCurrent,vUv-stepUv*0.55)+texture2D(tCurrent,vUv-stepUv))/3.0;
      vec4 b=texture2D(tNext,vUv);
      vec3 c=mix(a.rgb,b.rgb,uMix)*(1.0+0.12*sin(uMix*3.1415926));
      gl_FragColor=vec4(c,1.0);
    }`,
}

const FILM_SHADER = {
  uniforms: {
    tDiffuse: { value: null as Texture | null },
    uTime: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233))+uTime)*43758.5453); }
    void main(){
      vec2 uv=vUv; vec2 p=uv-0.5; float edge=dot(p,p);
      float ca=edge*0.0018; vec3 c=vec3(texture2D(tDiffuse,uv+vec2(ca,0.0)).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-vec2(ca,0.0)).b);
      c=(c-0.5)*1.035+0.5; c.r+=0.012*(c.r-c.g); c.b+=0.012*(c.b-c.r);
      c+= (hash(gl_FragCoord.xy)-0.5)*0.012;
      c*=1.0-smoothstep(0.22,0.72,edge);
      gl_FragColor=vec4(c,1.0);
    }`,
}

// Water on the lens, after the glass of the background prototype C minus its fog: the photo stays sharp,
// drops show through their dark rim, a small upside-down view and a highlight. Units: canvas height, y up.
const DROPLET_SHADER = {
  uniforms: {
    tDiffuse: { value: null as Texture | null },
    uTime: { value: 0 },
    uResolution: { value: new Vector2(1, 1) },
    uDensity: { value: 1 },
    uSlideCount: { value: 0 },
    // Sliding drops: x, y, radius, alpha · their path: start x, wiggle phase, trail top y, unused.
    uSlides: { value: Array.from({ length: 4 }, () => new Vector4()) },
    uTrails: { value: Array.from({ length: 4 }, () => new Vector4()) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uResolution; uniform float uDensity;
    uniform int uSlideCount; uniform vec4 uSlides[4]; uniform vec4 uTrails[4]; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    // Must match slidePathX() in the engine.
    float pathX(float y, vec4 t){ return t.x+0.006*sin(y*23.0+t.y)+0.003*sin(y*57.0+t.y*1.7); }
    // One grid of resting drops (cell = 1/cells of the height). A share of the cells holds a drop that lands,
    // sits and dries up, then re-rolls its spot and size. Returns offset from the drop centre, radius, strength.
    vec4 restingDrop(vec2 p, float cells, float fill, float rMin, float rMax, float seed){
      vec2 g=p*cells; vec2 cell=floor(g);
      float phase=uTime/(18.0+16.0*hash(cell+seed))+hash(cell+seed+5.0);
      vec2 id=cell+seed+mod(floor(phase),97.0)*13.7;
      if(hash(id)>fill) return vec4(1.0,1.0,0.001,0.0);
      float r=mix(rMin,rMax,pow(hash(id+41.0),2.0));
      vec2 center=(vec2(hash(id+7.0),hash(id+23.0))-0.5)*(1.0-2.4*r);
      float life=fract(phase);
      float strength=smoothstep(0.0,0.015,life)*(1.0-smoothstep(0.85,1.0,life));
      return vec4((fract(g)-0.5-center)/cells,r/cells,strength);
    }
    vec3 shadeDrop(vec3 color, vec2 q, float n, float r, float strength, float aspect){
      float body=(1.0-smoothstep(1.0-1.5/(r*uResolution.y),1.0,n))*strength;
      if(body<=0.0) return color;
      vec2 dir=q/r;
      // A convex drop shows a small upside-down view of the scene around it.
      vec3 lens=texture2D(tDiffuse,clamp(vUv-q*vec2(1.0/aspect,1.0)*2.5,0.001,0.999)).rgb*1.08;
      lens=mix(lens,lens*0.35+vec3(0.05,0.06,0.08),smoothstep(0.45,0.95,n)*0.7);
      // Highlight only where the drop is a few pixels wide; on tiny drops it reads as a star, not water.
      vec2 s=dir-vec2(-0.35,0.38);
      lens+=vec3(1.0,0.97,0.93)*exp(-dot(s,s)/0.035)*0.55*smoothstep(1.5,4.0,r*uResolution.y);
      lens+=lens*exp(-pow((dir.y+0.66)/0.16,2.0))*(1.0-abs(dir.x))*0.35;
      return mix(color,lens,body);
    }
    void main(){
      vec3 color=texture2D(tDiffuse,vUv).rgb;
      float aspect=uResolution.x/max(uResolution.y,1.0);
      vec2 p=vUv*vec2(aspect,1.0);
      // A sliding drop leaves a thin running film and wipes the resting drops off its path for a while.
      float wipe=1.0; float film=0.0; float filmX=0.0;
      for(int k=0;k<4;k++){
        if(k>=uSlideCount) break;
        vec4 s=uSlides[k]; vec4 t=uTrails[k];
        float above=p.y-s.y;
        if(above<=0.0||p.y>t.z) continue;
        float dx=p.x-pathX(p.y,t); float w=s.z*0.3;
        wipe=min(wipe,1.0-(1.0-smoothstep(w*1.2,w*3.0,abs(dx)))*(1.0-smoothstep(0.35,1.2,above))*s.w);
        float f=(1.0-smoothstep(w*0.55,w,abs(dx)))*(1.0-smoothstep(0.0,0.5,above))*s.w;
        if(f>film){ film=f; filmX=dx/w; }
      }
      if(film>0.0){
        vec3 through=texture2D(tDiffuse,clamp(vUv+vec2(filmX*0.003,0.0),0.001,0.999)).rgb;
        vec3 wet=through*(0.72+0.28*(1.0-abs(filmX)))+vec3(0.9,0.95,1.0)*exp(-pow((filmX+0.25)/0.3,2.0))*0.16;
        color=mix(color,wet,film*0.85);
      }
      vec4 m=restingDrop(p,22.0,0.07*uDensity,0.2,0.4,71.0);
      vec4 d=restingDrop(p,64.0,0.15*uDensity,0.16,0.34,0.0);
      float nm=length(m.xy*vec2(1.0,m.y<0.0?0.86:1.08))/m.z;
      float nd=length(d.xy*vec2(1.0,d.y<0.0?0.86:1.08))/d.z;
      if(nm<1.0&&m.w>0.0) color=shadeDrop(color,m.xy,nm,m.z,m.w*wipe,aspect);
      else if(nd<1.0) color=shadeDrop(color,d.xy,nd,d.z,d.w*wipe,aspect);
      for(int k=0;k<4;k++){
        if(k>=uSlideCount) break;
        vec4 s=uSlides[k];
        vec2 q=p-s.xy;
        float n=length(q*vec2(1.0,q.y<0.0?0.8:1.15))/s.z;
        if(n<1.0) color=shadeDrop(color,q,n,s.z,s.w,aspect);
      }
      gl_FragColor=vec4(color,1.0);
    }`,
}

interface SlideDrop {
  x0: number
  phase: number
  y: number
  top: number
  radius: number
  born: number
  moving: boolean
  nextChange: number
  speed: number
}

// Must match pathX() in the droplet shader.
function slidePathX(drop: SlideDrop, y: number) {
  return drop.x0 + 0.006 * Math.sin(y * 23 + drop.phase) + 0.003 * Math.sin(y * 57 + drop.phase * 1.7)
}

function coverScale(width: number, height: number, imageAspect: number): Vector2 {
  const canvasAspect = width / Math.max(height, 1)
  return canvasAspect >= imageAspect
    ? new Vector2(1, canvasAspect / imageAspect)
    : new Vector2(imageAspect / canvasAspect, 1)
}

function configureTexture(texture: Texture, kind: 'color' | 'map') {
  texture.colorSpace = kind === 'color' ? SRGBColorSpace : NoColorSpace
  texture.flipY = true
  texture.generateMipmaps = kind === 'color'
  if (kind === 'map') {
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
  }
  texture.needsUpdate = true
}

function loadPhoto(data: HeroSceneData): Promise<PhotoSet> {
  const loader = new TextureLoader()
  return Promise.all([
    loader.loadAsync(data.image),
    loader.loadAsync(data.maps),
    loader.loadAsync(data.fill),
  ]).then(([color, maps, fill]) => {
    configureTexture(color, 'color')
    configureTexture(maps, 'map')
    configureTexture(fill, 'color')
    const scene = new Scene()
    scene.background = new Color('#120c1c')
    const photo: PhotoSet = { data, color, maps, fill, scene, meshes: [], materials: [], rain: null }
    buildPhotoMeshes(photo, 256, 144)
    return photo
  })
}

function buildPhotoMeshes(photo: PhotoSet, segX: number, segY: number) {
  for (const mesh of photo.meshes) {
    mesh.geometry.dispose()
    photo.scene.remove(mesh)
  }
  for (const material of photo.materials) material.dispose()
  photo.meshes = []
  photo.materials = []
  const geometry = new PlaneGeometry(1, 1, segX, segY)
  const aspect = photo.data.width / photo.data.height
  for (let layer = 0; layer < 2; layer += 1) {
    const uniforms = {
      uMaps: { value: photo.maps },
      uColor: { value: photo.color },
      uFill: { value: photo.fill },
      uNearZ: { value: photo.data.nearZ },
      uFarZ: { value: photo.data.farZ },
      uForeground: { value: layer },
      uCover: { value: new Vector2(1, 1) },
      uOffset: { value: new Vector2(0, 0) },
      uTanHalfY: { value: Math.tan((50 * Math.PI / 180) / 2) },
      uImageAspect: { value: aspect },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uEffects: { value: 0 },
      uFogColor: { value: new Color('#120c1c') },
    }
    const material = new ShaderMaterial({
      uniforms,
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: layer === 1,
      toneMapped: false,
      blending: NormalBlending,
      depthTest: true,
      depthWrite: true,
    })
    const mesh = new Mesh(geometry, material)
    mesh.renderOrder = layer
    mesh.frustumCulled = false
    photo.scene.add(mesh)
    photo.meshes.push(mesh)
    photo.materials.push(material)
  }
}

function makeRain(count: number) {
  const base = new PlaneGeometry(1, 1)
  const geometry = new InstancedBufferGeometry()
  geometry.index = base.index
  geometry.setAttribute('position', base.getAttribute('position'))
  geometry.setAttribute('uv', base.getAttribute('uv'))
  base.dispose()
  const seeds = new Float32Array(count * 4)
  let state = 0x6d2b79f5
  const random = () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ value >>> 15, value | 1)
    value ^= value + Math.imul(value ^ value >>> 7, value | 61)
    return ((value ^ value >>> 14) >>> 0) / 4294967296
  }
  for (let i = 0; i < count; i += 1) {
    seeds[i * 4] = random() * 2.7 - 1.35
    seeds[i * 4 + 1] = random()
    seeds[i * 4 + 2] = 1 - Math.pow(random(), 2.2)
    seeds[i * 4 + 3] = random()
  }
  geometry.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 4))
  geometry.instanceCount = count
  const material = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uStretch: { value: 0 }, uCover: { value: new Vector2(1, 1) }, uOffset: { value: new Vector2(0, 0) }, uResolution: { value: new Vector2(1, 1) } },
    vertexShader: RAIN_VERTEX,
    fragmentShader: RAIN_FRAGMENT,
    transparent: true,
    blending: AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  })
  const rain = new Mesh(geometry, material)
  rain.frustumCulled = false
  rain.renderOrder = 3
  return rain
}

function disposePhoto(photo: PhotoSet | null) {
  if (!photo) return
  if (photo.rain) {
    photo.scene.remove(photo.rain)
    const material = photo.rain.material
    if (Array.isArray(material)) material.forEach((item) => item.dispose())
    else material.dispose()
  }
  for (const mesh of photo.meshes) mesh.geometry.dispose()
  for (const material of photo.materials) material.dispose()
  photo.color.dispose()
  photo.maps.dispose()
  photo.fill.dispose()
}

export function startHeroFx(
  host: HTMLElement,
  scenes: HeroSceneData[],
  onScene: (index: number | null) => void,
  requested: HeroQuality = 'auto',
  // Dev-only tuning hook (`?scene=<id>&at=<seconds>`): start at a scene and hold its time.
  debug?: { scene: string | null; at: number | null },
): () => void {
  const root = host.closest('.hero3d')
  const canvas = document.createElement('canvas')
  let renderer: WebGLRenderer = null!
  let composer: EffectComposer = null!
  let currentTarget: WebGLRenderTarget = null!
  let nextTarget: WebGLRenderTarget = null!
  let current: PhotoSet | null = null
  let next: PhotoSet | null = null
  let disposed = false
  let stopped = false
  let visible = true
  let frame = 0
  let quality: 'low' | 'high' = requested === 'low' ? 'low' : 'high'
  const forced = requested !== 'auto'
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced && !forced) return () => undefined
  const touchSmall = window.matchMedia('(pointer: coarse)').matches &&
    ((navigator.hardwareConcurrency || 8) <= 6 || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8) <= 4)
  if (touchSmall && !forced) return () => undefined
  const lowMode = () => quality === 'low'
  const rendererOptions = { canvas, antialias: false, alpha: false, powerPreference: 'high-performance' as const }
  try {
    renderer = new WebGLRenderer(rendererOptions)
    renderer.outputColorSpace = SRGBColorSpace
    // Game screenshots are already display-referred: a filmic curve would wash the neon out to white.
    renderer.toneMapping = NoToneMapping
    renderer.setClearColor('#120c1c', 1)
    host.appendChild(canvas)
    currentTarget = new WebGLRenderTarget(1, 1, { format: RGBAFormat, type: HalfFloatType, depthBuffer: true })
    nextTarget = new WebGLRenderTarget(1, 1, { format: RGBAFormat, type: HalfFloatType, depthBuffer: true })
    currentTarget.texture.colorSpace = SRGBColorSpace
    nextTarget.texture.colorSpace = SRGBColorSpace
    const quadScene = new Scene()
    const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const quadMaterial = new ShaderMaterial({
      uniforms: COMPOSITE_SHADER.uniforms,
      vertexShader: COMPOSITE_SHADER.vertexShader,
      fragmentShader: COMPOSITE_SHADER.fragmentShader,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    })
    const quad = new Mesh(new PlaneGeometry(2, 2), quadMaterial)
    quadScene.add(quad)
    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(quadScene, quadCamera))
    // Threshold above 1.0: only neon boosted in the photo shader blooms, white sign plates keep their lettering.
    const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.35, 0.4, 1.0)
    const droplets = new ShaderPass(DROPLET_SHADER)
    const film = new ShaderPass(FILM_SHADER)
    composer.addPass(bloom)
    composer.addPass(droplets)
    composer.addPass(film)
    composer.addPass(new OutputPass())
    const camera = new PerspectiveCamera(50, 16 / 9, 0.05, 260)
    let rain = makeRain(quality === 'high' ? 700 : 350)
    let rainUniforms = (rain.material as ShaderMaterial).uniforms
    // Drawing-buffer size shared by every scene's rain material (streak widths are set in pixels).
    const rainResolution = new Vector2(1, 1)
    let startedAt = performance.now()
    let lastFrame = startedAt
    let scrollY = window.scrollY
    let scrollTarget = 0
    let scrollProgress = 0
    let scrollApplied = 0
    let stretch = 0
    let pointerYaw = 0
    let pointerPitch = 0
    let targetYaw = 0
    let targetPitch = 0
    let currentIndex = Math.max(0, scenes.findIndex((scene) => scene.id === debug?.scene))
    let sceneTime = 0
    let transitionSent = false
    let live = false
    let liveAt = 0
    let sampleStart = 0
    let slideCount = quality === 'high' ? 2 : 1
    droplets.uniforms.uDensity.value = quality === 'high' ? 1 : 0.65
    let randomState = 0x4f1bbcdc
    const random = () => {
      randomState += 0x6d2b79f5
      let value = randomState
      value = Math.imul(value ^ value >>> 15, value | 1)
      value ^= value + Math.imul(value ^ value >>> 7, value | 61)
      return ((value ^ value >>> 14) >>> 0) / 4294967296
    }
    const slides: SlideDrop[] = Array.from({ length: 4 }, () => ({
      x0: 0, phase: 0, y: 0, top: 0, radius: 0.02, born: 0, moving: false, nextChange: 0, speed: 0,
    }))
    // A drop starts in the upper part of the glass, mostly on the right (the hero copy sits on the left).
    const respawnSlide = (drop: SlideDrop, at: number) => {
      const aspect = host.clientWidth / Math.max(host.clientHeight, 1)
      drop.x0 = (random() < 0.7 ? 0.55 + random() * 0.4 : 0.06 + random() * 0.42) * aspect
      drop.phase = random() * Math.PI * 2
      drop.radius = 0.014 + random() * 0.01
      drop.y = 0.6 + random() * 0.32
      drop.top = drop.y + drop.radius
      drop.born = at
      drop.moving = false
      drop.nextChange = at + 0.8 + random() * 2
    }
    slides.forEach((drop, index) => respawnSlide(drop, 1 + index * 2.5 + random() * 2))
    const frameTimes: number[] = []
    const resizeObserver = new ResizeObserver(resize)
    const intersection = new IntersectionObserver((entries) => {
      visible = Boolean(entries[0]?.isIntersecting)
      if (visible && !document.hidden && !frame) frame = requestAnimationFrame(tick)
    })
    const onVisibility = () => {
      if (!document.hidden && visible && !frame) frame = requestAnimationFrame(tick)
    }
    const onScroll = () => {
      if (!visible) return
      const currentY = window.scrollY
      const delta = Math.max(0, currentY - scrollY)
      scrollY = currentY
      scrollTarget += delta / 120
    }
    const onPointer = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect()
      const x = (event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5
      const y = (event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5
      targetYaw = Math.max(-1.5, Math.min(1.5, x * 3)) * Math.PI / 180
      targetPitch = Math.max(-1, Math.min(1, -y * 2)) * Math.PI / 180
    }
    const onContextLost = (event: Event) => {
      event.preventDefault()
      stop(true)
    }
    const loadScene = (index: number) => loadPhoto(scenes[index % scenes.length])
    let preloadPromise: Promise<PhotoSet> | null = null
    const preloadNext = () => {
      if (preloadPromise || !current) return
      preloadPromise = loadScene((currentIndex + 1) % scenes.length)
      preloadPromise.then((photo) => {
        if (disposed) disposePhoto(photo)
        else {
          buildPhotoMeshes(photo, lowMode() ? 160 : 256, lowMode() ? 90 : 144)
          addRain(photo)
          next = photo
        }
        preloadPromise = null
      }).catch((error) => {
        preloadPromise = null
        if (!disposed) console.warn('Hero depth scene could not load.', error)
      })
    }
    // กล้องเคลื่อนตรงอย่างนุ่มนวล ไม่มีจังหวะเดินหรือส่ายกล้อง
    const setCamera = (photo: PhotoSet, time: number, now: number) => {
      const d = photo.data
      const u = Math.max(0, Math.min(1, time / d.duration))
      const move: [number, number, number] = [d.endMove[0] * u, d.endMove[1] * u, d.endMove[2] * u]
      const yaw = d.endTurn[0] * u
      const pitch = d.endTurn[1] * u
      camera.aspect = d.width / d.height
      camera.updateProjectionMatrix()
      camera.position.set(move[0], move[1], move[2])
      camera.rotation.order = 'YXZ'
      camera.rotation.y = yaw * Math.PI / 180 + (live ? pointerYaw : 0)
      camera.rotation.x = pitch * Math.PI / 180 + (live ? pointerPitch : 0)
      const cover = coverScale(host.clientWidth, host.clientHeight, d.width / d.height)
      // Margin 0 on the very first frame (it must match the poster), then 5 % for good so that
      // pointer look never shows the mesh edges, also on scenes that cross-fade in.
      const marginT = live ? Math.min(1, (now - liveAt) / 1.2) : 0
      const marginEase = marginT * marginT * (3 - 2 * marginT)
      cover.multiplyScalar(1 + marginEase * 0.05)
      const [focusX, focusY] = d.focus ?? [0.5, 0.5]
      const offset = new Vector2(
        Math.max(1 - cover.x, Math.min(cover.x - 1, (1 - 2 * focusX) * cover.x)),
        Math.max(1 - cover.y, Math.min(cover.y - 1, (2 * focusY - 1) * cover.y)),
      )
      for (const material of photo.materials) {
        material.uniforms.uCover.value.copy(cover)
        material.uniforms.uOffset.value.copy(offset)
        material.uniforms.uTime.value = live ? now : 0
        material.uniforms.uEffects.value = live ? 1 : 0
      }
    }
    const syncRainMapping = (photo: PhotoSet) => {
      const rainMaterial = photo.rain?.material
      if (!rainMaterial || Array.isArray(rainMaterial)) return
      const mapping = photo.materials[0].uniforms
      const uniforms = (rainMaterial as ShaderMaterial).uniforms
      uniforms.uCover.value.copy(mapping.uCover.value)
      uniforms.uOffset.value.copy(mapping.uOffset.value)
    }
    function resize() {
      if (!renderer || !composer) return
      const width = Math.max(host.clientWidth, 1)
      const height = Math.max(host.clientHeight, 1)
      const dpr = lowMode() ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
      renderer.setPixelRatio(dpr)
      renderer.setSize(width, height, false)
      composer.setPixelRatio(dpr)
      composer.setSize(width, height)
      droplets.uniforms.uResolution.value.set(width, height)
      rainResolution.set(Math.round(width * dpr), Math.round(height * dpr))
      currentTarget.setSize(Math.round(width * dpr), Math.round(height * dpr))
      nextTarget.setSize(Math.round(width * dpr), Math.round(height * dpr))
      bloom.enabled = !lowMode() && live
      film.enabled = live
      if (current) buildPhotoMeshes(current, lowMode() ? 160 : 256, lowMode() ? 90 : 144)
      if (next) buildPhotoMeshes(next, lowMode() ? 160 : 256, lowMode() ? 90 : 144)
    }
    const addRain = (photo: PhotoSet) => {
      if (photo.rain) {
        photo.scene.remove(photo.rain)
        const oldMaterial = photo.rain.material
        if (Array.isArray(oldMaterial)) oldMaterial.forEach((item) => item.dispose())
        else oldMaterial.dispose()
      }
      photo.rain = rain.clone()
      const rainMaterial = (rain.material as ShaderMaterial).clone()
      rainMaterial.uniforms.uPhoto = { value: photo.color }
      rainMaterial.uniforms.uResolution = { value: rainResolution }
      photo.rain.material = rainMaterial
      photo.scene.add(photo.rain)
    }
    const rebuildRain = () => {
      rain.geometry.dispose()
      ;(rain.material as ShaderMaterial).dispose()
      rain = makeRain(quality === 'high' ? 700 : 350)
      rainUniforms = (rain.material as ShaderMaterial).uniforms
      if (current) addRain(current)
      if (next) addRain(next)
    }
    const stop = (reset = false) => {
      if (stopped) return
      stopped = true
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerdown', onPointer)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      disposePhoto(current)
      disposePhoto(next)
      if (rain.geometry) rain.geometry.dispose()
      ;(rain.material as ShaderMaterial).dispose()
      composer?.passes.forEach((pass) => pass.dispose?.())
      composer?.dispose()
      quad.geometry.dispose()
      quadMaterial.dispose()
      currentTarget?.dispose()
      nextTarget?.dispose()
      renderer?.dispose()
      renderer?.forceContextLoss()
      canvas.remove()
      root?.classList.remove('fx-live')
      host.classList.remove('is-live')
      if (reset) {
        host.classList.add('is-resetting')
        onScene(null)
      }
    }
    const updateSlides = (now: number, dt: number) => {
      const values = droplets.uniforms.uSlides.value as Vector4[]
      const trails = droplets.uniforms.uTrails.value as Vector4[]
      for (let i = 0; i < slideCount; i += 1) {
        const drop = slides[i]
        if (now >= drop.born) {
          // Stick and slip: short runs between pauses. Past the bottom edge it hurries on, so the
          // trail it leaves on screen dries up before the drop starts again higher up.
          if (now >= drop.nextChange) {
            drop.moving = !drop.moving
            drop.nextChange = now + (drop.moving ? 0.25 + random() * 0.7 : 0.3 + random() * 1.5)
            drop.speed = 0.12 + random() * 0.23
          }
          if (drop.moving) drop.y -= drop.speed * dt
          if (drop.y < -drop.radius * 2) drop.y -= dt * 0.6
          if (drop.y < -1.25) respawnSlide(drop, now + 1 + random() * 4)
        }
        const alpha = Math.max(0, Math.min(1, (now - drop.born) / 0.6))
        values[i].set(slidePathX(drop, drop.y), drop.y, drop.radius, alpha)
        trails[i].set(drop.x0, drop.phase, drop.top, 0)
      }
      droplets.uniforms.uTime.value = now
      droplets.uniforms.uSlideCount.value = slideCount
    }
    function tick(timestamp: number) {
      frame = 0
      if (stopped || !visible || document.hidden) return
      const dt = Math.min(0.05, Math.max(0.001, (timestamp - lastFrame) / 1000))
      const now = (timestamp - startedAt) / 1000
      lastFrame = timestamp
      scrollProgress += (scrollTarget - scrollProgress) * (1 - Math.exp(-dt * 2.2))
      pointerYaw += (targetYaw - pointerYaw) * (1 - Math.exp(-dt * 3))
      pointerPitch += (targetPitch - pointerPitch) * (1 - Math.exp(-dt * 3))
      stretch += (Math.min(1.2, Math.abs(scrollTarget - scrollProgress) * 0.7) - stretch) * (1 - Math.exp(-dt * 5))
      rainUniforms.uTime.value = now
      rainUniforms.uStretch.value = stretch
      for (const photo of [current, next]) {
        const material = photo?.rain?.material
        if (material && !Array.isArray(material)) {
          const uniforms = (material as ShaderMaterial).uniforms
          uniforms.uTime.value = now
          uniforms.uStretch.value = stretch
        }
      }
      if (!current) {
        frame = requestAnimationFrame(tick)
        return
      }
      const duration = current.data.duration
      const fade = 1.4
      const edge = duration - fade
      if (debug?.at != null) sceneTime = debug.at
      const effectiveTime = sceneTime
      const scrollAdvance = scrollProgress - scrollApplied
      scrollApplied = scrollProgress
      const blend = next ? Math.max(0, Math.min(1, (effectiveTime - edge) / fade)) : 0
      setCamera(current, effectiveTime, now)
      syncRainMapping(current)
      if (next?.rain) next.rain.visible = false
      renderer.setRenderTarget(currentTarget)
      renderer.clear(true, true, true)
      renderer.render(current.scene, camera)
      if (next && blend > 0) {
        setCamera(next, Math.max(0, (effectiveTime - edge)), now)
        syncRainMapping(next)
        renderer.setRenderTarget(nextTarget)
        renderer.clear(true, true, true)
        renderer.render(next.scene, camera)
      }
      renderer.setRenderTarget(null)
      const composite = composer.passes[0] as RenderPass
      const compositeUniforms = (composite.scene.children.find((child) => child instanceof Mesh) as Mesh).material as ShaderMaterial
      compositeUniforms.uniforms.tCurrent.value = currentTarget.texture
      compositeUniforms.uniforms.tNext.value = blend > 0 ? nextTarget.texture : currentTarget.texture
      compositeUniforms.uniforms.uMix.value = blend
      compositeUniforms.uniforms.uBlur.value = blend * 0.022
      updateSlides(now, dt)
      film.uniforms.uTime.value = now
      composer.render(dt)
      if (!live) {
        live = true
        liveAt = now
        sampleStart = timestamp
        host.classList.add('is-live')
        root?.classList.add('fx-live')
        onScene(currentIndex)
        bloom.enabled = !lowMode()
        film.enabled = true
      }
      if (next && blend >= 0.5 && !transitionSent) {
        transitionSent = true
        onScene((currentIndex + 1) % scenes.length)
      }
      if (next && blend >= 1) {
        disposePhoto(current)
        if (next.rain) next.rain.visible = true
        current = next
        next = null
        currentIndex = (currentIndex + 1) % scenes.length
        sceneTime = fade
        scrollApplied = scrollProgress
        transitionSent = false
        preloadPromise = null
        preloadNext()
      }
      if (!(next && blend >= 1)) {
        const walkRate = !next && sceneTime >= edge ? 0.12 : 1
        sceneTime += (dt + scrollAdvance) * walkRate
      }
      if (!forced && timestamp - sampleStart < 2000) {
        frameTimes.push(dt * 1000)
      } else if (!forced && frameTimes.length > 0) {
        const average = frameTimes.reduce((sum, value) => sum + value, 0) / frameTimes.length
        frameTimes.length = 0
        sampleStart = timestamp
        if (average > 24 && quality === 'high') {
          quality = 'low'
          droplets.uniforms.uDensity.value = 0.65
          slideCount = 1
          rebuildRain()
          resize()
        } else if (average > 34 && quality === 'low') {
          console.warn('Hero depth scene stopped because frame time remained high.')
          host.classList.add('is-resetting')
          window.setTimeout(() => stop(true), 650)
          return
        }
      }
      frame = requestAnimationFrame(tick)
    }
    canvas.addEventListener('webglcontextlost', onContextLost, false)
    resizeObserver.observe(host)
    intersection.observe(host)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('pointerdown', onPointer, { passive: true })
    const startup = loadScene(currentIndex)
    startup.then((photo) => {
      if (disposed) {
        disposePhoto(photo)
        return
      }
      current = photo
      addRain(photo)
      resize()
      preloadNext()
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick)
    }).catch((error) => {
      if (!disposed) {
        console.warn('Hero depth scene could not start.', error)
        stop()
      }
    })
    resize()
    frame = requestAnimationFrame(tick)
    return stop
  } catch (error) {
    canvas.remove()
    composer?.passes.forEach((pass) => pass.dispose?.())
    composer?.dispose()
    currentTarget?.dispose()
    nextTarget?.dispose()
    renderer?.dispose()
    renderer?.forceContextLoss()
    console.warn('Hero depth scene could not initialize.', error)
    return () => undefined
  }
}
