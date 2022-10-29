import React from 'react';
import { Routes, Route, Outlet, useParams, useNavigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { WalletSelectButton } from './components/WalletSelectButton';
import { ProfileButton } from './components/ProfileButton';
import { Posts } from './components/Posts';
import { ProgressSpinner } from './components/ProgressSpinner';
import { TopicSearch } from './components/TopicSearch';
import { UserSearch } from './components/UserSearch';
import { NewPost } from './components/NewPost';
import './App.css';
import { contract, createPostInfo } from './lib/api';

async function getPostInfos() {
  if (contract.then) {
    // Flatten promise
    contract = await contract;
  }

  const { cachedValue } = await contract.readState();
  const latestState = cachedValue.state;
  console.log(latestState);
  return latestState.messages.map(message => createPostInfo(message));
}

const App = () => {
  const [postInfos, setPostInfos] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isWalletConnected, setIsWalletConnected] = React.useState(false);

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
    }, 60000);
  
    return () => clearInterval(interval); // On unmount
  }, [])
  
  React.useEffect(loadPostInfos, [])

  return (
    <div id="app">
      <div id="content">
        <aside>
          <Navigation />
          <WalletSelectButton setIsConnected={() => setIsWalletConnected(true)}/>
          <ProfileButton isWalletConnected={isWalletConnected} />
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
            <Route path="/topics" element={<Topics />}>
              <Route path="/topics/" element={<TopicSearch />} />
              <Route path=":topic" element={<TopicResults />} />
            </Route>
            <Route path="/users" element={<Users />}>
              <Route path="/users/" element={<UserSearch />} />
              <Route path=":addr" element={<UserResults />} />
            </Route>
          </Routes>
        </main>
      </div>
    </div>
  );
};

const Home = (props) => {
  return (
    <>
      <header>Home</header>
      <NewPost isLoggedIn={props.isWalletConnected} onPostMessage={props.onPostMessage} />
      {props.isSearching && <ProgressSpinner />}
      <Posts postInfos={props.postInfos} />
    </>
  );
};

const Topics = (props) => {
  return (
    <>
      <header>Topics</header>
      <Outlet />
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

const TopicResults = () => {
  const [topicPostInfos, setTopicPostInfos] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const { topic } = useParams();
  const navigate = useNavigate();

  const onTopicSearch = (topic) => {
    navigate(`/topics/${topic}`);
  }

  React.useEffect(() => {
    setIsSearching(true);
    setTopicPostInfos([]);
    try {
      getPostInfos(null,topic).then(posts => { 
        setTopicPostInfos(posts);
        setIsSearching(false);
      });
    } catch (error) {
      console.logErrorg(error);
      setIsSearching(false);
    }
  }, [topic])
  return (
    <>
    <TopicSearch searchInput={topic} onSearch={onTopicSearch}/>
    {isSearching && <ProgressSpinner />}
    <Posts postInfos={topicPostInfos} />
    </>
  )
}

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