import { AbstractMesh, Scene } from "@babylonjs/core";
import { Entity, IterativeSystem, Query } from "tick-knock";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { MeshArrayComponent } from "../components/MeshArrayComponent";
import { MeshComponent } from "../components/MeshComponent";
import { TransformComponent } from "../components/TransformComponent";
import { Utils } from "../utils";

// TransformSystem: gestisce tutte le entità che possiedono un TransformComponent
// in generale si occupa di sincronizzare il transform con il server
export class TransformSystem extends IterativeSystem {
    scene: Scene;

    constructor(scene: Scene) {
        //entra nel loop del sistema solo se ha TransformComponent o EntityMultiplayerComponent
        super(new Query((entity) => entity.hasComponent(TransformComponent) || entity.hasComponent(EntityMultiplayerComponent)));
        this.scene = scene;
    }

    private static meshEqualsTransform(mesh: AbstractMesh, transformComponent: TransformComponent): void {
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

    private static transformEqualsMesh(mesh: AbstractMesh, transformComponent: TransformComponent): void {
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

    protected updateEntity(entity: Entity, dt: number): void {

        if (entity.has(TransformComponent)) {
            let transformComponent = entity.get(TransformComponent);

            // se l'entità ha settato il componente con la logica normale
            // aggiorno la trasformata della mesh con le informazioni derivate dal TransformComponent
            if (!(transformComponent.revertLogic)) {

                //caso con MeshComponent
                if (entity.has(MeshComponent)) {

                    let mesh: AbstractMesh = entity.get(MeshComponent).mesh;

                    if (mesh.rotationQuaternion == null) {
                        mesh.rotationQuaternion = mesh.rotation.toQuaternion();
                    }

                    TransformSystem.meshEqualsTransform(mesh, transformComponent);
                }

                //caso con MeshArrayComponent
                if (entity.has(MeshArrayComponent)) {
                    let meshes = entity.get(MeshArrayComponent).meshes;
                    let mesh = meshes[0];

                    if (mesh.rotationQuaternion == null) {
                        mesh.rotationQuaternion = mesh.rotation.toQuaternion();
                    }

                    TransformSystem.meshEqualsTransform(mesh, transformComponent);
                }
            } else {
                // se l'entità ha settato il componente con la logica inversa
                // aggiorno il componente con le informazioni date dalla mesh

                //caso con MeshComponent
                if (entity.has(MeshComponent)) {
                    let mesh = entity.get(MeshComponent).mesh;

                    if (mesh.rotationQuaternion == null) {
                        mesh.rotationQuaternion = mesh.rotation.toQuaternion();
                    }

                    TransformSystem.transformEqualsMesh(mesh, transformComponent);
                }

                //caso con MeshArrayComponent
                if (entity.has(MeshArrayComponent)) {
                    let meshes = entity.get(MeshArrayComponent).meshes;
                    let mesh = meshes[0];

                    if (mesh.rotationQuaternion == null) {
                        mesh.rotationQuaternion = mesh.rotation.toQuaternion();
                    }

                    TransformSystem.transformEqualsMesh(mesh, transformComponent);
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