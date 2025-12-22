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
      className="flex justify-between"
    >
      {region.name}
      <div>
        <p className="font-mono">{`${formatTime(region.start)} — ${formatTime(
          region.end
        )}`}</p>
      </div>
    </div>
  );
}
