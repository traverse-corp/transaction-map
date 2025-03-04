import {Handle, Position, useReactFlow} from 'reactflow';
import {CopyToClipboard} from 'react-copy-to-clipboard/src';

function MainNode({data}) {
    const reactFlowInstance = useReactFlow();
    const onClickMore = () => {
        let newData = data;
        newData.isClicked = true;
        newData.isDetailClicked = false;
        newData.clickNum = newData.clickNum + 1 || 1;

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

    const onClickDetail = () => {
        let newData = data;
        newData.isDetailClicked = true;
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
        <div className='main-node'>
            <Handle type='source' position={Position.Right}/>
            <div className='text-field' id='text-field'>
                <img className='symbol'
                     src={process.env.PUBLIC_URL + `/images/${data.mainNet ? data.mainNet.toLowerCase() + '.png' : ''}`}
                     alt=''></img>
                <div className='address'>{data.address}</div>
                <CopyToClipboard text={data.address} onCopy={() => {
                    onClickCopy()
                }}>
                    <div className='copy'></div>
                </CopyToClipboard>
            </div>
            <div className='hover-area'>
                <div className='omit' onClick={() => onClickDetail()}></div>
                <div className='info'></div>
                <div className='extend' onClick={() => onClickMore()}></div>
            </div>
            <div className='hidden-tx' onClick={() => onClickDetail()}></div>
            {/*<div className="description-button">hi</div>*/}
            <div className='show-more-tx' onClick={() => onClickMore()}></div>
            <Handle type='target' position={Position.Left}/>
        </div>
    );
}

export default MainNode;
