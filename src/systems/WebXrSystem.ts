import { Entity, EntitySnapshot, IterativeSystem, QueryBuilder } from "tick-knock";
import { MeshComponent } from "../components/MeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { IPointerEvent, KeyboardEventTypes, PointerEventTypes, Scene, Vector3, WebXRState } from "@babylonjs/core";
import { PhysicComponent } from "../components/PhysicComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { WebXrComponent } from "../components/WebXrComponent";

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
        let session = entity.get(WebXrComponent).exp;

        if (this.init) {
            const featureManager = session.baseExperience.featuresManager;
            let grab = false;

            this.scene.onPointerObservable.add((pointerInfo) => {
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
            }, PointerEventTypes.POINTERDOWN);










            this.init = false;
        }

    }
}