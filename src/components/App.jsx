import Waveform from "./Waveform";

export default function App() {
    const url = "/test_audio.mp3";
    // const url = "https://on.soundcloud.com/8SABMWyuxzTDAhpCf3";
    // const url = "https://www.youtube.com/watch?v=7GRG7HNDct8"
    // const url = "http://localhost:8000/api/audios/7GRG7HNDct8";

    async function getStream() {
        try {
            const res = await fetch("http://localhost:5000/video/7GRG7HNDct8");

            if (!res.ok) {
                throw new Error("Failed to fetch video");
            }

            return res;
        } catch (err) {
            console.error("Error fetching url", err);
        }
    }

    return (
        <>
            <h1 className="text-3xl font-bold underline flex justify-center">
                Hello world!
            </h1>

            <Waveform audioUrl={url} className="w-4 h-10" />
        </>
    );
}
