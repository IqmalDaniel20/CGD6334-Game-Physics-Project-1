const gameState = {
    speed: 240,
    ups: 380,
    bulletLifeSpan: 250,
    playerDamageCooldown: false,
    playerDamageDuration: 1000,
    playerHits: 0,
    maxPlayerHits: 5,
    bats: [],
    wolves: [],
    livesText: null,
    score: 0,
    scoreText: null
};

class Level extends Phaser.Scene {
    constructor(key) {
        super(key);
        this.levelKey = key;
        this.nextLevel = {
            'Level1': 'Level2',
            'Level2': 'Level3',
            'Level3': 'Level4',
        };
        this.numBats = 5; // Default number of bats
        this.numWolves = 1; // Default number of wolves
    }

    preload() {
        // Load all assets (images, spritesheets, audio)
        this.load.image('platform', 'assets/platform.png');
        this.load.image('platform2', 'assets/platform2.png');

        this.load.image('bg1', 'assets/forest_background2.png');
        this.load.image('bg2', 'assets/tree2.png');

        this.load.image('egg', 'assets/monster_egg.png');

        this.load.spritesheet('male', 'assets/male1.png', { frameWidth: 90, frameHeight: 90 });
        this.load.image('bullet', 'assets/bullet.png');

        this.load.spritesheet('bat', 'assets/mutated_bat.png', { frameWidth: 96, frameHeight: 80 });
        this.load.image('wing', 'assets/bat_wing.png');
        
        this.load.spritesheet('wolf', 'assets/skullwolf.png', { frameWidth: 64, frameHeight: 65 });
        this.load.image('skull', 'assets/skull.png');

        // Load audio files
        this.load.audio('bgm', 'assets/audio/Three Red Hearts - Box Jump.ogg');
        this.load.audio('shoot', 'assets/audio/shoot.wav');
        this.load.audio('jump', 'assets/audio/jump.wav');
        this.load.audio('hit', 'assets/audio/hit.wav');
        this.load.audio('collect', 'assets/audio/collect.wav');
    }

    createBackground() {
        // Create and set up the background layers
        gameState.bg1 = this.add.image(0, 0, 'bg1').setOrigin(0, 0);
        gameState.bg2 = this.add.image(0, 0, 'bg2').setOrigin(0, 0);
        const gameWidth = gameState.bg1.getBounds().width * 2; // Extend the level width
        gameState.width = gameWidth;
        const windowWidth = config.width;
        const bg2Width = gameState.bg2.getBounds().width;
        gameState.bg1.setScrollFactor(0);
        gameState.bg2.setScrollFactor((bg2Width - windowWidth) / (gameWidth - windowWidth));
    }

    createAnimations() {
        // Create animations for the player, bat, and wolf
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('male', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('male', { start: 21, end: 22 }),
            frameRate: 2,
            repeat: -1
        });
        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('male', { start: 19, end: 20 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'died',
            frames: this.anims.generateFrameNumbers('male', { start: 23, end: 25 }),
            frameRate: 10,
        });
        this.anims.create({
            key: 'bat_fly',
            frames: this.anims.generateFrameNumbers('bat', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'wolf_run',
            frames: this.anims.generateFrameNumbers('wolf', { start: 7, end: 11 }),
            frameRate: 10,
            repeat: -1
        });
    }

    setWeather(weather) {
        // Set the tint color for the background based on the weather condition
        const weathers = {
            'morning': { 'color': 0xecdccc },
            'afternoon': { 'color': 0xffffff },
            'twilight': { 'color': 0xccaacc },
            'night': { 'color': 0x555555 }
        };

        let { color } = weathers[weather];
        gameState.bg1.setTint(color);
        gameState.bg2.setTint(color);
    }

    levelSetup() {
        // Create platforms and spawn bats and wolves
        for (const platformData of this.platformPositions) {
            this.createPlatform(platformData.x, platformData.y);
        }

        const platformsWithBats = []; // Array to keep track of platforms with bats

        // Spawn multiple bats on random platforms
        for (let i = 0; i < this.numBats; i++) {
            let randomPlatform = Phaser.Math.RND.pick(gameState.platforms.getChildren());

            // Ensure the platform doesn't already have a bat
            while (platformsWithBats.includes(randomPlatform)) {
                randomPlatform = Phaser.Math.RND.pick(gameState.platforms.getChildren());
            }

            this.spawnBat(randomPlatform);
            platformsWithBats.push(randomPlatform); // Add platform to the array
        }

        // Create the goal (egg) and hide it initially
        gameState.goal = this.physics.add.sprite(gameState.width - 50, 100, 'egg').setScale(0.8).setVisible(false);
        this.physics.add.overlap(gameState.player, gameState.goal, this.reachGoal, null, this);

        this.setWeather(this.weather);

        // Spawn wolves on the ground
        for (let i = 0; i < this.numWolves; i++) {
            this.spawnWolf();
        }
    }

