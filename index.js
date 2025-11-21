//Question 3

const SIZE = 5;

const ORTHO = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const DIAG = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

const PRIME_CELLS_1BASED = [
  [1, 2],
  [1, 4],
  [2, 1],
  [2, 3],
  [3, 2],
  [3, 4],
  [4, 1],
  [4, 3],
  [5, 2],
  [5, 4],
];
const PRIME_CELLS = new Set(
  PRIME_CELLS_1BASED.map(([r, c]) => `${r - 1},${c - 1}`)
);

/**
 * Check if a given grid cell is one of the 10 prime-numbered positions.
 *
 * @param {number} r - Row index (0-based).
 * @param {number} c - Column index (0-based).
 * @returns {boolean} True if the cell is a prime-numbered cell, false otherwise.
 */
function isPrimeCell(r, c) {
  return PRIME_CELLS.has(`${r},${c}`);
}

/**
 * Check whether given coordinates are inside the 5x5 grid.
 *
 * Used throughout constraint checks and backtracking to ensure
 * neighbor lookups do not go out of bounds.
 *
 * @param {number} r - Row index (0-based).
 * @param {number} c - Column index (0-based).
 * @returns {boolean} True if (r,c) is within the grid, false otherwise.
 *
 * @example
 * inBounds(0, 0); // true
 * inBounds(4, 4); // true
 * inBounds(5, 0); // false
 */
function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

/**
 * Validate local constraints for a newly placed value in the grid.
 * Ensures no orthogonal consecutive numbers and no diagonal difference of 2.
 *
 * @param {number[][]} grid - Current 5x5 grid state.
 * @param {number} r - Row index of the placed value.
 * @param {number} c - Column index of the placed value.
 * @returns {boolean} True if placement is valid with respect to neighbors, false otherwise.
 */
function localValid(grid, r, c) {
  const val = grid[r][c];

  // C1: No orthogonal consecutive
  for (const [dr, dc] of ORTHO) {
    const nr = r + dr,
      nc = c + dc;
    if (inBounds(nr, nc) && grid[nr][nc] !== 0) {
      if (Math.abs(grid[nr][nc] - val) === 1) return false;
    }
  }

  // C2: No diagonal difference exactly 2
  for (const [dr, dc] of DIAG) {
    const nr = r + dr,
      nc = c + dc;
    if (inBounds(nr, nc) && grid[nr][nc] !== 0) {
      if (Math.abs(grid[nr][nc] - val) === 2) return false;
    }
  }

  return true;
}

/**
 * Calculate the number of valid neighboring cells around a given coordinate.
 *
 * Neighbors include both orthogonal (up, down, left, right) and diagonal
 * positions. This count is used to prioritize cells with more constraints
 * during backtracking, improving pruning efficiency.
 *
 * @param {number} r - Row index (0-based).
 * @param {number} c - Column index (0-based).
 * @returns {number} The number of valid neighbors within the 5x5 grid.
 *
 * @example
 * neighborCount(2, 2); // returns 8 (center cell has all neighbors)
 * neighborCount(0, 0); // returns 3 (corner cell has fewer neighbors)
 */
function neighborCount(r, c) {
  let cnt = 0;
  for (const [dr, dc] of ORTHO.concat(DIAG)) {
    const nr = r + dr,
      nc = c + dc;
    if (inBounds(nr, nc)) cnt++;
  }
  return cnt;
}

/**
 * Build an ordered list of cells to fill during backtracking.
 * Cells are sorted by descending neighbor count to improve pruning efficiency.
 *
 * @returns {Array<{r:number,c:number,deg:number}>} Ordered list of cell coordinates.
 */
function buildOrder() {
  const cells = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (r === 2 && c === 2) continue; // center fixed
      cells.push({ r, c, deg: neighborCount(r, c) });
    }
  }

  cells.sort((a, b) => b.deg - a.deg);
  return [{ r: 2, c: 2, deg: neighborCount(2, 2) }, ...cells];
}

