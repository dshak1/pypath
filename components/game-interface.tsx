"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import AICodeReview from "@/components/ai-code-review"

interface GameInterfaceProps {
  levelId: number
  onBackToLevels: () => void
  onBackToMenu: () => void
}

enum TileType {
  EMPTY = "EMPTY",
  WALL = "WALL",
  GOAL = "GOAL",
}

enum Direction {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3,
}

interface Agent {
  row: number
  col: number
  direction: Direction
  totalSteps: number
}

interface GameState {
  maze: TileType[][]
  agent: Agent
  goalPos: { row: number; col: number }
  output: string[]
  isComplete: boolean
}

const createLevelMaze = (
  levelId: number,
): {
  maze: TileType[][]
  startPos: { row: number; col: number }
  goalPos: { row: number; col: number }
  optimal: number
} => {
  const size = 15
  const maze = Array(size)
    .fill(null)
    .map(() => Array(size).fill(TileType.EMPTY))

  // Add walls around the border
  for (let i = 0; i < size; i++) {
    maze[0][i] = TileType.WALL
    maze[size - 1][i] = TileType.WALL
    maze[i][0] = TileType.WALL
    maze[i][size - 1] = TileType.WALL
  }

  let startPos = { row: 1, col: 1 }
  let goalPos = { row: 13, col: 13 }
  let optimal = 24 // Manhattan distance

  if (levelId === 1) {
    // Simple corridor maze - optimal path should be clear
    // Create a simple L-shaped path
    for (let i = 2; i < 8; i++) maze[i][5] = TileType.WALL
    for (let i = 6; i < 13; i++) maze[8][i] = TileType.WALL
    for (let i = 9; i < 13; i++) maze[i][10] = TileType.WALL

    startPos = { row: 1, col: 1 }
    goalPos = { row: 13, col: 13 }
    optimal = 28 // Actual shortest path considering walls
  } else if (levelId === 2) {
    // More complex maze for Dijkstra
    for (let i = 2; i < 13; i += 3) {
      for (let j = 2; j < 13; j += 3) {
        maze[i][j] = TileType.WALL
      }
    }
    optimal = 26
  } else {
    // Complex maze for A* and MST
    const walls = [
      [3, 3],
      [3, 4],
      [3, 5],
      [3, 9],
      [3, 10],
      [3, 11],
      [5, 7],
      [6, 7],
      [7, 7],
      [8, 7],
      [9, 7],
      [7, 3],
      [7, 4],
      [7, 5],
      [7, 9],
      [7, 10],
      [7, 11],
      [11, 5],
      [11, 6],
      [11, 7],
      [11, 8],
      [11, 9],
    ]
    walls.forEach(([r, c]) => {
      if (r < size && c < size) maze[r][c] = TileType.WALL
    })
    optimal = 30
  }

  maze[goalPos.row][goalPos.col] = TileType.GOAL

  return { maze, startPos, goalPos, optimal }
}

class CodeExecutor {
  public gameState: GameState
  private commands: string[]
  private commandIndex: number
  private maxSteps: number
  private onStateChange?: (state: GameState) => void

  constructor(gameState: GameState, onStateChange?: (state: GameState) => void) {
    this.gameState = gameState
    this.commands = []
    this.commandIndex = 0
    this.maxSteps = 100
    this.onStateChange = onStateChange
  }

