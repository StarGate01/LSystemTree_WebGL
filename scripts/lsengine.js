window.LSEngine = 
{
	
	generate: function(options)
	{
		console.log("Generating instructions...");
		var treeMeshes = [];
		for(var i=0; i<options.rules.length; i++)
		{
			var pcum = 0;
			for(var j=0; j<options.rules[i].to.length; j++)
			{
				options.rules[i].to[j].prange = [pcum, pcum + options.rules[i].to[j].probability];
				pcum += options.rules[i].to[j].probability;
			}
		}
		var commandsTokes = this._tokenize(options.symbol, options.functionDefinitions);
		for(var i=0; i<options.iterations; i++)
		{
			for(var j=0; j<commandsTokes.length; j++)
			{
				commandsTokes[j].age++;
			}
			for(var j=0; j<options.rules.length; j++)
			{
				for(var k=0; k<commandsTokes.length; k++)
				{
					if(commandsTokes[k].s == options.rules[j].from)
					{
						var rnd = Math.random();
						for(var l=0; l<options.rules[j].to.length; l++)
						{
							if(rnd >= options.rules[j].to[l].prange[0] && rnd <= options.rules[j].to[l].prange[1] && options.rules[j].cond({iterations: i, options: options}))
							{
								commandsTokes[k] = this._tokenize(options.rules[j].to[l].newsymbols, options.functionDefinitions);
								break;
							}
						}
					}
				}
				var newCommandsTokes = [];
				for(var k=0; k<commandsTokes.length; k++) newCommandsTokes = newCommandsTokes.concat(commandsTokes[k]);
				commandsTokes = newCommandsTokes;
			}
		}
		console.log("done");
		console.log("Generating geometry...");
		var state = {
			position: options.startPosition,
			rotation: options.startRotation,
			stack: []
		};
		for(var i=0; i<commandsTokes.length; i++)
		{
			var current = commandsTokes[i];
			var params = options.defaults[current.s];
			if(current.f != null) params = current.f({age: current.age, options: options, defaults: options.defaults[current.s]});
			if(current.s in options.renderDefinitions)
			{
				var currentdef = options.renderDefinitions[current.s];
				if(currentdef.type == 0)
				{
					var geometry = new THREE.CylinderGeometry(params.r1, params.r2, params.length, currentdef.quality, 1);
					var mesh = new THREE.Mesh(geometry, currentdef.material);
					geometry.applyMatrix(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.PI, 0, "XYZ")));
					var targetVector = new THREE.Vector3(params.length / 2, 0, 0).applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(state.rotation));
					mesh.position.addVectors(state.position, targetVector);
					mesh.lookAt(state.position);
					treeMeshes.push([current.s, mesh]);
					var endcapGeometry = new THREE.SphereGeometry(params.r1, currentdef.quality, currentdef.quality);
					var endcapMesh = new THREE.Mesh(endcapGeometry, currentdef.material);
					endcapMesh.position.x = state.position.x; endcapMesh.position.y = state.position.y; endcapMesh.position.z = state.position.z;
					endcapMesh.lookAt(targetVector);
					treeMeshes.push([current.s, endcapMesh]);
					state.position.add(targetVector.multiplyScalar(2));
				} 
				if(currentdef.type == 1)
				{
					var geometry = new THREE.SphereGeometry(params.r, currentdef.quality, currentdef.quality);
					var mesh = new THREE.Mesh(geometry, currentdef.material);
					mesh.position.x = state.position.x; mesh.position.y = state.position.y;	mesh.position.z = state.position.z;
					treeMeshes.push([current.s, mesh]);
				}
			}
			else
			{
				switch(current.s)
				{
					case "~":
					case "*":
						state.rotation.x += params.a;
						break;
					case "#":
					case "$":
						state.rotation.y += params.a;
						break;
					case "+":
					case "-":
						state.rotation.z += params.a;
						break;
					case "[":
						state.stack.push({
							position: state.position.clone(),
							rotation: state.rotation.clone()
						});
						break;
					case "]":
						var newstate = state.stack.pop();
						state.position = newstate.position;
						state.rotation = newstate.rotation;
						break;
				}
			}
		}
		console.log("done");
		console.log("Optimizing geometry...");
		treeMeshes.sort(function sortFunction(a, b) { return (a[0] === b[0])? 0:((a[0] < b[0])? -1:1); });
		var joinedGeometry = new THREE.Geometry();
		var materials = [];
		var matIndex = -1;
		var oldType = "";
		for(var i=0; i<treeMeshes.length; i++)
		{
			treeMeshes[i][1].updateMatrix();
			if(treeMeshes[i][0] != oldType)
			{
				oldType = treeMeshes[i][0];
				materials.push(treeMeshes[i][1].material);
				matIndex++;
			}
			for(var j=0; j<treeMeshes[i][1].geometry.faces.length; j++) treeMeshes[i][1].geometry.faces[j].materialIndex = matIndex;
			joinedGeometry.merge(treeMeshes[i][1].geometry, treeMeshes[i][1].matrix);
		}
		console.log("done");
		console.log("Creating mesh...");
		var mesh = new THREE.Mesh(joinedGeometry, new THREE.MeshFaceMaterial(materials));
		mesh.castShadow = true;
		console.log("done");
		return mesh;
	},
	
	_tokenize: function(input, functions)
	{
		var returnArray = [];
		for(var i=0; i<input.length; i++)
		{
			var symbol = input.charAt(i);
			var func = null;
			var skipLength = 0;
			if((i + 2) < input.length && input.charAt(i + 1) == "(")
			{
				var closePos = input.indexOf(")", i + 1);
				func = functions[input.substring(i + 2, closePos)];
				skipLength = closePos - i;
			}
			returnArray.push({s: symbol, f: func, age: 0});
			i += skipLength;
		}
		return returnArray;
	}
	
};