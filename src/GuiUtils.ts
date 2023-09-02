import { BoundingBoxGizmo, Color3, CreatePlane, HandConstraintVisibility, MultiPointerScaleBehavior, SixDofDragBehavior, UtilityLayerRenderer, Vector2, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control, GUI3DManager, Grid, HandMenu, HolographicSlate, InputText, NearMenu, ScrollViewer, TextBlock, TextWrapping, TouchHolographicButton, TouchHolographicMenu } from "@babylonjs/gui";
import { Entity } from "tick-knock";
import { AnimationComponent } from "./components/AnimationComponent";
import { ClientComponent } from "./components/ClientComponent";
import { EntityMultiplayerComponent } from "./components/EntityMultiplayerComponent";
import { MeshMultiComponent } from "./components/MeshMultiComponent";
import { PlayerCameraComponent } from "./components/PlayerCameraComponent";
import { TransformComponent } from "./components/TransformComponent";
import { WebXrComponent } from "./components/WebXrComponent";
import { CustomVideo, Object3d, Utils } from "./utils";

// questa classe serve a contenere tutti i metodi statici che riguardano l'interfaccia utente
export class GuiUtils {
    // riferimento al manager della gui 3d
    public static gui3dmanager: GUI3DManager;

    // booleano che indica la visualizzazione del menu degli oggetti
    public static objectMenuShow: boolean = false;

    // booleano che indica se sono in modalità di edit
    static switchEdit: boolean = false;

    // booleano che indica se sono in modalità di edit
    static switchMove: boolean = false;

    // questo metodo crea il menu di benvenuto, opzioni disponibili:
    //  - Create room
    //  - Join room (con codice inserito da tastiera)
    //  - Room list (visualizzazione elenco di stanze)
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

        let roomListSlate: HolographicSlate;


        //nearMenu.scaling = new Vector3(0.1, 0.1, 0.1);


        var createButton = new TouchHolographicButton();
        nearMenu.addButton(createButton);
        createButton.text = "Create Room";
        createButton.imageUrl = "icon/create-room.png";

        createButton.onPointerDownObservable.add(async () => {
            player.get(ClientComponent).room = await player.get(ClientComponent).client.create(ROOM_TYPE);
            Utils.room = player.get(ClientComponent).room;

            if (player.get(ClientComponent).room != null) {
                nearMenu.dispose();
                if (roomListSlate != undefined) {
                    roomListSlate.dispose();
                }
                Utils.setServerTrigger(Utils.engineEcs);
                GuiUtils.initRoom(player);
            }
        });


        var joinButton = new TouchHolographicButton();
        nearMenu.addButton(joinButton);
        joinButton.text = "Join Room";
        joinButton.imageUrl = "icon/join.png";

        joinButton.onPointerDownObservable.add(async () => {
            player.get(ClientComponent).room = await player.get(ClientComponent).client.joinById(inputText.text);
            Utils.room = player.get(ClientComponent).room;

            if (player.get(ClientComponent).room != null) {
                nearMenu.dispose();
                if (roomListSlate != undefined) {
                    roomListSlate.dispose();
                }
                Utils.setServerTrigger(Utils.engineEcs);
                GuiUtils.initRoom(player);
            }
        });

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


        var listButton = new TouchHolographicButton();
        nearMenu.addButton(listButton);
        listButton.text = "Room List";
        listButton.imageUrl = "icon/join.png";

        let displayList = false;

        listButton.onPointerDownObservable.add(async () => {

            if (displayList == true) {
                roomListSlate.dispose();
                displayList = false;
                listButton.text = "Room List";
            } else {
                //spawn slate con elenco
                roomListSlate = await GuiUtils.createListRoom(player, nearMenu);
                listButton.text = "Hide Room List";
                displayList = true;
            }


        });


