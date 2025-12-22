import AudioItem from "./AudioItem";

export default function AudioList({ audios, openModal }) {
  console.log(audios);
  const audioItems = audios
    .filter((audio) => {
      return audio.name !== undefined;
    })
    .map((audio) => {
      return <AudioItem key={audio.id} {...audio} openModal={openModal} />;
    });

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
      {audioItems}
    </div>
  );
}
