import { useEffect, useState } from "react";
import { getLoopRegions } from "../../../api/indexedDB";
import LoopCard from "./LoopCard";
import { useWaveContext } from "../WaveContext";

export default function LoopsList({ setIsModalOpen }) {
  const wave = useWaveContext();
  const videoId = wave.video.id.videoId;

  const [regions, setRegions] = useState([]);

  useEffect(() => {
    async function loadRegions() {
      const loaded = await getLoopRegions(videoId);
      let nameIdx = 1;
      let loadedRegions = loaded.map((region) => {
        let name;
        if (!region.name) {
          name = `Loop ${nameIdx++}`;
          region.name = name;
        }

        return (
          <LoopCard
            key={region.id}
            setIsModalOpen={setIsModalOpen}
            region={region}
          />
        );
      });
      setRegions(loadedRegions);
    }
    loadRegions();
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto bg-surface-100 rounded-lg p-3">
      {regions.length === 0 ? "Saved loop regions will appear here" : regions}
    </div>
  );
}
