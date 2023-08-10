import { AbstractMesh, AnimationGroup, Quaternion, SceneLoader } from "@babylonjs/core";
import { GUI3DManager } from "@babylonjs/gui";
import { Room } from "colyseus.js";
import { Engine, Entity } from "tick-knock";
import { EntityMultiplayerComponent } from "./components/EntityMultiplayerComponent";
import { TransformComponent } from "./components/TransformComponent";
import { MeshMultiComponent } from "./components/MeshMultiComponent";
import { MeshArrayComponent } from "./components/MeshArrayComponent";
import { AnimationComponent } from "./components/AnimationComponent";

export class Object3d {
    nome: string;
    urlIcona: string;
    percorso: string;
    nomeFile: string;

    constructor(nome, urlIcona, percorso, nomeFile) {
        this.nome = nome,
            this.urlIcona = urlIcona;
        this.percorso = percorso;
        this.nomeFile = nomeFile;
    }
}

export class Utils {
    public static room: Room;
    public static gui3dmanager: GUI3DManager;
    public static savedEntities = new Map<string, number>();

    /** Returns a new Quaternion set from the passed Euler float angles (y, x, z). */
    static euler(eulerX: number, eulerY: number, eulerZ: number): Quaternion {
        return Quaternion.RotationYawPitchRoll(eulerY, eulerX, eulerZ);
    }

    static getAvaiableObjects(): Array<Object3d> {
        let objects: Array<Object3d> = [];

        objects[0] = new Object3d("Cofee Cup", "models_image/coffee_cup.png", "models/", "coffee_cup.glb");
        objects[1] = new Object3d("Wood Chair", "models_image/chair.png", "models/", "chair.glb");
        objects[2] = new Object3d("Lion", "models_image/lion.png", "models/", "lion.glb");
        objects[3] = new Object3d("Table Football", "models_image/table_football.png", "models/", "table_football.glb");
        objects[4] = new Object3d("Mystery Block", "models_image/mystery_block.png", "models/", "mystery_block.glb");
        objects[5] = new Object3d("Bee", "models_image/bee.png", "models/", "bee.glb");

        return objects;

    }


    static waitForConditionAsync(conditionFunction, timerInMs?: number, timeout?: number) {
        var isExpired = false;
        const poll = async resolve => {
            if (isExpired || await conditionFunction()) resolve();
            else setTimeout(_ => poll(resolve), timerInMs ? timerInMs : 100);
        }

        if (timeout) {
            setTimeout(() => isExpired = true, timeout);
        }

        return new Promise(poll);
    }

    static async importModel(baseUrl: string, modelName: string, animGroup?: AnimationGroup[]): Promise<AbstractMesh[]> {

        let { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
            null,
            baseUrl,
            modelName
        );

        animGroup = animationGroups;

        return meshes;
    }

    static copyMessage(val: string) {
        const selBox = document.createElement('textarea');
        selBox.style.position = 'fixed';
        selBox.style.left = '0';
        selBox.style.top = '0';
        selBox.style.opacity = '0';
        selBox.value = val;
        document.body.appendChild(selBox);
        selBox.focus();
        selBox.select();
        document.execCommand('copy');
        document.body.removeChild(selBox);
    }

