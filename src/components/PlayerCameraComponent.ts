import { Camera, FreeCamera, Vector3 } from '@babylonjs/core';

// questa componente serve ad associare una camera al player
// dovrebbe essere associata solo ad una entità, ovvero il player locale
export class PlayerCameraComponent {
    camera: FreeCamera;
    firstPerson: boolean;
    constructor(camera: FreeCamera) {
        this.camera = camera;
        this.firstPerson = true;
    }
}