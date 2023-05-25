import { Entity, EntitySnapshot, IterativeSystem, QueryBuilder } from "tick-knock";
import { PlayerMeshComponent } from "../components/PlayerMeshComponent";
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
        super(new QueryBuilder().contains(PlayerMeshComponent).contains(PlayerCameraComponent).build())
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {

        // Get the mesh component
        var meshComponent = entity.get(PlayerMeshComponent);

        var camera = entity.get(PlayerCameraComponent).camera;

        camera.attachControl();
        //inserisco il controllo tramite wasd
        camera.keysUp.push(87);
        camera.keysDown.push(83);
        camera.keysLeft.push(65);
        camera.keysRight.push(68);

        camera.applyGravity = true;
        camera.checkCollisions = true;

        camera.ellipsoid = new Vector3(1, 1.65, 1);

        camera.minZ = 0.5;
        camera.speed = 0.5;
        camera.angularSensibility = 4000;

        meshComponent.mesh.position = new Vector3(camera.position.x, camera.position.y, camera.position.z);

    }
}