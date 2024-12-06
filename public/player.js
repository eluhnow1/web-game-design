const PLAYER_SIZE = 32;
const PLAYER_CROUCH_SIZE = 16;
const MAX_NORMAL_SPEED = 6;
const MAX_CROUCH_SPEED = 3;
const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 3200;

class Player {
    constructor(scene, x, y) {//sets up the attributes of the player and how it interacts with things
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

    initializeState() {//just initializing a bunch of important booleans
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;
        this.canDash = false;
        this.isDashing = false;
        this.dashCooldown = false;
        this.facing = 'right';
        this.isCrouching = false;
        this.isTransitioningCrouch = false;
    }

    setupPhysics() {//more attribute initialization
        this.sprite.setBounce(0);
        this.sprite.setFriction(0.001);
        this.sprite.setFixedRotation();
        this.sprite.body.collisionFilter.group = -1;
        this.sprite.body.sleepThreshold = -1;
        this.sprite.setFixedRotation(true);
        this.sprite.setOrigin(0.5, 0.75);
        this.sprite.setScale(0.5);
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

        this.sprite.play('idle');
    }

    update() {
        this.handleMovement();
        this.handleJump();
        this.constrainToWorld();
        this.updateCamera();
    }

    handleMovement() {
        const normalSpeed = 2; // Default speed for normal movement
        const crouchSpeed = 1; // Speed for crouching movement
        const speed = this.isCrouching ? crouchSpeed : normalSpeed;
        const maxSpeed = this.isCrouching ? MAX_CROUCH_SPEED : MAX_NORMAL_SPEED;
    
        this.sprite.setRotation(0);
    
        // Movement input is detected
        if ((this.scene.cursors.left.isDown || this.scene.cursors.right.isDown) && !this.isDashing) {
            const movingLeft = this.scene.cursors.left.isDown;
            const movingRight = this.scene.cursors.right.isDown;
    
            const direction = movingLeft ? -1 : 1;
            const newVelocityX = Phaser.Math.Clamp(direction * speed, -maxSpeed, maxSpeed);
            this.sprite.setVelocityX(newVelocityX);
    
            this.sprite.flipX = movingLeft;
            this.facing = movingLeft ? 'left' : 'right';
    
            // Play walking animation if moving
            if (!this.isTransitioningCrouch && Math.abs(this.sprite.body.velocity.x) > 0.1) {
                const anim = this.isCrouching ? 'crouch-walk' : 'walk';
                if (this.sprite.anims.currentAnim?.key !== anim) {
                    this.sprite.play(anim, true);
                }
            }
        } 
        // No movement input, so stop immediately
        else if (!this.isDashing) {
            this.sprite.setVelocityX(0); // Stop movement immediately when no keys are pressed
    
            // Idle animation if no movement
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
    

    handleJump() {//Handles the jumping phyics and animation
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

    startCrouch() {//Handles the player crouching with shift
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

    endCrouch() {//Handles the player ending their crouch
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

    dash() {//Handles the dash physics
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
}
export default Player;