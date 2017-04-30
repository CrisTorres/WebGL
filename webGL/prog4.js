	// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'varying vec2 v_TexCoord;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'void main() {\n' +
  '  gl_Position =  u_MvpMatrix * a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '  gl_PointSize = 7.0;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
  '}\n';

var SOLID_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
　'  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '  gl_PointSize = 7.0;\n' +
  '}\n';

// Fragment shader for single color drawing
var SOLID_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

var secondLight = true; // boolean variable to control if the second light is on
var pointLightPosition = [0,500,0];  //Position of the point light
var LineLight = true;   //boolean variable to control if the directional light is on
var active = false; // boolean variable to control if we are drawing at the moment
var matrix=[];         //variable with all the points
var view1 = 0;      // variable to store the current view point
var g_points = []; // The array for the position of each mouse press and for the current pointer position
var arrayNormal = []; //Array for the normal of the faces
var numV = [];        //Array with the number of vertex
var ArrayVertex;    //Array with the normal for each vertex
var specularLight = false;    //boolean to control if the specular lighting is on
var flat = true;    //boolean to control if we have flat shading or smooth shading
var g = 1;      //Variable for the glossiness
var Ks=[0,1,0];     //Specular lighting color
var light = [1,1,1];  //Light color
var pointLight = [1,1,0];  //point light color
var Kd = [1,0,0];     // Diffuse light color
var Ka = [0,0,0.2];   //Ambient  color
var Ambient = true;  //boolean to control if the ambient light is on
var ortho = true;     // boolean variable to control we have the orthographic projection
var mvpMatrix = new Matrix4();
var lineLight = [0,0,0,500,500,500];    //Array with two points used to draw the directional
var mouseDown = false;
var startT = [0,0];
var inde =[];
var objects =[];
var read =false;
var objActive =0;
var fov = 40;
var eyePoint_x = 400;
var eyePoint_y = 1000;
var eyePoint_z = 1500;
var lightPicked = false;
var middleButton = false;
var at_x =0;
var at_y =0;
var at_z = 0;
var lookAround = false;
var ortho_left = -500;
var ortho_right = 500;
var ortho_top = 500;
var ortho_bottom = -500;
var solidProgram;
var texProgram;
var SolProgram = false;
var path = '../resources/sky.jpg';


