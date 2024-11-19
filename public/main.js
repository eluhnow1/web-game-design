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
            debug: false,
            setBounds: true  // Enable world bounds
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let cursors;
let canDoubleJump = true;
let hasDoubleJumped = false;
let canDash = false;
let isDashing = false;
let dashCooldown = false;
let facing = 'right';
let currentScene;
let isCrouching = false;
let isTransitioningCrouch = false;

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 3200;
const PLAYER_SIZE = 32;
const PLAYER_CROUCH_SIZE = 16;
const MAX_NORMAL_SPEED = 6;
const MAX_CROUCH_SPEED = 3;

function preload() {
    // Load all sprite sheets with relative paths
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

    // Create grid texture for background
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

function createAnimations() {
    currentScene.anims.create({
        key: 'idle',
        frames: currentScene.anims.generateFrameNumbers('idle', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
    });

    currentScene.anims.create({
        key: 'walk',
        frames: currentScene.anims.generateFrameNumbers('walking', { start: 0, end: 6 }),
        frameRate: 12,
        repeat: -1
    });

    currentScene.anims.create({
        key: 'jump',
        frames: currentScene.anims.generateFrameNumbers('jump', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: 0
    });

    currentScene.anims.create({
        key: 'fall',
        frames: currentScene.anims.generateFrameNumbers('falling', { start: 0, end: 2 }),
        frameRate: 8,
        repeat: -1
    });

    currentScene.anims.create({
        key: 'land',
        frames: currentScene.anims.generateFrameNumbers('landing', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: 0
    });

    currentScene.anims.create({
        key: 'dash',
        frames: currentScene.anims.generateFrameNumbers('dash', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: 0
    });

    currentScene.anims.create({
        key: 'crouch-transition',
        frames: currentScene.anims.generateFrameNumbers('crouch', { start: 0, end: 2 }),
        frameRate: 12,
        repeat: 0
    });

    currentScene.anims.create({
        key: 'crouch-idle',
        frames: currentScene.anims.generateFrameNumbers('crouch-idle', { start: 0, end: 2 }),
        frameRate: 8,
        repeat: -1
    });

    currentScene.anims.create({
        key: 'crouch-walk',
        frames: currentScene.anims.generateFrameNumbers('crouch-walk', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
    });
}

function create() {
    currentScene = this;
    
    // Create the tilemap
    const map = this.make.tilemap({ key: 'map' });
    
    // Add tilesets
    const gametileset = map.addTilesetImage('gametileset', 'gametileset');
    const platformsTileset = map.addTilesetImage('platforms', 'platforms');
    
    // Create layers
    const backgroundObjects = map.createLayer('background objects', [gametileset, platformsTileset]);
    const mainLayer = map.createLayer('Tile Layer 1', [gametileset, platformsTileset]);
    const laddersLayer = map.createLayer('ladders', [gametileset, platformsTileset]);
    const crumblingLayer = map.createLayer('crumbling platforms', [gametileset, platformsTileset]);
    const breakableLayer = map.createLayer('breakable blocks', [gametileset, platformsTileset]);

    // Convert solid tiles to Matter physics bodies
    const solidTiles = [1, 2, 3, 4, 9, 17, 19]; // Add solid tile indexes
    
    mainLayer.forEachTile((tile) => {
        if (solidTiles.includes(tile.index)) {
            const x = tile.getCenterX();
            const y = tile.getCenterY();
            this.matter.add.rectangle(x, y, 16, 16, {
                isStatic: true,
                label: 'ground'
            });
        }
    });

    // Set up world bounds
    this.matter.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Create player after tilemap
    player = this.matter.add.sprite(400, 400, 'idle', null, {
        friction: 0,
        frictionStatic: 0,
        frictionAir: 0.01,
        restitution: 0,
        density: 0.001,
        label: 'player',
        inertia: Infinity,
        render: {
            visible: false
        },
        shape: {
            type: 'rectangle',
            width: 16, // Half of the original 32
            height: PLAYER_SIZE
        }
    });
    
    player.setFixedRotation(true);
    player.setOrigin(0.5, 0.5);
    player.setScale(0.5);
    
    createAnimations();
    player.play('idle');

    // Set up camera
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(player, true, 0.2, 0.2);
    this.cameras.main.setZoom(2);
    
    // Set up keyboard controls
    cursors = this.input.keyboard.createCursorKeys();
    
    // Add spacebar for dash
    this.input.keyboard.on('keydown-SPACE', () => {
        if (canDash && !dashCooldown) {
            dash();
        }
    });

    // Add shift key for crouch
    this.input.keyboard.on('keydown-SHIFT', () => {
        if (!isCrouching && !isTransitioningCrouch) {
            startCrouch();
        }
    });

    this.input.keyboard.on('keyup-SHIFT', () => {
        if (isCrouching && !isTransitioningCrouch) {
            endCrouch();
        }
    });

    // Ground collision detection
    this.matter.world.on('collisionstart', (event) => {
        event.pairs.forEach((pair) => {
            if (pair.bodyA.label === 'player' || pair.bodyB.label === 'player') {
                resetJump();
                canDash = true;
                player.play('land', true).once('animationcomplete', () => {
                    if (!player.body.velocity.x) {
                        player.play('idle');
                    } else {
                        player.play('walk');
                    }
                });
            }
        });
    });
}

function startCrouch() {
    if (isTransitioningCrouch || isCrouching) return;

    isTransitioningCrouch = true;

    // Scale the body for crouching
    const scaleFactor = PLAYER_CROUCH_SIZE / PLAYER_SIZE;
    player.body.parts.forEach((part) => {
        if (part !== player.body) {
            this.matter.body.scale(part, 1, scaleFactor);
        }
    });

    // Adjust player position slightly to prevent clipping into the ground
    player.setPosition(player.x, player.y + (PLAYER_SIZE - PLAYER_CROUCH_SIZE) / 2);

    // Play animation
    player.play('crouch-transition').once('animationcomplete', () => {
        isCrouching = true;
        isTransitioningCrouch = false;
        player.play('crouch-idle');
    });
}

function endCrouch() {
    if (isTransitioningCrouch || !isCrouching) return;

    isTransitioningCrouch = true;

    // Restore the original body scale
    const scaleFactor = PLAYER_SIZE / PLAYER_CROUCH_SIZE;
    player.body.parts.forEach((part) => {
        if (part !== player.body) {
            this.matter.body.scale(part, 1, scaleFactor);
        }
    });

    // Adjust player position back to original
    player.setPosition(player.x, player.y - (PLAYER_SIZE - PLAYER_CROUCH_SIZE) / 2);

    // Play animation
    player.play('crouch-transition', true).once('animationcomplete', () => {
        isCrouching = false;
        isTransitioningCrouch = false;
        canDoubleJump = true;
        hasDoubleJumped = false;

        if (!player.body.velocity.x) {
            player.play('idle');
        } else {
            player.play('walk');
        }
    });
}


function update() {
    const normalSpeed = 4;
    const crouchSpeed = 2;
    const speed = isCrouching ? crouchSpeed : normalSpeed;
    const jumpForce = -12;
    const maxSpeed = isCrouching ? MAX_CROUCH_SPEED : MAX_NORMAL_SPEED;
    
    // Force rotation to stay at 0
    player.setRotation(0);
    
    // Handle left/right movement
    if (cursors.left.isDown && !isDashing) {
        // Use setVelocityX instead of body velocity directly
        const newVelocity = Math.max(-maxSpeed, player.body.velocity.x - speed);
        player.setVelocityX(newVelocity);
        player.flipX = true;
        facing = 'left';
        
        // Only play walk animation if actually moving
        if (!isTransitioningCrouch && Math.abs(player.body.velocity.x) > 0.1) {
            player.play(isCrouching ? 'crouch-walk' : 'walk', true);
        }
    } else if (cursors.right.isDown && !isDashing) {
        // Use setVelocityX instead of body velocity directly
        const newVelocity = Math.min(maxSpeed, player.body.velocity.x + speed);
        player.setVelocityX(newVelocity);
        player.flipX = false;
        facing = 'right';
        
        // Only play walk animation if actually moving
        if (!isTransitioningCrouch && Math.abs(player.body.velocity.x) > 0.1) {
            player.play(isCrouching ? 'crouch-walk' : 'walk', true);
        }
    } else if (!isDashing) {
        // Add deceleration instead of immediate stop
        const decel = 0.8;
        player.setVelocityX(player.body.velocity.x * decel);
        
        // Only play idle if nearly stopped
        if (!isTransitioningCrouch && 
            !player.anims.currentAnim?.key.includes('jump') && 
            Math.abs(player.body.velocity.x) < 0.1) {
            player.play(isCrouching ? 'crouch-idle' : 'idle', true);
        }
    }

    // Handle jumping
    if (Phaser.Input.Keyboard.JustDown(cursors.up) && !isCrouching) {
        if (canDoubleJump) {
            player.play('jump', true);
            player.setVelocityY(jumpForce);
            canDoubleJump = false;
        } else if (!hasDoubleJumped) {
            player.play('jump', true);
            player.setVelocityY(jumpForce * 0.8);
            hasDoubleJumped = true;
        }
    }

    // Check if falling
    if (player.body.velocity.y > 1 && !player.anims.currentAnim?.key.includes('fall')) {
        player.play('fall');
    }

    // Keep player in world bounds and maintain rotation
    if (player.x < 0) player.setX(0);
    if (player.x > WORLD_WIDTH) player.setX(WORLD_WIDTH);
    if (player.y < 0) player.setY(0);
    if (player.y > WORLD_HEIGHT) {
        player.setY(WORLD_HEIGHT);
        resetJump();
        canDash = true;
    }

    // Force angle to remain at 0
    player.body.angle = 0;
    player.body.angularVelocity = 0;

    // Camera handling
    const camera = this.cameras.main;
    const marginLeft = 400;
    const marginRight = WORLD_WIDTH - 400;
    
    if (player.x < marginLeft) {
        camera.startFollow(player);
        camera.setScroll(0, camera.scrollY);
    } else if (player.x > marginRight) {
        camera.startFollow(player);
        camera.setScroll(WORLD_WIDTH - camera.width / camera.zoom, camera.scrollY);
    } else {
        camera.startFollow(player);
    }
}

function dash() {
    const dashSpeed = 10;
    const dashDuration = 250;
    const dashDeceleration = 0.8;
    
    isDashing = true;
    dashCooldown = true;
    player.play('dash');
    
    const dashVelocity = facing === 'right' ? dashSpeed : -dashSpeed;
    player.setVelocityX(dashVelocity);
    player.setVelocityY(0);
    
    setTimeout(() => {
        isDashing = false;
        const currentVelocity = player.body.velocity.x;
        const maxSpeed = isCrouching ? MAX_CROUCH_SPEED : MAX_NORMAL_SPEED;  // Use global constants
        
        if (cursors.left.isDown) {
            player.setVelocityX(-maxSpeed);
        } else if (cursors.right.isDown) {
            player.setVelocityX(maxSpeed);
        } else {
            player.setVelocityX(currentVelocity * dashDeceleration);
        }
    }, dashDuration);
    
    setTimeout(() => {
        dashCooldown = false;
    }, 500);
}

function resetJump() {
    canDoubleJump = true;
    hasDoubleJumped = false;
}