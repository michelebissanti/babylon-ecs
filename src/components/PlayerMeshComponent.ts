import { Mesh } from '@babylonjs/core';

export class PlayerMeshComponent {
    mesh: Mesh;
    constructor(mesh: Mesh) {
        this.mesh = mesh;
    }
}