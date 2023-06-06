import { AbstractMesh, Mesh } from '@babylonjs/core';

export class MeshArrayComponent {
    meshes: AbstractMesh[];

    constructor(meshes: AbstractMesh[], collision?: boolean) {
        this.meshes = meshes;
        if (collision) {
            meshes.map(mesh => {
                mesh.checkCollisions = true;
            });
        }
    }
}