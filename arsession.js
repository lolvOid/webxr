import { WebXRButton } from './js/util/webxr-button.js';
let xrRefSpace = null;
let xrViewerSpace = null;
let xrHitTestSource = null;
let gl = null;
let renderer = null;
let xrButton = null;
let loader = new THREE.GLTFLoader();
let reticle;let flower;

let scene = new THREE.Scene();

loader.load("media/gltf/reticle/reticle.gltf", function (gltf) {
    reticle = gltf.scene;
    reticle.visible = false;
    scene.add(reticle);
})


loader.load("media/gltf/sunflower/sunflower.gltf", function (gltf) {
    flower = gltf.scene;

    flower.traverse(function (child) {
        console.log(child);
    });
});
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 15, 10);
scene.add(directionalLight);

const light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
gl = canvas.getContext("webgl", {
    xrCompatible: true
});

renderer = new THREE.WebGLRenderer({
    alpha: true,
    preserveDrawingBuffer: true,
    canvas: canvas,
    context: gl
});
renderer.autoClear = false;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;



// The API directly updates the camera matrices.
// Disable matrix auto updates so three.js doesn't attempt
// to handle the matrices independently.
const camera = new THREE.PerspectiveCamera();
camera.matrixAutoUpdate = false;


function initXR(){
    xrButton = new WebXRButton({
        onRequestSession: onRequestSession,
        onEndSession: onEndSession,
        textEnterXRTitle: "START AR",
        textXRNotFoundTitle: "AR NOT FOUND",
        textExitXRTitle: "EXIT  AR",
    });

    document.querySelector('header').appendChild(xrButton.domElement);

    if (navigator.xr) {
        navigator.xr.isSessionSupported('immersive-ar')
            .then((supported) => {
                xrButton.enabled = supported;
            });
    }
}

function onSessionStarted(session) {
    session.addEventListener('end', onSessionEnded);
    session.addEventListener('select', onSelect);

    if (!gl) {
        gl = createWebGLContext({
            xrCompatible: true
        });

        renderer = new Renderer(gl);

        scene.setRenderer(renderer);
    }

    session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });


    session.requestReferenceSpace('viewer').then((refSpace) => {
        xrViewerSpace = refSpace;
        session.requestHitTestSource({ space: xrViewerSpace }).then((hitTestSource) => {
            xrHitTestSource = hitTestSource;
        });
    });

    session.requestReferenceSpace('local').then((refSpace) => {
        xrRefSpace = refSpace;

        session.requestAnimationFrame(onXRFrame);
    });
}
function onRequestSession() {
    return navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local', 'hit-test'] }).then((session) => {
        xrButton.setSession(session);
        onSessionStarted(session);
    });
}
function onEndSession(session) {
    xrHitTestSource.cancel();
    xrHitTestSource = null;
    session.end();
}

function onSessionEnded(event) {
    xrButton.setSession(null);
}
function addARObjectAt(matrix) {
    let newFlower = flower.clone();
    newFlower.visible = true;
    newFlower.matrix = matrix;
    scene.addNode(newFlower);

    flowers.push(newFlower);


    if (flowers.length > MAX_FLOWERS) {
        let oldFlower = flowers.shift();
        scene.removeNode(oldFlower);
    }
}

function onSelect(event) {
    if (reticle.visible) {

        addARObjectAt(reticle.matrix);
    }
}

function onXRFrame(t,frame){
    
}

initXR();