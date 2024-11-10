# Technical Requirements

## Programming Languages
 - JavaScript: Core language for game mechanics, logic, and dynamic behaviors.
 - TypeScript (optional): Adds static typing to enhance maintainability and reduce runtime errors.
 - HTML5: Structure of the game canvas and DOM elements.
 - CSS3: Styling the user interface elements like menus, HUD, and pause screens.

## (**CHOOSE ONE OR THE OTHER**) Frameworks & Game Engines
 - Phaser 3: A fast, easy-to-use HTML5 game framework for building 2D games with extensive support for physics, animations, and input controls.
 - PixiJS: A fast 2D rendering engine, ideal for handling the game's graphical elements and performance across various devices.


## Development Tools
 - Tiled: A level design tool that allows creating tile-based maps, which can be easily imported into the game engine.
 - Node.js & npm: Useful for setting up a development environment, running build tools, and managing project dependencies.

## Physics Engine
 - Matter.js: A powerful physics engine integrated with Phaser for handling object collisions, platformer mechanics (e.g., jumping, dashing), and environmental interactions (e.g., moving platforms, spring mechanics).


# *Game Architecture*

Structure
 - Main Game Loop: Managed using Phaser's built-in game loop, handling input, physics, and rendering.
State Management: Use Phaser's state management system to handle different game states (menu, in-game, pause, level completion).
Level Design: Levels designed in Tiled or directly in Phaser’s map editor, using tilemaps for platform placements and object collision definitions.

Game Logic
 - Ability Unlock System: A key component managing player progress through ability unlocks.
Collision Detection: Leveraging Phaser and Matter.js physics to detect player interactions with objects and hazards.
Backtracking System: Implements a way for the player to revisit previously inaccessible areas once new abilities are acquired.

## *Classes, Objects, Variables,*

## 1. **Core Components**

The game architecture is composed of several key classes and systems, each responsible for different aspects of the game. The structure follows a **Model-View-Controller (MVC)** pattern to keep game logic, rendering, and player input separate and maintainable.

## 2. **Main Game Components**

### 2.1 **GameManager Class**
**Responsibilities**: Handles the overall flow and state of the game. Manages initialization, transitions between levels, and the main game loop.

- **Attributes**:
  - `currentLevel`: (Level) The current level object being played.
  - `gameState`: (String) States like "menu", "playing", "paused", or "gameover".
  - `player`: (Player) Reference to the player object.
  - `UIManager`: (UIManager) Manages the UI elements like HUD and pause menus.
  - `inputHandler`: (InputHandler) Handles player inputs and sends them to relevant objects.
  
- **Methods**:
  - `startGame()`: Initializes the game and loads the first level.
  - `loadLevel(levelId: String)`: Loads a new level based on the level ID.
  - `pauseGame()`: Pauses the game and shows the pause menu.
  - `resumeGame()`: Resumes the game from the paused state.
  - `endGame()`: Ends the game and shows the game over screen.
  - `update()`: The main game loop that updates game states, checks for win/loss conditions, and manages level transitions.

---

### 2.2 **Level Class**
**Responsibilities**: Represents the individual game levels, including all elements like platforms, hazards, and pickups.

- **Attributes**:
  - `tileset`: (Array of Tiles) The layout of the level’s tiles (platforms, walls, hazards).
  - `pickups`: (Array of Pickup) Array of pickups like movement abilities.
  - `hazards`: (Array of Hazard) Array of level hazards (e.g., sawblades, crumbling platforms).
  - `enemies`: (Array of Enemy) Optional enemies that create additional challenges.
  - `playerSpawnPoint`: (Coordinate) Where the player starts in the level.
  - `exit`: (Coordinate) The exit point the player must reach to finish the level.

- **Methods**:
  - `loadLevel(levelData: Object)`: Initializes the level using level data (tileset, pickups, etc.).
  - `checkForCompletion()`: Checks if the player has reached the level’s exit.
  - `resetLevel()`: Resets the level if the player dies or respawns at a checkpoint.
  
---

### 2.3 **Player Class**
**Responsibilities**: Manages the player character’s attributes, movement, and ability progression.

- **Attributes**:
  - `position`: (Coordinate) The player’s current position in the game world.
  - `velocity`: (Vector) Tracks the player's movement speed and direction.
  - `abilities`: (Array of String) The list of unlocked abilities (e.g., “move left”, “jump”, “dash”).
  - `currentHealth`: (int) The player’s health, reduced when hit by hazards or enemies.
  - `isAlive`: (boolean) Whether the player is alive or dead.
  
