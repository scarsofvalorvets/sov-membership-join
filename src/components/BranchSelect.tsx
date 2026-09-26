import { BRANCHES } from "@/lib/constants";
import { inputCls } from "@/components/ui";

export default function BranchSelect({
  name,
  defaultValue,
  placeholder = "Select branch or agency",
  required,
  id,
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  id?: string;
}) {
  return (
    <select id={id} name={name} defaultValue={defaultValue ?? ""} className={inputCls} required={required}>
      <option value="">{placeholder}</option>
      <optgroup label="Military">
        {BRANCHES.filter((b) => b.group === "military").map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
      </optgroup>
      <optgroup label="First Responder">
        {BRANCHES.filter((b) => b.group === "first_responder").map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
