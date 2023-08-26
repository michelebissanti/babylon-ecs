import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { GUI3DManager } from '@babylonjs/gui';

import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version

import { CubeTexture, MeshBuilder, StandardMaterial, Texture } from '@babylonjs/core';
import { Engine as EngineECS, Entity } from "tick-knock";
import { GuiUtils } from './GuiUtils';
import { ClientComponent } from './components/ClientComponent';
import { EntityMultiplayerComponent } from './components/EntityMultiplayerComponent';
import { MeshComponent } from './components/MeshComponent';
import { MeshMultiComponent } from './components/MeshMultiComponent';
import { PlayerCameraComponent } from './components/PlayerCameraComponent';
import { TransformComponent } from './components/TransformComponent';
import { WebXrComponent } from './components/WebXrComponent';
import { WorldLightComponent } from './components/WorldLightComponent';
import { AnimationSystem } from './systems/AnimationSystem';
import { MeshMultiplayerSystem } from './systems/MeshMultiplayerSystem';
import { MovementSystem } from './systems/MovementSystem';
import { MultiplayerSystem } from './systems/MultiplayerSystem';
import { TransformSystem } from './systems/TransformSystem';
import { WebXrSystem } from './systems/WebXrSystem';
import { Utils } from './utils';
import { FollowSystem } from './systems/FollowSystem';

class App {
    engine: Engine;
    scene: Scene;
    ecs: EngineECS;

    constructor() {
        // set up Babylon
        this.engine = new Engine(document.getElementById('renderCanvas') as HTMLCanvasElement);
        this.scene = new Scene(this.engine);
        Utils.scene = this.scene;
        this.scene.debugLayer.show();

        // set up libreria ECS
        this.ecs = new EngineECS();
        Utils.engineEcs = this.ecs;
    }

    async setup() {
        //this.scene.enablePhysics(new Vector3(0, -9.81, 0), new HavokPlugin(true, await HavokPhysics()));

        // settaggio dell'ambiente
        let envTexture = CubeTexture.CreateFromPrefilteredData("sky/sky.env", this.scene);
        this.scene.environmentTexture = envTexture;

        this.scene.createDefaultSkybox(envTexture, true);

        let light = new Entity();
        light.add(new WorldLightComponent(new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene)));
        light.get(WorldLightComponent).light.intensity = 1;
        this.ecs.addEntity(light);

        let ground = new Entity();
        ground.add(new MeshComponent(MeshBuilder.CreateGround('ground', { width: 50, height: 50 }), ground.id, true));
        //ground.add(new PhysicComponent(new PhysicsAggregate(ground.get(MeshComponent).ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene)))
        ground.get(MeshComponent).mesh.isPickable = false;
        let groundMat = new StandardMaterial("groundMat", this.scene);
        let groundTexture = new Texture("materials/floor/laminate_floor_02_diff_1k.jpg");
        groundTexture.uScale = 10;
        groundTexture.vScale = 10;
        groundMat.diffuseTexture = groundTexture;

        let groundNormal = new Texture("materials/floor/laminate_floor_02_nor_gl_1k.jpg");
        groundMat.bumpTexture = groundNormal;
        groundNormal.uScale = 10;
        groundNormal.vScale = 10;

        let groundAO = new Texture("materials/floor/laminate_floor_02_ao_1k.jpg");
        groundMat.bumpTexture = groundAO;
        groundAO.uScale = 10;
        groundAO.vScale = 10;

        ground.get(MeshComponent).mesh.material = groundMat;
        this.ecs.addEntity(ground);




        // creo l'entità del player locale
        let player = new Entity();

        player.add(new PlayerCameraComponent(new FreeCamera("cameraPlayer", new Vector3(0, 1.67, 0), this.scene)));

        player.add(new ClientComponent(false));

        player.add(new EntityMultiplayerComponent(true, true));

        player.add(new MeshMultiComponent("https://models.readyplayer.me/", "64521b1a0fc89d09fcdc8c79.glb", false, false, true));

        player.add(new TransformComponent(true));

        player.add(new WebXrComponent(await this.scene.createDefaultXRExperienceAsync({
            floorMeshes: [ground.get(MeshComponent).mesh],
            disableTeleportation: false,
            uiOptions: {
                sessionMode: "immersive-vr",
            },
        })));

        this.ecs.addEntity(player);

        GuiUtils.gui3dmanager = new GUI3DManager(this.scene);

        //test per le animazioni del player

        /* SceneLoader.LoadAssetContainer("https://models.readyplayer.me/", "64521b1a0fc89d09fcdc8c79.glb", this.scene, assets => {
            const rpmMesh = assets.meshes[0];
            assets.addAllToScene();

            // Mixamo animation
            const hiphop = SceneLoader.ImportAnimations("animation/player/", "cards.fbx", this.scene, false, SceneLoaderAnimationGroupLoadingMode.Clean, null, () => {
                // Get Animation Group
                const dancing = this.scene.getAnimationGroupByName("Armature|mixamo.com|Layer0");

                //Start Anim
                dancing.start(true, 1.0, dancing.from, dancing.to, false);

            });
        }); */

        // faccio partire tutti i sistemi ECS
        this.ecs.addSystem(new MovementSystem(this.scene));
        this.ecs.addSystem(new WebXrSystem(this.scene));
        this.ecs.addSystem(new MultiplayerSystem(this.scene));
        this.ecs.addSystem(new TransformSystem(this.scene));
        this.ecs.addSystem(new MeshMultiplayerSystem(this.scene));
        this.ecs.addSystem(new AnimationSystem(this.scene));
        this.ecs.addSystem(new FollowSystem(this.scene));

        // creazione del menu della lobby
        GuiUtils.createNearMenu(player);
    }

    run() {
        // Run the engine render loop, update the ECS engine before the scene renders
        this.engine.runRenderLoop(() => {
            let dt = (this.scene.deltaTime / 1000) || 0;
            this.ecs.update(dt);
            this.scene.render();
        });
    }

}

let w = window as Window & typeof globalThis & { game: App };
w.game = new App();
w.game.setup();
w.game.run();
