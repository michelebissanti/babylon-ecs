import { Mesh } from '@babylonjs/core';

export class MeshComponent {
    mesh: Mesh;

    constructor(mesh: Mesh, collision?: boolean) {
        this.mesh = mesh;
        if (collision) {
            mesh.checkCollisions = true;
        }
    }
}