/**
 * Generate candidate values for a given cell based on current grid state.
 * Filters out values that would immediately violate constraints with existing neighbors.
 *
 * @param {number[][]} grid - Current 5x5 grid state.
 * @param {number} r - Row index of the cell.
 * @param {number} c - Column index of the cell.
 * @param {Set<number>} used - Set of already used values.
 * @returns {number[]} Array of candidate values sorted by heuristic.
 */
function candidateValues(grid, r, c, used) {
  const candidates = [];
  for (let v = 1; v <= 25; v++) {
    if (used.has(v)) continue;
    let ok = true;

    for (const [dr, dc] of ORTHO) {
      const nr = r + dr,
        nc = c + dc;
      if (inBounds(nr, nc) && grid[nr][nc] !== 0) {
        if (Math.abs(grid[nr][nc] - v) === 1) {
          ok = false;
          break;
        }
      }
    }
    if (!ok) continue;

    for (const [dr, dc] of DIAG) {
      const nr = r + dr,
        nc = c + dc;
      if (inBounds(nr, nc) && grid[nr][nc] !== 0) {
        if (Math.abs(grid[nr][nc] - v) === 2) {
          ok = false;
          break;
        }
      }
    }
    if (!ok) continue;

    candidates.push(v);
  }

  candidates.sort((a, b) => Math.abs(a - 13) - Math.abs(b - 13));
  return candidates;
}

/**
 * Attempt to solve the 5x5 grid puzzle using backtracking.
 * Applies constraints C1, C2, and C3, with fixed seed at center (13).
 *
 * @returns {number[][]} A valid 5x5 grid solution.
 */
function solve() {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  const used = new Set();
  const order = buildOrder();

  grid[2][2] = 13;
  used.add(13);

  // Track parity of prime-cell sum; 13 is at (2,2) which is prime cell? No: (3,3) not in prime list.
  let primeParity = 0; // 0 = even, 1 = odd

  /**
   * Place a value into the grid at the given coordinates.
   *
   * This updates three things:
   * - The grid cell itself
   * - The set of used values
   * - The running parity of the prime-cell sum (C3 constraint)
   *
   * @param {number} r - Row index (0-based).
   * @param {number} c - Column index (0-based).
   * @param {number} v - Value to assign to the cell.
   * @returns {void}
   *
   * @example
   * place(1, 2, 7); // puts value 7 at grid[1][2] and updates state
   */
  function place(r, c, v) {
    grid[r][c] = v;
    used.add(v);
    if (isPrimeCell(r, c)) primeParity ^= v % 2;
  }

  /**
   * Remove a previously placed value from the grid at the given coordinates.
   *
   * This reverses the effects of `place`:
   * - Clears the grid cell
   * - Removes the value from the set of used values
   * - Restores the prime-cell sum parity
   *
   * @param {number} r - Row index (0-based).
   * @param {number} c - Column index (0-based).
   * @param {number} v - Value to remove from the cell.
   * @returns {void}
   *
   * @example
   * unplace(1, 2, 7); // clears grid[1][2] and updates state
   */
  function unplace(r, c, v) {
    if (isPrimeCell(r, c)) primeParity ^= v % 2;
    used.delete(v);
    grid[r][c] = 0;
  }

  /**
   * Count how many prime-numbered cells remain unfilled in the search order.
   *
   * This is used during backtracking to prune branches early:
   * - If no prime cells remain and the current parity of the prime-cell sum is odd,
   *   the branch can be abandoned immediately.
   *
   * @param {number} startIdx - Index in the ordered cell list from which to count.
   * @returns {number} The number of prime cells still to be filled from startIdx onward.
   *
   * @example
   * // Suppose order is the list of cells to fill and idx is the current position:
   * const remaining = remainingPrimeCells(idx);
   * if (remaining === 0 && primeParity !== 0) {
   *   // prune this branch
   * }
   */
  function remainingPrimeCells(startIdx) {
    let count = 0;
    for (let i = startIdx; i < order.length; i++) {
      const { r, c } = order[i];
      if (isPrimeCell(r, c)) count++;
    }
    return count;
  }

  /**
   * Recursive backtracking search to fill the 5x5 grid.
   *
   * At each step, attempts to assign a value to the next cell in the
   * predefined order. Uses local constraint checks (C1, C2) and parity
   * tracking for prime-cell sums (C3) to prune invalid branches early.
   *
   * @param {number} idx - Current index in the ordered list of cells to fill.
   * @returns {boolean} True if a complete valid assignment has been found, false otherwise.
   *
   * @example
   * // Start the search from the first cell in the order:
   * const success = backtrack(0);
   * if (success) {
   *   console.log("Valid grid found!");
   * }
   */
  function backtrack(idx) {
    if (idx === order.length) {
      return primeParity === 0;
    }

    const { r, c } = order[idx];
    if (r === 2 && c === 2) return backtrack(idx + 1);

    if (remainingPrimeCells(idx) === 0 && primeParity !== 0) return false;

    const values = candidateValues(grid, r, c, used);
    for (const v of values) {
      place(r, c, v);
      if (localValid(grid, r, c)) {
        const remPrime = remainingPrimeCells(idx + 1);
        if (remPrime === 0 && primeParity !== 0) {
          unplace(r, c, v);
          continue;
        }

        if (backtrack(idx + 1)) return true;
      }
      unplace(r, c, v);
    }
    return false;
  }

  backtrack(0);
  return grid;
}