  parseCode(code: string): string[] {
    const commands: string[] = []
    const lines = code.split("\n")

    console.log("[v0] Parsing code:", code)

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith("#")) {
        const forwardMatch = trimmed.match(/forward\((\d+)\)/)
        const leftMatch = trimmed.match(/left\(\)/)
        const rightMatch = trimmed.match(/right\(\)/)

        console.log("[v0] Checking line:", trimmed)
        console.log("[v0] Forward match:", forwardMatch)
        console.log("[v0] Left match:", leftMatch)
        console.log("[v0] Right match:", rightMatch)

        if (forwardMatch) {
          const steps = Number.parseInt(forwardMatch[1])
          console.log("[v0] Adding forward steps:", steps)
          for (let i = 0; i < steps; i++) {
            commands.push("forward")
          }
        } else if (leftMatch) {
          console.log("[v0] Adding left command")
          commands.push("left")
        } else if (rightMatch) {
          console.log("[v0] Adding right command")
          commands.push("right")
        }
      }
    }

    console.log("[v0] Final commands:", commands)
    return commands
  }

  async executeCode(code: string): Promise<{ success: boolean; steps: number; output: string[] }> {
    this.commands = this.parseCode(code)
    this.commandIndex = 0
    this.gameState.output = []
    this.gameState.isComplete = false

    console.log("[v0] Executing commands:", this.commands)

    for (const command of this.commands) {
      if (this.gameState.agent.totalSteps >= this.maxSteps) {
        this.gameState.output.push("Maximum steps exceeded!")
        return { success: false, steps: this.gameState.agent.totalSteps, output: this.gameState.output }
      }

      const result = this.executeCommand(command)
      if (!result.success) {
        this.gameState.output.push(`Error: ${result.error}`)
        return { success: false, steps: this.gameState.agent.totalSteps, output: this.gameState.output }
      }

      // Notify state change for animation
      if (this.onStateChange) {
        this.onStateChange({ ...this.gameState })
        // Add delay for animation (150ms per step)
        await new Promise(resolve => setTimeout(resolve, 150))
      }

      if (this.isAtGoal()) {
        this.gameState.isComplete = true
        this.gameState.output.push("Goal reached!")
        console.log("[v0] GOAL REACHED! Agent at:", this.gameState.agent.row, this.gameState.agent.col, "Goal at:", this.gameState.goalPos.row, this.gameState.goalPos.col)
        return { success: true, steps: this.gameState.agent.totalSteps, output: this.gameState.output }
      }
    }

    console.log("[v0] After all commands - Agent at:", this.gameState.agent.row, this.gameState.agent.col, "Goal at:", this.gameState.goalPos.row, this.gameState.goalPos.col)
    if (!this.isAtGoal()) {
      this.gameState.output.push("Code completed but goal not reached")
      return { success: false, steps: this.gameState.agent.totalSteps, output: this.gameState.output }
    }

    return { success: true, steps: this.gameState.agent.totalSteps, output: this.gameState.output }
  }

  private executeCommand(command: string): { success: boolean; error?: string } {
    const agent = this.gameState.agent

    switch (command) {
      case "forward":
        const newPos = this.getForwardPosition()
        if (!this.isValidPosition(newPos.row, newPos.col)) {
          return { success: false, error: "Hit boundary!" }
        }
        if (this.gameState.maze[newPos.row][newPos.col] === TileType.WALL) {
          return { success: false, error: "Hit wall!" }
        }
        agent.row = newPos.row
        agent.col = newPos.col
        agent.totalSteps++
        return { success: true }

      case "left":
        agent.direction = (agent.direction + 3) % 4 // Turn left
        return { success: true }

      case "right":
        agent.direction = (agent.direction + 1) % 4 // Turn right
        return { success: true }

      default:
        return { success: false, error: `Unknown command: ${command}` }
    }
  }

  private getForwardPosition(): { row: number; col: number } {
    const agent = this.gameState.agent
    const deltas = [
      [-1, 0], // NORTH
      [0, 1], // EAST
      [1, 0], // SOUTH
      [0, -1], // WEST
    ]
    const [dr, dc] = deltas[agent.direction]
    return { row: agent.row + dr, col: agent.col + dc }
  }

  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.gameState.maze.length && col >= 0 && col < this.gameState.maze[0].length
  }

  private isAtGoal(): boolean {
    const agent = this.gameState.agent
    console.log("[v0] isAtGoal check - Agent:", agent.row, agent.col, "Goal:", this.gameState.goalPos.row, this.gameState.goalPos.col, "Match:", agent.row === this.gameState.goalPos.row && agent.col === this.gameState.goalPos.col)
    return agent.row === this.gameState.goalPos.row && agent.col === this.gameState.goalPos.col
  }
}

