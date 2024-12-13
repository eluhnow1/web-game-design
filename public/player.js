const PLAYER_SIZE = 30;
const PLAYER_CROUCH_SIZE = 12;
const MAX_NORMAL_SPEED = 6;
const MAX_CROUCH_SPEED = 3;
const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 3200;
const TILE_SIZE = 16;

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
            angle: 0,
            torque: 0,
            angularVelocity: 0,
            collisionFilter: {
                category: 0x0002,
                mask: 0x000D
            },
            shape: {
                type: 'rectangle',
                width: 28,
                height: PLAYER_SIZE*2
            }
        });
    
        this.setupPhysics();
        this.setupAnimations();
        this.initializeState();
        this.isOnLadder = false;
        this.canClimbLadder = false;
        this.climbSpeed = 1.5;
    }

    initializeState() {//just initializing a bunch of important booleans
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;
        this.canDash = false;
        this.isDashing = false;
        this.dashCooldown = false;
        this.facing = 'right';
        this.isCrouching = false;
        this.isTransitioningCrouch = false;
        this.abilities = {
            moveRight: true,
            moveLeft: false,
            crouch: false,
            jump: false,
            dash: false,
            doubleJump: false,
            wallJump: false
        };
        this.preventNextJump = false;
    }

    setupPhysics() {
        this.sprite.setBounce(0);
        this.sprite.setFriction(0.001);
        this.sprite.setFixedRotation();
        this.sprite.body.collisionFilter.group = -1;
        this.sprite.body.sleepThreshold = -1;
        this.sprite.setFixedRotation(true);
        
        this.sprite.setOrigin(0.5, 0.5);
        
        this.sprite.setScale(0.5);
        this.sprite.body.collisionFilter.mask = 0x001D;
    }

    setupAnimations() {//creates the animations from sprite sheets
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

        this.scene.anims.create({
            key: 'ladder-climb',
            frames: this.scene.anims.generateFrameNumbers('ladder-climb', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.sprite.play('idle');
    }

    update() {
        this.sprite.setRotation(0);
        this.sprite.body.angle = 0;
        this.sprite.body.angularVelocity = 0;
        this.handleMovement();
        this.handleJump();
        this.constrainToWorld();
        this.updateCamera();
    }

    handleMovement() {
        if (this.isOnLadder) {
            this.sprite.setVelocityX(0);
            return;
        }
        const normalSpeed = 2;
        const crouchSpeed = 1;
        const speed = this.isCrouching ? crouchSpeed : normalSpeed;
        const maxSpeed = this.isCrouching ? MAX_CROUCH_SPEED : MAX_NORMAL_SPEED;
    
        this.sprite.setRotation(0);
    
        // Check movement abilities
        if (this.scene.cursors.right.isDown && this.abilities.moveRight && !this.isDashing) {
            const newVelocityX = Phaser.Math.Clamp(speed, -maxSpeed, maxSpeed);
            this.sprite.setVelocityX(newVelocityX);
            this.sprite.flipX = false;
            this.facing = 'right';
            
            if (!this.isTransitioningCrouch && Math.abs(this.sprite.body.velocity.x) > 0.1) {
                const anim = this.isCrouching ? 'crouch-walk' : 'walk';
                if (this.sprite.anims.currentAnim?.key !== anim) {
                    this.sprite.play(anim, true);
                }
            }
        }
        else if (this.scene.cursors.left.isDown && this.abilities.moveLeft && !this.isDashing) {
            const newVelocityX = Phaser.Math.Clamp(-speed, -maxSpeed, maxSpeed);
            this.sprite.setVelocityX(newVelocityX);
            this.sprite.flipX = true;
            this.facing = 'left';
            
            if (!this.isTransitioningCrouch && Math.abs(this.sprite.body.velocity.x) > 0.1) {
                const anim = this.isCrouching ? 'crouch-walk' : 'walk';
                if (this.sprite.anims.currentAnim?.key !== anim) {
                    this.sprite.play(anim, true);
                }
            }
        }
        else if (!this.isDashing) {
            this.sprite.setVelocityX(0);
            
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
        
        this.checkLadderCollision();
        
        if (this.canClimbLadder) {
            if (this.scene.cursors.up.isDown) {
                this.isOnLadder = true;
                this.sprite.setVelocityY(-this.climbSpeed);
                
                // Start or resume climbing animation if it's not already playing
                if (this.sprite.anims.currentAnim?.key !== 'ladder-climb' || 
                    this.sprite.anims.isPaused) {
                    this.sprite.play('ladder-climb');
                }
            } else if (this.scene.cursors.down.isDown) {
                this.isOnLadder = true;
                this.sprite.setVelocityY(this.climbSpeed);
                
                // Start or resume climbing animation if it's not already playing
                if (this.sprite.anims.currentAnim?.key !== 'ladder-climb' || 
                    this.sprite.anims.isPaused) {
                    this.sprite.play('ladder-climb');
                }
            } else if (this.isOnLadder) {
                // Stop vertical movement and pause animation on current frame
                this.sprite.setVelocityY(0);
                if (this.sprite.anims.currentAnim?.key === 'ladder-climb') {
                    this.sprite.anims.pause();
                } else {
                    this.sprite.anims.play('ladder-climb', true);
                    this.sprite.anims.pause();
                }
            }
            return;
        }
        
        // If we were on a ladder but aren't anymore
        if (this.isOnLadder) {
            this.isOnLadder = false;
            // Don't allow immediate jump when leaving ladder while holding up
            if (this.scene.cursors.up.isDown) {
                this.preventNextJump = true;
            }
        }
        if (this.preventNextJump) {
            this.preventNextJump = false;
            return;
        }
        if (!this.abilities.jump) return;
    
        const jumpForce = -6;

        if (Phaser.Input.Keyboard.JustDown(this.scene.cursors.up) && !this.isCrouching) {
            if (this.canDoubleJump && this.abilities.doubleJump) {
                this.sprite.play('jump', true);
                this.sprite.setVelocityY(jumpForce);
                this.canDoubleJump = false;
            } else if (!this.hasDoubleJumped) {
                this.sprite.play('jump', true);
                this.sprite.setVelocityY(jumpForce);
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
        if (!this.abilities.crouch || this.isTransitioningCrouch || this.isCrouching) return;
    
        this.isTransitioningCrouch = true;
    
        // Store current velocity and position
        const currentVelX = this.sprite.body.velocity.x;
        const currentVelY = this.sprite.body.velocity.y;
        const currentBottom = this.sprite.y; // Store the current bottom position
    
        // Calculate the new center position for the physics body
        const newY = currentBottom + (PLAYER_CROUCH_SIZE/2)-2;
    
        // Create new physics body
        const newBody = this.scene.matter.bodies.rectangle(
            this.sprite.x,
            newY,
            14,
            PLAYER_CROUCH_SIZE,
            {
                friction: 0.001,
                frictionStatic: 0.05,
                frictionAir: 0.01,
                restitution: 0,
                label: 'player',
                inertia: Infinity,
                collisionFilter: {
                    category: 0x0002,
                    mask: 0x000D
                }
            }
        );
    
        // Update the sprite's body
        this.scene.matter.body.setVertices(this.sprite.body, newBody.vertices);
        
        // Update sprite position and origin for crouching
        this.sprite.setOrigin(0.5, 0.75);
        this.sprite.setPosition(this.sprite.x, newY);
        
        // Restore velocity
        this.sprite.setVelocity(currentVelX, currentVelY);
    
        // Play animation
        this.sprite.play('crouch-transition').once('animationcomplete', () => {
            this.isCrouching = true;
            this.isTransitioningCrouch = false;
            this.sprite.play('crouch-idle');
        });
    }
    
    endCrouch() {
        if (this.isTransitioningCrouch || !this.isCrouching) return;
    
        this.isTransitioningCrouch = true;
    
        // Store current velocity and position
        const currentVelX = this.sprite.body.velocity.x;
        const currentVelY = this.sprite.body.velocity.y;
        const currentBottom = this.sprite.y + PLAYER_CROUCH_SIZE/2; // Get current bottom position
    
        // Calculate the new center position for the physics body
        const newY = currentBottom - PLAYER_SIZE/2;
    
        // Create new physics body
        const newBody = this.scene.matter.bodies.rectangle(
            this.sprite.x,
            newY,
            14, 
            PLAYER_SIZE,
            {
                friction: 0.001,
                frictionStatic: 0.05,
                frictionAir: 0.01,
                restitution: 0,
                label: 'player',
                inertia: Infinity,
                collisionFilter: {
                    category: 0x0002,
                    mask: 0x000D
                }
            }
        );
    
        // Update the sprite's body
        this.scene.matter.body.setVertices(this.sprite.body, newBody.vertices);
        
        // Update sprite position and origin for standing
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setPosition(this.sprite.x, currentBottom);
        
        // Restore velocity
        this.sprite.setVelocity(currentVelX, currentVelY);
    
        // Play animation
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
    
    // Add this helper method to get the proper bottom position for collision checks
    getBottomPosition() {
        if (this.isCrouching) {
            return this.sprite.y + PLAYER_CROUCH_SIZE/2;
        } else {
            return this.sprite.y;  // Since origin is at bottom when standing
        }
    }

    dash() {//Handles the dash physics
        if (!this.abilities.dash) return;
        const dashSpeed = 8;
        const dashDuration = 200;
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

    constrainToWorld() {//Makes sure the character stays within the world bounds
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

    updateCamera() {//Handles the movement of the camera around the player
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

    checkLadderCollision() {
        const bodies = this.scene.matter.world.localWorld.bodies;
        this.canClimbLadder = false;
        
        for (let body of bodies) {
            if (body.label === 'ladder') {
                const overlap = this.scene.matter.overlap(this.sprite.body, body);
                if (overlap) {
                    this.canClimbLadder = true;
                    // Check if player is at top of ladder
                    const playerBottom = this.sprite.y + PLAYER_SIZE/2;
                    const ladderTop = body.position.y - TILE_SIZE/2;
                    
                    if (playerBottom <= ladderTop + 2) {
                        this.canClimbLadder = false;
                    }
                    break;
                }
            }
        }
        
        if (!this.canClimbLadder) {
            this.isOnLadder = false;
        }
    }
}
export default Player;