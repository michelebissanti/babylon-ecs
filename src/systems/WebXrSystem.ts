import { AbstractMesh, BoundingBoxGizmo, Color3, FreeCamera, PointerEventTypes, Scene, Vector3, WebXRAbstractMotionController, WebXRFeatureName, WebXRInputSource } from "@babylonjs/core";
import { TouchHolographicMenu } from "@babylonjs/gui";
import { Entity, IterativeSystem, QueryBuilder } from "tick-knock";
import { GuiUtils } from "../GuiUtils";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { MeshArrayComponent } from "../components/MeshArrayComponent";
import { MeshComponent } from "../components/MeshComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { TransformComponent } from "../components/TransformComponent";
import { WebXrComponent } from "../components/WebXrComponent";
import { Utils } from "../utils";
import { FollowComponent } from "../components/FollowComponent";

// WebXrSystem: gestisce l'entità che possiede WebXrComponent
// dovrebbe gestire solo il player locale nelle sue interazioni con la webxr
export class WebXrSystem extends IterativeSystem {
    scene: Scene;
    init = true;
    initRoom = true;
    initSession = true;

    // array con tutti i dispositivi di input webxr
    inputSourceArray: WebXRInputSource[] = new Array<WebXRInputSource>();

    // array con tutti i motion controller webxr
    motionControllersArray: WebXRAbstractMotionController[] = new Array<WebXRAbstractMotionController>();

    // flag per l'aggiornamento dei controller webxr
    controllerUpdate: boolean = false;

    // menu che viene istanziato sul controller
    controllerMenu: TouchHolographicMenu;

