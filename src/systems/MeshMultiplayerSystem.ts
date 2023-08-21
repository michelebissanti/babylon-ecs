import { Entity, EntitySnapshot, IterativeSystem, Query, QueryBuilder } from "tick-knock";
import { MeshComponent } from "../components/MeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { AbstractMesh, Color3, KeyboardEventTypes, Matrix, Mesh, MeshBuilder, Scene, SceneLoader, StandardMaterial, Vector3, VideoTexture } from "@babylonjs/core";
import { PhysicComponent } from "../components/PhysicComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { TransformComponent } from "../components/TransformComponent";
import { MeshArrayComponent } from "../components/MeshArrayComponent";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { Room } from "colyseus.js";
import { MeshMultiComponent } from "../components/MeshMultiComponent";
import { ClientComponent } from "../components/ClientComponent";
import { Utils } from "../utils";
import { AnimationComponent } from "../components/AnimationComponent";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class MeshMultiplayerSystem extends IterativeSystem {
    scene: Scene;
    init = true;

    constructor(scene: Scene) {
        super(new Query((entity) => (entity.hasComponent(MeshMultiComponent) || entity.hasComponent(EntityMultiplayerComponent))));
        this.scene = scene;
    }

    protected async updateEntity(entity: Entity, dt: number): Promise<void> {

        //istanzio la mesh se necessario
        if (entity.has(MeshMultiComponent)) {
            let meshMultiComponent = entity.get(MeshMultiComponent);

            if (meshMultiComponent.render == false) {
                meshMultiComponent.render = true;

                if (meshMultiComponent.location == "local" && meshMultiComponent.name == "sphere") {
                    entity.add(new MeshComponent(MeshBuilder.CreateSphere('sphere ' + meshMultiComponent.id, { diameter: 1 }, this.scene), entity.id));
                    entity.get(MeshComponent).mesh.setPivotMatrix(Matrix.Translation(0, 0.5, 0), false);
                    entity.get(MeshComponent).mesh.isPickable = false;
                } else if (meshMultiComponent.location == "video") {
                    let plane = MeshBuilder.CreatePlane("video", { height: 5.4762, width: 7.3967, sideOrientation: Mesh.DOUBLESIDE });
                    plane.isPickable = true;
                    let videoMat = new StandardMaterial("videoMat");
                    let videoTex = new VideoTexture("videoTex", meshMultiComponent.location + "/" + meshMultiComponent.name, this.scene);

                    videoMat.diffuseTexture = videoTex;
                    videoMat.roughness = 1;
                    videoMat.emissiveColor = Color3.White();
                    plane.material = videoMat;

                    entity.add(new MeshComponent(plane, entity.id, false));
                    entity.get(MeshComponent).mesh.setPivotMatrix(Matrix.Translation(3.69835, 2.7381, 0), false);


                } else {

                    let { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
                        null,
                        meshMultiComponent.location,
                        meshMultiComponent.name
                    );

                    entity.add(new MeshArrayComponent(meshes, entity.id));

                    if (animationGroups.length != 0) {
                        entity.add(new AnimationComponent(animationGroups));
                        animationGroups[0].stop();
                        entity.get(AnimationComponent).currentFrame = 0;
                        entity.get(AnimationComponent).state = "pause";
                    }

                    //se sono un player non posso interagire con la mesh
                    if (entity.get(EntityMultiplayerComponent).isPlayer) {
                        let meshes = entity.get(MeshArrayComponent).meshes;

                        meshes.forEach((mesh) => {
                            mesh.isPickable = false;
                        });
                    }


                }


            }
        }

        if (Utils.room != null) {
            if (entity.has(MeshMultiComponent) && entity.has(EntityMultiplayerComponent)) {
                let meshMultiComponent = entity.get(MeshMultiComponent);
                let entityServer = entity.get(EntityMultiplayerComponent);

                //se l'entità non è stata mai inviata al server, invio il segnale di creazione
                if (meshMultiComponent.id == undefined && entityServer.serverId != undefined) {
                    Utils.room.send("attachMeshComponent", {
                        id: "" + entityServer.serverId,
                        location: meshMultiComponent.location,
                        name: meshMultiComponent.name,
                    });

                    meshMultiComponent.id = entityServer.serverId;
                }
            }
        }

    }
}