import App from "./components/App";
import YtSearchPage from "./components/yt-search/YtSearchPage";
import EditAudioPage from "./components/edit-audio/EditAudioPage";
import AudiosSearchPage from "./components/audio-search/AudiosSearchPage";

const routes = [
  {
    path: "/",
    element: <YtSearchPage />,
  },
  {
    path: "/search-audios",
    element: <AudiosSearchPage />,
  },
  {
    path: "/audio-editor",
    element: <App />,
  },
];

export default routes;
