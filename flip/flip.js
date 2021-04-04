const WHITE='w';
const BLACK='b';
const USE_ROTATION=true;

/* Model to represent a piece */
class Piece {
    constructor(col, row, color, angle) {
        this.col = col;
        this.row = row;
        this.color = (color===WHITE) ? WHITE : BLACK;
        this.angle = angle;     // in degrees to avoid floating point rounding error
    }
    flip() {
        this.color = (this.color===WHITE) ? BLACK : WHITE;
        this.angle += 180;
    }
    copy() {
        return new Piece(this.col, this.row, this.color, this.angle);
    }
}

/* Model to represent a board */
class Board {
    constructor(cells_wide,cells_high) {
        this.pieces = Array();
        this.board  = Array(cells_wide)
        this.cells_wide = cells_wide;
        this.cells_high = cells_high;
        for(let i=0;i<this.cells_wide;i++){
            this.board[i] = new Array(cells_high);
        }
    }
    /* Copy a board */
    copy() {
        let nb = new Board(this.cells_wide, this.cells_high);
        for(let p of this.pieces){
            let c = p.copy();
            nb.pieces.push(c);
            nb.board[ c.col ][ c.row ] = c;
        }
        return nb;
    }

    addPiece( p ) {
        this.pieces.push( p );
        this.board[p.col][p.row] = p;
    }

    /* Initialize the board with the top half white and the bttom half black */
    initHalf() {
        for(let i=0;i<this.cells_wide;i++){
            for(let j=0;j<this.cells_high;j++){
                let color = j < this.cells_high/2 ? WHITE : BLACK;
                let angle = j < this.cells_high/2 ? 0     : 180;
                this.addPiece( new Piece(i,j,color, angle) );
            }
        }
    }

    /* Flip an i,j piece */
    piece(i,j) {
        return this.board[i][j];
    }
    dump() {
        for(let j=0;j<this.cells_high;j++){
            console.log(this.board[0][j],
                        this.board[1][j],
                        this.board[2][j],
                        this.board[3][j],
                        this.board[4][j],
                        this.board[5][j]);
        }
        console.log("----------------------------");
    }
}

/* Abstract class to represent where a board is shown and perform math */
class BoardView {
    /* location of the board */
    constructor(cells_wide, cells_high, width, height) {
        this.cells_wide = cells_wide;
        this.cells_high = cells_high;
        this.width      = width;
        this.height     = height;
        this.spacing  = this.height / this.cells_high;
        this.margin   = 3;
        this.radius = this.spacing/2-3;
    }
    /* Centers of pieces */
    x(i) {
        return this.width * (i+.5) / this.cells_wide;
    }
    y(j) {
        return this.height * (j+.5) / this.cells_high;
    }

    /* Abstract entry point */
    drawPiece(p) {
        if (USE_ROTATION) {
            this.drawRotatedPiece( p );
        } else {
            this.drawColoredPiece( p );
        }
    }

    /* Draw the entire board and the pieces */
    drawBoard(b) {
        this.drawSquares();
        for( let p of b.pieces) {
            this.drawPiece( p );
        }
    }

    /* These must be subclassed */
    drawSquares() {
        console.log("DrawBoard drawSquares called???");
    }

    drawRotatedPiece() {
        console.log("DrawBoard drawRotatedPiece called???");
    }

}

/* Operates the board in a <canvas> */
class DrawBoardCanvas extends BoardView {
    constructor(cells_wide, cells_high, ctx){
        super(cells_wide, cells_high, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
        this.ctx      = ctx;
    }
    /* Draw the square where the pieces rotate on the canvas */
    drawSquares() {
        let mg = (this.width / this.cells_wide)/2.0 - this.margin;
        this.ctx.beginPath();
        for(let i=0;i<this.cells_wide;i++){
            for(let j=0;j<this.cells_high;j++){
                this.ctx.rect( this.x(i)-mg, this.y(j)-mg, mg*2, mg*2);
            }
        }
        this.ctx.strokeStyle='red';
        this.ctx.stroke();
    }
    /* Draw a Piece at its rotation at the position row,col in the canvas*/
    drawRotatedPiece(p) {
        let x = this.x(p.col);
        let y = this.y(p.row);
        this.ctx.beginPath();
        this.ctx.save();
        this.ctx.translate( x, y);
        this.ctx.fillStyle='white';
        this.ctx.fillRect( -this.radius, -this.radius, this.radius*2, this.radius*2 );
        this.ctx.rotate( p.angle * Math.PI / 180);
        this.ctx.moveTo( 0, -this.radius );
        this.ctx.lineTo( -this.radius, 0 );
        this.ctx.lineTo( +this.radius, 0 );
        this.ctx.closePath( );
        this.ctx.fillStyle='black';
        this.ctx.fill();
        this.ctx.fillRect( -this.radius/2.0, 0, this.radius, this.radius*2/3.0 );
        this.ctx.restore();
    }

    /* Draw a piece at its location in WHITE or BLACK */
    drawColoredPiece(p) {
        let x = this.x(p.col);
        let y = this.y(p.row);
        this.ctx.beginPath();
        this.ctx.arc( x, y, this.radius, 0, 2 * Math.PI);
        if (p.color===WHITE){
            this.ctx.strokeStyle='red';
            this.ctx.fillStyle='white';
        } else {
            this.ctx.strokeStyle='black';
            this.ctx.fillStyle='black';
        }
        this.ctx.stroke();
        this.ctx.fill();
    }
}


function xystring(x,y){
 return x + " " + y
}

function xycomma(x,y){
 return x + "," + y
}

class MakeBoardSVG extends BoardView {
    constructor(cells_wide, cells_high, svg){
        super(cells_wide, cells_high, svg.attr('width'), svg.attr('height'));
        this.svg      = svg;
        this.addSquares();
    }
    addSquares() {
        /* Add the squares to the svg */
        let mg = (this.width / this.cells_wide)/2.0 - this.margin;
        for(let i=0;i<this.cells_wide;i++){
            for(let j=0;j<this.cells_high;j++){
                var rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
                rect.setAttribute('x', this.x(i) - mg);
                rect.setAttribute('y', this.y(j) - mg);
                rect.setAttribute('width', mg*2);
                rect.setAttribute('height', mg*2);
                rect.setAttribute("style", "fill:white; stroke:red; strike-width:1;");
                this.svg.append(rect);
            }
        }
    }
    transformForPiece(p) {
        return 'translate(' + this.radius + ',' + this.radius + ') rotate('+p.angle+')'
    }
    idForPiece(p) {
        return "arrow-" + p.col + "," + p.row;
    }
    addPathForPiece(p) {
        let x = this.x(p.col);
        let y = this.y(p.row);
        let r = this.radius;
        var box = document.createElementNS('http://www.w3.org/2000/svg','svg');
        box.setAttribute('x', x-r);
        box.setAttribute('y', y-r);
        box.setAttribute('width', r*2);
        box.setAttribute('height', r*2);
        this.svg.append(box)

        /* linexy - draw a line to the X,Y position */
        function lxy(x,y){
            return "L " + x + " " + y + " ";
        }

        let arrow = document.createElementNS('http://www.w3.org/2000/svg','path');
        arrow.setAttribute('style', 'stroke:none;fill:black');
        arrow.setAttribute('transform', this.transformForPiece(p));
        arrow.setAttribute('d',
                          'M 0 0 '+lxy(0,-r) + lxy(-r, 0) + lxy(-r/2,0)
                          + lxy(-r/2, r) + lxy(+r/2,r) + lxy(+r/2,0) + lxy(r,0) + lxy(0,-r) + " Z ");
        arrow.setAttribute('id', this.idForPiece(p));
        p.path = arrow;         // modify the piece with its svg path
        box.append(arrow);
    }

