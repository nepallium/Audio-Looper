import decodeHtmlEntities from "../../utils/decodeHtmlEntities";
import { RiDeleteBin7Fill } from "react-icons/ri";
import getCssVar from "../../utils/getCssVar";
import { useNavigate } from "react-router-dom";

export default function AudioItem({ id, name, video, regions, openModal }) {
  const navigate = useNavigate();

  function handleClick(e) {
    navigate("/audio-editor", { state: { videoId: id, video } });
  }

  return (
    <div
      className="flex gap-5 bg-surface-300 p-2 rounded-md"
      onClick={handleClick}
    >
      <img
        src={video.snippet.thumbnails.default.url}
        alt={video.snippet.title}
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <p className="font-semibold text-base-dark text-lg line-clamp-2">
          {name}
        </p>
        <div className="flex justify-between items-center">
          <p className="text-base-light font-[500]">{`${regions.length} ${
            regions.length === 1 ? "loop" : "loops"
          }`}</p>
          <RiDeleteBin7Fill
            size="1.3rem"
            color={getCssVar("--error-color")}
            onClick={() => openModal(true, id)} // true for isSingleDel
          />
        </div>
      </div>
    </div>
  );
}
