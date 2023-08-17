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



            let objectMenuList = new Map<Entity, boolean>();
            let objectMenu: TouchHolographicMenu;

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

                                            let entityMesh = entityPicked.get(MeshArrayComponent).meshes[0];

                                            //occupo l'entità
                                            if (entityPicked.get(EntityMultiplayerComponent).busy != Utils.room.sessionId) {
                                                entityPicked.get(EntityMultiplayerComponent).busy = "true";
                                            }

                                            //menu sull'oggetto
                                            if (GuiUtils.objectMenuShow == false) {
                                                objectMenu = GuiUtils.objectMenu(entityPicked, entityMesh);
                                                objectMenu.linkToTransformNode(entityMesh);
                                                objectMenu.mesh.position.y = entityMesh.getBoundingInfo().boundingBox.extendSize.y + (objectMenu.mesh.getBoundingInfo().boundingBox.extendSize.y / 2) + 0.3;
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