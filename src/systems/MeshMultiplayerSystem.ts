import { Entity, EntitySnapshot, IterativeSystem, Query, QueryBuilder } from "tick-knock";
import { MeshComponent } from "../components/MeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { AbstractMesh, KeyboardEventTypes, Matrix, MeshBuilder, Scene, SceneLoader, Vector3 } from "@babylonjs/core";
import { PhysicComponent } from "../components/PhysicComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { TransformComponent } from "../components/TransformComponent";
import { MeshArrayComponent } from "../components/MeshArrayComponent";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { Room } from "colyseus.js";
import { MeshMultiComponent } from "../components/MeshMultiComponent";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class MeshMultiplayerSystem extends IterativeSystem {
    scene: Scene;
    room: Room;
    init = true;

    constructor(scene: Scene, room: Room) {
        super(new Query((entity) => (entity.hasComponent(EntityMultiplayerComponent))));
        this.scene = scene;
        this.room = room;
    }

    async importModel(baseUrl: string, modelName: string): Promise<AbstractMesh[]> {

        let { meshes } = await SceneLoader.ImportMeshAsync(
            null,
            baseUrl,
            modelName,
            this.scene
        );

        return meshes;
    }

    protected async updateEntity(entity: Entity, dt: number): Promise<void> {

        let multiComponent = entity.get(EntityMultiplayerComponent);

        if (this.room != null) {
            if (this.init) {
                //quando si aggiunge un entità
                this.room.state.transform.onAdd(async (entityServer) => {
                    if (entityServer.id == multiComponent.serverId) {
                        //gli id coincidono quindi questa entità ha anche la componente di mesh
                        entity.add(MeshMultiComponent);
                        entity.get(MeshMultiComponent).id = entityServer.id;
                        entity.get(MeshMultiComponent).name = entityServer.name;
                        entity.get(MeshMultiComponent).location = entityServer.location;
                    }

                });

                this.room.state.transform.onRemove((entity) => {


                });

                this.init = false;
            }
        }

        //istanzio la mesh
        if (entity.has(MeshMultiComponent)) {
            let meshMultiComponent = entity.get(MeshMultiComponent);

            if (meshMultiComponent.render == false) {

                if (meshMultiComponent.location == "local" && meshMultiComponent.name == "sphere") {
                    entity.add(new MeshComponent(MeshBuilder.CreateSphere('sphere', { diameter: 1 }, this.scene), entity.id));
                    entity.get(MeshComponent).mesh.setPivotMatrix(Matrix.Translation(0, 0.5, 0), false);
                    entity.get(MeshComponent).mesh.isPickable = false;
                } else {
                    entity.add(new MeshArrayComponent(await this.importModel(meshMultiComponent.location, meshMultiComponent.name), entity.id));
                }

                meshMultiComponent.render = true;
            }


        }


        if (entity.has(MeshMultiComponent) && entity.has(EntityMultiplayerComponent)) {
            let meshMultiComponent = entity.get(MeshMultiComponent);
            let entityServer = entity.get(EntityMultiplayerComponent);

            //se l'entità non è stata mai inviata al server, invio il segnale di creazione
            if (meshMultiComponent.id == null) {
                this.room.send("attachMeshComponent", {
                    id: entityServer.serverId,
                    location: meshMultiComponent.location,
                    name: meshMultiComponent.name,
                });

                meshMultiComponent.id = entityServer.serverId;
            }

        }

    }
}