    reachGoal() {
        // Handle reaching the goal (egg)
        this.cameras.main.fade(800, 0, 0, 0, false, (camera, progress) => {
            if (progress > 0.9) {
                gameState.bats = []; // Clear bats array before transitioning
                gameState.wolves = []; // Clear wolves array before transitioning
                this.scene.stop(this.levelKey);

                if (this.levelKey === 'Level4') {
                    this.scene.start('CreditScene'); // Transition to CreditScene after Level4
                } else {
                    this.scene.start(this.nextLevel[this.levelKey]);
                }
                gameState.backgroundMusic.stop();
            }
        });

        // Update score when collecting the egg
        gameState.score += 100;
        gameState.scoreText.setText(`Score: ${gameState.score}`);
    }

    create() {
        // Initialize the scene and set up the game objects
        gameState.active = true;
        this.createBackground();
        gameState.player = this.physics.add.sprite(50, 500, 'male').setDepth(10);
    
        // Add sound effects
        gameState.shootSound = this.sound.add('shoot');
        gameState.jumpSound = this.sound.add('jump');
        gameState.hitSound = this.sound.add('hit', {volume : 2});
        gameState.collectSound = this.sound.add('collect');
        
        // Play background music
        gameState.backgroundMusic = this.sound.add('bgm', { loop: true, volume: 0.25 });
        gameState.backgroundMusic.play();
    
        // Set custom hitbox size and offset for the player
        let playerWidth = gameState.player.width * 0.5; // Narrowing the hitbox width to 50% of the sprite width
        let playerHeight = gameState.player.height; // Keeping the hitbox height the same
        gameState.player.body.setSize(playerWidth, playerHeight);
        gameState.player.body.setOffset((gameState.player.width - playerWidth) / 2, 0); // Center the hitbox horizontally
    
        gameState.platforms = this.physics.add.staticGroup();
        this.createAnimations();
        this.levelSetup();
        this.cameras.main.setBounds(0, 0, gameState.width, gameState.bg1.height);
        this.physics.world.setBounds(0, 0, gameState.width, gameState.bg1.height + gameState.player.height);
        this.cameras.main.startFollow(gameState.player, true, 0.1, 0.05);
        gameState.player.setCollideWorldBounds(true);
        const ground = this.physics.add.staticImage(0, config.height, 'platform2').setOrigin(0, 1).setScale(2).refreshBody();
        ground.setDepth(5);
        gameState.platforms.add(ground);
        this.physics.add.collider(gameState.player, gameState.platforms, null, this.checkCollision, this);
        this.physics.add.collider(gameState.goal, gameState.platforms);
        gameState.cursors = this.input.keyboard.createCursorKeys();
        gameState.bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 10 });
        gameState.lastFired = 0;
        gameState.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
        // Add collider for bats and player
        gameState.bats.forEach(bat => {
            this.physics.add.collider(gameState.player, bat, this.playerTakeDamage, null, this);
            this.physics.add.overlap(gameState.bullets, bat, this.bulletHitBat, null, this);
        });
    
        // Add collider for wolves and player
        gameState.wolves.forEach(wolf => {
            this.physics.add.collider(gameState.player, wolf, this.playerTakeDamage, null, this);
            this.physics.add.overlap(gameState.bullets, wolf, this.bulletHitWolf, null, this);
        });
    
        // Create the text objects to display lives and score once the font is loaded
        WebFont.load({
            custom: {
                families: ['PixelFont']
            },
            active: () => {
                gameState.livesText = this.add.text(10, 10, `Lives: ${gameState.maxPlayerHits - gameState.playerHits}`, {
                    fontSize: '24px',
                    fill: '#ffffff',
                    fontFamily: 'PixelFont',
                    stroke: '#000000',
                    strokeThickness: 6
                }).setScrollFactor(0);
    
                gameState.scoreText = this.add.text(10, 40, `Score: ${gameState.score}`, {
                    fontSize: '24px',
                    fill: '#ffffff',
                    fontFamily: 'PixelFont',
                    stroke: '#000000',
                    strokeThickness: 6
                }).setScrollFactor(0);
            }
        });
    }
    

    createPlatform(x, y) {
        // Create a static platform at the specified coordinates
        if (typeof x === 'number' && typeof y === 'number') {
            const platform = gameState.platforms.create(x, y, 'platform').setOrigin(0, 0.5).refreshBody();
            platform.setDepth(5);
            platform.body.checkCollision.down = false;
            platform.body.checkCollision.left = false;
            platform.body.checkCollision.right = false;
        }
    }

    checkCollision(player, platform) {
        // Only allow collision when the player is falling
        if (player.body.velocity.y > 0) {
            return true;
        }
        return false;
    }

    fireBullet() {
        // Fire a bullet from the player's position
        const bullet = gameState.bullets.get(gameState.player.x, gameState.player.y + 15).setDepth(10);
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setScale(2);
            bullet.body.allowGravity = false;
            if (gameState.player.flipX) {
                bullet.setVelocityX(-1000);
                bullet.setFlipX(true);
            } else {
                bullet.setVelocityX(1000);
                bullet.setFlipX(false);
            }
            this.time.delayedCall(gameState.bulletLifeSpan, () => {
                bullet.setActive(false);
                bullet.setVisible(false);
            });
            gameState.shootSound.play();
        }
    }

    spawnBat(platform) {
        // Spawn a bat on the specified platform
        const bat = this.physics.add.sprite(platform.x + platform.width / 2, platform.y - 40, 'bat').play('bat_fly').setDepth(10);
        bat.setCollideWorldBounds(true);
        bat.setScale(2.5); // Enlarge the bat
    
        // Set custom hitbox size
        let hitboxWidth = bat.width * 0.25; // Reducing the hitbox width to 25% of the sprite width
        let hitboxHeight = bat.height * 0.25; // Reducing the hitbox height to 25% of the sprite height
    
        // Adjust hitbox size and offset to match the desired area
        bat.body.setSize(hitboxWidth, hitboxHeight);
        bat.body.setOffset((bat.width - hitboxWidth) / 2, (bat.height - hitboxHeight) / 2);
    
        bat.setVelocityX(Phaser.Math.Between(-50, -100));
        bat.body.setAllowGravity(false);
        bat.setImmovable(true);
        bat.originPlatformX = platform.x;
        bat.originPlatformWidth = platform.width;
        this.physics.add.collider(bat, platform);
        
        gameState.bats.push(bat); // Add bat to the array
    }

    spawnWolf() {
        // Spawn a wolf at a random position within the level bounds
        const wolf = this.physics.add.sprite(Phaser.Math.Between(700, gameState.width - 200), config.height - 160, 'wolf').play('wolf_run');
        wolf.setCollideWorldBounds(true);
        wolf.setScale(2); // Enlarge the wolf

        // Set custom hitbox size
        let hitboxWidth = wolf.width * 1; // Hitbox width is 100% of the sprite width
        let hitboxHeight = wolf.height * 0.5; // Hitbox height is 50% of the sprite height

        // Adjust hitbox size and offset to match the desired area
        wolf.body.setSize(hitboxWidth, hitboxHeight);
        wolf.body.setOffset((wolf.width - hitboxWidth) / 2, (wolf.height - hitboxHeight));

        wolf.setVelocityX(Phaser.Math.Between(-200, -400)); // Random speed
        wolf.body.setAllowGravity(false);
        wolf.body.setImmovable(true);
        this.physics.add.collider(wolf, gameState.platforms);

        gameState.wolves.push(wolf); // Add wolf to the array
    }

    playerTakeDamage() {
        // Handle player taking damage
        if (!gameState.playerDamageCooldown) {
            gameState.playerHits += 1; // Increase hit counter
            gameState.player.setTint(0xff0000); // Turn player red
            gameState.playerDamageCooldown = true;
            gameState.hitSound.play();

            this.time.delayedCall(gameState.playerDamageDuration, () => {
                gameState.player.clearTint();
                gameState.playerDamageCooldown = false;
            });

            // Update the lives text
            if (gameState.livesText) {
                gameState.livesText.setText(`Lives: ${gameState.maxPlayerHits - gameState.playerHits}`);
            }

            // Check if player has lost all lives
            if (gameState.playerHits >= gameState.maxPlayerHits) {
                gameState.active = false;

                // Subtract score for dying
                gameState.score -= 5000;
                if (gameState.scoreText) {
                    gameState.scoreText.setText(`Score: ${gameState.score}`);
                }

                this.time.delayedCall(gameState.playerDamageDuration, () => {
                    gameState.playerHits = 0; // Reset hit counter
                    gameState.bats = []; // Clear bats array
                    gameState.wolves = []; // Clear wolves array
                    this.scene.restart();
                    gameState.backgroundMusic.stop();
                });
            }
        }
    }

    bulletHitBat(bullet, bat) {
        // Handle bullet hitting a bat
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false; // Disable bullet's hitbox

        // Remove the bat from the physics world
        bat.body.checkCollision.none = true; // Disable all collisions for the bat

        // Set high velocity to make the bat fall off the screen
        bat.setVelocityY(10000);

        // Destroy the bat after a short delay
        this.time.delayedCall(1000, () => {
            bat.destroy();
        });

        this.spawnWing(bat.x, bat.y);

        // Remove bat from the gameState.bats array
        gameState.bats = gameState.bats.filter(b => b !== bat);

        this.spawnEgg();
    }

    bulletHitWolf(bullet, wolf) {
        // Handle bullet hitting a wolf
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false; // Disable bullet's hitbox

        // Remove the wolf from the physics world
        wolf.body.checkCollision.none = true; // Disable all collisions for the wolf

        // Set high velocity to make the wolf fall off the screen
        wolf.setVelocityY(10000);

        // Destroy the wolf after a short delay
        this.time.delayedCall(1000, () => {
            wolf.destroy();
        });

        this.spawnSkull(wolf.x, wolf.y);

        // Remove wolf from the gameState.wolves array
        gameState.wolves = gameState.wolves.filter(w => w !== wolf);

        this.spawnEgg();
    }
     
    spawnWing(x, y) {
        // Spawn a collectible wing at the specified coordinates
        const wing = this.physics.add.sprite(x, y, 'wing').setScale(2.5).setDepth(10); // Enlarge the bat wing
        wing.body.setAllowGravity(true);
        wing.body.setBounce(0.5, 0.5);
        this.physics.add.collider(wing, gameState.platforms);

        this.physics.add.overlap(gameState.player, wing, (player, wing) => {
            wing.destroy();
            gameState.collectSound.play();
            gameState.score += 500; // Update score when collecting a wing
            if (gameState.scoreText) {
                gameState.scoreText.setText(`Score: ${gameState.score}`);
            }
        }, null, this);
    }

    spawnSkull(x, y) {
        // Spawn a collectible skull at the specified coordinates
        const skull = this.physics.add.sprite(x, y, 'skull').setScale(2); // Enlarge the skull
        skull.body.setAllowGravity(true);
        skull.body.setBounce(0.5, 0.5);
        this.physics.add.collider(skull, gameState.platforms);

        this.physics.add.overlap(gameState.player, skull, (player, skull) => {
            skull.destroy();
            gameState.collectSound.play();
            gameState.score += 1000; // Update score when collecting a skull
            if (gameState.scoreText) {
                gameState.scoreText.setText(`Score: ${gameState.score}`);
            }
        }, null, this);
    }

    spawnEgg() {
        // Make the goal (egg) visible and display a message to collect it
        gameState.goal.setVisible(true);
        let eggText = this.add.text(config.width / 2, config.height - 50, 'Collect the Egg!', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'PixelFont',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(10);

        eggText.setScrollFactor(0);
    }

    update(time) {
        // Update the game state based on player input and game logic
        if (gameState.active) {
            if (gameState.cursors.right.isDown) {
                gameState.player.flipX = false;
                gameState.player.setVelocityX(gameState.speed);
                gameState.player.anims.play('run', true);
            } else if (gameState.cursors.left.isDown) {
                gameState.player.flipX = true;
                gameState.player.setVelocityX(-gameState.speed);
                gameState.player.anims.play('run', true);
            } else {
                gameState.player.setVelocityX(0);
                gameState.player.anims.play('idle', true);
            }
            if (Phaser.Input.Keyboard.JustDown(gameState.cursors.up) && gameState.player.body.touching.down) {
                gameState.player.anims.play('jump', true);
                gameState.player.setVelocityY(-630);
                gameState.jumpSound.play();
            }
            if (!gameState.player.body.touching.down) {
                gameState.player.anims.play('jump', true);
            }
            if (gameState.player.y > gameState.bg1.height) {
                this.cameras.main.shake(240, 0.01, false, (camera, progress) => {
                    if (progress > 0.9) {
                        this.scene.restart();
                    }
                });
            }
            if (Phaser.Input.Keyboard.JustDown(gameState.fireKey) && time > gameState.lastFired) {
                this.fireBullet();
                gameState.lastFired = time + 1500; // Fire rate in milliseconds
            }
            gameState.bullets.children.each(function (bullet) {
                if (bullet.active && (bullet.x < 0 || bullet.x > gameState.width)) {
                    bullet.setActive(false);
                    bullet.setVisible(false);
                    bullet.body.enable = false;
                }
            }, this);

            // Move the bats within the platform bounds
            const batBuffer = 5; // Buffer distance to prevent getting stuck
            if (gameState.bats && gameState.bats.length > 0) {
                gameState.bats.forEach(bat => {
                    if (bat.active) {
                        if (bat.x < bat.originPlatformX + batBuffer) {
                            bat.setVelocityX(Phaser.Math.Between(50, 100)); // Move right with a slight buffer
                            bat.setFlipX(true);
                        } else if (bat.x > bat.originPlatformX + bat.originPlatformWidth - batBuffer) {
                            bat.setVelocityX(Phaser.Math.Between(-50, -100)); // Move left with a slight buffer
                            bat.setFlipX(false);
                        }
                    }
                });
            }

            // Move the wolves within the game bounds
            const wolfBuffer = 5; // Buffer distance to prevent getting stuck
            if (gameState.wolves && gameState.wolves.length > 0) {
                gameState.wolves.forEach(wolf => {
                    if (wolf.active) {
                        if (wolf.x >= gameState.width - wolf.width - wolfBuffer) {
                            // Wolf hits the right bound, move left
                            wolf.setVelocityX(Phaser.Math.Between(-200, -400)); // Move left with random speed
                            wolf.setFlipX(false);
                        } else if (wolf.x <= wolf.width + wolfBuffer) {
                            // Wolf hits the left bound, move right
                            wolf.setVelocityX(Phaser.Math.Between(200, 400)); // Move right with random speed
                            wolf.setFlipX(true);
                        }
                    }
                });
            }
        }
    }
}

