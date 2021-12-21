import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
})
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(new THREE.Color(0x000030));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// Camera
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 50, 500);
camera.lookAt(scene.position);

// OrbitControls
let orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.target.set(0, 200, 0);
orbitControls.addEventListener('change', (change) => {
    if (change.target.getDistance() < 400) orbitControls.maxPolarAngle = 2.1
    else if (change.target.getDistance() < 450) orbitControls.maxPolarAngle = 2.05
    else orbitControls.maxPolarAngle = 1.98
}, false);
orbitControls.maxDistance = 500
orbitControls.maxPolarAngle = 1.98;
orbitControls.autoRotate = false;
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.2;

// AmbientLight
const ambientLight = new THREE.AmbientLight(0x666666);
scene.add(ambientLight);

// SpotLight
const spotLight = new THREE.SpotLight(0xffffff);
spotLight.distance = 1000;
spotLight.position.set(0, 500, 0);
spotLight.castShadow = true;
scene.add(spotLight);

// Plane
const planeGeometry = new THREE.PlaneBufferGeometry(5000, 5000, 1000, 1000);
const planeMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
});
let planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
planeMesh.receiveShadow = true;
planeMesh.rotation.x = -0.5 * Math.PI;
planeMesh.position.x = 0;
planeMesh.position.y = 0;
planeMesh.position.z = 0;
scene.add(planeMesh);

// Christmas Tree
const loader = new GLTFLoader();
loader.load('/assets/models/christmas_tree/scene.gltf', function (gltf) {
    const tree = gltf.scene

    tree.scale.set(10, 10, 10)
    tree.position.set(0, -50, 0)
    tree.castShadow = true;

    scene.add(tree);
}, undefined, function (error) {
    console.error(error);
});

// Snow
const SNOW_NUM = 5000;
const SNOW_MAX_RANGE = 1000;
const SNOW_MIN_RANGE = 0;
const SNOW_TEXTURE_SIZE = 32.0;

let snowVertices = [];
for (let i = 0; i < SNOW_NUM; i++) {
    const x = Math.floor(Math.random() * SNOW_MAX_RANGE - SNOW_MAX_RANGE / 2);
    const y = Math.floor(Math.random() * SNOW_MAX_RANGE);
    const z = Math.floor(Math.random() * SNOW_MAX_RANGE - SNOW_MAX_RANGE / 2);
    const snow = new THREE.Vector3(x, y, z);
    snowVertices.push(snow);
}

const pointGeometry = new THREE.BufferGeometry();
pointGeometry.setFromPoints(snowVertices)

const drawRadialGradation = (ctx, canvasRadius, canvasW, canvasH) => {
    ctx.save();
    const gradient = ctx.createRadialGradient(canvasRadius, canvasRadius, 0, canvasRadius, canvasRadius, canvasRadius);
    gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();
}

const getSnowTexture = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const diameter = SNOW_TEXTURE_SIZE;
    canvas.width = diameter;
    canvas.height = diameter;
    const canvasRadius = diameter / 2;

    drawRadialGradation(ctx, canvasRadius, canvas.width, canvas.height);

    const texture = new THREE.Texture(canvas);
    //texture.minFilter = THREE.NearestFilter;
    texture.type = THREE.FloatType;
    texture.needsUpdate = true;
    return texture;
}

const pointMaterial = new THREE.PointsMaterial({
    size: 8,
    color: 0xffffff,
    vertexColors: false,
    map: getSnowTexture(),
    transparent: true,
    fog: true,
    depthWrite: false
});

const velocities = [];
const speed = SNOW_TEXTURE_SIZE / 10
for (let i = 0; i < SNOW_NUM; i++) {
    const x = Math.floor(Math.random() * speed - speed / 2) * 0.1;
    const y = Math.floor(Math.random() * speed + speed / 2) * - 0.05;
    const z = Math.floor(Math.random() * speed - speed / 2) * 0.1;
    const snow = new THREE.Vector3(x, y, z);
    velocities.push(snow);
}

let snows = new THREE.Points(pointGeometry, pointMaterial);
snows.geometry.velocities = velocities;
scene.add(snows);

const dropSnows = (timeStamp) => {
    const posArr = snows.geometry.attributes.position.array;
    const velArr = snows.geometry.velocities;

    let index = 0;
    for (let i = 0, l = SNOW_NUM; i < l; i++) {
        let snow = snowVertices[i]
        posArr[index++] = snow.x;
        posArr[index++] = snow.y;
        posArr[index++] = snow.z;

        const velocity = velArr[i];

        const velX = Math.sin(timeStamp * 0.001 * velocity.x) * 0.1;
        const velZ = Math.cos(timeStamp * 0.0015 * velocity.z) * 0.1;

        snow.x += velX;
        snow.y += velocity.y;
        snow.z += velZ;

        if (snow.y < SNOW_MIN_RANGE) {
            snow.y = SNOW_MAX_RANGE;
        }
    }

    snows.geometry.attributes.position.needsUpdate = true
}

// Resize handle
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height

    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Animate
const tick = (timeStamp) => {
    orbitControls.update()

    dropSnows(timeStamp)

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}
window.requestAnimationFrame(tick)
