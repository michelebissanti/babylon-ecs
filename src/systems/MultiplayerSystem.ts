import { Entity, EntitySnapshot, IterativeSystem, Query, QueryBuilder } from "tick-knock";
import { MeshComponent } from "../components/MeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { KeyboardEventTypes, Mesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import { PhysicComponent } from "../components/PhysicComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { ClientComponent } from "../components/ClientComponent";
import { ModelMultiComponent } from "../components/ModelMultiComponent";
import { MeshArrayComponent } from "../components/MeshArrayComponent";

export class MultiplayerSystem extends IterativeSystem {
    scene: Scene;
    init = true;
    private playerEntities: { [playerId: string]: number } = {};
    private models: { [name: string]: string } = {};

    constructor(scene: Scene) {
        super(new Query((entity) => entity.hasComponent(ClientComponent) || entity.hasComponent(ModelMultiComponent)));
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {
        let room = null;
        if (entity.has(ClientComponent)) {
            room = entity.get(ClientComponent).room;
        }


        if (room != null) {
            if (this.init) {
                //faccio sparire i pulsanti di join

                //quando si aggiunge un player
                room.state.players.onAdd(async (player, sessionId) => {
                    const isCurrentPlayer = (sessionId === room.sessionId);

                    if (sessionId != room.sessionId) {
                        let joiner = new Entity();
                        //const playerAvatar = await this.ImportPlayerModel();
                        joiner.addTag(sessionId);
                        joiner.add(new MeshComponent(MeshBuilder.CreateSphere(sessionId, { diameter: 1 }, this.scene)));
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


                //gestione degli oggetti(models)



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
                    //rotation: playerMesh.rotation,
                });
            }

            if (entity.hasComponent(ModelMultiComponent)) {
                console.log("ciao");
                let model = entity.get(ModelMultiComponent);

                if (this.models[model.name] != model.name) {
                    //mando a tutti il nuovo oggetto
                    let modelMeshes = entity.get(MeshArrayComponent);

                    room.send("createModel", {
                        location: model.location,
                        name: model.name,
                        x: modelMeshes[0].position.x,
                        y: modelMeshes[0].position.y,
                        z: modelMeshes[0].position.z,
                        rotation_x: modelMeshes[0].rotation.x,
                        rotation_y: modelMeshes[0].rotation.y,
                        rotation_z: modelMeshes[0].rotation.z,
                    });

                    //lo aggiungo agli oggetti da aggiornare
                    this.models[model.name] = model.name;
                }
            }


        }



    }
}