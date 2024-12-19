import Player from './player.js';
import Level from './level.js';

// Main Game Manager Class
class GameManager extends Phaser.Scene {
    constructor() {
        super();
        this.currentLevel = null;
        this.player = null;
        this.UIManager = null;
        this.gameState = 'playing';
        this.cursors = null;
    }

    preload() {
        this.loadAssets();
    }

    create() {//This function just sets some frequently used variables and handles player collision with the ground (including animations)
        this.currentLevel = new Level(this);
        this.player = new Player(this, 450, 660);
        this.UIManager = new UIManager(this);
        this.setupControls();
        this.currentLevel.create();

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
    }

    update(time, delta) {
        this.player.update();
    }

    loadAssets() {//self-explanatory, loads all animations and tilemap
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

        this.load.spritesheet('spring', './assets/mechanics/spring.png', { 
            frameWidth: 230, 
            frameHeight: 160,
            endFrame: 7     
        });
        this.load.spritesheet('cannon', './assets/mechanics/cannon-shooting.png', {
            frameWidth: 1024,
            frameHeight: 1024,
            endFrame: 4 
        });

        this.load.spritesheet('cannonball', './assets/mechanics/cannonball.png', {
            frameWidth: 160,
            frameHeight: 112,
            endFrame: 1
        });
        this.load.spritesheet('ladder-climb', './assets/character-sprite-sheets/ladder-climb.png', { 
            frameWidth: 100, frameHeight: 64 
        });

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

        this.load.image('moveLeft-pickup', './assets/pickups/left-pickup.png');
        this.load.image('crouch-pickup', './assets/pickups/crouch-pickup.png');
        this.load.image('jump-pickup', './assets/pickups/jump-pickup.png');
        this.load.image('dash-pickup', './assets/pickups/dash-pickup.png');
        this.load.image('doubleJump-pickup', './assets/pickups/doublejump-pickup.png');
        this.load.image('wallJump-pickup', './assets/pickups/walljump-pickup.png');
        this.load.image('cage', 'assets/mechanics/cage.png');
        this.load.image('key', 'assets/mechanics/key.png');
        this.load.image('star', './assets/mechanics/star.png');
    }

    setupControls() {//Sets up keybinds
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
    }

    startGame() {
        // To be implemented
    }

    loadLevel(levelId) {
        // To be implemented
    }

    pauseGame() {
        // To be implemented
    }

    resumeGame() {
        // To be implemented
    }

    endGame() {
        // To be implemented
    }
}

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
        // To be implemented
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

//Configures the physics engine and window size for the game
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
            gravity: { y: 1 },
            // debug: {
            //     showBodies: true,
            //     showCollisions: true,
            //     showVelocity: true,
            //     showBounds: true
            // },
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