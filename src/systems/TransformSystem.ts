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
import { Utils } from "../utils";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class TransformSystem extends IterativeSystem {
    scene: Scene;
    init = true;

    constructor(scene: Scene) {
        super(new Query((entity) => entity.hasComponent(TransformComponent) || entity.hasComponent(EntityMultiplayerComponent)));
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {

        if (entity.has(TransformComponent)) {
            let transformComponent = entity.get(TransformComponent);
            if (transformComponent.revertLogic == false) {
                if (entity.has(MeshComponent)) {
                    let mesh = entity.get(MeshComponent).mesh;

                    mesh.position.x = transformComponent.x;
                    mesh.position.y = transformComponent.y;
                    mesh.position.z = transformComponent.z;
                    mesh.rotation.x = transformComponent.rotation_x;
                    mesh.rotation.y = transformComponent.rotation_y;
                    mesh.rotation.z = transformComponent.rotation_z;
                    //mesh.rotation.w = transformComponent.rotation_w;
                    mesh.scaling.x = transformComponent.scale_x;
                    mesh.scaling.y = transformComponent.scale_y;
                    mesh.scaling.z = transformComponent.scale_z;
                }

                if (entity.has(MeshArrayComponent)) {
                    let meshes = entity.get(MeshArrayComponent).meshes;
                    let mesh = meshes[0];

                    mesh.position.x = transformComponent.x;
                    mesh.position.y = transformComponent.y;
                    mesh.position.z = transformComponent.z;
                    mesh.rotationQuaternion.x = transformComponent.rotation_x;
                    mesh.rotationQuaternion.y = transformComponent.rotation_y;
                    mesh.rotationQuaternion.z = transformComponent.rotation_z;
                    mesh.rotationQuaternion.w = transformComponent.rotation_w;
                    mesh.scaling.x = transformComponent.scale_x;
                    mesh.scaling.y = transformComponent.scale_y;
                    mesh.scaling.z = transformComponent.scale_z;
                }
            } else {
                if (entity.has(MeshComponent)) {
                    let mesh = entity.get(MeshComponent).mesh;

                    transformComponent.x = mesh.position.x;
                    transformComponent.y = mesh.position.y;
                    transformComponent.z = mesh.position.z;
                    transformComponent.rotation_x = mesh.rotation.x;
                    transformComponent.rotation_y = mesh.rotation.y;
                    transformComponent.rotation_z = mesh.rotation.z;
                    //transformComponent.rotation_w = mesh.rotation.w;
                    transformComponent.scale_x = mesh.scaling.x;
                    transformComponent.scale_y = mesh.scaling.y;
                    transformComponent.scale_z = mesh.scaling.z;
                }

                if (entity.has(MeshArrayComponent)) {
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

            }
        }



        if (Utils.room != null) {
            if (entity.has(TransformComponent) && entity.has(EntityMultiplayerComponent)) {
                let transformComponent = entity.get(TransformComponent);
                let entityServer = entity.get(EntityMultiplayerComponent);

                //se l'entità non è stata mai inviata al server, invio il segnale di creazione
                if (transformComponent.id == undefined && entityServer.serverId != undefined) {

                    Utils.room.send("attachTransformComponent", {
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

                    transformComponent.id = entityServer.serverId;
                }

                //se l'entità ha bisogno di essere aggiornata, invio la modifica al server
                if (transformComponent.update && transformComponent.id != undefined) {
                    Utils.room.send("updateTransformComponent", {
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