import { Entity, EntitySnapshot, IterativeSystem, Query, QueryBuilder } from "tick-knock";
import { MeshComponent } from "../components/MeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { KeyboardEventTypes, Scene, Vector3 } from "@babylonjs/core";
import { PhysicComponent } from "../components/PhysicComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { TransformComponent } from "../components/TransformComponent";
import { MeshArrayComponent } from "../components/MeshArrayComponent";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class TransformSystem extends IterativeSystem {
    scene: Scene;
    init = true;

    constructor(scene: Scene) {
        super(new Query((entity) => entity.hasComponent(TransformComponent) && (entity.hasComponent(MeshComponent) || entity.hasComponent(MeshArrayComponent))));
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {

        let transformComponent = entity.get(TransformComponent);
        let room = transformComponent.room;

        if (room != null) {
            if (this.init) {
                //quando si aggiunge un entità
                room.state.transform.onAdd(async (model) => {

                });

                room.state.transform.onRemove((model) => {

                });

                this.init = false;
            }
        }

        //copio la posizione dalla mesh
        if (entity.has(MeshComponent)) {
            let mesh = entity.get(MeshComponent).mesh;

            transformComponent.x = mesh.position.x;
            transformComponent.y = mesh.position.y;
            transformComponent.z = mesh.position.z;
            transformComponent.rotation_x = mesh.rotationQuaternion.x;
            transformComponent.rotation_y = mesh.rotationQuaternion.y;
            transformComponent.rotation_z = mesh.rotationQuaternion.z;
            transformComponent.rotation_w = mesh.rotationQuaternion.w;

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

        }



        //se l'entità non è stata mai inviata al server, invio il segnale di creazione
        if (false) {
            room.send("createTransformEntity", {
                id: transformComponent.id,
                x: transformComponent.x,
                y: transformComponent.y,
                z: transformComponent.z,
                rotation_x: transformComponent.rotation_x,
                rotation_y: transformComponent.rotation_y,
                rotation_z: transformComponent.rotation_z,
                rotation_w: transformComponent.rotation_w,
            });
        }

        //se l'entità ha bisogno di essere aggiornata, invio la modifica al server
        if (false) {
            room.send("updateTransformEntity", {
                id: transformComponent.id,
                x: transformComponent.x,
                y: transformComponent.y,
                z: transformComponent.z,
                rotation_x: transformComponent.rotation_x,
                rotation_y: transformComponent.rotation_y,
                rotation_z: transformComponent.rotation_z,
                rotation_w: transformComponent.rotation_w,
            });

        }

    }
}