import { Entity, EntitySnapshot, IterativeSystem, QueryBuilder } from "tick-knock";
import { MeshComponent } from "../components/MeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { FreeCamera, IPointerEvent, KeyboardEventTypes, PointerEventTypes, Scene, Vector3, WebXRState } from "@babylonjs/core";
import { PhysicComponent } from "../components/PhysicComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { WebXrComponent } from "../components/WebXrComponent";
import { MeshArrayComponent } from "../components/MeshArrayComponent";
import { UpdateMultiComponent } from "../components/UpdateMultiComponent";

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

    protected updateEntity(entity: Entity, dt: number): void {
        let defExp = entity.get(WebXrComponent).exp;

        if (this.init) {
            const featureManager = defExp.baseExperience.featuresManager;

            //quando entro nella sessione webxr
            defExp.baseExperience.sessionManager.onXRSessionInit.add(() => {
                //aggiorno la telecamera dell'entità player
                entity.get(PlayerCameraComponent).camera = defExp.baseExperience.camera;
            });


            //quando esco dalla sessione webxr
            defExp.baseExperience.sessionManager.onXRSessionEnded.add(() => {
                //aggiorno la telecamera dell'entità player
                entity.get(PlayerCameraComponent).camera = this.scene.getCameraById("cameraPlayer") as FreeCamera;
            });

            //tocco su un oggetto
            this.scene.onPointerObservable.add((pointerInfo) => {
                switch (pointerInfo.type) {
                    case PointerEventTypes.POINTERDOWN:
                        if (pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh) {
                            let entityPicked = this.engine.getEntityById(pointerInfo.pickInfo.pickedMesh.metadata.id as unknown as number);
                            if (entityPicked != null) {
                                if (entityPicked.has(MeshArrayComponent)) {
                                    entityPicked.get(MeshArrayComponent).meshes[0].position.x += 10;
                                    //entityPicked.get(UpdateMultiComponent).update = true;
                                }
                            } else {
                                console.log("nessuna entità");
                            }
                        }
                }
            });





            //let grab = false;

            /* this.scene.onPointerObservable.add((pointerInfo) => {
                console.log('POINTER DOWN', pointerInfo)
                if (pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh) {
                    // "Grab" it by attaching the picked mesh to the VR Controller
                    if (session.baseExperience.state === WebXRState.IN_XR) {
                        let pickedMesh = pointerInfo.pickInfo.pickedMesh;
                        let event = pointerInfo.event as IPointerEvent;
                        let xrInput = session.pointerSelection.getXRControllerByPointerId(event.pointerId);
                        let motionController = xrInput.motionController;

                        if (motionController) {
                            if (grab) {
                                //rimuovo l'oggetto preso 
                                motionController.rootMesh.removeChild(pickedMesh);
                                pickedMesh = null;
                                console.log("sto uscendo");
                                grab = false;
                            } else {
                                //prendo l'oggetto
                                pickedMesh.setParent(motionController.rootMesh);
                                console.log("ok");
                                grab = true;
                            }

                        }

                    } else {
                        // here is the non-xr support
                    }
                }
            }, PointerEventTypes.POINTERDOWN); */










            this.init = false;
        }

    }
}