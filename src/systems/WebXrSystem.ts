import { FreeCamera, Mesh, MeshBuilder, PointerEventTypes, Scene, Vector3, WebXRAbstractMotionController, WebXRFeatureName, WebXRInputSource } from "@babylonjs/core";
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

// WebXrSystem: gestisce l'entità che possiede WebXrComponent
// dovrebbe gestire solo il player locale nelle sue interazioni con la webxr
export class WebXrSystem extends IterativeSystem {
    scene: Scene;
    init = true;
    initRoom = true;
    initSession = true;
    followerObj: Mesh;
    usedController: WebXRInputSource;
    sphereController: Mesh;
    lastDt = 0;

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
        this.lastDt += dt;
        let defExp = entity.get(WebXrComponent).exp;

        // al primo giro setto i parametri della sessione e alcuni listener
        if (this.init) {
            const featureManager = defExp.baseExperience.featuresManager;

            // quando entro nella sessione webxr
            defExp.baseExperience.sessionManager.onXRSessionInit.add(() => {
                // aggiorno questa variabile di utilità
                Utils.inWebXR = true;

                // aggiorno la telecamera dell'entità player
                entity.get(PlayerCameraComponent).camera = defExp.baseExperience.camera;

                if (GuiUtils.nearMainMenu != null) {
                    // nascondo il menu fluttuante utile in ambiente desktop
                    GuiUtils.nearMainMenu.isVisible = false;
                }


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
                // aggiorno questa variabile di utilità
                Utils.inWebXR = false;

                // aggiorno la telecamera dell'entità player
                entity.get(PlayerCameraComponent).camera = this.scene.getCameraById("cameraPlayer") as FreeCamera;

                // faccio tornare visibile il menu fluttuante
                if (GuiUtils.nearMainMenu != null && GuiUtils.objectMenuShow == false) {
                    GuiUtils.nearMainMenu.isVisible = true;
                }

            });

            // listener per ottenere i riferimenti ai controller collegati
            defExp.input.onControllerAddedObservable.add(inputSource => {
                this.inputSourceArray.push(inputSource);
                this.controllerUpdate = true;

                /* inputSource.onMotionControllerInitObservable.add(motionController => {
                    motionController.onModelLoadedObservable.add(mc => {
                        this.motionControllersArray.push(motionController);
                    })
                }) */
            });

            // listener per rimuovere i riferimenti ai controller collegati
            defExp.input.onControllerRemovedObservable.add(inputSource => {
                let index = this.inputSourceArray.indexOf(inputSource);
                this.inputSourceArray[index] = null;

                if (this.controllerMenu != null) {
                    this.controllerMenu.dispose();
                }

            });


            let objectMenu: TouchHolographicMenu;
            // listener per quando tocco un oggetto
            this.scene.onPointerObservable.add((pointerInfo) => {
                switch (pointerInfo?.type) {
                    case PointerEventTypes.POINTERDOWN:
                        if (GuiUtils.objectMenuShow == false && pointerInfo.pickInfo && pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh) {

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
                                            } else {

                                            }

                                        } else {
                                            // l'entità è occupata quindi panel di warning
                                            GuiUtils.warningSlate("Attenzione", "Questo oggetto è occupato da un altro utente.");
                                        }


                                    } else {
                                        console.log("ancora non ci siamo");
                                    }
                                } else {
                                    console.log("nessuna entità");
                                }


                            };

                        }
                        break;
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
                let found = false;
                let controllerMenuState = false;
                this.controllerUpdate = false;

                // giro tutti i controller collegati
                this.inputSourceArray.forEach(controller => {

                    // se è un controller sinistro e non è una mano
                    if (controller?.motionController?.handedness == 'left' && controller.inputSource.hand == null) {

                        this.usedController = controller;

                        this.controllerMenu.isVisible = true;

                        this.followerObj = new Mesh("followerObj");

                        this.sphereController = MeshBuilder.CreateSphere("controllerSphere", { diameter: 0.4 });

                        this.sphereController.isVisible = false;


                        if (this.followerObj != null && this.sphereController != null && this.controllerMenu != null) {

                            this.sphereController.parent = this.followerObj;

                            this.controllerMenu.mesh.parent = this.followerObj;
                            this.controllerMenu.mesh.position = new Vector3(0.1, 0, 0.15);

                            this.controllerMenu.mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;

                        }

                        found = true;

                    }




                });

                // posiziono il menu sul controller destro se non sono riuscito a farlo sul sinistro
                if (found == false) {

                    // giro tutti i controller collegati
                    this.inputSourceArray.forEach(controller => {

                        // se è un controller destro e non è una mano
                        if (controller?.motionController?.handedness == 'right' && controller.inputSource.hand == null) {

                            this.usedController = controller;

                            this.controllerMenu.isVisible = true;

                            this.followerObj = new Mesh("followerObj");

                            this.sphereController = MeshBuilder.CreateSphere("controllerSphere", { diameter: 0.4 });

                            this.sphereController.isVisible = false;


                            if (this.followerObj != null) {

                                this.sphereController.parent = this.followerObj;

                                this.controllerMenu.mesh.parent = this.followerObj;
                                this.controllerMenu.mesh.position = new Vector3(0.1, 0, 0.15);

                                this.controllerMenu.mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;

                            }

                            found = true;

                        }
                    });


                }

            }
        }


        // comportamento per gestire il menu sul controller
        if (this.followerObj != null && this.usedController != null) {
            //il menu è figlio di questo oggetto nullo che segue la posizione del controller
            this.followerObj.position = this.usedController.pointer.position;

            // controllo che l'utente stia guardando il controller
            if (this.lastDt >= 0.5) {
                let ray = Utils.scene.activeCamera.getForwardRay(20);

                let isWatching = ray.intersectsMesh(this.sphereController).hit;

                // vecchia condizione
                //this.usedController.pointer.rotationQuaternion.toEulerAngles().y <= 0.5 && this.usedController.pointer.rotationQuaternion.toEulerAngles().y >= -0.5

                if (this.controllerMenu != null && isWatching) {
                    // se l'utente sta guardando il controller allora rendo visibile il menu
                    this.controllerMenu.isVisible = true;
                } else {
                    this.controllerMenu.isVisible = false;
                }

                this.lastDt = 0;
            }


        }

    }
}