/**
 * Perform a full validation of the grid against all constraints.
 *
 * @param {number[][]} grid - Completed 5x5 grid.
 * @returns {boolean} True if the grid satisfies all constraints, false otherwise.
 */
function checkConstraints(grid) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const val = grid[r][c];
      for (const [dr, dc] of ORTHO) {
        const nr = r + dr,
          nc = c + dc;
        if (inBounds(nr, nc)) {
          if (Math.abs(grid[nr][nc] - val) === 1) return false;
        }
      }
      for (const [dr, dc] of DIAG) {
        const nr = r + dr,
          nc = c + dc;
        if (inBounds(nr, nc)) {
          if (Math.abs(grid[nr][nc] - val) === 2) return false;
        }
      }
    }
  }

  let sum = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (isPrimeCell(r, c)) sum += grid[r][c];
    }
  }
  return sum % 2 === 0;
}

const solution = solve();
if (!checkConstraints(solution)) {
  console.error("Solution failed validation.");
} else {
  console.log(solution);
  console.log(solution.flat().join(","));
}


//Question 4

(function solveQ4() {

  const N = 5;

  const size = N*N;

  const index = (r,c) => r*N + c;
 
  const prime1based = [[1,2],[1,4],[2,1],[2,3],[2,5],[3,2],[3,4],[4,1],[4,3],[4,5]];

  const primeIdxs = prime1based.map(p => index(p[0]-1,p[1]-1));

  const orthDirs = [[1,0],[-1,0],[0,1],[0,-1]];

  const diagDirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
 
  const neigh = Array.from({length:size},()=>[]);

  for (let r=0;r<N;r++){

    for (let c=0;c<N;c++){

      let i = index(r,c);

      orthDirs.forEach(([dr,dc])=>{ let rr=r+dr, cc=c+dc; if (rr>=0 && rr<N && cc>=0 && cc<N) neigh[i].push([index(rr,cc),'orth']); });

      diagDirs.forEach(([dr,dc])=>{ let rr=r+dr, cc=c+dc; if (rr>=0 && rr<N && cc>=0 && cc<N) neigh[i].push([index(rr,cc),'diag']); });

    }

  }
 
  const center = index(2,2);

  const topIdxs = [0,1,2,3,4];
 
  function ok(grid,pos,val){

    for (const [p,typ] of neigh[pos]){

      const v = grid[p];

      if (v == null) continue;

      if (typ === 'orth' && Math.abs(v-val) === 1) return false;

      if (typ === 'diag' && Math.abs(v-val) === 2) return false;

    }

    return true;

  }
 
  // We'll try placing 14 in each top position and search

  for (const top14 of topIdxs){

    const grid = Array(size).fill(null);

    const used = Array(size+1).fill(false);

    grid[center] = 13; used[13]=true;

    if (!ok(grid, top14, 14)) continue;

    grid[top14] = 14; used[14] = true;
 
    // order: by degree descending (heuristic)

    const degree = neigh.map(l=>l.length);

    const order = [];

    for (let i=0;i<size;i++) if (grid[i]==null) order.push(i);

    order.sort((a,b)=> degree[b]-degree[a]);
 
    let found = false, solution = null;

    function backtrack(idx){

      if (found) return true;

      if (idx === order.length) {

        // check top row counts: exactly two <14 and two >14 (14 already placed)

        const topVals = topIdxs.map(i=>grid[i]);

        const lt = topVals.filter(v=>v<14).length;

        const gt = topVals.filter(v=>v>14).length;

        if (lt !== 2 || gt !== 2) return false;

        // prime sum parity

        const psum = primeIdxs.reduce((s,i)=> s+grid[i], 0);

        if (psum % 2 !== 0) return false;

        solution = grid.slice(); found = true; return true;

      }

      const pos = order[idx];

      for (let val=1; val<=25; val++){

        if (used[val]) continue;

        if (!ok(grid,pos,val)) continue;

        // quick prune for top row counts

        if (topIdxs.indexOf(pos) !== -1) {

          const assigned = topIdxs.filter(i=>grid[i]!=null && i!==pos).map(i=>grid[i]);

          const lt = assigned.filter(x=>x<14).length;

          const gt = assigned.filter(x=>x>14).length;

          if (val<14 && lt+1>2) continue;

          if (val>14 && gt+1>2) continue;

        }

        grid[pos]=val; used[val]=true;

        if (backtrack(idx+1)) return true;

        grid[pos]=null; used[val]=false;

      }

      return false;

    }
 
    if (backtrack(0)) {

      console.log("Found Q4 solution; bottom-right:", solution[24]);

      console.log("Grid (rows):");

      for (let r=0;r<N;r++) console.log(solution.slice(r*N,(r+1)*N));

      return solution;

    }

  }

  console.log("No Q4 solution found by this search.");

})();
 
