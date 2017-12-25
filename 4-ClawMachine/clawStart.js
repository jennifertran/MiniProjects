// Made by Jennifer Tran

// Global Variables

// Graphics
var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();

// Claw Machine
var joystick, button, bar, wire, fancyClaw;
var resultBase, windows, guard, crystalMaterial;

// Floor parameters with Physics
var terrainMesh, texture;
var terrainWidthExtents = 2000;
var terrainDepthExtents = 2000;
var terrainWidth = 80;
var terrainDepth = 100;
var terrainHalfWidth = terrainWidth / 2;
var terrainHalfDepth = terrainDepth / 2;
var terrainMinHeight = 0;
var terrainMaxHeight = 0;

var mirrorCube, mirrorCubeCamera;

// Physics variables
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var physicsWorld;
var terrainBody;
var dynamicObjects = [];
var transformAux1 = new Ammo.btTransform();
var deltaTime;

var heightData = null;
var ammoHeightData = null;

var time = 0;
var objectTimePeriod = 0.5;
var timeNextSpawn = time + objectTimePeriod;

try {
  init();
  initPhysics();
  fillScene();
  addToDOM();

  animate();
} catch (error) {
  console.log("You did something bordering on utter madness. Error was:");
  console.log(error);
}


function init() {
  heightData = new Float32Array(terrainWidth * terrainDepth);

  var canvasWidth = window.innerWidth;
  var canvasHeight = window.innerHeight;
  var canvasRatio = canvasWidth / canvasHeight;

  // Set up a renderer. This will allow WebGL to make your scene appear
  renderer = new THREE.WebGLRenderer({antialias: true});

  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.setSize(canvasWidth, canvasHeight);

  renderer.setClearColor(0x000000, 2.0);

  // You also want a camera. The camera has a default position, but you most likely want to change this.
  // This might include a different position and/or a different field of view etc.
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 4000);

  // Moving the camera with the mouse is simple enough - so this is provided. However, note that by default,
  // the keyboard moves the viewpoint as well
  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
  camera.position.set(0, 1200, 800);
  cameraControls.target.set(0, 0, 0);

}

// Auto resizes the screen
function onWindowResize() {
  if (camera) {
    camera.aspect = (window.innerWidth) / (window.innerHeight);
    camera.updateProjectionMatrix();
    renderer.setSize((window.innerWidth), (window.innerHeight));
  }
}

