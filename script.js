// DOM Elements
const gridContainer = document.getElementById('grid-container');
const runBFSBtn = document.getElementById('runBFSBtn');
const runDFSBtn = document.getElementById('runDFSBtn');
const clearBoardBtn = document.getElementById('clearBoardBtn');
const clearPathBtn = document.getElementById('clearPathBtn');

// Mode Buttons
const drawWallBtn = document.getElementById('drawWallBtn');
const setStartBtn = document.getElementById('setStartBtn');
const setEndBtn = document.getElementById('setEndBtn');

// Global Variables
let grid = [];
let rows = 25;
let cols = 50;
let cellSize = 25;
let isMousePressed = false;

// Mode State
let currentMode = 'wall'; // 'wall', 'start', 'end'

// Wall Drawing State
let isAddingWall = true; // true if adding, false if removing (erasing)

// Default Start and End Positions
let startNode = { row: 10, col: 5 };
let endNode = { row: 10, col: 45 };

// Initialize
function init() {
    calculateGridSize();
    createGrid();
    addEventListeners();
    window.addEventListener('resize', handleResize);
}

function addEventListeners() {
    // Mode Switching
    drawWallBtn.addEventListener('click', () => setMode('wall'));
    setStartBtn.addEventListener('click', () => setMode('start'));
    setEndBtn.addEventListener('click', () => setMode('end'));

    // Actions
    runBFSBtn.addEventListener('click', () => startVisualization('bfs'));
    runDFSBtn.addEventListener('click', () => startVisualization('dfs'));
    clearBoardBtn.addEventListener('click', clearBoard);
    clearPathBtn.addEventListener('click', clearPath);
}

function setMode(mode) {
    currentMode = mode;

    // Update UI
    drawWallBtn.classList.remove('active');
    setStartBtn.classList.remove('active');
    setEndBtn.classList.remove('active');

    if (mode === 'wall') drawWallBtn.classList.add('active');
    else if (mode === 'start') setStartBtn.classList.add('active');
    else if (mode === 'end') setEndBtn.classList.add('active');
}

// Calculate grid size based on window size
function calculateGridSize() {
    const headerHeight = 80;
    const padding = 64; // 2rem on sides
    const availableWidth = window.innerWidth - padding;
    const availableHeight = window.innerHeight - headerHeight - padding;

    cols = Math.floor(availableWidth / cellSize);
    rows = Math.floor(availableHeight / cellSize);

    // Ensure start/end are within bounds
    if (endNode.col >= cols) endNode.col = cols - 2;
    if (endNode.row >= rows) endNode.row = rows - 2;
    if (startNode.row >= rows) startNode.row = Math.floor(rows / 2);
}

// Create Grid HTML
function createGrid() {
    gridContainer.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
    gridContainer.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
    gridContainer.innerHTML = '';
    grid = [];

    for (let r = 0; r < rows; r++) {
        let rowArray = [];
        for (let c = 0; c < cols; c++) {
            const node = document.createElement('div');
            node.classList.add('node');
            node.dataset.row = r;
            node.dataset.col = c;

            // Add initial classes
            if (r === startNode.row && c === startNode.col) {
                node.classList.add('node-start');
            } else if (r === endNode.row && c === endNode.col) {
                node.classList.add('node-end');
            }

            // Mouse Events
            node.addEventListener('mousedown', (e) => handleMouseDown(r, c, e));
            node.addEventListener('mouseenter', () => handleMouseEnter(r, c));
            node.addEventListener('mouseup', handleMouseUp);

            gridContainer.appendChild(node);
            rowArray.push({
                element: node,
                row: r,
                col: c,
                isWall: false,
                isVisited: false,
                distance: Infinity,
                previousNode: null
            });
        }
        grid.push(rowArray);
    }
}

// Resize Handling
function handleResize() {
    calculateGridSize();
    createGrid();
}

// Mouse Interactions
function handleMouseDown(row, col, e) {
    e.preventDefault();
    isMousePressed = true;

    // Handle Modes
    if (currentMode === 'start') {
        moveStartNode(row, col);
    } else if (currentMode === 'end') {
        moveEndNode(row, col);
    } else if (currentMode === 'wall') {
        // Determine whether we are adding or removing walls based on the clicked cell
        // If clicked on wall -> remove mode. If clicked on empty -> add mode.
        isAddingWall = !grid[row][col].isWall;
        updateWall(row, col);
    }
}

function handleMouseEnter(row, col) {
    if (!isMousePressed) return;

    if (currentMode === 'wall') {
        updateWall(row, col);
    }
    // For start/end, we could support dragging, but clicking is safer/clearer as per user request.
    // If we want drag support + click support, we need to distinguish start-of-drag. 
    // For now, let's keep start/end as click-to-place to resolve "choosing points".
    else if (currentMode === 'start') {
        moveStartNode(row, col);
    } else if (currentMode === 'end') {
        moveEndNode(row, col);
    }
}

function handleMouseUp() {
    isMousePressed = false;
}

function updateWall(row, col) {
    // Don't overwrite start or end nodes
    if ((row === startNode.row && col === startNode.col) ||
        (row === endNode.row && col === endNode.col)) return;

    const nodeParams = grid[row][col];

    // Only update if the state is different
    if (nodeParams.isWall !== isAddingWall) {
        nodeParams.isWall = isAddingWall;
        if (isAddingWall) {
            nodeParams.element.classList.add('node-wall');
        } else {
            nodeParams.element.classList.remove('node-wall');
        }
    }
}

