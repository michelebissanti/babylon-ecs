import { Entity, IterativeSystem, QueryBuilder } from "tick-knock";
import { PlayerMeshComponent } from "../components/PlayerMeshComponent";
import { MovingComponent } from "../components/MovingComponent";
import { PositionComponent } from "../components/PositionComponent";
import { KeyboardEventTypes, Scene, Vector3 } from "@babylonjs/core";
import { PhysicComponent } from "../components/PhysicComponent";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class PositionSystem extends IterativeSystem {

    constructor() {
        // Create a query that will capture out player entity (has to have a mesh component and a moving component)
        super(new QueryBuilder().contains(PlayerMeshComponent).contains(PositionComponent).build())
    }

    protected updateEntity(entity: Entity, dt: number): void {

        // Get the mesh component
        let meshComponent = entity.get(PlayerMeshComponent);

        let positionComponent = entity.get(PositionComponent);

        meshComponent.mesh.position.set(positionComponent.position.x, positionComponent.position.y, positionComponent.position.z);

    }
}