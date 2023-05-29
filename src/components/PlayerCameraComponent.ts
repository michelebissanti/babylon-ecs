import { Camera, FreeCamera, Vector3 } from '@babylonjs/core';

export class PlayerCameraComponent {
    camera: FreeCamera;
    constructor(camera: FreeCamera) {
        this.camera = camera;
        this.camera.attachControl();
        //inserisco il controllo tramite wasd
        this.camera.keysUp.push(87);
        this.camera.keysDown.push(83);
        this.camera.keysLeft.push(65);
        this.camera.keysRight.push(68);

        this.camera.applyGravity = true;
        this.camera.checkCollisions = true;

        this.camera.ellipsoid = new Vector3(1, 1.65, 1);

        this.camera.minZ = 0.5;
        this.camera.speed = 0.5;
        this.camera.angularSensibility = 4000;
    }
}