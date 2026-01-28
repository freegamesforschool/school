const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

if (!gl) {
  alert("WebGL not supported");
}

// Vertex shader
const vsSource = `
attribute vec3 aPos;
attribute vec3 aColor;

uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;

varying vec3 vColor;

void main() {
  gl_Position = uProj * uView * uModel * vec4(aPos, 1.0);
  vColor = aColor;
}
`;

// Fragment shader
const fsSource = `
precision mediump float;
varying vec3 vColor;

void main() {
  gl_FragColor = vec4(vColor, 1.0);
}
`;

function compileShader(type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return shader;
}

const vs = compileShader(gl.VERTEX_SHADER, vsSource);
const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);

const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.useProgram(program);

// Cube vertices
const cube = new Float32Array([
  // x, y, z,   r, g, b
  -1, -1, -1,  1, 0, 0,
   1, -1, -1,  0, 1, 0,
   1,  1, -1,  0, 0, 1,
  -1,  1, -1,  1, 1, 0,
]);

const cubeIdx = new Uint16Array([
  0, 1, 2,  2, 3, 0
]);

// Buffers
const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, cube, gl.STATIC_DRAW);

const ibo = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIdx, gl.STATIC_DRAW);

const stride = 6 * 4;
const aPos = gl.getAttribLocation(program, "aPos");
gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, stride, 0);
gl.enableVertexAttribArray(aPos);

const aColor = gl.getAttribLocation(program, "aColor");
gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, stride, 12);
gl.enableVertexAttribArray(aColor);

// Matrices
function mat4() {
  return new Float32Array(16);
}

function identity(m) {
  for (let i = 0; i < 16; i++) m[i] = 0;
  m[0] = m[5] = m[10] = m[15] = 1;
}

function perspective(m, fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  identity(m);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  m[15] = 0;
}

function translate(m, x, y, z) {
  m[12] += x;
  m[13] += y;
  m[14] += z;
}

const uProj = gl.getUniformLocation(program, "uProj");
const uView = gl.getUniformLocation(program, "uView");
const uModel = gl.getUniformLocation(program, "uModel");

const proj = mat4();
perspective(proj, Math.PI / 3, canvas.width / canvas.height, 0.1, 1000);

const view = mat4();
identity(view);

const model = mat4();
identity(model);

// Player position
let px = 0;
let pz = 5;

let keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

function update() {
  if (keys["w"]) pz -= 0.1;
  if (keys["s"]) pz += 0.1;
  if (keys["a"]) px -= 0.1;
  if (keys["d"]) px += 0.1;

  identity(view);
  translate(view, -px, -2, -pz - 5);
}

function render() {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  update();

  gl.uniformMatrix4fv(uProj, false, proj);
  gl.uniformMatrix4fv(uView, false, view);
  gl.uniformMatrix4fv(uModel, false, model);

  gl.drawElements(gl.TRIANGLES, cubeIdx.length, gl.UNSIGNED_SHORT, 0);

  requestAnimationFrame(render);
}

render();
