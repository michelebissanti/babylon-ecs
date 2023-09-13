import { AbstractMesh } from '@babylonjs/core';

// questa componente serve ad associare una singola mesh ad una entità
export class MeshComponent {
    mesh: AbstractMesh;

    constructor(mesh: AbstractMesh, eid: number, collision?: boolean) {
        this.mesh = mesh;

        //rinomino la mesh principale con il suo entity id locale
        this.mesh.name = eid.toString();

        //aggiungo come metadato l'entity id locale
        this.mesh.metadata = { id: eid.toString() };

        this.mesh.isNearGrabbable = true;

        if (collision) {
            mesh.checkCollisions = true;
        }
    }
}