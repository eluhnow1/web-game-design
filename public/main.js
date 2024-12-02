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
let lastValidY = 0;
let lastDebugTime = 0;
let TILE_SIZE = 16;

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

function createCollisionBodies(mainLayer) {  // Add mainLayer parameter here
    const solidTiles = [1, 2, 3, 4, 9, 17, 19];
    const mapWidth = mainLayer.width;
    const mapHeight = mainLayer.height;
    const visited = Array(mapHeight).fill(0).map(() => Array(mapWidth).fill(false));
    
    // Helper function to check if a tile should be included
    function isSolidTile(x, y) {
        if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return false;
        const tile = mainLayer.getTileAt(x, y);
        return tile && solidTiles.includes(tile.index);
    }
    
    // Scan each tile
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            if (visited[y][x] || !isSolidTile(x, y)) continue;
            
            // Find maximum width
            let width = 1;
            while (x + width < mapWidth && isSolidTile(x + width, y) && !visited[y][x + width]) {
                width++;
            }
            
            // Find maximum height
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
            
            // Mark tiles as visited
            for (let iy = y; iy < y + height; iy++) {
                for (let ix = x; ix < x + width; ix++) {
                    visited[iy][ix] = true;
                }
            }
            
            // Create collision body
            const centerX = (x + width/2) * TILE_SIZE;
            const centerY = (y + height/2) * TILE_SIZE;
            
            currentScene.matter.add.rectangle(centerX, centerY, width * TILE_SIZE, height * TILE_SIZE, {
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

    this.mainLayer = mainLayer;  // Store reference to mainLayer
    createCollisionBodies(mainLayer);
    

    // Update collision properties
    mainLayer.setCollisionByProperty({ collision: true });
    // Set up world bounds
    this.matter.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    player = this.matter.add.sprite(400, 400, 'idle', null, {
        friction: 0.001,
        frictionStatic: 0.05,
        frictionAir: 0.01,
        restitution: 0,
        density: 0.001,
        label: 'player',
        inertia: Infinity,
        sleepThreshold: -1,  // Prevent body from sleeping
        collisionFilter: {
            category: 0x0002,
            mask: 0x0001
        },
        shape: {
            type: 'rectangle',
            width: 20,  // Slightly wider collision box
            height: PLAYER_SIZE
        }
    });
    
    // Add these physics-specific settings
    player.setBounce(0);
    player.setFriction(0.001);
    player.setFixedRotation();
    
    // Update Matter.js specific settings for the player's body
    player.body.collisionFilter.group = -1;  // Don't collide with other players
    player.body.sleepThreshold = -1;
    
    player.setFixedRotation(true);
    player.setOrigin(0.5, 0.75); // Adjust origin to fix ground offset
    player.setScale(0.5);
    
    createAnimations();
    player.play('idle');
    
    // Set up camera with increased zoom
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(player, true, 0.2, 0.2);
    this.cameras.main.setZoom(2.5); // Increased from 2 to 4 for closer view
    
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
    const normalSpeed = 0.2;
    const crouchSpeed = 0.1;
    const speed = isCrouching ? crouchSpeed : normalSpeed;
    const jumpForce = -9;
    const maxSpeed = isCrouching ? MAX_CROUCH_SPEED : MAX_NORMAL_SPEED;
    
    // Force rotation to stay at 0
    player.setRotation(0);
    
    // Handle left/right movement
    if ((cursors.left.isDown || cursors.right.isDown) && !isDashing) {
        const movingLeft = cursors.left.isDown;
        const movingRight = cursors.right.isDown;
    
        // Determine the intended direction and apply velocity
        const direction = movingLeft ? -1 : 1;
        const newVelocity = Phaser.Math.Clamp(player.body.velocity.x + direction * speed, -maxSpeed, maxSpeed);
        player.setVelocityX(newVelocity);
    
        // Flip player sprite based on direction
        player.flipX = movingLeft;
        facing = movingLeft ? 'left' : 'right';
    
        // Play "walk" animation only if velocity is nonzero
        if (!isTransitioningCrouch && Math.abs(player.body.velocity.x) > 0.1) {
            const anim = isCrouching ? 'crouch-walk' : 'walk';
            if (player.anims.currentAnim?.key !== anim) {
                player.play(anim, true);
            }
        }
    } else if (!isDashing) {
        // Decelerate if no movement key is pressed
        const decel = 0.8;
        player.setVelocityX(player.body.velocity.x * decel);
    
        // Play "idle" animation if nearly stopped
        if (!isTransitioningCrouch &&
            !player.anims.currentAnim?.key.includes('jump') &&
            Math.abs(player.body.velocity.x) < 0.1) {
            const anim = isCrouching ? 'crouch-idle' : 'idle';
            if (player.anims.currentAnim?.key !== anim) {
                player.play(anim, true);
            }
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

    if (player.body.velocity.y > 1) {
        if (!player.anims.currentAnim?.key.includes('fall')) {
            player.play('fall');
        }
        
        // If falling very fast, apply position interpolation
        if (player.body.velocity.y > 10) {
            const expectedNextY = player.y + player.body.velocity.y * (1/60); // Approximate next position
            const bodies = this.matter.world.localWorld.bodies;
            
            // Check for potential collisions
            for (let body of bodies) {
                if (body.label === 'ground' && 
                    Math.abs(body.position.x - player.x) < 20) {  // Only check nearby ground
                    
                    if (expectedNextY + PLAYER_SIZE/2 > body.position.y - 8 && 
                        player.y + PLAYER_SIZE/2 <= body.position.y - 8) {
                        
                        // Prevent falling through by adjusting position
                        player.setY(body.position.y - PLAYER_SIZE/2 - 8);
                        player.setVelocityY(0);
                        resetJump();
                        canDash = true;
                        player.play('land', true).once('animationcomplete', () => {
                            if (!player.body.velocity.x) {
                                player.play('idle');
                            } else {
                                player.play('walk');
                            }
                        });
                        break;
                    }
                }
            }
        }
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