function Object(name, matrix, indexes, Ka, Kd, Ks){
    this.name = name;
    this.matrix = matrix;
    this.indexes = indexes;
    this.Ka = Ka;
    this.Kd = Kd;
    this.Ks = Ks;
}
//Main function
function main() {

  setupIOSOR("fileinput");
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  var gl = initialize();


  // Initialize shaders
  solidProgram = createProgram(gl, SOLID_VSHADER_SOURCE, SOLID_FSHADER_SOURCE);
  texProgram = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  if (!solidProgram || !texProgram) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get storage locations of attribute and uniform variables in program object for single color drawing
  solidProgram.a_Position = gl.getAttribLocation(solidProgram, 'a_Position');
  solidProgram.u_MvpMatrix = gl.getUniformLocation(solidProgram, 'u_MvpMatrix');
  solidProgram.a_ColorMatrix = gl.getAttribLocation(solidProgram, 'a_Color');

  // Get storage locations of attribute and uniform variables in program object for texture drawing
  texProgram.a_Position = gl.getAttribLocation(texProgram, 'a_Position');
  texProgram.a_TexCoord = gl.getAttribLocation(texProgram, 'a_TexCoord');
  texProgram.u_MvpMatrix = gl.getUniformLocation(texProgram, 'u_MvpMatrix');
  texProgram.u_Sampler = gl.getUniformLocation(texProgram, 'u_Sampler');

  if (solidProgram.a_Position < 0 || !solidProgram.u_MvpMatrix || solidProgram.a_ColorMatrix<0 ||
      texProgram.a_Position < 0 || texProgram.a_TexCoord < 0 ||
      !texProgram.u_MvpMatrix || !texProgram.u_Sampler) { 
    console.log('Failed to get the storage location of attribute or uniform variable'); 
    return;
  }

  gl.useProgram(texProgram);   // Tell that this program object is used

  //initMvpMatrix(gl);
  mvpMatrix.setOrtho(-500,500,-500,500,-500,500);

  var u_MvpMatrix = gl.getUniformLocation(texProgram, 'u_MvpMatrix');
  if (!u_MvpMatrix) {
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }   
  // Pass the model view projection matrix to u_MvpMatrix
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements); 


  // Get the storage location of a_Position
  var a_Position = gl.getAttribLocation(texProgram, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }  

  gl.useProgram(solidProgram);   // Tell that this program object is used

  //initMvpMatrix(gl);
  mvpMatrix.setOrtho(-500,500,-500,500,-500,500);

  var u_MvpMatrix = gl.getUniformLocation(solidProgram, 'u_MvpMatrix');
  if (!u_MvpMatrix) {
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }   
  // Pass the model view projection matrix to u_MvpMatrix
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements); 


  // Get the storage location of a_Position
  var a_Position = gl.getAttribLocation(solidProgram, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }   

  // Register functions (event handler) to be called on a mouse press or a mouse movement
  canvas.oncontextmenu = function(ev){ rightClick(ev, gl); };
  canvas.onmousedown = function(ev){ click(ev, gl, canvas, a_Position); }; 
  canvas.onmousemove = function(ev){ move(ev, gl, canvas, a_Position); }; 
  canvas.onmousewheel = function(ev){scroll(ev)};
  canvas.onmouseup = function(ev){up(ev, canvas)};
  canvas.ondblclick = function(ev){doubleClick(ev, canvas)};


  // Specify the color for clearing <canvas>
  gl.clearColor(1.0, 1.0, 1.0, 1.0);  //Set the background
  gl.enable(gl.DEPTH_TEST); 

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Create point light
  n = createPointLight(gl);
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
  //Create line light
  gl.lineWidth(10);
  n = initVertexBuffers(gl,lineLight,3, 0);
  gl.drawArrays(gl.LINE_STRIP, 0,  n);   
}
// Function called when the right click event happens
function rightClick(ev, gl) {

    // avoid context menu
    ev.preventDefault();

    if(!active && lookAround) return false;
    if(!active) return false;

    var gl = initialize();

    initMvpMatrix(gl);

    // Avoid clicking in the left side of the canvas
    if ( g_points[g_points.length-2] < 0){
       return false;
    }
	  // You can't draw until you create a new SOR
    active = false;

    // Erase the position of the pointer
    g_points.pop();g_points.pop();

    // print the points coordinates 
    var points = "";
    for (i=0; i< g_points.length-1; i+=2){
      points += "Point "+(i/2+1)+" x: ";
      points += g_points[i]+" ";
      points += "Point "+(i/2+1)+" y: ";
      points += g_points[i+1]+"\n";
    }
    console.log(points);

   //Calculate the number of coordinates (adding z to every points)
    var numCoord = g_points.length/2*3

    // Matrix with all the points
    matrix = [37];                     
    for (i=0; i< 37; i++){                 
    	matrix[i] = new Array(numCoord);
    }

    var cont = 0;
    // Set the coordinates of the points (adding a z=0 for every point) in the first row of the matrix
    for (i = 0; i< numCoord; i++){
    	// Add coordinate z =0
    	if ((i+1)%3 == 0) {
    		matrix[0][i] = 0;
    	}
    	else {
    		matrix[0][i] = g_points[cont];
    		cont++;
    	}    	
    }

    // Create the rotation matrix
    var alpha = 10 * Math.PI / 180;
    var rotationMatrix = [
	    	[Math.cos(alpha) ,  0,  -Math.sin(alpha)],
	    	[		0,		          1,	 	    0	       ],
	    	[Math.sin(alpha),   0,   Math.cos(alpha)],
    	];

    // Calculate the rotation points and store them in the matrix
    var auxMatrix; 
    for (c = 0; c < 36 ; c++){              
    	for (k = 0; k < numCoord; k=k+3 ){
	    	auxMatrix = [matrix[c][k], matrix[c][k+1], matrix[c][k+2]];
	    	auxMatrix = multiplicarMatrix(rotationMatrix, auxMatrix);
	  	 	matrix[c+1][k] = auxMatrix[0];
	    	matrix[c+1][k+1] = auxMatrix[1];
	    	matrix[c+1][k+2] = auxMatrix[2];		
	    }
    }
    
    var sor = new Object("", matrix, [], Ka, Kd, Ks); 
    objects.push(sor);   

    drawElements();

    return false;
}
function click(ev, gl, canvas, a_Position) {  

  if(lookAround) return;
  mouseDown = true;
  lookAround = false;
  if(ev.button ==1) middleButton = true;
  else middleButton = false;
  // Check if the polyline is already finished 
  if ((!active && g_points.length >2) || read) {
    lightPicked = false;
    picking(gl, ev);
    return;
  }
  else if (!active && g_points.length <2) {
    alert("You have to create a new SOR to draw");
    return;
  }
  // get the x and y coordinates
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect() ;

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);    
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  // Check if the click is in the right side of the canvas
  if ( x<0) {
    alert("You must draw in the right side of the canvas");
    return;
  }
  //Transform the coordiantes so they go from -500 to 500
  x = x*500;
  y = y*500;

  // Store the coordinates to g_points array
  g_points.push(x); g_points.push(y);
  console.log("X position: "+x);
  // print the coordinates
  console.log("Y position: "+y);

  if (ev.button == 2){
      return;
  }
  /* call the funciton initVertexBuffers, this function will pass the position of the points to a buffer
	and will assigne this buffer to a_Position variable. The return value is the number of the points
  */
  if(SolProgram){
     drawElements();
  }
  else{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
  var n = initVertexBuffers(gl,g_points,2);
  // Draw the points and the lines
  gl.lineWidth(1);
  gl.drawArrays(gl.POINTS, 0, n);
  gl.drawArrays(gl.LINE_STRIP, 0,  n);
  
}
function move(ev, gl, canvas, a_Position) {  

  // get the x and y coordinates
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect() ;

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);    
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  //Transform the coordiantes so they go from -500 to 500
  x = x*500;
  y = y*500;

  if(!active && mouseDown && objects[objActive] != null && objects[objActive].Ka[0] != 0){
    transform(ev, canvas,0);
    startT[0] = x;
    startT[1] = y;
  }
  //Check if we can draw
  if (!active) return;

  // Remove the last two coordinates from the array (last position of the pointer)
  g_points.pop();
  g_points.pop();

  // Store the coordinates to g_points array
  g_points.push(x); g_points.push(y);

  // if there are no points (only the position of the pointer) don't draw anything
  if (g_points.length ==2) {return}

  /* call the funciton initVertexBuffers, this function will pass the position of the points to a buffer
  and will assigne this buffer to a_Position variable. The return value is the number of the points
  */
  if(SolProgram){
     drawElements();
  }
  else{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
 
  var n = initVertexBuffers(gl,g_points,2);
   // Draw the points and the lines
  gl.lineWidth(1);
  gl.drawArrays(gl.POINTS, 0, n-1);
  gl.drawArrays(gl.LINE_STRIP, 0,  n);
}
/*Function that's called when the reset button is pressed
this function reset the canvas so you can draw again
*/
function reset(){

  var gl = initialize();
  ortho = true;
  mvpMatrix.setOrtho(-500,500,-500,500,-500,500);
  document.getElementById("changeView").innerHTML ="Perspective"; 
  secondLight = true;
  LineLight = true;
  specularLight = false;
  flat = true;
  ambient = false;
  gl.lineWidth(1);
  initMvpMatrix(gl);
  view1 = 0;
  matrix = [];
  active = true;
  objects =[];
  read =false;
  objActive =0;
  // remove all the points from the g_points and num_points
  g_points = [];
  arrayNormal = []; //Array for the normal of the faces
  numV = [];        //Array with the number of vertex
  ArrayVertex=[];    //Array with the normal for each vertex
  // Clear the background
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


 // }

}
function resetBuffer(gl){
  var colors = new Float32Array();

  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    return -1;
  }

  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
    return -1;
}
function rename(){
  var name = prompt("Please enter the name of the SOR");
  document.getElementById('file').innerHTML= "File: "+name;
}
/* function that recieves a matrix(m) and a vector(v) and multiplies them */
function multiplicarMatrix(matrix, vector){

	var MatrixRes = [];
	var r;
	for (i = 0; i< matrix.length; i++){
		r = 0;
		for (j = 0; j < matrix[i].length; j++){
			r = vector[j]*matrix[j][i] + r;
		}
		MatrixRes[i] = r;
	}
	return MatrixRes;

}
/* function that recieves a 2D matrix and return a 1D vector with all the components of the matrix*/
function matrixToVector (matrix){

  var vector = [];
  for (r = 0; r < matrix.length; r++){
    for (c = 0; c < matrix[r].length; c++){
      vector.push(matrix[r][c]);
    }
  }
  return vector;
}
/* function that stores in a vector the four points that form every face. The difference with the previous function is that
in this case, each vertice is store more than once*/
function matrixToVector2(matrix){

  //    v1----- v0
  //   /       / 
  //  v2------v3

  var vector = [];
  for(i = 0; i< matrix.length-1; i++){
    for(j = 0; j< matrix[0].length-3; j+=3){
      vector.push(matrix[i][j]);vector.push(matrix[i][j+1]);vector.push(matrix[i][j+2]);          //v0 (x,y,z)
      vector.push(matrix[i+1][j]);vector.push(matrix[i+1][j+1]);vector.push(matrix[i+1][j+2]);    //v1 (x,y,z)
      vector.push(matrix[i+1][j+3]);vector.push(matrix[i+1][j+4]);vector.push(matrix[i+1][j+5]);  //v2 (x,y,z)
      vector.push(matrix[i][j+3]);vector.push(matrix[i][j+4]);vector.push(matrix[i][j+5]);        //v3 (x,y,z)
     }
  }   
  return vector;

}
/* function that creates the array of colors for the SOR */
function colorArray(){

  //    v2----- v0
  //   /       / 
  //  v3------v1

  var colorArray = [];
  var normal;
  var ambientLight = calculateAmbient();

  if(!flat){  // If we have smooth shading, we use the normal of each vertex to calculate the color
    var VectorVertices = matrixToVector2(objects[objActive].matrix);

    for(l=0; l< numV.length; l++){
      var normal = ArrayVertex[numV[l]];  //Take the normal of each vertex
      var color = [0,0,0];


      if(LineLight){ // directional light is on
        color = (calculateColor(normal));     // Calculate the color based on the normal vector
      }

      if(specularLight && LineLight){  //If  specular lighting is on, adding it to the final color
          colorS = calculateSpecularLighting(normal);
          for(z = 0; z< colorS.length; z++){
            color[z] = color[z] + colorS[z];
            if (color[z]> 1) color[z]=1;
          }

      }
      if (Ambient){   //If  ambient lighting is on, adding it to the final color
          for(z = 0; z< ambientLight.length; z++){
            color[z] = color[z] + ambientLight[z];
            if (color[z]> 1) color[z]=1;
          }
      }
      if (secondLight){   //If  the second light is on, adding it to the final color
          // retrieve the coordinates of the vertex to calculate the point light
          var vert = [VectorVertices[l*3],VectorVertices[l*3+1],VectorVertices[l*3+2]];
          colorSecond = calculatePointLighting(normal, vert);   
          for(z = 0; z< pointLight.length; z++){
            color[z] = color[z] + colorSecond[z];
            if (color[z]> 1) color[z]=1;
          }
      }
      colorArray.push(color[0]);colorArray.push(color[1]);colorArray.push(color[2]);  //Color for the vertex
    }

  }
  else {// If we have flat shading, we use the normal of each face to calculate the color
    for(r = 0; r< objects[objActive].matrix.length-1; r++){
      for(c = 0; c< objects[objActive].matrix[0].length-3; c+=3){

        v0 = [objects[objActive].matrix[r][c], objects[objActive].matrix[r][c+1], objects[objActive].matrix[r][c+2]];
        v1 = [objects[objActive].matrix[r][c+3], objects[objActive].matrix[r][c+4], objects[objActive].matrix[r][c+5]];
        v2 = [objects[objActive].matrix[r+1][c], objects[objActive].matrix[r+1][c+1], objects[objActive].matrix[r+1][c+2]];
        v3 = [objects[objActive].matrix[r+1][c+3], objects[objActive].matrix[r+1][c+4], objects[objActive].matrix[r+1][c+5]];


        normal = calculateNormal(v0,v1,v2); //Calculate the normal vector for three of the four vectors that form the face
        var color = [0,0,0];

        if(LineLight){
          color = calculateColor(normal);     // Calculate the color based on the normal vector
        }

        if(specularLight && LineLight){    //If  specular lighting is on, adding it to the final color
          colorS = calculateSpecularLighting(normal);
          for(z = 0; z< colorS.length; z++){
            color[z] = color[z] + colorS[z];
            if (color[z]> 1) color[z]=1;
          }

        }
        if (Ambient){   //If  ambient lighting is on, adding it to the final color
          for(z = 0; z< ambientLight.length; z++){
            color[z] = color[z] + ambientLight[z];
            if (color[z]> 1) color[z]=1;
          }
        }
        if (secondLight){   //If  the second light is on, adding it to the final color
          // Find the center of the face to calculate the direction of the point light
          var vertexCenter= [(v0[0]+v1[0]+v2[0]+v3[0])/4, (v0[1]+v1[1]+v2[1]+v3[1])/4, (v0[2]+v1[2]+v2[2]+v3[2])/4];
          colorSecond = calculatePointLighting(normal, vertexCenter);     
          for(z = 0; z< pointLight.length; z++){
            color[z] = color[z] + colorSecond[z];
            if (color[z]> 1) color[z]=1;
          }
      }
        //Set the same color for all the vertex in the surface
        colorArray.push(color[0]);colorArray.push(color[1]);colorArray.push(color[2]);  //Color for v0
        colorArray.push(color[0]);colorArray.push(color[1]);colorArray.push(color[2]);  //Color for v1
        colorArray.push(color[0]);colorArray.push(color[1]);colorArray.push(color[2]);  //Color for v2
        colorArray.push(color[0]);colorArray.push(color[1]);colorArray.push(color[2]);  //Color for v3

      }
    } 
  }
  return colorArray;
}
/* function that creates an array with the number of the vertices in order and with the repetition of the vertices that belong 
to more than one faces*/
function numVertices(){

  numV = [];
  var m = objects[objActive].matrix[0].length / 3 ;  //number of points per row

  numV.push(0);numV.push(1);numV.push(2);numV.push(3);
  var cont = 3;
  //numbers of  the vertices for the first row of faces
  for(i=0; i< m-2; i++){
    numV.push(cont);numV.push(cont-1);numV.push(cont+1);numV.push(cont+2);
    cont+=2;
  }
  // number of the vertices for the second row of faces
  numV.push(1);numV.push(2*m);numV.push(2*m+1);numV.push(2);
  cont = 2;

  for(i=0; i< m-2; i++){
    numV.push(cont);numV.push(2*m+i+1);numV.push(2*m+i+2);numV.push(cont+2);
    cont+=2;
  }
  // number of the vertices for the rest of the rows
  for (r=2; r< objects[objActive].matrix.length-1; r++){
    for (c=0; c< m-1; c++){
      if (r== objects[objActive].matrix.length-2){
        if (c==0){
          numV.push(r*m+c);numV.push(0);numV.push(3);numV.push(r*m+c+1);
        }
        else{
          numV.push(r*m+c);numV.push(3+2*(c-1));numV.push(3+(2*c));numV.push(r*m+c+1);
        }
        
      }else{
        numV.push(r*m+c);numV.push((r+1)*m+c);numV.push((r+1)*m+c+1);numV.push(r*m+c+1);

      }

    }
  }
}
/* function that creates an array with the normal of every vertex*/
function ArrayVertexNormals(index){

  var vert = objects[objActive].matrix.length * objects[objActive].matrix[0].length/3; // Number of vertices
  ArrayVertex = new Array(vert);
  for(k=0; k<vert; k++){
    ArrayVertex[k]=new Array(3)
    ArrayVertex[k][0]=0;
    ArrayVertex[k][1]=0;
    ArrayVertex[k][2]=0;
  }
  var aux,pos;
  /* Go over the array of the normals for the faces, and add every value to the indexes that form the face*/

  for( i=0; i< arrayNormal.length; i+=1){
    //Normalize the normals before adding to the vertex normals
    normalizeVector(arrayNormal[i]);
    for(j=0; j<3; j++){
      aux = index[3*i+j];
      pos = numV[aux];
      ArrayVertex[pos][0] = ArrayVertex[pos][0] + arrayNormal[i][0];
      ArrayVertex[pos][1] = ArrayVertex[pos][1] + arrayNormal[i][1];
      ArrayVertex[pos][2] = ArrayVertex[pos][2] + arrayNormal[i][2];
    }
  }
  normalizeVector(ArrayVertex);

}
/* function that create an array with the normal of every face*/
function ArrayNormals(){
  //    v1----- v0
  //   /       / 
  //  v2------v3
  arrayNormal = [];
  var normal;

    for(r = 0; r< objects[objActive].matrix.length-1; r++){
      for(c = 0; c< objects[objActive].matrix[0].length-3; c+=3){

        v0 = [objects[objActive].matrix[r][c], objects[objActive].matrix[r][c+1], objects[objActive].matrix[r][c+2]];
        v1 = [objects[objActive].matrix[r+1][c], objects[objActive].matrix[r+1][c+1], objects[objActive].matrix[r+1][c+2]];
        v2 = [objects[objActive].matrix[r+1][c+3], objects[objActive].matrix[r+1][c+4], objects[objActive].matrix[r+1][c+5]];
        v3 = [objects[objActive].matrix[r][c+3], objects[objActive].matrix[r][c+4], objects[objActive].matrix[r][c+5]];
        //Calculate the normal for the two triangles that form every face
        normal = calculateNormal(v0,v2,v1); 
        arrayNormal.push(normal);
        normal = calculateNormal(v0,v3,v2); 
        arrayNormal.push(normal);
      }
    }

}
function initVertexBuffers(gl, vector, nC, num) {

  gl.useProgram(solidProgram);   // Tell that this program object is used

  var colorBuffer = gl.createBuffer();
  if (!colorBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  var colors_1 = [];

  if (nC==3 && num == 0){   // we are drawing the directional light so we want the color to be read is the light is on, and grey otherways

    if (LineLight) colors_1 = [1.0, 0.0, 0.0, 1.0, 0.0, 0.0];  // we set the color red for the two points
    else colors_1 = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];  // we set the color grey for the two points

  }
  else if(nC==3 & num==1){   // we are drawing the normal vectors so I want to set the color to red

    colors_1 = [0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0];  // we set the color blue for the two points
  }
  else {
    colors_1 = new Array(vector.length/nC*3);
    for(pc=0; pc< colors_1.length; pc++){
      colors_1[pc] = 0;
    }

  }
  var colors = new Float32Array(colors_1.length);
  colors.set(colors_1,0);
  var colorLocation = gl.getAttribLocation(solidProgram, "a_Color");
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,colors, gl.STATIC_DRAW);
  gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLocation);    

  // Copy the values of g_points to the Float32Array
  var vertices = new Float32Array(vector.length);
  vertices.set(vector,0);

  var n = (vector.length)/nC; // The number of vertices is the total number of coordinates / number of coordinates per vertice
  
  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }


  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

  // Get the storage location of a_Position
  var a_Position = gl.getAttribLocation(solidProgram, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, nC, gl.FLOAT, false, 0, 0);
  
  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  // return the number of vertices
  return n;
}

