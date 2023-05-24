import { PhysicsAggregate } from '@babylonjs/core';

export class PhysicComponent {
    phAggregate: PhysicsAggregate;
    constructor(phAggregate: PhysicsAggregate) {
        this.phAggregate = phAggregate;
    }
}