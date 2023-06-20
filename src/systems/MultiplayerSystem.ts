import { Entity, EntitySnapshot, IterativeSystem, Query, QueryBuilder, System } from "tick-knock";
import { MeshComponent } from "../components/MeshComponent";
import { PositionComponent } from "../components/PositionComponent";
import { AbstractMesh, KeyboardEventTypes, Matrix, Mesh, MeshBuilder, Quaternion, Scene, SceneLoader, Vector3 } from "@babylonjs/core";
import { PhysicComponent } from "../components/PhysicComponent";
import { PlayerCameraComponent } from "../components/PlayerCameraComponent";
import { ClientComponent } from "../components/ClientComponent";
import { ModelMultiComponent } from "../components/ModelMultiComponent";
import { MeshArrayComponent } from "../components/MeshArrayComponent";

export class MultiplayerSystem extends IterativeSystem {
    scene: Scene;
    init = true;
    private playerEntities: { [playerId: string]: number } = {};
    private models = new Map<string, number>;
    private room = null;

    constructor(scene: Scene) {
        super(new Query((entity) => entity.hasComponent(ClientComponent) || entity.hasComponent(ModelMultiComponent)));
        this.scene = scene;
    }

    async importModel(baseUrl: string, modelName: string): Promise<AbstractMesh[]> {

        let { meshes } = await SceneLoader.ImportMeshAsync(
            null,
            baseUrl,
            modelName,
            this.scene
        );

        return meshes;
    }

    protected updateEntity(entity: Entity, dt: number): void {
        if (entity.has(ClientComponent)) {
            this.room = entity.get(ClientComponent).room;
        }


        if (this.room != null) {
            if (this.init) {
                //faccio sparire i pulsanti di join

                //quando si aggiunge un player
                this.room.state.players.onAdd(async (player, sessionId) => {
                    const isCurrentPlayer = (sessionId === this.room.sessionId);

                    if (sessionId != this.room.sessionId) {
                        let joiner = new Entity();
                        //const playerAvatar = await this.ImportPlayerModel();
                        joiner.addTag(sessionId);
                        joiner.add(new MeshComponent(MeshBuilder.CreateSphere(sessionId, { diameter: 1 }, this.scene)));
                        let joinerMesh = joiner.get(MeshComponent).mesh;
                        joinerMesh.setPivotMatrix(Matrix.Translation(0, 0.5, 0), false);


                        // Set player spawning position
                        joinerMesh.position.set(player.x, player.y, player.z);

                        this.playerEntities[sessionId] = joiner.id;

                        this.engine.addEntity(joiner);
                    }

                    // update local target position
                    player.onChange(() => {
                        if (sessionId != this.room.sessionId) {
                            let playerEntity = this.engine.getEntityById(this.playerEntities[sessionId]);

                            //aggiorno la posizione dell'entità
                            playerEntity.get(MeshComponent).mesh.position.set(player.x, player.y, player.z);
                        }
                    });


                });

                this.room.state.players.onRemove((player, playerId) => {
                    let playerEntity = this.engine.getEntityById(this.playerEntities[playerId]);
                    playerEntity.get(MeshComponent).mesh.dispose();
                    this.engine.removeEntity(playerEntity);
                    delete this.playerEntities[playerId];
                });

                this.room.onLeave(code => {
                    //far riapparire i pulsanti per connettersi ad una stanza
                })


                //inizializzazione degli oggetti(models)
                this.room.state.models.onAdd(async (model) => {
                    //istanzio il modello
                    let newModel = new Entity();
                    newModel.add(new MeshArrayComponent(await this.importModel(model.location, model.name)));
                    newModel.get(MeshArrayComponent).meshes[0].position = new Vector3(model.x, model.y, model.z);
                    newModel.get(MeshArrayComponent).meshes[0].rotationQuaternion = new Quaternion(model.rotation_x, model.rotation_y, model.rotation_z, model.rotation_w);

                    //leggo il codice id del server all'entità locale
                    newModel.addTag(model.id);
                    //aggiungo l'entità a quelle da aggiornare
                    this.models.set(model.id, newModel.id);

                    model.onChange(() => {
                        //aggiorno il modello prendendo la sua entità
                        let modelEntity = this.engine.getEntityById(this.models.get(model.id));

                        //aggiorno la posizione e la rotazione del modello
                        modelEntity.get(MeshArrayComponent).meshes[0].position.set(model.x, model.y, model.z);
                        modelEntity.get(MeshArrayComponent).meshes[0].rotationQuaternion.set(model.rotation_x, model.rotation_y, model.rotation_z, model.rotation_w);
                    });

                });

                this.room.state.models.onRemove((model) => {
                    //rimuovo il modello come entità
                    //rimuovo la sua mesh

                });





                this.init = false;
            }


            //aggiorna la posizione del player
            if (entity.hasAll(MeshComponent, ClientComponent)) {
                let playerMesh = entity.get(MeshComponent).mesh;
                // Send position update to the server
                this.room.send("updatePosition", {
                    x: playerMesh.position.x,
                    //tolgo 2 per far toccare il pavimento all avatar
                    y: playerMesh.position.y,
                    z: playerMesh.position.z,
                    //rotation: playerMesh.rotation,
                });
            }

            //aggiorna i modelli 3d per tutti i player
            if (entity.hasAll(ModelMultiComponent, MeshArrayComponent)) {
                let caricato = false;

                //se l'oggetto è già presente nella lista locale non lo creo sul server

                for (let value of this.models.values()) {
                    if (entity.id == value) {
                        caricato = true;
                    }
                }

                if (caricato) {
                    console.log("NON SERVE PIù");

                } else {
                    //mando al server la presenza del nuovo oggetto
                    let model = entity.get(ModelMultiComponent);
                    let modelMeshes = entity.get(MeshArrayComponent).meshes;

                    this.room.send("createModel", {
                        location: model.location,
                        name: model.name,
                        x: modelMeshes[0].position.x,
                        y: modelMeshes[0].position.y,
                        z: modelMeshes[0].position.z,
                        rotation_x: modelMeshes[0].rotationQuaternion.x,
                        rotation_y: modelMeshes[0].rotationQuaternion.y,
                        rotation_z: modelMeshes[0].rotationQuaternion.z,
                        rotation_w: modelMeshes[0].rotationQuaternion.w,
                    });


                }
            }


        }



    }
}