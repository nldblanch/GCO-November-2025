//Question 3

(function solve() {
    const N = 5;
    const SIZE = N * N;
    const centerIdx = 2 * N + 2; // 0-based index of row3,col3
   
    // the 10 prime-numbered cell positions (problem given as 1-based):
    const prime1based = [
      [1,2],[1,4],[2,1],[2,3],[2,5],[3,2],[3,4],[4,1],[4,3],[4,5]
    ];
    // convert to 0-based indices
    const primeIdxs = prime1based.map(([r,c]) => (r-1)*N + (c-1));
    const isPrimePos = new Array(SIZE).fill(false);
    primeIdxs.forEach(i => isPrimePos[i] = true);
   
    // neighbor precomputation: for each cell, list of [index, type] where type is 'orth' or 'diag'
    const orthDirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const diagDirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
    const neighbors = Array.from({length: SIZE}, () => []);
    for (let r=0; r<N; r++){
      for (let c=0; c<N; c++){
        const idx = r*N + c;
        for (const [dr,dc] of orthDirs){
          const rr = r+dr, cc = c+dc;
          if (rr>=0 && rr<N && cc>=0 && cc<N) neighbors[idx].push([rr*N+cc, 'orth']);
        }
        for (const [dr,dc] of diagDirs){
          const rr = r+dr, cc = c+dc;
          if (rr>=0 && rr<N && cc>=0 && cc<N) neighbors[idx].push([rr*N+cc, 'diag']);
        }
      }
    }
   
    // degree heuristic: sort cells by number of neighbors descending (center fixed first)
    const degree = Array.from({length: SIZE}, (_,i) => neighbors[i].length);
    const order = Array.from({length: SIZE}, (_,i) => i)
      .sort((a,b) => (degree[b] - degree[a]) || (a - b));
    // ensure center is first
    const centerPos = order.indexOf(centerIdx);
    if (centerPos > 0) { order.splice(centerPos,1); order.unshift(centerIdx); }
   
    // grid and usage tracking
    const grid = new Array(SIZE).fill(null);
    const used = new Array(SIZE+1).fill(false); // index by value 1..25
   
    // fix center to 13
    grid[centerIdx] = 13;
    used[13] = true;
   
    // check local constraints for placing val at pos
    function okAssign(pos, val){
      for (const [p, typ] of neighbors[pos]){
        const v = grid[p];
        if (v === null) continue;
        if (typ === 'orth' && Math.abs(v - val) === 1) return false;
        if (typ === 'diag' && Math.abs(v - val) === 2) return false;
      }
      return true;
    }
   
    // backtracking search
    let solution = null;
    const values = Array.from({length: SIZE}, (_,i) => i+1);
   
    function backtrack(iOrder){
      if (solution) return true;
      if (iOrder === order.length){
        // full assignment: check prime-sum parity
        const sumPrime = primeIdxs.reduce((s, idx) => s + grid[idx], 0);
        if (sumPrime % 2 === 0) {
          solution = grid.slice();
          return true;
        }
        return false;
      }
   
      const pos = order[iOrder];
      if (grid[pos] !== null) return backtrack(iOrder+1);
   
      // try values (we can try evens first to help parity, but here iterate normal)
      for (const v of values){
        if (used[v]) continue;
        if (!okAssign(pos, v)) continue;
   
        // small parity pruning: if this is the last unassigned prime cell, ensure final parity is even
        const isPrime = isPrimePos[pos];
        const remainingPrimeUnassigned = primeIdxs.reduce((cnt, idx) => cnt + (grid[idx] === null ? 1 : 0), 0) - (isPrime ? 1 : 0);
        if (remainingPrimeUnassigned === 0) {
          // compute parity if we place v here
          const partial = primeIdxs.reduce((s, idx) => s + (grid[idx] === null ? 0 : grid[idx]), 0) + (isPrime ? v : 0);
          if (partial % 2 !== 0) continue;
        }
   
        // assign
        grid[pos] = v; used[v] = true;
        if (backtrack(iOrder+1)) return true;
        grid[pos] = null; used[v] = false;
      }
      return false;
    }
   
    const found = backtrack(0);
    if (!found) {
      console.log("No solution found");
      return;
    }
   
    // print as comma-separated row-major string
    console.log(solution.join(','));
  })();


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