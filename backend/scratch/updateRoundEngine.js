const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/gameEngine/RoundEngine.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/SessionLevel/g, 'SessionMode');
content = content.replace(/levelIndex/g, 'modeIndex');
content = content.replace(/beginLevel/g, 'beginMode');
content = content.replace(/currentLevelId/g, 'currentModeId');
content = content.replace(/currentLevel/g, 'currentMode');
content = content.replace(/LevelId/g, 'ModeId');
content = content.replace(/selectedGames/g, 'selectedModes');
content = content.replace(/totalRoundsInLevel/g, 'totalRoundsInMode');

// Custom fixes
content = content.replace(/this\.snapshot\.levels/g, 'this.snapshot.modes');
content = content.replace(/levelId:/g, 'modeId:');

fs.writeFileSync(file, content);
console.log('RoundEngine updated');
