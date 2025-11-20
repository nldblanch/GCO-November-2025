function checkGlobalConstraints(grid) {
    // Prime cells (1-indexed):
    // (1,2), (1,4), (2,1), (2,3), (3,2), (3,4), (4,1), (4,3), (5,2), (5,4)
    const primeCells = [
        [0,1],[0,3],[1,0],[1,2],[2,1],[2,3],[3,0],[3,2],[4,1],[4,3]
    ];
    let sum = 0;
    for (let [r, c] of primeCells) sum += grid[r][c];
    return sum % 2 === 0; // Even sum
}
module.exports = checkGlobalConstraints;
