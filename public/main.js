const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 0.8 },
            debug: true,
            setBounds: false  // Don't set world bounds automatically
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

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 3200;
const PLAYER_SIZE = 16;

function preload() {
    // Create player texture
    const graphics = this.add.graphics();
    graphics.fillStyle(0x00ff00);
    graphics.fillRect(0, 0, PLAYER_SIZE, PLAYER_SIZE);
    graphics.generateTexture('player', PLAYER_SIZE, PLAYER_SIZE);
    graphics.destroy();

    // Create a grid texture for the background
    const bgGraphics = this.add.graphics();
    bgGraphics.lineStyle(1, 0xcccccc);
    const gridSize = 32;
    
    // Draw a single grid cell with dots at the corners
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

function create() {
    currentScene = this;
    
    // Add background grid
    const backgroundGroup = this.add.group();
    for (let y = 0; y < WORLD_HEIGHT; y += 32) {
        for (let x = 0; x < WORLD_WIDTH; x += 32) {
            backgroundGroup.add(this.add.image(x, y, 'grid').setOrigin(0, 0));
        }
    }

    // Create world boundaries as static Matter.js bodies
    const wallThickness = 60;
    
    // Left wall
    this.matter.add.rectangle(0, WORLD_HEIGHT/2, wallThickness, WORLD_HEIGHT, {
        isStatic: true,
        label: 'wall'
    });

    // Right wall
    this.matter.add.rectangle(WORLD_WIDTH, WORLD_HEIGHT/2, wallThickness, WORLD_HEIGHT, {
        isStatic: true,
        label: 'wall'
    });

    // Bottom wall
    this.matter.add.rectangle(WORLD_WIDTH/2, WORLD_HEIGHT, WORLD_WIDTH, wallThickness, {
        isStatic: true,
        label: 'wall'
    });
    
    // Create player with proper collision body
    player = this.matter.add.sprite(400, 100, 'player', null, {
        friction: 0.05,
        restitution: 0,
        density: 0.001,
        label: 'player',
        chamfer: { radius: 4 },
        shape: {
            type: 'rectangle',
            width: PLAYER_SIZE,
            height: PLAYER_SIZE
        }
    });
    
    // Set fixed rotation to false to allow rolling
    player.setFixedRotation(false);

    // Set up camera
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
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

    // Ground collision detection
    this.matter.world.on('collisionstart', (event) => {
        event.pairs.forEach((pair) => {
            if (pair.bodyA.label === 'player' || pair.bodyB.label === 'player') {
                resetJump();
                canDash = true;
            }
        });
    });
}

function update() {
    const speed = 3;
    const jumpForce = -6;
    
    // Handle left/right movement
    if (cursors.left.isDown && !isDashing) {
        player.setVelocityX(-speed);
        facing = 'left';
    } else if (cursors.right.isDown && !isDashing) {
        player.setVelocityX(speed);
        facing = 'right';
    } else if (!isDashing) {
        // Apply friction to slow down
        player.setVelocityX(player.body.velocity.x * 0.8);
    }

    // Handle jumping
    if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
        if (canDoubleJump) {
            // First jump
            player.setVelocityY(jumpForce);
            canDoubleJump = false;
        } else if (!hasDoubleJumped) {
            // Second jump (double jump)
            player.setVelocityY(jumpForce * 0.8);
            hasDoubleJumped = true;
        }
    }

    // Keep player in world bounds manually
    if (player.x < 0) player.setX(0);
    if (player.x > WORLD_WIDTH) player.setX(WORLD_WIDTH);
    if (player.y < 0) player.setY(0);
    if (player.y > WORLD_HEIGHT) {
        player.setY(WORLD_HEIGHT);
        resetJump();
        canDash = true;
    }

    const camera = this.cameras.main;
    const marginLeft = 400;  // Distance from left edge before camera stops
    const marginRight = WORLD_WIDTH - 400;  // Distance from right edge before camera stops
    
    if (player.x < marginLeft) {
        camera.startFollow(player);
        camera.setScroll(0, camera.scrollY);
    } else if (player.x > marginRight) {
        camera.startFollow(player);
        camera.setScroll(WORLD_WIDTH - camera.width / camera.zoom, camera.scrollY);
    } else {
        camera.startFollow(player);
    }

    // Add rotation dampening
    if (!cursors.left.isDown && !cursors.right.isDown) {
        // Gradually slow down rotation when not moving
        player.setAngularVelocity(player.body.angularVelocity * 0.95);
    } else {
        // Add some rotation based on movement
        const rotationSpeed = 0.05;
        if (cursors.left.isDown) {
            player.setAngularVelocity(-rotationSpeed);
        } else if (cursors.right.isDown) {
            player.setAngularVelocity(rotationSpeed);
        }
    }
}

function dash() {
    const dashSpeed = 8;
    const dashDuration = 200;
    
    isDashing = true;
    dashCooldown = true;
    
    const dashVelocity = facing === 'right' ? dashSpeed : -dashSpeed;
    player.setVelocityX(dashVelocity);
    player.setVelocityY(0);
    
    setTimeout(() => {
        isDashing = false;
    }, dashDuration);
    
    setTimeout(() => {
        dashCooldown = false;
    }, 500);
}

function resetJump() {
    canDoubleJump = true;
    hasDoubleJumped = false;
}