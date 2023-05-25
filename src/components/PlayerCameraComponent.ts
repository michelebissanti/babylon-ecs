import { Camera, FreeCamera } from '@babylonjs/core';

export class PlayerCameraComponent {
    camera: FreeCamera;
    constructor(camera: FreeCamera) {
        this.camera = camera;
    }
}