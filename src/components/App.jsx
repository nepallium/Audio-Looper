import Waveform from "./Waveform";

export default function App() {
  // const url = "/test_audio.mp3";
  const url = "https://on.soundcloud.com/8SABMWyuxzTDAhpCf3";

  return (
    <>
      <h1 className="text-3xl font-bold underline flex justify-center">
        Hello world!
      </h1>

      <Waveform audioUrl={url} className="w-4 h-10" />
    </>

  )
}