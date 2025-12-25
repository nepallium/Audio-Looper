import YtSearchPage from "./components/yt-search/YtSearchPage";
import Controller from "./components/edit-audio/Controller";
import AudiosSearchPage from "./components/audio-search/AudiosSearchPage";
import AppLayout from "./components/AppLayout";

const routes = [
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <AudiosSearchPage /> },
      { path: "/yt-search", element: <YtSearchPage /> },
      { path: "/audio-editor", element: <Controller /> },
    ],
  },
];

export default routes;