function fillScene() {
  scene = new THREE.Scene();

  var light = new THREE.HemisphereLight(0x9b9da0, 0x080820, 0.2);
  scene.add(light);

  var ambient = new THREE.AmbientLight(0x1c1d1e, 0.1);
  scene.add(ambient);

  var spotLight = new THREE.SpotLight(0xffffff, 0.9);
  spotLight.position.set(300, 1300, 400);
  spotLight.angle = 0.80;
  spotLight.distance = 1000;
  spotLight.castShadow = true;
  spotLight.intensity = 5;
  scene.add(spotLight);

  // Claw Machine Lighting

  // Right
  var goldLight = new THREE.SpotLight(0xFFC300);
  goldLight.position.set(200, 800, 0);
  goldLight.angle = 0.30;
  goldLight.distance = 450;
  goldLight.power = 10;
  goldLight.castShadow = true;
  goldLight.intensity = 25;
  scene.add(goldLight);

  // Left
  var goldLight2 = new THREE.SpotLight(0xFFC300);
  goldLight2.position.set(-200, 800, 0);
  goldLight2.angle = -0.30;
  goldLight2.distance = 450;
  goldLight2.power = 10;
  goldLight2.castShadow = true;
  goldLight2.intensity = 25;
  scene.add(goldLight2);

  // Middle
  var goldLight3 = new THREE.PointLight(0xf7641b, 100);
  goldLight3.position.set(0, 580, 0);
  goldLight3.distance = 200;
  goldLight3.power = 10;
  goldLight3.castShadow = true;
  goldLight3.intensity = 10;

  scene.add(goldLight3);


  scene.fog = new THREE.Fog(0x808080, 2000, 4000);

  // Lighting

  // var light;

  light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(0, 800, 700);

  scene.add(light);

  var light2 = new THREE.DirectionalLight(0xffffff, 0.9);
  light2.angle = 0.25
  light2.position.set(700, 800, 0);

  var light3 = new THREE.DirectionalLight(0xffffff, 0.9);
  light3.angle = -0.50
  light3.position.set(-700, 800, 0);

  // Glow effects
  var glowMap = new THREE.TextureLoader().load('glow.png');
  var glowMaterial = new THREE.SpriteMaterial({
    map: glowMap,
    color: 0xf7db0c,
    transparent: false,
    blending: THREE.AdditiveBlending
  });
  var textGlow = new THREE.Sprite(glowMaterial);

  textGlow.scale.set(800, 250, 1);
  textGlow.position.set(0, 850, 160);
  scene.add(textGlow);

  var glowButton = new THREE.Sprite(glowMaterial);

  glowButton.scale.set(90, 90, 1);
  glowButton.position.set(100, 400, 200);
  scene.add(glowButton);

  var glowSlot = new THREE.Sprite(glowMaterial);
  glowSlot.scale.set(30, 70, 1);
  glowSlot.position.set(130, 320, 250);
  scene.add(glowSlot);

  // floors and walls
  var geometry = new THREE.PlaneBufferGeometry(terrainWidthExtents, terrainDepthExtents, terrainWidth - 1, terrainDepth - 1);
  geometry.rotateX(-Math.PI / 2);

  var vertices = geometry.attributes.position.array;

  for (var i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {

    // j + 1 because it is the y component that we modify
    vertices[j + 1] = heightData[i];

  }

  geometry.computeVertexNormals();

  var floorTexture = new THREE.TextureLoader().load('marbleFloor.jpg', function (texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
  });

  var floorMaterial = new THREE.MeshPhongMaterial({
    map: floorTexture,
    transparent: true,
    opacity: 0.6
  });

  terrainMesh = new THREE.Mesh(geometry, floorMaterial);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  mirrorCubeCamera = new THREE.CubeCamera(0.1, 10000, 500);
  mirrorCubeCamera.position.set(0, -800, 0);
  scene.add(mirrorCubeCamera);


  var mirrorCubeMaterial = new THREE.MeshBasicMaterial({
    envMap: mirrorCubeCamera.renderTarget.texture
  });

  mirrorCube = new THREE.Mesh(geometry, mirrorCubeMaterial);
  mirrorCube.position.set(0, -1, 0);

  scene.add(mirrorCube);

  // Walls
  var wallTexture = new THREE.TextureLoader().load('marbleWall.jpg', function (texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
  });

  var wallMaterial = new THREE.MeshPhongMaterial({map: wallTexture, side: THREE.DoubleSide});

  var geo = new THREE.PlaneBufferGeometry(2000, 1500, 10, 10);
  var backWall = new THREE.Mesh(geo, wallMaterial);
  backWall.position.z = -1000;
  backWall.position.y = 750;

  scene.add(backWall);

  geo = new THREE.PlaneBufferGeometry(2000, 1500, 10, 10);

  var leftWall = new THREE.Mesh(geo, wallMaterial);
  leftWall.position.y = 750;
  leftWall.position.x = -1000;
  leftWall.rotateY(Math.PI / 2);
  scene.add(leftWall);

  var rightWall = new THREE.Mesh(geo, wallMaterial);
  rightWall.position.y = 750;
  rightWall.position.x = 1000;
  rightWall.rotateY(Math.PI / 2);
  scene.add(rightWall);


  // X,Y,Z Axis
  // var axes = new THREE.AxisHelper(1500);
  // scene.add(axes);


  drawClawMachine();
}

function drawClawMachine() {

  var luxuryTexture = new THREE.TextureLoader().load('luxury.jpg', function (texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
  });

  var luxuryMaterial = new THREE.MeshStandardMaterial({map: luxuryTexture});

  var goldTexture = new THREE.TextureLoader().load('gold.jpg', function (texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
  });

  var goldMaterial = new THREE.MeshStandardMaterial({map: goldTexture});

  var crystalTexture = new THREE.TextureLoader().load('crystal.jpg', function (texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
  });

  crystalMaterial = new THREE.MeshPhongMaterial({map: crystalTexture, shininess: 55});

  var frontMaterials = [
    new THREE.MeshBasicMaterial({transparent: true, opacity: 0.0, side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({transparent: true, opacity: 0.0, side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({transparent: true, opacity: 0.0, side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({transparent: true, opacity: 0.0, side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({color: 0xF5F5F5, transparent: true, opacity: 0.4, side: THREE.FrontSide}),
    new THREE.MeshBasicMaterial({color: 0xF5F5F5, transparent: true, opacity: 0.4, side: THREE.FrontSide})];

  var frontMaterial = new THREE.MeshFaceMaterial(frontMaterials);

  var sideMaterials = [
    new THREE.MeshBasicMaterial({color: 0xF5F5F5, transparent: true, opacity: 0.4, side: THREE.FrontSide}),
    new THREE.MeshBasicMaterial({color: 0xF5F5F5, transparent: true, opacity: 0.4, side: THREE.FrontSide}),
    new THREE.MeshBasicMaterial({transparent: true, opacity: 0.0, side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({transparent: true, opacity: 0.0, side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({transparent: true, opacity: 0.0, side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({transparent: true, opacity: 0.0, side: THREE.DoubleSide})];

  var sideMaterial = new THREE.MeshFaceMaterial(sideMaterials);

  var guardMaterials = [
    new THREE.MeshBasicMaterial({color: 0xF5F5F5, transparent: true, opacity: 0.6, side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({color: 0xF5F5F5, transparent: true, opacity: 0.6, side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({color: 0xF5F5F5, transparent: true, opacity: 0.6, side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({color: 0xF5F5F5, transparent: true, opacity: 0.6, side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({color: 0xF5F5F5, transparent: true, opacity: 0.6, side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({color: 0xF5F5F5, transparent: true, opacity: 0.6, side: THREE.DoubleSide})];

  var guardMaterial = new THREE.MeshFaceMaterial(guardMaterials);

  // Add text to machine
  var loader = new THREE.FontLoader();

  var materialArray = [crystalMaterial, luxuryMaterial];
  var textMaterial = new THREE.MeshFaceMaterial(materialArray);

  loader.load('helvetiker_bold.typeface.json', function (font) {

    var textGeo = new THREE.TextGeometry("Luxury", {

      font: font,

      size: 100,
      height: 50,
      curveSegments: 20,

      bevelThickness: 3,
      bevelSize: 10,
      bevelEnabled: true

    });


    var mesh = new THREE.Mesh(textGeo, textMaterial);
    mesh.position.set(-210, 800, 180);

    scene.add(mesh);

  });

  // This is where the model gets created. Add the appropriate geometry to create your machine
  // You are not limited to using BoxGeometry, and likely want to use other types of geometry for pieces of your submission
  // Note that the actual shape, size and other factors are up to you, provided constraints listed in the assignment description are met

  var base = new THREE.Mesh(new THREE.BoxGeometry(500, 400, 300));
  var cube_bsp = new ThreeBSP(base);

  // Prize chute
  var sub = new THREE.Mesh(new THREE.BoxGeometry(100, 300, 80));
  sub.position.x = -140;
  sub.position.z = 50;
  sub.position.y = 100;

  var substract_bsp = new ThreeBSP(sub);
  var subtract_bsp1 = cube_bsp.subtract(substract_bsp);
  var sub2 = new THREE.Mesh(new THREE.BoxGeometry(100, 80, 80));
  sub2.position.z = 110;
  sub2.position.y = -10;
  sub2.position.x = -140;
  substract_bsp = new ThreeBSP(sub2);
  subtract_bsp = subtract_bsp1.subtract(substract_bsp);

  resultBase = subtract_bsp.toMesh();
  resultBase.material = luxuryMaterial;
  resultBase.position.y = 200;

  scene.add(resultBase);
  addPhysics(resultBase, 500, 400, 300);

  // A supporting arms

  // purple
  stand1 = new THREE.Mesh(new THREE.BoxGeometry(50, 400, 50), goldMaterial);
  stand1.position.x = -225;
  stand1.position.y = 600;
  stand1.position.z = -125;
  scene.add(stand1);
  addPhysics(stand1, 50, 400, 50);


  // yellow
  stand2 = new THREE.Mesh(new THREE.BoxGeometry(50, 400, 50), goldMaterial);
  stand2.position.x = 225;
  stand2.position.y = 600;
  stand2.position.z = 125;
  scene.add(stand2);
  addPhysics(stand2, 50, 400, 50);

  // green
  stand3 = new THREE.Mesh(new THREE.BoxGeometry(50, 400, 50), goldMaterial);
  stand3.position.x = -225;
  stand3.position.y = 600;
  stand3.position.z = 125;
  scene.add(stand3);
  addPhysics(stand3, 50, 400, 50);

  // red
  stand4 = new THREE.Mesh(new THREE.BoxGeometry(50, 400, 50), goldMaterial);
  stand4.position.x = 225;
  stand4.position.y = 600;
  stand4.position.z = -125;
  scene.add(stand4);
  addPhysics(stand4, 50, 400, 50);

  // top part
  var top = new THREE.Mesh(new THREE.BoxGeometry(500, 50, 300), luxuryMaterial)
  top.position.y = 825;
  scene.add(top);

  // prize guard
  guardSide1 = new THREE.Mesh(new THREE.BoxGeometry(10, 200, 120), guardMaterial);
  guardSide1.position.y = 430;
  guardSide1.position.x = -70;
  guardSide1.position.z = 58;
  scene.add(guardSide1);
  addPhysics(guardSide1, 10, 200, 120);

  guardSide2 = new THREE.Mesh(new THREE.BoxGeometry(140, 200, 10), guardMaterial);
  guardSide2.position.y = 430;
  guardSide2.position.x = -145;
  scene.add(guardSide2);
  addPhysics(guardSide2, 140, 200, 10);

  // windows
  frontWindow = new THREE.Mesh(new THREE.BoxGeometry(399, 399, 20), frontMaterial);
  frontWindow.position.y = 600;
  frontWindow.position.z = 125;
  scene.add(frontWindow);
  addPhysics(frontWindow, 399, 399, 20);

  backWindow = new THREE.Mesh(new THREE.BoxGeometry(399, 399, 20), frontMaterial);
  backWindow.position.y = 600;
  backWindow.position.z = -125;
  scene.add(backWindow);
  addPhysics(backWindow, 399, 399, 20);

  leftWindow = new THREE.Mesh(new THREE.BoxGeometry(20, 399, 199), sideMaterial);
  leftWindow.position.x = -225;
  leftWindow.position.y = 600;
  scene.add(leftWindow);
  addPhysics(leftWindow, 20, 399, 199);

  rightWindow = new THREE.Mesh(new THREE.BoxGeometry(20, 399, 199), sideMaterial);
  rightWindow.position.x = 225;
  rightWindow.position.y = 600;
  scene.add(rightWindow);
  addPhysics(rightWindow, 20, 399, 199);

  // control box
  var controlBox = new THREE.Mesh(new THREE.BoxGeometry(200, 400, 100));
  cube_bsp = new ThreeBSP(controlBox);

  sub = new THREE.Mesh(new THREE.BoxGeometry(20, 50, 20));
  sub.position.x = 55;
  sub.position.z = 40;
  sub.position.y = 115;

  substract_bsp = new ThreeBSP(sub);
  subtract_bsp1 = cube_bsp.subtract(substract_bsp);

  var resultCtrlBox = subtract_bsp1.toMesh();
  resultCtrlBox.material = goldMaterial;
  resultCtrlBox.position.x = 75;
  resultCtrlBox.position.y = 200;
  resultCtrlBox.position.z = 200;

  scene.add(resultCtrlBox);
  addPhysics(resultCtrlBox, 200, 400, 100);

  // joystick
  var handle = new THREE.Mesh(new THREE.SphereGeometry(10, 10, 10), luxuryMaterial);
  handle.position.y = 30;

  var stick = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 30), crystalMaterial);
  stick.position.y = 10;

  joystick = new THREE.Object3D();
  joystick.add(handle);
  joystick.add(stick);

  joystick.position.y = 400;
  joystick.position.x = 25;
  joystick.position.z = 200;

  scene.add(joystick);

  // drop button
  button = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 10), luxuryMaterial);

  button.position.x = 100;
  button.position.y = 405;
  button.position.z = 200;
  scene.add(button);

  // frame
  rightFrame = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 200));
  rightFrame.position.x = 390;

  topFrame = new THREE.Mesh(new THREE.BoxGeometry(390, 10, 10));
  topFrame.position.z = -95;
  topFrame.position.x = 195;

  bottomFrame = new THREE.Mesh(new THREE.BoxGeometry(390, 10, 10));
  bottomFrame.position.z = 95;
  bottomFrame.position.x = 195;

  leftFrame = new THREE.BoxGeometry(10, 10, 200);

  rightFrame.updateMatrix();
  topFrame.updateMatrix();
  bottomFrame.updateMatrix();

  leftFrame.merge(rightFrame.geometry, rightFrame.matrix);
  leftFrame.merge(topFrame.geometry, topFrame.matrix);
  leftFrame.merge(bottomFrame.geometry, bottomFrame.matrix);

  // Claw mechanism
  var clawMech = new THREE.Object3D();
  clawMech.position.y = 780;

  var frame = new THREE.Mesh(leftFrame);
  frame.material = luxuryMaterial;
  frame.position.x = -195;

  clawMech.add(frame);

  bar = new THREE.Object3D();
  bar.add(new THREE.Mesh(new THREE.BoxGeometry(380, 10, 10), goldMaterial));

  claw = new THREE.Object3D();
  claw.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), luxuryMaterial));

  wire = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 100), goldMaterial);
  wire.position.y = -40;

  var top1 = new THREE.Mesh(new THREE.BoxGeometry(5, 30, 5), goldMaterial);
  top1.rotateX(-(Math.PI / 4));
  top1.position.z = 13;

  var bottom1 = new THREE.Mesh(new THREE.BoxGeometry(5, 40, 5), goldMaterial);
  bottom1.position.z = 23;
  bottom1.position.y = -29;

  var top2 = new THREE.Mesh(new THREE.BoxGeometry(5, 30, 5), goldMaterial);
  top2.rotateX(Math.PI / 4);
  top2.position.z = -13;

  var bottom2 = new THREE.Mesh(new THREE.BoxGeometry(5, 40, 5), goldMaterial);
  bottom2.position.z = -23;
  bottom2.position.y = -29;

  var top3 = new THREE.Mesh(new THREE.BoxGeometry(5, 30, 5), goldMaterial);
  top3.rotateZ(Math.PI / 4);
  top3.position.x = 13;

  var bottom3 = new THREE.Mesh(new THREE.BoxGeometry(5, 40, 5), goldMaterial);
  bottom3.position.x = 23;
  bottom3.position.y = -29;

  var top4 = new THREE.Mesh(new THREE.BoxGeometry(5, 30, 5), goldMaterial);
  top4.rotateZ(-(Math.PI / 4));
  top4.position.x = -13;

  var bottom4 = new THREE.Mesh(new THREE.BoxGeometry(5, 40, 5), goldMaterial);
  bottom4.position.x = -23;
  bottom4.position.y = -29;

  fancyClaw = new THREE.Object3D();
  fancyClaw.add(top1);
  fancyClaw.add(top2);
  fancyClaw.add(top3);
  fancyClaw.add(top4);
  fancyClaw.add(bottom1);
  fancyClaw.add(bottom2);
  fancyClaw.add(bottom3);
  fancyClaw.add(bottom4);

  fancyClaw.position.y = wire.position.y - 60;

  claw.add(wire);
  claw.add(fancyClaw);

  bar.add(claw);
  clawMech.add(bar);

  scene.add(clawMech);

  var i = 0;

  while (i <= 20) {
    generateObject();
    i++;
  }
  i = 0;


}

function initPhysics() {

  // Physics configuration

  collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  broadphase = new Ammo.btDbvtBroadphase();
  solver = new Ammo.btSequentialImpulseConstraintSolver();
  physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
  physicsWorld.setGravity(new Ammo.btVector3(0, -100, 0));

  // Create the terrain body
  var groundShape = this.createTerrainShape(heightData);
  var groundTransform = new Ammo.btTransform();
  groundTransform.setIdentity();

  // Shifts the terrain, since bullet re-centers it on its bounding box.
  groundTransform.setOrigin(new Ammo.btVector3(0, 0, 0));
  var groundMass = 0;
  var groundLocalInertia = new Ammo.btVector3(0, 0, 0);
  var groundMotionState = new Ammo.btDefaultMotionState(groundTransform);
  var groundBody = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(groundMass, groundMotionState, groundShape, groundLocalInertia));
  physicsWorld.addRigidBody(groundBody);

}

function addPhysics(currObject, x, y, z) {
  var sx = x;
  var sy = y;
  var sz = z;

  shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
  shape.setMargin(0.05);

  var localInertia = new Ammo.btVector3(0, 0, 0);
  shape.calculateLocalInertia(0, localInertia);
  var transform = new Ammo.btTransform();
  transform.setIdentity();

  var pos = currObject.position;
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));

  var motionState = new Ammo.btDefaultMotionState(transform);

  var rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, localInertia);
  var body = new Ammo.btRigidBody(rbInfo);

  currObject.userData.physicsBody = body;
  currObject.receiveShadow = true;
  currObject.castShadow = true;

  scene.add(currObject);
  dynamicObjects.push(currObject);

  physicsWorld.addRigidBody(body);
}

function createTerrainShape() {

  // This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
  var heightScale = 1;

  // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
  var upAxis = 1;

  // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
  var hdt = "PHY_FLOAT";

  // Set this to your needs (inverts the triangles)
  var flipQuadEdges = false;

  // Creates height data buffer in Ammo heap
  ammoHeightData = Ammo._malloc(4 * terrainWidth * terrainDepth);

  // Copy the javascript height data array to the Ammo one.
  var p = 0;
  var p2 = 0;
  for (var j = 0; j < terrainDepth; j++) {
    for (var i = 0; i < terrainWidth; i++) {

      // write 32-bit float data to memory
      Ammo.HEAPF32[ammoHeightData + p2 >> 2] = heightData[p];

      p++;

      // 4 bytes/float
      p2 += 4;
    }
  }

  // Creates the heightfield physics shape
  var heightFieldShape = new Ammo.btHeightfieldTerrainShape(
    terrainWidth,
    terrainDepth,
    ammoHeightData,
    heightScale,
    terrainMinHeight,
    terrainMaxHeight,
    upAxis,
    hdt,
    flipQuadEdges
  );

  // Set horizontal scale
  var scaleX = terrainWidthExtents / ( terrainWidth - 1 );
  var scaleZ = terrainDepthExtents / ( terrainDepth - 1 );
  heightFieldShape.setLocalScaling(new Ammo.btVector3(scaleX, 1, scaleZ));

  heightFieldShape.setMargin(0.05);

  return heightFieldShape;

}

// We want our document object model (a javascript / HTML construct) to include our canvas
// These allow for easy integration of webGL and HTML
function addToDOM() {
  var canvas = document.getElementById('canvas');
  canvas.appendChild(renderer.domElement);
}

function generateObject() {
  var numTypes = 4;
  var objectType = Math.ceil(Math.random() * numTypes);

  var threeObject = null;
  var shape = null;

  var objectSize = 30;
  var margin = 0.05;

  switch (objectType) {
    case 1:
      // Sphere
      var radius = 10 + Math.random() * objectSize;
      threeObject = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 20), crystalMaterial);
      shape = new Ammo.btSphereShape(radius);
      shape.setMargin(margin);
      break;
    case 2:
      // Box
      var sx = 10 + Math.random() * objectSize;
      var sy = 10 + Math.random() * objectSize;
      var sz = 10 + Math.random() * objectSize;
      threeObject = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), crystalMaterial);
      shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
      shape.setMargin(margin);
      break;
    case 3:
      // Cylinder
      var radius = 10 + Math.random() * objectSize;
      var height = 10 + Math.random() * objectSize;
      threeObject = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 20, 1), crystalMaterial);
      shape = new Ammo.btCylinderShape(new Ammo.btVector3(radius, height * 0.5, radius));
      shape.setMargin(margin);
      break;
    default:
      // Cone
      var radius = 10 + Math.random() * objectSize;
      var height = 20 + Math.random() * objectSize;
      threeObject = new THREE.Mesh(new THREE.CylinderGeometry(0, radius, height, 20, 2), crystalMaterial);
      shape = new Ammo.btConeShape(radius, height);
      break;
  }

  var newX = Math.floor(Math.random() * 40) + 1;
  var newZ = Math.floor(Math.random() * 20) + 1;

  threeObject.position.set(newX, 500, newZ)
  var mass = objectSize * 5;
  var localInertia = new Ammo.btVector3(0, 0, 0);
  shape.calculateLocalInertia(mass, localInertia);
  var transform = new Ammo.btTransform();
  transform.setIdentity();
  var pos = threeObject.position;
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  var motionState = new Ammo.btDefaultMotionState(transform);
  var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
  var body = new Ammo.btRigidBody(rbInfo);

  threeObject.userData.physicsBody = body;

  threeObject.receiveShadow = true;
  threeObject.castShadow = true;

  scene.add(threeObject);
  dynamicObjects.push(threeObject);

  physicsWorld.addRigidBody(body);

}

// This is a browser callback for repainting
// Since you might change view, or move things
// We cant to update what appears
var currScale = 1;
var isDrop = false;
var atBottom = false;
var waiting = true;

function animate() {
  window.requestAnimationFrame(animate);

  if (isDrop) {
    if (wire.position.y >= -140 && !atBottom) {
      currScale += 0.2;
      wire.scale.set(1, currScale, 1);
      wire.position.y -= 10;
      fancyClaw.position.y -= 20;
    } else {
      atBottom = true;
    }

    if (time > timeNextSpawn) {

      if (atBottom) {
        if (wire.position.y <= -40) {
          currScale -= 0.2;
          wire.scale.set(1, currScale, 1);
          wire.position.y += 10;
          fancyClaw.position.y += 20;
        }
        else {
          isDrop = false;
          atBottom = false;
        }
      }

      timeNextSpawn = time + objectTimePeriod;
      deltaTime = clock.getDelta();
      time += deltaTime;
    }

  }


  render();
}

// getDelta comes from THREE.js - this tells how much time passed since this was last called
// This might be useful if time is needed to make things appear smooth, in any animation, or calculation
// The following function stores this, and also renders the scene based on the defined scene and camera

function render() {
  deltaTime = clock.getDelta();
  cameraControls.update(deltaTime);

  mirrorCube.visible = false;
  mirrorCubeCamera.updateCubeMap(renderer, scene);
  mirrorCube.visible = true;

  updatePhysics(deltaTime);


  renderer.render(scene, camera);
  time += deltaTime;
}

function updatePhysics(deltaTime) {

  physicsWorld.stepSimulation(deltaTime, 10);

  // Update objects
  for (var i = 0, il = dynamicObjects.length; i < il; i++) {
    var objThree = dynamicObjects[i];
    var objPhys = objThree.userData.physicsBody;
    var ms = objPhys.getMotionState();
    if (ms) {

      ms.getWorldTransform(transformAux1);
      var p = transformAux1.getOrigin();
      var q = transformAux1.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

    }
  }
}

var currZ = 0;
var currX = 0;

function moveBar(number) {
  currZ += number;

  if (currZ >= -75 && currZ <= 75) {
    bar.position.z = currZ;
  } else {
    currZ -= number;
  }
  render();
}

function moveClaw(number) {
  currX = currX + number;

  if (currX >= -175 && currX <= 175) {
    claw.position.x = currX;
  } else {
    currX -= number;
  }

  render();
}

var isDropped = false;

function dropClaw() {
  isDrop = true;
}

// Changes from “generic” view to “egocentric” view
var prevKey = -1;
var flag = false;
var isEgo = false;

function activity(e) {
  var keyCode = e.keyCode;

  if (keyCode === 86) {
    // v
    if (!isEgo) {
      cameraControls.target.set(0, 0, -100);
      camera.position.set(0, 800, 240);
      isEgo = true;
    } else {
      cameraControls.target.set(4, 301, 92);
      camera.position.set(800, 600, 500);
      isEgo = false;
    }
    render();
  }
  // spacebar
  else if (keyCode === 32) {
    if (!flag) {
      button.scale.y = 0.5;
      flag = true;
    } else {
      button.scale.y = 1;
      flag = false;
    }
    dropClaw();
    render();
  }
  else if (keyCode === 87) {
    // w
    if (prevKey === -1) {
      joystick.rotateX(-(Math.PI / 4));
    }
    else if (prevKey === 83) {
      joystick.rotateX(-2 * (Math.PI / 4));
    }
    else if (prevKey === 65) {
      joystick.rotateZ(-(Math.PI / 4));
      joystick.rotateX(-(Math.PI / 4));
    }
    else if (prevKey === 68) {
      joystick.rotateZ(Math.PI / 4);
      joystick.rotateX(-(Math.PI / 4));
    }

    moveBar(-1);
    prevKey = 87;
    render();

  }
  else if (keyCode === 83) {
    // s
    if (prevKey === -1) {
      joystick.rotateX(Math.PI / 4);
    }
    else if (prevKey === 87) {
      joystick.rotateX(2 * (Math.PI / 4));
    }
    else if (prevKey === 65) {
      joystick.rotateZ(-(Math.PI / 4));
      joystick.rotateX(Math.PI / 4);
    }
    else if (prevKey === 68) {
      joystick.rotateZ(Math.PI / 4);
      joystick.rotateX(Math.PI / 4);
    }

    moveBar(1);
    prevKey = 83;
    render();

  }
  else if (keyCode === 65) {
    // a
    if (prevKey === -1) {
      joystick.rotateZ(Math.PI / 4);
    }
    else if (prevKey === 68) {
      joystick.rotateZ(2 * (Math.PI / 4));
    }
    else if (prevKey === 87) {
      joystick.rotateX(Math.PI / 4);
      joystick.rotateZ(Math.PI / 4);
    }
    else if (prevKey === 83) {
      joystick.rotateX(-(Math.PI / 4));
      joystick.rotateZ(Math.PI / 4);
    }

    moveClaw(-1);
    prevKey = 65;
    render();
  }
  else if (keyCode === 68) {
    // d
    if (prevKey === -1) {
      joystick.rotateZ(-(Math.PI / 4));
    }
    else if (prevKey === 65) {
      joystick.rotateZ(-2 * (Math.PI / 4));
    }
    else if (prevKey === 87) {
      joystick.rotateX(Math.PI / 4);
      joystick.rotateZ(-(Math.PI / 4));
    }
    else if (prevKey === 83) {
      joystick.rotateX(-(Math.PI / 4));
      joystick.rotateZ(-(Math.PI / 4));
    }

    moveClaw(1);
    prevKey = 68;
    render();
  }

}

// Listens for any key event
window.addEventListener('keydown', activity);
window.addEventListener('resize', onWindowResize, false);