/* Function that stores the indexes for the triangles*/
function calculateIndexes(vertices){

  //    r+1-----r
  //   /       / 
  //  r+2-----r+3

  var indexes = [];

  var v = vertices.length/3   //number of vertices

  for (r=0; r < v; r+=4){
  		indexes.push(r);indexes.push(r+1);indexes.push(r+2);		indexes.push(r);indexes.push(r+2);indexes.push(r+3); // r, r+1, r+2  // r,r+2,r+3
  }
  return indexes;
}
function calculateTextCoord(){

  //    v1----- v0
  //   /       / 
  //  v2------v3

  var numPoints = objects[objActive].matrix[0].length/3;
  var difX = 1/36;
  var difY = 1/(numPoints-1);
  var vector = [];
  for(i = 0; i< objects[objActive].matrix.length-1; i++){
    for(j = 0; j< numPoints-1; j++){
      vector.push(1-(i*difX));vector.push(1-(j*difY));          //v0
      vector.push(1-((i+1)*difX));vector.push(1-(j*difY));      //v1
      vector.push(1-((i+1)*difX));vector.push(1-((j+1)*difY));  //v2
      vector.push(1-(i*difX));vector.push(1-((j+1)*difY));      //v3        
     }
  }   
  return vector;

}
function initVertexBuffers2(gl, vector, ind) {


  if (SolProgram) gl.useProgram(solidProgram);   // Tell that this program object is used
  else { gl.useProgram(texProgram);}

  // Calculate the vertices, color and indexes
  var vertices_1 = vector;
  var indexes_1 = calculateIndexes(vertices_1);

  if (!flat){
    numVertices();
    ArrayNormals();
    ArrayVertexNormals(indexes_1);
  }
  if(!SolProgram && !active){
    var texture = calculateTextCoord();  
    var verticesTexCoords = new Float32Array(texture.length);
    verticesTexCoords.set(texture,0);

    // Enable the assignment of the buffer object
    if (!initArrayBuffer(gl, verticesTexCoords, 2, gl.FLOAT, 'a_TexCoord'))
      return -1;     
  }

  var colors_1 = colorArray();

  var vertices = new Float32Array(vertices_1.length);
  vertices.set(vertices_1,0);

  var colors = new Float32Array(colors_1.length);
  colors.set(colors_1,0);

  var indexes = new Uint16Array(indexes_1.length);
  indexes.set(indexes_1,0);
  inde = indexes_1;

  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    return -1;
  }

  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
    return -1;

  if(SolProgram){

    if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
    return -1;

  }

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexes, gl.STATIC_DRAW);

  // return the number of index
  return indexes.length;
}

