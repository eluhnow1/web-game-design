# Game Project Setup Guide

## Initial Setup

### Package Installation
1. Install required packages:
   ```bash
   npm install phaser@v3.87.0
   npm install matter-js
   ```

### Tilemap Editor Setup
1. Install the Tiled map editor:
   - Download from [https://www.mapeditor.org/](https://www.mapeditor.org/)
   - Import tileset files from the assets folder
   - When editing is complete, save as `tilemap.json`

### Development Server
1. Start the local development server:
   ```bash
   firebase serve
   ```

## Code Structure

### Key Components

#### Level System (`level.js`)
The level system contains critical functionality for game mechanics:

- **Primary Function**: `createCollisionBodies`
  - Purpose: Handles collision detection for foreground tiles from the tilemap
  - Location: Found in `level.js`
  - Role: Essential for game physics and interactions

#### Player System
The player class includes various movement-related methods:
- Handles different types of player movement
- Controls player physics and interactions
- Manages player states and animations

### Development Notes
- Most code modifications will be made in `level.js`
- Focus on the collision system when making gameplay adjustments
- Ensure tilemap changes are properly saved before testing