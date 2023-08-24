import { PhysicsAggregate } from '@babylonjs/core';

// TO DO questa componente serve ad associare un PhysicsAggregate ad una entità
export class PhysicComponent {
    phAggregate: PhysicsAggregate;
    constructor(phAggregate: PhysicsAggregate) {
        this.phAggregate = phAggregate;
    }
}