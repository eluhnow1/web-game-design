const TILE_SIZE = 16;

class Level {
    constructor(scene) {
        this.scene = scene;
        this.tilemap = null;
        this.pickups = [];
        this.hazards = [];
        this.exit = null;
        this.mainLayer = null;
        this.crumblingLayer = null;
        this.breakableLayer = null;
        this.crumblingPlatforms = new Map();
        this.breakableBlocks = new Map();
        this.pickups = new Map();
        this.springs = [];
        this.cannons = [];
        this.cannonballs = [];
        this.cages = [];
        this.keys = [];
        this.star = null;
        this.winText = null;
        this.resetButton = null;
        this.playAgainButton = null;
        this.spawnPoint = { x: 450, y: 660 };
    }

    createStar(x, y) {
        this.star = this.scene.matter.add.sprite(x, y, 'star', null, {
            isStatic: true,
            isSensor: true,
            label: 'star',
            collisionFilter: {
                category: 0x0008,
                mask: 0x0002
            }
        });
        
        this.star.setScale(0.1);
        
        // Add floating animation
        this.scene.tweens.add({
            targets: this.star,
            y: y - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Add glow effect
        this.scene.tweens.add({
            targets: this.star,
            alpha: 0.7,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    

    showWinScreen() {
        // Create semi-transparent black overlay
        const overlay = this.scene.add.rectangle(
            0, 0,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000, 0.7
        );
        overlay.setScrollFactor(0);
        overlay.setOrigin(0);
        
        // Add "You Win!" text
        this.winText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2 - 50,
            'You Win!',
            {
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ffffff'
            }
        );
        this.winText.setScrollFactor(0);
        this.winText.setOrigin(0.5);
        
    
    }

    

    createSpring(x, y) {
        // Create spring sprite
        const spring = this.scene.matter.add.sprite(x, y, 'spring', 0, {
            isStatic: true,
            label: 'spring',
            collisionFilter: {
                category: 0x0001,
                mask: 0x0002
            }
        });
    
        // Scale the spring to match your tile size (32x32)
        spring.setScale(32/230); // This will scale it down to roughly tile size
    
        // Create spring animation
        if (!this.scene.anims.exists('spring-bounce')) {
            this.scene.anims.create({
                key: 'spring-bounce',
                frames: this.scene.anims.generateFrameNumbers('spring', { start: 0, end: 7 }),
                frameRate: 24,
                repeat: 0
            });
        }
    
        // Return to first frame when animation completes
        spring.on('animationcomplete', () => {
            spring.setFrame(0);
        });
    
        this.springs.push(spring);
        return spring;
    }

    handleSpringCollision(player, spring) {
        // Play spring animation
        spring.play('spring-bounce');
        
        // Launch player upward with more force than a regular jump
        player.setVelocityY(-7); // Adjust this value to control launch height
    }

    createCannon(x, y, facingLeft = false) {
        const cannon = this.scene.matter.add.sprite(x, y, 'cannon', 0, {
            isStatic: true,
            label: 'cannon',
            collisionFilter: {
                category: 0x0001,
                mask: 0x0002
            },
            shape: {
                type: 'rectangle',
                width: 320,
                height: 320
            }
        });

        cannon.setScale(32/1024); // Scale to 16x16 pixels
        cannon.flipX = facingLeft;
        
        // Create cannon animation if it doesn't exist
        if (!this.scene.anims.exists('cannon-shoot')) {
            this.scene.anims.create({
                key: 'cannon-shoot',
                frames: this.scene.anims.generateFrameNumbers('cannon', { start: 0, end: 4 }),
                frameRate: 12,
                repeat: 0
            });
        }

        // Create cannonball animation if it doesn't exist
        if (!this.scene.anims.exists('cannonball-spin')) {
            this.scene.anims.create({
                key: 'cannonball-spin',
                frames: this.scene.anims.generateFrameNumbers('cannonball', { start: 0, end: 1 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Setup cannon shooting interval
        this.scene.time.addEvent({
            delay: 1000,
            callback: () => this.shootCannon(cannon, facingLeft),
            loop: true
        });

        this.cannons.push(cannon);
        return cannon;
    }

    shootCannon(cannon, facingLeft) {
        cannon.play('cannon-shoot').once('animationcomplete', () => {
            const cannonball = this.scene.matter.add.sprite(
                cannon.x + (facingLeft ? -20 : 20),
                cannon.y,
                'cannonball',
                0,
                {
                    label: 'cannonball',
                    collisionFilter: {
                        category: 0x0004,  
                        mask: 0x0003
                    }
                }
            );
    
            cannonball.setScale(10/160);
            cannonball.setStatic(false);
         
            const startY = cannonball.y;
  
            this.scene.events.on('update', () => {
                if (cannonball && cannonball.body) {
                    cannonball.y = startY;  // Force y position to stay constant
                    cannonball.setVelocityX(facingLeft ? -5 : 5);
                }
            });

            cannonball.play('cannonball-spin');
            cannonball.flipX = facingLeft;
    
            // Handle cannonball collisions
            this.scene.matter.world.on('collisionstart', (event) => {
                event.pairs.forEach((pair) => {
                    const bodyA = pair.bodyA;
                    const bodyB = pair.bodyB;
                    
                    if (bodyA.label === 'cannonball' || bodyB.label === 'cannonball') {
                        const ball = bodyA.label === 'cannonball' ? bodyA.gameObject : bodyB.gameObject;
                        const other = bodyA.label === 'cannonball' ? bodyB : bodyA;
                        
                        if (other.label === 'player') {
                            // Reset player position
                            this.scene.player.sprite.setPosition(450, 660);
                        }
                        
                        // Destroy cannonball in either case
                        if (ball && ball.destroy) {
                            ball.destroy();
                        }
                    }
                });
            });
    
            this.cannonballs.push(cannonball);
        });
    }

    handleKeyAndCageInteraction(player, key) {
        // Destroy the key
        key.destroy();
    
        // Find and destroy the corresponding cage
        const correspondingCage = this.cages.find(cage => !cage.isDestroyed);
        if (correspondingCage) {
            correspondingCage.destroy();
            correspondingCage.isDestroyed = true;
        }
    }
    
    createKeyAndCage(xKey, yKey, xCage, yCage) {
        // Create key
        const key = this.scene.matter.add.sprite(xKey, yKey, 'key', null, {
            isStatic: true,
            isSensor: true,
            label: 'key',
            collisionFilter: {
                category: 0x0008,
                mask: 0x0002
            }
        });
    
        key.setScale(0.05);
        this.keys.push(key);
    
        // Add floating animation to key
        this.scene.tweens.add({
            targets: key,
            y: yKey - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    
        // Create cage
        const cage = this.scene.matter.add.sprite(xCage, yCage, 'cage', null, {
            isStatic: true,
            label: 'cage',
            collisionFilter: {
                category: 0x0001,
                mask: 0x0002
            }
        });
    
        cage.setScale(0.05);
        cage.isDestroyed = false;
        this.cages.push(cage);
    
        // Add collision detection for the key
        this.scene.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
    
                if (bodyA.label === 'player' || bodyB.label === 'player') {
                    const collidedKey = bodyA.label === 'key' ? bodyA.gameObject : 
                                       bodyB.label === 'key' ? bodyB.gameObject : null;
    
                    if (collidedKey === key) {
                        this.handleKeyAndCageInteraction(this.scene.player.sprite, collidedKey);
                    }
                }
            });
        });
    }

    setupBreakableBlocks() {
        const breakableTiles = this.breakableLayer.getTilesWithin();
        
        breakableTiles.forEach(tile => {
            if (tile.index !== -1) {  // If it's not an empty tile
                // Create collision body for the breakable block
                const collisionBody = this.scene.matter.add.rectangle(
                    tile.pixelX + TILE_SIZE/2,
                    tile.pixelY + TILE_SIZE/2,
                    TILE_SIZE,
                    TILE_SIZE,
                    {
                        isStatic: true,
                        friction: 0.5,
                        label: 'breakable',
                        collisionFilter: {
                            category: 0x0001,
                            mask: 0x0002
                        }
                    }
                );

                // Store the tile and body information
                this.breakableBlocks.set(`${tile.x},${tile.y}`, {
                    tile: tile,
                    body: collisionBody
                });
            }
        });
    }

    breakBlock(blockBody) {
        // Find the corresponding tile based on body position
        const tileX = Math.floor(blockBody.position.x / TILE_SIZE);
        const tileY = Math.floor(blockBody.position.y / TILE_SIZE);
        const key = `${tileX},${tileY}`;
        const blockInfo = this.breakableBlocks.get(key);

        if (blockInfo) {
            // Remove the tile
            this.breakableLayer.removeTileAt(blockInfo.tile.x, blockInfo.tile.y);
            
            // Remove the collision body
            this.scene.matter.world.remove(blockBody);
            
            // Remove from our tracking Map
            this.breakableBlocks.delete(key);

            // Optional: Add particles or animation effect here
            this.createBreakEffect(blockBody.position.x, blockBody.position.y);
        }
    }

    createBreakEffect(x, y) {
        // Create particle effect for block breaking
        const particles = this.scene.add.particles(x, y, 'block-particle', {
            speed: 100,
            lifespan: 500,
            scale: { start: 1, end: 0 },
            quantity: 10,
            blendMode: 'ADD'
        });

        // Stop emitting after a short duration
        this.scene.time.delayedCall(100, () => {
            particles.destroy();
        });
    }

    createPickups() {
        // Define pickup locations (x, y coordinates in pixels)
        const pickupLocations = {
            moveLeft: { x: 830, y: 655 },
            crouch: { x: 860, y: 590 },
            jump: { x: 50, y: 655 },
            dash: { x: 50, y: 475 },
            doubleJump: { x: 860, y: 350 },
            wallJump: { x: 860, y: 270 }
        };
    
        // Create each pickup
        for (const [ability, location] of Object.entries(pickupLocations)) {
            const sprite = this.scene.matter.add.sprite(
                location.x,
                location.y,
                `${ability}-pickup`,
                null,
                {
                    isStatic: true,
                    isSensor: true,
                    label: `pickup-${ability}`,
                    collisionFilter: {
                        category: 0x0008,  
                        mask: 0x0002      
                    }
                }
            );
            sprite.setScale(0.1);
            this.pickups.set(ability, sprite);
        }
    
        // Add collision detection for pickups
        this.scene.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                
                if (bodyA.label === 'player' || bodyB.label === 'player') {
                    const pickup = bodyA.label.startsWith('pickup-') ? bodyA : 
                                 bodyB.label.startsWith('pickup-') ? bodyB : null;
                    
                    if (pickup) {
                        const ability = pickup.label.replace('pickup-', '');
                        this.scene.player.abilities[ability] = true;
                        this.pickups.get(ability).destroy();
                        this.pickups.delete(ability);
           
                    }
                }
            });
        });

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
        this.crumblingLayer = map.createLayer('crumbling platforms', [gametileset, platformsTileset]);
        this.breakableLayer = map.createLayer('breakable blocks', [gametileset, platformsTileset]);
    
        this.mainLayer.setCollisionByProperty({ collision: true });
        this.crumblingLayer.setCollisionByProperty({ collision: true });
        this.breakableLayer.setCollisionByProperty({ collision: true });
        
        this.setupCrumblingPlatforms();
        this.setupBreakableBlocks();
        this.createCollisionBodies();
        this.createPickups();

        laddersLayer.setCollisionByProperty({ collision: true });

        // Create ladder bodies for collision detection
        const ladderTiles = laddersLayer.getTilesWithin();
        ladderTiles.forEach(tile => {
            if (tile.index === 74) {
                const ladderBody = this.scene.matter.add.rectangle(
                    tile.pixelX + TILE_SIZE/2,
                    tile.pixelY + TILE_SIZE/2,
                    TILE_SIZE,
                    TILE_SIZE,
                    {
                        isStatic: true,
                        isSensor: true,
                        label: 'ladder',
                        collisionFilter: {
                            category: 0x0010,
                            mask: 0x0002
                        }
                    }
                );
            }
        });
    
        // Create springs AFTER map creation
        const springPositions = [
            { x: 570, y: 660 },
        ];
    
        springPositions.forEach(pos => {
            this.createSpring(pos.x, pos.y);
        });

        const cannonPositions = [
            { x: 24, y: 648, facingLeft: false },
            { x: 800, y: 105, facingLeft: true },
        ];
    
        cannonPositions.forEach(pos => {
            this.createCannon(pos.x, pos.y, pos.facingLeft);
        });
    
        this.createStar(860, 100); // Adjust coordinates as needed

        // Setup camera
        this.scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.scene.cameras.main.startFollow(this.scene.player.sprite, true, 0.2, 0.2);
        this.scene.cameras.main.setZoom(3.5);
    
        // Setup collision handling
        this.scene.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                
                if (bodyA.label === 'player' || bodyB.label === 'player') {
                    const spring = bodyA.label === 'spring' ? bodyA.gameObject : 
                                 bodyB.label === 'spring' ? bodyB.gameObject : null;
                    const player = bodyA.label === 'player' ? bodyA.gameObject : 
                                 bodyB.label === 'player' ? bodyB.gameObject : null;
                    const star = bodyA.label === 'star' ? bodyA.gameObject :
                                 bodyB.label === 'star' ? bodyB.gameObject : null;
                    
                    if (spring && player) {
                        this.handleSpringCollision(player, spring);
                    }

                    if (star) {
                        this.showWinScreen();
                    }

                    // Handle breakable block collisions when dashing
                    if (this.scene.player.isDashing) {
                        const blockBody = bodyA.label === 'breakable' ? bodyA :
                                        bodyB.label === 'breakable' ? bodyB : null;
                        
                        if (blockBody) {
                            this.breakBlock(blockBody);
                        }
                    }
                }
            });
        });
    }

    setupCrumblingPlatforms() {
        const crumblingTiles = this.crumblingLayer.getTilesWithin();
        
        // Group tiles into platform pairs
        const processedTiles = new Set();
        
        crumblingTiles.forEach(tile => {
            if (tile.index !== -1 && !processedTiles.has(`${tile.x},${tile.y}`)) {
                // Check if this tile is a left tile (262)
                if (tile.index === 262) {
                    const rightTile = this.crumblingLayer.getTileAt(tile.x + 1, tile.y);
                    if (rightTile && rightTile.index === 263) {
                        // Create collision body for the platform pair
                        const collisionBody = this.scene.matter.add.rectangle(
                            tile.pixelX + TILE_SIZE,  // Center between the two tiles
                            tile.pixelY + TILE_SIZE/2,
                            TILE_SIZE * 2,  // Width of two tiles
                            TILE_SIZE,
                            {
                                isStatic: true,
                                friction: 0.5,
                                label: 'crumbling',
                                collisionFilter: {
                                    category: 0x0001,
                                    mask: 0x0002
                                }
                            }
                        );

                        // Store platform info for both tiles
                        const platformInfo = {
                            leftTile: tile,
                            rightTile: rightTile,
                            timer: null,
                            isShaking: false,
                            originalLeftX: tile.pixelX,
                            originalRightX: rightTile.pixelX,
                            respawnTimer: null,
                            visible: true,
                            collisionBody: collisionBody
                        };

                        // Store same platform info for both tiles
                        this.crumblingPlatforms.set(`${tile.x},${tile.y}`, platformInfo);
                        this.crumblingPlatforms.set(`${rightTile.x},${rightTile.y}`, platformInfo);
                        
                        // Mark both tiles as processed
                        processedTiles.add(`${tile.x},${tile.y}`);
                        processedTiles.add(`${rightTile.x},${rightTile.y}`);
                    }
                }
            }
        });

        // Add an update event to check for player position
        this.scene.events.on('update', this.checkPlayerPosition, this);
    }

    checkPlayerPosition() {
        if (!this.scene.player || !this.scene.player.sprite) return;
    
        const player = this.scene.player.sprite;
        const playerX = Math.floor(player.x / TILE_SIZE);
        const playerY = Math.floor((player.y + TILE_SIZE/2) / TILE_SIZE);
    
        // Only check when player is moving down or standing
        if (player.body.velocity.y >= 0) {
            
            // Check the tile directly under the player and adjacent tiles
            for (let dx = -1; dx <= 1; dx++) {
                const checkKey = `${playerX + dx},${playerY}`;
                const platform = this.crumblingPlatforms.get(checkKey);
                
                if (platform && platform.visible && !platform.isShaking) {
                    const tileTop = platform.leftTile.y * TILE_SIZE; // Use leftTile for Y position
                    const playerBottom = player.y + TILE_SIZE/2;
                    
                    // Check if player is actually touching the platform
                    if (Math.abs(playerBottom - tileTop) < 2) {
                        this.startCrumbling(checkKey);
                        return;
                    }
                }
            }
        }
    }

    startCrumbling(platformKey) {
        const platform = this.crumblingPlatforms.get(platformKey);
        if (!platform || !platform.visible) return;
        platform.isShaking = true;
        let shakeOffset = 0;
        let shakeIntensity = 0.5;
    
        platform.timer = this.scene.time.addEvent({
            delay: 16,
            callback: () => {
                if (platform.visible) {
                    shakeOffset = Math.sin(this.scene.time.now * 0.1) * shakeIntensity;
                    platform.leftTile.pixelX = platform.originalLeftX + shakeOffset;
                    platform.rightTile.pixelX = platform.originalRightX + shakeOffset;
                    shakeIntensity += 0.1;
                }
            },
            loop: true
        });
    
        this.scene.time.delayedCall(1000, () => {
            if (platform.timer) platform.timer.destroy();
            platform.isShaking = false;
            platform.visible = false;
            
            // Remove both tiles
            this.crumblingLayer.removeTileAt(platform.leftTile.x, platform.leftTile.y);
            this.crumblingLayer.removeTileAt(platform.rightTile.x, platform.rightTile.y);
            
            // Completely disable collision with this platform
            platform.collisionBody.collisionFilter.category = 0x0000;
            platform.collisionBody.collisionFilter.mask = 0x0000;
            
            // Apply a tiny upward force to break any remaining contact
            const player = this.scene.player.sprite;
            if (Math.abs(player.y - platform.collisionBody.position.y) < TILE_SIZE) {
                player.setVelocityY(0.1);
            }
            
            platform.respawnTimer = this.scene.time.delayedCall(5000, () => {
                platform.visible = true;
                
                // Restore tiles
                const leftTile = this.crumblingLayer.putTileAt(262, platform.leftTile.x, platform.leftTile.y);
                const rightTile = this.crumblingLayer.putTileAt(263, platform.rightTile.x, platform.rightTile.y);
                
                // Update tile references and reset positions
                platform.leftTile = leftTile;
                platform.rightTile = rightTile;
                platform.leftTile.pixelX = platform.originalLeftX;
                platform.rightTile.pixelX = platform.originalRightX;
                
                // Restore collision
                platform.collisionBody.collisionFilter.category = 0x0001;
                platform.collisionBody.collisionFilter.mask = 0x0002;
            });
        });
    }
    

    createCollisionBodies() {
        const solidTiles = [1, 2, 3, 4, 9, 17, 19];
        const mapWidth = this.mainLayer.width;
        const mapHeight = this.mainLayer.height;
        const visited = Array(mapHeight).fill(0).map(() => Array(mapWidth).fill(false));
        
        const isSolidTile = (x, y) => {
            if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return false;
            const tile = this.mainLayer.getTileAt(x, y);
            // Remove crumbling tiles from main collision creation
            return (tile && solidTiles.includes(tile.index));
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
                    slop: 0,
                    collisionFilter: {
                        category: 0x0001,  // Ground category
                        mask: 0x0006      // Binary 0110, meaning it collides with player (0010) and cannonballs (0100)
                    }
                });
            }
        }
    }
}

export default Level;