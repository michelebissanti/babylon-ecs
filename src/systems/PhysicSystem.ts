import { Entity, IterativeSystem, QueryBuilder } from "tick-knock";
import { HavokPlugin, Scene, Vector3 } from "@babylonjs/core";

// TO DO
export class PhysicSistem extends IterativeSystem {
    scene: Scene

    constructor(scene: Scene) {
        super(new QueryBuilder().contains(PhysicSistem).build());
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {

    }
}