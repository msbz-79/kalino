import { useEffect, useState } from 'react';

interface TimerProps {
    endDate: string; // ISO date string از API، مثلاً "2025-06-20T14:30:00"
}

function getRemainingSeconds(endDate: string) {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((end - now) / 1000);
    return diff > 0 ? diff : 0;
}

function formatTime(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function Timer({ endDate }: TimerProps) {
    const [secondsLeft, setSecondsLeft] = useState(() => getRemainingSeconds(endDate));

    useEffect(() => {
        if (secondsLeft <= 0) return;

        const timerId = setInterval(() => {
            setSecondsLeft(getRemainingSeconds(endDate));
        }, 1000);

        return () => clearInterval(timerId);
    }, [endDate, secondsLeft]);

    return (
        <p className="lg:mb-5">{formatTime(secondsLeft)}</p>
    );
}

export default Timer;