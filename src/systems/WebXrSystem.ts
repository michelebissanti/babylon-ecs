import { Entity, EntitySnapshot, IterativeSystem, QueryBuilder } from "tick-knock";
import { MeshComponent } from "../components/MeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { FreeCamera, IPointerEvent, KeyboardEventTypes, PointerEventTypes, Scene, Vector3, WebXRState, Node, WebXRFeatureName, BoundingBoxGizmo, Mesh, UtilityLayerRenderer, Color3, SixDofDragBehavior, MultiPointerScaleBehavior, TransformNode, AttachToBoxBehavior, AbstractMesh } from "@babylonjs/core";
import { PlanePanel, HolographicButton } from "@babylonjs/gui";
import { PhysicComponent } from "../components/PhysicComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { WebXrComponent } from "../components/WebXrComponent";
import { MeshArrayComponent } from "../components/MeshArrayComponent";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { Gui3dComponent } from "../components/Gui3dComponent";
import { TransformComponent } from "../components/TransformComponent";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class WebXrSystem extends IterativeSystem {
    scene: Scene;
    init = true;
    gui: Entity;

    constructor(scene: Scene, gui: Entity) {
        super(new QueryBuilder().contains(WebXrComponent).build());
        this.scene = scene;
        this.gui = gui;
    }

    public bubbleParent(mesh: Node): Node {
        var result = mesh;
        while (result.parent)
            result = result.parent as Node;
        return result;
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
                                            this.gui.get(Gui3dComponent).manager.addControl(panel);
                                            panel.linkToTransformNode(appBar);

                                            var button = new HolographicButton("");
                                            panel.addControl(button);
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

    }
}