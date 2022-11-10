import Phaser, { Geom, Scene } from "phaser";

let config = {
  type: Phaser.WEBGL,
  parent: "game",
  backgroundColor: "#000",
  scale: {
    width: 800,
    height: 600,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

enum direction {
  up,
  down,
  left,
  right,
}

let snake: Snake;
let food: Food;
let cursors: any;

class Food extends Phaser.GameObjects.Image {
  total: number;
  constructor(scene: Scene, x: number, y: number) {
    super(scene, x * 16, y * 16, "food");
    // Phaser.GameObjects.Image.call(this, scene);
    this.setTexture("food");
    this.setPosition(x * 16, y * 16);
    this.setOrigin(0);
    this.total = 0;
    scene.children.add(this);
  }
  eat() {
    this.total++;
  }
}

class Snake {
  headPosition: Phaser.Geom.Point;
  body: any;
  head: any;
  alive: boolean;
  speed: number;
  moveTime: number;
  tail: Phaser.Geom.Point;
  heading: number;
  direction: direction;
  constructor(scene: Scene, x: number, y: number) {
    this.headPosition = new Phaser.Geom.Point(x, y);
    this.body = scene.add.group();
    this.head = this.body.create(x * 16, y * 16, "body");
    this.head.setOrigin(0);
    this.alive = true;
    this.speed = 100;
    this.moveTime = 0;
    this.tail = new Phaser.Geom.Point(x, y);
    this.heading = direction.right;
    this.direction = direction.right;
  }
  update(time: number) {
    if (time >= this.moveTime) {
      return this.move(time);
    }
  }

  faceLeft() {
    if (this.direction === direction.up || this.direction === direction.down) {
      this.heading = direction.left;
    }
  }

  faceRight() {
    if (this.direction === direction.up || this.direction === direction.down) {
      this.heading = direction.right;
    }
  }

  faceUp() {
    if (
      this.direction === direction.left ||
      this.direction === direction.right
    ) {
      this.heading = direction.up;
    }
  }

  faceDown() {
    if (
      this.direction === direction.left ||
      this.direction === direction.right
    ) {
      this.heading = direction.down;
    }
  }

  move(time: number) {
    /**
     * Based on the heading property (which is the direction the pgroup pressed)
     * we update the headPosition value accordingly.
     *
     * The Math.wrap call allow the snake to wrap around the screen, so when
     * it goes off any of the sides it re-appears on the other.
     */
    switch (this.heading) {
      case direction.left:
        this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 40);
        break;

      case direction.right:
        this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 40);
        break;

      case direction.up:
        this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 30);
        break;

      case direction.down:
        this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 30);
        break;
    }

    this.direction = this.heading;

    //  Update the body segments and place the last coordinate into this.tail
    Phaser.Actions.ShiftPosition(
      this.body.getChildren(),
      this.headPosition.x * 16,
      this.headPosition.y * 16,
      1,
      this.tail as unknown as Phaser.Math.Vector2
    );

    //  Check to see if any of the body pieces have the same x/y as the head
    //  If they do, the head ran into the body

    let hitBody = Phaser.Actions.GetFirst(
      this.body.getChildren(),
      { x: this.head.x, y: this.head.y },
      1
    );

    if (hitBody) {
      console.log("dead");

      this.alive = false;

      return false;
    } else {
      //  Update the timer ready for the next movement
      this.moveTime = time + this.speed;

      return true;
    }
  }

  grow() {
    let newPart = this.body.create(this.tail.x, this.tail.y, "body");

    newPart.setOrigin(0);
  }

  collideWithFood(food: Food) {
    if (this.head.x === food.x && this.head.y === food.y) {
      this.grow();

      food.eat();

      //  For every 5 items of food eaten we'll increase the snake speed a little
      if (this.speed > 20 && food.total % 5 === 0) {
        this.speed -= 5;
      }

      return true;
    } else {
      return false;
    }
  }

  updateGrid(grid: boolean[][]) {
    //  Remove all body pieces from valid positions list
    this.body.children.each(function (segment: any) {
      let bx = segment.x / 16;
      let by = segment.y / 16;

      grid[by][bx] = false;
    });

    return grid;
  }
}
class Demo extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.image("food", "/red3.png");
    this.load.image("body", "/green3.jpg");
  }

  create() {
    food = new Food(this, 3, 4);
    snake = new Snake(this, 16, 16);
    cursors = this.input.keyboard.addKeys("W,S,A,D");
    console.log(cursors);
  }

  update(time: any, delta: any) {
    if (!snake.alive) {
      return;
    }

    /**
     * Check which key is pressed, and then change the direction the snake
     * is heading based on that. The checks ensure you don't double-back
     * on yourself, for example if you're moving to the right and you press
     * the LEFT cursor, it ignores it, because the only valid directions you
     * can move in at that time is up and down.
     */
    if (cursors.W.isDown) {
      snake.faceUp();
    } else if (cursors.A.isDown) {
      snake.faceLeft();
    } else if (cursors.S.isDown) {
      snake.faceDown();
    } else if (cursors.D.isDown) {
      snake.faceRight();
    }

    if (snake.update(time)) {
      //  If the snake updated, we need to check for collision against food

      if (snake.collideWithFood(food)) {
        this.repositionFood();
      }
    }
  }

  /**
   * We can place the food anywhere in our 40x30 grid
   * *except* on-top of the snake, so we need
   * to filter those out of the possible food locations.
   * If there aren't any locations left, they've won!
   *
   * @method repositionFood
   * @return {boolean} true if the food was placed, otherwise false
   */
  repositionFood() {
    //  First create an array that assumes all positions
    //  are valid for the new piece of food

    //  A Grid we'll use to reposition the food each time it's eaten
    let testGrid: boolean[][] = [];

    for (let y = 0; y < 30; y++) {
      testGrid[y] = [];

      for (let x = 0; x < 40; x++) {
        testGrid[y][x] = true;
      }
    }

    snake.updateGrid(testGrid);

    //  Purge out false positions
    let validLocations = [];

    for (let y = 0; y < 30; y++) {
      for (let x = 0; x < 40; x++) {
        if (testGrid[y][x] === true) {
          //  Is this position valid for food? If so, add it here ...
          validLocations.push({ x: x, y: y });
        }
      }
    }

    if (validLocations.length > 0) {
      //  Use the RNG to pick a random food position
      let pos = Phaser.Math.RND.pick(validLocations);

      //  And place it
      food.setPosition(pos.x * 16, pos.y * 16);

      return true;
    } else {
      return false;
    }
  }
}

export default function StartGame() {
  return new Phaser.Game(
    Object.assign(config, {
      scene: [Demo],
    })
  );
}
