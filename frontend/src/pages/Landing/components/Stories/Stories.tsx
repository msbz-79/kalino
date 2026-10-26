import { useEffect, useRef, useState } from "react"
import type { PointerEvent } from "react"
import { MdChevronLeft, MdChevronRight, MdClose } from "react-icons/md"

const TOTAL_STORIES = 10
const STORY_DURATION = 3000
const ITEM_WIDTH = 136
const DRAG_THRESHOLD = 8

function Stories() {
    const [activeStory, setActiveStory] = useState<number | null>(null)
    const [viewedStories, setViewedStories] = useState<Set<number>>(new Set())

    const containerRef = useRef<HTMLDivElement>(null)
    const isDraggingRef = useRef(false)
    const hasMovedRef = useRef(false)
    const startXRef = useRef(0)
    const startScrollLeftRef = useRef(0)

    const storyNumbers = Array.from({ length: TOTAL_STORIES }, (_, i) => i + 1)

    const previousStory = () => {
        if (activeStory === null) return
        setActiveStory(activeStory === 1 ? TOTAL_STORIES : activeStory - 1)
    }

    const nextStory = () => {
        if (activeStory === null) return
        setActiveStory(activeStory === TOTAL_STORIES ? null : activeStory + 1)
    }

    // Mark the open story as viewed
    useEffect(() => {
        if (activeStory === null) return
        setViewedStories((prev) => {
            if (prev.has(activeStory)) return prev
            const next = new Set(prev)
            next.add(activeStory)
            return next
        })
    }, [activeStory])

    // Auto-advance every STORY_DURATION ms while a story is open
    useEffect(() => {
        if (activeStory === null) return
        const timer = window.setTimeout(nextStory, STORY_DURATION)
        return () => window.clearTimeout(timer)
    }, [activeStory])

    // Scroll the strip to its end on mount / resize
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const scrollToEnd = () => {
            container.scrollLeft = container.scrollWidth - container.clientWidth
        }

        requestAnimationFrame(scrollToEnd)
        window.addEventListener("resize", scrollToEnd)
        return () => window.removeEventListener("resize", scrollToEnd)
    }, [])

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "mouse" && event.button !== 0) return

        isDraggingRef.current = true
        hasMovedRef.current = false
        startXRef.current = event.clientX
        startScrollLeftRef.current = containerRef.current?.scrollLeft ?? 0
    }

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return
        const container = containerRef.current
        if (!container) return

        const distance = event.clientX - startXRef.current

        // Only capture the pointer once we know this is a real drag —
        // capturing on every pointerdown was retargeting the click event
        // to the container, so buttons never received it.
        if (!hasMovedRef.current && Math.abs(distance) > DRAG_THRESHOLD) {
            hasMovedRef.current = true
            container.setPointerCapture(event.pointerId)
        }

        if (hasMovedRef.current) {
            event.preventDefault()
            container.scrollLeft = startScrollLeftRef.current - distance
        }
    }

    const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
        const container = containerRef.current
        isDraggingRef.current = false

        if (container?.hasPointerCapture(event.pointerId)) {
            container.releasePointerCapture(event.pointerId)
        }

        if (hasMovedRef.current && container) {
            const target = Math.round(container.scrollLeft / ITEM_WIDTH) * ITEM_WIDTH
            container.scrollTo({ left: target, behavior: "smooth" })
        }

        setTimeout(() => {
            hasMovedRef.current = false
        }, 150)
    }

    const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
        const container = containerRef.current
        if (container?.hasPointerCapture(event.pointerId)) {
            container.releasePointerCapture(event.pointerId)
        }
        isDraggingRef.current = false
        hasMovedRef.current = false
    }

    const handleStoryClick = (storyNumber: number) => {
        if (hasMovedRef.current) return
        setActiveStory(storyNumber)
    }

    return (
        <>
            {/* Stories strip */}
            <section className="w-full overflow-hidden mt-10">
                <div
                    ref={containerRef}
                    dir="ltr"
                    className="w-full max-w-full overflow-x-scroll overflow-y-hidden select-none overscroll-x-contain scrollbar-none [&::-webkit-scrollbar]:hidden"
                    style={{ touchAction: "none", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                >
                    <div className="flex w-max min-w-max flex-row-reverse gap-4 pb-2">
                        {storyNumbers.map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => handleStoryClick(n)}
                                className="flex w-30 min-w-30 shrink-0 cursor-pointer flex-col items-center gap-2"
                            >
                                <div
                                    className={`size-20 rounded-full border-2 p-0.5 ${
                                        viewedStories.has(n)
                                            ? "border-lightBorderColor dark:border-borderColor"
                                            : "border-red-500"
                                    }`}
                                >
                                    <img
                                        src={`/images/stories/story${n}.png`}
                                        alt={`استوری ${n}`}
                                        className="size-full rounded-full object-cover"
                                        draggable={false}
                                    />
                                </div>

                                <span className="w-full truncate text-center text-xs text-lightTextColor dark:text-textColor">
                                    استوری {n}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Story viewer */}
            {activeStory !== null && (
                <div
                    className="fixed inset-0 z-999 flex items-center justify-center overflow-hidden bg-black/55 px-4 py-6 backdrop-blur-xl"
                    onClick={() => setActiveStory(null)}
                >
                    <div
                        className="relative h-[min(88dvh,850px)] w-[min(90vw,480px)] overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div dir="rtl" className="absolute left-3 right-3 top-3 z-40 flex gap-1">
                            {storyNumbers.map((n) => (
                                <div key={n} className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                                    {activeStory > n && (
                                        <div className="absolute inset-y-0 right-0 w-full rounded-full bg-white" />
                                    )}
                                    {activeStory === n && (
                                        <div
                                            key={`progress-${activeStory}`}
                                            className="absolute inset-y-0 right-0 rounded-full bg-white"
                                            style={{ width: "0%", animation: `storyProgress ${STORY_DURATION}ms linear forwards` }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            aria-label="بستن"
                            onClick={() => setActiveStory(null)}
                            className="absolute right-3 top-8 z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-black/60 active:scale-95"
                        >
                            <MdClose className="size-6" />
                        </button>

                        <img
                            src={`/images/stories/story${activeStory}.png`}
                            alt={`استوری ${activeStory}`}
                            className="h-full w-full select-none object-cover"
                            draggable={false}
                        />

                        <button
                            type="button"
                            aria-label="استوری قبلی"
                            onClick={previousStory}
                            className="absolute right-3 top-1/2 z-40 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-black/60 active:scale-95"
                        >
                            <MdChevronRight className="size-7" />
                        </button>

                        <button
                            type="button"
                            aria-label="استوری بعدی"
                            onClick={nextStory}
                            className="absolute left-3 top-1/2 z-40 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-black/60 active:scale-95"
                        >
                            <MdChevronLeft className="size-7" />
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes storyProgress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>
        </>
    )
}

export default Stories
