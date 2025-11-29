import decodeHtmlEntities from "../../utils/decodeHtmlEntities";

export default function AudioItem({ name, video, regions }) {
  return (
    <div className="flex gap-5 bg-surface-300 p-2 rounded-md">
      <img
        src={video.snippet.thumbnails.default.url}
        alt={video.snippet.title}
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <p className="text-base-dark text-lg line-clamp-2">
          asd osidufhoa ashdof iufhao hfo shd uha duhfsd fas asd ds asd asd sdsd
          s sdas
        </p>
        <p className="text-base-light">{`${regions.length} loops`}</p>
      </div>
    </div>
  );
}
