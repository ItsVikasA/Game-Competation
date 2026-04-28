# Catch the Falling Objects 🎮

A brutalist-styled arcade game built with Next.js 16, React, TypeScript, and Tailwind CSS. Catch falling objects, level up, and beat your high score!

## Features

- **Brutalist UI Design**: Sharp corners, thick borders, neon colors, and monospace fonts
- **Three Item Types**: Apples (10 pts), Stars (20 pts), Balls (5 pts)
- **Progressive Difficulty**: Speed increases with each level
- **Lives System**: 3 lives to survive
- **Audio Effects**: Web Audio API sound effects for catches, misses, and level ups
- **Visual Feedback**: Particle explosions and score popups
- **Responsive Controls**: Smooth arrow key movement

## Tech Stack

- Next.js 16 (with Turbopack)
- React 19
- TypeScript
- Tailwind CSS
- Lucide React Icons

## Installation

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Controls

- **Move Left**: `←` Arrow Left
- **Move Right**: `→` Arrow Right
- **Restart**: `Enter` or click Restart button

## Game Rules

- Catch items to earn points
- Miss an item and lose a life
- Level up every 150 points
- Game over when all lives are lost

## Scoring

- 🍎 Apple: 10 points
- ⭐ Star: 20 points
- ⚽ Ball: 5 points
