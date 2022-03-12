let renderer = null;
let scene = null;
let camera = null;
let reticle = null;
// button to start XR experience
let xrButton = document.getElementById('xr-button');

// to control the xr session
let xrSession = null;

// reference space used within an application
let xrRefSpace = null;

// Canvas OpenGL context used for rendering
let gl = null;
let xrHitTestSource = null;
function checkXR() {
    if (!window.isSecureContext) {
        document.getElementById("warning").innerText = "WebXR unavailable. Please use secure context";
    }
    if (navigator.xr) { // check to see if WebXR is supported
        navigator.xr.addEventListener('devicechange', checkSupportedState);
        checkSupportedState();
    } else {
        document.getElementById("warning").innerText = "WebXR unavailable for this browser";
    }
}

function checkSupportedState() {
    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        if (supported) {
            xrButton.innerHTML = 'Enter AR';
            xrButton.addEventListener('click', onButtonClicked);
        } else {
            xrButton.innerHTML = 'AR not found';
        }
        xrButton.disabled = !supported;
    });
}

function onButtonClicked() {
    if (!xrSession) {
        navigator.xr.requestSession('immersive-ar', {
            optionalFeatures: ['dom-overlay'],
            requiredFeatures: ['local'],
            domOverlay: {
                root: document.getElementById('overlay')
            }
        }).then(onSessionStarted, onRequestSessionError);
    } else {
        xrSession.end();
    }
}

function onSessionStarted(session) {
    xrSession = session;
    xrButton.innerHTML = 'Exit AR';

    // Show which type of DOM Overlay got enabled (if any)
    if (session.domOverlayState) {
        document.getElementById('info').innerHTML = 'DOM Overlay type: ' + session.domOverlayState.type;
    }

    session.addEventListener('end', onSessionEnded);
    // create a canvas element and WebGL context for rendering
    let canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl', {
        xrCompatible: true
    });
    session.updateRenderState({
        baseLayer: new XRWebGLLayer(session, gl)
    });

    session.requestReferenceSpace('local').then((refSpace) => {
        xrRefSpace = refSpace;
        // start WebXR rendering loop
        session.requestAnimationFrame(onXRFrame);
    });

}

function onRequestSessionError(ex) {
    document.getElementById('info').innerHTML = "Failed to start AR session.";
}

function onSessionEnded(event) {
    xrSession = null;
    xrButton.innerHTML = 'Enter AR';
    document.getElementById('info').innerHTML = '';
    gl = null;
}

function onXRFrame(t, frame) {
    let session = frame.session;
    session.requestAnimationFrame(onXRFrame);
    let pose = frame.getViewerPose(xrRefSpace);
    if (!pose) {
        return;
    }
    const pos = pose.transform.position;
    info.innerHTML = `x:${pos.x.toFixed(2)} y:${pos.y.toFixed(2)} z:${pos.z.toFixed(2)}`;
}
const initScene = (gl, session) => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var light = new THREE.PointLight(0xffffff, 2, 100); // soft white light
    light.position.z = 1;
    light.position.y = 5;
    scene.add(light);
    // create and configure three.js renderer with XR support
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        autoClear: true,
        context: gl,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');
    renderer.xr.setSession(session);
    
    // simple sprite to indicate detected surfaces
    reticle = new THREE.Mesh(
        new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshPhongMaterial({
            color: 0x0fff00
        })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    session.requestReferenceSpace('viewer').then((refSpace) => {
        session.requestHitTestSource({
            space: refSpace
        }).then((hitTestSource) => {
            xrHitTestSource = hitTestSource;
        });
    });

    initScene(gl, session);
    if (xrHitTestSource) xrHitTestSource.cancel();
        
};

function onXRFrame(t, frame) {
    let session = frame.session;
    session.requestAnimationFrame(onXRFrame);
    if (xrHitTestSource) {
      // obtain hit test results by casting a ray from the center of device screen
      // into AR view. Results indicate that ray intersected with one or more detected surfaces
      const hitTestResults = frame.getHitTestResults(xrHitTestSource);
      if (hitTestResults.length) {
        // obtain a local pose at the intersection point
        const pose = hitTestResults[0].getPose(xrRefSpace);
        // place a reticle at the intersection point
        reticle.matrix.fromArray( pose.transform.matrix );
        reticle.visible = true;
      }
    } else {  // do not show a reticle if no surfaces are intersected
      reticle.visible = false;
    }
    // bind our gl context that was created with WebXR to threejs renderer
    gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer);
    // render the scene
    renderer.render(scene, camera);
  }