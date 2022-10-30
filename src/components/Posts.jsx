import React from 'react';
import { Link } from 'react-router-dom';
import { isVouched } from 'vouchdao'
import { maxMessageLength, abbreviateAddress, getPostTime, contract, connectedWalletAddress, addressToName, addressToPicture } from '../lib/api';

export const Posts = (props) => {
  return (
    <div>
      {props.postInfos.map(postInfo =>
        <PostItem key={postInfo.txid} postInfo={postInfo} isLoggedIn={props.isLoggedIn} onVote={props.onVote} />
      )}
    </div>
  )
};

const shortenAddress = (address) => {
  return address.substring(0, 5) + '...' + address.substring(address.length - 5);
};

const PostItem = (props) => {
  const [postMessage, setPostMessage] = React.useState("");
  const [statusMessage, setStatusMessage] = React.useState("");
  const [ownerName, setOwnerName] = React.useState(addressToName[props.postInfo.owner] || shortenAddress(props.postInfo.owner));
  const [ownerHandle, setOwnerHandle] = React.useState("");
  const [iconSrc, setIconSrc] = React.useState(addressToPicture[props.postInfo.owner] ? `https://arweave.net/${addressToPicture[props.postInfo.owner]}` : 'img_avatar.png');
  const [imageSrc, setImageSrc] = React.useState(props.postInfo.image ? `https://arweave.net/${props.postInfo.image}` : '');
  const [isVouched, setIsVouched] = React.useState(false);

  async function onUpVote(id) {
    const input = {
      function: 'upVoteMessage',
      messageId: id
    };

    try {
      // `interactWrite` will return the transaction ID.
      await contract.connect('use_wallet').writeInteraction(input);
      // setTopicValue("");
      if (props.onVote) {
        props.onVote(id);
      }
    } catch (error) {
      console.log('error', error);
    }
  }

  async function onDownVote(id) {
    const input = {
      function: 'downVoteMessage',
      messageId: id
    };
    try {
      // `interactWrite` will return the transaction ID.
      await contract.connect('use_wallet').writeInteraction(input);
      // setTopicValue("");
      if (props.onVote) {
        props.onVote(id);
      }
    } catch (error) {
      console.log('error', error);
    }
  }

  React.useEffect(() => {
    let newPostMessage = "";
    let newStatus = "";

    async function loadIsVouched() {
      setIsVouched(await isVouched(props.postInfo.owner));
    }
    loadIsVouched();
    
    if (!props.postInfo.message) {
      setStatusMessage("loading...");
      let isCancelled = false;

      const getPostMessage = async () => {
        setPostMessage('s'.repeat(Math.min(Math.max(props.postInfo.length - 75, 0), maxMessageLength)));
        const response = await props.postInfo.request;
        switch (response?.status) {
          case 200:
          case 202:
            props.postInfo.message = response.data.toString();
            newStatus = "";
            newPostMessage = props.postInfo.message;
            break;
          case 404:
            newStatus = "Not Found";
            break;
          default:
            newStatus = props.postInfo?.error;
            if(!newStatus) {
              newStatus = "missing data";
            }
        }

        if (isCancelled)
          return;

        setPostMessage(newPostMessage);
        setStatusMessage(newStatus);
      }

      if (props.postInfo.error) {
        setPostMessage("");
        setStatusMessage(props.postInfo.error);
      } else {
        getPostMessage();
      }
      return () => isCancelled = true;
    }
    
  }, [props.postInfo]);

  return (
    <div className="postItem">
      <div className="postLayout">
      <img className="profileImage" src={iconSrc} alt="ProfileImage" />
        <div>
          <div className="postOwnerRow">
            <Link to={`/users/${props.postInfo.owner}`}>{ownerName}</Link>
            <span className="gray"> <span className="handle">{ownerHandle} {isVouched ? "✅" : ""}</span> • </span>
            <time>{getPostTime(props.postInfo.timestamp)}</time>
          </div>
          <div className="postRow">
            {props.postInfo.message || postMessage}
            {statusMessage && <div className="status"> {statusMessage}</div>}
            {imageSrc ? <img src={imageSrc}></img> : null}
          </div>
          <div className="votesRow">
            <button className={"voteButton " + (props.postInfo.upvoteAccountList.includes(connectedWalletAddress) ? "filled" : "")}
                onClick={() => onUpVote(props.postInfo.txid)}>
              👍 {props.postInfo.upvotes}
            </button>
            <button className={"voteButton " + (props.postInfo.downvoteAccountList.includes(connectedWalletAddress) ? "filled" : "")}
                onClick={() => onDownVote(props.postInfo.txid)}>
              👎 {props.postInfo.downvotes}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}