class Level1 extends Level {
    constructor() {
        super('Level1');
        // Define platform positions, weather, and enemy numbers for Level 1
        this.platformPositions = [
            { x: 220, y: 250 },
            { x: 220, y: 450 },
            { x: 440, y: 450 },
            { x: 660, y: 450 },
            { x: 660, y: 250 },
            { x: 880, y: 200 },
            { x: 1100, y: 200 },
            { x: 1100, y: 400 },
            { x: 1320, y: 400 },
            { x: 1540, y: 300 },
            { x: 1540, y: 500 },
            { x: 1760, y: 150 },
            { x: 1760, y: 450 },
            { x: 1980, y: 200 },
            { x: 2200, y: 250 },
            { x: 2420, y: 200 },
        ];
        this.weather = 'morning';
        this.numBats = 5; // Number of bats for Level 1
        this.numWolves = 1; // Number of wolves for Level 1
    }
}

class Level2 extends Level {
    constructor() {
        super('Level2');
        // Define platform positions, weather, and enemy numbers for Level 2
        this.platformPositions = [
            { x: 2420, y: 250 },
            { x: 2200, y: 250 },
            { x: 1980, y: 450 },
            { x: 1760, y: 450 },
            { x: 1760, y: 250 },
            { x: 1540, y: 200 },
            { x: 1320, y: 200 },
            { x: 1100, y: 400 },
            { x: 1320, y: 400 },
            { x: 880, y: 500 },
            { x: 660, y: 200 },
            { x: 660, y: 450 },
            { x: 440, y: 250 },
            { x: 220, y: 250 },
        ];
        this.weather = 'afternoon';
        this.numBats = 7; // Number of bats for Level 2
        this.numWolves = 2; // Number of wolves for Level 2
    }
}

