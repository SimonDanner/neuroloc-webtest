var sol;
var frame_rate = 1/60.0;
var dt = 0.0005;
var distance_x = 0.5;
var cont_draw_pos = 0.5;
var m;
var surfaceline_x 
var surfaceline_y
var color_surface = 'rgb(204, 121, 167)';
var color_leg0 = 'rgb(138, 95, 0)'
var color_leg1_shade = 'rgb(115, 79, 0)'
var color_leg1 = 'rgb(230, 159, 0)'
var color_leg1_off = 'rgb(86, 180, 233)'
var color_leg0_off = 'rgb(51, 108, 139)'
var color_white = 'rgb(255, 255, 255)'
var pb_speed = 0.2
var canvas, dpr;
var ctx
var then
var now
var reset_vec
var var_off = false;
var t_ = 0.0;
var t_last_hist = 0.0;
var dt_hist = 0.005;
var variable_vector = ['fbIa_GM', 'fbIa_VL', 'fbIa_SO','fbIa_BF', 'fbIa_GA', 'fbIa_IP', 'fbIa_TA']
class CircularBuffer {
    constructor(capacity) {
      this.capacity = capacity;
      this.buffer = new Array(capacity);
      this.size = 0;
      this.head = 0;
      this.tail = 0;
    }
  
    isFull() {
      return this.size === this.capacity;
    }
  
    isEmpty() {
      return this.size === 0;
    }
  
    enqueue(item) {
      if (this.isFull()) {
        // If the buffer is full, overwrite the oldest item
        this.head = (this.head + 1) % this.capacity;
      }
      this.buffer[this.tail] = item;
      this.tail = (this.tail + 1) % this.capacity;
      this.size = Math.min(this.size + 1, this.capacity);
    }
  
    dequeue() {
      if (this.isEmpty()) {
        return undefined; // Buffer is empty
      }
      const item = this.buffer[this.head];
      this.head = (this.head + 1) % this.capacity;
      this.size--;
      return item;
    }
  
    peek() {
      if (this.isEmpty()) {
        return undefined; // Buffer is empty
      }
      return this.buffer[this.head];
    }
    
    get(i){
        if (this.isEmpty()) {
            return undefined; // Buffer is empty
        }
        return this.buffer[(this.head+i)%this.capacity];
    }

    toArray() {
      const result = [];
      for (let i = 0; i < this.size; i++) {
        result.push(this.buffer[(this.head + i) % this.capacity]);
      }
      return result;
    }
  
    clear() {
      this.size = 0;
      this.head = 0;
      this.tail = 0;
      this.buffer = new Array(this.capacity);
    }
}

var cbuf = new CircularBuffer(500);

function check(e) {
    var code = e.keyCode;
    switch (code) {
        case 81: pb_speed*=1.1; break; //Q
        case 87: pb_speed/=1.1; break; //W
        case 32:
            if(!var_off){
                var zerovec = new Module.DoubleVector();
                for(var i = 0;i<reset_vec.size();++i){
                    zerovec.push_back(0.0);
                }
                sol.updateVariableVector(zerovec); 
            }else{
                sol.updateVariableVector(reset_vec);
            }
            var_off = !var_off;
            break; //Right key
    }
}

