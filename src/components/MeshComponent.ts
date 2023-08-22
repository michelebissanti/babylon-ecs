import { AbstractMesh, Mesh } from '@babylonjs/core';

export class MeshComponent {
    mesh: AbstractMesh;

    constructor(mesh: Mesh, eid: number, collision?: boolean) {
        this.mesh = mesh;
        this.mesh.metadata = { id: eid.toString() };
        this.mesh.name = eid.toString();

        if (collision) {
            mesh.checkCollisions = true;
        }
    }
}