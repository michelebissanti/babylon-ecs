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

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class TransformSystem extends IterativeSystem {
    scene: Scene;
    room: Room;
    init = true;

    constructor(scene: Scene, room: Room) {
        super(new Query((entity) => (entity.hasComponent(EntityMultiplayerComponent))));
        this.scene = scene;
        this.room = room;
    }

    protected updateEntity(entity: Entity, dt: number): void {

        let multiComponent = entity.get(EntityMultiplayerComponent);

        if (this.room != null) {
            if (this.init) {
                //quando si aggiunge un entità
                this.room.state.transform.onAdd(async (entityServer) => {
                    if (entityServer.id == multiComponent.serverId) {
                        //gli id coincidono quindi questa entità ha anche la componente di transform
                        entity.add(TransformComponent);
                        entity.get(TransformComponent).id = entityServer.id;

                        if (entity.has(MeshArrayComponent)) {
                            let meshes = entity.get(MeshArrayComponent).meshes;

                            meshes[0].position.set(entityServer.x, entityServer.y, entityServer.z);
                            meshes[0].rotationQuaternion.set(entityServer.rotation_x, entityServer.rotation_y, entityServer.rotation_z, entityServer.rotation_w);
                            meshes[0].scaling.set(entityServer.scale_x, entityServer.scale_y, entityServer.scale_z);
                        }

                        if (entity.has(MeshComponent)) {
                            let mesh = entity.get(MeshComponent).mesh;

                            mesh[0].position.set(entityServer.x, entityServer.y, entityServer.z);
                            mesh[0].rotationQuaternion.set(entityServer.rotation_x, entityServer.rotation_y, entityServer.rotation_z, entityServer.rotation_w);
                            mesh[0].scaling.set(entityServer.scale_x, entityServer.scale_y, entityServer.scale_z);
                        }
                    }

                });

                this.room.state.transform.onRemove((entity) => {

                });

                this.init = false;
            }
        }

        //copio la posizione dalla mesh
        if (entity.has(MeshComponent) && entity.has(TransformComponent)) {
            let transformComponent = entity.get(TransformComponent);
            let mesh = entity.get(MeshComponent).mesh;

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
            if (transformComponent.id == undefined) {
                this.room.send("attachTransformComponent", {
                    id: entityServer.serverId,
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

                transformComponent.id = entityServer.serverId;
            }

            //se l'entità ha bisogno di essere aggiornata, invio la modifica al server
            if (transformComponent.update && transformComponent.id != undefined) {
                this.room.send("updateTransformComponent", {
                    id: transformComponent.id,
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