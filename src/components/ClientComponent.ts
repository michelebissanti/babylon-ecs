import { Client, Room } from "colyseus.js";

export class ClientComponent {
    client: Client;
    room: Room = null;

    constructor(local?: boolean) {
        const ENDPOINT_LOCAL = "ws://localhost:2567";
        const ENDPOINT = "wss://test-webxr-multi.onrender.com/";

        if (local) {
            this.client = new Client(ENDPOINT_LOCAL);
        } else {
            this.client = new Client(ENDPOINT);
        }
    }
}