import { Entity, IterativeSystem, QueryBuilder } from "tick-knock";
import { PlayerMeshComponent } from "../components/PlayerMeshComponent";
import { MovingComponent } from "../components/MovingComponent";
import { PositionComponent } from "../components/PositionComponent";
import { KeyboardEventTypes, Scene, Vector3 } from "@babylonjs/core";
import { PhysicComponent } from "../components/PhysicComponent";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class MovementSystem extends IterativeSystem {
    scene: Scene;
    constant: number = 0.05;

    constructor(scene: Scene) {
        // Create a query that will capture out player entity (has to have a mesh component and a moving component)
        super(new QueryBuilder().contains(PlayerMeshComponent).contains(PhysicComponent).contains(PositionComponent).build())
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {

        // Get the mesh component
        let meshComponent = entity.get(PlayerMeshComponent);

        let positionComponent = entity.get(PositionComponent);

        let phComponent = entity.get(PhysicComponent);

        // Unpack the position from the mesh component
        let position = positionComponent.position;

        let body = phComponent.phAggregate.body;

        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        case "a":
                        case "A":
                            body.applyForce(new Vector3(-dt, 0, 0), position);
                            //position.x -= this.constant * dt;
                            break
                        case "d":
                        case "D":
                            body.applyForce(new Vector3(dt, 0, 0), position);
                            //position.x += this.constant * dt;
                            break
                        case "w":
                        case "W":
                            body.applyForce(new Vector3(0, 0, dt), position);
                            //position.z += this.constant * dt;
                            break
                        case "s":
                        case "S":
                            body.applyForce(new Vector3(0, 0, -dt), position);
                            //position.z -= this.constant * dt;
                            break
                    }
                    break;
            }
        })



        /* // Move left or right
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
        } */

        //attach the position component to the mesh position
        meshComponent.mesh.position = position;
    }
}