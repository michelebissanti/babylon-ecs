import { Entity, EntitySnapshot, IterativeSystem, QueryBuilder } from "tick-knock";
import { MeshComponent } from "../components/MeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { FreeCamera, IPointerEvent, KeyboardEventTypes, PointerEventTypes, Scene, Vector3, WebXRState, Node, WebXRFeatureName, BoundingBoxGizmo, Mesh, UtilityLayerRenderer, Color3, SixDofDragBehavior, MultiPointerScaleBehavior, TransformNode, AttachToBoxBehavior, AbstractMesh, MeshBuilder, Vector2, PointerDragBehavior } from "@babylonjs/core";
import { PlanePanel, HolographicButton, TouchHolographicButton, TouchHolographicMenu, HolographicSlate, ScrollViewer, Grid, Button } from "@babylonjs/gui";
import { PhysicComponent } from "../components/PhysicComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { WebXrComponent } from "../components/WebXrComponent";
import { MeshArrayComponent } from "../components/MeshArrayComponent";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { Gui3dComponent } from "../components/Gui3dComponent";
import { TransformComponent } from "../components/TransformComponent";
import { AdvancedDynamicTextureTreeItemComponent } from "@babylonjs/inspector/components/sceneExplorer/entities/gui/advancedDynamicTextureTreeItemComponent";
import { Object3d, Utils } from "../utils";
import { MeshMultiComponent } from "../components/MeshMultiComponent";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class WebXrSystem extends IterativeSystem {
    scene: Scene;
    init = true;

    constructor(scene: Scene) {
        super(new QueryBuilder().contains(WebXrComponent).build());
        this.scene = scene;
    }

    public bubbleParent(mesh: Node): Node {
        var result = mesh;
        while (result.parent)
            result = result.parent as Node;
        return result;
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
                newObject.add(new MeshArrayComponent(await Utils.importModel(objectAvaible[i].percorso, objectAvaible[i].nomeFile), newObject.id));

                newObject.add(new EntityMultiplayerComponent(false));

                newObject.add(new MeshMultiComponent(objectAvaible[i].percorso, objectAvaible[i].nomeFile, true));

                newObject.add(new TransformComponent(false, player.get(TransformComponent).x, player.get(TransformComponent).y + 1, player.get(TransformComponent).z + 1));

                this.engine.addEntity(newObject);
            });

            var textButton = Button.CreateSimpleButton("", objectAvaible[i].nome);
            textButton.color = "white";
            textButton.background = "green";
            grid.addControl(textButton, i, 1);

            textButton.onPointerClickObservable.add(async () => {
                //piazzo una nuovo oggetto selezionato nella scena
                let newObject = new Entity();
                newObject.add(new MeshArrayComponent(await Utils.importModel(objectAvaible[i].percorso, objectAvaible[i].nomeFile), newObject.id));

                newObject.add(new EntityMultiplayerComponent(false));

                newObject.add(new MeshMultiComponent(objectAvaible[i].percorso, objectAvaible[i].nomeFile, true));

                newObject.add(new TransformComponent(false, player.get(TransformComponent).x, player.get(TransformComponent).y + 1, player.get(TransformComponent).z + 1));

                this.engine.addEntity(newObject);
            });
        }

        grid.height = elementSize * 200 + "px";
        listSlate.content = sv;

        return listSlate;
    }

    protected updateEntity(entity: Entity, dt: number): void {
        let defExp = entity.get(WebXrComponent).exp;

        if (this.init) {
            const featureManager = defExp.baseExperience.featuresManager;

            //abilito se possibile l'hand tracking
            featureManager.enableFeature(WebXRFeatureName.HAND_TRACKING, "latest", {
                xrInput: defExp.input,
            }, true, false);

            //abilito se possibile il walking locomotion
            featureManager.enableFeature(WebXRFeatureName.WALKING_LOCOMOTION, "latest", {
                locomotionTarget: entity.get(PlayerCameraComponent).camera
            }, true, false);

            //quando entro nella sessione webxr
            defExp.baseExperience.sessionManager.onXRSessionInit.add(() => {
                //aggiorno la telecamera dell'entità player
                entity.get(PlayerCameraComponent).camera = defExp.baseExperience.camera;

                if (defExp.baseExperience.sessionManager.sessionMode == "immersive-ar") {
                    //nascondo la mesh del terreno

                }
            });


            //quando esco dalla sessione webxr
            defExp.baseExperience.sessionManager.onXRSessionEnded.add(() => {
                //aggiorno la telecamera dell'entità player
                entity.get(PlayerCameraComponent).camera = this.scene.getCameraById("cameraPlayer") as FreeCamera;
            });





            //posizionamento del menu sul controller
            defExp.input.onControllerAddedObservable.add(inputSource => {
                inputSource.onMotionControllerInitObservable.add(motionController => {
                    motionController.onModelLoadedObservable.add(mc => {

                        Utils.waitForConditionAsync(_ => {
                            return Utils.room != null;
                        }).then(_ => {
                            if (motionController.handedness[0] === 'l') {
                                let mesh = inputSource.grip;
                                let manager = Utils.gui3dmanager;

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
                                        listDiplay = this.createListObject(entity);
                                        addObject.text = "Hide 3d Object List";
                                        displayList = true;
                                    }

                                });
                            } else {
                                //controllerMenu.position = new Vector3(-0.1, 0, 0);
                            }
                        });


                    })
                })
            });


            let objectMenuShow = false;
            let objectMenuList = new Map<Entity, boolean>();
            let objectMenu;
            let switchEdit = false;

            //tocco su un oggetto
            this.scene.onPointerObservable.add((pointerInfo) => {
                switch (pointerInfo?.type) {
                    case PointerEventTypes.POINTERDOWN:
                        if (pointerInfo.pickInfo && pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh) {
                            //let temp = this.bubbleParent(pointerInfo.pickInfo.pickedMesh);
                            if (pointerInfo.pickInfo.pickedMesh.metadata != null) {
                                //prendo l'entità dai metadati
                                let entityPicked = this.engine.getEntityById(+pointerInfo.pickInfo.pickedMesh.metadata.id);

                                //se l'entità esiste
                                if (entityPicked != null) {
                                    if (entityPicked.has(MeshArrayComponent) && entityPicked.has(TransformComponent) && entityPicked.has(EntityMultiplayerComponent)) {

                                        let manager = Utils.gui3dmanager;
                                        let entityMesh = entityPicked.get(MeshArrayComponent).meshes[0];

                                        if (objectMenuShow == false) {
                                            objectMenu = new TouchHolographicMenu("objectMenu");

                                            objectMenu.rows = 1;
                                            manager.addControl(objectMenu);
                                            objectMenu.linkToTransformNode(entityMesh);

                                            objectMenu.scaling.x = 0.1;
                                            objectMenu.scaling.y = 0.1;
                                            objectMenu.scaling.z = 0.1;

                                            objectMenu.mesh.position.y = entityMesh.getBoundingInfo().boundingBox.extendSize.y + 0.5;

                                            const sixDofDragBehavior = new SixDofDragBehavior();
                                            const multiPointerScaleBehavior = new MultiPointerScaleBehavior();
                                            let utilLayer, gizmo;
                                            let editButton = new TouchHolographicButton("editButton");
                                            objectMenu.addButton(editButton);
                                            editButton.text = "Move/Scale";
                                            editButton.imageUrl = "https://raw.githubusercontent.com/microsoft/MixedRealityToolkit-Unity/main/Assets/MRTK/SDK/StandardAssets/Textures/IconAdjust.png";
                                            editButton.onPointerDownObservable.add(() => {

                                                if (switchEdit == false) {
                                                    // Create bounding box gizmo
                                                    utilLayer = new UtilityLayerRenderer(this.scene)
                                                    utilLayer.utilityLayerScene.autoClearDepthAndStencil = false;
                                                    gizmo = new BoundingBoxGizmo(Color3.FromHexString("#0984e3"), utilLayer);
                                                    gizmo.attachedMesh = entityMesh;
                                                    entityMesh.addBehavior(multiPointerScaleBehavior);
                                                    entityMesh.addBehavior(sixDofDragBehavior);
                                                    entityPicked.get(TransformComponent).revertLogic = true;
                                                    entityPicked.get(TransformComponent).update = true;
                                                    switchEdit = true;
                                                } else {
                                                    utilLayer.dispose();
                                                    gizmo.dispose();
                                                    entityMesh.removeBehavior(multiPointerScaleBehavior);
                                                    entityMesh.removeBehavior(sixDofDragBehavior);
                                                    entityPicked.get(TransformComponent).revertLogic = false;
                                                    entityPicked.get(TransformComponent).update = false;
                                                    switchEdit = false;
                                                }


                                            });

                                            let playButton = new TouchHolographicButton("playButton");
                                            objectMenu.addButton(playButton);
                                            playButton.text = "Play";
                                            playButton.imageUrl = "icon/play-button.png";
                                            playButton.onPointerDownObservable.add(() => {
                                                console.log("Button 1 pressed");
                                            });

                                            let removeButton = new TouchHolographicButton("removeButton");
                                            objectMenu.addButton(removeButton);
                                            removeButton.text = "Delete Object";
                                            removeButton.imageUrl = "icon/recycle-bin.png";
                                            removeButton.onPointerDownObservable.add(() => {
                                                entityPicked.get(EntityMultiplayerComponent).delete = "true";
                                                objectMenuShow = false;
                                            });

                                            let closeButton = new TouchHolographicButton("closeButton");
                                            objectMenu.addButton(closeButton);
                                            closeButton.text = "Close Menu";
                                            closeButton.imageUrl = "https://raw.githubusercontent.com/microsoft/MixedRealityToolkit-Unity/main/Assets/MRTK/SDK/StandardAssets/Textures/IconClose.png";
                                            closeButton.onPointerDownObservable.add(() => {
                                                objectMenu.dispose();
                                                objectMenuShow = false;
                                            });

                                            //objectMenu.position.y = entityMesh.getBoundingInfo().boundingBox.extendSize.y + (objectMenu.mesh.getBoundingInfo().boundingBox.extendSize.y / 2) + 0.3;

                                            objectMenuShow = true;
                                        } else {

                                        }















                                        /* 
                                                                                var boundingBox = entityPicked.get(MeshArrayComponent).meshes[0];
                                                                                var utilLayer = new UtilityLayerRenderer(this.scene);
                                                                                utilLayer.utilityLayerScene.autoClearDepthAndStencil = false;
                                                                                var gizmo = new BoundingBoxGizmo(Color3.FromHexString("#0984e3"), utilLayer)
                                        
                                                                                var sixDofDragBehavior = new SixDofDragBehavior();
                                                                                var multiPointerScaleBehavior = new MultiPointerScaleBehavior();
                                        
                                        
                                        
                                                                                if (entityPicked.get(TransformComponent).update == false) {
                                        
                                                                                    gizmo.attachedMesh = boundingBox;
                                                                                    boundingBox.addBehavior(sixDofDragBehavior);
                                                                                    boundingBox.addBehavior(multiPointerScaleBehavior);
                                        
                                                                                    var appBar = new TransformNode("ExitButton");
                                                                                    //appBar.scaling.scaleInPlace(2);
                                                                                    var panel = new PlanePanel();
                                                                                    panel.margin = 0;
                                                                                    panel.rows = 1;
                                                                                    manager.addControl(panel);
                                                                                    panel.linkToTransformNode(appBar);
                                        
                                                                                    var button2 = new HolographicButton("");
                                                                                    panel.addControl(button2);
                                                                                    button.text = "Exit from edit";
                                        
                                                                                    button.onPointerClickObservable.add(() => {
                                                                                        gizmo.attachedMesh = null;
                                                                                        boundingBox.removeBehavior(sixDofDragBehavior);
                                                                                        boundingBox.removeBehavior(multiPointerScaleBehavior);
                                                                                        appBar.dispose();
                                                                                        entityPicked.get(TransformComponent).revertLogic = false;
                                                                                        entityPicked.get(TransformComponent).update = false;
                                                                                    });
                                        
                                                                                    //attach app bar to bounding box
                                                                                    boundingBox.addBehavior(new AttachToBoxBehavior(appBar));
                                        
                                                                                    entityPicked.get(TransformComponent).revertLogic = true;
                                                                                    entityPicked.get(TransformComponent).update = true;
                                                                                } */

                                    }
                                } else {
                                    console.log("nessuna entità");
                                }
                            }

                        }
                }
            });

            this.init = false;
        }

    }
}