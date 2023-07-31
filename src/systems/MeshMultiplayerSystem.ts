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
import { ClientComponent } from "../components/ClientComponent";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class MeshMultiplayerSystem extends IterativeSystem {
    scene: Scene;
    room: Room;
    init = true;
    private savedEntities = new Map<string, number>();

    constructor(scene: Scene) {
        super(new Query((entity) => (entity.hasComponent(ClientComponent) || entity.hasComponent(EntityMultiplayerComponent))));
        this.scene = scene;
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
        if (entity.has(EntityMultiplayerComponent)) {
            let multiComponent = entity.get(EntityMultiplayerComponent);

            if (multiComponent.serverId != undefined && !(this.savedEntities.has(multiComponent.serverId))) {
                this.savedEntities.set(multiComponent.serverId, entity.id);
            }
        }

        if (entity.has(ClientComponent)) {
            this.room = entity.get(ClientComponent).room;
        }

        if (this.room != null) {
            if (this.init) {
                //quando si aggiunge un componente di mesh
                this.room.state.meshComponents.onAdd(async (entityServer) => {

                    if (this.savedEntities.has(entityServer.id)) {
                        console.log("ciao");
                        let localEntity = this.engine.getEntityById(this.savedEntities.get(entityServer.id));
                        //gli id coincidono quindi questa entità ha anche la componente di transform
                        localEntity.add(new MeshMultiComponent(entityServer.location, entityServer.name, false));

                        //istanzio la mesh qui
                        //localEntity.add(new MeshArrayComponent(await this.importModel(entityServer.location, entityServer.name), localEntity.id));

                        entityServer.onChange(async () => {
                            //aggiorno il modello prendendo la sua entità
                            let localEntity = this.engine.getEntityById(this.savedEntities.get(entityServer.id));

                            //aggiorno solo se non sono io a mandare l'update
                            if (entityServer.sender != this.room.sessionId) {
                                localEntity.get(MeshMultiComponent).location = entityServer.location;
                                localEntity.get(MeshMultiComponent).name = entityServer.name;

                                //aggiorno e istanzio le modifiche
                                if (localEntity.has(MeshArrayComponent)) {
                                    localEntity.get(MeshArrayComponent).meshes[0].dispose();

                                    localEntity.get(MeshArrayComponent).meshes = await this.importModel(entityServer.location, entityServer.name);
                                }

                            }

                        });
                    }

                });

                /* this.room.state.transform.onRemove((entity) => {


                }); */

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
            if (meshMultiComponent.id == undefined && entityServer.serverId != undefined) {
                this.room.send("attachMeshComponent", {
                    id: "" + entityServer.serverId,
                    location: meshMultiComponent.location,
                    name: meshMultiComponent.name,
                });

                meshMultiComponent.id = entityServer.serverId;
            }

        }

    }
}