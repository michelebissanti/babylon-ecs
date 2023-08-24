import { KeyboardEventTypes, Scene, Vector3 } from "@babylonjs/core";
import { Entity, IterativeSystem, QueryBuilder } from "tick-knock";
import { MeshArrayComponent } from "../components/MeshArrayComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { TransformComponent } from "../components/TransformComponent";
import { Utils } from "../utils";

// MovementSystem: gestisce l'entità che possiede sia TransformComponent che PlayerCameraComponent
// dovrebbe gestire solo il player locale nei suoi spostamenti fuori dalla webxr
export class MovementSystem extends IterativeSystem {
    scene: Scene;
    init = true;
    private vel = { x: 0, y: 0, z: 0 };

    constructor(scene: Scene) {
        // entra nel loop del sistema solo se ha TransformComponent e PlayerCameraComponent
        super(new QueryBuilder().contains(TransformComponent).contains(PlayerCameraComponent).build())
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {

        let cameraComponent = entity.get(PlayerCameraComponent);
        let transformPlayer = entity.get(TransformComponent);


        // se il player è in prima persona
        if (cameraComponent.firstPerson) {
            let camera = cameraComponent.camera;

            // setto dei parametri al primo giro
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


            // setto la componente di Transform in base alla camera
            transformPlayer.x = camera.position.x;
            transformPlayer.y = 0;
            transformPlayer.z = camera.position.z;

            let cameraQuaternion = Utils.euler(0, camera.rotation.y, 0);

            transformPlayer.rotation_x = cameraQuaternion.x;
            transformPlayer.rotation_y = cameraQuaternion.y;
            transformPlayer.rotation_z = cameraQuaternion.z;
            transformPlayer.rotation_w = cameraQuaternion.w;






        } else {
            // sono in terza persona

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