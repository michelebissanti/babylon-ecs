import { Client, Room } from "colyseus.js";

export class ModelMultiComponent {
    name: string;
    location: string;

    constructor(location: string, name: string) {
        this.name = name;
        this.location = location;
    }
}