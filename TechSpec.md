# Technical Specification

## Technical Requirements

### Programming Languages

- JavaScript: Core language for game mechanics, logic, and dynamic behaviors.
- TypeScript (optional): Adds static typing to enhance maintainability and reduce runtime errors.
- HTML5: Structure of the game canvas and DOM elements.
- CSS3: Styling the user interface elements like menus, HUD, and pause screens.

### Frameworks & Game Engines

- Phaser 3: A fast, easy-to-use HTML5 game framework for building 2D games with extensive support for physics, animations, and input controls.

### Development Tools

- Tiled: A level design tool that allows creating tile-based maps, which can be easily imported into the game engine.
- Node.js & npm: Useful for setting up a development environment, running build tools, and managing project dependencies.

### Physics Engine

- Matter.js: A powerful physics engine integrated with Phaser for handling object collisions, platformer mechanics (e.g., jumping, dashing), and environmental interactions (e.g., moving platforms, spring mechanics).

## *Game Architecture*

Structure

- The structure of the game is built around Phaser.js for rendering and input, while Matter.js handles all physics and collisions. The core components include the GameManager for controlling the game flow, the Player class to represent the main character with physics-based movement and abilities, and the Level class that manages the environment, including tiles, hazards, and pickups. Additional classes, like UIManager, handle the user interface and sound. The architecture simplifies movement and interaction by leveraging Phaser’s input system and Matter.js’s physics engine for tasks like gravity and collisions.

Game Logic

- The game logic centers around player movement and environmental interaction. The player can move using arrow keys, jump with the spacebar, and dash using a designated key. Levels are structured with platforms, hazards, and pickups that the player interacts with as they progress. Matter.js handles collisions between the player and level elements, like falling off platforms or hitting hazards, while Phaser’s scene management transitions between game states (e.g., paused, game over). The game loop continuously updates the player’s position, velocity, and interactions within the environment.

### *Classes, Objects, Variables,*

### Read the Architecture, then look at the figma at the bottom

## Game Architecture for "Out of Control" (Phaser.js + Matter.js)

### 1. Core Components

#### 1.1 GameManager Class (Phaser.Scene)

**Responsibilities**: Manages game flow, scenes, and transitions between levels using Phaser’s scene management.

- **Attributes**:
  - `currentLevel`: (Level) The active level being played.
  - `player`: (Player) The player object.
  - `UIManager`: (UIManager) Manages the game’s UI and sound.
  - `gameState`: (String) "menu", "playing", "paused", "gameover".

- **Methods**:
  - `startGame()`: Loads the first level and begins the game.
  - `loadLevel(levelId: String)`: Loads the specific level using the scene management system.
  - `pauseGame()`: Pauses the game and brings up the pause menu.
  - `resumeGame()`: Resumes gameplay.
  - `endGame()`: Ends the game and triggers the game over screen.
  - `update(time, delta)`: The main game loop, called by Phaser on every frame. Updates game objects and manages state transitions.

---

### 2. Player Class (Phaser.GameObjects.Sprite with Matter.js physics)

#### *[Phaser Physics Docs](https://docs.phaser.io/phaser/concepts/physics/matter)*

**Responsibilities**: Represents the player character, including movement and interaction with abilities. Uses Matter.js for physics.

- **Attributes**:
  - `sprite`: (Phaser.GameObjects.Sprite) The visual representation of the player, with Matter.js physics body attached.
  - `abilities`: (Array of String) Unlocked abilities (e.g., dash).
  - `currentHealth`: (int) Player's health.
  - `isAlive`: (boolean) Whether the player is alive or dead.
  - `currentAnimation`: (String) The currently active animation (e.g., 'idle', 'run', 'jump').
  - `anims`: (Phaser.Animations.AnimationManager) Animation manager responsible for playing animations.
- **Methods**:

  - `unlockAbility(newAbility: String)`: Adds a new ability (e.g., dash) to the player’s capabilities.
  - `respawn()`: Moves the player to a respawn point if they die.
  - `playAnimation(animationKey: String)`: Plays the specified animation for the player sprite.
  - `moveLeft()`: Applies leftward velocity and triggers the run-left animation.
  - `moveRight()`: Applies rightward velocity and triggers the run-right animation.
  - `jump()`: Applies vertical velocity and triggers the jump animation.
  - `update()`: Updates the player’s state each frame, including animation changes.
  - `crouch()`: Changes the player’s sprite using the crouchwalk png's
  - `dash()`: Extra veloctity applied in the direction you are facing. Triggers the dash animaiton

**Note on Input**: Phaser handles input using its built-in event system (`this.input.keyboard.on()`), directly modifying the player's velocity and state within this class.

---

### 3. Level Class (Phaser.Tilemaps.Tilemap with Matter.js physics)

**Responsibilities**: Represents an individual level, including tiles, hazards, and pickups. Uses Phaser’s Tilemap system and Matter.js physics for interaction and collision.

