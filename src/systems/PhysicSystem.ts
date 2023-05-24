import { Entity, IterativeSystem, QueryBuilder } from "tick-knock";
import { HavokPlugin, Scene, Vector3 } from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";

export class PhysicSistem extends IterativeSystem {

    constructor(scene: Scene) {
        super(new QueryBuilder().contains(PhysicSistem).build());

        var gravityVector = new Vector3(0, -9.81, 0);
        var physicsPlugin = new HavokPlugin(true, getInitializedHavok());
        scene.enablePhysics(gravityVector, physicsPlugin);
    }

    protected updateEntity(entity: Entity, dt: number): void {

    }
}

async function getInitializedHavok() {
    return await HavokPhysics();
}