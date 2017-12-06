// helperFunctions.js

function overlapCheckEntities (entityA, entityB) {
	if (entityA.Position.x < entityB.Position.x + entityB.Size.width &&
		entityA.Position.x + entityA.Size.width > entityB.Position.x &&
		entityA.Position.y < entityB.Position.y + entityB.Size.height &&
		entityA.Size.height + entityA.Position.y > entityB.Position.y) {
		return true;
	}
	return false;
}

function overlapCheck (x1, y1, w1, h1, x2, y2, w2, h2) {
	if (x1 < x2 + w2 &&
		x1 + w1 > x2 &&
		y1 < y2 + h2 &&
		h1 + y1 > y2) {
		return true;
	}
	return false;
}

function isDifferentEntity (entityA, entityB) {
	return entityA.id !== entityB.id;
}