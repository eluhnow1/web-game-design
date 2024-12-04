// Constants
const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 3200;
const PLAYER_SIZE = 32;
const PLAYER_CROUCH_SIZE = 16;
const MAX_NORMAL_SPEED = 6;
const MAX_CROUCH_SPEED = 3;
const TILE_SIZE = 16;

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

    create() {
        this.currentLevel = new Level(this);
        this.player = new Player(this, 400, 400);
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
        this.currentLevel.update();
    }

    loadAssets() {
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

    setupControls() {
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

// Player Class
class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.matter.add.sprite(x, y, 'idle', null, {
            friction: 0.001,
            frictionStatic: 0.05,
            frictionAir: 0.01,
            restitution: 0,
            density: 0.001,
            label: 'player',
            inertia: Infinity,
            sleepThreshold: -1,
            collisionFilter: {
                category: 0x0002,
                mask: 0x0001
            },
            shape: {
                type: 'rectangle',
                width: 20,
                height: PLAYER_SIZE
            }
        });

        this.setupPhysics();
        this.setupAnimations();
        this.initializeState();
    }

    initializeState() {
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;
        this.canDash = false;
        this.isDashing = false;
        this.dashCooldown = false;
        this.facing = 'right';
        this.isCrouching = false;
        this.isTransitioningCrouch = false;
    }

    setupPhysics() {
        this.sprite.setBounce(0);
        this.sprite.setFriction(0.001);
        this.sprite.setFixedRotation();
        this.sprite.body.collisionFilter.group = -1;
        this.sprite.body.sleepThreshold = -1;
        this.sprite.setFixedRotation(true);
        this.sprite.setOrigin(0.5, 0.75);
        this.sprite.setScale(0.5);
    }

    setupAnimations() {
        this.scene.anims.create({
            key: 'idle',
            frames: this.scene.anims.generateFrameNumbers('idle', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'walk',
            frames: this.scene.anims.generateFrameNumbers('walking', { start: 0, end: 6 }),
            frameRate: 12,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'jump',
            frames: this.scene.anims.generateFrameNumbers('jump', { start: 0, end: 5 }),
            frameRate: 12,
            repeat: 0
        });

        this.scene.anims.create({
            key: 'fall',
            frames: this.scene.anims.generateFrameNumbers('falling', { start: 0, end: 2 }),
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'land',
            frames: this.scene.anims.generateFrameNumbers('landing', { start: 0, end: 3 }),
            frameRate: 12,
            repeat: 0
        });

        this.scene.anims.create({
            key: 'dash',
            frames: this.scene.anims.generateFrameNumbers('dash', { start: 0, end: 3 }),
            frameRate: 12,
            repeat: 0
        });

        this.scene.anims.create({
            key: 'crouch-transition',
            frames: this.scene.anims.generateFrameNumbers('crouch', { start: 0, end: 2 }),
            frameRate: 12,
            repeat: 0
        });

        this.scene.anims.create({
            key: 'crouch-idle',
            frames: this.scene.anims.generateFrameNumbers('crouch-idle', { start: 0, end: 2 }),
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'crouch-walk',
            frames: this.scene.anims.generateFrameNumbers('crouch-walk', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.sprite.play('idle');
    }

    update() {
        this.handleMovement();
        this.handleJump();
        this.constrainToWorld();
        this.updateCamera();
    }

    handleMovement() {
        const normalSpeed = 0.2;
        const crouchSpeed = 0.1;
        const speed = this.isCrouching ? crouchSpeed : normalSpeed;
        const maxSpeed = this.isCrouching ? MAX_CROUCH_SPEED : MAX_NORMAL_SPEED;

        this.sprite.setRotation(0);

        if ((this.scene.cursors.left.isDown || this.scene.cursors.right.isDown) && !this.isDashing) {
            const movingLeft = this.scene.cursors.left.isDown;
            const movingRight = this.scene.cursors.right.isDown;
        
            const direction = movingLeft ? -1 : 1;
            const newVelocity = Phaser.Math.Clamp(this.sprite.body.velocity.x + direction * speed, -maxSpeed, maxSpeed);
            this.sprite.setVelocityX(newVelocity);
        
            this.sprite.flipX = movingLeft;
            this.facing = movingLeft ? 'left' : 'right';
        
            if (!this.isTransitioningCrouch && Math.abs(this.sprite.body.velocity.x) > 0.1) {
                const anim = this.isCrouching ? 'crouch-walk' : 'walk';
                if (this.sprite.anims.currentAnim?.key !== anim) {
                    this.sprite.play(anim, true);
                }
            }
        } else if (!this.isDashing) {
            const decel = 0.8;
            this.sprite.setVelocityX(this.sprite.body.velocity.x * decel);
        
            if (!this.isTransitioningCrouch &&
                !this.sprite.anims.currentAnim?.key.includes('jump') &&
                Math.abs(this.sprite.body.velocity.x) < 0.1) {
                const anim = this.isCrouching ? 'crouch-idle' : 'idle';
                if (this.sprite.anims.currentAnim?.key !== anim) {
                    this.sprite.play(anim, true);
                }
            }
        }
    }

    handleJump() {
        const jumpForce = -9;

        if (Phaser.Input.Keyboard.JustDown(this.scene.cursors.up) && !this.isCrouching) {
            if (this.canDoubleJump) {
                this.sprite.play('jump', true);
                this.sprite.setVelocityY(jumpForce);
                this.canDoubleJump = false;
            } else if (!this.hasDoubleJumped) {
                this.sprite.play('jump', true);
                this.sprite.setVelocityY(jumpForce * 0.8);
                this.hasDoubleJumped = true;
            }
        }

        if (this.sprite.body.velocity.y > 1) {
            if (!this.sprite.anims.currentAnim?.key.includes('fall')) {
                this.sprite.play('fall');
            }
            
            if (this.sprite.body.velocity.y > 10) {
                const expectedNextY = this.sprite.y + this.sprite.body.velocity.y * (1/60);
                const bodies = this.scene.matter.world.localWorld.bodies;
                
                for (let body of bodies) {
                    if (body.label === 'ground' && 
                        Math.abs(body.position.x - this.sprite.x) < 20) {
                        
                        if (expectedNextY + PLAYER_SIZE/2 > body.position.y - 8 && 
                            this.sprite.y + PLAYER_SIZE/2 <= body.position.y - 8) {
                            
                            this.sprite.setY(body.position.y - PLAYER_SIZE/2 - 8);
                            this.sprite.setVelocityY(0);
                            this.resetJump();
                            this.canDash = true;
                            this.sprite.play('land', true).once('animationcomplete', () => {
                                if (!this.sprite.body.velocity.x) {
                                    this.sprite.play('idle');
                                } else {
                                    this.sprite.play('walk');
                                }
                            });
                            break;
                        }
                    }
                }
            }
        }
    }

    startCrouch() {
        if (this.isTransitioningCrouch || this.isCrouching) return;

        this.isTransitioningCrouch = true;

        const scaleFactor = PLAYER_CROUCH_SIZE / PLAYER_SIZE;
        this.sprite.body.parts.forEach((part) => {
            if (part !== this.sprite.body) {
                this.scene.matter.body.scale(part, 1, scaleFactor);
            }
        });

        this.sprite.setPosition(this.sprite.x, this.sprite.y + (PLAYER_SIZE - PLAYER_CROUCH_SIZE) / 2);

        this.sprite.play('crouch-transition').once('animationcomplete', () => {
            this.isCrouching = true;
            this.isTransitioningCrouch = false;
            this.sprite.play('crouch-idle');
        });
    }

    endCrouch() {
        if (this.isTransitioningCrouch || !this.isCrouching) return;

        this.isTransitioningCrouch = true;

        const scaleFactor = PLAYER_SIZE / PLAYER_CROUCH_SIZE;
        this.sprite.body.parts.forEach((part) => {
            if (part !== this.sprite.body) {
                this.scene.matter.body.scale(part, 1, scaleFactor);
            }
        });

        this.sprite.setPosition(this.sprite.x, this.sprite.y - (PLAYER_SIZE - PLAYER_CROUCH_SIZE) / 2);

        this.sprite.play('crouch-transition', true).once('animationcomplete', () => {
            this.isCrouching = false;
            this.isTransitioningCrouch = false;
            this.canDoubleJump = true;
            this.hasDoubleJumped = false;

            if (!this.sprite.body.velocity.x) {
                this.sprite.play('idle');
            } else {
                this.sprite.play('walk');
            }
        });
    }

    dash() {
        const dashSpeed = 10;
        const dashDuration = 250;
        const dashDeceleration = 0.8;
        
        this.isDashing = true;
        this.dashCooldown = true;
        this.sprite.play('dash');
        
        const dashVelocity = this.facing === 'right' ? dashSpeed : -dashSpeed;
        this.sprite.setVelocityX(dashVelocity);
        this.sprite.setVelocityY(0);
        
        setTimeout(() => {
            this.isDashing = false;
            const currentVelocity = this.sprite.body.velocity.x;
            const maxSpeed = this.isCrouching ? MAX_CROUCH_SPEED : MAX_NORMAL_SPEED;
            
            if (this.scene.cursors.left.isDown) {
                this.sprite.setVelocityX(-maxSpeed);
            } else if (this.scene.cursors.right.isDown) {
                this.sprite.setVelocityX(maxSpeed);
            } else {
                this.sprite.setVelocityX(currentVelocity * dashDeceleration);
            }
        }, dashDuration);
        
        setTimeout(() => {
            this.dashCooldown = false;
        }, 500);
    }

    constrainToWorld() {
        if (this.sprite.x < 0) this.sprite.setX(0);
        if (this.sprite.x > WORLD_WIDTH) this.sprite.setX(WORLD_WIDTH);
        if (this.sprite.y < 0) this.sprite.setY(0);
        if (this.sprite.y > WORLD_HEIGHT) {
            this.sprite.setY(WORLD_HEIGHT);
            this.resetJump();
            this.canDash = true;
        }

        this.sprite.body.angle = 0;
        this.sprite.body.angularVelocity = 0;
    }

    updateCamera() {
        const camera = this.scene.cameras.main;
        const marginLeft = 400;
        const marginRight = WORLD_WIDTH - 400;
        
        if (this.sprite.x < marginLeft) {
            camera.startFollow(this.sprite);
            camera.setScroll(0, camera.scrollY);
        } else if (this.sprite.x > marginRight) {
            camera.startFollow(this.sprite);
            camera.setScroll(WORLD_WIDTH - camera.width / camera.zoom, camera.scrollY);
        } else {
            camera.startFollow(this.sprite);
        }
    }

    resetJump() {
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;
    }
}

// Level Class
class Level {
    constructor(scene) {
        this.scene = scene;
        this.tilemap = null;
        this.pickups = [];
        this.hazards = [];
        this.exit = null;
        this.mainLayer = null;
    }

    create() {
        // Create the tilemap
        const map = this.scene.make.tilemap({ key: 'map' });
        
        // Add tilesets
        const gametileset = map.addTilesetImage('gametileset', 'gametileset');
        const platformsTileset = map.addTilesetImage('platforms', 'platforms');
        
        // Create layers
        const backgroundObjects = map.createLayer('background objects', [gametileset, platformsTileset]);
        this.mainLayer = map.createLayer('Tile Layer 1', [gametileset, platformsTileset]);
        const laddersLayer = map.createLayer('ladders', [gametileset, platformsTileset]);
        const crumblingLayer = map.createLayer('crumbling platforms', [gametileset, platformsTileset]);
        const breakableLayer = map.createLayer('breakable blocks', [gametileset, platformsTileset]);
    
        this.mainLayer.setCollisionByProperty({ collision: true });
        this.createCollisionBodies();
    
        // Fix: Change this.cameras to this.scene.cameras
        this.scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.scene.cameras.main.startFollow(this.scene.player.sprite, true, 0.2, 0.2);
        this.scene.cameras.main.setZoom(2.5);
    }

    createCollisionBodies() {
        const solidTiles = [1, 2, 3, 4, 9, 17, 19];
        const mapWidth = this.mainLayer.width;
        const mapHeight = this.mainLayer.height;
        const visited = Array(mapHeight).fill(0).map(() => Array(mapWidth).fill(false));
        
        const isSolidTile = (x, y) => {
            if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return false;
            const tile = this.mainLayer.getTileAt(x, y);
            return tile && solidTiles.includes(tile.index);
        };
        
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                if (visited[y][x] || !isSolidTile(x, y)) continue;
                
                let width = 1;
                while (x + width < mapWidth && isSolidTile(x + width, y) && !visited[y][x + width]) {
                    width++;
                }
                
                let height = 1;
                let valid = true;
                while (valid && y + height < mapHeight) {
                    for (let ix = x; ix < x + width; ix++) {
                        if (!isSolidTile(ix, y + height) || visited[y + height][ix]) {
                            valid = false;
                            break;
                        }
                    }
                    if (valid) height++;
                }
                
                for (let iy = y; iy < y + height; iy++) {
                    for (let ix = x; ix < x + width; ix++) {
                        visited[iy][ix] = true;
                    }
                }
                
                const centerX = (x + width/2) * TILE_SIZE;
                const centerY = (y + height/2) * TILE_SIZE;
                
                this.scene.matter.add.rectangle(centerX, centerY, width * TILE_SIZE, height * TILE_SIZE, {
                    isStatic: true,
                    friction: 0.5,
                    label: 'ground',
                    collisionFilter: {
                        category: 0x0001,
                        mask: 0x0002
                    },
                    chamfer: { radius: 0 },
                    render: {
                        fillStyle: 'rgba(255, 0, 0, 0.3)',
                        strokeStyle: 'rgb(255, 0, 0)',
                        lineWidth: 1
                    },
                    slop: 0
                });
            }
        }
    }

    update() {
        // Level update logic to be implemented
    }

    checkForCompletion() {
        // To be implemented
    }

    resetLevel() {
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

// Game configuration
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
            gravity: { y: 2 },
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