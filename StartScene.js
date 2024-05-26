class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        this.load.image('menu', 'assets/main_menu.png');
        this.load.audio('mainmenu_bgm', 'assets/audio/Three Red Hearts - Three Red Hearts.ogg');

        this.load.spritesheet('male', 'assets/male1.png', { frameWidth: 90, frameHeight: 90 });
        this.load.spritesheet('bat', 'assets/mutated_bat.png', { frameWidth: 96, frameHeight: 80 });
        this.load.spritesheet('wolf', 'assets/skullwolf.png', { frameWidth: 64, frameHeight: 65 });
    }

    createAnimations() {
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('male', { start: 21, end: 22 }),
            frameRate: 2,
            repeat: -1
        });
        this.anims.create({
            key: 'bat_fly',
            frames: this.anims.generateFrameNumbers('bat', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'wolf_idle',
            frames: this.anims.generateFrameNumbers('wolf', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
    }

    create() {
        // Call createAnimations to set up the animations
        this.createAnimations();

        // Display background image
        this.add.image(0, 0, 'menu').setOrigin(0, 0).setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);

        // Play background music
        gameState.mainmenu_backgroundMusic = this.sound.add('mainmenu_bgm', { loop: true, volume: 0.25 });
        gameState.mainmenu_backgroundMusic.play();

        // Use WebFont loader to ensure the font is loaded before creating text objects
        WebFont.load({
            custom: {
                families: ['PixelFont']
            },
            active: () => {
                // Display title text
                const titleText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Egg Hunt: Monster Madness', {
                    fontSize: '48px',
                    fill: '#ffffff',
                    fontFamily: 'PixelFont',
                    stroke: '#000000',
                    strokeThickness: 6
                }).setOrigin(0.5);

                titleText.setShadow(5, 5, '#000000', 5, true, true);

                // Display press any key text
                const titleText2 = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 100, 'Press any key to start', {
                    fontSize: '24px',
                    fill: '#ffffff',
                    fontFamily: 'PixelFont',
                    stroke: '#000000',
                    strokeThickness: 6
                }).setOrigin(0.5);

                titleText2.setShadow(5, 5, '#000000', 5, true, true);

                // Add animations under the press any key text
                this.addCharacterAnimations();
            }
        });

        // Setup keyboard input listener to start the game
        this.input.keyboard.on('keydown', () => {
            this.scene.start('Level1');
            gameState.mainmenu_backgroundMusic.stop();
        });
    }

    addCharacterAnimations() {
        // Add the male character animation
        const male = this.add.sprite(this.sys.game.config.width / 2 - 200, this.sys.game.config.height / 2 + 250, 'male').play('idle');

        // Add the bat animation
        const bat = this.add.sprite(this.sys.game.config.width / 2 + 200, this.sys.game.config.height / 2 + 250, 'bat').play('bat_fly');

        // Add the wolf animation
        const wolf = this.add.sprite(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 230, 'wolf').play('wolf_idle');

        // Scale down the characters if needed
        male.setScale(1);
        bat.setScale(2);
        wolf.setScale(2);
    }
}
