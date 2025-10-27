import App from "./components/App";
import YtSearchPage from "./components/yt-search/YtSearchPage";
import EditAudioPage from "./components/edit-audio/EditAudioPage";

const routes = [
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "/",
                element: <YtSearchPage />,
            },
            {
                path: "/audio-editor",
                element: <EditAudioPage />,
            },
        ],
    },
];

export default routes;
