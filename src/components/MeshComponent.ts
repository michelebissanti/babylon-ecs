import { Mesh } from '@babylonjs/core';

export class MeshComponent {
    mesh: Mesh;

    constructor(mesh: Mesh, eid: number, collision?: boolean) {
        this.mesh = mesh;
        this.mesh.metadata = eid;

        if (collision) {
            mesh.checkCollisions = true;
        }
    }
}