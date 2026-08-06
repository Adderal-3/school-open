import { ReloadIcon, TrashIcon, Cross2Icon } from "@radix-ui/react-icons";

export function ToolBar({
  counts,
  onReshuffle,
  onRemove,
  onClear,
}: {
  counts: { reshuffle: number; removeOne: number; clearRow: number };
  onReshuffle: () => void;
  onRemove: () => void;
  onClear: () => void;
}) {
  return (
    <nav className="tools" aria-label="游戏道具">
      <button onClick={onReshuffle} disabled={!counts.reshuffle}>
        <span><ReloadIcon /></span><b>重新发放</b><i>{counts.reshuffle}</i>
      </button>
      <button onClick={onRemove} disabled={!counts.removeOne}>
        <span><TrashIcon /></span><b>移除一个</b><i>{counts.removeOne}</i>
      </button>
      <button onClick={onClear} disabled={!counts.clearRow}>
        <span><Cross2Icon /></span><b>清除一列</b><i>{counts.clearRow}</i>
      </button>
    </nav>
  );
}

