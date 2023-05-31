import { Entity, EntitySnapshot, IterativeSystem, QueryBuilder } from "tick-knock";
import { MeshComponent } from "../components/MeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { KeyboardEventTypes, Scene, Vector3 } from "@babylonjs/core";
import { PhysicComponent } from "../components/PhysicComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class MovementSystem extends IterativeSystem {
    scene: Scene;

    constructor(scene: Scene) {
        super(new QueryBuilder().contains(MeshComponent).contains(PlayerCameraComponent).build())
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {

        // Get the mesh component
        var meshComponent = entity.get(MeshComponent);

        var camera = entity.get(PlayerCameraComponent).camera;



        meshComponent.mesh.position = new Vector3(camera.position.x, 0, camera.position.z);

    }
}