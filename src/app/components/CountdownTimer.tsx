"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date("2026-04-12T00:00:00").getTime();

    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = targetDate - now;

      console.log('Timer update:', { 
        now: new Date(now).toISOString(), 
        target: new Date(targetDate).toISOString(),
        difference,
        days: Math.floor(difference / (1000 * 60 * 60 * 24))
      });

      if (difference > 0) {
        const newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        };
        
        console.log('Setting time:', newTimeLeft);
        setTimeLeft(newTimeLeft);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Calculate immediately on mount
    calculateTimeLeft();
    
    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="countdown-timer-container" data-aos="fade-up" data-aos-duration="1000">
      <div className="countdown-timer-wrapper">
        <div className="countdown-box" data-aos="zoom-in" data-aos-delay="100">
          <div className="countdown-number">{String(timeLeft.days).padStart(2, '0')}</div>
          <div className="countdown-label">Days</div>
        </div>

        <div className="countdown-box" data-aos="zoom-in" data-aos-delay="200">
          <div className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="countdown-label">Hours</div>
        </div>

        <div className="countdown-box" data-aos="zoom-in" data-aos-delay="300">
          <div className="countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="countdown-label">Minutes</div>
        </div>

        <div className="countdown-box" data-aos="zoom-in" data-aos-delay="400">
          <div className="countdown-number">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="countdown-label">Seconds</div>
        </div>
      </div>
    </div>
  );
}