    static setServerTrigger(engine: Engine) {

        Utils.waitForConditionAsync(_ => {
            return Utils.room != null;
        }).then(_ => {
            //quando si aggiunge un entità al server
            Utils.room.state.entities.onAdd(async (serverEntity) => {
                //entra solo se chi ha inviato il messaggio non sono io
                if (serverEntity.sender != Utils.room.sessionId) {
                    console.log("nuova entita da server");
                    let joiner = new Entity();
                    joiner.addComponent(new EntityMultiplayerComponent(true));
                    engine.addEntity(joiner);

                    if (serverEntity.id != undefined) {
                        joiner.get(EntityMultiplayerComponent).serverId = serverEntity.id;
                    }

                    Utils.savedEntities.set(serverEntity.id, joiner.id);


                }

                serverEntity.onChange(async () => {
                    //aggiorno lo stato dell'entità
                    let localEntity = engine.getEntityById(Utils.savedEntities.get(serverEntity.id));

                    if (localEntity != undefined) {
                        localEntity.get(EntityMultiplayerComponent).busy = serverEntity.busy;
                    }
                });


            });

            Utils.room.state.entities.onRemove((serverEntity) => {
                let playerEntity = engine.getEntityById(this.savedEntities.get(serverEntity.id));
                Utils.savedEntities.delete(serverEntity.id);
                engine.removeEntity(playerEntity);

            });

            Utils.room.onLeave(code => {
            });




            //quando si aggiunge un componente di transform
            Utils.room.state.transformComponents.onAdd(async (entityServer, client) => {
                //cercare se esiste un entità con quel server id
                if (Utils.savedEntities.has(entityServer.id)) {
                    if (entityServer.sender != Utils.room.sessionId) {
                        console.log("nuova comp transform");
                        let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));
                        localEntity.add(new TransformComponent());
                        localEntity.get(TransformComponent).id = entityServer.id;

                        let transform = localEntity.get(TransformComponent);

                        transform.x = entityServer.x;
                        transform.y = entityServer.y;
                        transform.z = entityServer.z;
                        transform.rotation_x = entityServer.rotation_x;
                        transform.rotation_y = entityServer.rotation_y;
                        transform.rotation_z = entityServer.rotation_z;
                        transform.rotation_w = entityServer.rotation_w;
                        transform.scale_x = entityServer.scale_x;
                        transform.scale_y = entityServer.scale_y;
                        transform.scale_z = entityServer.scale_z;

                        entityServer.onChange(() => {
                            //aggiorno il modello prendendo la sua entità
                            let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));

                            //aggiorno solo se non sono io a mandare l'update
                            if (entityServer.sender != Utils.room.sessionId) {

                                let transform = localEntity.get(TransformComponent);

                                transform.x = entityServer.x;
                                transform.y = entityServer.y;
                                transform.z = entityServer.z;
                                transform.rotation_x = entityServer.rotation_x;
                                transform.rotation_y = entityServer.rotation_y;
                                transform.rotation_z = entityServer.rotation_z;
                                transform.rotation_w = entityServer.rotation_w;
                                transform.scale_x = entityServer.scale_x;
                                transform.scale_y = entityServer.scale_y;
                                transform.scale_z = entityServer.scale_z;

                            }


                        });
                    }
                }

            });

            Utils.room.state.transformComponents.onRemove((entity) => {

            });






            //quando si aggiunge un componente di mesh
            Utils.room.state.meshComponents.onAdd(async (entityServer) => {

                if (Utils.savedEntities.has(entityServer.id)) {
                    if (entityServer.sender != Utils.room.sessionId) {
                        console.log("nuova comp mesh");

                        let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));
                        //gli id coincidono quindi questa entità ha anche la componente di transform
                        localEntity.add(new MeshMultiComponent(entityServer.location, entityServer.name, false));
                        localEntity.get(MeshMultiComponent).id = entityServer.id;

                        //istanzio la mesh qui
                        //localEntity.add(new MeshArrayComponent(await this.importModel(entityServer.location, entityServer.name), localEntity.id));

                        entityServer.onChange(async () => {
                            //aggiorno il modello prendendo la sua entità
                            let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));

                            //aggiorno solo se non sono io a mandare l'update
                            if (entityServer.sender != Utils.room.sessionId) {
                                localEntity.get(MeshMultiComponent).location = entityServer.location;
                                localEntity.get(MeshMultiComponent).name = entityServer.name;
                                localEntity.get(MeshMultiComponent).render = false;

                                //aggiorno e istanzio le modifiche
                                if (localEntity.has(MeshArrayComponent)) {
                                    localEntity.get(MeshArrayComponent).meshes[0].dispose();

                                    //localEntity.get(MeshArrayComponent).meshes = await Utils.importModel(entityServer.location, entityServer.name);
                                }

                            }

                        });

                    }
                }

            });

            Utils.room.state.meshComponents.onRemove((serverEntity) => {
                let localEntity = engine.getEntityById(this.savedEntities.get(serverEntity.id));
                if (localEntity != null && localEntity.has(MeshArrayComponent)) {
                    localEntity.get(MeshArrayComponent).meshes[0].dispose();
                }
            });




            //quando si aggiunge un componente di animazione
            Utils.room.state.animationComponents.onAdd(async (entityServer) => {

                if (Utils.savedEntities.has(entityServer.id)) {
                    if (entityServer.sender != Utils.room.sessionId) {

                        let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));

                        if (localEntity.has(AnimationComponent)) {
                            localEntity.get(AnimationComponent).id = entityServer.id;
                            localEntity.get(AnimationComponent).state = entityServer.state;
                            localEntity.get(AnimationComponent).currentFrame = entityServer.currentFrame;
                        }

                        entityServer.onChange(async () => {
                            //aggiorno il modello prendendo la sua entità
                            let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));

                            //aggiorno solo se non sono io a mandare l'update
                            if (entityServer.sender != Utils.room.sessionId && localEntity.has(AnimationComponent)) {

                                let lastAnimation = 0;
                                let animations = localEntity.get(AnimationComponent).animGroup;
                                localEntity.get(AnimationComponent).state = entityServer.state;
                                localEntity.get(AnimationComponent).currentFrame = entityServer.currentFrame;

                                if (entityServer.state != "pause" && localEntity.get(AnimationComponent).isStoppable == false) {
                                    animations[+entityServer.state].goToFrame(entityServer.currentFrame);
                                    animations[+entityServer.state].play(true);
                                    lastAnimation = +entityServer.state;
                                    localEntity.get(AnimationComponent).isStoppable = true;
                                } else {
                                    animations[lastAnimation].pause();
                                    localEntity.get(AnimationComponent).isStoppable = false;

                                }
                            }

                        });

                    }
                }

            });

            Utils.room.state.animationComponents.onRemove((serverEntity) => {
            });






        });

    }
}