class Level3 extends Level {
    constructor() {
        super('Level3');
        // Define platform positions, weather, and enemy numbers for Level 3
        this.platformPositions = [
            { x: 2420, y: 400 },
            { x: 2200, y: 400 },
            { x: 1540, y: 450 },
            { x: 1760, y: 250 },
            { x: 1540, y: 250 },
            { x: 1100, y: 350 },
            { x: 1320, y: 300 },
            { x: 880, y: 350 },
            { x: 660, y: 300 },
            { x: 440, y: 450 },
            { x: 440, y: 250 },
            { x: 220, y: 250 },
        ];
        this.weather = 'twilight';
        this.numBats = 10; // Number of bats for Level 3
        this.numWolves = 3; // Number of wolves for Level 3
    }
}

class Level4 extends Level {
    constructor() {
        super('Level4');
        // Define platform positions, weather, and enemy numbers for Level 4
        this.platformPositions = [
            { x: 220, y: 400 },
            { x: 440, y: 300 },
            { x: 660, y: 200 },
            { x: 880, y: 200 },
            { x: 880, y: 400 },
            { x: 1320, y: 200 },
            { x: 1320, y: 400 },
            { x: 1540, y: 200 },
            { x: 1760, y: 300 },
            { x: 1980, y: 400 },
            { x: 2200, y: 400 },
            { x: 2420, y: 200 },
        ];
        this.weather = 'night';
        this.numBats = 12; // Number of bats for Level 4
        this.numWolves = 4; // Number of wolves for Level 4
    }
}

