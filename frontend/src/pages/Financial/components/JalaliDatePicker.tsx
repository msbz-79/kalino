import { useMemo } from "react";
import * as DatePickerModule from "react-multi-date-picker";

const DatePicker = DatePickerModule.default.default; import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";

type Props = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    minDate?: string;
    maxDate?: string;
};

function JalaliDatePicker({
    label,
    value,
    onChange,
    minDate,
    maxDate,
}: Props) {
    const parseDate = (date: string) => {
        if (!date) return null;

        return new DateObject({
            date,
            calendar: gregorian,
            locale: gregorian_en,
        }).convert(persian, persian_fa);
    };

    const pickerValue = useMemo(() => parseDate(value), [value]);

    const toGregorianString = (date: DateObject) => {
        return date
            .convert(gregorian, gregorian_en)
            .format("YYYY-MM-DD");
    };

    return (
        <label className="block space-y-2 text-sm">
            <span className="text-lightTextColorMuted dark:text-textColorMuted">
                {label}
            </span>

            <DatePicker
                value={pickerValue}
                onChange={(date) => {
                    if (date) {
                        onChange(toGregorianString(date));
                    }
                }}
                calendar={persian}
                locale={persian_fa}
                calendarPosition="bottom-right"
                format="YYYY/MM/DD"
                minDate={minDate ? parseDate(minDate) : undefined}
                maxDate={maxDate ? parseDate(maxDate) : undefined}
                inputClass="w-full cursor-pointer rounded-xl border border-lightBorderColor bg-lightBackgroundColor px-3 py-2.5 text-lightTextColor outline-none focus:border-primaryColor dark:border-borderColor dark:bg-backgroundColor dark:text-textColor"
                containerClassName="w-full"
                editable={false}
                placeholder="انتخاب تاریخ"
            />
        </label>
    );
}

export default JalaliDatePicker;