function drawline(ctx, points_x,points_y, color, linewidth){
    ctx.beginPath();
    ctx.moveTo(points_x[0], points_y[1])
    var len = points_x.length;
    for(var i = 0; i < len; i++){
        ctx.lineTo(points_x[i], points_y[i]);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = linewidth;
    ctx.stroke();
    
}

function drawline_v(ctx, points, color, linewidth){
    ctx.beginPath();
    ctx.moveTo(points.get(0).x,points.get(0).y)
    var len = points.size();
    for(var i = 0; i < len; i++){
        ctx.lineTo(points.get(i).x, points.get(i).y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = linewidth;
    ctx.stroke();
}

function drawJoint(ctx, position, linecolor, linewidth, fillcolor) {
    ctx.lineWidth = linewidth;
    ctx.strokeStyle = linecolor;
    ctx.beginPath();
    ctx.arc(position.x, position.y, 0.0015, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = fillcolor;
    ctx.fill();
}

function drawline_v2(ctx, points, color, linewidth){
    ctx.beginPath();
    ctx.moveTo(points[0][0],points[0][1])
    var len = points.length;
    for(var i = 0; i < len; i++){
        ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = linewidth;
    ctx.stroke();
    
}

function legsToLineSimple(m){
    return [
        [
            [m.hip.x, m.hip.y],
            [m.getKnees().get(0).x, m.getKnees().get(0).y],
            [m.getAnkles().get(0).x, m.getAnkles().get(0).y],
            [m.getFeet().get(0).x, m.getFeet().get(0).y]
        ],
        [
            [m.hip.x, m.hip.y],
            [m.getKnees().get(1).x, m.getKnees().get(1).y],
            [m.getAnkles().get(1).x, m.getAnkles().get(1).y],
            [m.getFeet().get(1).x, m.getFeet().get(1).y]
        ]
    ];
}

function modelToLinesExt(m) {
    return [
        [
            [m.flend.x, m.flend.y], [m.shoulder2.x, m.shoulder2.y], 
            [m.getPelvis().get(0).x, m.getPelvis().get(0).y], 
            [m.getPelvis().get(1).x, m.getPelvis().get(1).y]
        ],
        [
            [m.hip.x, m.hip.y],
            [m.getKnees().get(0).x, m.getKnees().get(0).y],
            [
                m.getKnees().get(0).x + 0.2 * (m.getKnees().get(0).x - m.getAnkles().get(0).x),
                m.getKnees().get(0).y + 0.2 * (m.getKnees().get(0).y - m.getAnkles().get(0).y)
            ],
            [m.getAnkles().get(0).x, m.getAnkles().get(0).y],
            [
                m.getAnkles().get(0).x + 0.2 * (m.getAnkles().get(0).x - m.getFeet().get(0).x),
                m.getAnkles().get(0).y + 0.2 * (m.getAnkles().get(0).y - m.getFeet().get(0).y)
            ],
            [m.getFeet().get(0).x, m.getFeet().get(0).y]
        ],
        [
            [m.hip.x, m.hip.y],
            [m.getKnees().get(1).x, m.getKnees().get(1).y],
            [
                m.getKnees().get(1).x + 0.2 * (m.getKnees().get(1).x - m.getAnkles().get(1).x),
                m.getKnees().get(1).y + 0.2 * (m.getKnees().get(1).y - m.getAnkles().get(1).y)
            ],
            [m.getAnkles().get(1).x, m.getAnkles().get(1).y],
            [
                m.getAnkles().get(1).x + 0.2 * (m.getAnkles().get(1).x - m.getFeet().get(1).x),
                m.getAnkles().get(1).y + 0.2 * (m.getAnkles().get(1).y - m.getFeet().get(1).y)
            ],
            [m.getFeet().get(1).x, m.getFeet().get(1).y]
        ]
    ];
}

function init(solver){
    sol = solver;
    m = sol.get_model();
    var vv = new Module.StringVector();
    for(var i=0;i<variable_vector.length;++i){
        vv.push_back(variable_vector[i])
    }
    reset_vec = sol.setupVariableVector(vv);
    canvas = document.getElementById('canvas');
    dpr = window.devicePixelRatio || 1;
    // Get the size of the canvas in CSS pixels.
    //var rect = canvas.getBoundingClientRect();
    //canvas.width = rect.width * dpr;
    //canvas.height = rect.height * dpr;
    //canvas.style.width = rect.width.toString()+'px';
    //canvas.style.height = rect.height.toString()+'px'; 
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    //surfaceline_x = new Array(WIDTH);
    //surfaceline_y = new Array(WIDTH);
    then = Date.now();
    window.addEventListener('keydown',this.check,false);

    //var tb = new cbuf(3);
    //tb.push(1);
    //console.log(tb.get(0));
    //tb.push(2);
    //tb.push(3);
    //console.log(tb.get(0),tb.get(1),tb.get(2);
    //tb.push(4);
    //console.log(tb.get(0),tb.get(1),tb.get(2);
    window.requestAnimationFrame(draw);
}

function draw(){
    //var ctx = canvas.getContext('2d');
    var width  = window.innerWidth*dpr;
    var height = window.innerHeight*dpr;
    if((canvas.width !== width) || (canvas.height !== height)){
        canvas.width  = width
        canvas.height = height
        canvas.style.width =  window.innerWidth.toString()+'px';
        canvas.style.height = window.innerHeight.toString()+'px';
    }
    ctx.clearRect(0,0,width,height);
    now = Date.now();
    elapsed = (now - then)*0.001;
    if (elapsed > 1./60.0) { elapsed = 1.0/60.0;}
    for (var i = 0; i < Math.floor((elapsed*pb_speed) / dt); i++) { 
        sol.step(dt,false);
        t_+=dt;
    }
    m = sol.get_model();
    
    //var x_disp = [m.torso_center.x-distance_x * (cont_draw_pos), m.torso_center.x+distance_x*(1-cont_draw_pos)];
    var x_disp = [Math.floor(m.torso_center.x / (distance_x*0.8)) * distance_x*0.8 - distance_x*0.1,
                    Math.ceil(m.torso_center.x / (distance_x*0.8)) * distance_x*0.8 + distance_x*0.1] 


    //for(i=canvas.width-1;i>=0;i--){ 
    //    surfaceline_x[i] = x_disp[0]+i*(x_disp[1]-x_disp[0])/canvas.width;
    //    surfaceline_y[i] = sol.get_surface_height(surfaceline_x[i]);
    //}
    ctx.save();
    ctx.scale(canvas.width, canvas.width);
    ctx.save()
    ctx.translate(0.0, 0.2);
    ctx.scale(1/distance_x, 1/distance_x);
    ctx.save();
    //t=ctx.getTransform().translate(-x_disp[0],sol.get_surface_height(x_disp[0]))
    //ctx.setTransform(t)
    ctx.translate(-x_disp[0],sol.get_surface_height(x_disp[0]));
    ctx.scale(1.0, -1.0);

    //drawline(ctx, surfaceline_x,surfaceline_y, color_surface, 0.001);
    ctx.beginPath();
    ctx.strokeStyle = color_surface;
    ctx.lineWidth = 0.001;
    var N_points_surface=500;
    var x = x_disp[0]+(x_disp[1]-x_disp[0])/N_points_surface;
    var y = sol.get_surface_height(x);
    ctx.moveTo(x, y)
    //console.log(x,y)
    for(var i = 1; i < N_points_surface; i++){
        var x = x_disp[0]+i*(x_disp[1]-x_disp[0])/N_points_surface;
        var y = sol.get_surface_height(x)-(0.001/2);
        ctx.lineTo(x, y);
        if(i%10==0){
            ctx.moveTo(x, y);
        }
        
        
        //console.log(x,y);
    }
    
    ctx.stroke();

    ex_lines = modelToLinesExt(m);
    
    model_line_colors = [color_leg0, color_leg0, color_leg1];
    for(var i = 0; i < ex_lines.length; i++){
        drawline_v2(ctx, ex_lines[i], model_line_colors[i], 0.00075);
    }
    drawJoint(ctx, m.getKnees().get(0), color_leg0, 0.00075, color_white);
    drawJoint(ctx, m.getKnees().get(1), color_leg1, 0.00075, color_white);
    drawJoint(ctx, m.getAnkles().get(0), color_leg0, 0.00075, color_white);
    drawJoint(ctx, m.getAnkles().get(1), color_leg1, 0.00075, color_white);
    drawJoint(ctx, m.hip, color_leg0, 0.00075, color_white);

    if (t_last_hist < t_ - dt_hist){
        t_last_hist = t_;
        cbuf.enqueue([legsToLineSimple(m),[sol.get_foot_contact(0),sol.get_foot_contact(1)]]);
    }
    for(var j = 0; j < cbuf.size; j++){
        for(var i = 0; i < ex_lines.length; i++){
            lines = cbuf.get(j)[0]
            fc = cbuf.get(j)[1]
            col_ = fc[0] ? color_leg1_shade : color_leg1
            drawline_v2(ctx, lines[0], col_, 0.0005);
        }
    }

    //ml = new Module.model_lines(m);
    //if (!var_off){
    //    drawline_v(ctx, ml.torso, color_leg0, 0.00075);
    //    drawline_v(ctx, ml.leg0, color_leg0, 0.00075);
    //    drawline_v(ctx, ml.leg1, color_leg1, 0.00075);
    //}else{
    //    drawline_v(ctx, ml.torso, color_leg0_off, 0.00075);
    //    drawline_v(ctx, ml.leg0, color_leg0_off, 0.00075);
    //    drawline_v(ctx, ml.leg1, color_leg1_off, 0.00075);
    //}
    t=ctx.getTransform()
    x=x_disp[1]
    y=sol.get_surface_height(x_disp[1])

    ctx.restore();
    ctx.restore();
    ctx.restore();
    //console.log(x,y,t.a*x+t.c*y+t.e,t.b*x+t.d*y+t.f);
    then  = now;
    window.requestAnimationFrame(draw);
}