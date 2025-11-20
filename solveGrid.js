const N = 5;
const domain = Array.from({length: N*N}, (_, i) => i+1);

function isValid(grid, r, c, val, used) {
  for(const [dr,dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
    let nr = r+dr, nc = c+dc;
    if(nr>=0 && nr<N && nc>=0 && nc<N && grid[nr][nc]!=null) {
      if(Math.abs(grid[nr][nc] - val) === 1) return false;
    }
  }
  for(const [dr,dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
    let nr = r+dr, nc = c+dc;
    if(nr>=0 && nr<N && nc>=0 && nc<N && grid[nr][nc]!=null) {
      if(Math.abs(grid[nr][nc] - val) === 2) return false;
    }
  }
  return true;
}

function solve(grid, used, r=0, c=0) {
  if(r === N) {
    if(checkGlobalConstraints(grid)) return grid; 
    return null;
  }
  let nextR = c===N-1 ? r+1 : r, nextC = c===N-1 ? 0 : c+1;
  for(let v=1; v<=N*N; v++) {
    if(!used[v]) {
      if(isValid(grid, r, c, v, used)) {
        grid[r][c] = v;
        used[v] = true;
        let result = solve(grid, used, nextR, nextC);
        if(result) return result;
        grid[r][c] = null;
        used[v] = false;
      }
    }
  }
  return null;
}

let grid = Array.from({length:N},()=>Array(N).fill(null));
let used = Array(N*N+1).fill(false);
let solution = solve(grid, used);
if(solution) {
  let flat = [].concat(...solution);
  console.log(flat.join(','));
} else {
  console.log('No solution found!');
}