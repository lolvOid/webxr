import { WebXRButton } from './js/util/webxr-button.js';
import { Scene } from './js/render/scenes/scene.js';
import { Renderer, createWebGLContext } from './js/render/core/renderer.js';
import { Node } from './js/render/core/node.js';
import { Gltf2Node } from './js/render/nodes/gltf2.js';
import { DropShadowNode } from './js/render/nodes/drop-shadow.js';
import { vec3 } from './js/render/math/gl-matrix.js';
import { Ray } from './js/render/math/ray.js';


let xrButton = null;
let xrRefSpace = null;
let xrViewerSpace = null;
let xrHitTestSource = null;

let gl = null;
let renderer = null;
let scene = new Scene();
scene.enableStats(false);

let arObject = new Node();
arObject.visible = false;
scene.addNode(arObject);

let flower = new Gltf2Node({ url: 'media/gltf/lowpolytrees_pack/scene.gltf' });
arObject.addNode(flower);

let reticle = new Gltf2Node({ url: 'media/gltf/reticle/reticle.gltf' });
reticle.visible = false;
scene.addNode(reticle);


let shadow = new DropShadowNode();
vec3.set(shadow.scale, 0.15, 0.15, 0.15);
arObject.addNode(shadow);

const MAX_FLOWERS = 30;
let flowers = [];

scene.clear = false;

function initXR() {
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

function onRequestSession() {
    return navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local', 'hit-test'] }).then((session) => {
        xrButton.setSession(session);
        onSessionStarted(session);
    });
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

function onEndSession(session) {
    xrHitTestSource.cancel();
    xrHitTestSource = null;
    session.end();
}

function onSessionEnded(event) {
    xrButton.setSession(null);
}


function addARObjectAt(matrix) {
    let newFlower = arObject.clone();
    newFlower.visible = true;
    newFlower.matrix = matrix;
    scene.addNode(newFlower);

    flowers.push(newFlower);


    if (flowers.length > MAX_FLOWERS) {
        let oldFlower = flowers.shift();
        scene.removeNode(oldFlower);
    }
}

let rayOrigin = vec3.create();
let rayDirection = vec3.create();

function onSelect(event) {
    if (reticle.visible) {

        addARObjectAt(reticle.matrix);
    }
}


function onXRFrame(t, frame) {
    let session = frame.session;
    let pose = frame.getViewerPose(xrRefSpace);

    reticle.visible = false;


    if (xrHitTestSource && pose) {
        let hitTestResults = frame.getHitTestResults(xrHitTestSource);
        if (hitTestResults.length > 0) {
            let pose = hitTestResults[0].getPose(xrRefSpace);
            reticle.visible = true;
            reticle.matrix = pose.transform.matrix;
        }
    }

    scene.startFrame();

    session.requestAnimationFrame(onXRFrame);

    scene.drawXRFrame(frame, pose);

    scene.endFrame();
}


initXR();