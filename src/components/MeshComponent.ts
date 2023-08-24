import { AbstractMesh, Mesh } from '@babylonjs/core';

// questa componente serve ad associare una singola mesh ad una entità
export class MeshComponent {
    mesh: AbstractMesh;

    constructor(mesh: Mesh, eid: number, collision?: boolean) {
        this.mesh = mesh;

        //rinomino la mesh principale con il suo entity id locale
        this.mesh.name = eid.toString();

        //aggiungo come metadato l'entity id locale
        this.mesh.metadata = { id: eid.toString() };

        if (collision) {
            mesh.checkCollisions = true;
        }
    }
}