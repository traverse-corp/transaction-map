import { Handle, Position, useReactFlow } from 'reactflow';
import { CopyToClipboard } from 'react-copy-to-clipboard/src';

function ExchangeNode({ data }) {
    const reactFlowInstance = useReactFlow();
    const onClickMore = () => {
        let newData = data;
        newData.isClicked = true;
        newData.isDetailClicked = false;
        reactFlowInstance.setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === data.id) {
                    return {
                        ...node,
                        data: newData,
                    };
                }
                return node;
            })
        );
    };
    const onClickDelete = () => {
        let newData = data;
        newData.isDeleteClicked = true;
        newData.isClicked = false;
        reactFlowInstance.setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === data.id) {
                    return {
                        ...node,
                        data: newData,
                    };
                }
                return node;
            })
        );
    };


    const onClickCopy = () => {
        let newData = data;
        newData.isDetailClicked = false;
        newData.isClicked = false;
        reactFlowInstance.setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === data.id) {
                    return {
                        ...node,
                        data: newData,
                    };
                }
                return node;
            })
        );
        alert('클립보드에 복사되었습니다.')
    }


    return (
        <div className='exchange-node'>
            <Handle type='source' position={Position.Right} />
            <div
                className='cancel'
                onClick={() => {
                    onClickDelete();
                }}
            >
                X
            </div>
            <div className='text-field' id='text-field'>
                <div className='symbol'></div>
                <CopyToClipboard text={data.addr} onCopy={() => {
                    onClickCopy()
                }}>
                    <div className='address'>{data.addr}</div>
                </CopyToClipboard>
                <CopyToClipboard text={data.addr} onCopy={() => {
                    onClickCopy()
                }}>
                    <div className='copy'></div>
                </CopyToClipboard>
            </div>
            <div className='hidden-tx'>...</div>
            {/*<div className="description-button">hi</div>*/}
            <div className='show-more-tx' onClick={() => onClickMore()}>
                More
            </div>
            <Handle type='target' position={Position.Left} />
        </div>
    );
}

export default ExchangeNode;