    constructor(scene: Scene) {
        // entra nel loop del sistema solo se ha WebXrComponent
        super(new QueryBuilder().contains(WebXrComponent).build());
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {
        let defExp = entity.get(WebXrComponent).exp;

        // al primo giro setto i parametri della sessione e alcuni listener
        if (this.init) {
            const featureManager = defExp.baseExperience.featuresManager;

            // quando entro nella sessione webxr
            defExp.baseExperience.sessionManager.onXRSessionInit.add(() => {
                // aggiorno la telecamera dell'entità player
                entity.get(PlayerCameraComponent).camera = defExp.baseExperience.camera;


                if (defExp.baseExperience.sessionManager.sessionMode == "immersive-ar") {
                    // nascondo la mesh del terreno

                }
            });

            // ad ogni update della sessione webxr
            defExp.baseExperience.sessionManager.onXRFrameObservable.add(() => {


            });




            // abilito se possibile l'hand tracking
            let handTracking = featureManager.enableFeature(WebXRFeatureName.HAND_TRACKING, "latest", {
                xrInput: defExp.input,
            }, true, false);

            // abilito se possibile il walking locomotion
            featureManager.enableFeature(WebXRFeatureName.WALKING_LOCOMOTION, "latest", {
                locomotionTarget: entity.get(PlayerCameraComponent).camera
            }, true, false);


            // quando esco dalla sessione webxr
            defExp.baseExperience.sessionManager.onXRSessionEnded.add(() => {
                // aggiorno la telecamera dell'entità player
                entity.get(PlayerCameraComponent).camera = this.scene.getCameraById("cameraPlayer") as FreeCamera;
            });

            // listener per ottenere i riferimenti ai controller collegati
            defExp.input.onControllerAddedObservable.add(inputSource => {
                inputSource.onMotionControllerInitObservable.add(motionController => {
                    motionController.onModelLoadedObservable.add(mc => {
                        //console.log(inputSource);


                        this.inputSourceArray.push(inputSource);
                        this.motionControllersArray.push(motionController);

                        this.controllerUpdate = true;

                    })
                })
            });


            let objectMenu: TouchHolographicMenu;

            // listener per quando tocco un oggetto
            this.scene.onPointerObservable.add((pointerInfo) => {
                switch (pointerInfo?.type) {
                    case PointerEventTypes.POINTERDOWN:
                        if (pointerInfo.pickInfo && pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh) {

                            // se ci sono dei metadati
                            if (pointerInfo.pickInfo.pickedMesh.metadata != null) {

                                // ricavo l'entità ecs dai metadati
                                let entityPicked = this.engine.getEntityById(+pointerInfo.pickInfo.pickedMesh.metadata.id);

                                // se l'entità esiste
                                if (entityPicked != null) {
                                    if ((entityPicked.has(MeshArrayComponent) || entityPicked.has(MeshComponent)) && entityPicked.has(TransformComponent) && entityPicked.has(EntityMultiplayerComponent)) {

                                        // se l'entità è libera compare il menu
                                        if (entityPicked.get(EntityMultiplayerComponent).busy == undefined || entityPicked.get(EntityMultiplayerComponent).busy == Utils.room.sessionId) {

                                            let entityMesh;

                                            if (entityPicked.has(MeshArrayComponent)) {
                                                entityMesh = entityPicked.get(MeshArrayComponent).meshes[0];
                                            } else if (entityPicked.has(MeshComponent)) {
                                                entityMesh = entityPicked.get(MeshComponent).mesh;
                                            }


                                            // occupo l'entità
                                            if (entityPicked.get(EntityMultiplayerComponent).busy != Utils.room.sessionId) {
                                                entityPicked.get(EntityMultiplayerComponent).busy = "true";
                                            }

                                            // menu sull'oggetto
                                            if (GuiUtils.objectMenuShow == false) {
                                                // istanzio il menu
                                                objectMenu = GuiUtils.objectMenu(entityPicked, entityMesh);

                                                // lego il menu all'entità
                                                //objectMenu.linkToTransformNode(entityMesh);
                                                let objectMenuEntity = new Entity();
                                                objectMenuEntity.add(new MeshComponent(objectMenu.mesh, objectMenuEntity.id, false));
                                                objectMenuEntity.add(new TransformComponent(false, 1, 1, 1));
                                                objectMenuEntity.get(TransformComponent).scale_x = 0.1;
                                                objectMenuEntity.get(TransformComponent).scale_y = 0.1;
                                                objectMenuEntity.get(TransformComponent).scale_z = 0.1;

                                                let meshSize = Utils.getParentSize(entityMesh);

                                                let meshHeight = meshSize.y * 2;

                                                objectMenuEntity.add(new FollowComponent(entityPicked.get(TransformComponent), new Vector3(0, meshHeight, 0)));
                                                Utils.engineEcs.addEntity(objectMenuEntity);


                                                // sposto il menu NOT WORKING
                                                //objectMenu.mesh.position.y = entityMesh.getBoundingInfo().boundingBox.extendSize.y + (objectMenu.mesh.getBoundingInfo().boundingBox.extendSize.y / 2) + 0.3;
                                            } else {

                                            }

                                        } else {
                                            // l'entità è occupata quindi panel di warning
                                            GuiUtils.warningSlate("Warning", "This object is busy by another user.");

                                        }


                                    } else {
                                        console.log("ancora non ci siamo");
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


        // se sono in una stanza istanzio il menu che andrà sul controller
        if (this.initRoom && Utils.room != null) {
            this.controllerMenu = GuiUtils.controllerMenu(entity);

            this.initRoom = false;
        }

        // se devo aggiornare il menu sul controller
        if (this.controllerUpdate) {
            if (Utils.room != null) {
                let controllerMenuState = false;

                // giro tutti i controller collegati
                this.inputSourceArray.forEach(controller => {

                    // se è un controller sinistro e non è una mano
                    if (controller.motionController.handedness == 'left' && controller.inputSource.hand == undefined) {

                        // attacco il menu al controller
                        this.controllerMenu.mesh.parent = controller.grip;
                        this.controllerMenu.isVisible = true;
                        controllerMenuState = true;

                        // console.log("entrato nel controller");

                        const xr_ids = controller.motionController.getComponentIds();

                        // prendo la componente uguale al "x-button"
                        let xbuttonComponent = controller.motionController.getComponent(xr_ids[3]);

                        // setto il listener sul bottone x per aprire e chiudere il menu
                        xbuttonComponent.onButtonStateChangedObservable.add(() => {
                            if (xbuttonComponent.pressed) {
                                if (controllerMenuState) {
                                    this.controllerMenu.isVisible = false;
                                    controllerMenuState = false;
                                } else {
                                    this.controllerMenu.isVisible = true;
                                    controllerMenuState = true;
                                }

                            }
                        });
                    } else {
                        //controllerMenu.position = new Vector3(-0.1, 0, 0);
                    }


                });

            }
        }

    }
}