/**
*@表头合并工具1
*@假设数据源格式为数组，每一个元素为：
*	最后一行的列id，父表头id数组
*@合并要求(案例)：
*	_____________________________________________
*	|					|		|				|		
*	|_______A___________|	B	|________C______|
*	|A1		|	 		|		|		|	C2	|
*	|_______|	A2		|		|	C1	|_______|
*	|a11|a12|			|		|		|c21|c22|
*	|___|___|___________|_______|_______|___|___|
*这里元列数据数组为(元数据只保留最底下一行的列信息)：
*	a11		merge:A1,A
*	a12		merge:A1,A
*	A2		merge:A
*	B		merge
*	C1		merge:C
*	c21		merge:C2,C
*	c22		merge:C2,C
*要求解析成如下树形格式，以便Ext可以创建多表头:
*	A,children 
*		A1,children
*			a11
*			a12
*		A2
*	B
*	C,children
*		C1
*		C2,children
*			c21,c22
*/
function mergeTableHeadColumn(columns){
	var root={'id':'root'};
	for(var i=0;i<columns.length;i++){
		addColumn(columns[i],root);
	}
	return root;
}

/**
 * @arg ci
 * 			{id:xxx,merge:[parent1,parent2...]}
 * @arg cp
 * 			当前负节点
 * @arg	cpIndex
 * 			当前父节点下标，如果不传，表示父节点我为root
 */
function addColumn(ci,cp,cpIndex){
	var ciMerge=ci['merge'];
	//父节点添加完毕，添加列信息，并结束
	if(typeof(ci.merge)=='undefined'||cpIndex==0){
		if(getArrayLength(cp,'children')>0){
			cp.children.push({'id':ci.id});
		} else {
			cp.children=[{'id':ci.id}];
		}
		return;
	}
	//当前父节点为root
	if(typeof(cpIndex)=='undefined'){
		//父节点有子节点
		if(getArrayLength(cp,'children')>0){
			var lastChild=cp.children[cp.children.length-1];
			//合并
			if(lastChild.id==ciMerge[ciMerge.length-1]){
				arguments.callee(ci,lastChild,ciMerge.length-1);
			} else {
			//添加
				var cpLoop={'id':ciMerge[ciMerge.length-1]};
				cp.children.push(cpLoop);
				arguments.callee(ci,cpLoop,ciMerge.length-1);
			}
		}else {
		//父节点没有子节点
			var cpLoop={'id':ciMerge[ciMerge.length-1]};
			cp.children=[cpLoop];
			arguments.callee(ci,cpLoop,ciMerge.length-1);
			return;
		}
	} else {
	//当前父节点不是root
		//父节点有子节点
		if(getArrayLength(cp,'children')>0){
			var lastChild=cp.children[cp.children.length-1];
			//合并
			if(lastChild.id==ciMerge[cpIndex-1]){
				arguments.callee(ci,lastChild,cpIndex-1);
			} else {
			//添加
				var cpLoop={'id':ciMerge[cpIndex-1]};
				cp.children.push(cpLoop);
				arguments.callee(ci,cpLoop,cpIndex-1);
			}
		} else {
		//父节点没有子节点
			var cpLoop={'id':ciMerge[cpIndex-1]};
			cp.children=[cpLoop];
			arguments.callee(ci,cpLoop,cpIndex-1);
		}
	}
}

function getArrayLength(scope,propertyName){
	return (typeof(scope[propertyName])=='undefined'|| scope[propertyName]==null)?0:scope[propertyName].length;
}

function test(){
	var columns=[
		{id:'a11',merge:['A1','A']},
		{id:'a12',merge:['A1','A']},
		{id:'A2',merge:['A']},
		{id:'B'},
		{id:'C1',merge:['C']},
		{id:'c21',merge:['C2','C']},
		{id:'c22',merge:['C2','C']}
	];
	var root=mergeTableHeadColumn(columns);
	debugger;
}


test();

/****************万能的分割线*************************/

function mergeTableHeadColumn2(columns){
	var root={'id':'root'};
	for(var i=0;i<columns.length;i++){
		addColumn2(columns[i],root);
	}
	return root;
}

/**
 * 通过定义精准的控制变量和对象，来去除重复代码
 * 相当于实例化需要的对象，变量相当于指向对象的指针
 * @param columnInfo
 * @param currentParent
 * @param curentParentIndex
 * @returns
 */
function addColumn2(columnInfo,currentParent,currentParentIndex){
	//config
	var idProperty='id';
	var childrenProperty='children';
	var mergeProperty='merge';
	var copyPropertyArray=[];
	//controller variable
	var isFinished=false;
	var currentParentHasChild=true;
	var needAddChild=false;
	var needCreateChild=false;
	var needLoop=true;
	var isCurrentParentRoot=typeof(currentParentIndex)=='undefined';
	//normal variable define
	var mergeParentId=null;
	//start
	if(getArrayLength(columnInfo,mergeProperty)==0||(!isCurrentParentRoot&&currentParentIndex==0)){//是否完成父节点的添加
		isFinished=true;
		needLoop=false;
	}
	if(getArrayLength(currentParent,childrenProperty)==0){//父节点是否有子节点
		currentParentHasChild=false;
	}
	//---当完成时
	if(isFinished){//如果完成
		var addOrPushNodeObj={};
		addOrPushNodeObj[idProperty]=columnInfo[idProperty];
		for(var i=0;i<copyPropertyArray.length;i++){
			var name=copyPropertyArray[i];
			addOrPushNodeObj[name]=columnInfo[name];
		}
		addChild=addOrPushNodeObj;
		createChild=addOrPushNodeObj;
		needAddChild=currentParentHasChild;
		needCreateChild=!currentParentHasChild;
	} else {//如果没有完成
		var mergeArray=columnInfo[mergeProperty];
		if(isCurrentParentRoot){
			currentParentIndexLoop=mergeArray.length-1;
			mergeParentId=mergeArray[mergeArray.length-1];
		} else {
			currentParentIndexLoop=currentParentIndex-1;
			mergeParentId=mergeArray[currentParentIndex-1];
		}
	}
	//有子节点：判断是合并还是添加
	if(!isFinished&&currentParentHasChild){
		needCreateChild=false;
		var currentParentChildren=currentParent[childrenProperty];
		var lastChild=currentParentChildren[currentParentChildren.length-1];
		if(lastChild[idProperty]==mergeParentId){//合并
			needAddChild=false;
			currentParentLoop=lastChild;
		} else {
			needAddChild=true;
			currentParentLoop={};
			currentParentLoop[idProperty]=mergeParentId;
			addChild=currentParentLoop;
		}
	}
	//没有子节点
	if(!isFinished&&!currentParentHasChild){
		needAddChild=false;
		needCreateChild=true;
		currentParentLoop={};
		currentParentLoop[idProperty]=mergeParentId;
		createChild=currentParentLoop;
	}
	if(needAddChild)currentParent[childrenProperty].push(addChild);
	if(needCreateChild)currentParent[childrenProperty]=[createChild];
	if(needLoop)arguments.callee(columnInfo,currentParentLoop,currentParentIndexLoop);
}


function test2(){
	var columns=[
		{id:'a11',merge:['A1','A']},
		{id:'a12',merge:['A1','A']},
		{id:'A2',merge:['A']},
		{id:'B'},
		{id:'C1',merge:['C']},
		{id:'c21',merge:['C2','C']},
		{id:'c22',merge:['C2','C']}
	];
	var root=mergeTableHeadColumn2(columns);
	debugger;
}


test2();
