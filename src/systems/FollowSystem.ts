import { Scene } from "@babylonjs/core";
import { Entity, IterativeSystem, QueryBuilder } from "tick-knock";
import { FollowComponent } from "../components/FollowComponent";
import { TransformComponent } from "../components/TransformComponent";

// FollowSystem: serve a realizzare il comportamento di follow
export class FollowSystem extends IterativeSystem {
    scene: Scene;

    constructor(scene: Scene) {
        // entra nel loop del sistema solo se ha TransformComponent e FollowComponent
        super(new QueryBuilder().contains(FollowComponent).contains(TransformComponent).build())
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {

        let followComponent = entity.get(FollowComponent);
        let transformComponent = entity.get(TransformComponent);

        let targetTransformComponet = followComponent.target;

        if (followComponent.spacing != null) {
            transformComponent.x = targetTransformComponet.x + followComponent.spacing.x;
            transformComponent.y = targetTransformComponet.y + followComponent.spacing.y;
            transformComponent.z = targetTransformComponet.z + followComponent.spacing.z;
        } else {
            transformComponent.x = targetTransformComponet.x;
            transformComponent.y = targetTransformComponet.y;
            transformComponent.z = targetTransformComponet.z;
        }

        if (followComponent.followRotation) {
            transformComponent.rotation_x = targetTransformComponet.rotation_x;
            transformComponent.rotation_y = targetTransformComponet.rotation_y;
            transformComponent.rotation_z = targetTransformComponet.rotation_z;
            transformComponent.rotation_w = targetTransformComponet.rotation_w;
        }







    }
}