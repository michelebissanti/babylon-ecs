import { Entity, EntitySnapshot, IterativeSystem, QueryBuilder } from "tick-knock";
import { MeshComponent } from "../components/MeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { FreeCamera, IPointerEvent, KeyboardEventTypes, PointerEventTypes, Scene, Vector3, WebXRState, Node, WebXRFeatureName, BoundingBoxGizmo, Mesh, UtilityLayerRenderer, Color3, SixDofDragBehavior, MultiPointerScaleBehavior, TransformNode, AttachToBoxBehavior, AbstractMesh, MeshBuilder, Vector2, PointerDragBehavior, SceneLoader, WebXRAbstractMotionController } from "@babylonjs/core";
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
import { AnimationComponent } from "../components/AnimationComponent";
import { GuiUtils } from "../GuiUtils";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class WebXrSystem extends IterativeSystem {
    scene: Scene;
    init = true;
    initRoom = true;

    constructor(scene: Scene) {
        super(new QueryBuilder().contains(WebXrComponent).build());
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {
        let defExp = entity.get(WebXrComponent).exp;
        let controllers: WebXRAbstractMotionController[] = new Array<WebXRAbstractMotionController>();

        if (this.init) {
            const featureManager = defExp.baseExperience.featuresManager;

            //quando entro nella sessione webxr
            defExp.baseExperience.sessionManager.onXRSessionInit.add(() => {
                //aggiorno la telecamera dell'entità player
                entity.get(PlayerCameraComponent).camera = defExp.baseExperience.camera;

                if (defExp.baseExperience.sessionManager.sessionMode == "immersive-ar") {
                    //nascondo la mesh del terreno

                }
            });


            //abilito se possibile l'hand tracking
            let handTracking = featureManager.enableFeature(WebXRFeatureName.HAND_TRACKING, "latest", {
                xrInput: defExp.input,
            }, true, false);

            //abilito se possibile il walking locomotion
            featureManager.enableFeature(WebXRFeatureName.WALKING_LOCOMOTION, "latest", {
                locomotionTarget: entity.get(PlayerCameraComponent).camera
            }, true, false);


            //quando esco dalla sessione webxr
            defExp.baseExperience.sessionManager.onXRSessionEnded.add(() => {
                //aggiorno la telecamera dell'entità player
                entity.get(PlayerCameraComponent).camera = this.scene.getCameraById("cameraPlayer") as FreeCamera;
            });


            let objectMenuShow = false;
            let objectMenuList = new Map<Entity, boolean>();
            let objectMenu: TouchHolographicMenu;
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

                                        //se l'entità è libera compare il menu
                                        if (entityPicked.get(EntityMultiplayerComponent).busy == undefined || entityPicked.get(EntityMultiplayerComponent).busy == Utils.room.sessionId) {

                                            let manager = GuiUtils.gui3dmanager;
                                            let entityMesh = entityPicked.get(MeshArrayComponent).meshes[0];

                                            if (entityPicked.get(EntityMultiplayerComponent).busy != Utils.room.sessionId) {
                                                //occupo l'entità
                                                entityPicked.get(EntityMultiplayerComponent).busy = "true";
                                            }

                                            //se il menu è aperto
                                            if (objectMenuShow == false) {
                                                objectMenu = new TouchHolographicMenu("objectMenu");

                                                objectMenu.rows = 1;
                                                manager.addControl(objectMenu);
                                                objectMenu.linkToTransformNode(entityMesh);

                                                /* const attachToBoxBehavior = new AttachToBoxBehavior(objectMenu.mesh);
                                                attachToBoxBehavior.distanceAwayFromBottomOfFace = 0;
                                                attachToBoxBehavior.distanceAwayFromFace = 0;
                                                entityMesh.addBehavior(attachToBoxBehavior); */

                                                /* let boundingBox = BoundingBoxGizmo.MakeNotPickableAndWrapInBoundingBox(entityMesh as Mesh);

                                                entityMesh = boundingBox; */


                                                objectMenu.scaling.x = 0.1;
                                                objectMenu.scaling.y = 0.1;
                                                objectMenu.scaling.z = 0.1;

                                                //objectMenu.mesh.position.y = entityMesh.getBoundingInfo().boundingBox.extendSize.y + 0.5;

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

                                                if (entityPicked.has(AnimationComponent)) {

                                                    let animComp = entityPicked.get(AnimationComponent);

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




                                                }



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
                                                    //chiudo la modalità di edit se non è stata chiusa prima
                                                    if (switchEdit) {
                                                        utilLayer.dispose();
                                                        gizmo.dispose();
                                                        entityMesh.removeBehavior(multiPointerScaleBehavior);
                                                        entityMesh.removeBehavior(sixDofDragBehavior);
                                                        entityPicked.get(TransformComponent).revertLogic = false;
                                                        entityPicked.get(TransformComponent).update = false;
                                                        switchEdit = false;
                                                    }
                                                    objectMenu.dispose();
                                                    objectMenuShow = false;
                                                    entityPicked.get(EntityMultiplayerComponent).busy = "false";
                                                });

                                                objectMenu.mesh.position.y = entityMesh.getBoundingInfo().boundingBox.extendSize.y + (objectMenu.mesh.getBoundingInfo().boundingBox.extendSize.y / 2) + 0.3;

                                                objectMenuShow = true;
                                            } else {

                                            }

                                        } else {
                                            //panel di warning perchè oggetto è occupato
                                            GuiUtils.warningSlate("Warning", "This object is busy by another user.");

                                        }


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

        if (this.initRoom && Utils.room != null) {
            let controllerMenu: TouchHolographicMenu;
            let controllerMenuState = true;

            controllerMenu = GuiUtils.controllerMenu(entity);

            //posizionamento del menu sul controller
            defExp.input.onControllerAddedObservable.add(inputSource => {
                inputSource.onMotionControllerInitObservable.add(motionController => {
                    motionController.onModelLoadedObservable.add(mc => {
                        //console.log(inputSource);

                        controllers.push(mc);

                        //se è un controller sinistro e non è una mano
                        if (motionController.handedness[0] === 'l' && inputSource.inputSource.hand == undefined) {
                            //attacco il menu al controller
                            controllerMenu.mesh.parent = inputSource.grip;
                            controllerMenu.isVisible = true;
                        } else {
                            //controllerMenu.position = new Vector3(-0.1, 0, 0);
                        }

                        const xr_ids = motionController.getComponentIds();

                        //press x to hide the menu
                        let xbuttonComponent = motionController.getComponent(xr_ids[3]);//x-button
                        xbuttonComponent.onButtonStateChangedObservable.add(() => {
                            if (xbuttonComponent.pressed) {
                                if (controllerMenuState) {
                                    controllerMenu.isVisible = false;
                                    controllerMenuState = false;
                                } else {
                                    controllerMenu.isVisible = true;
                                    controllerMenuState = true;
                                }

                            }
                        });






                    })
                })
            });

            this.initRoom = false;
        }

    }
}