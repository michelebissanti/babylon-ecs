import { Entity, IterativeSystem, QueryBuilder } from "tick-knock";
import { PlayerMeshComponent } from "../components/PlayerMeshComponent";
import { MovingComponent } from "../components/MovingComponent";
import { PositionComponent } from "../components/PositionComponent";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class MovementSystem extends IterativeSystem {
    constructor() {

        // Create a query that will capture out player entity (has to have a mesh component and a moving component)
        super(new QueryBuilder().contains(PlayerMeshComponent).contains(MovingComponent).contains(PositionComponent).build())
    }

    protected updateEntity(entity: Entity, dt: number): void {

        // Get the movement component
        let moveComponent = entity.get(MovingComponent);

        // Get the mesh component
        let meshComponent = entity.get(PlayerMeshComponent);

        let positionComponent = entity.get(PositionComponent);

        // Unpack the position from the mesh component
        let position = positionComponent.position;

        // Move left or right
        if (moveComponent.goingLeft) {
            position.x -= dt;
        } else {
            position.x += dt;
        }
        if (position.x > 2) {
            moveComponent.goingLeft = true;
        }
        else if (position.x < -2) {
            moveComponent.goingLeft = false;
        }

        //attach the position component to the mesh position
        meshComponent.mesh.position = position;
    }
}