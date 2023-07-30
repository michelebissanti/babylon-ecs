import { Entity, EntitySnapshot, IterativeSystem, Query, QueryBuilder } from "tick-knock";
import { MeshComponent } from "../components/MeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { KeyboardEventTypes, Scene, Vector3 } from "@babylonjs/core";
import { PhysicComponent } from "../components/PhysicComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { TransformComponent } from "../components/TransformComponent";
import { MeshArrayComponent } from "../components/MeshArrayComponent";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { Room } from "colyseus.js";
import { ClientComponent } from "../components/ClientComponent";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class TransformSystem extends IterativeSystem {
    scene: Scene;
    room: Room;
    init = true;
    private savedEntities = new Map<string, number>();

    constructor(scene: Scene) {
        super(new Query((entity) => (entity.hasComponent(ClientComponent) || entity.hasComponent(EntityMultiplayerComponent))));
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {
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
                //quando si aggiunge un componente di transform
                this.room.state.transformComponents.onAdd(async (entityServer, client) => {

                    //cercare se esiste un entità con quel server id
                    if (this.savedEntities.has(entityServer.id)) {
                        let localEntity = this.engine.getEntityById(this.savedEntities.get(entityServer.id));
                        //gli id coincidono quindi questa entità ha anche la componente di transform
                        localEntity.add(new TransformComponent());
                        localEntity.get(TransformComponent).id = entityServer.id;

                        if (localEntity.has(MeshArrayComponent)) {
                            let meshes = localEntity.get(MeshArrayComponent).meshes;

                            meshes[0].position.set(entityServer.x, entityServer.y, entityServer.z);
                            meshes[0].rotationQuaternion.set(entityServer.rotation_x, entityServer.rotation_y, entityServer.rotation_z, entityServer.rotation_w);
                            meshes[0].scaling.set(entityServer.scale_x, entityServer.scale_y, entityServer.scale_z);
                        }

                        if (localEntity.has(MeshComponent)) {
                            let mesh = localEntity.get(MeshComponent).mesh;

                            mesh.position.set(entityServer.x, entityServer.y, entityServer.z);
                            mesh.rotation.set(entityServer.rotation_x, entityServer.rotation_y, entityServer.rotation_z);
                            mesh.scaling.set(entityServer.scale_x, entityServer.scale_y, entityServer.scale_z);
                        }

                        entityServer.onChange(() => {
                            //aggiorno il modello prendendo la sua entità
                            let localEntity = this.engine.getEntityById(this.savedEntities.get(entityServer.id));

                            //aggiorno solo se non sono io a mandare l'update
                            if (entityServer.sender != this.room.sessionId) {

                                if (localEntity.has(MeshArrayComponent)) {
                                    let meshes = localEntity.get(MeshArrayComponent).meshes;

                                    meshes[0].position.set(entityServer.x, entityServer.y, entityServer.z);
                                    meshes[0].rotationQuaternion.set(entityServer.rotation_x, entityServer.rotation_y, entityServer.rotation_z, entityServer.rotation_w);
                                    meshes[0].scaling.set(entityServer.scale_x, entityServer.scale_y, entityServer.scale_z);
                                }

                                if (localEntity.has(MeshComponent)) {
                                    let mesh = localEntity.get(MeshComponent).mesh;

                                    mesh.position.set(entityServer.x, entityServer.y, entityServer.z);
                                    mesh.rotation.set(entityServer.rotation_x, entityServer.rotation_y, entityServer.rotation_z);
                                    mesh.scaling.set(entityServer.scale_x, entityServer.scale_y, entityServer.scale_z);
                                }

                            }


                        });
                    }

                });

                this.room.state.transformComponents.onRemove((entity) => {

                });

                this.init = false;
            }


            //copio la posizione dalla mesh nel caso di mesh component
            if (entity.has(MeshComponent) && entity.has(TransformComponent)) {

                let transformComponent = entity.get(TransformComponent);
                let mesh = entity.get(MeshComponent).mesh;

                transformComponent.x = mesh.position.x;
                transformComponent.y = mesh.position.y;
                transformComponent.z = mesh.position.z;
                transformComponent.rotation_x = mesh.rotation.x;
                transformComponent.rotation_y = mesh.rotation.y;
                transformComponent.rotation_z = mesh.rotation.z;
                transformComponent.rotation_w = 0;
                transformComponent.scale_x = mesh.scaling.x;
                transformComponent.scale_y = mesh.scaling.y;
                transformComponent.scale_z = mesh.scaling.z;

            }

            //copia la posizione della mesh nel caso di array di mesh
            if (entity.has(MeshArrayComponent) && entity.has(TransformComponent)) {
                let transformComponent = entity.get(TransformComponent);
                let meshes = entity.get(MeshArrayComponent).meshes;
                let mesh = meshes[0];

                transformComponent.x = mesh.position.x;
                transformComponent.y = mesh.position.y;
                transformComponent.z = mesh.position.z;
                transformComponent.rotation_x = mesh.rotationQuaternion.x;
                transformComponent.rotation_y = mesh.rotationQuaternion.y;
                transformComponent.rotation_z = mesh.rotationQuaternion.z;
                transformComponent.rotation_w = mesh.rotationQuaternion.w;
                transformComponent.scale_x = mesh.scaling.x;
                transformComponent.scale_y = mesh.scaling.y;
                transformComponent.scale_z = mesh.scaling.z;
            }



            if (entity.has(TransformComponent) && entity.has(EntityMultiplayerComponent)) {
                let transformComponent = entity.get(TransformComponent);
                let entityServer = entity.get(EntityMultiplayerComponent);

                //se l'entità non è stata mai inviata al server, invio il segnale di creazione
                if (transformComponent.id == undefined && entityServer.serverId != undefined) {
                    transformComponent.id = entityServer.serverId;

                    this.room.send("attachTransformComponent", {
                        id: "" + entityServer.serverId,
                        x: transformComponent.x,
                        y: transformComponent.y,
                        z: transformComponent.z,
                        rotation_x: transformComponent.rotation_x,
                        rotation_y: transformComponent.rotation_y,
                        rotation_z: transformComponent.rotation_z,
                        rotation_w: transformComponent.rotation_w,
                        scale_x: transformComponent.scale_x,
                        scale_y: transformComponent.scale_y,
                        scale_z: transformComponent.scale_z,
                    });


                }

                //se l'entità ha bisogno di essere aggiornata, invio la modifica al server
                if (transformComponent.update && transformComponent.id != undefined) {
                    this.room.send("updateTransformComponent", {
                        id: "" + transformComponent.id,
                        x: transformComponent.x,
                        y: transformComponent.y,
                        z: transformComponent.z,
                        rotation_x: transformComponent.rotation_x,
                        rotation_y: transformComponent.rotation_y,
                        rotation_z: transformComponent.rotation_z,
                        rotation_w: transformComponent.rotation_w,
                        scale_x: transformComponent.scale_x,
                        scale_y: transformComponent.scale_y,
                        scale_z: transformComponent.scale_z,
                    });

                }

            }

        }
    }
}