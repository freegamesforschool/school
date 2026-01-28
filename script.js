const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
    alert("WebGL not supported");
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener("resize", resize);
resize();

// --- Shaders ---
const vsSource = `
attribute vec3 aPosition;
attribute vec3 aColor;
uniform mat4 uMVP;
varying vec3 vColor;
void main(void) {
    gl_Position = uMVP * vec4(aPosition, 1.0);
    vColor = aColor;
}
`;

const fsSource = `
precision mediump float;
varying vec3 vColor;
void main(void) {
    gl_FragColor = vec4(vColor, 1.0);
}
`;

function compileShader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
    }
    return s;
}

const vs = compileShader(gl.VERTEX_SHADER, vsSource);
const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);

const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
}
gl.useProgram(program);

// --- Geometry ---
// Taxi cube
const t = 0.5;
const cubeVertices = [
    // x, y, z,      r, g, b
    // Front
    -t, -t,  t,   1, 1, 0,
     t, -t,  t,   1, 1, 0,
     t,  t,  t,   1, 1, 0,
    -t,  t,  t,   1, 1, 0,
    // Back
    -t, -t, -t,   1, 1, 0,
     t, -t, -t,   1, 1, 0,
     t,  t, -t,   1, 1, 0,
    -t,  t, -t,   1, 1, 0,
];

// Ground plane
const g = 20;
const groundVertices = [
    -g, 0, -g,   0.1, 0.6, 0.1,
     g, 0, -g,   0.1, 0.6, 0.1,
     g, 0,  g,   0.1, 0.6, 0.1,
    -g, 0,  g,   0.1, 0.6, 0.1,
];

const vertices = new Float32Array([
    ...cubeVertices,
    ...groundVertices
]);

const indices = new Uint16Array([
    // Cube (0–7)
    0,1,2,  0,2,3,
    4,5,6,  4,6,7,
    3,2,6,  3,6,7,
    0,1,5,  0,5,4,
    0,3,7,  0,7,4,
    1,2,6,  1,6,5,
    // Ground (8–11)
    8,9,10,
    8,10,11
]);

const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const ibo = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

const stride = 6 * 4;
const aPosition = gl.getAttribLocation(program, "aPosition");
const aColor = gl.getAttribLocation(program, "aColor");

gl.enableVertexAttribArray(aPosition);
gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, stride, 0);

gl.enableVertexAttribArray(aColor);
gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, stride, 3 * 4);

const uMVP = gl.getUniformLocation(program, "uMVP");

// --- Matrix helpers ---
function perspective(out, fovy, aspect, near, far) {
    const f = 1.0 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = (2 * far * near) * nf; out[15] = 0;
}

function lookAt(out, eye, center, up) {
    let zx = eye[0] - center[0];
    let zy = eye[1] - center[1];
    let zz = eye[2] - center[2];
    let len = Math.hypot(zx, zy, zz);
    zx /= len; zy /= len; zz /= len;

    let xx = up[1] * zz - up[2] * zy;
    let xy = up[2] * zx - up[0] * zz;
    let xz = up[0] * zy - up[1] * zx;
    len = Math.hypot(xx, xy, xz);
    xx /= len; xy /= len; xz /= len;

    let yx = zy * xz - zz * xx;
    let yy = zz * xx - zx * xz;
    let yz = zx * xy - zy * xx;

    out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
    out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
    out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
    out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    out[15] = 1;
}

function identity(out) {
    out[0]=1; out[1]=0; out[2]=0; out[3]=0;
    out[4]=0; out[5]=1; out[6]=0; out[7]=0;
    out[8]=0; out[9]=0; out[10]=1; out[11]=0;
    out[12]=0; out[13]=0; out[14]=0; out[15]=1;
}

function multiply(out, a, b) {
    const o = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
        const ai0 = a[i], ai1 = a[i + 4], ai2 = a[i + 8], ai3 = a[i + 12];
        o[i]      = ai0 * b[0] + ai1 * b[1] + ai2 * b[2] + ai3 * b[3];
        o[i + 4]  = ai0 * b[4] + ai1 * b[5] + ai2 * b[6] + ai3 * b[7];
        o[i + 8]  = ai0 * b[8] + ai1 * b[9] + ai2 * b[10] + ai3 * b[11];
        o[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
    }
    out.set(o);
}

function translate(out, x, y, z) {
    out[12] += x;
    out[13] += y;
    out[14] += z;
}

function rotateY(out, rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const m0 = out[0], m4 = out[4], m8 = out[8];
    const m1 = out[1], m5 = out[5], m9 = out[9];
    const m2 = out[2], m6 = out[6], m10 = out[10];

    out[0] = m0 * c + m8 * -s;
    out[4] = m4 * c + m8 * -s;
    out[8] = m0 * s + m8 * c;

    out[1] = m1 * c + m9 * -s;
    out[5] = m5 * c + m9 * -s;
    out[9] = m1 * s + m9 * c;

    out[2] = m2 * c + m10 * -s;
    out[6] = m6 * c + m10 * -s;
    out[10] = m2 * s + m10 * c;
}

// --- Taxi state ---
let taxiX = 0;
let taxiZ = 0;
let taxiAngle = 0;

const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

const speed = 0.12;
const turnSpeed = 0.05;

// --- Render loop ---
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.02, 0.02, 0.05, 1);

function loop() {
    if (keys["ArrowLeft"]) taxiAngle += turnSpeed;
    if (keys["ArrowRight"]) taxiAngle -= turnSpeed;

    const dirX = Math.sin(taxiAngle);
    const dirZ = Math.cos(taxiAngle);

    if (keys["ArrowUp"]) {
        taxiX += dirX * speed;
        taxiZ += dirZ * speed;
    }
    if (keys["ArrowDown"]) {
        taxiX -= dirX * speed;
        taxiZ -= dirZ * speed;
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const proj = new Float32Array(16);
    const view = new Float32Array(16);
    const model = new Float32Array(16);
    const vp = new Float32Array(16);
    const mvp = new Float32Array(16);

    perspective(proj, Math.PI / 3, canvas.width / canvas.height, 0.1, 100);

    const eye = [taxiX - dirX * 5, 3, taxiZ - dirZ * 5];
    const center = [taxiX, 0.5, taxiZ];
    const up = [0, 1, 0];
    lookAt(view, eye, center, up);

    multiply(vp, proj, view);

    // Taxi model
    identity(model);
    translate(model, taxiX, 0.5, taxiZ);
    rotateY(model, taxiAngle);
    multiply(mvp, vp, model);
    gl.uniformMatrix4fv(uMVP, false, mvp);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

    // Ground model (identity)
    identity(model);
    multiply(mvp, vp, model);
    gl.uniformMatrix4fv(uMVP, false, mvp);
    gl.drawElements(gl.TRIANGLES, indices.length - 36, gl.UNSIGNED_SHORT, 36 * 2);

    requestAnimationFrame(loop);
}

loop();
