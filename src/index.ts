import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { GUI3DManager, TouchHolographicButton, NearMenu, InputText, AdvancedDynamicTexture } from '@babylonjs/gui';

import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version

import { Engine as EngineECS, Entity } from "tick-knock";
import { AbstractMesh, CreatePlane, HavokPlugin, Mesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, SceneLoader } from '@babylonjs/core';
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
import { MeshArrayComponent } from './components/MeshArrayComponent';
import { ModelMultiComponent } from './components/ModelMultiComponent';
import { UpdateMultiComponent } from './components/UpdateMultiComponent';

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
        ground.add(new MeshComponent(MeshBuilder.CreateGround('ground', { width: 50, height: 50 }), ground.id, true));
        //ground.add(new PhysicComponent(new PhysicsAggregate(ground.get(MeshComponent).ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene)))

        // Create the player entity and attach all the component
        let player = new Entity();
        player.add(new MeshComponent(MeshBuilder.CreateSphere('sphere', { diameter: 1 }, this.scene), player.id));
        player.get(MeshComponent).mesh.setPivotMatrix(Matrix.Translation(0, 0.5, 0), false);
        player.get(MeshComponent).mesh.isPickable = false;
        player.add(new PlayerCameraComponent(new FreeCamera("cameraPlayer", new Vector3(0, 1.67, 0), this.scene)));
        player.add(new WebXrComponent(await this.scene.createDefaultXRExperienceAsync({
            floorMeshes: [ground.get(MeshComponent).mesh],
            disableTeleportation: false,
        })));
        player.add(new ClientComponent(true));

        let gui = new Entity();
        gui.add(new Gui3dComponent(new GUI3DManager(this.scene)));
        this.multiButtonSetUp(gui, player);
        this.createNearMenu(gui, player);

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

    createNearMenu(gui: Entity, player: Entity) {
        const ROOM_TYPE = "my_room";
        const manager = gui.get(Gui3dComponent).manager;
        manager.useRealisticScaling = true;

        // Create Near Menu with Touch Holographic Buttons + behaviour
        var nearMenu = new NearMenu("NearMenu");
        nearMenu.rows = 1;
        manager.addControl(nearMenu);
        nearMenu.isPinned = false;
        nearMenu.position.y = 2;

        var createButton = new TouchHolographicButton();
        var joinButton = new TouchHolographicButton();



        nearMenu.addButton(createButton);
        nearMenu.addButton(joinButton);


        //nearMenu.addButton(button3);

        createButton.text = "Create Room";
        joinButton.text = "Join Room";
        //button3.text = "Exit";



        //button3.onPointerDownObservable.add(()=>{});

        var textArea = CreatePlane("textArea", { width: 2, height: 1 }, this.scene);
        textArea.parent = nearMenu.mesh;
        textArea.position.y = 1.5;

        var advancedTexture = AdvancedDynamicTexture.CreateForMesh(textArea);

        let inputText = new InputText("inputRoom", "room id");
        inputText.width = 1;
        inputText.height = 0.4;
        inputText.color = "white";
        inputText.fontSize = 150;
        inputText.background = "green";
        advancedTexture.addControl(inputText);

        createButton.onPointerDownObservable.add(async () => {
            player.get(ClientComponent).room = await player.get(ClientComponent).client.create(ROOM_TYPE);
        });

        joinButton.onPointerDownObservable.add(async () => {
            player.get(ClientComponent).room = await player.get(ClientComponent).client.joinById(inputText.text);
        });

    }

    multiButtonSetUp(gui: Entity, player: Entity) {
        const manager = gui.get(Gui3dComponent).manager;

        // spawn tazza TEMPORANEO
        var spawnTazza = new TouchHolographicButton("TouchHoloTextButton");
        manager.addControl(spawnTazza);
        spawnTazza.scaling = new Vector3(10, 10, 10);
        spawnTazza.position = new Vector3(3, 1, 5);
        spawnTazza.text = "TAZZA";
        spawnTazza.onPointerDownObservable.add(async () => {
            //piazzo un oggetto nella scena
            let tazza = new Entity();
            tazza.add(new MeshArrayComponent(await this.importModel("models/", "coffee_cup.glb"), tazza.id));
            tazza.get(MeshArrayComponent).meshes[0].position = new Vector3(1, 1, 1);
            tazza.add(new ModelMultiComponent("models/", "coffee_cup.glb"));
            tazza.add(new UpdateMultiComponent(false));
            this.ecs.addEntity(tazza);
        });
    }

    async importModel(baseUrl: string, modelName: string): Promise<AbstractMesh[]> {

        let { meshes } = await SceneLoader.ImportMeshAsync(
            null,
            baseUrl,
            modelName,
            this.scene
        );

        return meshes;
    }


}

let w = window as Window & typeof globalThis & { game: App };
w.game = new App();
w.game.setup();
w.game.run();
