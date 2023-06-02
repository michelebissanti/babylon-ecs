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

    constructor(scene: Scene) {
        super(new QueryBuilder().contains(MultiplayerSystem).build())
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {
        let room = entity.get(ClientComponent).room;

        if (room != null) {
            //quando si aggiunge un player
            room.state.players.onAdd(async (player, sessionId) => {
                const isCurrentPlayer = (sessionId === room.sessionId);

                if (sessionId != room.sessionId) {
                    let joiner = new Entity();
                    //const playerAvatar = await this.ImportPlayerModel();
                    joiner.addTag(sessionId);
                    joiner.add(new MeshComponent(MeshBuilder.CreateSphere('sphere', { diameter: 1 })));
                    let joinerMesh = joiner.get(MeshComponent).mesh;


                    // Set player spawning position
                    joinerMesh.position.set(player.x, player.y, player.z);


                    this.engine.addEntity(joiner);
                }

                // update local target position
                player.onChange(() => {
                    if (sessionId != this.room.sessionId) {
                        this.playerNextPosition[sessionId].set(player.x, player.y, player.z);

                        this.playerEntities[sessionId].map(mesh => {
                            mesh.rotation.y = player.rotation;
                        });
                    }
                });
            });
        }


    }
}