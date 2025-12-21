import { useEffect, useState } from "react";
import { getLoopRegions } from "../../../api/indexedDB";
import LoopCard from "./LoopCard";
import { useWaveContext } from "../WaveContext";

export default function LoopsList() {
  const wave = useWaveContext();
  const videoId = wave.video.id.videoId;
  const displayRegion = wave.displayRegion;

  const [regions, setRegions] = useState([]);

  useEffect(() => {
    async function loadRegions() {
      const loaded = await getLoopRegions(videoId);
      let nameIdx = 1;
      const loadedRegions = loaded.map((region) => {
        let name;
        if (!region.name) {
          name = `Loop ${nameIdx++}`;
        }

        return (
          <LoopCard
            onClick={() => {
              displayRegion();
              //todo close modal
            }}
            key={region.id}
            name={name}
            {...region}
          />
        );
      });
      setRegions(loadedRegions);
    }
    loadRegions();
  }, []);

  return <div>{regions}</div>;
}
