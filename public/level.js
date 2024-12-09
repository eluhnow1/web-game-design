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
        this.crumblingPlatforms = new Map();
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
        const breakableLayer = map.createLayer('breakable blocks', [gametileset, platformsTileset]);
    
        this.mainLayer.setCollisionByProperty({ collision: true });
        this.crumblingLayer.setCollisionByProperty({ collision: true });
        
        // Initialize crumbling platform collision handling
        this.setupCrumblingPlatforms();
        this.createCollisionBodies();
    
        this.scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.scene.cameras.main.startFollow(this.scene.player.sprite, true, 0.2, 0.2);
        this.scene.cameras.main.setZoom(3.5);
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
                this.crumblingLayer.putTileAt(262, platform.leftTile.x, platform.leftTile.y);
                this.crumblingLayer.putTileAt(263, platform.rightTile.x, platform.rightTile.y);
                
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
                    slop: 0
                });
            }
        }
    }
}

export default Level;