function initArrayBuffer(gl, data, num, type, attribute) {

  if(SolProgram) {
    var program = solidProgram; 
  }  
  else {
    var program = texProgram;
  }

  var buffer = gl.createBuffer();   // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);

  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

/* Funtion that is called when the user press the "Create SOR" button */
function createSOR(){
  //Prompt for the filename
  var name = prompt("Please enter the name of the SOR");
  document.getElementById('file').innerHTML= "File: "+name;
  read = false;
  var gl = initialize();
  ortho = true;
  mvpMatrix.setOrtho(-500,500,-500,500,-500,500);
  document.getElementById("changeView").innerHTML="Perspective"; 
  gl.lineWidth(1);
  initMvpMatrix(gl);
  matrix = [];
  active = true;
  g_points = [];
  arrayNormal = []; //Array for the normal of the faces
  numV = [];        //Array with the number of vertex
  ArrayVertex=[];    //Array with the normal for each vertex
  startT = [0,0];

}
/* Funtion that is called when the user press the "READ" button */
function readSOR(){
  read = true;

  // Read the file
  var sorObject = readFile();

  // If the file is not null, draw the SOR
 if (sorObject!= null){
    //Calculate the points
    var numCo = sorObject.vertices.length/37;
    var cont = 0;
    matrix = [];
    for( i=0; i< 37; i++){
      matrix.push([]);
      for(j=0; j<numCo; j++){
        matrix[i][j]= sorObject.vertices[cont];
        cont++;
      }
    }
    var object = new Object(sorObject.name, matrix, sorObject.indexes, [0,0,0.2], Kd, Ks);
    objects.push(object);

    drawElements();

    // set the active value to false so no more points can be added to the file.
    active = false; 
    document.getElementById('file').innerHTML= "File: "+sorObject.objName;

 }

}
function drawElements(){

  var gl = initialize();
  
  initMvpMatrix(gl);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var aux = objActive;
  for(ob=0; ob< objects.length; ob++){
    objActive = ob;
    Ka = objects[ob].Ka;
    if (!lookAround || (lookAround && Ka[1] != 0.5) ){
      var v = matrixToVector2(objects[ob].matrix);
      var n = initVertexBuffers2(gl, v,objects[ob].indexes);
      if(!SolProgram){
        if (!initTextures(gl, n)) {
          console.log('Failed to intialize the texture.');
          return;
        }
      }
      gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0); 
    } 
  }
  objActive = aux;
  //Create point light
  n = createPointLight(gl);
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
  //Create line light
  gl.lineWidth(10);
  n = initVertexBuffers(gl,lineLight,3, 0);
  gl.drawArrays(gl.LINE_STRIP, 0,  n);       
}
/* Funtion that is called when the user press the "Show/Hide normal vectors" button */
function showNormals(){

  var gl = initialize();

  // Set the same view there was when the button was pressed
  initMvpMatrix(gl);
  // Check if we have to show or hide the vectors
  var toggle = document.getElementById("normal");
  var c = toggle.innerHTML.localeCompare("Show normal vectors");
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  if (c==0){    //Show the vectors

      toggle.innerHTML = "Hide normal vectors";  //Change the name of the button
      var v0,v1,v2, normal;
      /* Calculate the normal of every face using three points*/
      for(i = 0; i< matrix.length-1; i++){
        for(j = 0; j< matrix[0].length-3; j+=3){
  
          v0 = [matrix[i][j], matrix[i][j+1], matrix[i][j+2]];
          v1 = [matrix[i][j+3], matrix[i][j+4], matrix[i][j+5]];
          v2 = [matrix[i+1][j], matrix[i+1][j+1], matrix[i+1][j+2]];
          v3 = [matrix[i+1][j+3], matrix[i+1][j+4], matrix[i+1][j+4]];

          normal = calculateNormal(v0,v1,v2);

          // Draw the normal vector form the first point
          var ArrayNormals = [matrix[i][j],matrix[i][j+1],matrix[i][j+2],matrix[i][j]+normal[0]*100,matrix[i][j+1]+normal[1]*100,matrix[i][j+2]+normal[2]*100];
          var n = initVertexBuffers(gl,ArrayNormals,3,1);
          gl.lineWidth(1);
          gl.drawArrays(gl.LINE_STRIP, 0,  n);
          gl.lineWidth(10);
        }
      }
    } 

    else {  //Hide the normal vectors
      toggle.innerHTML = "Show normal vectors";  //Change the name of the button
    }

    drawElements();
}
function initMvpMatrix(gl){

  var programs = [texProgram, solidProgram];

  for(p=0; p< programs.length; p++){

      gl.useProgram(programs[p]);   // Tell that this program object is used

      // Get the storage location of u_MvpMatrix
      var u_MvpMatrix = gl.getUniformLocation(programs[p], 'u_MvpMatrix');
      if (!u_MvpMatrix) {
        console.log('Failed to get the storage location of u_MvpMatrix');
        return;
      }  
      // Projection
      if(ortho){
        mvpMatrix.setOrtho(ortho_left,ortho_right,ortho_bottom,ortho_top,-500,500);
      }
      else {  //Perspective
        mvpMatrix.setPerspective(fov, 1, 1, 15000);  
        mvpMatrix.lookAt(eyePoint_x, eyePoint_y, eyePoint_z, at_x, at_y, at_z, 0, 1, 0);
      }
      // Pass the model view projection matrix to u_MvpMatrix
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements); 

  }
}

