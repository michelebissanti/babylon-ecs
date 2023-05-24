import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import HavokPhysics from "@babylonjs/havok";

import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version

import { ArcRotateCamera, CreateGround, CreateSphere, HavokPlugin, PhysicsBody, PhysicsMotionType, PhysicsShapeBox, PhysicsShapeSphere } from '@babylonjs/core';
import { Engine as EngineECS } from "tick-knock";

class App {
    engine: Engine;
    scene: Scene;
    ecs: EngineECS;

    constructor() {
        // Set up Babylon
        this.engine = new Engine(document.getElementById('renderCanvas') as HTMLCanvasElement);
        this.scene = new Scene(this.engine);
        this.scene.debugLayer.show();

        this.ecs = new EngineECS();
    }

    async setup() {
        // This creates and positions a free camera (non-mesh)
        const camera = new ArcRotateCamera("my first camera", 0, Math.PI / 3, 10, new Vector3(0, 0, 0), this.scene);

        // This targets the camera to scene origin
        camera.setTarget(Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl(true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Our built-in 'sphere' shape.
        const sphere = CreateSphere("sphere", { diameter: 2, segments: 32 }, this.scene);

        // Move the sphere upward at 4 units
        sphere.position.y = 4;

        // Our built-in 'ground' shape.
        const ground = CreateGround("ground", { width: 10, height: 10 }, this.scene);

        // PHYSICS!
        this.scene.enablePhysics(null, new HavokPlugin(true, await HavokPhysics()));
        // Create a sphere shape
        const sphereShape = new PhysicsShapeSphere(new Vector3(0, 0, 0)
            , 1
            , this.scene);

        // Sphere body
        const sphereBody = new PhysicsBody(sphere, PhysicsMotionType.DYNAMIC, false, this.scene);

        // Set shape material properties
        sphereShape.material = { friction: 0.2, restitution: 0.6 };

        // Associate shape and body
        sphereBody.shape = sphereShape;

        // And body mass
        sphereBody.setMassProperties({ mass: 1 });

        // Create a static box shape
        const groundShape = new PhysicsShapeBox(new Vector3(0, 0, 0)
            , Quaternion.Identity()
            , new Vector3(10, 0.1, 10)
            , this.scene);

        // Create a body and attach it to the ground. Set it as Static.
        const groundBody = new PhysicsBody(ground, PhysicsMotionType.STATIC, false, this.scene);

        // Set material properties
        groundShape.material = { friction: 0.2, restitution: 0.8 };

        // Associate the body and the shape
        groundBody.shape = groundShape;

        // Set the mass to 0
        groundBody.setMassProperties({ mass: 0 });
    }

    run() {
        // Run the engine render loop, update the ECS engine before the scene renders
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
}

let w = window as Window & typeof globalThis & { game: App };
w.game = new App();
w.game.setup();
w.game.run();
