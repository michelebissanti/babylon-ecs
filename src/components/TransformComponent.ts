import { Room } from "colyseus.js";

export class TransformComponent {
    room: Room;
    id: number;
    x: number;
    y: number;
    z: number;
    rotation_x: number;
    rotation_y: number;
    rotation_z: number;
    rotation_w: number;

    constructor(room: Room) {
        this.room = room;
    }
}