class CreditScene extends Phaser.Scene {
    constructor() {
        super('CreditScene');
    }

    preload() {
        // Load assets for the credit scene
        this.load.image('credit', 'assets/main_menu.png');
        this.load.audio('credit_bgm', 'assets/audio/Three Red Hearts - Princess Quest.ogg');
    }

    create() {
        // Create and set up the credit scene
        this.add.image(0, 0, 'credit').setOrigin(0, 0).setDepth(0);

        gameState.credit_backgroundMusic = this.sound.add('credit_bgm', { loop: true, volume: 0.25 });
        gameState.credit_backgroundMusic.play();

        // Display the final score
        const finalScore = gameState.score;
        const scoreText = this.add.text(config.width / 2, config.height / 2 - 100, `Final Score: ${finalScore}`, {
            fontSize: '48px',
            fill: '#ffffff',
            fontFamily: 'PixelFont',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Determine the message and animation based on the score
        let message = '';
        let animationKey = '';
        if (finalScore > 40000) {
            message = 'You are a Legendary Hunter';
            animationKey = 'idle'; // Animation key for idle
        } else if (finalScore > 30000) {
            message = 'You are a Professional Hunter';
            animationKey = 'run'; // Animation key for running
        } else if (finalScore > 20000) {
            message = 'You are a Skilled Hunter';
            animationKey = 'run'; // Animation key for running
        } else {
            message = 'You are an Average Hunter';
            animationKey = 'died'; // Animation key for died (assume it's available)
        }

        // Display the congratulatory message
        const congratsText = this.add.text(config.width / 2, config.height / 2, message, {
            fontSize: '48px',
            fill: '#ffffff',
            fontFamily: 'PixelFont',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Display the animation based on the score
        const playerAnimation = this.add.sprite(config.width / 2, config.height / 2 + 200, 'male').setOrigin(0.5).setScale(2);
        playerAnimation.play(animationKey);

        // Add collectibles for Legendary and Professional Hunter
        if (finalScore > 30000) {
            const eggs = this.add.group({ key: 'egg', repeat: 4, setXY: { x: config.width / 2 - 200, y: config.height / 2 + 100, stepX: 50 } });
            const wings = this.add.group({ key: 'wing', repeat: 4, setXY: { x: config.width / 2 - 200, y: config.height / 2 + 150, stepX: 50 } });
            const skulls = this.add.group({ key: 'skull', repeat: 4, setXY: { x: config.width / 2 - 200, y: config.height / 2 + 200, stepX: 50 } });

            if (finalScore > 40000) {
                eggs.children.iterate(egg => egg.setScale(1.5));
                wings.children.iterate(wing => wing.setScale(2.5));
                skulls.children.iterate(skull => skull.setScale(2));
            }
        }

        // Add a button to restart the game or go to the main menu
        const restartText = this.add.text(config.width / 2, config.height / 2 + 300, 'Press SPACE to Restart', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'PixelFont',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Add keyboard input to restart the game
        this.input.keyboard.on('keydown-SPACE', () => {
            gameState.score = 0; // Reset score
            gameState.playerHits = 0; // Reset player hits
            this.scene.start('Level1'); // Restart the game from Level1
            gameState.credit_backgroundMusic.stop();
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1040,
    height: 720,
    fps: { target: 60 },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            enableBody: true,
        }
    },
    scene: [ 
        StartScene,
        Level1, 
        Level2,
        Level3,
        Level4,
        CreditScene
    ]
};

const game = new Phaser.Game(config);
