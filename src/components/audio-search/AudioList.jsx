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
    <div className="flex flex-col gap-6 flex-1 bg-surface-200 rounded-lg p-2 overflow-y-auto ">
      {audioItems}
    </div>
  );
}
