import { Entity, EntitySnapshot, IterativeSystem, QueryBuilder } from "tick-knock";
import { MeshComponent } from "../components/MeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { KeyboardEventTypes, Mesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import { PhysicComponent } from "../components/PhysicComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { ClientComponent } from "../components/ClientComponent";

export class MultiplayerSystem extends IterativeSystem {
    scene: Scene;
    init = true;
    private playerEntities: { [playerId: string]: number } = {};

    constructor(scene: Scene) {
        super(new QueryBuilder().contains(ClientComponent).build())
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {
        let room = entity.get(ClientComponent).room;

        if (room != null) {
            if (this.init) {
                //quando si aggiunge un player
                room.state.players.onAdd(async (player, sessionId) => {
                    const isCurrentPlayer = (sessionId === room.sessionId);
                    console.log(player);

                    if (sessionId != room.sessionId) {
                        let joiner = new Entity();
                        //const playerAvatar = await this.ImportPlayerModel();
                        joiner.addTag(sessionId);
                        joiner.add(new MeshComponent(MeshBuilder.CreateSphere('sphere', { diameter: 1 }, this.scene)));
                        let joinerMesh = joiner.get(MeshComponent).mesh;


                        // Set player spawning position
                        joinerMesh.position.set(player.x, player.y, player.z);

                        this.playerEntities[sessionId] = joiner.id;

                        this.engine.addEntity(joiner);
                    }

                    // update local target position
                    player.onChange(() => {
                        if (sessionId != room.sessionId) {
                            let playerEntity = this.engine.getEntityById(this.playerEntities[sessionId]);

                            //aggiorno la posizione dell'entità
                            playerEntity.get(MeshComponent).mesh.position.set(player.x, player.y, player.z);
                        }
                    });


                });

                room.state.players.onRemove((player, playerId) => {
                    let playerEntity = this.engine.getEntityById(this.playerEntities[playerId]);
                    playerEntity.get(MeshComponent).mesh.dispose();
                    this.engine.removeEntity(playerEntity);
                    delete this.playerEntities[playerId];
                });

                room.onLeave(code => {
                    //far riapparire i pulsanti per connettersi ad una stanza
                })

                this.init = false;
            }


            if (entity.hasComponent(MeshComponent)) {
                let playerMesh = entity.get(MeshComponent).mesh;
                // Send position update to the server
                room.send("updatePosition", {
                    x: playerMesh.position.x,
                    //tolgo 2 per far toccare il pavimento all avatar
                    y: playerMesh.position.y,
                    z: playerMesh.position.z,
                    rotation: playerMesh.rotation,
                });
            }


        }



    }
}