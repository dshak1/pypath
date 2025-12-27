# Python & Algorithm Learning Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.8+-yellow)](https://www.python.org/)
[![Pygame](https://img.shields.io/badge/Pygame-2.0+-red)](https://www.pygame.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)](https://vercel.com/)

An interactive web-based maze game that teaches pathfinding algorithms through hands-on coding challenges. Players write Python-like code to navigate mazes while learning fundamental computer science concepts.

![Algorithm Visualizer Demo](./public/algvis.png)


Features

- Interactive maze navigation with real-time code execution
- Pathfinding algorithm visualization
- Progressive difficulty levels (levels 2-4 are still in progress)
- Leaderboard system (mock data used for now)

Tech Stack

Frontend
- Next.js 14 ( React framework with App Router)
- typeScript


Game Engine
- Python - Core game logic
- Pygame - Graphics and game loop
- Custom Engine - Pathfinding algorithms and agent system

Getting Started

Prerequisites
- Node.js 18+ and npm
- Python 3.8+

Installation

1. clone the repositor
   git clone https://github.com/dshak1/pypath.git
   cd pypath
   

2. install frontend dependencies
   ```bash
   # Using pnpm (recommended)
   pnpm install
   
   # Or using npm
   npm install
   ```

3. install python dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Run dev server
   pnpm dev
   Navigate to [http://localhost:3000](http://localhost:3000)

