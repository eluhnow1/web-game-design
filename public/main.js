// gameManager.js
import Player from './player.js';
import Level from './level.js';

// UIManager Class
class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.HUD = {};
        this.pauseMenu = {};
        this.musicVolume = 1;
        this.soundEffectsVolume = 1;
    }

    renderHUD() {
        // To be implemented
    }

    showPauseMenu() {
        // Implement logic to show pause menu
        if (!this.pauseMenu.container) {
            this.pauseMenu.container = this.scene.add.text(400, 300, 'Game Paused', {
                font: '32px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5, 0.5);
        }
        this.pauseMenu.container.setVisible(true);
    }

    hidePauseMenu() {
        if (this.pauseMenu.container) {
            this.pauseMenu.container.setVisible(false);
        }
    }

    playMusic(track) {
        // To be implemented
    }

    playSoundEffect(effect) {
        // To be implemented
    }

    adjustMusicVolume(volume) {
        // To be implemented
    }

    adjustSoundEffectsVolume(volume) {
        // To be implemented
    }
}

// Cannon Class
class Cannon {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.cannon = null;
        this.cannonballs = [];
        this.fireCooldown = false;
    }

    create() {
        // Add cannon image to the scene
        this.cannon = this.scene.add.image(this.x, this.y, 'cannon');
        
        // Add the cannon to the Matter physics world and make it static
        this.scene.matter.add.gameObject(this.cannon, { isStatic: true, label: 'cannon' });
        this.cannon.setOrigin(0.5, 0.5);
        this.cannon.setScale(0.5); // Adjust scale to make the cannon smaller

        // Set up a timed event to fire cannonballs every 2 seconds
        this.scene.time.addEvent({
            delay: 2000,
            callback: this.fire,
            callbackScope: this,
            loop: true
        });
    }

    fire() {
        if (this.fireCooldown) return;
        this.fireCooldown = true;

        // Create a cannonball at the cannon's position
        const cannonball = this.scene.matter.add.image(this.x, this.y, 'cannonball', null, {
            label: 'cannonball',
            restitution: 0.5,
            frictionAir: 0.02
        });
        cannonball.setCircle(cannonball.width * 0.5); // Specify radius for accurate collision
        cannonball.setScale(0.5); // Adjust scale as needed

        // Set initial velocity (adjust as necessary for gameplay)
        const velocityX = Phaser.Math.Between(-5, 5);
        const velocityY = -10;
        cannonball.setVelocity(velocityX, velocityY);

        this.cannonballs.push(cannonball);

        // Reset the fire cooldown after 0.5 seconds
        this.scene.time.delayedCall(500, () => {
            this.fireCooldown = false;
        });
    }

    update() {
        // Iterate through cannonballs and remove those that are off-screen
        this.cannonballs.forEach((cannonball, index) => {
            // Use game config height for accurate boundary
            const gameHeight = this.scene.sys.game.config.height;
            if (cannonball.y > gameHeight) {
                cannonball.destroy();
                this.cannonballs.splice(index, 1);
            }
        });
    }
}

// Main Game Manager Class
class GameManager extends Phaser.Scene {
    constructor() {
        super();
        this.currentLevel = null;
        this.player = null;
        this.UIManager = null;
        this.cannon = null;
        this.gameState = 'playing';
        this.cursors = null;
    }

    preload() {
        this.loadAssets();
    }

