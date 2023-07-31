import * as THREE from 'https://cdn.skypack.dev/three@0.136';

import {OrbitControls} from 'https://cdn.skypack.dev/three@0.136/examples/jsm/controls/OrbitControls.js';

class RigidBody {
  constructor() {
  }

  //bounce
  setRestitution(val) {
    this.body_.setRestitution(val);
  }
  //friction
  setFriction(val) {
    this.body_.setFriction(val);
  }
  //rolling friction
  setRollingFriction(val) {
    this.body_.setRollingFriction(val);
  }

  //create box
  createBox(mass, pos, quat, size) {
    this.transform_ = new Ammo.btTransform();
    this.transform_.setIdentity();
    this.transform_.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    this.transform_.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    this.motionState_ = new Ammo.btDefaultMotionState(this.transform_);

    const btSize = new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5);
    this.shape_ = new Ammo.btBoxShape(btSize);
    this.shape_.setMargin(0.05);

    this.inertia_ = new Ammo.btVector3(0, 0, 0);
    if (mass > 0) {
      this.shape_.calculateLocalInertia(mass, this.inertia_);
    }

    this.info_ = new Ammo.btRigidBodyConstructionInfo(
        mass, this.motionState_, this.shape_, this.inertia_);
    this.body_ = new Ammo.btRigidBody(this.info_);

    Ammo.destroy(btSize);
  }
}


class WorldView {
  constructor() {
  }

  initialize() {
    //Ammo setup
    this.collisionConfiguration_ = new Ammo.btDefaultCollisionConfiguration();
    this.dispatcher_ = new Ammo.btCollisionDispatcher(this.collisionConfiguration_);
    this.broadphase_ = new Ammo.btDbvtBroadphase();
    this.solver_ = new Ammo.btSequentialImpulseConstraintSolver();
    this.physicsWorld_ = new Ammo.btDiscreteDynamicsWorld(this.dispatcher_, this.broadphase_, this.solver_, this.collisionConfiguration_);
    this.physicsWorld_.setGravity(new Ammo.btVector3(0, -100, 0));
    
    //three.js setup
    this.threejs_ = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.threejs_.shadowMap.enabled = true;
    this.threejs_.shadowMap.type = THREE.PCFSoftShadowMap;
    this.threejs_.setPixelRatio(window.devicePixelRatio);
    this.threejs_.setSize(window.innerWidth, window.innerHeight);

    //positions graphics in dom
    document.body.appendChild(this.threejs_.domElement);

    window.addEventListener('resize', () => {
      this.onWindowResize_();
    }, false);

    //camera setup
    const fov = 100;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera_.position.set(25, 50, 25);

    this.scene_ = new THREE.Scene();

    //DirectionalLight setup
    let light = new THREE.DirectionalLight(0xFBFBFC, 1.0);
    light.position.set(20, 100, 10);
    light.target.position.set(0, 0, 0);
        //shadow setup
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this.scene_.add(light);

    //AmbientLight setup
    light = new THREE.AmbientLight(0x2F2E41);
    this.scene_.add(light);

    //fog setup
    this.scene_.fog = new THREE.Fog( 0xFBFBFC, 100, 1000)
    
    //Orbit controlls
    const controls = new OrbitControls(
      this.camera_, this.threejs_.domElement);
    controls.target.set(0, 20, 0);
    controls.update();

    // baby blue "sky"
    this.scene_.background = new THREE.Color( 0xFBFBFC );

    //ground graphics
    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(5000, 1, 5000),
      new THREE.MeshStandardMaterial({color: 0xFBFBFC}));
    ground.castShadow = false;
    ground.receiveShadow = true;

