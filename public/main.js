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
            debug: true,
            setBounds: true,
            positionIterations: 6,
            velocityIterations: 4,
            enableSleeping: false,  // Prevent bodies from sleeping
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
// Add these constants at the top with your other constants
const CROUCH_CHECK_PADDING = 8;  // Padding for crouch space check
const MAX_FALL_VELOCITY = 12;    // Maximum fall speed
const GROUND_CHECK_POINTS = 3;   // Number of ground check points

// Add this helper function to check if there's space to crouch
function canCrouchAtCurrentPosition() {
    const scene = currentScene;
    const checkHeight = PLAYER_CROUCH_SIZE + CROUCH_CHECK_PADDING;
    const checkWidth = 20; // Player width
    
    // Create a test body at the player's position
    const testBody = scene.matter.add.rectangle(
        player.x,
        player.y,
        checkWidth,
        checkHeight,
        {
            isSensor: true,
            isStatic: false,
            render: { visible: false }
        }
    );
    
    // Check for collisions
    const collisions = scene.matter.query.collides(testBody, scene.matter.world.localWorld.bodies);
    
    // Remove the test body
    scene.matter.world.remove(testBody);
    
    // Return true if no collisions found
    return collisions.length === 0;
}

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

    const solidTiles = [1, 2, 3, 4, 9, 17, 19];
    
    // Create collision bodies for solid tiles
    mainLayer.forEachTile((tile) => {
        if (solidTiles.includes(tile.index)) {
            const x = tile.getCenterX();
            const y = tile.getCenterY();
            
            // Create a full square collision body
            this.matter.add.rectangle(x, y, 16, 16, {
                isStatic: true,
                friction: 0.5,
                label: 'ground',
                collisionFilter: {
                    category: 0x0001,
                    mask: 0x0002
                },
                chamfer: { radius: 0 },  // Ensure sharp corners
                render: {
                    visible: false
                },
                slop: 0  // Reduce position slop
            });
        }
    });
    

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
    
    // Check if there's enough space to crouch
    if (!canCrouchAtCurrentPosition()) {
        return; // Don't allow crouch if there's not enough space
    }

    isTransitioningCrouch = true;

    // Create new collision body for crouch state instead of scaling
    const crouchBody = currentScene.matter.bodies.rectangle(
        player.x,
        player.y + (PLAYER_SIZE - PLAYER_CROUCH_SIZE) / 2,
        20,  // width
        PLAYER_CROUCH_SIZE,
        {
            friction: 0.001,
            frictionStatic: 0.05,
            frictionAir: 0.01,
            restitution: 0,
            density: 0.001,
            label: 'player',
            inertia: Infinity,
            collisionFilter: {
                category: 0x0002,
                mask: 0x0001
            }
        }
    );

    // Smoothly transition to new body
    currentScene.matter.body.setPosition(crouchBody, {
        x: player.x,
        y: player.y + (PLAYER_SIZE - PLAYER_CROUCH_SIZE) / 2
    });

    // Replace the old body with the new one
    const oldBody = player.body;
    player.setExistingBody(crouchBody);
    currentScene.matter.world.remove(oldBody);

    // Play animation
    player.play('crouch-transition').once('animationcomplete', () => {
        isCrouching = true;
        isTransitioningCrouch = false;
        player.play('crouch-idle');
    });
}

function endCrouch() {
    if (isTransitioningCrouch || !isCrouching) return;

    // Check if there's space to stand up
    const standingY = player.y - (PLAYER_SIZE - PLAYER_CROUCH_SIZE) / 2;
    const testBody = currentScene.matter.add.rectangle(
        player.x,
        standingY,
        20,
        PLAYER_SIZE,
        { isSensor: true }
    );
    
    const collisions = currentScene.matter.query.collides(testBody, currentScene.matter.world.localWorld.bodies);
    currentScene.matter.world.remove(testBody);
    
    if (collisions.length > 0) {
        return; // Don't allow standing if there's not enough space
    }

    isTransitioningCrouch = true;

    // Create new standing body
    const standingBody = currentScene.matter.bodies.rectangle(
        player.x,
        standingY,
        20,
        PLAYER_SIZE,
        {
            friction: 0.001,
            frictionStatic: 0.05,
            frictionAir: 0.01,
            restitution: 0,
            density: 0.001,
            label: 'player',
            inertia: Infinity,
            collisionFilter: {
                category: 0x0002,
                mask: 0x0001
            }
        }
    );

    // Replace body
    const oldBody = player.body;
    player.setExistingBody(standingBody);
    currentScene.matter.world.remove(oldBody);

    // Play animation
    player.play('crouch-transition', true).once('animationcomplete', () => {
        isCrouching = false;
        isTransitioningCrouch = false;
        if (!player.body.velocity.x) {
            player.play('idle');
        } else {
            player.play('walk');
        }
    });
}


function update() {
    const normalSpeed = 0.5;
    const crouchSpeed = 0.25;
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

    if (player.body.velocity.y > 0) {  // If falling
        // Limit fall speed
        if (player.body.velocity.y > MAX_FALL_VELOCITY) {
            player.setVelocityY(MAX_FALL_VELOCITY);
        }
        
        // Check for ground collision
        checkGroundCollision();
    }

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

function checkGroundCollision() {
    const scene = currentScene;
    const bodyWidth = player.body.bounds.max.x - player.body.bounds.min.x;
    const rayStartY = player.y + (PLAYER_SIZE/2) - 2; // Adjusted start position
    const rayLength = 8; // Reduced ray length for more precise detection
    
    // Check multiple points along the bottom of the player
    for (let i = 0; i < GROUND_CHECK_POINTS; i++) {
        const rayStartX = player.x - (bodyWidth/2) + (bodyWidth * i/(GROUND_CHECK_POINTS-1));
        
        const ray = scene.matter.query.ray(
            scene.matter.world.localWorld.bodies,
            { x: rayStartX, y: rayStartY },
            { x: rayStartX, y: rayStartY + rayLength },
            0.5
        );
        
        // Check if we found any collision bodies and they're ground bodies
        if (ray.length > 0 && ray[0].body.label === 'ground') {
            const collisionBody = ray[0].body;
            const groundY = collisionBody.bounds.min.y;
            
            // More precise ground check with smaller threshold
            const distanceToGround = Math.abs(player.y + PLAYER_SIZE/2 - groundY);
            
            if (distanceToGround < 4) { // Smaller threshold for ground detection
                // Set position precisely
                player.setY(groundY - PLAYER_SIZE/2);
                player.setVelocityY(0);
                
                // Only reset jump and play landing if we weren't already on ground
                if (player.anims.currentAnim?.key === 'fall') {
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
                return true;
            }
        }
    }
    return false;
}