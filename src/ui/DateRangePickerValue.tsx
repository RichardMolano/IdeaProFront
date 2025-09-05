import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateRange } from "@mui/x-date-pickers-pro/models";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";

export type DateRangePickerValueProps = {
  value?: DateRange<Dayjs>;
  onChange?: (value: DateRange<Dayjs>) => void;
  label?: string;
};

export default function DateRangePickerValue({
  value,
  onChange,
  label,
}: DateRangePickerValueProps) {
  const [internalValue, setInternalValue] = React.useState<DateRange<Dayjs>>([
    dayjs("2022-04-17"),
    dayjs("2022-04-21"),
  ]);

  const controlled =
    typeof value !== "undefined" && typeof onChange === "function";

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DemoContainer components={["DateRangePicker"]}>
        <DemoItem
          label={label || "Rango de fechas"}
          component="DateRangePicker"
        >
          <DateRangePicker
            value={controlled ? value : internalValue}
            onChange={controlled ? onChange : setInternalValue}
          />
        </DemoItem>
      </DemoContainer>
    </LocalizationProvider>
  );
}