- **Methods**:
  - `move(direction: String)`: Moves the player based on input (e.g., "left", "right").
  - `jump()`: Makes the player jump if the ability is unlocked.
  - `dash()`: Dashes in the direction the player is moving if the ability is unlocked.
  - `crouch()`: Crouches the player if the ability is unlocked.
  - `doubleJump()`: Allows for a second jump in the air if the ability is unlocked.
  - `wallJump()`: Executes a wall jump if the player is near a wall and has unlocked the ability.
  - `updateAbilities(newAbility: String)`: Unlocks a new ability when the player collects a pickup.
  - `respawn()`: Respawns the player at the last checkpoint or the starting point.

---

### 2.4 **InputHandler Class**
**Responsibilities**: Handles all input events (keyboard, mouse, controller) and translates them into in-game actions.

- **Attributes**:
  - `currentInputs`: (Object) Stores the current key/button presses.
  
- **Methods**:
  - `handleKeyPress(event: KeyEvent)`: Processes key presses and forwards them to the player.
  - `handleKeyRelease(event: KeyEvent)`: Handles key releases and updates the player state.
  - `handleControllerInput(event: ControllerEvent)`: Processes controller input for movement, jumping, etc.

---

## 3. **Game Objects**

### 3.1 **Tile Class**
**Responsibilities**: Represents individual tiles that form the environment (e.g., floors, walls, platforms).

- **Attributes**:
  - `position`: (Coordinate) Position of the tile on the game map.
  - `type`: (String) Type of tile (e.g., platform, wall, crumbling platform).
  - `isSolid`: (boolean) Whether the tile is solid (affects collision).
  
- **Methods**:
  - `render()`: Draws the tile on the screen.
  - `onPlayerContact()`: Executes any special logic when the player interacts with the tile (e.g., a crumbling platform breaking).

---

### 3.2 **Pickup Class**
**Responsibilities**: Represents the pickups that grant the player new abilities.

- **Attributes**:
  - `type`: (String) The type of ability that the pickup unlocks (e.g., “jump”, “dash”).
  - `position`: (Coordinate) Where the pickup is located on the map.
  
- **Methods**:
  - `collect()`: Grants the corresponding ability to the player when collected.
  
---

### 3.3 **Hazard Class**
**Responsibilities**: Represents obstacles that harm the player, like sawblades or spikes.

- **Attributes**:
  - `position`: (Coordinate) Position of the hazard on the map.
  - `damage`: (int) The amount of damage inflicted on the player.
  
- **Methods**:
  - `onPlayerContact()`: Reduces player health or triggers death when the player touches the hazard.

---

### 3.4 **MovingPlatform Class**
**Responsibilities**: Represents platforms that move between fixed points.

- **Attributes**:
  - `path`: (Array of Coordinate) The path the platform follows.
  - `speed`: (float) How fast the platform moves.
  
- **Methods**:
  - `move()`: Moves the platform along its path.
  - `checkForPlayer()`: Detects if the player is standing on the platform and moves the player with it.

---

## 4. **UI Components**

### 4.1 **UIManager Class**
**Responsibilities**: Handles all user interface elements like HUD, pause menus, and settings.

- **Attributes**:
  - `HUD`: (Object) Displays player health, unlocked abilities, and progress through the level.
  - `pauseMenu`: (Object) Displays the pause menu with options for settings or exiting the game.
  
- **Methods**:
  - `renderHUD()`: Updates and displays the player's health, abilities, and progress bar.
  - `showPauseMenu()`: Displays the pause menu.
  - `showSettingsMenu()`: Displays settings like sound control, music, and input preferences.

---

## 5. **Physics and Collision Detection**

### 5.1 **PhysicsEngine Class**
**Responsibilities**: Handles the physical interactions between the player, environment, and objects.

- **Attributes**:
  - `gravity`: (float) The gravity affecting the player and objects.
  - `collisionObjects`: (Array) List of objects that the player can collide with.
  
- **Methods**:
  - `applyGravity(object: GameObject)`: Applies gravity to the player and movable objects.
  - `checkCollisions(object: GameObject)`: Detects collisions between objects (e.g., player and platforms, hazards, pickups).
  - `resolveCollisions()`: Resolves what happens when the player collides with solid objects, hazards, or enemies.

---

## 6. **Sound and Music**

### 6.1 **SoundManager Class**
**Responsibilities**: Manages background music and sound effects in the game.

- **Attributes**:
  - `musicVolume`: (float) Current volume level of the background music.
  - `soundEffectsVolume`: (float) Volume level of sound effects.
  
- **Methods**:
  - `playMusic(track: String)`: Plays a specific music track for a level or menu.
  - `playSoundEffect(effect: String)`: Plays a specific sound effect (e.g., jump, dash, pickup).
  - `adjustVolume(volume: float)`: Adjusts the overall sound or music volume.
