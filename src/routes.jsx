import YtSearchPage from "./components/yt-search/YtSearchPage";
import Controller from "./components/edit-audio/Controller";
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
    element: <Controller />,
  },
];

export default routes;