    //texture loader
    let textureLoader = new THREE.TextureLoader();
    //adds ground texture to the ground
    textureLoader.load( 'textures/grid.png', function ( texture ) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set( 500, 500 );
      ground.material.map = texture;
      ground.material.needsUpdate = true;

    } );

    //adds ground to scene
    this.scene_.add(ground);

    //ground rigid body
    const rbGround = new RigidBody();
    rbGround.createBox(0, ground.position, ground.quaternion, new THREE.Vector3(5000, 1, 5000));
    rbGround.setRestitution(1);
      //inits ground to physics world
    this.physicsWorld_.addRigidBody(rbGround.body_);

    //^ basic world setup

    //creates box graphics
    const box = new THREE.Mesh(
    new THREE.BoxGeometry(5, 5, 5),
    new THREE.MeshStandardMaterial({color: 0xBA63FF}));
    box.position.set(1, 50, 1);
    box.castShadow = true;
    box.receiveShadow = true;
    //adds to world
    this.scene_.add(box);

    //creates box rigid body
    const rbBox = new RigidBody();
    rbBox.createBox(1, box.position, box.quaternion, new THREE.Vector3(10, 10, 10));
    rbBox.setRestitution(1);
    rbBox.setFriction(1);
    rbBox.setRollingFriction(5);
        //adds to physics world
    this.physicsWorld_.addRigidBody(rbBox.body_);
    
           //creates box graphics
    const box2 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      new THREE.MeshStandardMaterial({color: 0x63A8FF}));
      box2.position.set(0, 0, 0);
      box2.castShadow = true;
      box2.receiveShadow = true;
      //adds to world
      this.scene_.add(box2);
  
      //creates box rigid body
    const rbBox2 = new RigidBody();
      rbBox2.createBox(1, box.position, box.quaternion, new THREE.Vector3(5, 5, 5));
      rbBox2.setRestitution(1);
      rbBox2.setFriction(1);
      rbBox2.setRollingFriction(5);
          //adds to physics world
          this.physicsWorld_.addRigidBody(rbBox2.body_);

    const box3 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      new THREE.MeshStandardMaterial({color: 0xFF68D0}));
      box3.position.set(0, 10, 0);
      box3.castShadow = true;
      box3.receiveShadow = true;
      //adds to world
      this.scene_.add(box3);
      
        //creates box rigid body
    const rbBox3 = new RigidBody();
      rbBox3.createBox(1, box.position, box.quaternion, new THREE.Vector3(5, 5, 5));
      rbBox3.setRestitution(1);
      rbBox3.setFriction(1);
      rbBox3.setRollingFriction(5);
      //adds to physics world
      this.physicsWorld_.addRigidBody(rbBox3.body_);


    const box4 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      new THREE.MeshStandardMaterial({color: 0xFF9868}));
      box4.position.set(0, 10, 0);
      box4.castShadow = true;
      box4.receiveShadow = true;
      //adds to world
      this.scene_.add(box4);
        
       //creates box rigid body
    const rbBox4 = new RigidBody();
      rbBox4.createBox(1, box.position, box.quaternion, new THREE.Vector3(5, 5, 5));
      rbBox4.setRestitution(1);
      rbBox4.setFriction(1);
      rbBox4.setRollingFriction(5);
      //adds to physics world
      this.physicsWorld_.addRigidBody(rbBox4.body_);


    const box5 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      new THREE.MeshStandardMaterial({color: 0x6C63FF}));
      box5.position.set(0, 10, 0);
      box5.castShadow = true;
      box5.receiveShadow = true;
      //adds to world
      this.scene_.add(box5);
          
      //creates box rigid body
    const rbBox5 = new RigidBody();
      rbBox5.createBox(1, box.position, box.quaternion, new THREE.Vector3(5, 5, 5));
      rbBox5.setRestitution(1);
      rbBox5.setFriction(1);
      rbBox5.setRollingFriction(5);
      //adds to physics world
      this.physicsWorld_.addRigidBody(rbBox5.body_);

            
       //creates box graphics
    const box6 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      new THREE.MeshStandardMaterial({color: 0xFF6884}));
      box6.position.set(0, 0, 0);
      box6.castShadow = true;
      box6.receiveShadow = true;
      //adds to world
      this.scene_.add(box6);
  
      //creates box rigid body
    const rbBox6 = new RigidBody();
      rbBox6.createBox(1, box.position, box.quaternion, new THREE.Vector3(5, 5, 5));
      rbBox6.setRestitution(1);
      rbBox6.setFriction(1);
      rbBox6.setRollingFriction(5);
          //adds to physics world
          this.physicsWorld_.addRigidBody(rbBox6.body_);

    const box7 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      new THREE.MeshStandardMaterial({color: 0xFFE468}));
      box7.position.set(0, 10, 0);
      box7.castShadow = true;
      box7.receiveShadow = true;
      //adds to world
      this.scene_.add(box7);
      
        //creates box rigid body
    const rbBox7 = new RigidBody();
      rbBox7.createBox(1, box.position, box.quaternion, new THREE.Vector3(5, 5, 5));
      rbBox7.setRestitution(1);
      rbBox7.setFriction(1);
      rbBox7.setRollingFriction(5);
      //adds to physics world
      this.physicsWorld_.addRigidBody(rbBox7.body_);


    const box8 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      new THREE.MeshStandardMaterial({color: 0x83ff68}));
      box8.position.set(0, 10, 0);
      box8.castShadow = true;
      box8.receiveShadow = true;
      //adds to world
      this.scene_.add(box8);
        
      //creates box rigid body
    const rbBox8 = new RigidBody();
      rbBox8.createBox(1, box.position, box.quaternion, new THREE.Vector3(5, 5, 5));
      rbBox8.setRestitution(1);
      rbBox8.setFriction(1);
      rbBox8.setRollingFriction(5);
      //adds to physics world
      this.physicsWorld_.addRigidBody(rbBox8.body_);


    const box9 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      new THREE.MeshStandardMaterial({color: 0x9968FF}));
      box9.position.set(0, 10, 0);
      box9.castShadow = true;
      box9.receiveShadow = true;
      //adds to world
      this.scene_.add(box9);
          
     //creates box rigid body
    const rbBox9 = new RigidBody();
      rbBox9.createBox(1, box.position, box.quaternion, new THREE.Vector3(5, 5, 5));
      rbBox9.setRestitution(1);
      rbBox9.setFriction(1);
      rbBox9.setRollingFriction(5);
      //adds to physics world
      this.physicsWorld_.addRigidBody(rbBox9.body_);

    this.rigidBodies_ = [];
      this.rigidBodies_.push({mesh: box, rigidBody: rbBox});
      this.rigidBodies_.push({mesh: box2, rigidBody: rbBox2});
      this.rigidBodies_.push({mesh: box3, rigidBody: rbBox3});
      this.rigidBodies_.push({mesh: box4, rigidBody: rbBox4});
      this.rigidBodies_.push({mesh: box5, rigidBody: rbBox5});
      this.rigidBodies_.push({mesh: box6, rigidBody: rbBox6});
      this.rigidBodies_.push({mesh: box7, rigidBody: rbBox7});
      this.rigidBodies_.push({mesh: box8, rigidBody: rbBox8});
      this.rigidBodies_.push({mesh: box9, rigidBody: rbBox9});
      this.tmpTransform_ = new Ammo.btTransform();

    this.previousRAF_ = null;
    this.raf_();
  }

  onWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();
    this.threejs_.setSize(window.innerWidth, window.innerHeight);
  }

  raf_() {
    requestAnimationFrame((t) => {
      if (this.previousRAF_ === null) {
        this.previousRAF_ = t;
      }

      this.step_(t - this.previousRAF_);
      this.threejs_.render(this.scene_, this.camera_);
      this.raf_();
      this.previousRAF_ = t;
    });
  }
    
  step_(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.0003;
    this.physicsWorld_.stepSimulation(timeElapsedS, 10);

    for (let i = 0; i < this.rigidBodies_.length; ++i) {
      this.rigidBodies_[i].rigidBody.motionState_.getWorldTransform(this.tmpTransform_);
      const pos = this.tmpTransform_.getOrigin();
      const quat = this.tmpTransform_.getRotation();
      const pos3 = new THREE.Vector3(pos.x(), pos.y(), pos.z());
      const quat3 = new THREE.Quaternion(quat.x(), quat.y(), quat.z(), quat.w());

      this.rigidBodies_[i].mesh.position.copy(pos3);
      this.rigidBodies_[i].mesh.quaternion.copy(quat3);
    }
  }
}

let APP_ = null;
window.addEventListener('DOMContentLoaded', async () => {
  Ammo().then((lib) => {
    Ammo = lib;
    APP_ = new WorldView();
    APP_.initialize();
  });
});
