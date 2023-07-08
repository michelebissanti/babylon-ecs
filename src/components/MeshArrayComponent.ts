import { AbstractMesh, Mesh } from '@babylonjs/core';

export class MeshArrayComponent {
    meshes: AbstractMesh[];

    constructor(meshes: AbstractMesh[], eid: number, collision?: boolean) {
        this.meshes = meshes;

        this.meshes[0].name = eid.toString();

        this.meshes.map(mesh => {
            mesh.metadata = { id: eid.toString() };
        });

        if (collision) {
            this.meshes.map(mesh => {
                mesh.checkCollisions = true;
            });
        }
    }
}