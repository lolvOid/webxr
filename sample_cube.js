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
let gl = null;
init();
animate();

function init() {
    scene = new THREE.Scene();



    camera = new THREE.PerspectiveCamera(50, fwidth / fheight, 0.01, 100);
    camera.position.set(3, 2, 5);

    directionalLight = new THREE.DirectionalLight(0xfefefe, 1);
    directionalLight.position.set(15, 5, 8);
    scene.add(directionalLight);


    ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    CreateModel();
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,




    })

    renderer.setSize(fwidth, fheight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    viewer.appendChild(renderer.domElement);



    controls = new THREE.OrbitControls(camera, renderer.domElement);
    //controls.addEventListener('change', render); // use if there is no animation loop
    controls.minDistance = 0;
    controls.maxDistance = 6;
    controls.target.set(0, 0, 0);


    window.addEventListener('resize', onWindowResize);

    onButtonClicked();
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
    requestAnimationFrame(animate);
    controls.update();

    $("#width").html(cube.scale.x);
    $("#height").html(cube.scale.y);
    $("#breadth").html(cube.scale.z);
    renderer.render(scene, camera);
}


function onButtonClicked() {
    $("#absolute_info").hide();
    $("#btnSmall").click(function () {
        cube.scale.set(1, 1, 1);
    });

    $("#btnLarge").click(function () {
        cube.scale.set(2, 2, 2);
    });

    $("#btnWSmall").click(function () {
        if(cube.scale.x == 1){
            return;    
        }
        else{
            cube.scale.x -=1;
        }
        
    });

    $("#btnWLarge").click(function () {
        
        if(cube.scale.x == 2){
            return;    
        }
        else{
            cube.scale.x +=1;
        }
        
    });

    $("#btnHSmall").click(function () {
        if(cube.scale.y == 1){
            return;    
        }
        else{
            cube.scale.y -=1;
        }
        
    });

    $("#btnHLarge").click(function () {
        
        if(cube.scale.y == 2){
            return;    
        }
        else{
            cube.scale.y +=1;
        }
        
    });

    $("#btnBSmall").click(function () {
        if(cube.scale.z == 1){
            return;    
        }
        else{
            cube.scale.z -=1;
        }
        
    });

    $("#btnBLarge").click(function () {
        
        if(cube.scale.z == 2){
            return;    
        }
        else{
            cube.scale.z +=1;
        }
        
    });

  


    $("#uniform").change(function () {
        if (this.checked) {
            $("#uniform_info").show();
            $("#absolute_info").hide();
        } else {
            $("#uniform_info").hide();
            $("#absolute_info").show();
        }
    })


    
}