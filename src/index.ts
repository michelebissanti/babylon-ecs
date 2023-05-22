import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';

import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version

import { Engine as EngineECS, Entity } from "tick-knock";
import { MeshBuilder } from '@babylonjs/core';
import { PlayerMeshComponent } from './components/PlayerMeshComponent';
import { MovingComponent } from './components/MovingComponent';
import { MovementSystem } from './systems/MovementSystem';
import { PositionComponent } from './components/PositionComponent';

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

    setup() {
        // This creates and positions a free camera (non-mesh)
        var camera = new FreeCamera("camera1", new Vector3(0, 5, -10), this.scene);

        // This targets the camera to scene origin
        camera.setTarget(Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl();

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        var light = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Set up a simple ground
        let ground = MeshBuilder.CreateGround('ground', { width: 5, height: 5 });

        // Create the player entity and attach all the component
        let player = new Entity();
        player
            .add(new PlayerMeshComponent(MeshBuilder.CreateSphere('sphere', { diameter: 1 })))
            .add(new MovingComponent())
            .add(new PositionComponent(new Vector3(0, 1, 0)));

        // Add our system to the ECS engine
        this.ecs.addSystem(new MovementSystem());

        // Add out player entity
        this.ecs.addEntity(player);
    }

    run() {
        // Run the engine render loop, update the ECS engine before the scene renders
        this.engine.runRenderLoop(() => {
            let dt = (this.scene.deltaTime / 1000) || 0;
            this.ecs.update(dt);
            this.scene.render();
        });
    }
}

let w = window as Window & typeof globalThis & { game: App };
w.game = new App();
w.game.setup();
w.game.run();