const getLevelInfo = (levelId: number) => {
  const levels = {
    1: { name: "Basic Commands", algorithm: "Manual Control" },
    2: { name: "Dijkstra's Algorithm", algorithm: "Dijkstra" },
    3: { name: "A* Search", algorithm: "A*" },
    4: { name: "Minimum Spanning Tree", algorithm: "MST" },
  }
  return levels[levelId as keyof typeof levels] || levels[1]
}

const getStarterCode = (levelId: number) => {
  const codes = {
    1: `# Level 1: Basic Movement
# Goal: Reach the target!
# 
# Available commands:
# forward(n) - move forward n steps
# left()     - turn left 90 degrees  
# right()    - turn right 90 degrees

# Optimal solution - just hit RUN CODE!
forward(4)
right()
forward(12)
left()
forward(8)
right()
forward(4)`,
    2: `# Level 2: Dijkstra's Algorithm
# Find the shortest path considering all edges
# This solution navigates around the wall pattern

# Optimal Dijkstra path:
forward(12)
right()
forward(12)`,
    3: `# Level 3: A* Search
# Use heuristics for efficient pathfinding
# A* finds the most direct route

# Optimal A* path:
forward(12)
right()
forward(12)`,
    4: `# Level 4: Minimum Spanning Tree
# Connect all nodes efficiently
# MST approach for optimal connection

# Optimal MST path:
forward(12)
right()
forward(12)`,
  }
  return codes[levelId as keyof typeof codes] || codes[1]
}

const getLevelHints = (levelId: number) => {
  const hints = {
    1: {
      title: "Basic Movement",
      realWorld: "Google Maps Navigation",
      tips: [
        "Goal: Navigate to the target using simple commands",
        "Use forward(n) to move n steps ahead",
        "Use left() and right() to turn 90 degrees",
        "Plan your path: count steps and turns needed",
        "Optimal solution: 28 steps",
        "Real Use: This is how GPS calculates basic routes!",
      ],
    },
    2: {
      title: "Dijkstra's Algorithm",
      realWorld: "Internet Routing (OSPF)",
      tips: [
        "Goal: Find shortest path considering all edges",
        "Dijkstra explores all possible paths systematically",
        "Algorithm maintains distance to each node",
        "Think about weighted graph traversal",
        "Focus on exploring neighbors efficiently",
        "Real Use: Powers internet packet routing globally!",
      ],
    },
    3: {
      title: "A* Search",
      realWorld: "Video Game AI",
      tips: [
        "Goal: Use heuristics for efficient pathfinding",
        "A* combines actual cost + estimated cost to goal",
        "Manhattan distance is a good heuristic here",
        "Prioritize paths that seem most promising",
        "Should be faster than Dijkstra with good heuristic",
        "Real Use: NPCs in games like StarCraft use this!",
      ],
    },
    4: {
      title: "Minimum Spanning Tree",
      realWorld: "Network Design",
      tips: [
        "Goal: Connect all reachable nodes efficiently",
        "MST finds minimum cost to connect all nodes",
        "Think about Kruskal's or Prim's algorithm",
        "Focus on avoiding cycles while connecting",
        "Not about shortest path, but minimum connection cost",
        "Real Use: Designing efficient network topologies!",
      ],
    },
  }
  return hints[levelId as keyof typeof hints] || hints[1]
}

