const TILE_SIZE = 16;

class Level {
    constructor(scene) {
        this.scene = scene;
        this.tilemap = null;
        this.pickups = [];
        this.hazards = [];
        this.exit = null;
        this.mainLayer = null;
    }

    create() {//Initializes tilemap and camera bounds and zoom
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

    createCollisionBodies() {//Gives collision logic to all tiles in a certain layer of the map, also connects adjacent ones
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

export default Level;