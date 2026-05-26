import { GoTrash } from "react-icons/go";
import formatTime from "../../../utils/formatTime";
import { useWaveContext } from "../contexts/WaveContext";

export default function LoopCard({ region, setIsModalOpen, setRegions }) {
  const waveContext = useWaveContext();

  return (
    <div
      onClick={() => {
        waveContext.displayRegion(region);
        setIsModalOpen(false);
      }}
      className="flex justify-between items-center
      py-3 border-b border-gray-300 first:pt-0 last:border-b-0 last:pb-0"
    >
      <GoTrash
        className="text-error"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setRegions((prev) =>
            prev.filter((r) => {
              console.log(r, region);
              return r.key !== region.id;
            }),
          );
          waveContext.deleteOneRegion(region);
        }}
      />
      {region.name}
      <div>
        <p className="font-mono">{`${formatTime(region.start)} — ${formatTime(
          region.end,
        )}`}</p>
      </div>
    </div>
  );
}