//Question 5 
 
(function solveQ5() {

  const N = 6, SIZE = N*N;

  const index = (r,c) => r*N + c;

  const orthDirs = [[1,0],[-1,0],[0,1],[0,-1]];

  const neigh = Array.from({length:SIZE},()=>[]);

  for (let r=0;r<N;r++) for (let c=0;c<N;c++){

    let i = index(r,c);

    orthDirs.forEach(([dr,dc])=>{ let rr=r+dr, cc=c+dc; if (rr>=0&&rr<N&&cc>=0&&cc<N) neigh[i].push(index(rr,cc)); });

  }
 
  const grid = Array(SIZE).fill(null);

  const used = Array(SIZE+1).fill(false);

  grid[0] = 1; used[1] = true; // seed

  const S = new Set([1,12,24,36]);

  const rows = Array.from({length:SIZE}, (_,i)=>Math.floor(i/N));

  const cols = Array.from({length:SIZE}, (_,i)=>i%N);
 
  const degree = neigh.map(a=>a.length);

  const order = [];

  for (let i=0;i<SIZE;i++) if (grid[i]==null) order.push(i);

  order.sort((a,b)=> degree[b]-degree[a]);
 
  function ok(pos,val) {

    for (const p of neigh[pos]) {

      const v = grid[p];

      if (v == null) continue;

      if (Math.abs(v - val) === 1) return false;

    }

    if (S.has(val)) {

      const r = rows[pos], c = cols[pos];

      for (let i=0;i<SIZE;i++) if (grid[i] != null && S.has(grid[i])) {

        if (rows[i] === r || cols[i] === c) return false;

      }

    }

    return true;

  }
 
  let solution = null;

  function backtrack(idx) {

    if (solution) return true;

    if (idx === order.length) { solution = grid.slice(); return true; }

    const pos = order[idx];

    for (let v=1; v<=SIZE; v++){

      if (used[v]) continue;

      if (!ok(pos,v)) continue;

      grid[pos]=v; used[v]=true;

      if (backtrack(idx+1)) return true;

      grid[pos]=null; used[v]=false;

    }

    return false;

  }
 
  if (backtrack(0)) {

    console.log("Q5 solution (row-major):", solution.join(','));

    for (let r=0;r<N;r++) console.log(solution.slice(r*N,(r+1)*N));

    return solution;

  } else {

    console.log("No Q5 solution found.");

    return null;

  }

})();