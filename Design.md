# Initial Description
A 2D puzzle platformer where the player only starts with the ability to move in one direction. The player has to collect a pickup that grants them the next type of movement. The order of movements is as follows: left, crouch, jump, swim, dash, double jump, wall jump (with more to be potentially added later). To acquire each new movement, the player must solve one or more puzzles or platforming challenges with their current moveset. The game takes place in a single large level (with some backtracking). There may also be multiple levels where players start with different controls and pick them up in a varied order.

## Game Title:
- **“Out of Control”** 


## 2. Purpose of the Game
- **Goal**: Provide a challenging but unique puzzle experience where the player controls a character in a 2D puzzle platformer. The player starts with only the ability to move in one direction, and the goal is to collect all the controls and reach the end of the stage.
- **Target Audience**:
  - **Age Group**: 30 and under - people who understand video games
  - **Interests**: Puzzle and platformer lovers

### Core Features
- **Progressive Ability Unlocks**: Players start with only the ability to move in one direction (right). Each new movement ability (e.g., left, crouch, jump, swim, dash, double jump, wall jump) is unlocked by collecting specific pickups, allowing more complex navigation and environmental interaction.
- **Single, Expansive Level with Backtracking**: The game is one continuous, interconnected level that encourages exploration. Backtracking is required to access previously inaccessible areas after new movement abilities are unlocked.
- **Puzzle and Platforming Challenges**: Players must solve puzzles or complete platforming challenges to earn each new movement using only the abilities they've unlocked so far, creating unique and layered difficulties at each stage of progression.
- **Variable Starting Conditions (Multilevel Mode)**: Multiple levels allow players to start with different initial movement restrictions and pick up abilities in a varied order, adding fresh challenges.

## User Flow
- **Start Screen**:
  - **Buttons**: Start Game, Instructions
  - **Instructions**: Overview of controls, game mechanics, and objectives.
- **Gameplay**:
  - **Objective**: Navigate the level, solve puzzles and platforming challenges, collect movement pickups, and explore newly accessible areas.
  - **Progression**: Each collected ability opens access to new paths and puzzles.
  -**Coins**: Add coins throughout the level, and there will be a shop in the main menu where cosmetics can be bought. (I will add in the coins and cosmetics at a later time)
- **Ability Unlock Sequence**: Each new ability includes a mini-tutorial popup or hint showing how to use it.
- **Game Over Screen**:
  - If the player falls into a trap or dies, they respawn at the last checkpoint (checkpoint at each ability pickup).
  - **Options**: Go to Last Checkpoint, Return to Start Screen.
- **Endgame**: After collecting all abilities and reaching the final area, the player completes the level and unlocks new levels with altered ability sequences for added replayability.

## Mechanics
- **Movement**: Movement abilities are progressively unlocked, adding new platforming and puzzle-solving mechanics with each pickup.
  - **Dash**: Usable only once in the air; refreshes when the player touches the ground.
- **Puzzle/Platforming Challenges**: Unique puzzles designed for each ability set (e.g., using only right and left movement to solve an early puzzle or later combining crouch and jump to clear obstacles).
  - **Wall Jump**: Allows the player to slide on walls and jump off if the opposite directional key is held when the jump key is tapped.
- **Backtracking and Exploration**: The level encourages backtracking, with certain paths only accessible once specific abilities are unlocked. Players must revisit areas to uncover secrets and progress.
  - **Optional Collectibles**: Hidden areas provide additional challenges for completionists.
- **Checkpoints and Respawning**: Checkpoints save player progress within the level. If the player dies or falls, they respawn at the last checkpoint.
- **Puzzle-Specific Mechanics**: Some mechanics are specific to one or two puzzles, such as bullet bill shooters, ice physics, and pressure plates.

## Interactive Elements
- **HUD (Heads-Up Display)**:
  - **Ability Display**: Icons for each unlocked movement ability, grayed out for abilities not yet collected.
  - **Objective Indicator**: Shows the current target (e.g., "Collect the Jump Pickup").
  - **Progress Bar**: Shows overall completion of the level or area.
- **Buttons**:
  - **Pause**: Accessible during gameplay with options to resume, adjust settings, or return to the main menu.
  - **Settings**: Allows adjustment of sound, music, and control preferences.

## Puzzle and Platforming Mechanics:
- **Shooter**: Periodically shoots projectiles until they hit a wall or the player (respawn at checkpoint upon contact).
- **Spring**: Launches the player into the air upon stepping on it.
- **Cage**: Disappears when triggered (e.g., pressure plate or enemy defeat).
- **Key**: Opens a cage or door when collected. Yellow lines indicate connections.
- **Ladder**: Climbable when the player holds the up key, available at any stage in progression.
- **Moving Platforms**: Platforms that move, with paths shown by black lines.
- **Crumbling Platforms**: Shakes when the player stands on it, breaks in 1.5 seconds, and respawns after ~10 seconds.
- **Sawblade**: Kills the player upon contact.
- **Breakable Wall**: Breaks if the player dashes into it.
- **Special Key**: Starts a timer—removes a cage for a set time, then restores it. Timer duration is adjustable.
- **Star**: Completes the level when collected.

## Aesthetics
- **Level Layout**: Vertical and side-scrolling. The camera zoom and player centering are left to the programmer's discretion.
- **Themes**: Each level should have a different environmental theme, with varying floor colors and pixel art backgrounds.
  - **Examples**:
    - ![](https://github.com/mcommons33/Edwins-web-game-design/blob/main/design-aesthetics/desert.png)
    - ![](https://github.com/mcommons33/Edwins-web-game-design/blob/main/design-aesthetics/forest.png)

## Levels
- **Yellow Circle**: Player spawn point.
- **Black Rectangles**: Placeholder for tiles from the tileset.
- **Level 1**: Order of pickups: left, crouch, jump, dash, double jump, wall jump.
  - ![](https://github.com/mcommons33/Edwins-web-game-design/blob/main/assets/levels/level1.png)
