import React from 'react';
import { Routes, Route, Outlet, useParams, useNavigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { WalletSelectButton } from './components/WalletSelectButton';
import { ProfileButton } from './components/ProfileButton';
import { NameChange } from './components/NameChange';
import { Posts } from './components/Posts';
import { ProgressSpinner } from './components/ProgressSpinner';
import { UserSearch } from './components/UserSearch';
import { NewPost } from './components/NewPost';
import './App.css';
import { contract, createPostInfo, setAddressToName, setAddressToPicture } from './lib/api';

async function getPostInfos() {
  if (contract.then) {
    // Flatten promise
    contract = await contract;
  }

  const { cachedValue } = await contract.readState();
  const latestState = cachedValue.state;
  console.log(latestState);
  setAddressToName(latestState.addressToName);
  setAddressToPicture(latestState.addressToImage);
  return latestState.messages.map(message => createPostInfo(message)).reverse();
}

const App = () => {
  const [postInfos, setPostInfos] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isWalletConnected, setIsWalletConnected] = React.useState(false);
  const [username, setUsername] = React.useState("");

  const loadPostInfos = () => {
    getPostInfos().then(posts => {
      setPostInfos(posts);
      setIsSearching(false);
    })
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      // Load new posts every minute
      loadPostInfos();
    }, 5000);
  
    return () => clearInterval(interval); // On unmount
  }, [])
  
  React.useEffect(loadPostInfos, [])

  return (
    <div id="app">
      <div id="content">
        <aside>
          <Navigation />
          <WalletSelectButton setIsConnected={() => setIsWalletConnected(true)} setUsername={setUsername} username={username}/>
          {/* <ProfileButton isWalletConnected={isWalletConnected} /> */}
        </aside>
        <main>
          <Routes>
            <Route path="/" name="home" element={
            <Home
              isWalletConnected={isWalletConnected}
              isSearching={isSearching}
              postInfos={postInfos}
              onPostMessage={loadPostInfos} 
            />}
            />
            <Route path="/users" element={<Users />}>
              <Route path="/users/" element={<UserSearch />} />
              <Route path=":addr" element={<UserResults />} />
            </Route>

            <Route path="/profile" element={<Profile
              isWalletConnected={isWalletConnected}
              onPostMessage={loadPostInfos} 
              username={username}
              setUsername={setUsername}
            />} />

          </Routes>
        </main>
      </div>
    </div>
  );
};

const Home = (props) => {
  return (
    <>
      <header>Quacks</header>
      <NewPost isLoggedIn={props.isWalletConnected} onPostMessage={props.onPostMessage} />
      {props.isSearching && <ProgressSpinner />}
      <Posts isLoggedIn={props.isWalletConnected} postInfos={props.postInfos} onVote={props.onPostMessage} />
    </>
  );
};

const Profile = (props) => {
  return (
    <>
      <header>Customise your duck</header>
      <NameChange isLoggedIn={props.isWalletConnected} onPostMessage={props.onPostMessage} username={props.username} setUsername={props.setUsername} />
    </>
  );
};

const Users = () => {
  return (
    <>
      <header>Users</header>
      <Outlet />
    </>
  );
};

function UserResults() {
  const [userPostInfos, setUserPostInfos] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const { addr } = useParams();
  const navigate = useNavigate();

  const onUserSearch = (address) => {
    navigate(`/users/${address}`);
  }

  React.useEffect(() => {
    setIsSearching(true);
    try {
      getPostInfos(addr).then(posts => { 
        setUserPostInfos(posts); 
        setIsSearching(false);
      });
    } catch (error) {
      console.logErrorg(error);
      setIsSearching(false);
    }
  }, [addr])
  return (
    <>
    <UserSearch searchInput={addr} onSearch={onUserSearch}/>
    {isSearching && <ProgressSpinner />}
    <Posts postInfos={userPostInfos} />
    </>
  );
};

export default App;