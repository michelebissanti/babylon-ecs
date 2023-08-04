import { Entity, EntitySnapshot, IterativeSystem, QueryBuilder } from "tick-knock";
import { MeshComponent } from "../components/MeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { KeyboardEventTypes, Mesh, Scene, Vector3 } from "@babylonjs/core";
import { PhysicComponent } from "../components/PhysicComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { TransformComponent } from "../components/TransformComponent";
import { MeshArrayComponent } from "../components/MeshArrayComponent";
import { Utils } from "../utils";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class MovementSystem extends IterativeSystem {
    scene: Scene;
    init = true;
    private vel = { x: 0, y: 0, z: 0 };

    constructor(scene: Scene) {
        super(new QueryBuilder().contains(TransformComponent).contains(PlayerCameraComponent).build())
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {

        let cameraComponent = entity.get(PlayerCameraComponent);
        let transformPlayer = entity.get(TransformComponent);


        if (cameraComponent.firstPerson) {
            var camera = cameraComponent.camera;
            if (this.init) {
                camera.attachControl();
                //inserisco il controllo tramite wasd
                camera.keysUp.push(87);
                camera.keysDown.push(83);
                camera.keysLeft.push(65);
                camera.keysRight.push(68);

                camera.applyGravity = true;
                camera.checkCollisions = true;

                camera.ellipsoid = new Vector3(1, 0.83, 1);

                camera.minZ = 0.01;
                camera.speed = 0.5;
                camera.angularSensibility = 4000;
                this.init = false;
            }


            //setto la componente in base alla camera
            transformPlayer.x = camera.position.x;
            transformPlayer.y = 0;
            transformPlayer.z = camera.position.z;

            let cameraQuaternion = Utils.euler(0, camera.rotation.y, 0);

            transformPlayer.rotation_x = cameraQuaternion.x;
            transformPlayer.rotation_y = cameraQuaternion.y;
            transformPlayer.rotation_z = cameraQuaternion.z;
            transformPlayer.rotation_w = cameraQuaternion.w;

            //andrebbe fatto solo una volta questo
            if (entity.has(MeshArrayComponent)) {
                let meshComponent = entity.get(MeshArrayComponent).meshes;

                meshComponent.map(mesh => {
                    mesh.isPickable = false;
                    mesh.visibility = 0;
                });
            }

        } else {
            //sono in terza persona

            this.scene.onKeyboardObservable.add((kbInfo) => {
                switch (kbInfo.type) {
                    case KeyboardEventTypes.KEYDOWN:
                        if (kbInfo.event.key == 'd') {
                            this.vel.x = 10;
                        }

                        if (kbInfo.event.key == 'a') {
                            this.vel.x = -10;
                        }

                        if (kbInfo.event.key == 'w') {
                            this.vel.z = 10;
                        }

                        if (kbInfo.event.key == 's') {
                            this.vel.z = -10;
                        }

                        break;
                    case KeyboardEventTypes.KEYUP:
                        if (kbInfo.event.key == 'd') {
                            this.vel.x = 0;
                        }

                        if (kbInfo.event.key == 'a') {
                            this.vel.x = 0;
                        }

                        if (kbInfo.event.key == 'w') {
                            this.vel.z = 0;
                        }

                        if (kbInfo.event.key == 's') {
                            this.vel.z = 0;
                        }
                        break;
                }
            });

            transformPlayer.x = transformPlayer.x + this.vel.x * dt;
            transformPlayer.z = transformPlayer.z + this.vel.z * dt;
        }

    }
}