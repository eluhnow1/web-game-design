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
        this.crumblingPlatforms = new Map(); // Store platform states
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
        // Get all tiles in the crumbling layer
        const crumblingTiles = this.crumblingLayer.getTilesWithin();
        
        crumblingTiles.forEach(tile => {
            if (tile.index !== -1) { // If tile exists
                this.crumblingPlatforms.set(`${tile.x},${tile.y}`, {
                    tile: tile,
                    timer: null,
                    isShaking: false,
                    originalX: tile.pixelX,
                    respawnTimer: null,
                    visible: true
                });
            }
        });

        // Set up collision callback
        this.scene.matter.world.on('collisionStart', (event) => {
            event.pairs.forEach((pair) => {
                if (pair.bodyA.label === 'player' || pair.bodyB.label === 'player') {
                    const playerBody = pair.bodyA.label === 'player' ? pair.bodyA : pair.bodyB;
                    const tileBody = pair.bodyA.label === 'player' ? pair.bodyB : pair.bodyA;

                    // Check if player is standing on a crumbling platform
                    if (playerBody.velocity.y >= 0) { // Player is moving downward or standing
                        const tileX = Math.floor(tileBody.position.x / 16);
                        const tileY = Math.floor(tileBody.position.y / 16);
                        const platformKey = `${tileX},${tileY}`;
                        
                        if (this.crumblingPlatforms.has(platformKey)) {
                            const platform = this.crumblingPlatforms.get(platformKey);
                            if (platform.visible && !platform.isShaking) {
                                this.startCrumbling(platformKey);
                            }
                        }
                    }
                }
            });
        });
    }

    startCrumbling(platformKey) {
        const platform = this.crumblingPlatforms.get(platformKey);
        if (!platform || !platform.visible) return;

        platform.isShaking = true;
        let shakeOffset = 0;
        let shakeIntensity = 0.5;

        // Shake animation
        platform.timer = this.scene.time.addEvent({
            delay: 16,
            callback: () => {
                if (platform.visible) {
                    shakeOffset = Math.sin(this.scene.time.now * 0.1) * shakeIntensity;
                    platform.tile.pixelX = platform.originalX + shakeOffset;
                    shakeIntensity += 0.1;
                }
            },
            loop: true
        });

        // Destroy platform after 1 second
        this.scene.time.delayedCall(1000, () => {
            if (platform.timer) platform.timer.destroy();
            platform.isShaking = false;
            platform.visible = false;
            platform.tile.setVisible(false);
            platform.tile.pixelX = platform.originalX;
            
            // Respawn platform after 5 seconds
            platform.respawnTimer = this.scene.time.delayedCall(5000, () => {
                platform.visible = true;
                platform.tile.setVisible(true);
                platform.tile.pixelX = platform.originalX;
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
            const crumblingTile = this.crumblingLayer.getTileAt(x, y);
            return (tile && solidTiles.includes(tile.index)) || 
                   (crumblingTile && crumblingTile.index !== -1);
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