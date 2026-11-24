export interface Snake {
    head: number;
    tail: number;
}

export interface Ladder {
    start: number;
    end: number;
}

export interface BoardData {
    snakes: Snake[];
    ladders: Ladder[];
}

const random = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export function generateBoard(): BoardData {
    const snakes: Snake[] = [];
    const ladders: Ladder[] = [];

    const used = new Set<number>([1, 100]);

    while (snakes.length < 3) {
        const head = random(25, 99);
        const tail = random(2, head - 10);

        if (used.has(head) || used.has(tail)) continue;

        snakes.push({ head, tail });
        used.add(head);
        used.add(tail);
    }

    while (ladders.length < 3) {
        const start = random(2, 75);
        const end = random(start + 10, 99);

        if (used.has(start) || used.has(end)) continue;

        ladders.push({ start, end });
        used.add(start);
        used.add(end);
    }

    return { snakes, ladders };
}