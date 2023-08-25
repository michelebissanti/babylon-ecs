import { AbstractMesh, Mesh } from '@babylonjs/core';

// questa componente serve ad associare un array di AbstractMesh ad una entità
export class MeshArrayComponent {
    meshes: AbstractMesh[];

    constructor(meshes: AbstractMesh[], eid: number, collision?: boolean) {
        this.meshes = meshes;

        //rinomino la mesh principale con il suo entity id locale
        this.meshes[0].name = eid.toString();

        //ad ogni mesh aggiungo come metadato l'entity id locale
        this.meshes.forEach(mesh => {
            mesh.metadata = { id: eid.toString() };
            mesh.isNearGrabbable = true;
        });

        if (collision) {
            this.meshes.map(mesh => {
                mesh.checkCollisions = true;
            });
        }
    }
}