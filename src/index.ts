import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { GUI3DManager, TouchHolographicButton } from '@babylonjs/gui';

import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version

import { Engine as EngineECS, Entity } from "tick-knock";
import { HavokPlugin, MeshBuilder, PhysicsAggregate, PhysicsShapeType } from '@babylonjs/core';
import { MeshComponent } from './components/MeshComponent';
import { MovementSystem } from './systems/MovementSystem';
import { PositionComponent } from './components/PositionComponent';
import { PlayerCameraComponent } from './components/PlayerCameraComponent';
import { WebXrComponent } from './components/WebXrComponent';
import { WebXrSystem } from './systems/WebXrSystem';
import { WorldLightComponent } from './components/WorldLightComponent';
import { PhysicComponent } from './components/PhysicComponent';
import { GroundComponent } from './components/GroundComponent';
import { ClientComponent } from './components/ClientComponent';
import { Gui3dComponent } from './components/Gui3dComponent';
import { MultiplayerSystem } from './systems/MultiplayerSystem';

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
        //this.scene.enablePhysics(new Vector3(0, -9.81, 0), new HavokPlugin(true, await HavokPhysics()));

        let light = new Entity();
        light.add(new WorldLightComponent(new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene)));
        light.get(WorldLightComponent).light.intensity = 0.7;

        let ground = new Entity();
        ground.add(new MeshComponent(MeshBuilder.CreateGround('ground', { width: 50, height: 50 }), true));
        //ground.add(new PhysicComponent(new PhysicsAggregate(ground.get(MeshComponent).ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene)))

        // Create the player entity and attach all the component
        let player = new Entity();
        player.add(new MeshComponent(MeshBuilder.CreateSphere('sphere', { diameter: 1 }, this.scene)));
        player.add(new PlayerCameraComponent(new FreeCamera("cameraPlayer", new Vector3(0, 1.67, 0), this.scene)));
        player.add(new WebXrComponent(await this.scene.createDefaultXRExperienceAsync({
            floorMeshes: [],
            disableTeleportation: true,
        })));
        player.add(new ClientComponent(true));

        let gui = new Entity();
        gui.add(new Gui3dComponent(new GUI3DManager(this.scene)));
        this.multiButtonSetUp(gui, player);

        this.ecs.addSystem(new MovementSystem(this.scene));
        this.ecs.addSystem(new WebXrSystem(this.scene));
        this.ecs.addSystem(new MultiplayerSystem(this.scene));

        // Add out player entity
        this.ecs.addEntity(light);
        this.ecs.addEntity(ground);
        this.ecs.addEntity(player);
        this.ecs.addEntity(gui);
    }

    run() {
        // Run the engine render loop, update the ECS engine before the scene renders
        this.engine.runRenderLoop(() => {
            let dt = (this.scene.deltaTime / 1000) || 0;
            this.ecs.update(dt);
            this.scene.render();
        });
    }

    multiButtonSetUp(gui: Entity, player: Entity) {
        const ROOM_NAME = "my_room";
        const manager = gui.get(Gui3dComponent).manager;
        //manager.useRealisticScaling = true;

        // Create Room Button
        var createRoomButton = new TouchHolographicButton("TouchHoloTextButton");
        manager.addControl(createRoomButton);
        createRoomButton.position = new Vector3(-1, 1, 5);
        createRoomButton.text = "Create Room";
        createRoomButton.onPointerDownObservable.add(async () => {
            player.get(ClientComponent).room = await player.get(ClientComponent).client.create(ROOM_NAME);
        });

        // Join Room Button
        var joinRoomButton = new TouchHolographicButton("TouchHoloTextButton");
        manager.addControl(joinRoomButton);
        joinRoomButton.position = new Vector3(1, 1, 5);
        joinRoomButton.text = "Join Room";
        joinRoomButton.onPointerDownObservable.add(async () => {
            player.get(ClientComponent).room = await player.get(ClientComponent).client.join(ROOM_NAME);
        });
    }
}

let w = window as Window & typeof globalThis & { game: App };
w.game = new App();
w.game.setup();
w.game.run();