        nearMenu.scaling.addInPlace(new Vector3(0.02, 0.02, 0.02));



    }

    // questo metodo crea il near menu principale della stanza, opzioni disponibili:
    //  - Add 3d object (visualizzazione elenco di oggetti)
    //  - Add video (visualizzazione elenco video) WIP
    //  - Room id
    //  - Leave room (ricarica la pagina)
    static async initRoom(player: Entity) {

        let displayList = false;
        let displayListVideo = false;

        const manager = GuiUtils.gui3dmanager;

        // creo l'hand menu uguale a quello creato in questo metodo
        this.createHandMenu(player);

        var nearMenu = new NearMenu("NearMenu");
        nearMenu.rows = 1;
        manager.addControl(nearMenu);
        nearMenu.isPinned = false;
        nearMenu.position.y = 2;

        let addObject = new TouchHolographicButton();
        nearMenu.addButton(addObject);
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

        let addVideo = new TouchHolographicButton();
        nearMenu.addButton(addVideo);
        addVideo.text = "Add Video";
        addVideo.imageUrl = "icon/video.png";

        let listVideo: HolographicSlate;

        addVideo.onPointerDownObservable.add(async () => {

            if (displayListVideo == true) {
                listVideo.dispose();
                displayListVideo = false;
                addVideo.text = "Add Video";
            } else {
                //spawn slate con elenco
                listVideo = GuiUtils.createListVideo(player);
                addVideo.text = "Hide Video List";
                displayListVideo = true;
            }

        });

        var roomInfo = new TouchHolographicButton();
        nearMenu.addButton(roomInfo);
        roomInfo.text = "Room id: " + player.get(ClientComponent).room.id.toString();
        console.log(player.get(ClientComponent).room.id.toString());

        roomInfo.onPointerDownObservable.add(async () => {
            Utils.copyMessage(player.get(ClientComponent).room.id.toString());

        });

        var leaveRoomBtn = new TouchHolographicButton();
        nearMenu.addButton(leaveRoomBtn);
        leaveRoomBtn.text = "Leave Room";
        leaveRoomBtn.imageUrl = "https://raw.githubusercontent.com/microsoft/MixedRealityToolkit-Unity/main/Assets/MRTK/SDK/StandardAssets/Textures/IconClose.png";

        leaveRoomBtn.onPointerDownObservable.add(async () => {
            player.get(ClientComponent).room.leave();
            window.location.reload();
        });




        nearMenu.scaling.addInPlace(new Vector3(0.02, 0.02, 0.02));

    }

    // questo metodo crea l'hand menu principale della stanza, opzioni disponibili:
    //  - Add 3d object (visualizzazione elenco di oggetti)
    //  - Add video (visualizzazione elenco video) WIP
    //  - Room id
    //  - Leave room (ricarica la pagina)
    static createHandMenu(player) {
        let displayList = false;

        let handMenu = new HandMenu(player.get(WebXrComponent).exp.baseExperience, "HandMenu");
        handMenu.handConstraintBehavior.handConstraintVisibility = HandConstraintVisibility.PALM_UP;
        handMenu.handConstraintBehavior.handedness = "none";
        GuiUtils.gui3dmanager.addControl(handMenu);

        let leaveRoomBtn = new TouchHolographicButton();
        leaveRoomBtn.text = "Leave Room";
        leaveRoomBtn.imageUrl = "https://raw.githubusercontent.com/microsoft/MixedRealityToolkit-Unity/main/Assets/MRTK/SDK/StandardAssets/Textures/IconClose.png";
        handMenu.addButton(leaveRoomBtn);
        leaveRoomBtn.onPointerDownObservable.add(async () => {
            player.get(ClientComponent).room.leave();
            window.location.reload();
        });

        let roomInfo = new TouchHolographicButton();
        roomInfo.text = "Room id: " + player.get(ClientComponent).room.id.toString();
        handMenu.addButton(roomInfo);

        roomInfo.onPointerDownObservable.add(async () => {
            Utils.copyMessage(player.get(ClientComponent).room.id.toString());

        });

        let addObject = new TouchHolographicButton();
        addObject.text = "Add 3d Object";
        addObject.imageUrl = "icon/object.png";
        handMenu.addButton(addObject);
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

        handMenu.scaling.addInPlace(new Vector3(0.01, 0.01, 0.01));
    }

    // questo metodo crea una list slate con tutti gli oggetti disponibili
    // è possibile cliccare sugli oggetti per farli spawnare davanti al player
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

                /* let { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
                    null,
                    objectAvaible[i].percorso,
                    objectAvaible[i].nomeFile
                );

                newObject.add(new MeshArrayComponent(meshes, newObject.id));

                if (animationGroups.length != 0) {
                    newObject.add(new AnimationComponent(animationGroups));
                    animationGroups[0].stop();
                } */

                newObject.add(new EntityMultiplayerComponent(false));

                newObject.add(new MeshMultiComponent(objectAvaible[i].percorso, objectAvaible[i].nomeFile, false));

                // posiziono l'oggetto difronte al player
                let positionToSpawn = player.get(PlayerCameraComponent).camera.getFrontPosition(1);

                newObject.add(new TransformComponent(false, positionToSpawn.x, positionToSpawn.y, positionToSpawn.z));

                Utils.engineEcs.addEntity(newObject);
            });

            var textButton = Button.CreateSimpleButton("", objectAvaible[i].nome);
            textButton.color = "white";
            textButton.background = "green";
            grid.addControl(textButton, i, 1);

            textButton.onPointerClickObservable.add(async () => {
                //piazzo una nuovo oggetto selezionato nella scena
                let newObject = new Entity();

                /* let { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
                    null,
                    objectAvaible[i].percorso,
                    objectAvaible[i].nomeFile
                );

                newObject.add(new MeshArrayComponent(meshes, newObject.id));

                if (animationGroups.length != 0) {
                    newObject.add(new AnimationComponent(animationGroups));
                    animationGroups[0].stop();
                } */

                newObject.add(new EntityMultiplayerComponent(false));

                newObject.add(new MeshMultiComponent(objectAvaible[i].percorso, objectAvaible[i].nomeFile, false));

                // posiziono l'oggetto difronte al player
                let positionToSpawn = player.get(PlayerCameraComponent).camera.getFrontPosition(1);

                newObject.add(new TransformComponent(false, positionToSpawn.x, positionToSpawn.y, positionToSpawn.z));

                Utils.engineEcs.addEntity(newObject);
            });
        }

        grid.height = elementSize * 200 + "px";
        listSlate.content = sv;

        return listSlate;
    }

    // questo metodo crea una list slate con tutti i video disponibili
    // è possibile cliccare sui video per farli spawnare davanti al player
    static createListVideo(player: Entity): HolographicSlate {
        let manager = GuiUtils.gui3dmanager;
        let playerTransform = player.get(TransformComponent);

        //creo la lastra olografica dove inserirò la gui 2d
        let listSlate = new HolographicSlate("listSlate");
        listSlate.titleBarHeight = 0;
        listSlate.dimensions = new Vector2(1, 1);
        listSlate.position = new Vector3(0, 0, 0);
        listSlate.title = "Add Video";

        manager.addControl(listSlate);

        let sv = new ScrollViewer();
        sv.background = "blue";

        let grid = new Grid();
        grid.background = "black";

        sv.addControl(grid);

        grid.addColumnDefinition(0.5);
        grid.addColumnDefinition(0.5);

        let videoAvaible: Array<CustomVideo> = Utils.getAvaiableVideo();

        //console.log(videoAvaible);

        let elementSize = videoAvaible.length;

        for (let i = 0; i < elementSize; i++) {
            grid.addRowDefinition(200, true);
            var imgButton = Button.CreateImageOnlyButton("", videoAvaible[i].urlIcona);
            grid.addControl(imgButton, i, 0);

            imgButton.onPointerClickObservable.add(async () => {
                //piazzo una nuovo video selezionato nella scena
                let video = new Entity();

                video.add(new EntityMultiplayerComponent(false));

                video.add(new MeshMultiComponent(videoAvaible[i].percorso, videoAvaible[i].nomeFile, false));

                // posiziono l'oggetto difronte al player
                let positionToSpawn = player.get(PlayerCameraComponent).camera.getFrontPosition(1);

                video.add(new TransformComponent(false, positionToSpawn.x, positionToSpawn.y, positionToSpawn.z));

                Utils.engineEcs.addEntity(video);
            });

            var textButton = Button.CreateSimpleButton("", videoAvaible[i].nome);
            textButton.color = "white";
            textButton.background = "green";
            grid.addControl(textButton, i, 1);

            textButton.onPointerClickObservable.add(async () => {
                //piazzo una nuovo video selezionato nella scena
                let video = new Entity();

                video.add(new EntityMultiplayerComponent(false));

                video.add(new MeshMultiComponent(videoAvaible[i].percorso, videoAvaible[i].nomeFile, false));

                // posiziono l'oggetto difronte al player
                let positionToSpawn = player.get(PlayerCameraComponent).camera.getFrontPosition(1);

                video.add(new TransformComponent(false, positionToSpawn.x, positionToSpawn.y, positionToSpawn.z));

                Utils.engineEcs.addEntity(video);
            });
        }

        grid.height = elementSize * 200 + "px";
        listSlate.content = sv;

        return listSlate;
    }

    // questo metodo crea il touch holographic menu della stanza, opzioni disponibili:
    //  - Add 3d object (visualizzazione elenco di oggetti)
    //  - Add video (visualizzazione elenco video) WIP
    //  - Room id
    //  - Leave room (ricarica la pagina)
    // questo menu dovrebbe essere attaccato a runtime alla mesh del controller sinistro
    static controllerMenu(playerEntity): TouchHolographicMenu {
        let manager = GuiUtils.gui3dmanager;

        let controllerMenu = new TouchHolographicMenu("objectMenu");
        controllerMenu.columns = 1;
        manager.addControl(controllerMenu);
        controllerMenu.isVisible = false;

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

        //controllerMenu.scaling.addInPlace(new Vector3(0.01, 0.01, 0.01));

        return controllerMenu;
    }

    // testing menu, non serve a niente
    static holoMenu(): TouchHolographicMenu {
        //let mesh = inputSource.grip;
        let manager = GuiUtils.gui3dmanager;

        let controllerMenu = new TouchHolographicMenu("objectMenu");
        controllerMenu.columns = 1;
        manager.addControl(controllerMenu);
        //controllerMenu.linkToTransformNode(mesh);
        controllerMenu.mesh.rotate(new Vector3(1, 0, 0), -30);
        controllerMenu.mesh.position = new Vector3(0.10, 0, -0.1);

        let displayList = false;

        var roomInfo = new TouchHolographicButton();
        controllerMenu.addButton(roomInfo);
        roomInfo.text = "Room id: ";
        //console.log(Utils.room.id.toString());



        var leaveRoomBtn = new TouchHolographicButton();
        controllerMenu.addButton(leaveRoomBtn);
        leaveRoomBtn.text = "Leave Room";
        leaveRoomBtn.imageUrl = "https://raw.githubusercontent.com/microsoft/MixedRealityToolkit-Unity/main/Assets/MRTK/SDK/StandardAssets/Textures/IconClose.png"

        leaveRoomBtn.onPointerDownObservable.add(async () => {
            controllerMenu.mesh.position.y += 0.1;
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
                //listDiplay = GuiUtils.createListObject(playerEntity);
                addObject.text = "Hide 3d Object List";
                displayList = true;
            }

        });

        return controllerMenu
    }

    // crea una holographic slate con un warning dato in input
    static warningSlate(titleString: string, textString: string) {
        var dialogSlate = new HolographicSlate("dialogSlate");

        dialogSlate.titleBarHeight = 0; // Hides default slate controls and title bar
        dialogSlate.dimensions = new Vector2(1, 1);
        dialogSlate.position = new Vector3(0, 0, 0);

        GuiUtils.gui3dmanager.addControl(dialogSlate);

        var contentGrid = new Grid("grid");
        var buttonLeft = Button.CreateSimpleButton("left", "Okay");
        var title = new TextBlock("title");
        var text = new TextBlock("text");

        buttonLeft.width = 1;
        buttonLeft.height = 0.2;
        buttonLeft.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        buttonLeft.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        buttonLeft.textBlock.color = "white";
        buttonLeft.onPointerUpObservable.add(() => {
            dialogSlate.dispose();
        });

        title.height = 0.2;
        title.color = "white";
        title.textWrapping = TextWrapping.WordWrap;
        title.setPadding("5%", "5%", "5%", "5%");
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        title.text = titleString;
        title.fontWeight = "bold";

        text.height = 0.8;
        text.color = "white";
        text.textWrapping = TextWrapping.WordWrap;
        text.setPadding("5%", "5%", "5%", "5%");
        text.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        text.text = textString;

        contentGrid.addControl(buttonLeft);
        contentGrid.addControl(title);
        contentGrid.addControl(text);
        contentGrid.background = "#000080";
        dialogSlate.content = contentGrid;
    }

    // questo metodo crea una list slate con tutte le stanza disponibili
    // è possibile cliccare sul codice della stanza per entrarci
    static async createListRoom(player: Entity, nearMenu): Promise<HolographicSlate> {
        let manager = GuiUtils.gui3dmanager;

        //creo la lastra olografica dove inserirò la gui 2d
        let listSlate = new HolographicSlate("listSlate");
        listSlate.titleBarHeight = 0;
        listSlate.dimensions = new Vector2(1, 1);
        listSlate.position = new Vector3(0, 0, 0);
        listSlate.title = "Room list";

        manager.addControl(listSlate);

        let sv = new ScrollViewer();
        sv.background = "blue";

        let grid = new Grid();
        grid.background = "black";

        sv.addControl(grid);

        grid.addColumnDefinition(1);

        let roomAvaible = await player.get(ClientComponent).client.getAvailableRooms("my_room");

        let elementSize = roomAvaible.length;

        if (elementSize > 0) {
            for (let i = 0; i < elementSize; i++) {
                grid.addRowDefinition(200, true);

                var textButton = Button.CreateSimpleButton("", roomAvaible[i].roomId);
                textButton.color = "white";
                textButton.background = "green";
                grid.addControl(textButton, i, 0);

                textButton.onPointerClickObservable.add(async () => {

                    player.get(ClientComponent).room = await player.get(ClientComponent).client.joinById(roomAvaible[i].roomId);
                    Utils.room = player.get(ClientComponent).room;

                    if (player.get(ClientComponent).room != null) {
                        nearMenu.dispose();
                        listSlate.dispose();
                        Utils.setServerTrigger(Utils.engineEcs);
                        GuiUtils.initRoom(player);
                    }

                });
            }

            grid.height = elementSize * 200 + "px";

        } else {

            var title = new TextBlock("title");
            grid.addControl(title);
            title.height = 0.2;
            title.color = "white";
            title.textWrapping = TextWrapping.WordWrap;
            title.setPadding("5%", "5%", "5%", "5%");
            title.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            title.text = "No avaible Rooms";
            title.fontWeight = "bold";
            title.fontSize = 50;

        }


        listSlate.content = sv;

        return listSlate;
    }

    // questo metodo crea il touch holographic menu per il singolo oggetto, opzioni disponibili:
    //  - Move/Scale
    //  - Play/Stop (in caso di animazioni)
    //  - Delete object
    //  - Close menu
    // questo menu dovrebbe essere attaccato a runtime alla mesh del controller sinistro
    static objectMenu(entityPicked, entityMesh): TouchHolographicMenu {
        let objectMenu = new TouchHolographicMenu("objectMenu");

        objectMenu.rows = 1;
        GuiUtils.gui3dmanager.addControl(objectMenu);

        /* const attachToBoxBehavior = new AttachToBoxBehavior(objectMenu.mesh);
        attachToBoxBehavior.distanceAwayFromBottomOfFace = 0;
        attachToBoxBehavior.distanceAwayFromFace = 0;
        entityMesh.addBehavior(attachToBoxBehavior); */

        /* let boundingBox = BoundingBoxGizmo.MakeNotPickableAndWrapInBoundingBox(entityMesh as Mesh);

        entityMesh = boundingBox; */

        //objectMenu.mesh.position.y = entityMesh.getBoundingInfo().boundingBox.extendSize.y + 0.5;

        const sixDofDragBehavior = new SixDofDragBehavior();
        const multiPointerScaleBehavior = new MultiPointerScaleBehavior();
        let utilLayer, gizmo;

        let editButton = new TouchHolographicButton("editButton");
        objectMenu.addButton(editButton);
        editButton.text = "Scale";
        editButton.imageUrl = "https://raw.githubusercontent.com/microsoft/MixedRealityToolkit-Unity/main/Assets/MRTK/SDK/StandardAssets/Textures/IconAdjust.png";
        editButton.onPointerDownObservable.add(() => {

            if (GuiUtils.switchEdit == false) {
                // Create bounding box gizmo
                utilLayer = new UtilityLayerRenderer(Utils.scene)
                utilLayer.utilityLayerScene.autoClearDepthAndStencil = false;
                gizmo = new BoundingBoxGizmo(Color3.FromHexString("#0984e3"), utilLayer);

                gizmo.attachedMesh = entityMesh;

                entityMesh.addBehavior(multiPointerScaleBehavior);
                entityMesh.addBehavior(sixDofDragBehavior);
                entityPicked.get(TransformComponent).revertLogic = true;
                entityPicked.get(TransformComponent).update = true;
                GuiUtils.switchEdit = true;
            } else {
                utilLayer.dispose();
                gizmo.dispose();
                entityMesh.removeBehavior(multiPointerScaleBehavior);
                entityMesh.removeBehavior(sixDofDragBehavior);
                entityPicked.get(TransformComponent).revertLogic = false;
                entityPicked.get(TransformComponent).update = false;
                GuiUtils.switchEdit = false;
            }


        });

        if (entityPicked.has(AnimationComponent)) {

            let animComp = entityPicked.get(AnimationComponent);

            if (animComp.isVideo == false) {

                for (let i = 0; i < animComp.animGroup.length; i++) {
                    let playButton = new TouchHolographicButton("playButton");
                    objectMenu.addButton(playButton);
                    playButton.text = "Play " + animComp.animGroup[i].name;
                    playButton.imageUrl = "icon/play-button.png";

                    playButton.onPointerDownObservable.add(() => {
                        if (animComp.state == null || animComp.state == "pause") {
                            animComp.animGroup[i].start(true);
                            animComp.state = i.toString();

                            playButton.text = "Pause";
                            playButton.imageUrl = "icon/pause.png";

                        } else if (animComp.state == i.toString()) {
                            animComp.animGroup[i].stop();
                            animComp.state = "pause";

                            playButton.text = "Play";
                            playButton.imageUrl = "icon/play-button.png";
                        }

                    });

                }

            } else {
                let playButton = new TouchHolographicButton("playButton");
                objectMenu.addButton(playButton);
                playButton.text = "Play";
                playButton.imageUrl = "icon/play-button.png";

                playButton.onPointerDownObservable.add(() => {
                    if (animComp.state == null || animComp.state == "pause") {
                        animComp.video.video.play();
                        animComp.state = "play";

                        playButton.text = "Pause";
                        playButton.imageUrl = "icon/pause.png";

                    } else if (animComp.state == "play") {
                        animComp.video.video.pause();
                        animComp.state = "pause";

                        playButton.text = "Play";
                        playButton.imageUrl = "icon/play-button.png";
                    }

                });

                let muteButton = new TouchHolographicButton("muteButton");
                objectMenu.addButton(muteButton);
                muteButton.text = "Mute";
                muteButton.imageUrl = "icon/volume.png";

                muteButton.onPointerDownObservable.add(() => {

                    if (animComp.video.video.mute) {
                        // se è mutato, lo smuto
                        animComp.video.video.mute = false;

                        muteButton.text = "Mute";
                        muteButton.imageUrl = "icon/volume.png";

                    } else {
                        // se è smutato, lo muto
                        animComp.video.video.mute = true;

                        muteButton.text = "Unmute";
                        muteButton.imageUrl = "icon/mute.png";
                    }

                });
            }



        }



        let removeButton = new TouchHolographicButton("removeButton");
        objectMenu.addButton(removeButton);
        removeButton.text = "Delete Object";
        removeButton.imageUrl = "icon/recycle-bin.png";
        removeButton.onPointerDownObservable.add(() => {
            if (GuiUtils.switchEdit) {
                utilLayer.dispose();
                gizmo.dispose();
                entityMesh.removeBehavior(multiPointerScaleBehavior);
                entityMesh.removeBehavior(sixDofDragBehavior);
                entityPicked.get(TransformComponent).revertLogic = false;
                entityPicked.get(TransformComponent).update = false;
                GuiUtils.switchEdit = false;
            }
            objectMenu.dispose();
            entityPicked.get(EntityMultiplayerComponent).delete = "true";
            GuiUtils.objectMenuShow = false;
        });

        let closeButton = new TouchHolographicButton("closeButton");
        objectMenu.addButton(closeButton);
        closeButton.text = "Close Menu";
        closeButton.imageUrl = "https://raw.githubusercontent.com/microsoft/MixedRealityToolkit-Unity/main/Assets/MRTK/SDK/StandardAssets/Textures/IconClose.png";
        closeButton.onPointerDownObservable.add(() => {
            //chiudo la modalità di edit se non è stata chiusa prima
            if (GuiUtils.switchEdit) {
                utilLayer.dispose();
                gizmo.dispose();
                entityMesh.removeBehavior(multiPointerScaleBehavior);
                entityMesh.removeBehavior(sixDofDragBehavior);
                entityPicked.get(TransformComponent).revertLogic = false;
                entityPicked.get(TransformComponent).update = false;
                GuiUtils.switchEdit = false;
            }
            objectMenu.dispose();
            GuiUtils.objectMenuShow = false;
            entityPicked.get(EntityMultiplayerComponent).busy = "false";
        });

        GuiUtils.objectMenuShow = true;

        return objectMenu;
    }
}