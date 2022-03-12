

let polyfill = new WebXRPolyfill();

function LoadGltf(){

}


let canvas =null;
let gl = null;
let scene = null;
let directionalLight = null;
let ambientLight = null;
let renderer = null;
let gltfloader =  new THREE.GLTFLoader();
let reticle,flower;


async function activateXR() {
    // Add a canvas element and initialize a WebGL context that is compatible with WebXR.
    canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    gl = canvas.getContext("webgl", {
        xrCompatible: true
    });
    scene = new THREE.Scene();

    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 15, 10);
    scene.add(directionalLight);

    ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    // To be continued in upcoming steps.
    // Set up the WebGLRenderer, which handles rendering to the session's base layer.
    renderer = new THREE.WebGLRenderer({
        antialias:true,
        alpha: true,
        preserveDrawingBuffer: true,
        canvas: canvas,
        context: gl
      
    });
    renderer.autoClear = false;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
 
 
    gltfloader.load("media/gltf/reticle/reticle.gltf", function (gltf) {
        reticle = gltf.scene;
        reticle.visible = false;
        scene.add(reticle);
    })

   
    gltfloader.load("media/gltf/sunflower/sunflower.gltf", function (gltf) {
        flower = gltf.scene;

        flower.traverse(function (child) {
            console.log(child);
        });
    });


    const camera = new THREE.PerspectiveCamera();
    camera.matrixAutoUpdate = false;

    // Initialize a WebXR session using "immersive-ar".
    const session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["local", "hit-test"],
        domOverlay: {
            root: document.getElementById('overlay')
        }
    });
 
      
    session.updateRenderState({
        baseLayer: new XRWebGLLayer(session, gl)
    });

      
    // A 'local' reference space has a native origin that is located
    // near the viewer's position at the time the session was created.
    const referenceSpace = await session.requestReferenceSpace('local');


    // Create another XRReferenceSpace that has the viewer as the origin.
    const viewerSpace = await session.requestReferenceSpace('viewer');
    // Perform hit testing using the viewer as origin.
    const hitTestSource = await session.requestHitTestSource({
        space: viewerSpace
    });
   


    session.addEventListener("select", (event) => {
        if (flower) {
            const clone = flower.clone();

            clone.position.copy(reticle.position);
            scene.add(clone);
        }
    });

    // Create a render loop that allows us to draw on the AR view.
    const onXRFrame = (time, frame) => {
        // Queue up the next draw request.
        session.requestAnimationFrame(onXRFrame);
        document.getElementById('overlay').innerHTML = 'DOM Overlay type: ' + session.domOverlayState.type;
        // Bind the graphics framebuffer to the baseLayer's framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer)

        // Retrieve the pose of the device.
        // XRFrame.getViewerPose can return null while the session attempts to establish tracking.
        const pose = frame.getViewerPose(referenceSpace);
        if (pose) {
            // In mobile AR, we only have one view.
            const view = pose.views[0];

            const viewport = session.renderState.baseLayer.getViewport(view);
            renderer.setSize(viewport.width, viewport.height)
            renderer.setPixelRatio(window.devicePixelRatio);
  
            renderer.xr.enabled = true;
            renderer.xr.setReferenceSpaceType('local');
            renderer.xr.setSession(session);
            // Use the view's transform matrix and projection matrix to configure the THREE.camera.
            camera.matrix.fromArray(view.transform.matrix)
            camera.projectionMatrix.fromArray(view.projectionMatrix);
            camera.updateMatrixWorld(true);

            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0 && reticle) {
                const hitPose = hitTestResults[0].getPose(referenceSpace);
                reticle.visible = true;
                reticle.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose
                    .transform.position.z)
                reticle.updateMatrixWorld(true);
            }

            // Render the scene with THREE.WebGLRenderer.
            renderer.render(scene, camera)
            
        }
    }
    session.requestAnimationFrame(onXRFrame);
}