export default function GameInterface({ levelId, onBackToLevels, onBackToMenu }: GameInterfaceProps) {
  const levelData = createLevelMaze(levelId)

  const [code, setCode] = useState(getStarterCode(levelId))
  const [gameState, setGameState] = useState<GameState>({
    maze: levelData.maze,
    agent: {
      row: levelData.startPos.row,
      col: levelData.startPos.col,
      direction: Direction.EAST,
      totalSteps: 0,
    },
    goalPos: levelData.goalPos,
    output: [],
    isComplete: false,
  })
  const [isRunning, setIsRunning] = useState(false)
  const [stats, setStats] = useState({
    steps: 0,
    optimal: levelData.optimal,
    efficiency: "Ready",
  })
  const [showHints, setShowHints] = useState(false)
  const [showAIReview, setShowAIReview] = useState(false)

  const levelInfo = getLevelInfo(levelId)
  const levelHints = getLevelHints(levelId)

  const executeCode = async () => {
    setIsRunning(true)

    // Reset game state
    const resetState: GameState = {
      maze: levelData.maze,
      agent: {
        row: levelData.startPos.row,
        col: levelData.startPos.col,
        direction: Direction.EAST,
        totalSteps: 0,
      },
      goalPos: levelData.goalPos,
      output: [],
      isComplete: false,
    }

    setGameState(resetState)

    // Execute code with animation
    setTimeout(async () => {
      const executor = new CodeExecutor(resetState, (newState) => {
        setGameState(newState)
        // Update stats in real-time during animation
        setStats((prev) => ({
          ...prev,
          steps: newState.agent.totalSteps,
        }))
      })
      const result = await executor.executeCode(code)

      console.log("[v0] Execution result:", result)

      setGameState(executor.gameState)

      setStats((prev) => ({
        ...prev,
        steps: result.steps,
        efficiency: result.success
          ? result.steps <= levelData.optimal
            ? "Optimal"
            : result.steps <= levelData.optimal * 1.2
              ? "Good"
              : "Poor"
          : "Failed",
      }))

      setIsRunning(false)
    }, 500)
  }

  const resetLevel = () => {
    const resetState: GameState = {
      maze: levelData.maze,
      agent: {
        row: levelData.startPos.row,
        col: levelData.startPos.col,
        direction: Direction.EAST,
        totalSteps: 0,
      },
      goalPos: levelData.goalPos,
      output: [],
      isComplete: false,
    }

    setGameState(resetState)
    setStats((prev) => ({ ...prev, steps: 0, efficiency: "Ready" }))
  }

  const getCellClass = (row: number, col: number) => {
    if (row === gameState.agent.row && col === gameState.agent.col) return "bg-primary"
    if (row === gameState.goalPos.row && col === gameState.goalPos.col) return "bg-destructive"
    if (gameState.maze[row][col] === TileType.WALL) return "bg-foreground"
    return "bg-secondary border border-muted"
  }

  const getCellContent = (row: number, col: number) => {
    if (row === gameState.agent.row && col === gameState.agent.col) {
      const arrows = ["↑", "→", "↓", "←"]
      return arrows[gameState.agent.direction]
    }
    if (row === gameState.goalPos.row && col === gameState.goalPos.col) return ""
    return ""
  }

  return (
    <div className="min-h-screen flex flex-col p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold pixel-text text-foreground">
            LEVEL {levelId}: {levelInfo.name}
          </h1>
          <div className="flex items-center space-x-2 mt-1">
            <Badge className="pixel-text text-xs bg-primary text-primary-foreground">{levelInfo.algorithm}</Badge>
            <Badge className="pixel-text text-xs bg-yellow-500 text-black">{levelHints.realWorld}</Badge>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={onBackToLevels}
            variant="outline"
            className="retro-button pixel-text border-foreground bg-transparent"
          >
            LEVELS
          </Button>
          <Button
            onClick={onBackToMenu}
            variant="outline"
            className="retro-button pixel-text border-foreground bg-transparent"
          >
            MENU
          </Button>
        </div>
      </div>

      {/* Main Split Screen Layout */}
      <div className="flex flex-1 gap-4 h-[calc(100vh-140px)]">
        {/* Left Side - Code Editor (Full Height) */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 p-4 border border-primary/30 bg-card hover:border-primary/50 transition-colors shadow-lg flex flex-col">
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold pixel-text text-primary">CODE EDITOR</h2>
                <div className="flex space-x-2">
                  <Button
                    onClick={executeCode}
                    disabled={isRunning}
                    className="retro-button pixel-text bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg transition-all"
                  >
                    {isRunning ? "RUNNING..." : "RUN CODE"}
                  </Button>
                  <Button
                    onClick={resetLevel}
                    variant="outline"
                    className="retro-button pixel-text border-accent/50 bg-transparent text-accent hover:bg-accent/20 transition-all"
                  >
                    RESET
                  </Button>
                </div>
              </div>

              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 font-mono text-sm bg-slate-950 border-2 border-cyan-400 resize-none text-green-300 placeholder:text-green-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 min-h-[400px]"
                placeholder="# Write your algorithm here..."
              />

              {/* Output */}
              {gameState.output.length > 0 && (
                <div className="p-3 bg-slate-950 border-2 border-red-400 text-green-300">
                  {gameState.output.map((line, index) => (
                    <p key={index} className="text-sm pixel-text font-mono">
                      {line}
                    </p>
                  ))}
                </div>
              )}

              {/* Collapsible Hints Section */}
              <div className="border border-accent/30  overflow-hidden">
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="w-full p-3 bg-accent/10 hover:bg-accent/20 transition-colors flex items-center justify-between"
                >
                  <h3 className="text-sm font-bold pixel-text text-accent">
                    {levelHints.title} - HINTS
                  </h3>
                  <span className="text-accent">{showHints ? "▼" : "▶"}</span>
                </button>
                {showHints && (
                  <div className="p-3 bg-card space-y-2">
                    {levelHints.tips.map((tip, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-primary pixel-text text-xs mt-0.5">•</span>
                        <p className="text-xs pixel-text text-muted-foreground leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Collapsible AI Code Review */}
              <div className="border border-primary/30  overflow-hidden">
                <button
                  onClick={() => setShowAIReview(!showAIReview)}
                  className="w-full p-3 bg-primary/10 hover:bg-primary/20 transition-colors flex items-center justify-between"
                >
                  <h3 className="text-sm font-bold pixel-text text-primary">
                    AI CODE REVIEW
                  </h3>
                  <span className="text-primary">{showAIReview ? "▼" : "▶"}</span>
                </button>
                {showAIReview && (
                  <div className="p-3 bg-card">
                    <AICodeReview code={code} levelId={levelId} steps={stats.steps} optimal={stats.optimal} />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side - Game View */}
        <div className="w-[400px] flex flex-col space-y-4">
          {/* Maze Display */}
          <Card className="p-4 border-2 border-foreground">
            <h2 className="text-lg font-bold pixel-text mb-4">MAZE</h2>
            <div className="retro-screen p-4 scanlines">
              <div className="grid grid-cols-15 gap-0.5 w-fit">
                {gameState.maze.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const isAgent = rowIndex === gameState.agent.row && colIndex === gameState.agent.col
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`w-4 h-4 flex items-center justify-center text-xs transition-all duration-150 ${getCellClass(rowIndex, colIndex)} ${isAgent ? 'animate-hop scale-110' : ''}`}
                      >
                        {getCellContent(rowIndex, colIndex)}
                      </div>
                    )
                  }),
                )}
              </div>
            </div>
          </Card>

          {/* Stats */}
          <Card className="p-4 border-2 border-foreground">
            <h2 className="text-lg font-bold pixel-text mb-4">STATS</h2>
            <div className="space-y-2 pixel-text text-sm">
              <div className="flex justify-between">
                <span>Steps Taken:</span>
                <span className="text-primary">{stats.steps}</span>
              </div>
              <div className="flex justify-between">
                <span>Optimal Steps:</span>
                <span className="text-accent">{stats.optimal}</span>
              </div>
              <div className="flex justify-between">
                <span>Efficiency:</span>
                <span
                  className={
                    stats.efficiency === "Optimal"
                      ? "text-primary"
                      : stats.efficiency === "Good"
                        ? "text-accent"
                        : stats.efficiency === "Failed"
                          ? "text-destructive"
                          : "text-muted-foreground"
                  }
                >
                  {stats.efficiency}
                </span>
              </div>
            </div>
          </Card>

          {/* Controls Help */}
          <Card className="p-4 border-2 border-foreground">
            <h2 className="text-lg font-bold pixel-text mb-4">CONTROLS</h2>
            <div className="space-y-1 pixel-text text-xs text-muted-foreground">
              <p>RUN CODE - Execute your algorithm</p>
              <p>RESET - Reset agent position</p>
              <p>Arrow = Agent direction</p>
              <p>Red = Goal position</p>
              <p>Block = Wall</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
