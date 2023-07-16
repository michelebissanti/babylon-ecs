
export class EntityMultiplayerComponent {
    serverId: number;
    send: boolean;

    constructor(send?: boolean) {
        this.send = send
    }
}