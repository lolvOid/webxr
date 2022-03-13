import {
    VRButton
} from "./threejs/webxr/VRButton.js";

import{
    ARButton
} from "./threejs/webxr/ARButton.js";
let scene = null;
let renderer = null;
let directionalLight, ambientLight;
let cube;
let uniform;
let camera;
const viewer = document.getElementById("modelviewer");
const fwidth = viewer.clientWidth;
const fheight = viewer.clientHeight;
let canvas;
let controls = null;




let reticle;
let gl = null;
let hitTestSource;
let hitTestSourceRequested = false;

let isAR;

init();
animate();
$("#ARButton").click(function () {
    cube.visible = false;
    isAR = true;
});


document.getElementById("place-button").style.display = "none";
            
$("#place-button").click(function(){
    arPlace();
});
function arPlace(){
    if ( reticle.visible ) {
        cube.position.setFromMatrixPosition(reticle.matrix);
        cube.visible = true;
    }
}
function init() {
    scene = new THREE.Scene();
    window.scene = scene;


    camera = new THREE.PerspectiveCamera(50, fwidth / fheight, 0.01, 100);
    camera.position.set(3, 2, 5);

    directionalLight = new THREE.DirectionalLight(0xfefefe, 1);
    directionalLight.position.set(0.5, 0.5, 1).normalize();
    scene.add(directionalLight);


    ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    CreateModel();

 

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,




    })
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(fwidth, fheight);

    renderer.xr.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    viewer.appendChild(renderer.domElement);
    // document.body.appendChild(VRButton.createButton(renderer));
    //AR SETUP

    let options = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
    }

    options.domOverlay = {
        root: document.getElementById('contentOverlay')
    };

    document.body.appendChild(ARButton.createButton(renderer, options));


    reticle = new THREE.Mesh(
        new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    renderer.domElement.addEventListener('touchstart', function (e) {
        e.preventDefault();
        touchDown = true;
        touchX = e.touches[0].pageX;
        touchY = e.touches[0].pageY;
    }, false);

    renderer.domElement.addEventListener('touchend', function (e) {
        e.preventDefault();
        touchDown = false;
    }, false);

    renderer.domElement.addEventListener('touchmove', function (e) {
        e.preventDefault();

        if (!touchDown) {
            return;
        }

        deltaX = e.touches[0].pageX - touchX;
        deltaY = e.touches[0].pageY - touchY;
        touchX = e.touches[0].pageX;
        touchY = e.touches[0].pageY;

        rotateObject();

    }, false);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    //controls.addEventListener('change', render); // use if there is no animation loop
    controls.minDistance = 1;
    controls.maxDistance = 6;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);


    window.addEventListener('resize', onWindowResize);


    onButtonClicked();

}

function rotateObject() {
    if (cube && reticle.visible) {
        cube.rotation.y += deltaX / 100;
    }
}

function CreateModel() {
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshStandardMaterial({
        color: 0xdfdfdf
    });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.set(0, 0, 0);
}

function onWindowResize() {

    camera.aspect = fwidth / fheight;
    camera.updateProjectionMatrix();
    renderer.setSize(fwidth, fheight);



}

function animate() {
    renderer.setAnimationLoop(render);
    requestAnimationFrame(animate);
    controls.update();

    $("#width").html(cube.scale.x);
    $("#height").html(cube.scale.y);
    $("#breadth").html(cube.scale.z);
    renderer.render(scene, camera);
}

$("#uniform").change(function () {
    if (this.checked) {
        $("#uniform_info").show();
        $("#absolute_info").hide();
    } else {
        $("#uniform_info").hide();
        $("#absolute_info").show();
    }
})
$("#absolute_info").hide();

function onButtonClicked() {


    

    $("#btnSmall").click(function () {
        cube.scale.set(1, 1, 1);
    });

    $("#btnLarge").click(function () {
        cube.scale.set(2, 2, 2);
    });

    $("#btnWSmall").click(function () {
        if (cube.scale.x == 1) {
            return;
        } else {
            cube.scale.x -= 1;
        }

    });

    $("#btnWLarge").click(function () {

        if (cube.scale.x == 2) {
            return;
        } else {
            cube.scale.x += 1;
        }

    });

    $("#btnHSmall").click(function () {
        if (cube.scale.y == 1) {
            return;
        } else {
            cube.scale.y -= 1;
        }

    });

    $("#btnHLarge").click(function () {

        if (cube.scale.y == 2) {
            return;
        } else {
            cube.scale.y += 1;
        }

    });

    $("#btnBSmall").click(function () {
        if (cube.scale.z == 1) {
            return;
        } else {
            cube.scale.z -= 1;
        }

    });

    $("#btnBLarge").click(function () {

        if (cube.scale.z == 2) {
            return;
        } else {
            cube.scale.z += 1;
        }

    });




    


}
var touchDown, touchX, touchY, deltaX, deltaY;



function render( timestamp, frame ) {

    if ( frame && isAR) {

        var referenceSpace = renderer.xr.getReferenceSpace();
        var session = renderer.xr.getSession();

        if ( hitTestSourceRequested === false ) {

            session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {

                session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

                    hitTestSource = source;

                } );

            } );

            session.addEventListener( 'end', function () {

                hitTestSourceRequested = false;
                hitTestSource = null;

                isAR = false;

                reticle.visible = false;
                var box = new THREE.Box3();
                box.setFromObject(current_object);
                box.center(controls.target);
                document.getElementById("place-button").style.display = "none";
                

            } );

            hitTestSourceRequested = true;

        }

        if ( hitTestSource ) {

            var hitTestResults = frame.getHitTestResults( hitTestSource );

            if ( hitTestResults.length ) {

                var hit = hitTestResults[ 0 ];

               
                document.getElementById("place-button").style.display = "block";
                reticle.visible = true;
                reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );

            } else {

                reticle.visible = false;
                document.getElementById("place-button").style.display = "none";
            

            }

        }

    }

    renderer.render( scene, camera );
}