function initialize(){

    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    var gl = WebGLUtils.setupWebGL(canvas,{preserveDrawingBuffer: true})
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
      // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) { // PART OF THE LIBRARY
      console.log('Failed to intialize shaders.');
      return;
    }
    return gl;

}
/* Function that is called when one of the buttons for changing the view is pressed*/
function perspective(num){

  /* When we change the perspective, the normal vectors are not drawn, so after changing the perspective
  the operation for the button for showing/hiding normal vectors will always be show */

  view1 = num;
  drawElements();

}
/* function that recives three points and calculate a normal vector to the plane formed by these three points*/
function calculateNormal(v0, v1, v2){

  var vector1_x, vector2_x, vector1_y, vector2_y,cvector1_z, vector2_z, crossProduct_i,crossProduct_j,crossProduct_k;

  // Calculate the coordinates for the vector1 = v1-v0 and vector2 = v2-v1
  vector1_x = v1[0] - v0[0];
  vector1_y = v1[1] - v0[1];
  vector1_z = v1[2] - v0[2];
  vector2_x = v2[0] - v0[0];
  vector2_y = v2[1] - v0[1];
  vector2_z = v2[2] - v0[2];

  //Coordinates for the cross product of the vectors
  crossProduct_i = (vector1_y * vector2_z) - (vector2_y * vector1_z);
  crossProduct_j = (vector1_x * vector2_z) - (vector2_x * vector1_z);
  crossProduct_k = (vector1_x * vector2_y) - (vector2_x * vector1_y);

  // Normalize of the vector
  var norm = Math.pow(crossProduct_i, 2) + Math.pow(crossProduct_j, 2) + Math.pow(crossProduct_k, 2);
  norm = Math.sqrt(norm);
  crossProduct_i = crossProduct_i/norm;
  crossProduct_j = -crossProduct_j/norm;
  crossProduct_k = crossProduct_k/norm;

  var ArrayNormals = [crossProduct_i,crossProduct_j,crossProduct_k];

  return ArrayNormals;

}
/* function that calculate the color based on the normal */
function calculateColor(normal){

  var n_normal = normalize(normal);
  var n_lightSource = normalize(light);

  var cosAlpha =  n_normal[0] * n_lightSource[0] + n_normal[1]* n_lightSource[1] + n_normal[2]*n_lightSource[2];

  var color = [];
  // If the color is negative we set a value of 0
  if(cosAlpha < 0){
    color.push(0);
    color.push(0);
    color.push(0);
  }
  else {
    for (i =0; i < light.length; i++){
      color.push(light[i]*Kd[i]*cosAlpha);
    }
  }

  return color

}
/* function that calculate the specular lighting based on the normal */
function calculateSpecularLighting(normal){

  var color=[];
  // Normalize the normal
  var normalizedNormal = normalize(normal);

  // Calculate the reflection:
  // Dot product between the normal and the light * 2
  var aux = (normalizedNormal[0] * light[0] + normalizedNormal[1]* light[1] + normalizedNormal[2]*light[2])*2;
  // Reflection = aux - light
  var reflection = [aux * normalizedNormal[0]- light[0], aux * normalizedNormal[1]- light[1] , aux * normalizedNormal[2]- light[2]];
  // Calculate cos alpha (alpha is the angle between the view and the reflection)
  var normReflection = Math.sqrt(Math.pow(reflection[0],2)+Math.pow(reflection[1],2)+ Math.pow(reflection[2],2));
  var cosAlpha = reflection[2]/ normReflection;
  //Raise this value to g
  var cosRaiseG = Math.pow(cosAlpha,g);
  //Calculate RGB values
  for (i =0; i < light.length; i++){
      color.push(light[i]*Ks[i]*cosRaiseG);
  }

  return color;
}
/* function called when the user changes the light through the graphical interface */
function ChangeLight(num){

  if(num==1){   //User wants to change between flat and smooth shading
    var value = document.getElementById("flat");
    var c = value.innerHTML.localeCompare("FLAT SHADING");
    
  }
  if(num==0){ //User wants to turn on/off specular lighting
    var value = document.getElementById("spect");
    var c = value.innerHTML.localeCompare("ON");
  }
  if (num==2){  //User wants to turn on/off ambient lighting
    var value = document.getElementById("amb");
    var c = value.innerHTML.localeCompare("ON");
  }
  
  if(c==0){

    //Change the value of the boolean variable affected and the name of the button
    if (num==1){
      flat = true;
      value.innerHTML = "SMOOTH SHADING";
    }
    if (num==0){
      specularLight = true;
      value.innerHTML = "OFF";
    }
    if (num==2){
      Ambient = true;
      value.innerHTML = "OFF";
    }
    drawElements();

  }
  else {

    //Change the value of the boolean variable affected and the name of the button
    if (num==1){
      flat = false;
      value.innerHTML = "FLAT SHADING";
    }
    if (num==0){
      specularLight = false;
      value.innerHTML = "ON";
    }
    if (num==2){
      Ambient = false;
      value.innerHTML = "ON";
    }
    drawElements();

  }

}
/* Function that changes the value of the glossiness when the button "Change" is pressed */
function ChangeG(){

  // Retrive the value for the glossiness
  var g_value = document.getElementById("g");
  g = g_value.value;

  drawElements();
  return false;

}
/* Function that updates the number shown after the slider to indicate the value seleccted */
function changeNumber(){
  var g_value = document.getElementById("g").value;
  document.getElementById("num").innerHTML = g_value;

}
/* Function that receives a vertor and normalize all its positions*/
function normalizeVector(vector){

  for (pos = 0; pos < vector.length; pos++){
    var norm = Math.sqrt(Math.pow(vector[pos][0],2)+Math.pow(vector[pos][1],2)+Math.pow(vector[pos][2],2));
    vector[pos][0] = vector[pos][0]/norm;
    vector[pos][1] = vector[pos][1]/norm;
    vector[pos][2] = vector[pos][2]/norm;
  }

}
/* function theat calculates the ambient light*/
function calculateAmbient(){

  var color=[];
  for (i =0; i < light.length; i++){
      color.push(light[i]*Ka[i]);
  }
  return color;

}
/* function that creates a cube to represent the point light*/
function createPointLight(gl){
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  gl.useProgram(solidProgram);   // Tell that this program object is used

  //Check if the light is on or off to set the color to red or gray
  if (secondLight) var color = [1,1,0];
  else var color = [0.6, 0.6, 0.6];

  var verticesColors = new Float32Array([
    // Vertex coordinates and color
     25.0,  500.0,  0.0,     color[0],  color[1],  color[2],  // v0 White
    -25.0,  500.0,  0.0,     color[0],  color[1],  color[2],  // v1 Magenta
    -25.0, 450.0,  0.0,     color[0],  color[1],  color[2],  // v2 Red
     25.0, 450.0,  0.0,     color[0],  color[1],  color[2],  // v3 Yellow
     25.0, 450.0, -50.0,     color[0],  color[1],  color[2],  // v4 Green
     25.0,  500.0, -50.0,     color[0],  color[1],  color[2],  // v5 Cyan
    -25.0,  500.0, -50.0,     color[0],  color[1],  color[2],  // v6 Blue
    -25.0, 450.0, -50.0,     color[0],  color[1],  color[2],   // v7 Black
  ]);

  // Indices of the vertices
  var indices = new Uint16Array([
    0, 1, 2,   0, 2, 3,    // front
    0, 3, 4,   0, 4, 5,    // right
    0, 5, 6,   0, 6, 1,    // up
    1, 6, 7,   1, 7, 2,    // left
    7, 4, 3,   7, 3, 2,    // down
    4, 7, 6,   4, 6, 5     // back
 ]);

  // Create a buffer object
  var vertexColorBuffer = gl.createBuffer();
  var indexBuffer = gl.createBuffer();
  if (!vertexColorBuffer || !indexBuffer) {
    return -1;
  }

  // Write the vertex coordinates and color to the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position and enable the assignment
  var a_Position = gl.getAttribLocation(solidProgram, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Color and enable the assignment
  var a_Color = gl.getAttribLocation(solidProgram, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);    

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}
/* function called when there is a click once the SOR is finished*/
function picking(gl, ev){

  var x = ev.clientX, y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
    // If pressed position is inside <canvas>, check if it is above object
    var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
    check(gl, x_in_canvas, y_in_canvas, ev);
  }
  
}
/* function to check if one of the light sources has been picked*/
function check(gl, x, y, ev) {

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var picked = false;
  //Draw only the light sources, not he SOR
  var n = createPointLight(gl);
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
  gl.lineWidth(10);
  n = initVertexBuffers(gl,lineLight,3, 0);
  gl.drawArrays(gl.LINE_STRIP, 0,  n);

  // Read pixel at the clicked position
  var pixels = new Uint8Array(4); // Array for storing the pixel value
  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  // Check it the point light has been picked (The color can be yellow or gray(153)) and change its value
  if (pixels[0] == 255 && pixels[1] == 255 && pixels[2] == 0 || pixels[0] == 153 && pixels[1] == 153 && pixels[2] == 153){
    secondLight = !secondLight; 
    picked = true;
    lightPicked = true;
  } 
  // Check it the directional light has been picked (The color can be red or gray(128)) and change its value
  if (pixels[0] == 255 && pixels[1] == 0 && pixels[2] == 0 || pixels[0] == 128 && pixels[1] == 128 && pixels[2] == 128){
    LineLight = !LineLight;
    picked = true;
    lightPicked = true;

  } 
  // Draw all SOR with a different color for each one and see if one has been picked
  if(!picked){

    var change = false;
    if(!SolProgram){
      change = true;
      gl.useProgram(solidProgram);   // Tell that this program object is used
      SolProgram = true;
    }
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw SOR's
    var lastS = -1; //variable that looks for the last objects selected
    for (On =0; On<objects.length; On++){
      if(objects[On].Ka[0]== 0.5){
        lastS = On;
      }
      objActive = On;
      var v = matrixToVector2(objects[objActive].matrix);
      var n = checkPickedObject(gl,v, On); //Draw every object with a different color
      gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);

    }
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    // checks what SOR has been picked based on the color
    var r = pixels[0];
    var g = pixels[1];
    var b = pixels[2];
    r = (r+0.5)/255*10;
    r = parseInt(r);
    g = (g+0.5)/255*10;
    g = parseInt(g);
    b = (b+0.5)/255*10;
    b = parseInt(b);
    var pos = r+g+b;


    if (pos ==30 && ev.button ==2 && lastS != -1){
      objActive = lastS;
      examine();
    }
    if(lastS != -1){
      objects[lastS].Ka = [0,0,0.2];
    }

    if(pos<30){  
      objects[pos].Ka = [0.5,0.5,0.5];
      objActive = pos;
    }

    startT = [x-500,y-500];

  }
  if(change){
    gl.useProgram(texProgram);   // Tell that this program object is used
    SolProgram = false;
  }
  drawElements(); 
}
/* function called when the user clicks on the Change view button*/
function toogleView(){

  var toggle = document.getElementById("changeView"); 
  var c = toggle.innerHTML.localeCompare("Perspective");
  if(c==0){
    toggle.innerHTML = "Orthographic";
  }
  else{
    toggle.innerHTML = "Perspective";
  }

  ortho = !ortho;
  var gl = initialize();

  gl.useProgram(solidProgram);   // Tell that this program object is used

  var u_MvpMatrix = gl.getUniformLocation(solidProgram, 'u_MvpMatrix');
  if (!u_MvpMatrix) {
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }  
  // Projection
  if(ortho){
    mvpMatrix.setOrtho(ortho_left,ortho_right,ortho_bottom,ortho_top,-500,500);
  }
  else {  //Perspective
    mvpMatrix.setPerspective(fov, 1, 1, 3000);  
    mvpMatrix.lookAt(eyePoint_x, eyePoint_y, eyePoint_z, at_x, at_y, at_z, 0, 1, 0);
  }

  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

  gl.useProgram(texProgram);   // Tell that this program object is used

  var u_MvpMatrix = gl.getUniformLocation(texProgram, 'u_MvpMatrix');
  if (!u_MvpMatrix) {
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }  
  // Projection
  if(ortho){
    mvpMatrix.setOrtho(ortho_left,ortho_right,ortho_bottom,ortho_top,-500,500);
  }
  else {  //Perspective
    mvpMatrix.setPerspective(fov, 1, 1, 3000);  
    mvpMatrix.lookAt(eyePoint_x, eyePoint_y, eyePoint_z, at_x, at_y, at_z, 0, 1, 0);
  }

  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  drawElements();

}
function normalize(vector){

  var magnitud = Math.sqrt(Math.pow(vector[0],2) + Math.pow(vector[1],2) + Math.pow(vector[2],2));
  var normalizeV = [vector[0]/magnitud, vector[1]/magnitud, vector[2]/magnitud];
  return normalizeV;

}
/* function that calculates the color of the vertices based on the point light*/
function calculatePointLighting(normal, vertexPosition){
  //Calculate the direction of the light (diferent for each point)
  var direction = [pointLightPosition[0]- vertexPosition[0], pointLightPosition[1]- vertexPosition[1], pointLightPosition[2]- vertexPosition[2]];

  var n_direction = normalize(direction);
  var n_normal = normalize(normal);

  var cosAlpha =  n_normal[0] * n_direction[0] + n_normal[1]* n_direction[1] + n_normal[2]*n_direction[2];

  var color = [];
  if(cosAlpha < 0){
    color.push(0);
    color.push(0);
    color.push(0);  
  } 
  else {
    for (i =0; i < pointLight.length; i++){
      color.push(pointLight[i]*Kd[i]*cosAlpha);
    }
  }
  return color
}
/* function called when the wheel of the mouse is moved*/
function scroll(ev){
  //Check if there is any SOR active
  if(objects[objActive] != null && objects[objActive].Ka[0] == 0.5){
    //Translate the SOR to the origin
    var center = calculateCenter();
    var M = createTranslationMatrix(-center[0],-center[1],-center[2]);
    // Scale the SOR
    if (ev.wheelDelta<0) {
      var sx = 1.1; 
      var sy =1.1;
      var sz = 1.1;
    }
    else {
      var sx = 0.9; 
      var sy =0.9;
      var sz = 0.9;
    }
    //Put the SOR back in its initial position
    var Ms = createScalingMatrix(sx,sy,sz);
    var M = multiplyMatrices(M, Ms);
    var Mt2 = createTranslationMatrix(center[0],center[1],center[2]);
    var M = multiplyMatrices(M, Mt2);
    //Apply transformation
    applyTransformation(objects[objActive].matrix, M);
  }else if (!ortho && !mouseDown){ //zoom
    if (ev.wheelDelta<0) {
      fov-=2;
      if (fov <0) fov = 0;
    }
    else {
      fov+=2;
    }
    drawElements();
  }else if(!ortho && middleButton){ //camera in or out with perspective
    if (ev.wheelDelta<0) {
      eyePoint_z-=20;
    }
    else {
      eyePoint_z+=20;
    }
    drawElements();
  } else if (ortho && middleButton){ //camera in or our with projection
    if (ev.wheelDelta<0) {
      ortho_top-=30;
      ortho_bottom +=30;
      ortho_left +=30;
      ortho_right -=30; 
    }
    else {
      ortho_top+=30;
      ortho_bottom -=30;
      ortho_left -=30;
      ortho_right +=30; 

    }
    drawElements();
  }
}
function createTranslationMatrix(x,y,z){
  var Mt = [[1,0,0,0],
            [0,1,0,0],
            [0,0,1,0],
            [x,y,z,1]];
  return Mt;
}
function createScalingMatrix(x,y,z){
  var Ms = [[x,0,0,0],
            [0,y,0,0],
            [0,0,z,0],
            [0,0,0,1]];
  return Ms;
}
function multiplyMatrices(m1,m2){

  var M= [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
  var aux;
  var m2_0 = [];
  var m2_1 = [];
  var m2_2= [];
  var m2_3 = [];
  for(k=0; k< m2.length; k++){
      m2_0.push(m2[k][0]);
      m2_1.push(m2[k][1]);
      m2_2.push(m2[k][2]);
      m2_3.push(m2[k][3]);
  }
  m2_t = [m2_0, m2_1, m2_2, m2_3];

  for(i=0; i< m1.length; i++){
    for(j=0; j<m1[i].length; j++){
        M[i][j]= multiplyVector(m1[i], m2_t[j]);
    }

  }
  return M;
}
function multiplyVector(v1,v2){
  var res = v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2] +v1[3]*v2[3];
  return res;
}
/* return the average of every point of the SOR*/
function calculateCenter(){

  var x_mean=0, y_mean=0, z_mean=0, numP=0;
  for(r = 0; r< objects[objActive].matrix.length-1; r++){
    for(c = 0; c< objects[objActive].matrix[0].length; c+=3){
      x_mean += objects[objActive].matrix[r][c];
      y_mean += objects[objActive].matrix[r][c+1];
      z_mean += objects[objActive].matrix[r][c+2];
      numP++;
    }
  }
  x_mean = x_mean/numP;
  y_mean = y_mean/numP;
  z_mean = z_mean / numP;
  var center = [x_mean, y_mean, z_mean];
  return center;
}
/* p' = pM*/
function multiplyPointByMatrix(point, matrix){
  var res =[];
  for(nP=0; nP< matrix[0].length; nP++){
    var aux=0;
    for(nR=0; nR < matrix.length; nR++){
       aux+= point[nR]*matrix[nR][nP];
    }
    res.push(aux);
  }
  return res;
}
/* takes all the points of the SOR and multiplies them by the transformation matrix*/
function applyTransformation(matrixPoints, matrixTransformation){

  var finalMatrix = [37];                     
  for (i=0; i< 37; i++){                 
    finalMatrix[i] = new Array(matrixPoints[0].length);
  }

  for(rM=0; rM< matrixPoints.length; rM++){
    for(h=0; h< matrixPoints[rM].length; h+=3){
      var auxPoint = [matrixPoints[rM][h], matrixPoints[rM][h+1],matrixPoints[rM][h+2],1];
      var finalP = multiplyPointByMatrix(auxPoint, matrixTransformation);
      finalMatrix[rM][h] = finalP[0];
      finalMatrix[rM][h+1] = finalP[1];
      finalMatrix[rM][h+2] = finalP[2];
    }
  }
  objects[objActive].matrix = finalMatrix;
  drawElements();
}
/* function called whith the mouse up*/
function up(ev, canvas){

  
  if(lookAround) return;
  mouseDown = false;
  middleButton = false;
  if( startT[0] == 0 && startT[1] == 0 && !active){
    drawElements(); 
    return;
  } 
  // object selected -> transformation of a SOR
  if(!active && objects[objActive] != null && objects[objActive].Ka[0] != 0){ 
    transform(ev, canvas,1);

  } //Object not selected -> camera movement
  else if(!active && !lightPicked){
    cameraMovement(ev,canvas);
  }
}
function cameraMovement(ev, canvas){

    // get the x and y coordinates
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect() ;

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);    
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    //Transform the coordiantes so they go from -500 to 500
    x = x*500;
    y = y*500;
    // calculate delta x and delta y
    var dx = x- startT[0]+1;
    var dy = y- startT[1]+5; 
    if(!ortho){
      eyePoint_x+= dx/2;
      eyePoint_y+= dy/2;
    }
    else {
      if(Math.abs(dx) > Math.abs(dy)){
        ortho_left += dx/2;
        ortho_right += dx/2;
      }else {
        ortho_bottom +=dy/2;
        ortho_top +=dy/2;
      }
    }
    drawElements();

}
/* function called when there is a transformation */
function transform(ev, canvas, num){
    // get the x and y coordinates
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect() ;

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);    
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    //Transform the coordiantes so they go from -500 to 500
    x = x*500;
    y = y*500;
    if(num ==1){
      var dx = x- startT[0]+1;
      var dy = y- startT[1]+5;
    } else{
      var dx = x- startT[0];
      var dy = y- startT[1]; 
    }

    if(ev.button ==0){    //left button -> translation in x & y
      var Mt = createTranslationMatrix(dx,dy,0);
    }
    if(ev.button == 1){ // middle button -> translation in z
      var Mt = createTranslationMatrix(0,0,dy);
    } 
    if(ev.button == 2){ // right button -> Rotation

      var center = calculateCenter();
      var Maux = createTranslationMatrix(-center[0],-center[1],-center[2]);
      if (Math.abs(dx) > Math.abs(dy)){ //Z axis
        var alpha = dx /3;
        var axis=0;
      }
      else {  // X axis
        var alpha = dy /3;
        var axis =1;
      }
      var Mt = createRotationMatrix(alpha,axis);
      Mt = multiplyMatrices(Maux,Mt);
      Maux = createTranslationMatrix(center[0],center[1],center[2]);
      Mt = multiplyMatrices(Mt,Maux);
      } 
    applyTransformation(objects[objActive].matrix, Mt);

}
function createRotationMatrix(alpha, axis){

  var rad = alpha * Math.PI / 180;
  var cos = Math.cos(rad);
  var sin = Math.sin(rad);
  if(axis == 0){ // Z axis

    var rm = [
        [cos,  sin, 0, 0],
        [-sin, cos, 0, 0],
        [0,     0,  1, 0],
        [0,     0,  0, 1]
      ];
  }
  else if(axis == 1){ // X axis

    var rm = [
        [1,    0,   0, 0],
        [0,  cos, sin, 0],
        [0, -sin, cos, 0],
        [0,    0,   0, 1]
      ];
  }else {
    var rm = [
        [cos, 0,-sin, 0],
        [0,   1,   0, 0],
        [sin, 0, cos, 0],
        [0,   0,   0, 1]
      ];
  }
  return rm;
}
function save(){
    var url = document.getElementById('file').innerHTML;
    var name = url.substring(6,url.length);
    var vert = matrixToVector(objects[objActive].matrix);
    var sorObject = new SOR(name, vert, inde);
    saveFile(sorObject);
}
/* function that draws ever object with a different color*/
function checkPickedObject(gl, vector, num){

  var indexes_1 = calculateIndexes(vector);

  /* every object is drawn with a different color. This color is based on the position of the SOR 
  in the array of objects*/
  var r = parseFloat((num)/10);
  var g = parseFloat((num-10)/10);
  var b = parseFloat((num-20)/10);


  var colors_1 = new Array(vector.length);
  for(c=0; c< colors_1.length; c++){
    if(c%3==0){
      colors_1[c] = r;
    }
    else if(c%3==1){
      colors_1[c] =g;
    }
    else{
      colors_1[c] =b;
    }
  }
  var vertices = new Float32Array(vector.length);
  vertices.set(vector,0);

  var colors = new Float32Array(colors_1.length);
  colors.set(colors_1,0);

  var indexes = new Uint16Array(indexes_1.length);
  indexes.set(indexes_1,0);
  inde = indexes_1; 

  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    return -1;
  }

  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
    return -1;

  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
    return -1;    

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexes, gl.STATIC_DRAW);

  // return the number of index
  return indexes.length;
}
/* function that remove the selected object*/
function remove(){
  if(objActive != -1 && objects[objActive].Ka[0] == 0.5){
      objects.splice(objActive,1);
  }
  objActive = -1;
  drawElements();
}
/* function called for changing the rotation in the y axis*/
function changeRotationY(num){

  if(!active && objects[objActive] != null && objects[objActive].Ka[0] != 0){

    var center = calculateCenter();
    var Maux = createTranslationMatrix(-center[0],-center[1],-center[2]);
    if(num == 0) var alpha = -10;
    else var alpha = 10;
    var axis =2;
    var Mt = createRotationMatrix(alpha,axis);
    Mt = multiplyMatrices(Maux,Mt);
    Maux = createTranslationMatrix(center[0],center[1],center[2]);
    Mt = multiplyMatrices(Mt,Maux);
    applyTransformation(objects[objActive].matrix, Mt);
  }

}
/* function that create a new extact SOR as the one that is selected*/
function duplicate(){
  if(objActive != -1 && objects[objActive].Ka[0] == 0.5){
    var sor = new Object("", objects[objActive].matrix, objects[objActive].index, objects[objActive].Ka, objects[objActive].Kd, objects[objActive].Ks) 
    sor.Ka = [0,0,0.2];
    objects.push(sor);
  }
  drawElements();
}
function doubleClick(ev, canvas){
  
  if(ortho) return;
  if(objActive != -1 && objects[objActive].Ka[0] == 0.5){
      lookAround = true;
      var old_ey_x = eyePoint_x;
      var old_ey_y = eyePoint_y;
      var old_ey_z = eyePoint_z;
      var old_look_at_x = at_x;
      var old_look_at_y = at_y;
      var old_look_at_z = at_z;
      var old_fov = fov;

      var center2 = calculateCenter();
    
      var a  = [-center2[0], -center2[1], -center2[2]];
      moveElements(a);

      center = calculateCenter();
      console.log(center);

      eyePoint_x = center[0];
      eyePoint_y = center[1];
      eyePoint_z = center[2];

      at_y = center[1];

      at_x = center[0] + 10;
      
      var cont = 0;
      fov = 100;

      var tick = function() {


        if(cont<400){
          var dx = -0.05  
        }
        else {
          var dx = 0.05; 
        } 
        at_x += dx; 
        if (cont == 1){
          var z0 = calculateZ(at_x, 10, center[0], center[2]);
        }
        at_z = calculateZ(at_x, 10, center[0], center[2]);
        if (cont>=400) at_z = -at_z;
        if (cont==399) {
          at_z = -z0;
        }  

        drawElements();
        cont++;
        if(cont < 800){
          requestAnimationFrame(tick, canvas); // Request that the browser calls tick
        } else{
            setTimeout(function(){
              eyePoint_x = old_ey_x;
              eyePoint_y = old_ey_y;
              eyePoint_z = old_ey_z;
              at_x = old_look_at_x;
              at_y = old_look_at_y;
              at_z = old_look_at_z;
              fov = old_fov;
              lookAround = false; 
              a = [-a[0], -a[1], -a[2]];
              moveElements(a);
              drawElements(); 
        }, 1000);  
        } 
      };
 
      tick();
  }
}
function calculateZ(x, radio, center_x, center_z){
  var aux = x- center_x;
  aux = Math.pow(aux,2);
  aux = Math.pow(radio,2) - aux;
  aux = Math.sqrt(aux);
  z = aux + center_z;
  return z;
}
function moveElements(centerM){

  var aux2 = objActive;
  var Maux = createTranslationMatrix(centerM[0],centerM[1],centerM[2]);
  for(obj=0; obj< objects.length; obj++){
    objActive = obj;
    applyTransformation(objects[objActive].matrix, Maux);
  }
  objActive = aux2;
}
function examine(){
  
  if(ortho) return;
  lookAround = true;
  var old_ey_x = eyePoint_x;
  var old_ey_y = eyePoint_y;
  var old_ey_z = eyePoint_z;
  var old_look_at_x = at_x;
  var old_look_at_y = at_y;
  var old_look_at_z = at_z;
  var old_fov = fov;

  var center2 = calculateCenter();
    
  var a  = [-center2[0], -center2[1], -center2[2]];
  moveElements(a);
  var cen = calculateCenter();

  at_x = cen[0];
  at_y = cen[1];
  at_z = cen[2];

  eyePoint_y = cen[1];

  eyePoint_x = cen[0] + 300;
  var cont = 0;
  fov = 100;
  var z0 = calculateZ(eyePoint_x, 300, cen[0], cen[2]);
  objects[objActive].Ka = [0,0,0.2];
  var tick = function() {
        if(cont<400){
          var dx = -1.5  
        }
        else {
          var dx = 1.5; 
        } 
        eyePoint_x += dx; 
        eyePoint_z = calculateZ(eyePoint_x, 300, cen[0], cen[2]);
        if (cont>=400) eyePoint_z = -eyePoint_z;
        if (cont==399) eyePoint_z = -z0; 
        if (cont==799) eyePoint_z = z0; 
        drawElements();
        cont++;
        if(cont < 800){
          requestAnimationFrame(tick); // Request that the browser calls tick
        }  else{
            setTimeout(function(){
              eyePoint_x = old_ey_x;
              eyePoint_y = old_ey_y;
              eyePoint_z = old_ey_z;
              at_x = old_look_at_x;
              at_y = old_look_at_y;
              at_z = old_look_at_z;
              fov = old_fov;
              lookAround = false; 
              a = [-a[0], -a[1], -a[2]];
              moveElements(a);
              drawElements(); 
        }, 1000);  
        } 
      };
  tick();  
}