function moveStartNode(row, col) {
    if (grid[row][col].isWall) return;

    const prevStart = grid[startNode.row][startNode.col];
    prevStart.element.classList.remove('node-start');

    startNode = { row, col };

    const newStart = grid[row][col];
    newStart.element.classList.add('node-start');
}

function moveEndNode(row, col) {
    if (grid[row][col].isWall) return;

    const prevEnd = grid[endNode.row][endNode.col];
    prevEnd.element.classList.remove('node-end');

    endNode = { row, col };

    const newEnd = grid[row][col];
    newEnd.element.classList.add('node-end');
}

// Graph Implementation
class Graph {
    constructor() {
        this.adjacencyList = new Map();
    }

    addNode(node) {
        if (!this.adjacencyList.has(node)) {
            this.adjacencyList.set(node, []);
        }
    }

    addEdge(node1, node2) {
        // Undirected graph
        if (this.adjacencyList.has(node1) && this.adjacencyList.has(node2)) {
            this.adjacencyList.get(node1).push(node2);
            this.adjacencyList.get(node2).push(node1);
        }
    }

    getNeighbors(node) {
        return this.adjacencyList.get(node) || [];
    }
}

let graph = new Graph();

function buildGraph() {
    graph = new Graph();
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const node = grid[r][c];

            if (node.isWall) continue;

            graph.addNode(node);

            // Connect to valid neighbors (only need to check Down and Right to avoid duplicates in undirected graph)
            // Actually, need to be careful. The graph needs all nodes added. 
            // Better to add all non-wall nodes first? 
            // My addNode handles duplicates.

            const directions = [[1, 0], [0, 1]]; // Down, Right

            for (const [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;

                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    const neighbor = grid[nr][nc];
                    if (!neighbor.isWall) {
                        graph.addNode(neighbor); // Ensure neighbor exists
                        graph.addEdge(node, neighbor);
                    }
                }
            }
        }
    }
}

// Pathfinding Logic
function startVisualization(algorithm) {
    // Prevent interaction during visualization? Optional but good practice.
    // For now, just clear previous path
    clearPath();
    buildGraph();

    if (algorithm === 'bfs' || algorithm === 'dfs') {
        if (algorithm === 'bfs') runBFS();
        else runDFS();
    }
}

function clearBoard() {
    clearPath();
    // Clear walls
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c].isWall) {
                grid[r][c].isWall = false;
                grid[r][c].element.classList.remove('node-wall');
            }
        }
    }
}

function clearPath() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const node = grid[r][c];
            node.isVisited = false;
            node.distance = Infinity;
            node.previousNode = null;
            node.element.classList.remove('node-visited', 'node-path');
        }
    }
}

function runBFS() {
    const queue = [];
    const startCell = grid[startNode.row][startNode.col];
    const endCell = grid[endNode.row][endNode.col];

    startCell.isVisited = true;
    startCell.distance = 0;
    queue.push(startCell);

    const visitedNodesInOrder = [];
    let found = false;

    while (queue.length > 0) {
        const current = queue.shift();
        visitedNodesInOrder.push(current);

        if (current === endCell) {
            found = true;
            break;
        }

        const neighbors = graph.getNeighbors(current);
        for (const neighbor of neighbors) {
            if (!neighbor.isVisited && !neighbor.isWall) {
                neighbor.isVisited = true;
                neighbor.previousNode = current;
                neighbor.distance = current.distance + 1;
                queue.push(neighbor);
            }
        }
    }

    animateAlgorithm(visitedNodesInOrder, endCell, found);
}

function runDFS() {
    const stack = [];
    const startCell = grid[startNode.row][startNode.col];
    const endCell = grid[endNode.row][endNode.col];

    startCell.isVisited = true;
    startCell.distance = 0;
    stack.push(startCell);

    const visitedNodesInOrder = [];
    let found = false;

    while (stack.length > 0) {
        const current = stack.pop();
        visitedNodesInOrder.push(current);

        if (current === endCell) {
            found = true;
            break;
        }

        const neighbors = graph.getNeighbors(current);
        // Reverse neighbors to explore mostly in one direction first (visual preference)
        // or just iterate. 
        for (const neighbor of neighbors) {
            if (!neighbor.isVisited && !neighbor.isWall) {
                neighbor.isVisited = true;
                neighbor.previousNode = current;
                stack.push(neighbor);
            }
        }
    }

    animateAlgorithm(visitedNodesInOrder, endCell, found);
}

// Function getNeighbors removed as we use Graph class now

function animateAlgorithm(visitedNodesInOrder, endCell, found) {
    let speed = 10;

    for (let i = 0; i < visitedNodesInOrder.length; i++) {
        setTimeout(() => {
            const node = visitedNodesInOrder[i];
            const isStart = (node.row === startNode.row && node.col === startNode.col);
            const isEnd = (node.row === endNode.row && node.col === endNode.col);

            if (!isStart && !isEnd) {
                node.element.classList.add('node-visited');
            }

            if (i === visitedNodesInOrder.length - 1 && found) {
                animateShortestPath(endCell);
            }
        }, speed * i);
    }
}

function animateShortestPath(endCell) {
    const nodesInShortestPathOrder = [];
    let currentNode = endCell;
    while (currentNode !== null) {
        nodesInShortestPathOrder.unshift(currentNode);
        currentNode = currentNode.previousNode;
    }

    setTimeout(() => {
        for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
            setTimeout(() => {
                const node = nodesInShortestPathOrder[i];
                const isStart = (node.row === startNode.row && node.col === startNode.col);
                const isEnd = (node.row === endNode.row && node.col === endNode.col);
                if (!isStart && !isEnd) {
                    node.element.classList.add('node-path');
                }
            }, 30 * i);
        }
    }, 10);
}

// Start
init();
