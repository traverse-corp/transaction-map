import { Handle, Position, useReactFlow } from 'reactflow';

function TranscationNode({ data }) {
    const reactFlowInstance = useReactFlow();
    const onClickDelete = () =>{
        let newData = data
        newData.isDeleteClicked = true
        reactFlowInstance.setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === data.id) {
                    return {
                        ...node,
                        data: newData
                    }
                }
                return node;
            })
        );
    }

    const onClickDetail =()=>{
        let newData = data
        newData.isDetailClicked = true
        reactFlowInstance.setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === data.id) {
                    return {
                        ...node,
                        data: newData
                    }
                }
                return node;
            })
        );
    }

    return (
        <div className="transaction-node">
            <Handle type="source" position={Position.Right} />

            <div className="cancel-area" onClick={() => {
                onClickDelete()
            }}>
            </div>
            <div className="cancel" onClick={()=> {onClickDelete()}}></div>
            <div className="tx-text" onClick={()=>onClickDetail()}>

                TX
                {/*<div className="symbol"></div>*/}
            </div>
            <Handle type="target" position={Position.Left} />
        </div>
    );
}

export default TranscationNode;
