import { GoTrash } from "react-icons/go";
import formatTime from "../../../utils/formatTime";
import { useWaveContext } from "../WaveContext";

export default function LoopCard({ region, setIsModalOpen }) {
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
      <GoTrash className="text-error" />
      {region.name}
      <div>
        <p className="font-mono">{`${formatTime(region.start)} — ${formatTime(
          region.end,
        )}`}</p>
      </div>
    </div>
  );
}
