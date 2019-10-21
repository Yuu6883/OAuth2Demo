

module.exports = class GameServer {
    constructor() {
        
    }
}

endpoints.updatePlayerXps = async arr => {

    if (!arr.length) {
        logger.warn('Empty update xp array');
        return [];
    }

    var result = await updateXp(arr);
    if (result.rowCount === 0) {
        logger.warn('Weird no rows?');
        return [];
    }

    var updates = result.rows;

    updates.forEach(async update => {
        var oldLevel = update.level;
        var newLevel = levels.getLevel(update.xp);
        var levelUp = newLevel > oldLevel;
        if (!levelUp) return;

        try {
            await database.updateUser({uid}, {level: newLevel});
            update.levelUp = newLevel;
        } catch(err) {
            logger.error(err);
        }
    });

    return updates;
}