import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Matrix, Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { GUI3DManager, TouchHolographicButton, NearMenu, InputText, AdvancedDynamicTexture, HandMenu, HolographicSlate, ScrollViewer, Grid, Button } from '@babylonjs/gui';

import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version

import { Engine as EngineECS, Entity } from "tick-knock";
import { AbstractMesh, CreatePlane, CubeTexture, HavokPlugin, Material, Mesh, MeshBuilder, PBRMaterial, PhysicsAggregate, PhysicsShapeType, SceneLoader, StandardMaterial, Texture, WebXRFeatureName } from '@babylonjs/core';
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
import { Object3d, Utils } from './utils';

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

        let envTexture = CubeTexture.CreateFromPrefilteredData("sky/sky.env", this.scene);
        this.scene.environmentTexture = envTexture;

        this.scene.createDefaultSkybox(envTexture, true);

        let light = new Entity();
        light.add(new WorldLightComponent(new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene)));
        light.get(WorldLightComponent).light.intensity = 1;
        this.ecs.addEntity(light);

        let ground = new Entity();
        ground.add(new MeshComponent(MeshBuilder.CreateGround('ground', { width: 50, height: 50 }), ground.id, true));
        //ground.add(new PhysicComponent(new PhysicsAggregate(ground.get(MeshComponent).ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene)))
        ground.get(MeshComponent).mesh.isVisible = true;
        let groundMat = new StandardMaterial("groundMat", this.scene);
        let groundTexture = new Texture("materials/floor/laminate_floor_02_diff_1k.jpg");
        groundTexture.uScale = 10;
        groundTexture.vScale = 10;
        groundMat.diffuseTexture = groundTexture;

        let groundNormal = new Texture("materials/floor/laminate_floor_02_nor_gl_1k.jpg");
        groundMat.bumpTexture = groundNormal;
        groundNormal.uScale = 10;
        groundNormal.vScale = 10;

        let groundAO = new Texture("materials/floor/laminate_floor_02_ao_1k.jpg");
        groundMat.bumpTexture = groundAO;
        groundAO.uScale = 10;
        groundAO.vScale = 10;

        ground.get(MeshComponent).mesh.material = groundMat;
        this.ecs.addEntity(ground);


        // Create the player entity and attach all the component
        let player = new Entity();
        /* player.add(new MeshComponent(MeshBuilder.CreateSphere('player', { diameter: 1 }, this.scene), player.id));
        player.get(MeshComponent).mesh.setPivotMatrix(Matrix.Translation(0, 0.5, 0), false);
        player.get(MeshComponent).mesh.isPickable = false; */

        player.add(new PlayerCameraComponent(new FreeCamera("cameraPlayer", new Vector3(0, 1.67, 0), this.scene)));

        player.add(new ClientComponent(false));

        player.add(new EntityMultiplayerComponent(true));

        player.add(new MeshMultiComponent("https://models.readyplayer.me/", "64521b1a0fc89d09fcdc8c79.glb", false));

        player.add(new TransformComponent(true));

        player.add(new WebXrComponent(await this.scene.createDefaultXRExperienceAsync({
            floorMeshes: [ground.get(MeshComponent).mesh],
            disableTeleportation: false,
            uiOptions: {
                sessionMode: "immersive-vr",
            },
        })));

        this.ecs.addEntity(player);

        Utils.gui3dmanager = new GUI3DManager(this.scene);



        this.ecs.addSystem(new MovementSystem(this.scene));
        this.ecs.addSystem(new WebXrSystem(this.scene));
        this.ecs.addSystem(new MultiplayerSystem(this.scene));
        this.ecs.addSystem(new TransformSystem(this.scene));
        this.ecs.addSystem(new MeshMultiplayerSystem(this.scene));

        //create the menu to choose the room
        this.createNearMenu(player);
    }

    run() {
        // Run the engine render loop, update the ECS engine before the scene renders
        this.engine.runRenderLoop(() => {
            let dt = (this.scene.deltaTime / 1000) || 0;
            this.ecs.update(dt);
            this.scene.render();
        });
    }

    createNearMenu(player: Entity) {
        const ROOM_TYPE = "my_room";
        let manager = Utils.gui3dmanager;
        manager.useRealisticScaling = true;

        // Create Near Menu with Touch Holographic Buttons + behaviour
        let nearMenu = new NearMenu("NearMenu");
        nearMenu.rows = 1;
        manager.addControl(nearMenu);
        nearMenu.isPinned = false;
        nearMenu.position.y = 2;

        //nearMenu.scaling = new Vector3(0.1, 0.1, 0.1);


        var createButton = new TouchHolographicButton();
        var joinButton = new TouchHolographicButton();

        nearMenu.addButton(createButton);
        nearMenu.addButton(joinButton);


        //nearMenu.addButton(button3);

        createButton.text = "Create Room";
        createButton.imageUrl = "icon/create-room.png"
        joinButton.text = "Join Room";
        joinButton.imageUrl = "icon/join.png";
        //button3.text = "Exit";



        //button3.onPointerDownObservable.add(()=>{});

        var textArea = CreatePlane("textArea", { width: 2, height: 1 }, this.scene);
        textArea.parent = nearMenu.mesh;
        textArea.position.y = 1.5;

        var advancedTexture = AdvancedDynamicTexture.CreateForMesh(textArea);

        let inputText = new InputText("inputRoom", "");
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
                Utils.setServerTrigger(this.ecs);
                this.initRoom(player);
            }
        });

        joinButton.onPointerDownObservable.add(async () => {
            player.get(ClientComponent).room = await player.get(ClientComponent).client.joinById(inputText.text);
            Utils.room = player.get(ClientComponent).room;

            if (player.get(ClientComponent).room != null) {
                nearMenu.dispose();
                Utils.setServerTrigger(this.ecs);
                this.initRoom(player);
            }
        });

    }

    async initRoom(player: Entity) {
        var spawnTazza = new TouchHolographicButton();
        var roomInfo = new TouchHolographicButton();
        var leaveRoomBtn = new TouchHolographicButton();
        let addObject = new TouchHolographicButton();
        let displayList = false;


        const manager = Utils.gui3dmanager;

        //dovrebbe essere se sono in xr e se ho abilitate le mani
        //if (player.get(WebXrComponent).exp.baseExperience.featuresManager.getEnabledFeature(WebXRFeatureName.HAND_TRACKING)) {
        if (false) {
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

            nearMenu.addButton(addObject);
            nearMenu.addButton(roomInfo);
            nearMenu.addButton(leaveRoomBtn);

        }

        spawnTazza.text = "Spawn Tazza";
        spawnTazza.imageUrl = "icon/coffee-cup.png";

        roomInfo.text = "Room id: " + player.get(ClientComponent).room.id.toString();
        console.log(player.get(ClientComponent).room.id.toString());

        leaveRoomBtn.text = "Leave Room";
        leaveRoomBtn.imageUrl = "https://raw.githubusercontent.com/microsoft/MixedRealityToolkit-Unity/main/Assets/MRTK/SDK/StandardAssets/Textures/IconClose.png"

        spawnTazza.onPointerDownObservable.add(async () => {
            //piazzo una tazza nella scena
            let tazza = new Entity();
            tazza.add(new MeshArrayComponent(await this.importModel("models/", "coffee_cup.glb"), tazza.id));

            tazza.add(new EntityMultiplayerComponent(false));

            tazza.add(new MeshMultiComponent("models/", "coffee_cup.glb", true));

            tazza.add(new TransformComponent(false, player.get(TransformComponent).x, player.get(TransformComponent).y + 1, player.get(TransformComponent).z + 1));

            this.ecs.addEntity(tazza);
        });

        leaveRoomBtn.onPointerDownObservable.add(async () => {
            player.get(ClientComponent).room.leave();
            window.location.reload();
        });

        roomInfo.onPointerDownObservable.add(async () => {
            Utils.copyMessage(player.get(ClientComponent).room.id.toString());

        });


        addObject.text = "Add 3d Object";
        addObject.imageUrl = "icon/object.png";

        let listDiplay: HolographicSlate;

        addObject.onPointerDownObservable.add(async () => {

            if (displayList == true) {
                listDiplay.dispose();
                displayList = false;
                addObject.text = "Add 3d Object";
            } else {
                //spawn slate con elenco
                listDiplay = this.createListObject(player);
                addObject.text = "Hide 3d Object List";
                displayList = true;
            }

        });

    }

    createListObject(player: Entity): HolographicSlate {
        let manager = Utils.gui3dmanager;
        let playerTransform = player.get(TransformComponent);

        //creo la lastra olografica dove inserirò la gui 2d
        let listSlate = new HolographicSlate("listSlate");
        listSlate.titleBarHeight = 0;
        listSlate.dimensions = new Vector2(1, 1);
        listSlate.position = new Vector3(0, 0, 0);
        listSlate.title = "Add Object";

        manager.addControl(listSlate);

        let sv = new ScrollViewer();
        sv.background = "blue";

        let grid = new Grid();
        grid.background = "black";

        sv.addControl(grid);

        grid.addColumnDefinition(0.5);
        grid.addColumnDefinition(0.5);

        let objectAvaible: Array<Object3d> = Utils.getAvaiableObjects();

        console.log(objectAvaible);

        let elementSize = objectAvaible.length;

        for (let i = 0; i < elementSize; i++) {
            grid.addRowDefinition(200, true);
            var imgButton = Button.CreateImageOnlyButton("", objectAvaible[i].urlIcona);
            grid.addControl(imgButton, i, 0);

            imgButton.onPointerClickObservable.add(async () => {
                //piazzo una nuovo oggetto selezionato nella scena
                let newObject = new Entity();
                newObject.add(new MeshArrayComponent(await this.importModel(objectAvaible[i].percorso, objectAvaible[i].nomeFile), newObject.id));

                newObject.add(new EntityMultiplayerComponent(false));

                newObject.add(new MeshMultiComponent(objectAvaible[i].percorso, objectAvaible[i].nomeFile, true));

                newObject.add(new TransformComponent(false, player.get(PlayerCameraComponent).camera.getDirection(Vector3.Zero()).x, player.get(TransformComponent).y + 1, player.get(TransformComponent).z + 1));

                this.ecs.addEntity(newObject);
            });

            var textButton = Button.CreateSimpleButton("", objectAvaible[i].nome);
            textButton.color = "white";
            textButton.background = "green";
            grid.addControl(textButton, i, 1);

            textButton.onPointerClickObservable.add(async () => {
                //piazzo una nuovo oggetto selezionato nella scena
                let newObject = new Entity();
                newObject.add(new MeshArrayComponent(await this.importModel(objectAvaible[i].percorso, objectAvaible[i].nomeFile), newObject.id));

                newObject.add(new EntityMultiplayerComponent(false));

                newObject.add(new MeshMultiComponent(objectAvaible[i].percorso, objectAvaible[i].nomeFile, true));

                newObject.add(new TransformComponent(false, player.get(TransformComponent).x, player.get(TransformComponent).y + 1, player.get(TransformComponent).z + 1));

                this.ecs.addEntity(newObject);
            });
        }

        grid.height = elementSize * 200 + "px";
        listSlate.content = sv;

        return listSlate;
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