- **Attributes**:
  - `tilemap`: (Phaser.Tilemaps.Tilemap) The layout of the level, with tiles.
  - `pickups`: (Array of Pickup) Collectibles in the level that grant new abilities.
  - `hazards`: (Array of Hazard) Harmful elements in the level.
  - `exit`: (Phaser.GameObjects.Sprite) The level exit goal for the player.

- **Methods**:
  - `loadLevel(levelData: Object)`: Loads the level, including tilemap, pickups, hazards, and exits.
  - `checkForCompletion()`: Detects if the player has reached the exit point.
  - `resetLevel()`: Resets the level upon player death.

---

### 4. Game Objects

#### 4.1 Tile Class (Phaser.Tilemaps.TilemapLayer with Matter.js)

**Responsibilities**: Represents individual tiles or platforms in the environment. Uses Matter.js for collision detection and interaction with the player.

- **Attributes**:
  - `position`: (Coordinate) The tile’s position in the world.
  - `type`: (String) The type of tile (e.g., platform, hazard).
  - `isSolid`: (boolean) Whether the tile is solid and can block player movement.

- **Methods**:
  - `onPlayerContact()`: Handles what happens when the player contacts the tile (e.g., stand on platform or hit a hazard).

---

#### 4.2 Pickup Class (Phaser.GameObjects.Sprite with Matter.js)

**Responsibilities**: Represents a collectible that grants the player new abilities (e.g., dashing or double-jump).

- **Attributes**:
  - `type`: (String) The type of ability granted by the pickup.
  - `position`: (Coordinate) The pickup's location in the world.

- **Methods**:
  - `collect()`: When the player collides with the pickup, the ability is unlocked, and the pickup is removed from the scene.

---

#### 4.3 Hazard Class (Phaser.GameObjects.Sprite with Matter.js)

**Responsibilities**: Represents harmful objects, such as spikes, fire, or moving hazards, that can damage or kill the player.

- **Attributes**:
  - `position`: (Coordinate) The hazard’s position.
  - `damage`: (int) Amount of damage done to the player on contact.

- **Methods**:
  - `onPlayerContact()`: Reduces the player's health or kills them if they contact the hazard.

---

#### 4.4 MovingPlatform Class (Phaser.GameObjects.Sprite with Matter.js)

**Responsibilities**: Represents platforms that move along a fixed path using Matter.js physics. Can carry the player if they stand on it.

- **Attributes**:
  - `path`: (Array of Coordinates) The path the platform follows.
  - `speed`: (float) Speed of platform movement.

- **Methods**:
  - `move()`: Moves the platform along its predefined path.
  - `checkForPlayer()`: Detects if the player is standing on the platform and moves them with it.

---

### 5. UI and Sound Management

#### 5.1 UIManager Class

**Responsibilities**: Manages the heads-up display (HUD), menus, and sound settings (music, sound effects) within the game.

- **Attributes**:
  - `HUD`: (Object) Displays player health, abilities, and progress.
  - `pauseMenu`: (Object) The in-game pause menu.
  - `musicVolume`: (float) The background music volume level.
  - `soundEffectsVolume`: (float) The sound effects volume level.

- **Methods**:
  - `renderHUD()`: Displays player health, unlocked abilities, and level progress.
  - `showPauseMenu()`: Brings up the pause menu.
  - `playMusic(track: String)`: Plays background music using Phaser’s audio system.
  - `playSoundEffect(effect: String)`: Plays sound effects (e.g., jump, dash, collect pickup).
  - `adjustMusicVolume(volume: float)`: Adjusts music volume.
  - `adjustSoundEffectsVolume(volume: float)`: Adjusts sound effects volume.

---

### 6. Physics and Collision Detection (Handled by Matter.js)

Matter.js is integrated into Phaser to handle all physics and collisions automatically, including gravity, velocity, and object interaction.

- **Gravity**: Global gravity is set using Matter.js, typically applying downward force to the player and other objects.
  
- **Collisions**: Matter.js handles collisions between the player and the environment (tiles, platforms), as well as hazards and pickups. Collisions are automatically detected, and custom logic is defined in methods like `onPlayerContact()`.

- **Velocity**: Player velocity is controlled using Matter.js physics, applying forces and setting velocities directly on the player's Matter.js body.

---

### 7. Input Handling (Phaser Input System)

Phaser’s built-in input system is used to manage all player inputs, such as moving, jumping, and dashing:

- **Arrow Keys**: Left and right arrow keys move the player horizontally.
- **Spacebar**: Spacebar makes the player jump.
- **Dash Key**: A designated key (e.g., Shift) triggers the dash ability.

Input handling is directly tied to the player’s physics, modifying velocity or triggering actions within the player’s methods.

## FIGMA

[here](https://www.figma.com/board/SoJsSq7DXtvtVSMB8vQPK7/OutOfControl?node-id=0-1&node-type=canvas&t=guqSOafY6HJ0ajg3-0)
