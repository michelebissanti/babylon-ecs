import { Camera, FreeCamera, Vector3 } from '@babylonjs/core';

export class PlayerCameraComponent {
    camera: FreeCamera;
    firstPerson: boolean;
    constructor(camera: FreeCamera) {
        this.camera = camera;
        this.firstPerson = true;
    }
}