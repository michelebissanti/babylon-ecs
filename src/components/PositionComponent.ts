import { Vector3 } from "@babylonjs/core";

export class PositionComponent {
    position: Vector3;
    constructor(position: Vector3) {
        this.position = position;
    }
}