    addBoard(board) {
        /* Add the board and all of its pieces */
        this.board = board;
        /* each piece has the ID x,y which is piece */
        for(let p of this.board.pieces) {
            this.addPathForPiece(p);
        }
    }

    drawPiece(p) {
        /* Given a piece, set the path for this piece to have the same rotation */
        p.path.setAttribute('transform', this.transformForPiece(p));
    }
}


function set_time( when ) {
}



/* Given a board drawer db, a piece p, a start and and end rotation, rotate it */
const INCREMENT_DEGREES = 10;
const INCREMENT_MS      = 10;
function rotatePieceTimer( db, p, start, end ) {
    if (start > end) {
        start = end;
    }
    p.angle = start;            // set the current angle
    db.drawPiece(p);            // draw the piece at the curren totation
    if (p.angle < end) {         // if we have more to go
        setTimeout( function () { rotatePieceTimer( db, p, start+INCREMENT_DEGREES, end); }, INCREMENT_MS);
    }
}

/* rotate the given piece from start to end (in degrees) using SVG. Should be smoother in most browsers */
function rotatePieceSVG( db, p, start, end){
    // this just changes the attribute:

    var noAnimation = false;
    if (noAnimation) {
	p.angle = end;
	p.path.setAttribute('transform',db.transformForPiece(p));
	return;
    }

    // This is the animation I can't get to work...
    var t = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
    t.setAttribute('attributeName','transform');
    t.setAttribute('attributeType','XML');
    t.setAttribute('type','rotate');
    t.setAttribute('from',p.angle+' '+db.radius+' '+db.radius);
    p.angle = end;
    t.setAttribute('to',p.angle+' '+db.radius+' '+db.radius);
    t.setAttribute('dur','1s');
    p.path.append(t);
    console.log("after rotate: p=",p);
}

$(document).ready(function() {
    // create the slider
    $('#timeSlider').slider({min:0,
                             max:100,
                             step:1,
                             value:0,
                             slide:function(event, ui) {
                                 set_time( ui.value );
                             }});

    // First find the view and its size
    let svg = $('#flipView');
    const cells_wide = Math.max(svg.attr('cells_wide'), 4); // don't go smaller than 4
    const cells_high = Math.max(svg.attr('cells_high'),4);

    // Construct a board of this size
    let boardHistory = Array(0);
    let board = new Board(cells_wide, cells_high); // current board
    board.initHalf();                              // half arrows up, half down

    // Construct a board drawer and draw it
    let db = new MakeBoardSVG(cells_wide, cells_high, svg);
    db.addBoard(board);         // add the board

    function roll (e) {
        /* Pick a random piece */
        let i = Math.floor(Math.random() * cells_wide);
        let j = Math.floor(Math.random() * cells_high);
        let p = board.piece(i,j); // get the piece
	console.log("roll p=",p);
        rotatePieceTimer(db, p, p.angle, Math.ceil(p.angle/180)*180+180) // rotate with timer
        //rotatePieceSVG(db, p, p.angle, Math.ceil(p.angle/180)*180+180) // rotate with timer
        //$('#time').text(boardHistory.length);
    }

    $('#roll').click(  roll );

    let interval = null;


    $('#run').click( function(e) {
        if (interval==null) {
            interval = setInterval(roll, 200);
        }
    });
    $('#stop').click( function(e) {
        if (interval!=null){
            clearInterval(interval);
            interval=null;
        }
    });
});
