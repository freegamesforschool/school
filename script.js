const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
resize();
window.onresize = resize;

// --- SHADERS ---
const vs = `
attribute vec3 aPos;
attribute vec3 aColor;
uniform mat4 uMVP;
varying vec3 vColor;
void main() {
    gl_Position = uMVP * vec4(aPos, 1.0);
    vColor = aColor;
}`;
const fs = `
precision mediump float;
varying vec3 vColor;
void main() {
    gl_FragColor = vec4(vColor, 1.0);
}`;

function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
}

const program = gl.createProgram();
gl.attachShader(program, compile(gl.VERTEX_SHADER, vs));
gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fs));
gl.linkProgram(program);
gl.useProgram(program);

// --- BASIC CUBE GEOMETRY ---
function cube(size, r, g, b) {
    const s = size;
    const v = [
        // front
        -s, -s,  s, r,g,b,
         s, -s,  s, r,g,b,
         s,  s,  s, r,g,b,
        -s,  s,  s, r,g,b,
        // back
        -s, -s, -s, r,g,b,
         s, -s, -s, r,g,b,
         s,  s, -s, r,g,b,
        -s,  s, -s, r,g,b,
    ];
    const i = [
        0,1,2, 0,2,3,
        4,5,6, 4,6,7,
        3,2,6, 3,6,7,
        0,1,5, 0,5,4,
        0,3,7, 0,7,4,
        1,2,6, 1,6,5
    ];
    return {v:new Float32Array(v), i:new Uint16Array(i)};
}

const taxi = cube(0.5, 1,1,0);
const building = cube(1, 0.2,0.6,1);
const ground = cube(20, 0.1,0.5,0.1);

// --- BUFFER SETUP ---
function makeBuffer(obj) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, obj.v, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, "aPos");
    const aColor = gl.getAttribLocation(program, "aColor");

    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0);

    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 24, 12);

    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.i, gl.STATIC_DRAW);

    return {vao, count: obj.i.length};
}

const taxiMesh = makeBuffer(taxi);
const groundMesh = makeBuffer(ground);
const buildingMesh = makeBuffer(building);

// --- MATRIX MATH ---
function mat4() { return new Float32Array(16).fill(0); }
function identity(m) {
    m[0]=m[5]=m[10]=m[15]=1;
}
function perspective(m, fov, aspect, near, far) {
    const f = 1/Math.tan(fov/2);
    m[0]=f/aspect; m[5]=f;
    m[10]=(far+near)/(near-far);
    m[11]=-1;
    m[14]=(2*far*near)/(near-far);
}
function multiply(out, a, b) {
    const o = new Float32Array(16);
    for (let r=0;r<4;r++)
        for (let c=0;c<4;c++)
            o[r*4+c] =
                a[r*4+0]*b[0*4+c] +
                a[r*4+1]*b[1*4+c] +
                a[r*4+2]*b[2*4+c] +
                a[r*4+3]*b[3*4+c];
    out.set(o);
}
function translate(m, x,y,z) {
    m[12]+=x; m[13]+=y; m[14]+=z;
}
function rotateY(m, a) {
    const c=Math.cos(a), s=Math.sin(a);
    const m0=m[0], m2=m[2], m8=m[8], m10=m[10];
    m[0]=m0*c+m2*s;
    m[2]=m2*c-m0*s;
    m[8]=m8*c+m10*s;
    m[10]=m10*c-m8*s;
}

// --- GAME STATE ---
let tx=0, tz=0, tAngle=0;
const keys={};
document.onkeydown=e=>keys[e.key]=true;
document.onkeyup=e=>keys[e.key]=false;

// --- RENDER LOOP ---
const uMVP = gl.getUniformLocation(program, "uMVP");
gl.enable(gl.DEPTH_TEST);

function drawMesh(mesh, mvp) {
    gl.uniformMatrix4fv(uMVP, false, mvp);
    gl.bindVertexArray(mesh.vao);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
}

function loop() {
    // movement
    if (keys["ArrowLeft"]) tAngle += 0.05;
    if (keys["ArrowRight"]) tAngle -= 0.05;

    const dx = Math.sin(tAngle);
    const dz = Math.cos(tAngle);

    if (keys["ArrowUp"]) { tx+=dx*0.1; tz+=dz*0.1; }
    if (keys["ArrowDown"]) { tx-=dx*0.1; tz-=dz*0.1; }

    gl.clearColor(0.05,0.05,0.1,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // camera
    const proj = mat4();
    perspective(proj, Math.PI/3, canvas.width/canvas.height, 0.1, 100);

    const view = mat4(); identity(view);
    translate(view, -tx + dx*5, -3, -tz + dz*5);
    rotateY(view, -tAngle);

    const vp = mat4();
    multiply(vp, proj, view);

    // draw ground
    let model = mat4(); identity(model);
    let mvp = mat4(); multiply(mvp, vp, model);
    drawMesh(groundMesh, mvp);

    // draw taxi
    model = mat4(); identity(model);
    translate(model, tx, 0.5, tz);
    rotateY(model, tAngle);
    multiply(mvp, vp, model);
    drawMesh(taxiMesh, mvp);

    // draw buildings
    const buildingPositions = [
        [-5,0,-5],
        [ 6,0,-3],
        [-4,0, 7],
        [ 8,0, 5]
    ];

    for (const [bx,by,bz] of buildingPositions) {
        model = mat4(); identity(model);
        translate(model, bx, 1, bz);
        multiply(mvp, vp, model);
        drawMesh(buildingMesh, mvp);
    }

    requestAnimationFrame(loop);
}
loop();
