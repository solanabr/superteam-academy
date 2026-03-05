"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GRID_SIZE = 7;
const CELL_PX = 6;
const TICK_MS = 700;

type Pos = { x: number; y: number };

function samePos(a: Pos, b: Pos) {
  return a.x === b.x && a.y === b.y;
}

function randomEmptyPos(snake: Pos[]): Pos {
  const set = new Set(snake.map((p) => `${p.x},${p.y}`));
  let pos: Pos;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (set.has(`${pos.x},${pos.y}`));
  return pos;
}

const INITIAL_SNAKE: Pos[] = [
  { x: 1, y: GRID_SIZE - 1 },
  { x: 0, y: GRID_SIZE - 1 },
];

const INITIAL_FOOD: Pos = { x: GRID_SIZE - 2, y: 1 };

export function PixelSnake() {
  const [snake, setSnake] = useState<Pos[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Pos>(INITIAL_FOOD);
  const foodRef = useRef<Pos>(INITIAL_FOOD);
  foodRef.current = food;

  const tick = useCallback(() => {
    const currentFood = foodRef.current;
    setSnake((prev) => {
      const head = prev[0];
      const bodySet = new Set(prev.slice(1).map((p) => `${p.x},${p.y}`));
      const candidates: Pos[] = [];
      if (currentFood.x !== head.x)
        candidates.push({
          x:
            (head.x + Math.sign(currentFood.x - head.x) + GRID_SIZE) %
            GRID_SIZE,
          y: head.y,
        });
      if (currentFood.y !== head.y)
        candidates.push({
          x: head.x,
          y:
            (head.y + Math.sign(currentFood.y - head.y) + GRID_SIZE) %
            GRID_SIZE,
        });
      if (candidates.length === 0) {
        candidates.push({ x: head.x, y: (head.y - 1 + GRID_SIZE) % GRID_SIZE });
      }
      const newHead =
        candidates.find((p) => !bodySet.has(`${p.x},${p.y}`)) ?? candidates[0];
      const eating = samePos(newHead, currentFood);
      const newBody = eating ? prev : prev.slice(0, -1);
      const newSnake = [newHead, ...newBody];
      if (eating) {
        const nextFood = randomEmptyPos(newSnake);
        foodRef.current = nextFood;
        setFood(nextFood);
      }
      return newSnake;
    });
  }, []);

  useEffect(() => {
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [tick]);

  const snakeSet = new Set(snake.map((p) => `${p.x},${p.y}`));

  return (
    <div
      className="grid shrink-0 gap-px"
      style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_PX}px)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_PX}px)`,
        width: GRID_SIZE * CELL_PX,
        height: GRID_SIZE * CELL_PX,
      }}
    >
      {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
        const x = i % GRID_SIZE;
        const y = Math.floor(i / GRID_SIZE);
        const isSnake = snakeSet.has(`${x},${y}`);
        const isFoodCell = food.x === x && food.y === y;
        let bg = "bg-[hsl(var(--brand-logo-green))]/15 dark:bg-amber-400/20";
        if (isSnake) bg = "bg-amber-400 dark:bg-[hsl(var(--brand-logo-green))]";
        else if (isFoodCell)
          bg = "bg-amber-400 dark:bg-[hsl(var(--brand-logo-green))]";
        return (
          <div
            key={i}
            className={`shrink-0 rounded-none ${bg}`}
            style={{ width: CELL_PX, height: CELL_PX }}
          />
        );
      })}
    </div>
  );
}
