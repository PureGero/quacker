import Arweave from 'arweave';
import Account from 'arweave-account';
import { WarpFactory } from 'warp-contracts';

export const arweave = Arweave.init({});
export let warp = WarpFactory.forMainnet();
export let contract = warp.contract("wB_Jarz7T6JVoh9vIQnqQHUHokFhKht2QwaEDTkKneg");
export let connectedWalletAddress = null;
export let addressToName = {};
export let addressToPicture = {};

export const setAddressToName = map => {
  addressToName = map;
};

export const setAddressToPicture = map => {
  addressToPicture = map;
};

export const setConnectedWalletAddress = (address) => {
  connectedWalletAddress = address;
};

export const account = new Account({
  cacheIsActivated: true,
  cacheSize: 100,
  cacheTime: 3600000  // 3600000ms => 1 hour cache duration
});

export const maxMessageLength = 1024;

export const isWellFormattedAddress = (input) => {
  const re = /^[a-zA-Z0-9_]{43}$/;
  return re.test(input);
}

export const createPostInfo = (message) => {
  const ownerAddress = message.creator;
  const timestamp = message.timestamp;
  const postInfo = {
    txid: message.id,
    owner: ownerAddress,
    account: account.get(ownerAddress),
    message: message.content,
    length: message.content.length,
    timestamp: timestamp,
    request: null,
    upvotes: message.votes.likes.length,
    downvotes: message.votes.dislikes.length,
    upvoteAccountList: message.votes.likes,
    downvoteAccountList: message.votes.dislikes,
    image: message.image
  }
  if (postInfo.length <= maxMessageLength) {
    postInfo.request = arweave.api.get(`/${message.id}`, { timeout: 10000 })
      .catch(() => { postInfo.error = 'timeout loading data' });
  } else {
    postInfo.error = `message is too large (exceeds ${maxMessageLength/1024}kb)`;
  }
  return postInfo;
}

// in miliseconds
var units = {
  year  : 24 * 60 * 60 * 1000 * 365,
  month : 24 * 60 * 60 * 1000 * 365/12,
  day   : 24 * 60 * 60 * 1000,
  hour  : 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000
}

var rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export const getRelativeTime = (ts1, ts2) => {
  var elapsed = ts1 - ts2
  // "Math.abs" accounts for both "past" & "future" scenarios
  for (var u in units) 
    if (Math.abs(elapsed) > units[u] || u === 'second') 
      return rtf.format(Math.round(elapsed/units[u]), u)
}

export const getPostTime = (timestamp) => {
  if (timestamp < 0) {
    return "pending...";
  }
  return getRelativeTime(timestamp, Date.now());
}

export const abbreviateAddress = (address) => {
  if (!address)
    return address;
  const firstFive = address.substring(0,5);
  const lastFour = address.substring(address.length-4);
  return `${firstFive}..${lastFour }`;
}

export const delay = (t) => {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, t);
  });
}

export const delayResults = (milliseconds, results) => {
  return delay(milliseconds).then(function() {
    return results;
  });
}