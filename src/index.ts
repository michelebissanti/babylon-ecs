import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { GUI3DManager, TouchHolographicButton, NearMenu, InputText, AdvancedDynamicTexture, HandMenu } from '@babylonjs/gui';

import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version

import { Engine as EngineECS, Entity } from "tick-knock";
import { AbstractMesh, CreatePlane, HavokPlugin, Mesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, SceneLoader, WebXRFeatureName } from '@babylonjs/core';
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
import { MeshMultiComponent } from './components/MeshMultiComponent';
import { EntityMultiplayerComponent } from './components/EntityMultiplayerComponent';
import { TransformSystem } from './systems/TransformSystem';
import { MeshMultiplayerSystem } from './systems/MeshMultiplayerSystem';
import { TransformComponent } from './components/TransformComponent';
import { Utils } from './utils';

class App {
    engine: Engine;
    scene: Scene;
    ecs: EngineECS;
    guiManager: Gui3dComponent;

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
        this.ecs.addEntity(light);

        let ground = new Entity();
        ground.add(new MeshComponent(MeshBuilder.CreateGround('ground', { width: 50, height: 50 }), ground.id, true));
        //ground.add(new PhysicComponent(new PhysicsAggregate(ground.get(MeshComponent).ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene)))
        ground.get(MeshComponent).mesh.isVisible = true;
        this.ecs.addEntity(ground);


        // Create the player entity and attach all the component
        let player = new Entity();
        player.add(new MeshComponent(MeshBuilder.CreateSphere('sphere', { diameter: 1 }, this.scene), player.id));
        player.get(MeshComponent).mesh.setPivotMatrix(Matrix.Translation(0, 0.5, 0), false);
        player.get(MeshComponent).mesh.isPickable = false;

        player.add(new PlayerCameraComponent(new FreeCamera("cameraPlayer", new Vector3(0, 1.67, 0), this.scene)));

        player.add(new ClientComponent(true));


        player.add(new EntityMultiplayerComponent(true));

        player.add(new MeshMultiComponent("local", "sphere", true));

        player.add(new TransformComponent(true));

        player.add(new WebXrComponent(await this.scene.createDefaultXRExperienceAsync({
            floorMeshes: [ground.get(MeshComponent).mesh],
            disableTeleportation: false,
            uiOptions: {
                sessionMode: "immersive-vr",
            },
        })));

        this.ecs.addEntity(player);

        let gui = new Entity();
        gui.add(new Gui3dComponent(new GUI3DManager(this.scene)));
        this.ecs.addEntity(gui);


        this.ecs.addSystem(new MovementSystem(this.scene));
        this.ecs.addSystem(new WebXrSystem(this.scene, gui));
        this.ecs.addSystem(new MultiplayerSystem(this.scene));
        this.ecs.addSystem(new TransformSystem(this.scene));
        this.ecs.addSystem(new MeshMultiplayerSystem(this.scene));

        //create the menu to choose the room
        this.createNearMenu(gui, player);
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
            Utils.room = player.get(ClientComponent).room;

            if (player.get(ClientComponent).room != null) {
                nearMenu.dispose();
                this.initRoom(gui, player);
            }
        });

        joinButton.onPointerDownObservable.add(async () => {
            player.get(ClientComponent).room = await player.get(ClientComponent).client.joinById(inputText.text);

            if (player.get(ClientComponent).room != null) {
                nearMenu.dispose();
                this.initRoom(gui, player);
            }
        });

    }

    initRoom(gui: Entity, player: Entity) {
        var spawnTazza = new TouchHolographicButton();
        var roomInfo = new TouchHolographicButton();
        var leaveRoomBtn = new TouchHolographicButton();

        const manager = gui.get(Gui3dComponent).manager;

        //dovrebbe essere se sono in xr e se ho abilitate le mani
        if (player.get(WebXrComponent).exp.baseExperience.sessionManager.inXRSession) {
            var handMenu = new HandMenu(player.get(WebXrComponent).exp.baseExperience, "HandMenu");
            manager.addControl(handMenu);

            handMenu.addButton(spawnTazza);
            handMenu.addButton(roomInfo);
            handMenu.addButton(leaveRoomBtn);
        } else {
            var nearMenu = new NearMenu("NearMenu");
            nearMenu.rows = 1;
            manager.addControl(nearMenu);
            nearMenu.isPinned = false;
            nearMenu.position.y = 2;

            nearMenu.addButton(spawnTazza);
            nearMenu.addButton(roomInfo);
            nearMenu.addButton(leaveRoomBtn);
        }

        spawnTazza.text = "Spawn Tazza";
        spawnTazza.imageUrl = "icon/coffee-cup.png"
        roomInfo.text = "Room id: " + player.get(ClientComponent).room.id.toString();
        console.log(player.get(ClientComponent).room.id.toString());
        leaveRoomBtn.text = "Leave Room";
        leaveRoomBtn.imageUrl = "https://raw.githubusercontent.com/microsoft/MixedRealityToolkit-Unity/main/Assets/MRTK/SDK/StandardAssets/Textures/IconClose.png"

        spawnTazza.onPointerDownObservable.add(async () => {
            //piazzo una tazza nella scena
            let tazza = new Entity();
            tazza.add(new MeshArrayComponent(await this.importModel("models/", "coffee_cup.glb"), tazza.id));
            tazza.get(MeshArrayComponent).meshes[0].position = new Vector3(player.get(MeshComponent).mesh.position.x, player.get(MeshComponent).mesh.position.y + 1, player.get(MeshComponent).mesh.position.z + 1)

            tazza.add(new MeshMultiComponent("models/", "coffee_cup.glb", true));

            tazza.add(new EntityMultiplayerComponent(false));

            tazza.add(new TransformComponent(false));

            this.ecs.addEntity(tazza);

            Utils.room.send("createEntity", {
            });

            Utils.room.onMessage("entityCreated", (message) => {
                tazza.get(EntityMultiplayerComponent).send = true;
                tazza.get(EntityMultiplayerComponent).serverId = message;
                console.log(message);
                Utils.room.removeAllListeners();
            });
        });

        leaveRoomBtn.onPointerDownObservable.add(async () => {
            player.get(ClientComponent).room.leave();
            window.location.reload();
        });

        roomInfo.onPointerDownObservable.add(async () => {


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