    create() { // This function sets frequently used variables and handles player collision with the ground (including animations)
        this.UIManager = new UIManager(this);
        this.currentLevel = new Level(this);
        this.player = new Player(this, 400, 400);
        this.cannon = new Cannon(this, 800, 500); // Ensure (800, 500) is within the visible camera area
        this.setupControls();
        this.currentLevel.create();
        this.cannon.create();

        // Ground collision detection
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach((pair) => {
                if (pair.bodyA.label === 'player' || pair.bodyB.label === 'player') {
                    this.player.resetJump();
                    this.player.canDash = true;
                    this.player.sprite.play('land', true).once('animationcomplete', () => {
                        if (!this.player.sprite.body.velocity.x) {
                            this.player.sprite.play('idle');
                        } else {
                            this.player.sprite.play('walk');
                        }
                    });
                }
            });
        });

        // Optional: Adjust camera zoom for testing visibility
        // Comment out or adjust after confirming cannonballs are visible
        this.cameras.main.setZoom(1);
    }

    update(time, delta) {
        this.player.update();
    }

    loadAssets() { // Loads all animations and tilemap
        // Load sprite sheets
        this.load.spritesheet('idle', './assets/character-sprite-sheets/idle.png', { 
            frameWidth: 100, frameHeight: 64 
        });
        this.load.spritesheet('walking', './assets/character-sprite-sheets/walking.png', { 
            frameWidth: 100, frameHeight: 64 
        });
        this.load.spritesheet('jump', './assets/character-sprite-sheets/jump.png', { 
            frameWidth: 100, frameHeight: 64 
        });
        this.load.spritesheet('falling', './assets/character-sprite-sheets/falling.png', { 
            frameWidth: 100, frameHeight: 64 
        });
        this.load.spritesheet('landing', './assets/character-sprite-sheets/landing.png', { 
            frameWidth: 100, frameHeight: 64 
        });
        this.load.spritesheet('dash', './assets/character-sprite-sheets/dash.png', { 
            frameWidth: 100, frameHeight: 64 
        });
        this.load.spritesheet('crouch', './assets/character-sprite-sheets/crouching.png', { 
            frameWidth: 100, frameHeight: 64 
        });
        this.load.spritesheet('crouch-idle', './assets/character-sprite-sheets/crouching-idle.png', { 
            frameWidth: 100, frameHeight: 64 
        });
        this.load.spritesheet('crouch-walk', './assets/character-sprite-sheets/crouch-walk.png', { 
            frameWidth: 100, frameHeight: 64 
        });

        // Load cannon assets
        this.load.image('cannon', './assets/mechanics/cannon-still.png');
        this.load.image('cannonball', './assets/mechanics/cannonball.png');

        // Load tilemap
        this.load.tilemapTiledJSON('map', './assets/tilemap.json');

        // Load tileset images
        this.load.image('gametileset', './assets/world_tileset.png');
        this.load.image('platforms', './assets/platforms.png');

        // Create grid texture
        const bgGraphics = this.add.graphics();
        bgGraphics.lineStyle(1, 0xcccccc);
        const gridSize = 32;
        bgGraphics.fillStyle(0xdddddd);
        bgGraphics.fillRect(0, 0, gridSize, gridSize);
        bgGraphics.fillStyle(0x999999);
        bgGraphics.fillCircle(0, 0, 2);
        bgGraphics.fillCircle(gridSize, 0, 2);
        bgGraphics.fillCircle(0, gridSize, 2);
        bgGraphics.fillCircle(gridSize, gridSize, 2);
        bgGraphics.generateTexture('grid', gridSize, gridSize);
        bgGraphics.destroy();
    }

    setupControls() { // Sets up keybinds
        this.cursors = this.input.keyboard.createCursorKeys();
        
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.player.canDash && !this.player.dashCooldown) {
                this.player.dash();
            }
        });

        this.input.keyboard.on('keydown-SHIFT', () => {
            if (!this.player.isCrouching && !this.player.isTransitioningCrouch) {
                this.player.startCrouch();
            }
        });

        this.input.keyboard.on('keyup-SHIFT', () => {
            if (this.player.isCrouching && !this.player.isTransitioningCrouch) {
                this.player.endCrouch();
            }
        });

        this.input.keyboard.on('keydown-P', () => {
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        });
    }

    startGame() {
        // To be implemented
    }

    loadLevel(levelId) {
        // To be implemented
    }

    pauseGame() {
        this.gameState = 'paused';
        this.scene.pause();
        this.UIManager.showPauseMenu();
    }

    resumeGame() {
        this.gameState = 'playing';
        this.scene.resume();
        this.UIManager.hidePauseMenu();
    }

    endGame() {
        // To be implemented
    }
}

// Configures the physics engine and window size for the game
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%',
        parent: 'game'
    },
    backgroundColor: '#ffffff',
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1.2 },
            debug: {
                showBodies: true,
                showCollisions: true,
                showVelocity: true,
                showBounds: true
            },
            setBounds: true,
            positionIterations: 6,
            velocityIterations: 4,
            enableSleeping: false,
            plugins: {
                attractors: false,
                wrap: false
            }
        }
    },
    scene: GameManager
};

// Start the game
const game = new Phaser.Game(config);

export default GameManager;
