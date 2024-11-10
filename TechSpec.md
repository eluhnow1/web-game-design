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