function initTextures(gl, n) {

  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  // Get the storage location of u_Sampler
  var u_Sampler = gl.getUniformLocation(texProgram, 'u_Sampler');
  if (!u_Sampler) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }
  var image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading an image
  image.onload = function(){ loadTexture(gl, n, texture, u_Sampler, image); };
  // Tell the browser to load an image
  image.src = path;
  return true;
}
function loadTexture(gl, n, texture, u_Sampler, image) {

  gl.useProgram(texProgram);   // Tell that this program object is used
 
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler, 0);

}
function toogleTexture(){

  var toggle = document.getElementById("texture"); 
  var c = toggle.innerHTML.localeCompare("OFF");
  if(c==0){
    toggle.innerHTML = "ON";
  }
  else{
    toggle.innerHTML = "OFF";
  }
  SolProgram = !SolProgram;
  drawElements();
}
function changeTexture(num){

  if (num ==1) path = '../resources/sky.jpg';
  if (num ==2) path = '../resources/yellowflower.jpg';
  if (num ==3) path = '../resources/pinkflower.jpg';
  if (num ==4) path = '../resources/particle.png';
  if (num ==5) path = '../resources/metal3.jpg';
  
  drawElements(); 
}
function resetPers(){

  if(ortho) return;
  fov = 40;
  eyePoint_x = 400;
  eyePoint_y = 1000;
  eyePoint_z = 1500;
  lightPicked = false;
  middleButton = false;
  at_x =0;
  at_y =0;
  at_z = 0;
  drawElements();

}
