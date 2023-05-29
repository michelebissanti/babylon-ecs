import { Entity, EntitySnapshot, IterativeSystem, QueryBuilder } from "tick-knock";
import { PlayerMeshComponent } from "../components/PlayerMeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { KeyboardEventTypes, Scene, Vector3 } from "@babylonjs/core";
import { PhysicComponent } from "../components/PhysicComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { WebXrComponent } from "../components/WebXrComponent";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class WebXrSystem extends IterativeSystem {
    scene: Scene;
    init = true;

    constructor(scene: Scene) {
        super(new QueryBuilder().contains(WebXrComponent).build());
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {
        let session = entity.get(WebXrComponent).exp;

        if (this.init) {
            const featureManager = session.baseExperience.featuresManager;
            console.log(featureManager);
            this.init = false;

            session.baseExperience
        }

    }
}