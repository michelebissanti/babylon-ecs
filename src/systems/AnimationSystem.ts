import { Entity, EntitySnapshot, IterativeSystem, Query, QueryBuilder } from "tick-knock";
import { MeshComponent } from "../components/MeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { AbstractMesh, KeyboardEventTypes, Matrix, MeshBuilder, Scene, SceneLoader, Vector3 } from "@babylonjs/core";
import { PhysicComponent } from "../components/PhysicComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { TransformComponent } from "../components/TransformComponent";
import { MeshArrayComponent } from "../components/MeshArrayComponent";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { Room } from "colyseus.js";
import { MeshMultiComponent } from "../components/MeshMultiComponent";
import { ClientComponent } from "../components/ClientComponent";
import { Utils } from "../utils";
import { AnimationComponent } from "../components/AnimationComponent";

// Create a simple system that extends an iterative base class
// The iterative system class simply iterates over all entities it finds
// that matches its query.
export class AnimationSystem extends IterativeSystem {
    scene: Scene;
    init = true;

    constructor(scene: Scene) {
        super(new Query((entity) => (entity.hasComponent(AnimationComponent) || entity.hasComponent(EntityMultiplayerComponent))));
        this.scene = scene;
    }

    protected async updateEntity(entity: Entity, dt: number): Promise<void> {

        if (Utils.room != null) {
            if (entity.has(AnimationComponent) && entity.has(EntityMultiplayerComponent)) {
                let animComponent = entity.get(AnimationComponent);
                let entityServer = entity.get(EntityMultiplayerComponent);

                //se l'entità non è stata mai inviata al server, invio il segnale di creazione
                if (animComponent.id == undefined && entityServer.serverId != undefined) {
                    Utils.room.send("attachAnimationComponent", {
                        id: "" + entityServer.serverId
                    });

                    animComponent.id = entityServer.serverId;
                }

                if (animComponent.id != undefined && animComponent.state != "pause" && entityServer.busy == Utils.room.sessionId) {

                    animComponent.currentFrame = animComponent.animGroup[+animComponent.state].animatables[0].masterFrame;

                    Utils.room.send("updateAnimationComponent", {
                        id: "" + entityServer.serverId,
                        state: animComponent.state,
                        currentFrame: animComponent.currentFrame
                    });

                    animComponent.isStoppable = true;

                }

                if (animComponent.id != undefined && animComponent.state == "pause" && animComponent.isStoppable == true && entityServer.busy == Utils.room.sessionId) {

                    animComponent.isStoppable = false;

                    Utils.room.send("updateAnimationComponent", {
                        id: "" + entityServer.serverId,
                        state: animComponent.state,
                        currentFrame: animComponent.currentFrame
                    });


                }




            }
        }

    }
}