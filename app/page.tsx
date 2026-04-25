import { HeroSection }        from "@/components/landing/hero-section";
import { EventStrip }         from "@/components/landing/event-strip";
import { LiveEventsSection }  from "@/components/landing/live-events";
import { BattleSection }      from "@/components/landing/roast-battles";
import { ParticipateSection } from "@/components/landing/participate-section";
import { ServicesSection }    from "@/components/landing/services-section";
import { AboutSection }       from "@/components/landing/about-section";

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col bg-black">
            <main className="flex-1">
                <HeroSection />
                <EventStrip />
                <LiveEventsSection />
                <BattleSection />
                <ParticipateSection />
                <ServicesSection />
                <AboutSection />
            </main>
        </div>
    );
}
