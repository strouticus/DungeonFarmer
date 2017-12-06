var game = new Phaser.Game(768, 768, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {

}

// Globals

var upKey;
var downKey;
var leftKey;
var rightKey;

function create() {

    upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
    leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

    var tempGraphics = game.add.graphics(0, 0);
    tempGraphics.beginFill(0xFF0000);
    tempGraphics.drawRect(0, 0, 500, 500);
    tempGraphics.endFill();
    var redSquare = tempGraphics.generateTexture();
    tempGraphics.destroy();

    var tempGraphics = game.add.graphics(0, 0);
    tempGraphics.beginFill(0x0000FF);
    tempGraphics.drawRect(0, 0, 500, 500);
    tempGraphics.endFill();
    var blueSquare = tempGraphics.generateTexture();
    tempGraphics.destroy();

    new ChaserEnemy(100, 300, 50, 50, redSquare);
    new Player(300, 400, 50, 50, blueSquare);

    new Creature(500, 500, 50, 50, redSquare);

}

// In the future, entities may need to register to different systems ahead of time
//   (so that we don't loop through every entity for every system)
function update() {
    for (var i = 0; i < systems.length; i++) {
        // systems[i]
        for (var j = 0; j < entities.length; j++) {
            // entities[j]
            var hasAllComponents = true;
            for (var k = 0; k < systems[i].tagList.length; k++) {
                // systems[i].tagList[k]
                if (entities[j][systems[i].tagList[k]] === undefined) {
                    hasAllComponents = false;
                    break;
                }
            }
            if (hasAllComponents) {
                systems[i].systemFunc(entities[j]);
            }
        }
    }
}

function onGamePause () {
    // p1GainNode.disconnect(audioCtx.destination);
}

function onGameResume () {
    // p1GainNode.connect(audioCtx.destination);
}

var idCounter = -1;
function getNextID () {
    idCounter += 1;
    return idCounter;
}

function getEntityByID (id) {
    for (var i = 0; i < entities.length; i++) {
        // entities[i]
        if (entities[i].id === id) {
            return entities[i];
        }
    }
}

function getEntityByRefName (refName) {
    for (var i = 0; i < entities.length; i++) {
        // entities[i]
        if (entities[i].refName && entities[i].refName === refName) {
            return entities[i];
        }
    }
}

var entities = [];

function Entity () {
    entities.push(this);

    this.id = getNextID();
}

function Creature (x, y, width, height, graphics) {
    Entity.call(this);

    this.Solid = new Solid();
    this.Position = new Position(x, y);
    this.Velocity = new Velocity();
    this.Size = new Size(width, height);
    this.Sprite = new Sprite(graphics, width, height);
    this.Input = new Input();
}

function Player (x, y, width, height, graphics) {
    Creature.call(this, x, y, width, height, graphics);

    this.PlayerComponent = new PlayerComponent();

    this.refName = "player";
}

function Enemy (x, y, width, height, graphics) {
    Creature.call(this, x, y, width, height, graphics);

    this.AIComponent = new AIComponent();
}

function ChaserEnemy (x, y, width, height, graphics) {
    Enemy.call(this, x, y, width, height, graphics);

    this.AIChase = new AIChase("player");
}

// *** COMPONENTS ***

function Component (type) {
    this.type = type;
}

function Position (x, y) {
    Component.call(this, "Position");

    this.x = x;
    this.y = y;
}

function Size (width, height) {
    Component.call(this, "Size");

    this.width = width;
    this.height = height;
}

function Solid () {
    Component.call(this, "Solid");
}

function Velocity () {
    Component.call(this, "Velocity");

    this.x = 0;
    this.y = 0;
}

function Sprite (graphics) {
    Component.call(this, "Sprite");

    this.sprite = game.add.sprite(0, 0, graphics);
}

function Input () {
    Component.call(this, "Input");

    this.up = false;
    this.right = false;
    this.down = false;
    this.left = false;
} 

function PlayerComponent () {
    Component.call(this, "PlayerComponent");
}

function AIComponent () {
    Component.call(this, "AIComponent");
}

function AIChase (entityRefName) {
    Component.call(this, "AIChase");

    this.chaseEntityRefName = entityRefName;
}

// *** SYSTEMS ***

var systems = [];

function System (name, tagList, systemFunc) {
    systems.push(this);

    this.name = name;
    this.tagList = tagList;
    this.systemFunc = systemFunc;
}

function PlayerControl (entity) {
    entity.Input.up = upKey.isDown;
    entity.Input.right = rightKey.isDown;
    entity.Input.down = downKey.isDown;
    entity.Input.left = leftKey.isDown;
}
new System("PlayerControl", ["PlayerComponent", "Input"], PlayerControl);

function AIControl (entity) {
    if (entity.AIChase) {
        var chaseEntity = getEntityByRefName(entity.AIChase.chaseEntityRefName);
        entity.Input.up = (entity.Position.y > chaseEntity.Position.y);
        entity.Input.right = (entity.Position.x < chaseEntity.Position.x);
        entity.Input.down = (entity.Position.y < chaseEntity.Position.y);
        entity.Input.left = (entity.Position.x > chaseEntity.Position.x);
    }
}
new System("AIControl", ["AIComponent", "Input"], AIControl);

function InputHandler (entity) {
    entity.Velocity.x *= 0.9;
    entity.Velocity.y *= 0.9;

    if (entity.Input.up) {
        entity.Velocity.y += -0.4;
    }
    if (entity.Input.right) {
        entity.Velocity.x += 0.4;
    }
    if (entity.Input.down) {
        entity.Velocity.y += 0.4;
    }
    if (entity.Input.left) {
        entity.Velocity.x += -0.4;
    }
}
new System("InputHandler", ["Input", "Velocity"], InputHandler);

function Movement (entity) {
    var desiredX = entity.Position.x + entity.Velocity.x;
    var desiredY = entity.Position.y + entity.Velocity.y;

    if (entity.Solid) {
        for (var i = 0; i < entities.length; i++) {
            // entities[i]
            if (isDifferentEntity(entity, entities[i]) && entities[i].Solid) {
                if (overlapCheck(desiredX, desiredY, entity.Size.width, entity.Size.height, entities[i].Position.x, entities[i].Position.y, entities[i].Size.width, entities[i].Size.height)) {
                    // colliding with another entity
                    // check X axis movement
                    if (overlapCheck(desiredX, entity.Position.y, entity.Size.width, entity.Size.height, entities[i].Position.x, entities[i].Position.y, entities[i].Size.width, entities[i].Size.height)) {
                        if (entity.Position.x + entity.Size.width < entities[i].Position.x) {
                            desiredX = entities[i].Position.x - entity.Size.width;
                        } else if (entity.Position.x > entities[i].Position.x + entities[i].Size.width) {
                            desiredX = entities[i].Position.x + entities[i].Size.width;
                        } else {
                            desiredX = entity.Position.x;
                        }
                    }

                    if (overlapCheck(desiredX, desiredY, entity.Size.width, entity.Size.height, entities[i].Position.x, entities[i].Position.y, entities[i].Size.width, entities[i].Size.height)) {
                        if (entity.Position.y + entity.Size.height < entities[i].Position.y) {
                            desiredY = entities[i].Position.y - entity.Size.height;
                        } else if (entity.Position.y > entities[i].Position.y + entities[i].Size.height) {
                            desiredY = entities[i].Position.y + entities[i].Size.height;
                        } else {
                            desiredY = entity.Position.y;
                        }
                    }
                }
            }
        }
    }

    entity.Position.x = desiredX;
    entity.Position.y = desiredY;
}
new System("Movement", ["Position", "Velocity"], Movement);

function Render (entity) {
    entity.Sprite.sprite.x = Math.round(entity.Position.x);
    entity.Sprite.sprite.y = Math.round(entity.Position.y);
    entity.Sprite.sprite.width = entity.Size.width;
    entity.Sprite.sprite.height = entity.Size.height;
}
new System("Render", ["Position", "Size", "Sprite"], Render);
