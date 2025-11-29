import AudioItem from "./AudioItem";

export default function AudioList({ audios }) {
  const audio = audios[0];
  audios = [audio, audio, audio, audio, audio, audio, audio];

  const audioItems = audios
    .filter((audio) => {
      return audio.name !== undefined;
    })
    .map((audio) => {
      return <AudioItem key={audio.id} {...audio} />;
    });

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
      {audioItems}
    </div>
  );
}
