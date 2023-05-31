import { GroundMesh } from '@babylonjs/core';

export class GroundComponent {
    ground: GroundMesh;
    constructor(ground: GroundMesh) {
        this.ground = ground;
    }
}