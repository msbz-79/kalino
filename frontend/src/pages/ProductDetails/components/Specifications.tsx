import { LuCpu, LuMonitor, LuSmartphone } from "react-icons/lu";

type Specification = {
    label: string;
    value: string;
};

type SpecificationGroup = {
    title: string;
    icon: React.ReactNode;
    items: Specification[];
};

type SpecificationsProps = {
    groups?: SpecificationGroup[];
};

const defaultGroups: SpecificationGroup[] = [
    {
        title: "مشخصات کلی",
        icon: <LuSmartphone />,
        items: [
            { label: "نوع محصول", value: "گوشی موبایل" },
            { label: "برند", value: "برند محصول" },
            { label: "مدل", value: "مدل محصول" },
            { label: "سیستم‌عامل", value: "Android / iOS" },
            { label: "ظرفیت حافظه داخلی", value: "مطابق محصول" },
            { label: "حافظه RAM", value: "مطابق محصول" },
        ],
    },
    {
        title: "صفحه نمایش",
        icon: <LuMonitor />,
        items: [
            { label: "نوع صفحه نمایش", value: "مطابق محصول" },
            { label: "اندازه صفحه نمایش", value: "مطابق محصول" },
            { label: "رزولوشن", value: "مطابق محصول" },
            { label: "نرخ نوسازی", value: "مطابق محصول" },
        ],
    },
    {
        title: "سخت‌افزار و عملکرد",
        icon: <LuCpu />,
        items: [
            { label: "پردازنده", value: "مطابق محصول" },
            { label: "ظرفیت باتری", value: "مطابق محصول" },
            { label: "درگاه ارتباطی", value: "مطابق محصول" },
            { label: "شبکه ارتباطی", value: "مطابق محصول" },
        ],
    },
];

function Specifications({ groups = defaultGroups }: SpecificationsProps) {
    return (
        <section
            id="specifications"
            className="scroll-mt-24 rounded-2xl border border-lightBorderColor bg-lightSurfaceColor p-5 shadow-lightBoxShadow dark:border-borderColor dark:bg-surfaceColor sm:p-7"
        >
            <div className="mb-7">
                <h2 className="text-xl font-DanaMedium">
                    مشخصات فنی
                </h2>
                <div className="mt-3 h-1 w-14 rounded-full bg-primaryColor" />
            </div>

            <div className="space-y-8">
                {groups.map((group) => (
                    <div key={group.title}>
                        <h3 className="mb-4 flex items-center gap-2 font-DanaMedium">
                            <span className="text-primaryColor">
                                {group.icon}
                            </span>
                            {group.title}
                        </h3>

                        <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {group.items.map((item) => (
                                <div
                                    key={item.label}
                                    className="grid grid-cols-2 items-center gap-3 rounded-lg bg-lightBackgroundColor p-4 dark:bg-backgroundColor"
                                >
                                    <dt className="text-sm text-lightTextColorMuted dark:text-textColorMuted">
                                        {item.label}
                                    </dt>
                                    <dd className="text-sm font-DanaMedium">
                                        {item.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Specifications;