import { BoundingBoxGizmo, Color3, CreatePlane, MultiPointerScaleBehavior, SceneLoader, SixDofDragBehavior, UtilityLayerRenderer, Vector2, Vector3, WebXRFeatureName } from "@babylonjs/core";
import { GUI3DManager, AdvancedDynamicTexture, HandMenu, HolographicSlate, InputText, NearMenu, TouchHolographicButton, Button, Grid, ScrollViewer, TouchHolographicMenu } from "@babylonjs/gui";
import { Entity } from "tick-knock";
import { ClientComponent } from "./components/ClientComponent";
import { Object3d, Utils } from "./utils";
import { WebXrComponent } from "./components/WebXrComponent";
import { TransformComponent } from "./components/TransformComponent";
import { MeshArrayComponent } from "./components/MeshArrayComponent";
import { AnimationComponent } from "./components/AnimationComponent";
import { EntityMultiplayerComponent } from "./components/EntityMultiplayerComponent";
import { MeshMultiComponent } from "./components/MeshMultiComponent";
import { PlayerCameraComponent } from "./components/PlayerCameraComponent";
import { } from "babylonjs-gui";

export class GuiUtils {
    public static gui3dmanager: GUI3DManager;

    static createNearMenu(player: Entity) {
        const ROOM_TYPE = "my_room";
        let manager = GuiUtils.gui3dmanager;
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

        var textArea = CreatePlane("textArea", { width: 2, height: 1 }, Utils.scene);
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
                Utils.setServerTrigger(Utils.engineEcs);
                GuiUtils.initRoom(player);
            }
        });

        joinButton.onPointerDownObservable.add(async () => {
            player.get(ClientComponent).room = await player.get(ClientComponent).client.joinById(inputText.text);
            Utils.room = player.get(ClientComponent).room;

            if (player.get(ClientComponent).room != null) {
                nearMenu.dispose();
                Utils.setServerTrigger(Utils.engineEcs);
                GuiUtils.initRoom(player);
            }
        });

    }

    static async initRoom(player: Entity) {
        var spawnTazza = new TouchHolographicButton();
        var roomInfo = new TouchHolographicButton();
        var leaveRoomBtn = new TouchHolographicButton();
        let addObject = new TouchHolographicButton();
        let displayList = false;


        const manager = GuiUtils.gui3dmanager;

        //dovrebbe essere se sono in xr e se ho abilitate le mani
        if (player.get(WebXrComponent).exp.baseExperience.featuresManager.getEnabledFeature(WebXRFeatureName.HAND_TRACKING)) {
            var handMenu = new HandMenu(player.get(WebXrComponent).exp.baseExperience, "HandMenu");
            manager.addControl(handMenu);

            handMenu.addButton(addObject);
            handMenu.addButton(roomInfo);
            handMenu.addButton(leaveRoomBtn);
        }

        var nearMenu = new NearMenu("NearMenu");
        nearMenu.rows = 1;
        manager.addControl(nearMenu);
        nearMenu.isPinned = false;
        nearMenu.position.y = 2;

        nearMenu.addButton(addObject);
        nearMenu.addButton(roomInfo);
        nearMenu.addButton(leaveRoomBtn);


        /* spawnTazza.text = "Spawn Tazza";
        spawnTazza.imageUrl = "icon/coffee-cup.png";

        spawnTazza.onPointerDownObservable.add(async () => {
            //piazzo una tazza nella scena
            let tazza = new Entity();
            tazza.add(new MeshArrayComponent(await this.importModel("models/", "coffee_cup.glb"), tazza.id));

            tazza.add(new EntityMultiplayerComponent(false));

            tazza.add(new MeshMultiComponent("models/", "coffee_cup.glb", true));

            tazza.add(new TransformComponent(false, player.get(TransformComponent).x, player.get(TransformComponent).y + 1, player.get(TransformComponent).z + 1));

            this.ecs.addEntity(tazza);
        }); */

        leaveRoomBtn.text = "Leave Room";
        leaveRoomBtn.imageUrl = "https://raw.githubusercontent.com/microsoft/MixedRealityToolkit-Unity/main/Assets/MRTK/SDK/StandardAssets/Textures/IconClose.png";

        leaveRoomBtn.onPointerDownObservable.add(async () => {
            player.get(ClientComponent).room.leave();
            window.location.reload();
        });

        roomInfo.text = "Room id: " + player.get(ClientComponent).room.id.toString();
        console.log(player.get(ClientComponent).room.id.toString());

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
                listDiplay = GuiUtils.createListObject(player);
                addObject.text = "Hide 3d Object List";
                displayList = true;
            }

        });

    }

    static createListObject(player: Entity): HolographicSlate {
        let manager = GuiUtils.gui3dmanager;
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

                let { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
                    null,
                    objectAvaible[i].percorso,
                    objectAvaible[i].nomeFile
                );

                newObject.add(new MeshArrayComponent(meshes, newObject.id));

                if (animationGroups.length != 0) {
                    newObject.add(new AnimationComponent(animationGroups));
                    animationGroups[0].stop();
                }

                newObject.add(new EntityMultiplayerComponent(false));

                newObject.add(new MeshMultiComponent(objectAvaible[i].percorso, objectAvaible[i].nomeFile, true));

                newObject.add(new TransformComponent(false, player.get(PlayerCameraComponent).camera.getDirection(Vector3.Zero()).x, player.get(TransformComponent).y + 1, player.get(TransformComponent).z + 1));

                Utils.engineEcs.addEntity(newObject);
            });

            var textButton = Button.CreateSimpleButton("", objectAvaible[i].nome);
            textButton.color = "white";
            textButton.background = "green";
            grid.addControl(textButton, i, 1);

            textButton.onPointerClickObservable.add(async () => {
                //piazzo una nuovo oggetto selezionato nella scena
                let newObject = new Entity();

                let { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
                    null,
                    objectAvaible[i].percorso,
                    objectAvaible[i].nomeFile
                );

                newObject.add(new MeshArrayComponent(meshes, newObject.id));

                console.log(animationGroups);

                if (animationGroups.length != 0) {
                    newObject.add(new AnimationComponent(animationGroups));
                    animationGroups[0].stop();
                }

                newObject.add(new EntityMultiplayerComponent(false));

                newObject.add(new MeshMultiComponent(objectAvaible[i].percorso, objectAvaible[i].nomeFile, true));

                newObject.add(new TransformComponent(false, player.get(PlayerCameraComponent).camera.getDirection(Vector3.Zero()).x, player.get(TransformComponent).y + 1, player.get(TransformComponent).z + 1));

                Utils.engineEcs.addEntity(newObject);
            });
        }

        grid.height = elementSize * 200 + "px";
        listSlate.content = sv;

        return listSlate;
    }

    static controllerMenu(inputSource, playerEntity) {
        let mesh = inputSource.grip;
        let manager = GuiUtils.gui3dmanager;

        let controllerMenu = new TouchHolographicMenu("objectMenu");
        controllerMenu.columns = 1;
        manager.addControl(controllerMenu);
        controllerMenu.mesh.parent = mesh;
        controllerMenu.mesh.rotate(new Vector3(1, 0, 0), -30);
        controllerMenu.mesh.position = new Vector3(0.10, 0, -0.1);

        let displayList = false;

        var roomInfo = new TouchHolographicButton();
        controllerMenu.addButton(roomInfo);
        roomInfo.text = "Room id: " + Utils.room.id.toString();
        console.log(Utils.room.id.toString());

        roomInfo.onPointerDownObservable.add(async () => {
            Utils.copyMessage(Utils.room.id.toString());

        });

        var leaveRoomBtn = new TouchHolographicButton();
        controllerMenu.addButton(leaveRoomBtn);
        leaveRoomBtn.text = "Leave Room";
        leaveRoomBtn.imageUrl = "https://raw.githubusercontent.com/microsoft/MixedRealityToolkit-Unity/main/Assets/MRTK/SDK/StandardAssets/Textures/IconClose.png"

        leaveRoomBtn.onPointerDownObservable.add(async () => {
            Utils.room.leave();
            window.location.reload();
        });


        let addObject = new TouchHolographicButton();
        controllerMenu.addButton(addObject);
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
                listDiplay = GuiUtils.createListObject(playerEntity);
                addObject.text = "Hide 3d Object List";
                displayList = true;
            }

        });
    }

}