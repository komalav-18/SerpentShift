import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    DirectionalLight,
    Vector3,
    MeshBuilder,
    StandardMaterial,
    Color3,
    DynamicTexture,
    Mesh,
    Curve3,
} from "@babylonjs/core";

import type { BoardData } from "./boardData";

export function createGameScene(canvas: HTMLCanvasElement) {
    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);

    scene.clearColor.set(0.88, 0.93, 0.98, 1);
    const camera = new ArcRotateCamera(
        "camera",
        -Math.PI / 4,
        Math.PI / 3.2,
        17,
        new Vector3(0, 0, 0),
        scene
    );

    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 11;
    camera.upperRadiusLimit = 28;
    camera.wheelDeltaPercentage = 0.01;
    const light = new HemisphericLight(
        "ambientLight",
        new Vector3(0, 1, 0),
        scene
    );

    light.intensity = 0.85;

    const sun = new DirectionalLight(
        "sun",
        new Vector3(-1, -2, -1),
        scene
    );

    sun.intensity = 0.7;
    function material(name: string, color: Color3) {
        const mat = new StandardMaterial(name, scene);
        mat.diffuseColor = color;
        return mat;
    }

    const tileA = material("tileA", new Color3(0.95, 0.85, 0.55));
    const tileB = material("tileB", new Color3(0.58, 0.82, 0.67));

    const snakeMat = material(
        "snakeMaterial",
        new Color3(0.9, 0.15, 0.2)
    );

    const ladderMat = material(
        "ladderMaterial",
        new Color3(0.12, 0.65, 0.28)
    );

    const eyeMat = material(
        "eyeMaterial",
        new Color3(1, 1, 1)
    );

    const blackMat = material(
        "blackMaterial",
        new Color3(0.03, 0.03, 0.03)
    );
    function getCellPosition(number: number): Vector3 {
        const row = Math.floor((number - 1) / 10);
        const col = (number - 1) % 10;

        const x = row % 2 === 0 ? col : 9 - col;

        return new Vector3(x - 4.5, 0.25, 4.5 - row);
    }

    for (let number = 1; number <= 100; number++) {
        const position = getCellPosition(number);

        const tile = MeshBuilder.CreateBox(
            `tile-${number}`,
            {
                width: 0.98,
                height: 0.3,
                depth: 0.98,
            },
            scene
        );

        tile.position = new Vector3(
            position.x,
            0,
            position.z
        );

        const row = Math.floor((number - 1) / 10);
        const col = (number - 1) % 10;

        tile.material = (row + col) % 2 === 0 ? tileA : tileB;

        const texture = new DynamicTexture(
            `number-${number}`,
            { width: 256, height: 256 },
            scene,
            false
        );

        texture.hasAlpha = true;

        texture.drawText(
            String(number),
            null,
            160,
            "bold 110px Arial",
            "#172554",
            "transparent",
            true
        );

        const numberMat = new StandardMaterial(
            `numberMat-${number}`,
            scene
        );

        numberMat.diffuseTexture = texture;
        numberMat.useAlphaFromDiffuseTexture = true;
        numberMat.backFaceCulling = false;

        const label = MeshBuilder.CreatePlane(
            `label-${number}`,
            { size: 0.75 },
            scene
        );

        label.rotation.x = Math.PI / 2;
        label.position = new Vector3(
            position.x,
            0.158,
            position.z
        );

        label.material = numberMat;
    }
    const base = MeshBuilder.CreateBox(
        "boardBase",
        { width: 10.3, height: 0.25, depth: 10.3 },
        scene
    );
    base.position.y = -0.28;
    base.material = material(
        "baseMaterial",
        new Color3(0.12, 0.15, 0.28)
    );
    let dynamicMeshes: Mesh[] = [];

    function addDynamic(mesh: Mesh) {
        dynamicMeshes.push(mesh);
        return mesh;
    }

    function connectPoints(
        name: string,
        start: Vector3,
        end: Vector3,
        diameter: number
    ) {
        const direction = end.subtract(start);
        const rod = MeshBuilder.CreateCylinder(
            name,
            {
                height: direction.length(),
                diameter,
                tessellation: 12,
            },
            scene
        );

        rod.position = start.add(end).scale(0.5);

        const up = Vector3.Up();
        const axis = Vector3.Cross(up, direction.normalize());
        const angle = Math.acos(
            Math.max(-1, Math.min(1, Vector3.Dot(up, direction.normalize())))
        );

        if (axis.lengthSquared() > 0.000001) {
            rod.rotate(axis.normalize(), angle);
        } else if (Vector3.Dot(up, direction.normalize()) < 0) {
            rod.rotation.z = Math.PI;
        }

        return addDynamic(rod);
    }

    function createSnake(head: number, tail: number) {
        const start = getCellPosition(head);
        const end = getCellPosition(tail);

        start.y = 0.55;
        end.y = 0.55;

        const direction = end.subtract(start);
        const sideways = new Vector3(-direction.z, 0, direction.x)
            .normalize();

        const points: Vector3[] = [];

        for (let i = 0; i <= 30; i++) {
            const t = i / 30;

            const point = Vector3.Lerp(start, end, t);

            const wave = Math.sin(t * Math.PI * 4) * 0.28;

            point.addInPlace(sideways.scale(wave));
            point.y = 0.55 + Math.sin(t * Math.PI) * 0.15;

            points.push(point);
        }

        const snake = MeshBuilder.CreateTube(
            `snake-${head}-${tail}`,
            {
                path: Curve3.CreateCatmullRomSpline(points, 60).getPoints(),
                radius: 0.12,
                tessellation: 12,
            },
            scene
        );

        snake.material = snakeMat;
        addDynamic(snake);

        const headMesh = MeshBuilder.CreateSphere(
            `head-${head}`,
            { diameter: 0.34 },
            scene
        );

        headMesh.position = start;
        headMesh.material = snakeMat;
        addDynamic(headMesh);

        for (const offset of [-0.09, 0.09]) {
            const eye = MeshBuilder.CreateSphere(
                "snakeEye",
                { diameter: 0.075 },
                scene
            );

            eye.position = start.add(
                new Vector3(offset, 0.13, -0.1)
            );

            eye.material = eyeMat;
            addDynamic(eye);
        }
    }

    function createLadder(startNumber: number, endNumber: number) {
        const start = getCellPosition(startNumber);
        const end = getCellPosition(endNumber);

        start.y = 0.48;
        end.y = 0.48;

        const direction = end.subtract(start);
        const side = new Vector3(-direction.z, 0, direction.x)
            .normalize()
            .scale(0.14);

        for (const sign of [-1, 1]) {
            const rail = connectPoints(
                "ladderRail",
                start.add(side.scale(sign)),
                end.add(side.scale(sign)),
                0.07
            );

            rail.material = ladderMat;
        }

        const steps = Math.max(3, Math.floor(direction.length() * 2));

        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const center = Vector3.Lerp(start, end, t);

            const step = connectPoints(
                "ladderStep",
                center.subtract(side),
                center.add(side),
                0.055
            );

            step.material = ladderMat;
        }
    }

    function updateBoard(board: BoardData) {

        dynamicMeshes.forEach((mesh) => mesh.dispose());
        dynamicMeshes = [];

        board.snakes.forEach((snake) => {
            createSnake(snake.head, snake.tail);
        });

        board.ladders.forEach((ladder) => {
            createLadder(ladder.start, ladder.end);
        });
    }

    engine.runRenderLoop(() => {
        scene.render();
    });

    const resize = () => engine.resize();
    window.addEventListener("resize", resize);

    function dispose() {
        window.removeEventListener("resize", resize);
        scene.dispose();
        engine.dispose();
    }

    return { updateBoard, dispose };
}