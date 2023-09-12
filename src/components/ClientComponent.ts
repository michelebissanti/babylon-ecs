import { Client, Room } from "colyseus.js";

// questa componente serve ad astrarre l'oggetto client presente in colyseus
// dovrebbe essere associata solo ad una entità, ovvero il player locale
export class ClientComponent {
    client: Client;
    room: Room = null;

    constructor(local?: boolean) {
        const ENDPOINT_LOCAL = "ws://localhost:2567";
        const ENDPOINT = "wss://xroom-server.azurewebsites.net";

        if (local) {
            this.client = new Client(ENDPOINT_LOCAL);
        } else {
            this.client = new Client(ENDPOINT);
        }
    }
}