import formatTime from "../../../utils/formatTime";

export default function LoopCard({ name, start, end }) {
  return (
    <div className="flex justify-between">
      {name}
      <div>
        <p className="font-mono">{`${formatTime(start)} — ${formatTime(
          end
        )}`}</p>
      </div>
    </div>
  );
}
